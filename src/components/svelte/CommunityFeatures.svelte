<script>
  import { onMount } from "svelte";
  import {
    Camera,
    CheckCircle2,
    Clock3,
    ImagePlus,
    LoaderCircle,
    LogOut,
    MapPin,
    RefreshCw,
    Send,
    ThumbsUp,
    Thermometer,
    UserRound,
    Waves,
    X,
  } from "@lucide/svelte";
  import {
    createHubPost,
    fetchBathTemperatures,
    fetchGlimpsePhotos,
    fetchHubPosts,
    fetchReports,
    loginHubProfile,
    submitBathTemperature,
    submitReport,
    uploadGlimpsePhoto,
    voteHubPost,
  } from "../../api/VaervaktApi";
  import WeatherIcon from "./WeatherIcon.svelte";

  export let selectedLocation;
  export let weather;
  export let activeTab = "local";
  export let refreshKey = 0;

  const PROFILE_KEY = "vaervakt_hub_profile";
  const REPORTER_KEY = "vaervakt_reporter_name";
  const VOTES_KEY_PREFIX = "vaervakt_hub_votes_";
  const VIPPS_URL = "https://betal.vipps.no/opy01u";
  const MAX_CLIENT_IMAGE_BYTES = 10 * 1024 * 1024;

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

  const SNAP_TYPES = [
    {
      value: "sun",
      label: "Sol",
      kind: "sun",
      title: "Sol nå",
      body: "Sola titter frem her.",
      category: "tip",
      keywords: ["sol", "klart", "lysner"],
    },
    {
      value: "rain",
      label: "Regn",
      kind: "rain",
      title: "Regn nå",
      body: "Det regner lokalt akkurat nå.",
      category: "general",
      keywords: ["regn", "byge", "vått"],
    },
    {
      value: "cloudy",
      label: "Skyet",
      kind: "cloudy",
      title: "Skyet nå",
      body: "Det er skyet akkurat her.",
      category: "general",
      keywords: ["skyet", "skyer", "grått"],
    },
    {
      value: "partly-cloudy",
      label: "Litt skyet",
      kind: "partly-cloudy",
      title: "Litt skyet",
      body: "Sola og skyene deler på himmelen.",
      category: "general",
      keywords: ["delvis", "lettskyet", "solgløtt"],
    },
    {
      value: "snow",
      label: "Snø",
      kind: "snow",
      title: "Snø nå",
      body: "Det snør lokalt akkurat nå.",
      category: "warning",
      keywords: ["snø", "snør", "sludd"],
    },
    {
      value: "hail",
      label: "Hagl",
      kind: "hail",
      title: "Hagl",
      body: "Det hagler i området.",
      category: "warning",
      keywords: ["hagl", "hagler", "is"],
    },
    {
      value: "wind",
      label: "Vind",
      kind: "wind",
      title: "Mye vind",
      body: "Vinden merkes godt her.",
      category: "warning",
      keywords: ["vind", "blåser", "kast"],
    },
    {
      value: "fog",
      label: "Tåke",
      kind: "fog",
      title: "Tåke",
      body: "Det er redusert sikt her.",
      category: "warning",
      keywords: ["tåke", "sikt"],
    },
    {
      value: "slippery",
      label: "Glatt",
      kind: "slippery",
      title: "Glatt føre",
      body: "Det er glatt lokalt.",
      category: "warning",
      keywords: ["glatt", "is", "føre"],
    },
    {
      value: "thunder",
      label: "Lyn",
      kind: "thunder",
      title: "Lyn og torden",
      body: "Lyn eller torden observert i området.",
      category: "warning",
      keywords: ["lyn", "torden", "uvær"],
    },
    {
      value: "rainbow",
      label: "Regnbue",
      kind: "rainbow",
      title: "Regnbue",
      body: "Regnbue observert her.",
      category: "tip",
      keywords: ["regnbue", "sol", "regn"],
    },
    {
      value: "sunset",
      label: "Solnedgang",
      kind: "sunset",
      title: "Fin solnedgang",
      body: "Fin himmel eller solnedgang akkurat nå.",
      category: "tip",
      keywords: ["solnedgang", "himmel", "kveld"],
    },
    {
      value: "water",
      label: "Mye vann",
      kind: "water",
      title: "Mye vann",
      body: "Mye vann, store dammer eller overvann lokalt.",
      category: "warning",
      keywords: ["vann", "overvann", "flom", "dam"],
    },
    {
      value: "beach",
      label: "Badevær",
      kind: "beach",
      title: "Badevær",
      body: "Det ser fint ut for bading her.",
      category: "tip",
      keywords: ["bade", "strand", "vann"],
    },
    {
      value: "outdoor",
      label: "Turvær",
      kind: "outdoor",
      title: "Turvær",
      body: "Det er fint å være ute her.",
      category: "tip",
      keywords: ["tur", "ute", "fint"],
    },
  ];

  const CATEGORIES = [
    { value: "general", label: "Glimt" },
    { value: "question", label: "Spørsmål" },
    { value: "warning", label: "Obs" },
    { value: "tip", label: "Tips" },
  ];

  const GLIMPSE_TTLS = [
    { hours: 1, label: "1 t" },
    { hours: 3, label: "3 t" },
    { hours: 12, label: "12 t" },
    { hours: 24, label: "24 t" },
  ];

  function readStorage(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function getStoredProfile() {
    try {
      const raw = readStorage(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getStoredVotes(userId) {
    if (!userId) return {};
    try {
      const raw = readStorage(`${VOTES_KEY_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function setStoredVotes(userId, votes) {
    if (!userId) return;
    try {
      window.localStorage.setItem(`${VOTES_KEY_PREFIX}${userId}`, JSON.stringify(votes));
    } catch {
      // Lagring er valgfritt.
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
    const temp = value?.main?.temp;
    return Number.isFinite(temp) ? Math.round(temp) : "";
  }

  function conditionKind(condition = "") {
    const normalized = condition.toLowerCase();
    if (normalized.includes("torden") || normalized.includes("lyn")) return "thunder";
    if (normalized.includes("snø") || normalized.includes("sludd")) return "snow";
    if (normalized.includes("regn") || normalized.includes("byge")) return "rain";
    if (normalized.includes("delvis") || normalized.includes("lettskyet")) return "partly-cloudy";
    if (normalized.includes("sky")) return "cloudy";
    if (normalized.includes("klart") || normalized.includes("sol")) return "sun";
    return "partly-cloudy";
  }

  function getReportConditionFromWeather(value) {
    const kind = conditionKind(getWeatherSummary(value));
    return CONDITIONS.find((condition) => condition.kind === kind)?.value || "";
  }

  function formatTemperature(value) {
    const temperature = Number(value);
    if (!Number.isFinite(temperature)) return "–";
    return temperature.toFixed(temperature % 1 === 0 ? 0 : 1).replace(".", ",");
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

  function getSnapTypeForPost(post) {
    const text = `${post.title || ""} ${post.body || ""} ${post.category || ""} ${
      post.weatherCondition || ""
    }`.toLowerCase();
    return (
      SNAP_TYPES.find((type) => type.keywords.some((keyword) => text.includes(keyword))) ||
      SNAP_TYPES.find((type) => type.category === post.category) ||
      SNAP_TYPES[0]
    );
  }

  function getCategoryLabel(category) {
    return CATEGORIES.find((item) => item.value === category)?.label || "Glimt";
  }

  function formatExpiry(expiresAt) {
    const expires = new Date(String(expiresAt).replace(" ", "T"));
    const diffMs = expires.getTime() - Date.now();
    if (!Number.isFinite(diffMs) || diffMs <= 0) return "Utløper nå";
    const minutes = Math.ceil(diffMs / 60000);
    return minutes < 60 ? `${minutes} min igjen` : `${Math.ceil(minutes / 60)} t igjen`;
  }

  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Velg et bilde."));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxSide = 1600;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(file);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(
              new File([blob], `${Date.now()}-vaerglimt.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          0.84
        );
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Kunne ikke lese bildet."));
      };
      image.src = objectUrl;
    });
  }

  let reports = [];
  let posts = [];
  let photos = [];
  let sort = "new";
  let isLoading = false;
  let notice = null;
  let profile = getStoredProfile();
  let votedPosts = getStoredVotes(profile?.user?.id);
  let profileForm = { displayName: "", pin: "" };
  let reportForm = {
    username: readStorage(REPORTER_KEY, ""),
    temperature: "",
    condition: "",
  };
  let reportRangeHours = 24;
  let reportMeta = { total: 0, displayed: 0 };
  let bathForm = { name: "", temperature: "", heatedWater: false };
  let bathTemperatures = [];
  let isBathLoading = false;
  let isBathSubmitting = false;
  let snapForm = { type: "rain", note: "", file: null, previewUrl: "", ttlHours: 3 };
  let mounted = false;
  let previousRefreshSignature = "";
  let previousForecastSignature = "";
  let loadSequence = 0;

  $: location = {
    name: selectedLocation?.name || "Kristiansand",
    lat: selectedLocation?.lat,
    lon: selectedLocation?.lon,
    source: selectedLocation?.source || "default",
  };
  $: latNumber = Number(location.lat);
  $: lonNumber = Number(location.lon);
  $: hasCoordinates = Number.isFinite(latNumber) && Number.isFinite(lonNumber);
  $: selectedSnapType = SNAP_TYPES.find((type) => type.value === snapForm.type) || SNAP_TYPES[0];
  $: refreshSignature = [
    location.name,
    location.lat,
    location.lon,
    sort,
    refreshKey,
    activeTab,
    reportRangeHours,
  ].join("|");
  $: if (mounted && refreshSignature !== previousRefreshSignature) {
    previousRefreshSignature = refreshSignature;
    refreshCommunityData();
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
    return () => {
      if (snapForm.previewUrl) URL.revokeObjectURL(snapForm.previewUrl);
    };
  });

  async function refreshCommunityData() {
    const loadId = ++loadSequence;
    isLoading = true;
    const shouldFetchBath = activeTab === "bath" && hasCoordinates;
    isBathLoading = shouldFetchBath;
    const bathRequest = shouldFetchBath
      ? fetchBathTemperatures(location)
      : Promise.resolve({ bathing: { nearby: [] } });

    const [reportResult, postResult, photoResult, bathResult] = await Promise.allSettled([
      fetchReports(location, { maxAgeHours: reportRangeHours }),
      fetchHubPosts(location, sort),
      fetchGlimpsePhotos(location),
      bathRequest,
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
    } else {
      reports = [];
      reportMeta = { total: 0, displayed: 0 };
    }

    if (postResult.status === "fulfilled") posts = postResult.value.posts || [];
    if (photoResult.status === "fulfilled") photos = photoResult.value.photos || [];
    bathTemperatures =
      bathResult.status === "fulfilled" ? bathResult.value?.bathing?.nearby || [] : [];

    if ([reportResult, postResult, photoResult, bathResult].some((result) => result.status === "rejected")) {
      notice = {
        severity: "warning",
        text: "Noe av lokaldelen kunne ikke lastes akkurat nå.",
      };
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
    const temperature = normalizeTemp(reportForm.temperature);
    if (!reportForm.username.trim() || temperature === null || !reportForm.condition) {
      notice = { severity: "info", text: "Skriv navn, temperatur og værtype før du sender." };
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
      window.navigator.vibrate?.(12);
      await submitReport({
        username: reportForm.username.trim(),
        temperature,
        condition: reportForm.condition,
        location: location.name,
        lat: location.lat,
        lon: location.lon,
      });
      window.localStorage.setItem(REPORTER_KEY, reportForm.username.trim());
      reportForm = { ...reportForm, temperature: "", condition: "" };
      notice = { severity: "success", text: "Rapporten er sendt. Takk!" };
      await refreshCommunityData();
    } catch (error) {
      notice = { severity: "error", text: error.message };
    }
  }

  async function handleBathSubmit() {
    const temperature = normalizeTemp(bathForm.temperature);
    const name = bathForm.name.trim();
    if (!name || temperature === null) {
      notice = { severity: "info", text: "Skriv badeplass og badetemperatur før du sender." };
      return;
    }
    if (!hasCoordinates) {
      notice = {
        severity: "info",
        text: "Velg posisjon eller søk opp badeplassen først, så Yr får riktige koordinater.",
      };
      return;
    }

    try {
      isBathSubmitting = true;
      window.navigator.vibrate?.(10);
      const result = await submitBathTemperature({
        name,
        temperature,
        lat: latNumber,
        lon: lonNumber,
        heatedWater: bathForm.heatedWater,
        reporter: reportForm.username.trim() || profile?.user?.displayName || "",
      });
      bathForm = { name: "", temperature: "", heatedWater: false };
      notice = {
        severity: "success",
        text: result.message || "Badetemperaturen er sendt til Yr.",
      };
      await refreshCommunityData();
    } catch (error) {
      notice = { severity: "error", text: error.message };
    } finally {
      isBathSubmitting = false;
    }
  }

  async function handleProfileAction(action) {
    try {
      const result = await loginHubProfile(
        profileForm.displayName.trim(),
        profileForm.pin.trim(),
        action
      );
      profile = { user: result.user, token: result.token };
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      votedPosts = getStoredVotes(profile.user.id);
      profileForm = { displayName: "", pin: "" };
      notice = { severity: "success", text: result.message || "Profilen er klar." };
    } catch (error) {
      notice = { severity: "error", text: error.message };
    }
  }

  async function handlePhotoChange(event) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notice = { severity: "info", text: "Velg en bildefil." };
      return;
    }
    if (file.size > MAX_CLIENT_IMAGE_BYTES) {
      notice = { severity: "info", text: "Bildet er for stort. Velg et bilde under 10 MB." };
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      if (snapForm.previewUrl) URL.revokeObjectURL(snapForm.previewUrl);
      snapForm = { ...snapForm, file: compressed, previewUrl: URL.createObjectURL(compressed) };
    } catch (error) {
      notice = { severity: "error", text: error.message };
    }
  }

  function clearPhoto() {
    if (snapForm.previewUrl) URL.revokeObjectURL(snapForm.previewUrl);
    snapForm = { ...snapForm, file: null, previewUrl: "" };
  }

  async function handleSnapSubmit() {
    if (!profile) {
      notice = { severity: "info", text: "Logg inn med navn og PIN før du sender værglimt." };
      return;
    }

    try {
      if (snapForm.file) {
        const formData = new FormData();
        formData.append("userId", profile.user.id);
        formData.append("token", profile.token);
        formData.append("snapType", selectedSnapType.value);
        formData.append("title", selectedSnapType.title);
        formData.append("note", snapForm.note.trim() || selectedSnapType.body);
        formData.append("location", location.name);
        if (location.lat !== undefined && location.lat !== null) formData.append("lat", location.lat);
        if (location.lon !== undefined && location.lon !== null) formData.append("lon", location.lon);
        formData.append("ttlHours", snapForm.ttlHours);
        formData.append("image", snapForm.file, snapForm.file.name || "vaerglimt.jpg");
        await uploadGlimpsePhoto(formData);
        clearPhoto();
        snapForm = { ...snapForm, note: "" };
        notice = { severity: "success", text: "Bildeglimtet er publisert." };
      } else {
        await createHubPost({
          userId: profile.user.id,
          token: profile.token,
          title: selectedSnapType.title,
          body: snapForm.note.trim() || selectedSnapType.body,
          category: selectedSnapType.category,
          location: location.name,
          lat: location.lat,
          lon: location.lon,
          weatherCondition: selectedSnapType.label || getWeatherSummary(weather),
          temperature: getWeatherTemp(weather),
        });
        snapForm = { ...snapForm, note: "" };
        notice = { severity: "success", text: "Værglimtet er publisert." };
      }
      await refreshCommunityData();
    } catch (error) {
      notice = { severity: "error", text: error.message };
    }
  }

  function isOwnPost(post) {
    if (!profile || !post) return false;
    if (post.userId !== undefined && post.userId !== null) {
      return String(post.userId) === String(profile.user.id);
    }
    return Boolean(post.displayName) && post.displayName === profile.user.displayName;
  }

  async function handleVote(postId, vote) {
    if (!profile) {
      notice = { severity: "info", text: "Logg inn med navn og PIN for å stemme." };
      return;
    }
    const targetPost = posts.find((post) => post.id === postId);
    if (isOwnPost(targetPost)) {
      notice = { severity: "info", text: "Du kan ikke stemme på ditt eget værglimt." };
      return;
    }

    const nextVote = votedPosts[postId] === vote ? 0 : vote;
    try {
      const result = await voteHubPost({
        userId: profile.user.id,
        token: profile.token,
        postId,
        vote: nextVote,
      });
      posts = posts.map((post) =>
        post.id === postId ? { ...post, score: result.score, voteCount: result.voteCount } : post
      );
      const nextVotes = { ...votedPosts };
      if (nextVote === 0) delete nextVotes[postId];
      else nextVotes[postId] = nextVote;
      votedPosts = nextVotes;
      setStoredVotes(profile.user.id, nextVotes);
    } catch (error) {
      notice = { severity: "error", text: error.message };
    }
  }

  function logout() {
    profile = null;
    votedPosts = {};
    window.localStorage.removeItem(PROFILE_KEY);
    notice = { severity: "info", text: "Du er logget ut av Værglimt." };
  }
</script>

<section class="community-shell">
  {#if notice}
    <div class="notice notice-{notice.severity}" role="status">
      {#if notice.severity === "success"}
        <CheckCircle2 size={19} aria-hidden="true" />
      {:else}
        <WeatherIcon kind={notice.severity === "warning" ? "thunder" : "partly-cloudy"} size={19} />
      {/if}
      <span>{notice.text}</span>
      <button type="button" class="icon-button" on:click={() => (notice = null)} aria-label="Lukk beskjed">
        <X size={17} />
      </button>
    </div>
  {/if}

  {#if activeTab === "local"}
    <article class="feature-panel">
      <header class="feature-header">
        <div>
          <span class="eyebrow">Lokalt fra Værvakt</span>
          <h2>Rapporter nær {location.name}</h2>
          <p>
            {reportMeta.total} lokale rapporter
            {reports[0]?.time ? ` · siste aktivitet ${reports[0].time}` : ""}
          </p>
        </div>
        <button class="pill-button" type="button" on:click={refreshCommunityData} disabled={isLoading}>
          <RefreshCw size={15} class={isLoading ? "spin" : ""} />
          {reportMeta.displayed}/{reportMeta.total}
        </button>
      </header>

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
            <span>Navn</span>
            <input maxlength="80" bind:value={reportForm.username} autocomplete="name" />
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
          <button class="primary-button" type="submit" disabled={isLoading}>
            <Send size={17} /> Send værrapport
          </button>
        </form>

        <div class="card-list">
          {#if reports.length === 0}
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
          <div class="empty-state"><LoaderCircle class="spin" size={18} /> Laster badetemperaturer…</div>
        {:else if bathTemperatures.length === 0}
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
            </div>
            <b>{formatTemperature(bath.temperature)}°</b>
          </article>
        {/each}
      </div>

      <form class="feature-card bath-form" on:submit|preventDefault={handleBathSubmit}>
        <div class="card-title">
          <div>
            <h3>Send ny måling</h3>
            <p>Bruk søk eller posisjon på badeplassen først.</p>
          </div>
          <MapPin size={25} />
        </div>
        <div class="field-row">
          <label>
            <span>Badeplass</span>
            <input placeholder="For eksempel Bystranda" bind:value={bathForm.name} />
          </label>
          <label>
            <span>Badetemperatur</span>
            <input inputmode="decimal" placeholder="19,5" bind:value={bathForm.temperature} />
          </label>
        </div>
        <label class="switch-row">
          <input type="checkbox" bind:checked={bathForm.heatedWater} />
          <span>Oppvarmet vann</span>
        </label>
        <p class="form-hint">
          Sender fra {location.name}
          {hasCoordinates ? ` (${latNumber.toFixed(4)}, ${lonNumber.toFixed(4)})` : " uten koordinater"}.
        </p>
        <button class="primary-button" type="submit" disabled={isBathSubmitting}>
          {#if isBathSubmitting}<LoaderCircle class="spin" size={17} />{:else}<Send size={17} />{/if}
          {isBathSubmitting ? "Sender til Yr…" : "Send badetemperatur til Yr"}
        </button>
      </form>

      <aside class="support-card">
        <div>
          <h3>Hold Værvakt annonsefri</h3>
          <p>Vipps-støtte går til drift, API-er og videre utvikling.</p>
        </div>
        <a class="support-button" href={VIPPS_URL} target="_blank" rel="noopener noreferrer">
          Støtt med Vipps
        </a>
      </aside>
    </article>
  {:else if activeTab === "glimpse"}
    <article class="feature-panel">
      <header class="feature-header">
        <div>
          <span class="eyebrow">Værglimt</span>
          <h2>Hva skjer ute?</h2>
          <p>Korte, lokale værtegn fra folk i nærheten.</p>
        </div>
        <div class="chip-row">
          <button class="chip" class:selected={sort === "new"} type="button" on:click={() => (sort = "new")}>
            Fersk
          </button>
          <button class="chip" class:selected={sort === "top"} type="button" on:click={() => (sort = "top")}>
            Nyttig
          </button>
        </div>
      </header>

      <div class="feature-grid">
        <div class="feature-card">
          {#if !profile}
            <form class="stack-form" on:submit|preventDefault={() => handleProfileAction("login")}>
              <div class="card-title">
                <div>
                  <h3>Visningsnavn</h3>
                  <p>Navn og PIN er nok. Ingen e-postkonto.</p>
                </div>
                <UserRound size={25} />
              </div>
              <label>
                <span>Navn</span>
                <input bind:value={profileForm.displayName} autocomplete="username" />
              </label>
              <label>
                <span>PIN</span>
                <input type="password" inputmode="numeric" bind:value={profileForm.pin} autocomplete="current-password" />
              </label>
              <div class="button-row">
                <button class="primary-button" type="submit">Fortsett</button>
                <button class="secondary-button" type="button" on:click={() => handleProfileAction("register")}>
                  Opprett
                </button>
              </div>
            </form>
          {:else}
            <form class="stack-form" on:submit|preventDefault={handleSnapSubmit}>
              <div class="card-title">
                <div>
                  <h3>Poster som {profile.user.displayName}</h3>
                  <p>Velg hva du ser, og legg eventuelt ved et bilde.</p>
                </div>
                <button class="icon-button" type="button" on:click={logout} aria-label="Logg ut">
                  <LogOut size={18} />
                </button>
              </div>

              <div class="snap-types" aria-label="Velg type værglimt">
                {#each SNAP_TYPES as type}
                  <button
                    type="button"
                    class:selected={snapForm.type === type.value}
                    on:click={() => (snapForm = { ...snapForm, type: type.value })}
                  >
                    <WeatherIcon kind={type.kind} size={20} />
                    <span>{type.label}</span>
                  </button>
                {/each}
              </div>

              {#if snapForm.previewUrl}
                <div class="image-preview">
                  <img src={snapForm.previewUrl} alt="Forhåndsvisning av bildeglimt" />
                  <button class="icon-button" type="button" on:click={clearPhoto} aria-label="Fjern bilde">
                    <X size={18} />
                  </button>
                </div>
              {:else}
                <label class="upload-button">
                  <ImagePlus size={20} />
                  <span>Legg til bilde</span>
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    on:change={handlePhotoChange}
                  />
                </label>
              {/if}

              <div class="chip-row">
                <Clock3 size={16} aria-hidden="true" />
                {#each GLIMPSE_TTLS as ttl}
                  <button
                    class="chip"
                    class:selected={snapForm.ttlHours === ttl.hours}
                    type="button"
                    on:click={() => (snapForm = { ...snapForm, ttlHours: ttl.hours })}
                  >
                    {ttl.label}
                  </button>
                {/each}
              </div>

              <label>
                <span>Kort tekst</span>
                <textarea
                  rows="3"
                  placeholder="F.eks. plutselig regn ved sentrum"
                  bind:value={snapForm.note}
                ></textarea>
              </label>
              <button class="primary-button" type="submit">
                {#if snapForm.file}<Camera size={17} />{:else}<Send size={17} />{/if}
                Send {snapForm.file ? "bildeglimt" : "værglimt"}
              </button>
            </form>
          {/if}
        </div>

        <div class="glimpse-feed">
          {#if photos.length}
            <div class="photo-strip">
              {#each photos as photo}
                {@const type = SNAP_TYPES.find((item) => item.value === photo.snapType) || getSnapTypeForPost(photo)}
                <article class="photo-card">
                  <img src={photo.imageUrl} alt={photo.title} loading="lazy" />
                  <div class="photo-overlay"></div>
                  <div class="photo-top">
                    <WeatherIcon kind={type.kind} size={25} />
                    <small>{formatExpiry(photo.expiresAt)}</small>
                  </div>
                  <div class="photo-copy">
                    <strong>{photo.title}</strong>
                    {#if photo.note}<span>{photo.note}</span>{/if}
                    <small>{photo.displayName} · {photo.location}</small>
                  </div>
                </article>
              {/each}
            </div>
          {/if}

          {#if posts.length === 0 && photos.length === 0}
            <div class="empty-state">Ingen værglimt i nærheten ennå. Send det første.</div>
          {/if}
          {#each posts as post}
            {@const type = getSnapTypeForPost(post)}
            <article class="post-card">
              <div class="post-icon"><WeatherIcon kind={type.kind} size={29} /></div>
              <div class="post-copy">
                <div><small>{getCategoryLabel(post.category)}</small><time>{post.time}</time></div>
                <strong>{post.title}</strong>
                <p>{post.body}</p>
                <span>{post.displayName} · {post.location}</span>
              </div>
              <div class="vote-box">
                <button
                  type="button"
                  class:selected={votedPosts[post.id] === 1}
                  disabled={isOwnPost(post)}
                  on:click={() => handleVote(post.id, 1)}
                  aria-label="Stem opp"
                >
                  <ThumbsUp size={17} fill={votedPosts[post.id] === 1 ? "currentColor" : "none"} />
                </button>
                <b>{post.score}</b>
              </div>
            </article>
          {/each}
        </div>
      </div>
    </article>
  {/if}
</section>
