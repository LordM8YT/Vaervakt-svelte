<script>
  import {
    CloudSun,
    LocateFixed,
    MessageCircleHeart,
    Search,
    ShieldCheck,
    Sparkles,
  } from "@lucide/svelte";

  export let onUsePosition = () => {};
  export let onSearch = () => {};
  export let onOpenFeedback = () => {};
  export let isLocating = false;
</script>

<section class="start-experience">
  <div class="start-glow" aria-hidden="true"></div>
  <div class="start-icon"><CloudSun size={52} strokeWidth={1.5} aria-hidden="true" /></div>
  <span class="start-kicker"><Sparkles size={14} /> Åpen beta · Værvakt er klar</span>
  <h1>Lokalt vær.<br /><em>Null støy.</em></h1>
  <p>
    Presist vær fra MET, lokale observasjoner og badetemperatur — samlet rundt stedet
    du faktisk bryr deg om.
  </p>
  <div class="start-actions">
    <button class="primary-button" type="button" on:click={onUsePosition} disabled={isLocating}>
      <LocateFixed size={18} class={isLocating ? "locating" : ""} />
      {isLocating ? "Finner deg…" : "Bruk min posisjon"}
    </button>
    <button class="secondary-button" type="button" on:click={onSearch}>
      <Search size={18} />
      Søk etter sted
    </button>
  </div>
  <div class="start-trust">
    <span><ShieldCheck size={15} /> Ingen annonser</span>
    <span>GPS kun når du ber om det</span>
  </div>
  <button class="start-feedback-button" type="button" on:click={onOpenFeedback}>
    <MessageCircleHeart size={16} aria-hidden="true" />
    Tester du appen? Se hva vi trenger hjelp med
  </button>
</section>
