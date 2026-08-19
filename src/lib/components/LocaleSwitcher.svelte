<script lang="ts">
  let { locale, label, shortLabel, links } = $props<{
    locale: string;
    label: string;
    shortLabel: string;
    links: Array<{
      id: string;
      label: string;
      htmlLang: string;
      hreflang: string;
      href: string;
    }>;
  }>();

  let open = $state(false);
  let trigger: HTMLButtonElement;
  let menu: HTMLElement;

  function close(restoreFocus = false) {
    open = false;
    if (restoreFocus) trigger?.focus();
  }

  function focusLink(index: number) {
    const anchors = [...(menu?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    anchors[index]?.focus();
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    const anchors = [...(menu?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    const current = anchors.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = event.key === "Home"
      ? 0
      : event.key === "End"
        ? anchors.length - 1
        : (current + (event.key === "ArrowDown" ? 1 : -1) + anchors.length) % anchors.length;
    anchors[index]?.focus();
  }

  function handleWindowPointer(event: PointerEvent) {
    if (open && (!(event.target instanceof Element) || !event.target.closest(".locale-switcher"))) close();
  }
</script>

<svelte:window onpointerdown={handleWindowPointer} onkeydown={(event) => open && handleMenuKeydown(event)} />

<div class="locale-switcher">
  <span class="visually-hidden" id="locale-label">{label}</span>
  <button
    bind:this={trigger}
    class="locale-trigger"
    type="button"
    aria-expanded={open}
    aria-controls="locale-menu"
    aria-haspopup="menu"
    aria-labelledby="locale-label locale-current"
    onclick={() => {
      open = !open;
      if (open) requestAnimationFrame(() => focusLink(0));
    }}
    onkeydown={(event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        open = true;
        requestAnimationFrame(() => focusLink(event.key === "ArrowUp" ? links.length - 1 : 0));
      }
    }}
  >
    <svg class="locale-globe" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
    <span id="locale-current" data-short-label={shortLabel}>{links.find((link: { id: string }) => link.id === locale)?.label}</span>
    <svg class="locale-chevron" aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
  </button>
  <div
    bind:this={menu}
    class="locale-menu"
    id="locale-menu"
    role="menu"
    aria-labelledby="locale-label"
    hidden={!open}
  >
    <ul role="none">
      {#each links as link}
        <li role="none">
          <a
            role="menuitemradio"
            href={link.href}
            lang={link.htmlLang}
            hreflang={link.hreflang}
            aria-checked={link.id === locale}
            aria-current={link.id === locale ? "page" : undefined}
            onclick={() => close()}
          >
            <span>{link.label}</span>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</div>
