<script>
  import { Cloud, Droplets, Thermometer, Wind } from "@lucide/svelte";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let data;

  function formatDay(dateValue, index) {
    if (index === 0) return "I dag";
    if (index === 1) return "I morgen";
    return new Intl.DateTimeFormat("nb-NO", { weekday: "long" }).format(
      new Date(`${dateValue}T12:00:00`)
    );
  }
</script>

<section class="weather-panel weekly-panel" aria-label="Været de neste dagene">
  <header class="section-heading">
    <span>Neste dager</span>
  </header>

  {#if data?.list?.length}
    <div class="weekly-list">
      {#each data.list as item, index}
        <article class="day-row">
          <div class="day-summary">
            <strong>{formatDay(item.date, index)}</strong>
            <span>
              <WeatherIcon code={item.icon} size={25} strokeWidth={1.7} />
              <em>{item.description}</em>
            </span>
          </div>
          <div class="day-metrics">
            <span title="Temperatur"><Thermometer size={15} /> {formatTemperature(item.temp)}°</span>
            <span title="Skydekke"><Cloud size={15} /> {item.clouds} %</span>
            <span title="Vind"><Wind size={15} /> {item.wind} m/s</span>
            <span title="Fuktighet"><Droplets size={15} /> {item.humidity} %</span>
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <p class="empty-inline">Ingen langtidsvarsel tilgjengelig.</p>
  {/if}
</section>
