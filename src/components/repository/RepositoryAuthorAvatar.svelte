<script lang="ts">
  // jj-store's application-owned Git-author fallback palette and name seed.
  let { name }: { name: string } = $props();
  const author = $derived(name.trim() || "Unknown user");
  const initials = $derived(
    author
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  );
  const tone = $derived.by(() => {
    const tones = [
      "blue",
      "emerald",
      "amber",
      "rose",
      "cyan",
      "violet",
      "orange",
    ];
    const hash = Array.from(author.toLowerCase()).reduce(
      (value, character) =>
        (value * 31 + (character.codePointAt(0) ?? 0)) >>> 0,
      0,
    );
    return tones[hash % tones.length];
  });
</script>

<span
  class="repository-author-avatar"
  data-tone={tone}
  role="img"
  aria-label={author}>{initials}</span
>

<style>
  .repository-author-avatar {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: none;
    place-items: center;
    overflow: hidden;
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--repository-author-foreground);
    background: var(--repository-author-background);
  }
  [data-tone="blue"] {
    --repository-author-background: #2563eb;
    --repository-author-foreground: #fff;
  }
  [data-tone="emerald"] {
    --repository-author-background: #047857;
    --repository-author-foreground: #fff;
  }
  [data-tone="amber"] {
    --repository-author-background: #fbbf24;
    --repository-author-foreground: #451a03;
  }
  [data-tone="rose"] {
    --repository-author-background: #e11d48;
    --repository-author-foreground: #fff;
  }
  [data-tone="cyan"] {
    --repository-author-background: #22d3ee;
    --repository-author-foreground: #083344;
  }
  [data-tone="violet"] {
    --repository-author-background: #7c3aed;
    --repository-author-foreground: #fff;
  }
  [data-tone="orange"] {
    --repository-author-background: #c2410c;
    --repository-author-foreground: #fff;
  }
</style>
