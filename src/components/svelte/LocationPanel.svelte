<script>
  import { onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import {
    Clock3,
    Copy,
    LocateFixed,
    MapPin,
    Plus,
    Search,
    ShieldCheck,
    Star,
    Trash2,
    X,
  } from "@lucide/svelte";

  export let location = null;
  export let sourceLabel = "";
  export let ageLabel = "";
  export let isLocating = false;
  export let onClose = () => {};
  export let onUsePosition = () => {};
  export let onSearch = () => {};
  export let onForget = () => {};
  export let onCopyObsLink = () => {};
  export let savedLocations = [];
  export let onSave = () => {};
  export let onSelectSaved = () => {};
  export let onRemoveSaved = () => {};

  let closeButton;
  let panel;

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);
    closeButton?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      previousFocus?.focus?.();
    };
  });
</script>

<div
  class="location-panel-backdrop"
  role="presentation"
  on:mousedown|self={onClose}
  transition:fade={{ duration: 160 }}
>
  <div
    class="location-panel"
    bind:this={panel}
    role="dialog"
    aria-modal="true"
    aria-labelledby="location-panel-title"
    transition:fly={{ y: 28, duration: 220 }}
  >
    <div class="sheet-handle" aria-hidden="true"></div>

    <header>
      <div class="panel-title-icon"><MapPin size={22} aria-hidden="true" /></div>
      <div>
        <span class="eyebrow">Stedskontroll</span>
        <h2 id="location-panel-title">Hvor vil du se været?</h2>
      </div>
      <button
        class="icon-button"
        type="button"
        bind:this={closeButton}
        on:click={onClose}
        aria-label="Lukk stedskontroll"
      >
        <X size={18} />
      </button>
    </header>

    {#if location}
      <div class="location-panel-current">
        <div class="location-orb"><MapPin size={23} aria-hidden="true" /></div>
        <div>
          <span>Aktivt sted</span>
          <strong>{location.name}</strong>
          <div class="location-meta">
            {#if sourceLabel}<small>{sourceLabel}</small>{/if}
            {#if ageLabel}
              <small><Clock3 size={13} aria-hidden="true" /> {ageLabel}</small>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="location-panel-empty">
        <div class="location-orb"><LocateFixed size={25} aria-hidden="true" /></div>
        <div>
          <strong>Ingen posisjon er valgt</strong>
          <span>Bruk GPS eller søk etter et sted. Du har full kontroll.</span>
        </div>
      </div>
    {/if}

    <div class="location-panel-actions">
      <button
        class="primary-button"
        type="button"
        on:click={onUsePosition}
        disabled={isLocating}
      >
        <LocateFixed size={18} class={isLocating ? "locating" : ""} />
        {isLocating ? "Finner posisjonen…" : location ? "Oppdater med GPS" : "Bruk min posisjon"}
      </button>
      <button class="secondary-button" type="button" on:click={onSearch}>
        <Search size={18} aria-hidden="true" />
        Søk etter et annet sted
      </button>
    </div>

    {#if location}
      <section class="saved-locations" aria-labelledby="saved-locations-title">
        <div class="saved-locations-heading">
          <div>
            <strong id="saved-locations-title">Lagrede steder</strong>
            <span>{savedLocations.length} av 3</span>
          </div>
          <button
            type="button"
            on:click={onSave}
            disabled={savedLocations.length >= 3 && !savedLocations.some((item) => item.lat === location.lat && item.lon === location.lon)}
          >
            <Plus size={15} aria-hidden="true" />
            Lagre aktivt sted
          </button>
        </div>

        {#if savedLocations.length}
          <div class="saved-location-list">
            {#each savedLocations as saved}
              <div class="saved-location-item" class:active={saved.lat === location.lat && saved.lon === location.lon}>
                <button
                  class="saved-location-select"
                  type="button"
                  on:click={() => onSelectSaved(saved)}
                  aria-label={`Vis været for ${saved.name}`}
                >
                  <Star size={16} aria-hidden="true" />
                  <span>{saved.name}</span>
                  {#if saved.lat === location.lat && saved.lon === location.lon}
                    <small>Aktiv</small>
                  {/if}
                </button>
                <button
                  class="saved-location-remove"
                  type="button"
                  on:click={() => onRemoveSaved(saved)}
                  aria-label={`Fjern ${saved.name} fra lagrede steder`}
                  title="Fjern lagret sted"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <p class="saved-locations-empty">Lagre opptil tre steder for raskt å bytte mellom dem.</p>
        {/if}
      </section>

      <button class="secondary-button" type="button" on:click={onCopyObsLink}>
        <Copy size={18} aria-hidden="true" />
        Kopier widget-lenke (OBS)
      </button>
      <button class="forget-location-button" type="button" on:click={onForget}>
        <Trash2 size={16} aria-hidden="true" />
        Nullstill aktivt sted
      </button>
    {/if}

    <div class="location-privacy-note">
      <ShieldCheck size={18} aria-hidden="true" />
      <span>GPS-posisjonen lagres med full nettleserpresisjon bare på denne enheten.</span>
    </div>
  </div>
</div>
