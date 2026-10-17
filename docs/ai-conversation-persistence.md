# Conversation persistence

The existing AI plugin owns its conversation UI, context, memory and application
tools. A host can select its transcript storage before loading the plugin by
calling `bindConversationPersistence(app, factory)`. The binding is specific to
that App; disabled and Safe Mode startup do not allocate the backend.

The factory returns a backend name, a `TranscriptStore` and an asynchronous
`drain` function. The AI application retains that selection for its whole
lifetime. Existing installations without a binding use `VaultTranscriptStore`
and their existing `.lapis/agents/sessions` files. An injected factory failure
propagates without opening a second writer. A later binding affects future
applications, not an already open conversation host.

`TranscriptStore` writes resolve only when the selected backend can confirm
their durable outcome. An adapter must retain the original request and reject an
uncertain publication rather than report success or silently switch storage. The
binding does not supply native authorization, receipts, provider resume or
raw-event acknowledgement ownership. A receipt-aware JJ adapter and its native
qualification remain separate work.

Close first fences new work and waits for view, maintenance and settings IO. It
then awaits the selected persistence backend's drain before releasing the
runtime. A failed drain keeps the same backend and makes close retryable. The
host must bind any required native capability to the physical vault and owning
window; a backend name grants no authority.
