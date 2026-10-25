import { extname } from "node:path";

/** Each theme/viewport retains its own report without altering story targets. */
export function catalogArguments(args, viewport, theme) {
  const output = (file) => {
    const extension = extname(file);
    return (
      file.slice(0, file.length - extension.length) +
      `-${viewport}-${theme}` +
      extension
    );
  };
  return args.map((argument, index) => {
    if (/^--outputFile(?:\.[\w-]+)?=/.test(argument)) {
      const separator = argument.indexOf("=");
      return (
        argument.slice(0, separator + 1) + output(argument.slice(separator + 1))
      );
    }
    return /^--outputFile(?:\.[\w-]+)?$/.test(args[index - 1] ?? "")
      ? output(argument)
      : argument;
  });
}
