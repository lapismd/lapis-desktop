use super::{NativeBackends, denied};
use crate::host::state::NativeHost;
use serde::Deserialize;
use std::{io, sync::Arc};
use tauri_plugin_lapis_ai::HostContext;
use uuid::Uuid;

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub(super) enum Client {
    Codex,
}

impl NativeBackends {
    /// Claim only an existing, exact native preparation. This never creates a
    /// conversation or turns a capture-only target into an executable grant.
    pub(in crate::host::ai) fn claim_managed_launch(
        self: &Arc<Self>,
        host: &NativeHost,
        context: &HostContext,
        target: Uuid,
    ) -> io::Result<()> {
        let lease = self.current(host, &context.window)?;
        let (handle, conversation) = {
            let owners = self.owners.lock().map_err(|_| denied())?;
            let owner = owners
                .get(&context.window)
                .filter(|owner| {
                    owner.generation == lease.generation()
                        && owner.session == lease.session()
                        && !owner.rebindable
                })
                .ok_or_else(denied)?;
            let plan = owner
                .captures
                .values()
                .find(|plan| {
                    plan.prepared.target_id == target
                        && plan.context.window == context.window
                        && plan.context.url == context.url
                        && plan.client == Some(Client::Codex)
                        && !plan.claimed
                })
                .ok_or_else(denied)?;
            (owner.opened.handle, plan.conversation.clone())
        };
        let call = self.conversation_call(host, context, lease.session(), handle)?;
        conversation.check(&call)?;
        {
            let mut owners = self.owners.lock().map_err(|_| denied())?;
            let plan = owners
                .get_mut(&context.window)
                .filter(|owner| owner.opened.handle == handle && !owner.rebindable)
                .and_then(|owner| {
                    owner.captures.values_mut().find(|plan| {
                        plan.prepared.target_id == target
                            && Arc::ptr_eq(&plan.conversation, &conversation)
                            && plan.client == Some(Client::Codex)
                            && !plan.claimed
                    })
                })
                .ok_or_else(denied)?;
            plan.claimed = true;
        }
        // A lost reply or late invalidation does not make the claim reusable.
        call.check()
    }
}
