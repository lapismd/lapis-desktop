# Background activity and responsiveness

LD-DESK-001 startup phases and App-owned background tasks MUST use the public
notification progress API with `location: status`. Progress lasts through the
actual operation, including queued work, and is removed on completion, failure
or drained disposal. Existing App notifications own operational failures.
Optional AI command initialization MUST NOT gate workspace input. Native file,
database and repository computation stays on blocking workers; command-file YAML
parsing uses the native host's dedicated renderer worker. Its timeout, failure
and disposal reject pending work without a synchronous renderer fallback.

LD-AI-002 command initialization and discovery, conversation indexing, memory
catch-up and scheduled maintenance publish App-owned status progress. Optional
command seeding/discovery runs after registering the usable plugin surfaces and
remains owned until drained closure. Native command parsing uses a lazy module
worker; invalid Markdown retains per-file diagnostics, infrastructure failures
use App error notifications, and older discoveries cannot replace a newer scope.
Provider execution and durable conversation qualification remain separate.

E-AI-077's admitted managed processor runs prompt preparation and capture-batch
scanning, normalization, journaling and publication on an awaited blocking
worker. The processor and its counted native authority remain owned through an
abandoned caller or unknown outcome; neither a raw fallback nor a replacement
processor may bypass the receipt fence. The synchronous launch/factory hooks
remain a separate adaptation gap. This implementation draft is unqualified while
verification is parked.

Progress publication and imperative task setup stay outside reactive dependency
tracking. Publishing status MUST NOT retrigger a chat or view effect that
started the work. The unchanged native-factory Chat/catalog story qualifies this
edge.
