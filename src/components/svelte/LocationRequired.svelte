<script>
  import { LocateFixed, MapPin, MessageSquareText, Search, Waves } from "@lucide/svelte";

  export let activeTab = "local";
  export let isLocating = false;
  export let onUsePosition = () => {};
  export let onSearch = () => {};

  $: isBath = activeTab === "bath";
</script>

<section class="location-required" aria-labelledby="location-required-title">
  <div class="location-art" class:bath={isBath} aria-hidden="true">
    {#if isBath}
      <Waves size={48} strokeWidth={1.45} />
    {:else}
      <MessageSquareText size={48} strokeWidth={1.45} />
    {/if}
  </div>
  <span class="eyebrow">{isBath ? "Bad" : "Lokalt"}</span>
  <h1 id="location-required-title">
    {isBath ? "Finn badetemperaturen nær deg" : "Se hva som skjer rundt deg"}
  </h1>
  <p>
    {isBath
      ? "Velg et sted for å se ferske bademålinger og registrerte badeplasser i nærheten."
      : "Velg et sted for å se lokale værstasjoner, målinger og rapporter fra området."}
  </p>
  <div class="location-required-actions">
    <button class="primary-button" type="button" on:click={onUsePosition} disabled={isLocating}>
      <LocateFixed size={18} class={isLocating ? "locating" : ""} />
      {isLocating ? "Finner deg…" : "Bruk min posisjon"}
    </button>
    <button class="secondary-button" type="button" on:click={onSearch}>
      <Search size={18} />
      Søk etter sted
    </button>
  </div>
  <div class="location-note">
    <MapPin size={14} />
    Stedet brukes for å finne relevante data i nærheten.
  </div>
</section>

<style>
  .location-required {
    position: relative;
    display: flex;
    width: 100%;
    min-height: 520px;
    margin-top: 28px;
    padding: clamp(28px, 6vw, 70px);
    overflow: hidden;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    border: 1px solid rgba(148, 205, 234, 0.13);
    border-radius: 28px;
    background:
      radial-gradient(circle at 50% 26%, rgba(76, 201, 240, 0.14), transparent 28%),
      linear-gradient(150deg, rgba(13, 25, 47, 0.92), rgba(5, 10, 23, 0.92));
  }

  .location-art {
    display: grid;
    width: 92px;
    height: 92px;
    margin-bottom: 22px;
    place-items: center;
    color: #7dd3fc;
    border: 1px solid rgba(125, 211, 252, 0.18);
    border-radius: 30px;
    background: rgba(56, 189, 248, 0.09);
    box-shadow: 0 24px 60px rgba(14, 165, 233, 0.13);
    transform: rotate(-3deg);
  }

  .location-art.bath {
    color: #67e8f9;
    background: rgba(34, 211, 238, 0.09);
  }

  .eyebrow {
    color: #7dd3fc;
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 650px;
    margin: 8px 0 12px;
    color: #f8fafc;
    font-size: clamp(2rem, 5vw, 3.8rem);
    line-height: 1;
    letter-spacing: -0.055em;
  }

  p {
    max-width: 590px;
    margin: 0;
    color: rgba(226, 238, 247, 0.58);
    font-size: 0.9rem;
    line-height: 1.7;
  }

  .location-required-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 25px;
  }

  .location-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    color: rgba(226, 238, 247, 0.38);
    font-size: 0.64rem;
  }

  :global(html[data-theme="light"]) .location-required {
    border-color: rgba(15, 75, 108, 0.09);
    background:
      radial-gradient(circle at 50% 20%, rgba(76, 201, 240, 0.13), transparent 31%),
      rgba(255, 255, 255, 0.84);
    box-shadow: 0 24px 70px rgba(15, 53, 76, 0.08);
  }

  :global(html[data-theme="light"]) h1 {
    color: #0f172a;
  }

  :global(html[data-theme="light"]) p,
  :global(html[data-theme="light"]) .location-note {
    color: #64748b;
  }

  @media (max-width: 520px) {
    .location-required {
      min-height: 480px;
      margin-top: 18px;
      padding: 38px 18px;
      border-radius: 23px;
    }

    .location-required-actions {
      width: 100%;
      flex-direction: column;
    }

    .location-required-actions :global(button) {
      width: 100%;
    }
  }
</style>
