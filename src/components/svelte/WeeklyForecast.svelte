<script>
  import { ChevronDown, Cloud, Droplets, Thermometer, Wind } from "@lucide/svelte";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let data;
  export let hourlyForecastByDate = {};

  let expandedDate = null;

  function formatDay(dateValue, index) {
    if (index === 0) return "I dag";
    if (index === 1) return "I morgen";
    return new Intl.DateTimeFormat("nb-NO", { weekday: "long" }).format(
      new Date(`${dateValue}T12:00:00`)
    );
  }

  function toggleDay(date) {
    if (!hourlyForecastByDate[date]?.length) return;
    expandedDate = expandedDate === date ? null : date;
  }
</script>

<section class="weather-panel weekly-panel" aria-label="Været de neste dagene">
  <header class="section-heading">
    <span>Neste dager</span>
  </header>

  {#if data?.list?.length}
    <div class="weekly-list">
      {#each data.list as item, index}
        <div class="day-entry" class:expandable={Boolean(hourlyForecastByDate[item.date]?.length)}>
          <button
            class="day-row"
            class:expanded={expandedDate === item.date}
            type="button"
            disabled={!hourlyForecastByDate[item.date]?.length}
            aria-expanded={hourlyForecastByDate[item.date]?.length ? expandedDate === item.date : undefined}
            aria-controls={hourlyForecastByDate[item.date]?.length ? `hours-${item.date}` : undefined}
            on:click={() => toggleDay(item.date)}
          >
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
            {#if hourlyForecastByDate[item.date]?.length}
              <ChevronDown class="day-chevron" size={18} aria-hidden="true" />
            {/if}
          </button>

          {#if expandedDate === item.date}
            <div class="day-hourly" id={`hours-${item.date}`}>
              <div class="day-hourly-heading">
                <strong>12-timersvarsel</strong>
                <span>Dra sidelengs for å se alle</span>
              </div>
              <div class="hourly-grid day-hourly-grid" aria-label={`Timevarsel for ${formatDay(item.date, index)}`}>
                {#each hourlyForecastByDate[item.date] as hour}
                  <div class="hour-card">
                    <time>{hour.time}</time>
                    <WeatherIcon code={hour.icon} label={hour.description} size={35} strokeWidth={1.7} />
                    <strong>{hour.temperature.replace(" °C", "°")}</strong>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="empty-inline">Ingen langtidsvarsel tilgjengelig.</p>
  {/if}
</section>
