use super::{NativeBackends, busy, denied};
use crate::host::state::NativeHost;
use lapis_desktop::ai::backend::BackendCall;
use std::{
    io,
    sync::{Arc, Weak},
};
use tauri_plugin_lapis_ai::{HostContext, SessionBinding};

pub(super) struct Authority {
    context: HostContext,
    binding: SessionBinding,
    call: Arc<BackendCall>,
}
pub struct CapturePermit {
    owner: Weak<NativeBackends>,
    authority: Arc<Authority>,
}
impl Authority {
    fn matches(&self, context: &HostContext, binding: &SessionBinding) -> bool {
        self.context.window == context.window
            && self.context.url == context.url
            && self.binding.session_id == binding.session_id
            && self.binding.request_id == binding.request_id
            && self.binding.target_id == binding.target_id
            && self.binding.admission == binding.admission
    }
}
impl NativeBackends {
    /// Called only by native processor construction under current admission.
    pub fn register_processing(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> io::Result<CapturePermit> {
        super::super::policy::local(context).map_err(|_| denied())?;
        if [
            &binding.session_id,
            &binding.request_id,
            &binding.target_id,
            &binding.admission,
        ]
        .iter()
        .any(|value| value.is_empty() || value.len() > 256 || value.chars().any(char::is_control))
        {
            return Err(denied());
        }
        let lease = self.current(host, &context.window)?;
        if lease.generation() != binding.admission {
            return Err(denied());
        }
        let (handle, scope) = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get(&context.window)
                .filter(|owner| {
                    owner.generation == binding.admission
                        && !owner.rebindable
                        && owner.session == lease.session()
                        && owner.opened.selection.revision > 0
                })
                .ok_or_else(denied)?;
            (owner.opened.handle, owner.scope.clone())
        };
        let call = scope.begin()?;
        {
            let owners = self.owners.lock().map_err(|_| denied())?;
            if !owners.get(&context.window).is_some_and(|owner| {
                owner.opened.handle == handle && Arc::ptr_eq(&owner.scope, &scope)
            }) {
                return Err(denied());
            }
        }
        let authority = Arc::new(Authority {
            context: context.clone(),
            binding: binding.clone(),
            call: Arc::new(call),
        });
        {
            let mut captures = self.processing.lock().map_err(|_| denied())?;
            captures.retain(|_, value| value.strong_count() > 0);
            if captures.len() >= 64 || captures.contains_key(&binding.session_id) {
                return Err(busy());
            }
            captures.insert(binding.session_id.clone(), Arc::downgrade(&authority));
        }
        let permit = CapturePermit {
            owner: Arc::downgrade(self),
            authority,
        };
        let current = self.current(host, &context.window)?;
        if current.generation() != binding.admission || current.session() != lease.session() {
            return Err(denied());
        }
        permit.check()?;
        Ok(permit)
    }
    pub fn authorize_processing(
        &self,
        context: &HostContext,
        binding: &SessionBinding,
    ) -> io::Result<String> {
        self.ensure_live()?;
        let authority = self
            .processing
            .lock()
            .map_err(|_| denied())?
            .get(&binding.session_id)
            .and_then(Weak::upgrade)
            .ok_or_else(denied)?;
        if !authority.matches(context, binding) {
            return Err(denied());
        }
        authority.call.check()?;
        self.ensure_live()?;
        Ok(authority.binding.admission.clone())
    }
}
impl CapturePermit {
    pub(super) fn call(&self) -> Arc<BackendCall> {
        self.authority.call.clone()
    }
    pub fn check(&self) -> io::Result<()> {
        let owner = self.owner.upgrade().ok_or_else(denied)?;
        owner
            .authorize_processing(&self.authority.context, &self.authority.binding)
            .map(|_| ())
    }
}
impl Drop for CapturePermit {
    fn drop(&mut self) {
        if let Some(owner) = self.owner.upgrade()
            && let Ok(mut captures) = owner.processing.lock()
            && captures
                .get(&self.authority.binding.session_id)
                .is_some_and(|value| Weak::ptr_eq(value, &Arc::downgrade(&self.authority)))
        {
            captures.remove(&self.authority.binding.session_id);
        }
    }
}
