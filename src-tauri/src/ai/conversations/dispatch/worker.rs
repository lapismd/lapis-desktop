use super::super::{capture_facts::AuthoredTurn, invalid, unknown};
use super::{
    Hook, journal,
    model::{Binding, Phase, Wire},
};
use crate::ai::backend::BackendCall;
use jj_store_conversations::native_privacy::TranscriptSanitizer;
use jj_store_model::RequestId;
use serde_json::Value;
use std::{io, sync::Arc};

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(deny_unknown_fields)]
struct PromptText {
    text: String,
    context: Option<String>,
}

impl Hook {
    /// Runs inside WorkerProcessor, never in the synchronous launch hook.
    pub async fn bind(&self, call: Arc<BackendCall>, binding: Binding) -> io::Result<()> {
        let _guard = call.preparation_guard().await?;
        let (dir, mut record, index) = self.load(&call)?;
        if record.stop_requested
            || journal::active(&dir)? != Some(self.parent)
            || record.recipients[index].target != Some(binding.target)
        {
            return Err(invalid());
        }
        let recipient = &mut record.recipients[index];
        if let Some(prior) = &recipient.binding {
            if prior != &binding {
                return Err(invalid());
            }
            return Ok(());
        }
        if recipient.phase != Phase::Reserved {
            return Err(invalid());
        }
        recipient.binding = Some(binding);
        recipient.phase = Phase::Bound;
        record.validate(&call, self.parent, self.identity.thread_id)?;
        journal::save(&dir, &record, false).map_err(|_| unknown())?;
        call.check().map_err(|_| unknown())
    }
    pub async fn authorize_prompt(
        &self,
        call: Arc<BackendCall>,
        binding: &Binding,
        request: RequestId,
        human: bool,
    ) -> io::Result<()> {
        let _guard = call.preparation_guard().await?;
        let (dir, record, index) = self.load(&call)?;
        if record.stop_requested
            || request != self.parent
            || record.authored.is_some() != human
            || journal::active(&dir)? != Some(self.parent)
            || record.recipients[index].binding.as_ref() != Some(binding)
            || record.recipients[index].phase != Phase::Bound
        {
            return Err(invalid());
        }
        call.check()
    }
    pub async fn prepare_prompt(
        &self,
        call: Arc<BackendCall>,
        binding: &Binding,
        request: RequestId,
        prompt: (&str, Option<&str>, u64),
        authored: Option<&AuthoredTurn>,
        privacy: Arc<TranscriptSanitizer>,
    ) -> io::Result<()> {
        let _guard = call.preparation_guard().await?;
        let (dir, mut record, index) = self.load(&call)?;
        if record.stop_requested
            || request != self.parent
            || record.authored.as_ref() != authored
            || record.authored.is_some() != !prompt.0.trim().is_empty()
            || journal::active(&dir)? != Some(self.parent)
            || record.recipients[index].binding.as_ref() != Some(binding)
            || record.recipients[index].phase != Phase::Bound
        {
            return Err(invalid());
        }
        if prompt.0.len() > 256 * 1024
            || prompt.0.contains('\0')
            || prompt.2 == 0
            || prompt.2 > 86_400_000
            || prompt
                .1
                .is_some_and(|v| v.len() > 512 * 1024 || v.contains('\0'))
            || prompt.0.trim().is_empty() && prompt.1.is_none_or(|v| v.trim().is_empty())
        {
            return Err(invalid());
        }
        let content = PromptText {
            text: prompt.0.into(),
            context: prompt.1.map(str::to_owned),
        };
        let safe = privacy
            .sanitize(serde_json::to_value(&content).map_err(|_| invalid())?)
            .ok_or_else(invalid)?;
        let safe: PromptText = serde_json::from_slice(safe.bytes()).map_err(|_| invalid())?;
        record.recipients[index].wire = Some(Wire {
            digest: journal::digest(&prompt)?,
            text: safe.text,
            context: safe.context,
            max_duration_ms: prompt.2,
        });
        record.recipients[index].phase = Phase::Prepared;
        record.validate(&call, self.parent, self.identity.thread_id)?;
        journal::save(&dir, &record, false).map_err(|_| unknown())?;
        call.check().map_err(|_| unknown())
    }
    /// Called only after native capture confirmed the original batch publication.
    pub async fn observe(
        &self,
        call: Arc<BackendCall>,
        binding: &Binding,
        frame: &Value,
    ) -> io::Result<()> {
        let request = uuid::Uuid::from_bytes(*self.parent.as_bytes()).to_string();
        if frame["requestId"].as_str() != Some(request.as_str())
            || !matches!(frame["type"].as_str(), Some("record" | "error"))
        {
            return Ok(());
        }
        let phase = match frame["record"]["status"].as_str() {
            Some("completed") if frame["type"] == "record" => Phase::Completed,
            Some("invalid") if frame["type"] == "record" => Phase::Rejected,
            _ => Phase::Unknown,
        };
        let _guard = call.preparation_guard().await?;
        let (dir, mut record, index) = self.load(&call)?;
        let digest = journal::digest(frame)?;
        let recipient = &mut record.recipients[index];
        if recipient.binding.as_ref() != Some(binding) {
            return Err(invalid());
        }
        if let Some(prior) = recipient.terminal {
            return if prior == digest && recipient.phase == phase {
                Ok(())
            } else {
                Err(invalid())
            };
        }
        if recipient.phase != Phase::Prepared {
            return Err(invalid());
        }
        recipient.phase = phase;
        recipient.terminal = Some(digest);
        record.validate(&call, self.parent, self.identity.thread_id)?;
        journal::save(&dir, &record, false).map_err(|_| unknown())?;
        call.check().map_err(|_| unknown())
    }
}
