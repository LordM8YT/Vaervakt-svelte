<script>
  import { CloudSun, Droplets, MapPin, Navigation, Umbrella, Wind } from "@lucide/svelte";

  const hours = [
    { time: "Nå", temp: 17, rain: 5, icon: "sun" },
    { time: "16", temp: 18, rain: 8, icon: "sun" },
    { time: "18", temp: 17, rain: 18, icon: "cloud" },
    { time: "20", temp: 15, rain: 42, icon: "rain" },
    { time: "22", temp: 13, rain: 24, icon: "cloud" },
    { time: "00", temp: 12, rain: 10, icon: "moon" },
  ];

  let selectedIndex = 0;
  $: selected = hours[selectedIndex];
  $: status =
    selected.rain >= 35
      ? "Regnbyger kan treffe området"
      : selected.icon === "sun"
        ? "Rolig og lettskyet"
        : "Skyene trekker inn";
</script>

<section class="weather-preview" aria-labelledby="preview-title">
  <div class="map-lines" aria-hidden="true"></div>
  <header>
    <div>
      <span class="eyebrow">Slik kan Værvakt føles</span>
      <h2 id="preview-title">Været rundt deg</h2>
    </div>
    <span class="demo-badge">Kun demodata</span>
  </header>

  <div class="weather-stage">
    <div class="current">
      <div class="location"><MapPin size={15} /> Oslo</div>
      <div class="temperature">
        <strong>{selected.temp}°</strong>
        <CloudSun size={58} strokeWidth={1.35} aria-hidden="true" />
      </div>
      <p>{status}</p>
      <span class="feels-like">Føles som {selected.temp - 1}°</span>
    </div>

    <div class="signal-card">
      <div class="signal-icon"><Umbrella size={20} /></div>
      <div>
        <span>Neste værsignal</span>
        <strong>Mulige byger rundt kl. 20</strong>
        <small>Lav sikkerhet · følg med utover kvelden</small>
      </div>
    </div>

    <div class="metrics">
      <div><Wind size={16} /><span>Vind</span><strong>3,2 m/s</strong></div>
      <div><Droplets size={16} /><span>Fuktighet</span><strong>68 %</strong></div>
      <div><Navigation size={16} /><span>Retning</span><strong>Sørvest</strong></div>
    </div>
  </div>

  <div class="timeline" aria-label="Demoprognose time for time">
    <div class="curve" aria-hidden="true"></div>
    {#each hours as hour, index}
      <button
        type="button"
        class:active={selectedIndex === index}
        on:click={() => (selectedIndex = index)}
        aria-pressed={selectedIndex === index}
      >
        <span>{hour.time}</span>
        <i class={`weather-dot ${hour.icon}`} aria-hidden="true"></i>
        <strong>{hour.temp}°</strong>
        <small class:wet={hour.rain >= 35}>{hour.rain} %</small>
      </button>
    {/each}
  </div>

  <footer>
    <span>Trykk på et tidspunkt for å utforske</span>
    <span>Eksempeldata · ikke et værvarsel</span>
  </footer>
</section>

<style>
  .weather-preview {
    position: relative;
    width: 100%;
    margin-top: 18px;
    padding: 28px;
    overflow: hidden;
    color: #f8fafc;
    border: 1px solid rgba(125, 211, 252, 0.12);
    border-radius: 25px;
    background:
      radial-gradient(circle at 75% 15%, rgba(56, 189, 248, 0.15), transparent 28%),
      linear-gradient(145deg, rgba(9, 22, 44, 0.96), rgba(4, 9, 24, 0.98));
    box-shadow: 0 28px 70px rgba(2, 6, 23, 0.2);
  }

  .map-lines {
    position: absolute;
    inset: -25%;
    pointer-events: none;
    opacity: 0.14;
    background:
      repeating-radial-gradient(ellipse at 72% 30%, transparent 0 36px, #7dd3fc 37px 38px, transparent 39px 55px);
    transform: rotate(-9deg);
    mask-image: linear-gradient(90deg, transparent 20%, black, transparent);
  }

  header, footer {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .eyebrow {
    color: #7dd3fc;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  h2 {
    margin: 5px 0 0;
    font-size: clamp(1.2rem, 3vw, 1.55rem);
    letter-spacing: -0.03em;
  }

  .demo-badge {
    padding: 6px 9px;
    color: rgba(226, 232, 240, 0.62);
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 999px;
    background: rgba(2, 6, 23, 0.36);
    font-size: 0.62rem;
    font-weight: 750;
  }

  .weather-stage {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 12px;
    margin: 22px 0 20px;
  }

  .current {
    grid-row: span 2;
    padding: 21px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.045);
    backdrop-filter: blur(12px);
  }

  .location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #bae6fd;
    font-size: 0.73rem;
    font-weight: 750;
  }

  .temperature {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 13px;
    color: #7dd3fc;
  }

  .temperature strong {
    color: white;
    font-size: clamp(3.4rem, 8vw, 5.25rem);
    font-weight: 560;
    line-height: 0.95;
    letter-spacing: -0.08em;
  }

  .current p {
    margin: 16px 0 3px;
    color: #f8fafc;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .feels-like {
    color: rgba(226, 232, 240, 0.45);
    font-size: 0.67rem;
  }

  .signal-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border: 1px solid rgba(251, 191, 36, 0.13);
    border-radius: 17px;
    background: linear-gradient(100deg, rgba(245, 158, 11, 0.1), rgba(255, 255, 255, 0.025));
  }

  .signal-icon {
    display: grid;
    width: 39px;
    height: 39px;
    flex: 0 0 auto;
    place-items: center;
    color: #fbbf24;
    border-radius: 12px;
    background: rgba(245, 158, 11, 0.11);
  }

  .signal-card span, .signal-card small {
    display: block;
    color: rgba(226, 232, 240, 0.46);
    font-size: 0.61rem;
  }

  .signal-card strong {
    display: block;
    margin: 3px 0;
    font-size: 0.76rem;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .metrics div {
    display: flex;
    min-width: 0;
    padding: 11px 8px;
    flex-direction: column;
    gap: 4px;
    color: #7dd3fc;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.035);
  }

  .metrics span {
    color: rgba(226, 232, 240, 0.42);
    font-size: 0.57rem;
  }

  .metrics strong {
    color: #f8fafc;
    font-size: 0.67rem;
  }

  .timeline {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    padding: 11px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 18px;
    background: rgba(2, 6, 23, 0.42);
  }

  .timeline button {
    position: relative;
    z-index: 1;
    display: flex;
    min-width: 0;
    padding: 10px 5px;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    color: rgba(226, 232, 240, 0.46);
    border: 0;
    border-radius: 13px;
    background: transparent;
    cursor: pointer;
    transition: background 180ms ease, transform 180ms ease;
  }

  .timeline button:hover, .timeline button.active {
    color: white;
    background: rgba(125, 211, 252, 0.09);
    transform: translateY(-2px);
  }

  .timeline button span, .timeline button small {
    font-size: 0.59rem;
  }

  .timeline button strong {
    color: #f8fafc;
    font-size: 0.78rem;
  }

  .timeline button small {
    color: #7dd3fc;
  }

  .timeline button small.wet {
    color: #fbbf24;
  }

  .weather-dot {
    display: block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #fcd34d;
    box-shadow: 0 0 17px rgba(252, 211, 77, 0.45);
  }

  .weather-dot.cloud {
    background: #94a3b8;
    box-shadow: 7px 2px 0 -3px #cbd5e1;
  }

  .weather-dot.rain {
    background: #60a5fa;
    box-shadow: 4px 8px 0 -5px #7dd3fc, -3px 8px 0 -5px #7dd3fc;
  }

  .weather-dot.moon {
    background: #c4b5fd;
    box-shadow: -5px -2px 0 0 #0b1730;
  }

  footer {
    margin-top: 10px;
    color: rgba(226, 232, 240, 0.35);
    font-size: 0.58rem;
  }

  @media (max-width: 680px) {
    .weather-preview { padding: 20px 14px; }
    .weather-stage { grid-template-columns: 1fr; }
    .current { grid-row: auto; }
    .timeline { overflow-x: auto; grid-template-columns: repeat(6, minmax(68px, 1fr)); }
  }
</style>
