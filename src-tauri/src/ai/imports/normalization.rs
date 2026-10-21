use super::{CapturedEntry, invalid, projection};
use jj_agent::{
    NormalizationBatchV1, NormalizerProfileV1, SanitizedObservationBatchV1, ToolResultObservation,
    normalize_batch_candidates,
};
use std::{collections::HashMap, io};
pub(super) struct Normalization {
    profile: NormalizerProfileV1,
    batch: NormalizationBatchV1,
    results: Vec<ToolResultObservation>,
    times: HashMap<u64, String>,
    bytes: usize,
    pub omitted: bool,
}
impl Normalization {
    pub fn new(profile: NormalizerProfileV1) -> Self {
        Self {
            batch: NormalizationBatchV1 {
                schema_version: 1,
                profile: profile.clone(),
                aliases: vec![],
                records: vec![],
                diagnostics: vec![],
            },
            profile,
            results: vec![],
            times: HashMap::new(),
            bytes: 0,
            omitted: false,
        }
    }
    pub fn add(&mut self, sanitized: SanitizedObservationBatchV1) -> io::Result<()> {
        for observation in &sanitized.observations {
            self.bytes = self
                .bytes
                .checked_add(observation.payload.bytes().len())
                .ok_or_else(invalid)?;
            if self.bytes > 4 * 1024 * 1024 {
                return Err(invalid());
            }
            let value: serde_json::Value =
                serde_json::from_slice(observation.payload.bytes()).map_err(|_| invalid())?;
            if let Some(time) = value["record"]["timestamp"]
                .as_str()
                .and_then(|t| chrono::DateTime::parse_from_rfc3339(t).ok())
            {
                self.times.insert(
                    observation.source_sequence,
                    time.to_utc()
                        .to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
                );
            }
        }
        let next = normalize_batch_candidates(&self.profile, &sanitized).map_err(|_| invalid())?;
        self.omitted |= !next.activity.diagnostics.is_empty();
        self.batch.aliases.extend(next.activity.aliases);
        self.batch.records.extend(next.activity.records);
        self.results.extend(next.tool_results);
        if self.times.len() > 16384
            || self.batch.records.len() > 8192
            || self.batch.aliases.len() > 32768
            || self.results.len() > 4096
        {
            return Err(invalid());
        }
        Ok(())
    }
    pub fn entries(&self, complete: bool) -> io::Result<Vec<CapturedEntry>> {
        if !complete && self.batch.records.is_empty() {
            return Ok(vec![]);
        }
        let mut batch = self.batch.clone();
        for result in &self.results {
            let known = result.same_batch_call(&batch).cloned();
            batch
                .resolve_tool_result(result, known.as_ref())
                .map_err(|_| invalid())?;
        }
        batch.sort_source_records();
        projection::project(
            &batch,
            &self.times,
            self.omitted || !batch.diagnostics.is_empty(),
        )
    }
    pub fn created_at(&self) -> String {
        self.times
            .values()
            .min()
            .cloned()
            .unwrap_or_else(|| projection::FALLBACK_TIME.into())
    }
}
