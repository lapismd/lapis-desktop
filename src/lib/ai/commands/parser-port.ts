import type { ParsedCommandFile } from "./markdown.ts";
export type CommandParser = (
  content: string,
  path: string,
  name: string,
) => ParsedCommandFile | Promise<ParsedCommandFile>;

/** Infrastructure failure must not be mistaken for an invalid command file. */
export class CommandWorkerError extends Error {}
export type ParseRequest = {
  id: number;
  content: string;
  path: string;
  name: string;
};
export type ParseReply = {
  id: number;
  data?: ParsedCommandFile;
  error?: { name: string; message: string };
};
