<script lang="ts">
  import { Switch } from "@lapismd/design-core/shadcn/switch";
  let {
    checked,
    disabled = false,
    onChange,
  }: {
    checked: boolean;
    disabled?: boolean;
    onChange?(checked: boolean): void;
  } = $props();
</script>

<div class="mention-preference">
  <span
    ><strong>Automatically tag agents</strong><small
      >{checked
        ? "On · Keep these agents in follow-ups"
        : "Off · Choose agents for each message"}</small
    ></span
  >
  <Switch
    {checked}
    disabled={disabled || !onChange}
    aria-label="Automatically tag agents"
    onCheckedChange={(value) => onChange?.(value)}
  />
</div>

<style>
  .mention-preference {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.625rem 0.75rem;
    border-top: 1px solid var(--border);
  }
  span {
    display: grid;
    gap: 0.125rem;
    flex: 1;
    min-width: 0;
  }
  strong {
    font-size: 0.8125rem;
    font-weight: 500;
  }
  small {
    color: var(--muted-foreground);
    font-size: 0.75rem;
  }
</style>
