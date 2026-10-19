<script lang="ts">
  let { text }: { text: string } = $props();
  // Colour captured text only: no registry lookup, ANSI interpretation or HTML injection.
  const lines = $derived(
    text.split("\n").map((line) => {
      const command = /^(\s+)(\/[^—]+?)( — )(.*)$/u.exec(line);
      return {
        text: line,
        command,
        heading: /^(App|Actions|Skills|Current Agent(?: · .+)?)$/u.test(line),
      };
    }),
  );
</script>

<pre
  class="command-report"
  aria-label="Command output">{#each lines as line, i}{#if i > 0}{"\n"}{/if}{#if line.command}{line
        .command[1]}<span class="command">{line.command[2]}</span><span
        class="separator">{line.command[3]}</span
      >{line.command[4]}{:else}<span class:heading={line.heading}
        >{line.text}</span
      >{/if}{/each}</pre>

<style>
  .command-report {
    margin: 0;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md, 0.375rem);
    background: var(--muted);
    color: var(--foreground);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 0.8125rem;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .heading {
    color: color-mix(in srgb, var(--primary) 35%, var(--foreground));
    font-weight: 650;
  }
  .command {
    color: color-mix(
      in srgb,
      var(--chart-2, var(--primary)) 65%,
      var(--foreground)
    );
    font-weight: 550;
  }
  .separator {
    color: var(--muted-foreground);
  }
</style>
