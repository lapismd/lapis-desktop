use super::{
    NativeBackends, denied,
    frames::{Operation, Reply},
};
use crate::host::state::NativeHost;
use jj_collab::ThreadId;
use jj_store_model::RequestId;
use lapis_desktop::ai::conversations::dispatch::{self as native, Owner};
use sha2::{Digest, Sha256};
use std::{collections::BTreeSet, io, sync::Arc};
use tauri_plugin_lapis_ai::{AcpHost, HostContext};
use uuid::Uuid;

impl NativeBackends {
    pub(super) fn dispatch_owner(&self, context: &HostContext, handle: Uuid) -> io::Result<Owner> {
        let owners = self.owners.lock().map_err(|_| denied())?;
        let owner = owners
            .get(&context.window)
            .filter(|o| o.opened.handle == handle && !o.rebindable)
            .ok_or_else(denied)?;
        Ok(Owner {
            window: context.window.clone(),
            generation: owner.generation.clone(),
            handle,
            origin: Sha256::new_with_prefix(b"lapis-canonical-dispatch-origin-v1\0")
                .chain_update(context.url.as_bytes())
                .finalize()
                .into(),
        })
    }
    pub(super) fn dispatch_command(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        session: &str,
        operation: Operation,
    ) -> io::Result<Reply> {
        match operation {
            Operation::BeginCanonicalDispatch { handle, input } => {
                let call = Arc::new(self.conversation_call(host, context, session, handle)?);
                input.validate()?;
                self.dispatch_namespace(context, handle, &input)?;
                let privacy = self
                    .privacy
                    .get()
                    .ok_or_else(denied)?
                    .for_workspace(&call.workspace_root()?, &[])?;
                Ok(Reply::CanonicalDispatch(Some(
                    tauri::async_runtime::block_on(native::begin(
                        call,
                        self.dispatch_owner(context, handle)?,
                        input,
                        privacy.sanitizer.clone(),
                    ))?,
                )))
            }
            Operation::CanonicalDispatchStatus {
                handle,
                request_id,
                thread_id,
            } => {
                let call = Arc::new(self.conversation_call(host, context, session, handle)?);
                Ok(Reply::CanonicalDispatch(tauri::async_runtime::block_on(
                    native::status(call, request_id, thread_id),
                )?))
            }
            Operation::FenceCanonicalDispatch {
                handle,
                request_id,
                thread_id,
            } => {
                let call = Arc::new(self.conversation_call(host, context, session, handle)?);
                let view = tauri::async_runtime::block_on(native::request_stop(
                    call, request_id, thread_id,
                ))?;
                self.fence_dispatch_plans(context, &view)?;
                Ok(Reply::CanonicalDispatch(Some(view)))
            }
            _ => Err(denied()),
        }
    }
    fn dispatch_namespace(
        &self,
        context: &HostContext,
        handle: Uuid,
        input: &native::Input,
    ) -> io::Result<()> {
        let owners = self.owners.lock().map_err(|_| denied())?;
        let owner = owners
            .get(&context.window)
            .filter(|o| o.opened.handle == handle)
            .ok_or_else(denied)?;
        for request in
            std::iter::once(input.request_id).chain(input.recipients.iter().map(|r| r.request_id))
        {
            if owner.captures.contains_key(&request)
                || owner.canonical_captures.get(&request).is_some_and(|plan| {
                    plan.dispatch.as_ref().map(|hook| hook.parent_request())
                        != Some(input.request_id)
                        || plan.prepared.conversation.thread_id != input.thread_id
                })
            {
                return Err(denied());
            }
        }
        Ok(())
    }
    fn fence_dispatch_plans(&self, context: &HostContext, view: &native::View) -> io::Result<()> {
        let targets: BTreeSet<_> = view.recipients.iter().filter_map(|r| r.target_id).collect();
        if let Some(entry) = self
            .owners
            .lock()
            .map_err(|_| denied())?
            .get_mut(&context.window)
        {
            for plan in entry
                .canonical_captures
                .values_mut()
                .filter(|p| targets.contains(&p.prepared.target_id))
            {
                plan.claimed = true;
            }
        }
        Ok(())
    }
}

/// Detached native ownership retains the transition after a waiting IPC caller leaves.
pub(super) struct StopRequest {
    pub handle: Uuid,
    pub request: RequestId,
    pub thread: ThreadId,
}
pub(super) async fn stop(
    backends: Arc<NativeBackends>,
    host: NativeHost,
    workers: Arc<AcpHost>,
    context: HostContext,
    session: String,
    input: StopRequest,
    transition: tokio::sync::OwnedMutexGuard<()>,
) -> io::Result<String> {
    let StopRequest {
        handle,
        request,
        thread,
    } = input;
    tauri::async_runtime::spawn(async move {
        let _transition = transition;
        let owner = backends.clone();
        let retained_host = host.clone();
        let retained_context = context.clone();
        let retained_session = session.clone();
        let view = tauri::async_runtime::spawn_blocking(move || {
            let call = Arc::new(owner.conversation_call(
                &retained_host,
                &retained_context,
                &retained_session,
                handle,
            )?);
            let view = tauri::async_runtime::block_on(native::request_stop(call, request, thread))?;
            owner.fence_dispatch_plans(&retained_context, &view)?;
            Ok::<_, io::Error>(view)
        })
        .await
        .map_err(|_| denied())??;
        let targets: BTreeSet<_> = view
            .recipients
            .iter()
            .filter_map(|r| r.target_id.map(|v| v.to_string()))
            .collect();
        let mut active: BTreeSet<String> = backends
            .processing_for_targets(&context, &targets)?
            .into_iter()
            .collect();
        for worker in workers.list(&context).map_err(|_| denied())? {
            if targets.contains(&worker.target_id) {
                active.insert(worker.session_id);
            }
        }
        for worker in active {
            workers
                .close(&context, &worker)
                .await
                .map_err(|_| io::Error::other("Native dispatch stop outcome unknown"))?;
        }
        if !backends
            .processing_for_targets(&context, &targets)?
            .is_empty()
        {
            return Err(io::Error::other("Native dispatch still owns capture work"));
        }
        tauri::async_runtime::spawn_blocking(move || {
            let call = Arc::new(backends.conversation_call(&host, &context, &session, handle)?);
            let view = tauri::async_runtime::block_on(native::stopped(call, request, thread))?;
            if let Some(entry) = backends
                .owners
                .lock()
                .map_err(|_| denied())?
                .get_mut(&context.window)
            {
                entry
                    .canonical_captures
                    .retain(|_, plan| !targets.contains(&plan.prepared.target_id.to_string()));
            }
            Reply::CanonicalDispatch(Some(view)).encode()
        })
        .await
        .map_err(|_| denied())?
    })
    .await
    .map_err(|_| io::Error::other("Native dispatch stop outcome unknown"))?
}
