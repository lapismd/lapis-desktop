# Native authored conversation messages

LD-AI-002 and LD-REPO-003 distinguish human authorship in ThreadStore from
provider output in AgentStore. A captured reply cannot manufacture an authored
message. This command is a prerequisite for managed renderer persistence;
registering it does not select a backend, dispatch a prompt or migrate files.

## Admitted writes

An explicitly opened current JJ backend may append human text to an original
confirmed native conversation. The bounded main-window request supplies only the
current vault session/backend handle, original conversation request, message
request identity and text. Native code owns actor, repository, thread, new
message identity and current thread selection. Arbitrary paths, expected
versions, source identities and launch authority remain denied.

Ordinary backend frames retain their 4096-byte limit. Only the typed append
operation admits a larger bounded frame, at most 1 MiB, with at most 256 KiB of
nonempty UTF-8 text and no NUL. Multi-line authored messages remain valid.
Native IO, scanning and publication run on the existing bounded worker path.

The existing native workspace/privacy policy sanitizes text before any private
intent or ThreadStore write. The exact unsanitized input is bound by a private
domain-separated digest; its plaintext never enters the recovery record. A
native private random seed and that digest derive the message identity, binding
both through the provider's original command proof. Editing the private digest
alone cannot claim another input. The record also binds the original
conversation, selected backend, physical source, actor, repository and generated
message. Authored text stays separate from injected context; the command accepts
no provider output or arbitrary transcript state blob.

## Durable request ownership

Native code must sync the original command before its one publication attempt.
The command uses the selected ThreadStore and its expected thread version. A
concurrent change cannot silently redirect or overwrite it. A cancelled IPC
caller cannot abandon native ownership of the admitted write.

Repeated requests and status reads may recover only the original provider
receipt. They never execute again. A provider receipt must match the original
request, actor, command digest, repository, thread and generated human message;
the native receipt wrapper must match its canonical provider bytes. Substituted
intent or receipts fail closed. Missing or uncertain outcomes remain unknown and
retain their original identity; a refresh is not retry authority.

Absent status is read-only and creates neither private records nor metadata.
Native close/reload fences and drains these calls through the existing backend
owner. Authored writes never snapshot or replace working-copy files, start a
provider or borrow Repository History admission. Confirmed messages are read
through the existing operation-pinned native conversation reader.

## Managed prompt preparation

A conversation-bound native processor must confirm the prompt's human text in
the original ThreadStore before its outgoing preparation completes. Its native
worker binding and canonical UUID prompt request select that exact write;
renderer-supplied actor, message, repository or filesystem authority is never
accepted. The shared runtime owns and drains preparation before provider
dispatch, independently of the renderer's persistence implementation.

The existing sanitizer and original-receipt recovery apply. IO, scanning and
storage run on an awaited blocking worker retaining the original capture permit
and privacy owner. Missing or unknown confirmation, changed original text,
foreign worker identity or revoked ownership rejects preparation. No raw
fallback or automatic resubmission is allowed. The shared Tauri wrapper also
requires current command admission; retained inbound capture alone cannot
authorize a prompt.

Only authored text is sent to the human-message writer. Injected context never
becomes that message. Context-only prompts and non-prompt controls do not invent
human records. This fence does not itself persist complete prompt context,
select renderer storage, project provider envelopes or prove full chat recovery.

M10.2/M13.3 retain managed renderer/store adoption, metadata/bindings, complete
projection, context/skills/memory and cold conversation/restart gates. Packaged
tools/credentials and compute retain M10.3/M10.4. Release remains deferred.

E-AI-068 qualifies native writes and original-receipt recovery through two cold
native API processes. Full mounted renderer adoption retains the gates above.
E-AI-069 connects native outgoing preparation to the confirmed writer.
