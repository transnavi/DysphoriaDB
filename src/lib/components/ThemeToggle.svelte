<script lang="ts">
  import { onMount, untrack } from "svelte";

  let { initialTheme, darkLabel, lightLabel } = $props<{
    initialTheme: "light" | "dark";
    darkLabel: string;
    lightLabel: string;
  }>();
  let theme = $state<"light" | "dark">(untrack(() => initialTheme));

  onMount(() => {
    theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  });

  function applyTheme(nextTheme: "light" | "dark") {
    theme = nextTheme;
    document.documentElement.dataset.theme = nextTheme;
    document.querySelector<HTMLMetaElement>("#theme-color")!.content =
      nextTheme === "dark" ? "#1a1624" : "#fffdf8";
    document.cookie = `gex_theme_v1=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      localStorage.setItem("gender-experience-theme", nextTheme);
    } catch {}
  }
</script>

<button
  class="theme-toggle"
  type="button"
  aria-label={theme === "dark" ? lightLabel : darkLabel}
  title={theme === "dark" ? lightLabel : darkLabel}
  onclick={() => applyTheme(theme === "dark" ? "light" : "dark")}
>
  <svg class="theme-icon theme-icon-moon" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M20.2 15.4A8.3 8.3 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
  </svg>
  <svg class="theme-icon theme-icon-sun" aria-hidden="true" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
</button>
