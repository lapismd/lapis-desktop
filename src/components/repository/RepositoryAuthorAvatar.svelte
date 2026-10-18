<script lang="ts">
  import { AuthorCard } from "@lapismd/design-core/shadcn/author-card";
  import { avatarInitials } from "@lapismd/design-core/shadcn/avatar";
  import type {
    AvatarIdentity,
    AvatarSize,
  } from "@lapismd/design-core/shadcn/avatar";
  import { reviewGravatar } from "../../lib/repository/author.ts";
  let {
    name,
    email = "",
    avatarUrl,
    handle,
    size = "xs",
  }: {
    name: string;
    email?: string;
    avatarUrl?: string;
    handle?: string;
    size?: AvatarSize;
  } = $props();
  let gravatar = $state<{ email: string; src: string }>();
  const normalizedEmail = $derived(email.trim().toLowerCase());
  const author = $derived<AvatarIdentity>({
    id: normalizedEmail || handle || name.trim() || "unknown-author",
    name: name.trim() || email.trim() || "Unknown author",
    src:
      avatarUrl ||
      (gravatar?.email === normalizedEmail ? gravatar.src : undefined),
  });
  $effect(() => {
    const requested = normalizedEmail;
    let live = true;
    if (!avatarUrl) {
      void reviewGravatar(requested)
        .then((src) => {
          if (live) gravatar = src ? { email: requested, src } : undefined;
        })
        .catch(() => {
          // Image enrichment is optional; the shared Avatar retains name fallback.
          if (live) gravatar = undefined;
        });
    }
    return () => {
      live = false;
    };
  });
</script>

<!-- Keep profile activation separate from graph and command-item activation. -->
<span
  class="repository-review-author-avatar"
  onpointerdown={(event) => event.stopPropagation()}
  onclick={(event) => event.stopPropagation()}
  onkeydown={(event) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  }}
  role="presentation"
>
  <AuthorCard
    {author}
    label={`${avatarInitials(author.name)} · About ${author.name}`}
    {size}
    handle={email.trim() || handle}
    interaction="hover"
  />
</span>

<style>
  .repository-review-author-avatar {
    display: inline-flex;
    flex: none;
    align-items: center;
    pointer-events: auto;
    --ui-author-card-avatar-size: 1.75rem;
  }
</style>
