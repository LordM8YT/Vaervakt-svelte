<script>
  import { onMount } from "svelte";
  import {
    CheckCircle2,
    Mail,
    MapPin,
    MessageCircleHeart,
    RadioTower,
    ShieldCheck,
    Waves,
    X,
  } from "@lucide/svelte";
  import {
    FEEDBACK_EMAIL,
    FEEDBACK_EMAIL_LABEL,
    buildFeedbackMailto,
  } from "../../utilities/FeedbackUtils";

  export let onClose = () => {};

  let closeButton;
  let dialog;
  let feedbackHref = `mailto:${FEEDBACK_EMAIL}`;

  onMount(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    feedbackHref = buildFeedbackMailto({
      path: window.location.pathname,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      userAgent: window.navigator.userAgent,
    });

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = [
        ...dialog.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ].filter((element) => !element.hasAttribute("hidden"));
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
  class="feedback-backdrop"
  role="presentation"
  on:mousedown|self={onClose}
>
  <div
    class="feedback-dialog"
    bind:this={dialog}
    role="dialog"
    aria-modal="true"
    aria-labelledby="feedback-title"
    aria-describedby="feedback-description"
  >
    <header>
      <div class="feedback-title">
        <MessageCircleHeart size={25} aria-hidden="true" />
        <div>
          <span class="eyebrow">Åpen beta</span>
          <h2 id="feedback-title">Hjelp oss å gjøre Værvakt bedre</h2>
        </div>
      </div>
      <button
        class="icon-button"
        type="button"
        bind:this={closeButton}
        on:click={onClose}
        aria-label="Lukk tilbakemelding"
      >
        <X size={19} />
      </button>
    </header>

    <div class="feedback-content">
      <p id="feedback-description">
        Fortell kort hva du prøvde, hva du forventet og hva som skjedde. Både feil og
        ting som bare føles uklare er nyttige.
      </p>

      <div class="feedback-test-card">
        <h3>Dette vil vi gjerne at du tester</h3>
        <ul>
          <li><MapPin size={17} aria-hidden="true" /> Finn riktig sted med søk eller GPS</li>
          <li><CheckCircle2 size={17} aria-hidden="true" /> Sjekk om værdataene er lette å forstå</li>
          <li><RadioTower size={17} aria-hidden="true" /> Se stasjoner og rapporter under Lokalt</li>
          <li><Waves size={17} aria-hidden="true" /> Finn eller send en badetemperatur</li>
        </ul>
      </div>

      <div class="feedback-privacy-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>
          E-posten får med side, skjermstørrelse og nettleser. Valgt sted og koordinater
          legges ikke ved.
        </span>
      </div>
    </div>

    <div class="feedback-actions">
      <a class="primary-button" href={feedbackHref} on:click={onClose}>
        <Mail size={17} aria-hidden="true" />
        Send tilbakemelding
      </a>
      <span>
        Eller skriv til
        <a href={`mailto:${FEEDBACK_EMAIL}`}>{FEEDBACK_EMAIL_LABEL}</a>
      </span>
    </div>
  </div>
</div>
