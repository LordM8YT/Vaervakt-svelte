<script>
  import {
    BadgeCheck,
    CloudSun,
    LocateFixed,
    MapPin,
    RadioTower,
    Waves,
  } from "@lucide/svelte";

  const items = [
    {
      icon: CloudSun,
      title: "Presist værvarsel",
      description: "Oppdaterte prognoser fra MET, presentert enkelt og uten støy.",
      color: "#38bdf8",
    },
    {
      icon: MapPin,
      title: "Ditt sted",
      description: "Søk etter et sted eller bruk posisjonen din når du selv ønsker det.",
      color: "#a78bfa",
    },
    {
      icon: RadioTower,
      title: "Lokale målinger",
      description: "Se ferske data fra godkjente værstasjoner i nærområdet.",
      color: "#34d399",
    },
    {
      icon: Waves,
      title: "Badetemperatur",
      description: "Finn ferske bademålinger i nærheten, levert gjennom Yr.",
      color: "#22d3ee",
    },
    {
      icon: LocateFixed,
      title: "Lokale rapporter",
      description: "Sammenlign det offisielle varselet med observasjoner fra folk nær deg.",
      color: "#f59e0b",
    },
    {
      icon: BadgeCheck,
      title: "Personvern først",
      description: "Ingen annonser. GPS brukes bare når du ber om det.",
      color: "#f472b6",
    },
  ];

  let hoveredIndex = null;

  function handlePointerMove(event) {
    if (event.pointerType === "touch") return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    card.style.setProperty("--rotate-x", `${(0.5 - y) * 18}deg`);
    card.style.setProperty("--rotate-y", `${(x - 0.5) * 18}deg`);
    card.style.setProperty("--glow-x", `${x * 100}%`);
    card.style.setProperty("--glow-y", `${y * 100}%`);
  }

  function resetCard(event) {
    event.currentTarget.style.setProperty("--rotate-x", "0deg");
    event.currentTarget.style.setProperty("--rotate-y", "0deg");
  }
</script>

<section class="spotlight" aria-labelledby="spotlight-title">
  <div class="spotlight-dots" aria-hidden="true"></div>
  <header>
    <span>Dette får du</span>
    <h2 id="spotlight-title">Alt du trenger for været rundt deg</h2>
  </header>

  <div class="spotlight-grid">
    {#each items as item, index}
      <article
        class:dimmed={hoveredIndex !== null && hoveredIndex !== index}
        class="spotlight-card"
        on:pointerenter={() => (hoveredIndex = index)}
        on:pointerleave={(event) => {
          hoveredIndex = null;
          resetCard(event);
        }}
        on:pointermove={handlePointerMove}
      >
        <div class="card-tint" style={`--accent: ${item.color}`} aria-hidden="true"></div>
        <div class="card-glow" style={`--accent: ${item.color}`} aria-hidden="true"></div>
        <div class="card-shimmer" aria-hidden="true"></div>
        <div class="icon-badge" style={`--accent: ${item.color}`}>
          <svelte:component this={item.icon} size={18} strokeWidth={1.9} aria-hidden="true" />
        </div>
        <div class="card-copy">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
        <div class="accent-line" style={`--accent: ${item.color}`} aria-hidden="true"></div>
      </article>
    {/each}
  </div>
</section>

<style>
  .spotlight {
    position: relative;
    width: 100%;
    margin-top: 18px;
    padding: 28px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 24px;
    background: rgba(6, 10, 25, 0.72);
  }

  .spotlight-dots {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.55;
    background-image: radial-gradient(circle, rgba(148, 163, 184, 0.14) 1px, transparent 1px);
    background-size: 22px 22px;
    mask-image: linear-gradient(to bottom, black, transparent 72%);
  }

  header {
    position: relative;
    margin-bottom: 22px;
  }

  header span {
    color: #7dd3fc;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  h2 {
    margin: 5px 0 0;
    color: #f8fafc;
    font-size: clamp(1.15rem, 3vw, 1.42rem);
    letter-spacing: -0.025em;
  }

  .spotlight-grid {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 11px;
    perspective: 900px;
  }

  .spotlight-card {
    --rotate-x: 0deg;
    --rotate-y: 0deg;
    --glow-x: 20%;
    --glow-y: 20%;
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 164px;
    padding: 18px;
    overflow: hidden;
    flex-direction: column;
    gap: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 17px;
    background: rgba(255, 255, 255, 0.035);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
    transform: rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
    transform-style: preserve-3d;
    transition: transform 180ms ease-out, opacity 180ms ease-out, border-color 280ms ease;
    will-change: transform;
  }

  .spotlight-card:hover {
    border-color: rgba(255, 255, 255, 0.16);
  }

  .spotlight-card.dimmed {
    opacity: 0.48;
    transform: rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) scale(0.96);
  }

  .card-tint,
  .card-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at 20% 20%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 65%);
  }

  .card-glow {
    opacity: 0;
    background: radial-gradient(circle at var(--glow-x) var(--glow-y), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%);
    transition: opacity 220ms ease;
  }

  .spotlight-card:hover .card-glow {
    opacity: 1;
  }

  .card-shimmer {
    position: absolute;
    inset-block: 0;
    left: 0;
    width: 55%;
    pointer-events: none;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.055), transparent);
    transform: translateX(-125%) skewX(-12deg);
    transition: transform 700ms ease-out;
  }

  .spotlight-card:hover .card-shimmer {
    transform: translateX(290%) skewX(-12deg);
  }

  .icon-badge {
    position: relative;
    z-index: 1;
    display: grid;
    width: 40px;
    height: 40px;
    place-items: center;
    color: var(--accent);
    border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    transform: translateZ(12px);
  }

  .card-copy {
    position: relative;
    z-index: 1;
    transform: translateZ(8px);
  }

  h3 {
    margin: 0;
    color: #f8fafc;
    font-size: 0.86rem;
    letter-spacing: -0.015em;
  }

  p {
    margin: 6px 0 0;
    color: rgba(226, 232, 240, 0.5);
    font-size: 0.72rem;
    line-height: 1.55;
  }

  .accent-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(to right, color-mix(in srgb, var(--accent) 58%, transparent), transparent);
    transition: width 500ms ease;
  }

  .spotlight-card:hover .accent-line {
    width: 100%;
  }

  :global(html[data-theme="light"]) .spotlight {
    border-color: rgba(15, 23, 42, 0.09);
    background: rgba(255, 255, 255, 0.78);
  }

  :global(html[data-theme="light"]) .spotlight-dots {
    background-image: radial-gradient(circle, rgba(15, 23, 42, 0.09) 1px, transparent 1px);
  }

  :global(html[data-theme="light"]) h2,
  :global(html[data-theme="light"]) h3 {
    color: #0f172a;
  }

  :global(html[data-theme="light"]) .spotlight-card {
    border-color: rgba(15, 23, 42, 0.1);
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }

  :global(html[data-theme="light"]) p {
    color: #64748b;
  }

  @media (max-width: 800px) {
    .spotlight-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 520px) {
    .spotlight {
      padding: 20px 14px;
      border-radius: 20px;
    }

    .spotlight-grid {
      grid-template-columns: 1fr;
    }

    .spotlight-card {
      min-height: 0;
    }
  }

  @media (hover: none), (prefers-reduced-motion: reduce) {
    .spotlight-card,
    .spotlight-card.dimmed {
      opacity: 1;
      transform: none;
    }

    .card-shimmer {
      display: none;
    }
  }
</style>
