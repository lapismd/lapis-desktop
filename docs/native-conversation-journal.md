# Native conversation capture journal

`ai::journal::ProfileJournal` is Notes' native implementation of the shared
`jj_store_conversations::store_capture::Journal` port. It stores private
recovery records outside the vault checkout. AgentStore and ThreadStore remain
the authoritative conversation stores; a journal confirmation cannot replace an
original provider receipt or authorize a prompt.

The native host supplies an admitted profile `cap_std::fs::Dir`, exact
`ContextV1`, the selected stores' `PublicationScope` and a current-admission
callback. Construction verifies the repository binding and acquires an exclusive
OS lease for that source and backend. It creates only private profile state; it
cannot initialize JJ, create a Thread or select a conversation backend. Use an
installation-owned profile capability, never a renderer-supplied path.

Pass the resulting journal as an `Arc` to `StoreCapture::new` with the same
context and selected atomic Agent/Thread participants. Give that sink to
`ManagedCapture::with_native_privacy` with the native host's admitted sanitizer
and opaque binding. Keep the journal, sanitizer/cache, native worker and
admission lifetime under the same owner. The host must fence new callbacks and
drain admitted capture before releasing those resources.

Each capture request has one checked private record containing its sanitized
candidate, optional exact preparation and optional original confirmation. New
candidates publish exclusively after file sync. Later phases use staged atomic
replacement, file sync and parent-directory sync. Repeated identical phases are
idempotent; changing a candidate, preparation or receipt fails. Records use the
shared schema-1 DTO codec and its 8 MiB bound, including JSON byte-array
expansion. The scope record binds the original context and a provider digest; it
excludes raw device paths and credentials.

New directories are owner-private and records use mode `0600`. Scoped IO does
not follow directory/file symlinks and rejects public or multiply-linked
records, oversized input and changed lease identities. An absent scope record
cannot silently adopt an interrupted journal. Admission is rechecked around
every transition. These bounded synchronous transitions contain no suspension or
detached background writer, so dropping an unpolled journal future writes
nothing. Native capture still fences its owner after any abandoned processing
wait.

After reopening the original journal and selected provider under current native
admission, invoke `StoreCapture::recover(ordinal)`. It checks the original exact
request and receipt without another prepare, execute or prompt. Missing
preparation and unavailable receipts remain unknown. Do not delete, rename,
reclaim or replace an unknown entry to obtain a new attempt. Failures must keep
the original identities available for explicit recovery.

Service qualification uses a cold Rust process for lease/reopen and Notes'
actual privacy/capture adapter against a real Git-backed JJ vault. This proves
the journal/store boundary and source preservation. Explicit per-vault backend
selection, ordinary native factory wiring/drain, the renderer conversation
adapter and cold packaged-app JJ conversation/restart retain separate M13.3
gates. Ordinary policy still requires an admitted backend and exposes no agent
target. Additional platform and power-loss qualification remain separate.
