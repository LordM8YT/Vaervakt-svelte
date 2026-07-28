<script>
  import {
    Check,
    Clock3,
    Droplets,
    ShieldCheck,
    SunMedium,
    Thermometer,
    TriangleAlert,
    Wind,
  } from "@lucide/svelte";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import CurrentWeatherCard from "./CurrentWeatherCard.svelte";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let data;
  export let forecastList = [];
  export let updatedAt = null;

  let forecastWindow = 12;

  $: uvIndex =
    data?.main?.uvIndex == null ? null : Number(data.main.uvIndex);
  $: windSpeed = Number(data?.wind?.speed ?? 0);
  $: currentTemperature = Number(data?.main?.temp ?? 0);
  $: weatherDescription = String(data?.weather?.[0]?.description ?? "").toLowerCase();
  $: hasHazardousWeather =
    windSpeed >= 17 ||
    currentTemperature <= -18 ||
    weatherDescription.includes("torden") ||
    weatherDescription.includes("kraftig");
  $: hasCautionWeather =
    !hasHazardousWeather &&
    (windSpeed >= 10 ||
      currentTemperature <= -10 ||
      weatherDescription.includes("regn") ||
      weatherDescription.includes("snø"));
  $: safetyTone = hasHazardousWeather ? "danger" : hasCautionWeather ? "caution" : "safe";
  $: safetyTitle = hasHazardousWeather
    ? "Vær ekstra forsiktig"
    : hasCautionWeather
      ? "Følg med på været"
      : "Rolige forhold nå";
  $: safetyText = hasHazardousWeather
    ? `Krevende forhold i ${data.city}. Sjekk vind og nedbør før du drar.`
    : hasCautionWeather
      ? `Forholdene kan endre seg i ${data.city}. Se timevarselet før aktivitet.`
      : `Ingen tydelige værfarer registrert i ${data.city} akkurat nå.`;
  $: visibleForecast =
    forecastWindow === 0 ? forecastList : forecastList.slice(0, forecastWindow);

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
  <article class={`weather-status weather-status--${safetyTone}`} aria-live="polite">
    <div class="weather-status-icon" aria-hidden="true">
      {#if safetyTone === "safe"}
        <ShieldCheck size={24} />
      {:else}
        <TriangleAlert size={24} />
      {/if}
    </div>
    <div class="weather-status-copy">
      <span>Værvakt-status</span>
      <strong>{safetyTitle}</strong>
      <p>{safetyText}</p>
    </div>
    <div class="weather-status-signal">
      {#if safetyTone === "safe"}
        <Check size={15} />
      {:else}
        <Clock3 size={15} />
      {/if}
      Nå
    </div>
  </article>

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
      <div class="forecast-window" aria-label="Velg tidsrom">
        <button
          type="button"
          class:active={forecastWindow === 6}
          aria-pressed={forecastWindow === 6}
          on:click={() => (forecastWindow = 6)}>6 t</button
        >
        <button
          type="button"
          class:active={forecastWindow === 12}
          aria-pressed={forecastWindow === 12}
          on:click={() => (forecastWindow = 12)}>12 t</button
        >
        <button
          type="button"
          class:active={forecastWindow === 0}
          aria-pressed={forecastWindow === 0}
          on:click={() => (forecastWindow = 0)}>Alle</button
        >
      </div>
    </header>
    {#if forecastList.length}
      <div class="hourly-grid" use:dragScroll>
        {#each visibleForecast as item}
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
