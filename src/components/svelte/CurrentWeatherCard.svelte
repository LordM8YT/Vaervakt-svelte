<script>
  import { MapPin, Radio } from "@lucide/svelte";
  import { getDayMonthFromDate } from "../../utilities/DatetimeUtils";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let data;
  export let updatedAt = null;

  const dayMonth = getDayMonthFromDate();
  $: updatedTime = Number.isFinite(Number(updatedAt))
    ? new Intl.DateTimeFormat("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(Number(updatedAt)))
    : "";
</script>

<article class="weather-panel current-panel">
  <header class="section-heading heading-with-meta">
    <span>Været nå</span>
    <small class="live-weather">
      <Radio size={13} />
      {updatedTime ? `MET · oppdatert ${updatedTime}` : "MET"}
    </small>
  </header>
  <div class="current-weather">
    <div class="current-hero-copy">
      <span class="hero-location"><MapPin size={15} /> {data.city}</span>
      <div class="hero-temperature">
        <strong>{formatTemperature(data.main.temp)}°</strong>
        <div>
          <span>{data.weather[0].description}</span>
          <small>Føles som {formatTemperature(data.main.feels_like)}° · I dag {dayMonth}</small>
        </div>
      </div>
    </div>
    <div class="current-icon weather-orb">
      <WeatherIcon
        code={data.weather[0].icon}
        label={data.weather[0].description}
        size={78}
        strokeWidth={1.45}
      />
    </div>
  </div>
</article>
