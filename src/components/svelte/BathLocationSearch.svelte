<script>
  import { onDestroy } from "svelte";
  import {
    CheckCircle2,
    LoaderCircle,
    MapPin,
    Search,
    TriangleAlert,
  } from "@lucide/svelte";
  import { fetchBathLocations } from "../../api/VaervaktApi";

  export let value = "";
  export let selectedLocationId = "";
  export let onChange = () => {};
  export let onSelect = () => {};

  let options = [];
  let isLoading = false;
  let isOpen = false;
  let searchError = false;
  let activeIndex = -1;
  let requestId = 0;
  let debounceTimer;

  onDestroy(() => {
    window.clearTimeout(debounceTimer);
    requestId += 1;
  });

  async function runSearch(query) {
    const currentRequest = ++requestId;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      options = [];
      isOpen = false;
      isLoading = false;
      searchError = false;
      return;
    }

    isLoading = true;
    searchError = false;
    try {
      const payload = await fetchBathLocations(trimmed);
      if (currentRequest !== requestId) return;
      options = Array.isArray(payload.locations) ? payload.locations : [];
      activeIndex = -1;
      isOpen = true;
    } catch {
      if (currentRequest === requestId) {
        options = [];
        searchError = true;
        isOpen = true;
      }
    } finally {
      if (currentRequest === requestId) isLoading = false;
    }
  }

  function handleInput(event) {
    const nextValue = event.currentTarget.value;
    value = nextValue;
    onChange(nextValue);
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => runSearch(nextValue), 350);
  }

  function selectOption(option) {
    value = option.name;
    options = [];
    isOpen = false;
    activeIndex = -1;
    searchError = false;
    onSelect(option);
  }

  function handleKeydown(event) {
    if (!isOpen || options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + options.length) % options.length;
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectOption(options[activeIndex]);
    } else if (event.key === "Escape") {
      isOpen = false;
    }
  }
</script>

<div class="bath-location-field">
  <label for="bath-location-search">
    <span>Badeplass fra Yr</span>
  </label>
  <div class="bath-location-search" class:selected={Boolean(selectedLocationId)}>
    {#if selectedLocationId}
      <CheckCircle2 size={18} aria-hidden="true" />
    {:else}
      <Search size={18} aria-hidden="true" />
    {/if}
    <input
      id="bath-location-search"
      type="search"
      role="combobox"
      {value}
      placeholder="Søk for eksempel Operastranda"
      aria-label="Søk etter badeplass hos Yr"
      aria-expanded={isOpen}
      aria-controls="bath-location-results"
      aria-autocomplete="list"
      aria-activedescendant={activeIndex >= 0
        ? `bath-location-option-${activeIndex}`
        : undefined}
      autocomplete="off"
      on:input={handleInput}
      on:keydown={handleKeydown}
      on:focus={() => (isOpen = options.length > 0 || searchError)}
      on:blur={() => window.setTimeout(() => (isOpen = false), 140)}
    />
    {#if isLoading}
      <LoaderCircle class="spin" size={17} aria-label="Søker hos Yr" />
    {/if}

    {#if isOpen}
      <div id="bath-location-results" class="bath-location-results" role="listbox">
        {#if options.length > 0}
          {#each options as option, index}
            <button
              id={`bath-location-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              class:active={index === activeIndex}
              on:mousedown|preventDefault={() => selectOption(option)}
            >
              <MapPin size={17} aria-hidden="true" />
              <span>
                <strong>{option.name}</strong>
                <small>{option.regionName || "Badeplass hos Yr"}</small>
              </span>
            </button>
          {/each}
        {:else if !isLoading && searchError}
          <p class="bath-location-error">
            <TriangleAlert size={16} aria-hidden="true" />
            Yr-søket er ikke tilgjengelig akkurat nå.
          </p>
        {:else if !isLoading}
          <p>Yr fant ingen godkjent badeplass. Prøv et annet navn.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>
