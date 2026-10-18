import { parseCommandMarkdown } from "../../ai/commands/markdown.ts";
import type {
  ParseRequest,
  ParseReply,
} from "../../ai/commands/parser-port.ts";
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ParseRequest>) => void) | null;
  postMessage(reply: ParseReply): void;
};
scope.onmessage = ({ data: request }) => {
  try {
    const data = parseCommandMarkdown(
      request.content,
      request.path,
      request.name,
    );
    scope.postMessage({ id: request.id, data });
  } catch (error) {
    scope.postMessage({
      id: request.id,
      error: {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
};
