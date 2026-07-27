<script>
  import { Droplets, SunMedium, Thermometer, Wind } from "@lucide/svelte";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import CurrentWeatherCard from "./CurrentWeatherCard.svelte";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let data;
  export let forecastList = [];
  export let updatedAt = null;

  $: uvIndex =
    data?.main?.uvIndex == null ? null : Number(data.main.uvIndex);

  // Lets the hourly strip be scrolled by dragging with a mouse.
  // Touch/pen are left alone so the browser's native touch scrolling
  // (momentum, etc.) handles it instead — hijacking it via pointer
  // capture is what made it stall on phones.
  function dragScroll(node) {
    let dragging = false;
    let startX = 0;
    let scrollStart = 0;

    function onPointerDown(e) {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      startX = e.clientX;
      scrollStart = node.scrollLeft;
      node.classList.add("is-dragging");
      node.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      node.scrollLeft = scrollStart - (e.clientX - startX);
    }

    function endDrag() {
      dragging = false;
      node.classList.remove("is-dragging");
    }

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", endDrag);
    node.addEventListener("pointerleave", endDrag);
    node.addEventListener("pointercancel", endDrag);

    return {
      destroy() {
        node.removeEventListener("pointerdown", onPointerDown);
        node.removeEventListener("pointermove", onPointerMove);
        node.removeEventListener("pointerup", endDrag);
        node.removeEventListener("pointerleave", endDrag);
        node.removeEventListener("pointercancel", endDrag);
      },
    };
  }
</script>

<section class="weather-column" aria-label="Været i dag">
  <CurrentWeatherCard {data} {updatedAt} />

  <article class="weather-panel">
    <header class="section-heading">
      <span>Detaljer</span>
    </header>
    <div class="metrics-grid">
      <div class="metric">
        <Thermometer size={19} aria-hidden="true" />
        <span>Føles som</span>
        <strong>{formatTemperature(data.main.feels_like)}°</strong>
      </div>
      <div class="metric">
        <Wind size={19} aria-hidden="true" />
        <span>Vind</span>
        <strong>{data.wind.speed} m/s</strong>
      </div>
      <div class="metric">
        <SunMedium size={19} aria-hidden="true" />
        <span>UV-indeks</span>
        <strong>
          {Number.isFinite(uvIndex)
            ? uvIndex.toFixed(1).replace(".", ",")
            : "–"}
        </strong>
      </div>
      <div class="metric">
        <Droplets size={19} aria-hidden="true" />
        <span>Fuktighet</span>
        <strong>{Math.round(data.main.humidity)} %</strong>
      </div>
    </div>
  </article>

  <article class="weather-panel">
    <header class="section-heading heading-with-meta">
      <span>Time for time</span>
      <small>{forecastList.length} timevarsler</small>
    </header>
    {#if forecastList.length}
      <div class="hourly-grid" use:dragScroll>
        {#each forecastList as item}
          <div class="hour-card">
            <time>{item.time}</time>
            <WeatherIcon code={item.icon} size={35} strokeWidth={1.7} />
            <strong>{item.temperature.replace(" °C", "°")}</strong>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-inline">Ingen flere timevarsler tilgjengelig akkurat nå.</p>
    {/if}
  </article>
</section>
