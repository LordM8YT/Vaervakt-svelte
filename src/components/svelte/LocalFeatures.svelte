<script>
  import { onMount } from "svelte";
  import {
    BadgeCheck,
    CheckCircle2,
    Clock3,
    CloudRain,
    Droplets,
    Flag,
    Gauge,
    LoaderCircle,
    MapPin,
    MessageSquareText,
    RadioTower,
    RefreshCw,
    Send,
    Thermometer,
    Waves,
    Wifi,
    WifiOff,
    Wind,
    X,
  } from "@lucide/svelte";
  import {
    fetchBathTemperatures,
    fetchReports,
    fetchStations,
    flagReport,
    submitBathTemperature,
    submitReport,
  } from "../../api/VaervaktApi";
  import {
    formatStationAge,
    latestStationUpdatedAt,
    stationUpdatedAt,
  } from "../../utilities/StationUtils";
  import { formatTemperature } from "../../utilities/TemperatureUtils";
  import WeatherIcon from "./WeatherIcon.svelte";
  import BathLocationSearch from "./BathLocationSearch.svelte";

  export let selectedLocation;
  export let weather;
  export let activeTab = "local";
  export let refreshKey = 0;
  export let onOpenPrivacy = () => {};

  const VIPPS_URL = "https://betal.vipps.no/opy01u";
  const BATH_POI_CACHE_KEY = "vaervakt_bath_poi_cache_v1";
  const BATH_POI_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;
  const BATH_POI_CACHE_MAX_LOCATIONS = 8;
  const REPORT_RANGE_OPTIONS = [
    { hours: 6, label: "6 timer" },
    { hours: 24, label: "24 timer" },
    { hours: 168, label: "7 dager" },
  ];
  const CONDITIONS = [
    { value: "Sol / Klart", label: "Sol", kind: "sun" },
    { value: "Delvis skyet", label: "Delvis skyet", kind: "partly-cloudy" },
    { value: "Skyet", label: "Skyet", kind: "cloudy" },
    { value: "Regn", label: "Regn", kind: "rain" },
    { value: "Snø", label: "Snø", kind: "snow" },
    { value: "Torden", label: "Torden", kind: "thunder" },
  ];
  const REPORT_FLAG_REASONS = [
    { value: "inaccurate", label: "Feil værdata" },
    { value: "spam", label: "Spam eller reklame" },
    { value: "abusive", label: "Upassende innhold" },
    { value: "privacy", label: "Personopplysninger" },
    { value: "other", label: "Annet" },
  ];

  function getBathPoiCacheLocationKey(lat, lon) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
    return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  }

  function sanitizeBathPoi(item) {
    if (!item || typeof item !== "object") return null;
    const name = String(item.name || "").trim().slice(0, 160);
    const temperature =
      item.temperature === null ||
      item.temperature === undefined ||
      item.temperature === ""
        ? null
        : Number(item.temperature);
    const distanceKm =
      item.distanceKm === null ||
      item.distanceKm === undefined ||
      item.distanceKm === ""
        ? null
        : Number(item.distanceKm);
    const latitude =
      item.lat === null || item.lat === undefined || item.lat === ""
        ? null
        : Number(item.lat);
    const longitude =
      item.lon === null || item.lon === undefined || item.lon === ""
        ? null
        : Number(item.lon);
    if (!name || !Number.isFinite(temperature)) return null;

    return {
      locationId: String(item.locationId || "").trim().slice(0, 64),
      name,
      municipality: String(item.municipality || "").trim().slice(0, 120),
      county: String(item.county || "").trim().slice(0, 120),
      temperature,
      lat: latitude !== null && Number.isFinite(latitude) ? latitude : null,
      lon: longitude !== null && Number.isFinite(longitude) ? longitude : null,
      distanceKm: distanceKm !== null && Number.isFinite(distanceKm) ? distanceKm : null,
      time: String(item.time || "").trim().slice(0, 40),
      heatedWater: Boolean(item.heatedWater),
    };
  }

  function readBathPoiCache(lat, lon) {
    const locationKey = getBathPoiCacheLocationKey(lat, lon);
    if (!locationKey) return [];

    try {
      const cache = JSON.parse(window.localStorage.getItem(BATH_POI_CACHE_KEY) || "{}");
      const now = Date.now();
      Object.entries(cache).forEach(([key, value]) => {
        const cachedAt = Number(value?.storedAt);
        const cachedAge = now - cachedAt;
        if (
          !Number.isFinite(cachedAt) ||
          cachedAge < 0 ||
          cachedAge > BATH_POI_CACHE_MAX_AGE_MS ||
          !Array.isArray(value?.items)
        ) {
          delete cache[key];
        }
      });
      if (Object.keys(cache).length > 0) {
        window.localStorage.setItem(BATH_POI_CACHE_KEY, JSON.stringify(cache));
      } else {
        window.localStorage.removeItem(BATH_POI_CACHE_KEY);
      }
      const entry = cache[locationKey];
      if (!entry) return [];
      return Array.isArray(entry.items)
        ? entry.items.map(sanitizeBathPoi).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  function writeBathPoiCache(lat, lon, items) {
    const locationKey = getBathPoiCacheLocationKey(lat, lon);
    if (!locationKey || !Array.isArray(items)) return;

    try {
      const sanitizedItems = items.map(sanitizeBathPoi).filter(Boolean);
      const cache = JSON.parse(window.localStorage.getItem(BATH_POI_CACHE_KEY) || "{}");
      cache[locationKey] = { storedAt: Date.now(), items: sanitizedItems };
      const newestEntries = Object.entries(cache)
        .filter(([, entry]) => Array.isArray(entry?.items))
        .sort(([, first], [, second]) => Number(second.storedAt) - Number(first.storedAt))
        .slice(0, BATH_POI_CACHE_MAX_LOCATIONS);
      window.localStorage.setItem(
        BATH_POI_CACHE_KEY,
        JSON.stringify(Object.fromEntries(newestEntries))
      );
    } catch {
      // POI-ene hentes fortsatt fra nettet når lokal lagring er blokkert.
    }
  }

  function normalizeTemp(value) {
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getWeatherSummary(value) {
    return value?.weather?.[0]?.description || "";
  }

  function getWeatherTemp(value) {
    const temp = Number(value?.main?.temp);
    return Number.isFinite(temp) ? Number(temp.toFixed(1)) : "";
  }

  function conditionKind(condition = "") {
    const normalized = condition.toLowerCase();
    if (normalized.includes("torden") || normalized.includes("lyn")) return "thunder";
    if (normalized.includes("snø") || normalized.includes("sludd")) return "snow";
    if (normalized.includes("regn") || normalized.includes("byge")) return "rain";
    if (normalized.includes("delvis") || normalized.includes("lettskyet")) {
      return "partly-cloudy";
    }
    if (normalized.includes("sky")) return "cloudy";
    if (normalized.includes("klart") || normalized.includes("sol")) return "sun";
    return "partly-cloudy";
  }

  function getReportConditionFromWeather(value) {
    const kind = conditionKind(getWeatherSummary(value));
    return CONDITIONS.find((condition) => condition.kind === kind)?.value || "";
  }

  function formatStationMetric(value, maximumFractionDigits = 1) {
    if (value === null || value === undefined || value === "") return "–";
    const number = Number(value);
    if (!Number.isFinite(number)) return "–";
    return new Intl.NumberFormat("nb-NO", {
      maximumFractionDigits,
    }).format(number);
  }

  function formatDistance(value) {
    if (value === null || value === undefined || value === "") return "";
    const distance = Number(value);
    if (!Number.isFinite(distance)) return "";
    if (distance < 1) return `${Math.max(1, Math.round(distance * 1000))} m unna`;
    return `${distance.toFixed(1).replace(".", ",")} km unna`;
  }

  function formatBathTime(value) {
    if (!value) return "Nylig registrert";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "Nylig registrert";
    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  let reports = [];
  let stations = [];
  let flaggingReportId = null;
  let flaggedReportIds = [];
  let isLoading = false;
  let isReportSubmitting = false;
  let notice = null;
  let reportForm = {
    username: "",
    temperature: "",
    condition: "",
  };
  let reportRangeHours = 24;
  let reportMeta = { total: 0, displayed: 0 };
  let stationMeta = { total: 0, displayed: 0 };
  let stationLoadFailed = false;
  let bathForm = {
    name: "",
    locationId: "",
    regionName: "",
    lat: null,
    lon: null,
    temperature: "",
    heatedWater: false,
  };
  let bathTemperatures = [];
  let isBathLoading = false;
  let isBathSubmitting = false;
  let mounted = false;
  let previousRefreshSignature = "";
  let previousForecastSignature = "";
  let loadSequence = 0;
  let bathFormElement;

  $: location = {
    name: selectedLocation?.name || "Valgt sted",
    lat: selectedLocation?.lat,
    lon: selectedLocation?.lon,
    source: selectedLocation?.source || "none",
  };
  $: latNumber = Number(location.lat);
  $: lonNumber = Number(location.lon);
  $: hasCoordinates = Number.isFinite(latNumber) && Number.isFinite(lonNumber);
  $: onlineStationCount = stations.filter((station) => station.online).length;
  $: latestStationTime = latestStationUpdatedAt(stations);
  $: selectedReportRange =
    REPORT_RANGE_OPTIONS.find((option) => option.hours === reportRangeHours)?.label ||
    "valgt tidsrom";
  $: isInitialLocalLoad =
    isLoading && stations.length === 0 && reports.length === 0;
  $: refreshSignature = [
    location.name,
    location.lat,
    location.lon,
    refreshKey,
    activeTab,
    reportRangeHours,
  ].join("|");
  $: if (mounted && refreshSignature !== previousRefreshSignature) {
    previousRefreshSignature = refreshSignature;
    refreshLocalData();
  }
  $: forecastSignature = [
    location.source,
    location.lat,
    location.lon,
    getWeatherTemp(weather),
    getWeatherSummary(weather),
  ].join("|");
  $: if (
    mounted &&
    location.source === "gps" &&
    forecastSignature !== previousForecastSignature
  ) {
    previousForecastSignature = forecastSignature;
    const forecastTemperature = getWeatherTemp(weather);
    const forecastCondition = getReportConditionFromWeather(weather);
    reportForm = {
      ...reportForm,
      temperature:
        reportForm.temperature === "" && forecastTemperature !== ""
          ? String(forecastTemperature)
          : reportForm.temperature,
      condition:
        reportForm.condition === "" && forecastCondition
          ? forecastCondition
          : reportForm.condition,
    };
  }

  onMount(() => {
    mounted = true;
  });

  async function refreshLocalData() {
    const loadId = ++loadSequence;
    const cachedBathItems =
      activeTab === "bath" && hasCoordinates
        ? readBathPoiCache(location.lat, location.lon)
        : [];
    isLoading = activeTab === "local";
    isBathLoading =
      activeTab === "bath" && hasCoordinates && cachedBathItems.length === 0;
    if (activeTab === "bath" && cachedBathItems.length > 0) {
      bathTemperatures = cachedBathItems;
    }

    const reportRequest =
      activeTab === "local"
        ? fetchReports(location, { maxAgeHours: reportRangeHours })
        : Promise.resolve({ reports: [], total: 0, displayed: 0 });
    const bathRequest =
      activeTab === "bath" && hasCoordinates
        ? fetchBathTemperatures(location)
        : Promise.resolve({ bathing: { nearby: [] } });
    const stationRequest =
      activeTab === "local" && hasCoordinates
        ? fetchStations(location, { limit: 8, radiusKm: 35 })
        : Promise.resolve({ stations: [], total: 0, count: 0 });
    const [reportResult, bathResult, stationResult] = await Promise.allSettled([
      reportRequest,
      bathRequest,
      stationRequest,
    ]);
    if (loadId !== loadSequence) return;

    if (reportResult.status === "fulfilled") {
      reports = reportResult.value.reports || [];
      const total = Number(reportResult.value.total);
      const displayed = Number(reportResult.value.displayed);
      reportMeta = {
        total: Number.isFinite(total) ? total : reports.length,
        displayed: Number.isFinite(displayed) ? displayed : reports.length,
      };
    }

    if (bathResult.status === "fulfilled") {
      bathTemperatures = bathResult.value?.bathing?.nearby || [];
      if (activeTab === "bath" && hasCoordinates) {
        writeBathPoiCache(location.lat, location.lon, bathTemperatures);
      }
    } else if (activeTab === "bath") {
      bathTemperatures = cachedBathItems;
    }

    if (stationResult.status === "fulfilled") {
      stations = Array.isArray(stationResult.value.stations)
        ? stationResult.value.stations
        : [];
      const total = Number(stationResult.value.total);
      const displayed = Number(stationResult.value.count);
      stationMeta = {
        total: Number.isFinite(total) ? total : stations.length,
        displayed: Number.isFinite(displayed) ? displayed : stations.length,
      };
      stationLoadFailed = false;
    } else if (activeTab === "local") {
      stationLoadFailed = true;
    }

    const requestedResult = activeTab === "bath" ? bathResult : reportResult;
    if (requestedResult.status === "rejected") {
      notice = {
        severity: "warning",
        text:
          activeTab === "bath"
            ? cachedBathItems.length > 0
              ? "Kunne ikke oppdatere nå. Viser lagrede badeplasser fra de siste 12 timene."
              : "Badetemperaturene kunne ikke lastes akkurat nå."
            : "Lokale rapporter kunne ikke lastes akkurat nå.",
      };
    } else if (notice?.severity === "warning") {
      notice = null;
    }

    isLoading = false;
    isBathLoading = false;
  }

  function fillReportFromForecast() {
    const temperature = getWeatherTemp(weather);
    const condition = getReportConditionFromWeather(weather);
    if (temperature === "" || !condition) {
      notice = { severity: "info", text: "Fant ikke nok værdata til å fylle ut rapporten." };
      return;
    }
    reportForm = { ...reportForm, temperature: String(temperature), condition };
  }

  async function handleReportSubmit() {
    if (isReportSubmitting) return;
    const temperature = normalizeTemp(reportForm.temperature);
    if (temperature === null || !reportForm.condition) {
      notice = { severity: "info", text: "Skriv temperatur og værtype før du sender." };
      return;
    }
    if (temperature < -60 || temperature > 60) {
      notice = { severity: "info", text: "Temperaturen må være mellom -60 og 60 grader." };
      return;
    }
    if (!hasCoordinates) {
      notice = { severity: "info", text: "Søk opp stedet eller bruk posisjonen din først." };
      return;
    }

    try {
      isReportSubmitting = true;
      window.navigator.vibrate?.(12);
      await submitReport({
        username: reportForm.username.trim() || "Anonym",
        temperature,
        condition: reportForm.condition,
        location: location.name,
        lat: location.lat,
        lon: location.lon,
      });
      reportForm = { username: "", temperature: "", condition: "" };
      notice = { severity: "success", text: "Rapporten er sendt. Takk!" };
      await refreshLocalData();
    } catch (error) {
      notice = { severity: "error", text: error.message };
    } finally {
      isReportSubmitting = false;
    }
  }

  async function handleFlagReport(reportId, reason) {
    if (flaggedReportIds.includes(reportId)) return;

    try {
      flaggingReportId = reportId;
      const result = await flagReport(reportId, reason);
      flaggedReportIds = [...flaggedReportIds, reportId];
      notice = {
        severity: "success",
        text: result.message || "Takk. Rapporten er sendt til vurdering.",
      };
      if (result.hidden) {
        reports = reports.filter((report) => report.id !== reportId);
        reportMeta = {
          ...reportMeta,
          total: Math.max(0, reportMeta.total - 1),
          displayed: Math.max(0, reportMeta.displayed - 1),
        };
      }
    } catch (error) {
      notice = { severity: "error", text: error.message };
    } finally {
      flaggingReportId = null;
    }
  }

  async function handleBathSubmit() {
    const temperature = normalizeTemp(bathForm.temperature);
    const name = bathForm.name.trim();
    if (!bathForm.locationId || !name) {
      notice = {
        severity: "info",
        text: "Søk og velg en godkjent badeplass fra Yr-listen før du sender.",
      };
      return;
    }
    if (temperature === null || temperature < -2 || temperature > 45) {
      notice = {
        severity: "info",
        text: "Badetemperaturen må være mellom -2 og 45 grader.",
      };
      return;
    }
    const bathLatitude = Number(bathForm.lat);
    const bathLongitude = Number(bathForm.lon);
    if (!Number.isFinite(bathLatitude) || !Number.isFinite(bathLongitude)) {
      notice = {
        severity: "info",
        text: "Yr-treffet mangler koordinater. Søk og velg badeplassen på nytt.",
      };
      return;
    }

    try {
      isBathSubmitting = true;
      window.navigator.vibrate?.(10);
      const result = await submitBathTemperature({
        locationId: bathForm.locationId,
        name,
        temperature,
        lat: bathLatitude,
        lon: bathLongitude,
        heatedWater: bathForm.heatedWater,
      });
      bathForm = {
        name: "",
        locationId: "",
        regionName: "",
        lat: null,
        lon: null,
        temperature: "",
        heatedWater: false,
      };
      notice = {
        severity: "success",
        text: result.message || "Badetemperaturen er sendt til Yr.",
      };
      await refreshLocalData();
    } catch (error) {
      notice = { severity: "error", text: error.message };
    } finally {
      isBathSubmitting = false;
    }
  }

  function handleBathLocationChange(name) {
    bathForm = {
      ...bathForm,
      name,
      locationId: "",
      regionName: "",
      lat: null,
      lon: null,
    };
  }

  function handleBathLocationSelect(locationOption) {
    const latitude = Number(locationOption?.lat);
    const longitude = Number(locationOption?.lon);
    bathForm = {
      ...bathForm,
      name: String(locationOption?.name || ""),
      locationId: String(locationOption?.locationId || ""),
      regionName: String(locationOption?.regionName || ""),
      lat: Number.isFinite(latitude) ? latitude : null,
      lon: Number.isFinite(longitude) ? longitude : null,
    };
    notice = null;
  }

  function chooseNearbyBath(bath) {
    if (!bath?.locationId) {
      notice = {
        severity: "info",
        text: "Denne lagrede målingen mangler Yr-ID. Søk etter badeplassen i skjemaet.",
      };
      return;
    }

    handleBathLocationSelect({
      locationId: bath.locationId,
      name: bath.name,
      regionName: [bath.municipality, bath.county].filter(Boolean).join(", "),
      lat: bath.lat,
      lon: bath.lon,
    });
    window.setTimeout(
      () => bathFormElement?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50
    );
  }
</script>

<section class="community-shell">
  {#if notice}
    <div class="notice notice-{notice.severity}" role="status">
      {#if notice.severity === "success"}
        <CheckCircle2 size={19} aria-hidden="true" />
      {:else}
        <WeatherIcon
          kind={notice.severity === "warning" ? "thunder" : "partly-cloudy"}
          size={19}
        />
      {/if}
      <span>{notice.text}</span>
      <button
        type="button"
        class="icon-button"
        on:click={() => (notice = null)}
        aria-label="Lukk beskjed"
      >
        <X size={17} />
      </button>
    </div>
  {/if}

  {#if activeTab === "local"}
    <article class="feature-panel">
      <header class="feature-header">
        <div>
          <span class="eyebrow">Lokalt fra Værvakt</span>
          <h2>Status nær {location.name}</h2>
          <p>
            {reportMeta.total} brukerrapporter · {stationMeta.total} godkjente værstasjoner
          </p>
        </div>
        <button
          class="pill-button"
          type="button"
          on:click={refreshLocalData}
          disabled={isLoading}
        >
          <RefreshCw size={15} class={isLoading ? "spin" : ""} />
          Oppdater
        </button>
      </header>

      <section
        class="area-summary"
        aria-label={`Samlet områdestatus for ${location.name}`}
        aria-busy={isInitialLocalLoad}
      >
        <article class="area-summary-card official">
          <div class="area-summary-icon">
            <WeatherIcon kind={conditionKind(getWeatherSummary(weather))} size={21} />
          </div>
          <div>
            <span>MET akkurat nå</span>
            <strong>{formatTemperature(getWeatherTemp(weather))}°</strong>
            <small>{getWeatherSummary(weather) || "Offisielt værvarsel"}</small>
          </div>
        </article>

        <article class="area-summary-card">
          <div class="area-summary-icon"><RadioTower size={20} aria-hidden="true" /></div>
          <div>
            <span>Værstasjoner</span>
            <strong>{isInitialLocalLoad ? "…" : onlineStationCount}</strong>
            <small>
              {stationLoadFailed
                ? "Status utilgjengelig"
                : `online av ${stationMeta.total} i området`}
            </small>
          </div>
        </article>

        <article class="area-summary-card">
          <div class="area-summary-icon">
            <MessageSquareText size={20} aria-hidden="true" />
          </div>
          <div>
            <span>Brukerrapporter</span>
            <strong>{isInitialLocalLoad ? "…" : reportMeta.total}</strong>
            <small>
              {reports[0]?.time
                ? `siste rapport ${reports[0].time}`
                : `siste ${selectedReportRange.toLowerCase()}`}
            </small>
          </div>
        </article>

        <article class="area-summary-card">
          <div class="area-summary-icon"><Clock3 size={20} aria-hidden="true" /></div>
          <div>
            <span>Siste måling</span>
            <strong>
              {isInitialLocalLoad
                ? "…"
                : latestStationTime
                  ? formatStationAge(latestStationTime)
                  : "Ingen ennå"}
            </strong>
            <small>{latestStationTime ? "automatisk værstasjon" : "i valgt område"}</small>
          </div>
        </article>
      </section>

      <section class="station-section" aria-labelledby="nearby-stations-title">
        <div class="local-section-heading">
          <div>
            <span class="eyebrow">Automatiske målinger</span>
            <h3 id="nearby-stations-title">Værstasjoner i området</h3>
            <p>Godkjente stasjoner innenfor 35 km, sortert etter avstand.</p>
          </div>
          <span class="source-chip">
            <BadgeCheck size={14} aria-hidden="true" />
            Verifisert kilde
          </span>
        </div>

        {#if isLoading && stations.length === 0}
          <div class="empty-state">
            <LoaderCircle class="spin" size={18} /> Laster værstasjoner…
          </div>
        {:else if stationLoadFailed && stations.length === 0}
          <div class="empty-state">
            Værstasjonene kunne ikke lastes akkurat nå.
          </div>
        {:else if stations.length === 0}
          <div class="empty-state">
            Ingen godkjente værstasjoner funnet innenfor 35 km.
          </div>
        {:else}
          <div class="station-grid">
            {#each stations as station}
              <article class="station-card" class:offline={!station.online}>
                <header>
                  <div class="icon-tile station-icon">
                    <RadioTower size={23} aria-hidden="true" />
                  </div>
                  <div class="station-heading-copy">
                    <strong>{station.name}</strong>
                    <span>
                      {[station.location, formatDistance(station.distanceKm)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <span
                    class="station-status"
                    class:online={station.online}
                    title={station.online
                      ? "Stasjonen har sendt data nylig"
                      : "Stasjonen har ikke sendt data nylig"}
                  >
                    {#if station.online}
                      <Wifi size={13} aria-hidden="true" /> Online
                    {:else}
                      <WifiOff size={13} aria-hidden="true" /> Offline
                    {/if}
                  </span>
                </header>

                <div class="station-reading">
                  <div>
                    <Thermometer size={17} aria-hidden="true" />
                    <strong>{formatTemperature(station.reading?.temperature)}°</strong>
                  </div>
                  <span>Oppdatert {formatStationAge(stationUpdatedAt(station))}</span>
                </div>

                <div class="station-metrics">
                  {#if station.reading?.humidity !== null && station.reading?.humidity !== undefined}
                    <span title="Luftfuktighet">
                      <Droplets size={14} aria-hidden="true" />
                      {formatStationMetric(station.reading.humidity, 0)} %
                    </span>
                  {/if}
                  {#if station.reading?.windSpeed !== null && station.reading?.windSpeed !== undefined}
                    <span title="Vindstyrke">
                      <Wind size={14} aria-hidden="true" />
                      {formatStationMetric(station.reading.windSpeed)} m/s
                    </span>
                  {/if}
                  {#if station.reading?.pressure !== null && station.reading?.pressure !== undefined}
                    <span title="Lufttrykk">
                      <Gauge size={14} aria-hidden="true" />
                      {formatStationMetric(station.reading.pressure, 0)} hPa
                    </span>
                  {/if}
                  {#if station.reading?.rainRate !== null && station.reading?.rainRate !== undefined}
                    <span title="Nedbør">
                      <CloudRain size={14} aria-hidden="true" />
                      {formatStationMetric(station.reading.rainRate)} mm/t
                    </span>
                  {/if}
                </div>

                <footer>
                  <span class="verified-station">
                    <BadgeCheck size={13} aria-hidden="true" />
                    Verifisert værstasjon
                  </span>
                  <span>Automatisk måling{station.provider ? ` · ${station.provider}` : ""}</span>
                </footer>
              </article>
            {/each}
          </div>
          {#if stationMeta.total > stationMeta.displayed}
            <p class="station-overflow">
              Viser de {stationMeta.displayed} nærmeste av {stationMeta.total} stasjoner.
            </p>
          {/if}
        {/if}
      </section>

      <div class="local-section-heading report-section-heading">
        <div>
          <span class="eyebrow">Fra brukere</span>
          <h3>Lokale værrapporter</h3>
          <p>
            {reportMeta.total} rapporter
            {reports[0]?.time ? ` · siste aktivitet ${reports[0].time}` : ""}
          </p>
        </div>
      </div>

      <div class="chip-row filter-row">
        <span>Tidsrom</span>
        {#each REPORT_RANGE_OPTIONS as option}
          <button
            class="chip"
            class:selected={reportRangeHours === option.hours}
            type="button"
            on:click={() => (reportRangeHours = option.hours)}
          >
            {option.label}
          </button>
        {/each}
      </div>

      <div class="feature-grid">
        <form class="feature-card report-form" on:submit|preventDefault={handleReportSubmit}>
          <div class="card-title">
            <div>
              <h3>Send værrapport</h3>
              <p>Rapporten knyttes til {location.name}.</p>
            </div>
            <Thermometer size={28} aria-hidden="true" />
          </div>

          <button class="text-button" type="button" on:click={fillReportFromForecast}>
            Fyll fra værvarselet
          </button>

          <label>
            <span>Visningsnavn (valgfritt)</span>
            <input
              maxlength="40"
              placeholder="Bruk gjerne et kallenavn"
              bind:value={reportForm.username}
              autocomplete="off"
            />
          </label>
          <div class="field-row">
            <label>
              <span>Temperatur</span>
              <input
                inputmode="decimal"
                min="-60"
                max="60"
                step="0.1"
                placeholder="12,5"
                bind:value={reportForm.temperature}
              />
            </label>
            <label>
              <span>Værtype</span>
              <select bind:value={reportForm.condition}>
                <option value="" disabled>Velg værtype</option>
                {#each CONDITIONS as condition}
                  <option value={condition.value}>{condition.label}</option>
                {/each}
              </select>
            </label>
          </div>
          <p class="privacy-inline">
            Publiseres i 7 dager med omtrent 1 km stedsnøyaktighet. Ikke bruk fullt navn.
            <button type="button" on:click={onOpenPrivacy}>Les om personvern</button>
          </p>
          <button class="primary-button" type="submit" disabled={isReportSubmitting}>
            {#if isReportSubmitting}
              <LoaderCircle class="spin" size={17} />
            {:else}
              <Send size={17} />
            {/if}
            {isReportSubmitting ? "Sender rapport…" : "Send værrapport"}
          </button>
        </form>

        <div class="card-list">
          {#if reports.length === 0 && notice?.severity !== "warning"}
            <div class="empty-state">Ingen lokale rapporter her ennå. Bli førstemann.</div>
          {/if}
          {#each reports as report}
            <article class="list-card report-card">
              <div class="icon-tile">
                <WeatherIcon kind={conditionKind(report.condition)} size={25} />
              </div>
              <div class="list-copy">
                <strong>{report.condition}</strong>
                <span>
                  {[report.reporter, report.location, formatDistance(report.distanceKm), report.time]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <details class="report-flag">
                  <summary>
                    <Flag size={12} aria-hidden="true" />
                    {flaggedReportIds.includes(report.id) ? "Rapportert" : "Rapporter feil"}
                  </summary>
                  <div class="report-flag-menu">
                    {#if flaggedReportIds.includes(report.id)}
                      <span>Takk – sendt til vurdering.</span>
                    {:else}
                      <strong>Hva er galt?</strong>
                      {#each REPORT_FLAG_REASONS as reason}
                        <button
                          type="button"
                          disabled={flaggingReportId === report.id}
                          on:click={() => handleFlagReport(report.id, reason.value)}
                        >
                          {reason.label}
                        </button>
                      {/each}
                    {/if}
                  </div>
                </details>
              </div>
              <b>{formatTemperature(report.temp)}°</b>
            </article>
          {/each}
        </div>
      </div>
    </article>
  {:else if activeTab === "bath"}
    <article class="feature-panel">
      <header class="feature-header">
        <div>
          <span class="eyebrow">Bad</span>
          <h2>Badetemperatur</h2>
          <p>Ferske målinger i nærheten, levert av Yr.</p>
        </div>
        <Waves size={30} aria-hidden="true" />
      </header>

      <div class="card-list bath-list">
        {#if isBathLoading}
          <div class="empty-state">
            <LoaderCircle class="spin" size={18} /> Laster badetemperaturer…
          </div>
        {:else if bathTemperatures.length === 0 && notice?.severity !== "warning"}
          <div class="empty-state">
            Fant ingen ferske målinger innenfor 50 km. Yr viser målinger fra de siste fem døgnene.
          </div>
        {/if}
        {#each bathTemperatures as bath}
          <article class="list-card bath-card">
            <div class="icon-tile"><Waves size={24} /></div>
            <div class="list-copy">
              <strong>{bath.name}</strong>
              <span>
                {[bath.municipality, formatDistance(bath.distanceKm), formatBathTime(bath.time)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              {#if bath.heatedWater}<small class="mini-chip">Oppvarmet</small>{/if}
              {#if bath.locationId}
                <button
                  class="text-button bath-use-button"
                  type="button"
                  on:click={() => chooseNearbyBath(bath)}
                >
                  Bruk denne badeplassen
                </button>
              {/if}
            </div>
            <b>{formatTemperature(bath.temperature)}°</b>
          </article>
        {/each}
      </div>

      <form
        class="feature-card bath-form"
        bind:this={bathFormElement}
        on:submit|preventDefault={handleBathSubmit}
      >
        <div class="card-title">
          <div>
            <h3>Send ny måling</h3>
            <p>Søk og velg badeplassen hos Yr, så navn og koordinater blir riktige.</p>
          </div>
          <MapPin size={25} />
        </div>
        <div class="field-row">
          <BathLocationSearch
            value={bathForm.name}
            selectedLocationId={bathForm.locationId}
            onChange={handleBathLocationChange}
            onSelect={handleBathLocationSelect}
          />
          <label>
            <span>Badetemperatur</span>
            <input
              inputmode="decimal"
              min="-2"
              max="45"
              step="0.1"
              placeholder="19,5"
              bind:value={bathForm.temperature}
            />
          </label>
        </div>
        {#if bathForm.locationId}
          <div class="bath-location-selection" role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>
              Valgt fra Yr: <strong>{bathForm.name}</strong>
              {bathForm.regionName ? ` · ${bathForm.regionName}` : ""}
            </span>
          </div>
        {/if}
        <label class="switch-row">
          <input type="checkbox" bind:checked={bathForm.heatedWater} />
          <span>Oppvarmet vann</span>
        </label>
        <p class="form-hint">
          {bathForm.locationId
            ? "Koordinatene hentes fra den valgte Yr-badeplassen."
            : "Du må velge et treff fra Yr-listen før innsending."}
        </p>
        <p class="privacy-inline">
          Yr-ID, badeplass, temperatur og koordinater sendes til Yr. Værvakt lagrer ikke
          navnet ditt.
          <button type="button" on:click={onOpenPrivacy}>Les om personvern</button>
        </p>
        <button class="primary-button" type="submit" disabled={isBathSubmitting}>
          {#if isBathSubmitting}
            <LoaderCircle class="spin" size={17} />
          {:else}
            <Send size={17} />
          {/if}
          {isBathSubmitting ? "Sender til Yr…" : "Send badetemperatur til Yr"}
        </button>
      </form>

      <aside class="support-card">
        <div>
          <h3>Hold Værvakt annonsefri</h3>
          <p>Vipps-støtte går til drift, API-er og videre utvikling.</p>
        </div>
        <a
          class="support-button"
          href={VIPPS_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Støtt med Vipps
        </a>
      </aside>
    </article>
  {/if}
</section>
