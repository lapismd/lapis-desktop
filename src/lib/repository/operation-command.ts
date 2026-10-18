/** Display-only normalization of JJ's recorded transaction argument format. */
export function operationCommandLabel(recorded: string): string {
  if (recorded.length > 65_536 || /[\r\n\t]/u.test(recorded)) return recorded;
  const words: string[] = [];
  let i = 0;
  while (i < recorded.length) {
    while (recorded[i] === " ") i++;
    if (i === recorded.length) break;
    let word = "";
    if (recorded[i] === "'") {
      i++;
      let closed = false;
      while (i < recorded.length) {
        if (recorded[i] === "\\" && recorded[i + 1] === "'") {
          word += "'";
          i += 2;
        } else if (recorded[i] === "'") {
          i++;
          closed = true;
          break;
        } else word += recorded[i++];
      }
      if (!closed || (i < recorded.length && recorded[i] !== " "))
        return recorded;
    } else {
      const start = i;
      while (i < recorded.length && recorded[i] !== " ") i++;
      word = recorded.slice(start, i);
      if (!/^[A-Za-z0-9,./:@_-]+$/u.test(word)) return recorded;
    }
    words.push(word);
  }
  if (words[0] !== "jj") return recorded;
  return words
    .map((word) => {
      if (/^[A-Za-z0-9,./:@_-]+$/u.test(word)) return word;
      if (!word.includes("'")) return `'${word}'`;
      if (!/["$`\\]/u.test(word)) return `"${word}"`;
      return `'${word.replaceAll("'", "'\\''")}'`;
    })
    .join(" ");
}
