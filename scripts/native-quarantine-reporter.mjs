import { writeFileSync } from "node:fs";
import {
  diagnosticSelection,
  quarantineResults,
} from "../tests/desktop/native-quarantine.mjs";

export default async function* report(source) {
  const events = [];
  const selected = diagnosticSelection();
  for await (const event of source) {
    if (["test:pass", "test:fail"].includes(event.type)) {
      events.push(event);
      const { name, skip, details } = event.data;
      yield `${event.type === "test:fail" ? "FAIL" : skip ? "SKIP" : "PASS"} ${name}\n`;
      if (event.type === "test:fail" && details?.error)
        yield `${details.error.stack ?? details.error.message}\n`;
    }
    if (event.type === "test:stderr") yield event.data.message;
  }
  const result = quarantineResults(selected, events);
  writeFileSync(
    process.env.LAPIS_DESKTOP_QUARANTINE_REPORT,
    JSON.stringify(result, null, 2) + "\n",
  );
  yield `Diagnostic cases: ${result.executed} executed, ${result.passed} passed, ${result.failed} failed. No release qualification.\n`;
}
