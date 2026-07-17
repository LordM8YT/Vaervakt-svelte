<script>
  import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudMoon,
    CloudRain,
    CloudSun,
    Droplets,
    Footprints,
    IceCreamBowl,
    Mountain,
    Moon,
    Rainbow,
    Snowflake,
    Sun,
    Sunset,
    Waves,
    Wind,
  } from "@lucide/svelte";

  export let code = "";
  export let kind = "";
  export let label = "";
  export let size = 24;
  export let strokeWidth = 1.8;

  const icons = {
    "01d": Sun,
    "01n": Moon,
    "02d": CloudSun,
    "02n": CloudMoon,
    "03d": Cloud,
    "03n": Cloud,
    "04d": Cloud,
    "04n": Cloud,
    "09d": CloudDrizzle,
    "09n": CloudDrizzle,
    "10d": CloudRain,
    "10n": CloudRain,
    "11d": CloudLightning,
    "11n": CloudLightning,
    "13d": Snowflake,
    "13n": Snowflake,
    "50d": CloudFog,
    "50n": CloudFog,
    sun: Sun,
    clear: Sun,
    rain: CloudRain,
    cloudy: Cloud,
    "partly-cloudy": CloudSun,
    snow: Snowflake,
    hail: IceCreamBowl,
    wind: Wind,
    fog: CloudFog,
    slippery: Snowflake,
    thunder: CloudLightning,
    rainbow: Rainbow,
    sunset: Sunset,
    water: Waves,
    beach: Waves,
    outdoor: Footprints,
    humidity: Droplets,
    mountain: Mountain,
  };

  $: normalizedCode = String(code || "").replace(".png", "");
  $: iconKey = kind || normalizedCode;
  $: Icon = icons[iconKey] || CloudSun;
</script>

<span class="weather-icon" data-kind={iconKey} title={label || undefined}>
  <Icon {size} {strokeWidth} aria-hidden={label ? undefined : "true"} aria-label={label || undefined} />
</span>

<style>
  .weather-icon {
    display: inline-grid;
    flex: 0 0 auto;
    place-items: center;
    color: #bae6fd;
    filter: drop-shadow(0 8px 14px rgba(56, 189, 248, 0.16));
    line-height: 0;
  }

  .weather-icon[data-kind="01d"],
  .weather-icon[data-kind="sun"],
  .weather-icon[data-kind="clear"],
  .weather-icon[data-kind="sunset"] {
    color: #fbbf24;
  }

  .weather-icon[data-kind="01n"] {
    color: #c4b5fd;
  }

  .weather-icon[data-kind^="11"],
  .weather-icon[data-kind="thunder"] {
    color: #fde68a;
  }

  .weather-icon[data-kind^="13"],
  .weather-icon[data-kind="snow"],
  .weather-icon[data-kind="slippery"],
  .weather-icon[data-kind="hail"] {
    color: #e0f2fe;
  }

  .weather-icon[data-kind="rainbow"] {
    color: #f9a8d4;
  }
</style>
