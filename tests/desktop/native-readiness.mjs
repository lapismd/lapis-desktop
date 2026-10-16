/** Observe the complete chunk before retaining only a bounded matching tail. */
export function rendererReadiness() {
  const marker = "lapis-desktop: renderer ready";
  let tail = "";
  let ready = false;
  return (chunk) => {
    const output = tail + chunk.toString();
    ready ||= output.includes(marker);
    tail = output.slice(-(marker.length - 1));
    return ready;
  };
}
