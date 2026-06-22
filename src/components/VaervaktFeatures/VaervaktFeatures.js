import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createHubPost,
  fetchHubPosts,
  fetchReports,
  loginHubProfile,
  submitReport,
  voteHubPost,
} from "../../api/VaervaktApi";

const PROFILE_KEY = "vaervakt_hub_profile";
const REPORTER_KEY = "vaervakt_reporter_name";
const VIPPS_URL = "https://betal.vipps.no/opy01u";

const CONDITIONS = [
  { value: "Sol / Klart", label: "Sol", icon: "☀️" },
  { value: "Delvis skyet", label: "Delvis skyet", icon: "⛅" },
  { value: "Skyet", label: "Skyet", icon: "☁️" },
  { value: "Regn", label: "Regn", icon: "🌧️" },
  { value: "Snø", label: "Snø", icon: "❄️" },
  { value: "Torden", label: "Torden", icon: "⛈️" },
];

const CATEGORIES = [
  { value: "general", label: "Oppdatering" },
  { value: "question", label: "Spørsmål" },
  { value: "warning", label: "Obs-varsel" },
  { value: "tip", label: "Tips" },
];

const sectionSx = {
  width: "100%",
  borderRadius: { xs: "18px", sm: "22px" },
  background:
    "linear-gradient(0deg, rgba(255, 255, 255, .045) 0%, rgba(171, 203, 222, .07) 100%)",
  boxShadow:
    "rgba(0, 0, 0, 0.12) 0px 12px 24px -10px, inset 0 1px 0 rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.08)",
  p: { xs: 1.3, sm: 1.8 },
};

const cardSx = {
  borderRadius: { xs: "14px", sm: "18px" },
  background:
    "linear-gradient(180deg, rgba(9, 16, 36, .72) 0%, rgba(7, 12, 27, .86) 100%)",
  border: "1px solid rgba(255,255,255,.075)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
};

const inputSx = {
  "& .MuiInputBase-root": {
    minHeight: "44px",
    borderRadius: "12px",
    backgroundColor: "rgba(2, 6, 23, 0.35)",
    color: "rgba(255,255,255,.9)",
    fontSize: "16px",
    fontFamily: "Poppins",
  },
  "& .MuiInputBase-input": {
    fontSize: "16px",
  },
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,.55)",
    fontFamily: "Poppins",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#38bdf8",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,.1)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#38bdf8",
  },
  "& .MuiSelect-icon": {
    color: "rgba(255,255,255,.65)",
  },
};

const selectMenuProps = {
  PaperProps: {
    sx: {
      borderRadius: "14px",
      backgroundColor: "#101a33",
      color: "rgba(255,255,255,.9)",
      border: "1px solid rgba(255,255,255,.1)",
    },
  },
};

function getStoredProfile() {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getStoredReporterName() {
  try {
    return window.localStorage.getItem(REPORTER_KEY) || "";
  } catch (error) {
    return "";
  }
}

function normalizeTemp(value) {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getWeatherSummary(weather) {
  return weather?.weather?.[0]?.description || "";
}

function getWeatherTemp(weather) {
  const temp = weather?.main?.temp;
  return Number.isFinite(temp) ? Math.round(temp) : "";
}

function getConditionIcon(condition = "") {
  const match = CONDITIONS.find((item) =>
    condition.toLowerCase().includes(item.value.toLowerCase().split(" ")[0])
  );
  return match?.icon || "🌦️";
}

function EmptyState({ children }) {
  return (
    <Box
      sx={{
        ...cardSx,
        p: 1.6,
        borderStyle: "dashed",
        color: "rgba(255,255,255,.58)",
      }}
    >
      <Typography sx={{ fontSize: { xs: "0.78rem", sm: "0.86rem" } }}>
        {children}
      </Typography>
    </Box>
  );
}

function SectionHeading({ title, subtitle, action }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
      gap={1.2}
      sx={{ mb: 1.4 }}
    >
      <Box>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            color: "rgba(255,255,255,.74)",
            fontFamily: "Roboto Condensed",
            fontSize: { xs: "12px", sm: "16px", md: "18px" },
            fontWeight: 600,
            letterSpacing: ".05em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              color: "rgba(255,255,255,.42)",
              fontSize: { xs: "0.74rem", sm: "0.82rem" },
              mt: 0.7,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

function WeatherPillButton({ children, selected, ...props }) {
  return (
    <Button
      size="small"
      {...props}
      sx={{
        minWidth: "auto",
        borderRadius: "999px",
        px: 1.35,
        py: 0.55,
        color: selected ? "#06111f" : "rgba(255,255,255,.78)",
        backgroundColor: selected ? "#38bdf8" : "rgba(255,255,255,.06)",
        border: selected
          ? "1px solid rgba(56,189,248,.4)"
          : "1px solid rgba(255,255,255,.1)",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "none",
        "&:hover": {
          backgroundColor: selected ? "#7dd3fc" : "rgba(255,255,255,.1)",
        },
        ...(props.sx || {}),
      }}
    >
      {children}
    </Button>
  );
}

function VaervaktFeatures({ selectedLocation, weather }) {
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("new");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [profile, setProfile] = useState(() => getStoredProfile());
  const [profileForm, setProfileForm] = useState({ displayName: "", pin: "" });
  const [reportForm, setReportForm] = useState({
    username: getStoredReporterName(),
    temperature: "",
    condition: "Sol / Klart",
  });
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    category: "general",
  });

  const location = useMemo(
    () => ({
      name: selectedLocation?.name || "Kristiansand",
      lat: selectedLocation?.lat,
      lon: selectedLocation?.lon,
    }),
    [selectedLocation]
  );

  const refreshCommunityData = async () => {
    setIsLoading(true);
    const [reportResult, postResult] = await Promise.allSettled([
      fetchReports(location),
      fetchHubPosts(location, sort),
    ]);

    if (reportResult.status === "fulfilled") {
      setReports(reportResult.value.reports || []);
    }

    if (postResult.status === "fulfilled") {
      setPosts(postResult.value.posts || []);
    }

    if (reportResult.status === "rejected" || postResult.status === "rejected") {
      setNotice({
        severity: "warning",
        text: "Noe av lokaldelen kunne ikke lastes akkurat nå.",
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    refreshCommunityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.name, location.lat, location.lon, sort]);

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    const temperature = normalizeTemp(reportForm.temperature);

    if (!reportForm.username.trim() || temperature === null) {
      setNotice({ severity: "info", text: "Skriv navn og temperatur før du sender." });
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
      setReportForm((current) => ({ ...current, temperature: "" }));
      setNotice({ severity: "success", text: "Rapporten er sendt. Takk!" });
      await refreshCommunityData();
    } catch (error) {
      setNotice({ severity: "error", text: error.message });
    }
  };

  const handleProfileAction = async (action) => {
    try {
      const result = await loginHubProfile(
        profileForm.displayName.trim(),
        profileForm.pin.trim(),
        action
      );
      const nextProfile = { user: result.user, token: result.token };
      setProfile(nextProfile);
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
      setProfileForm({ displayName: "", pin: "" });
      setNotice({ severity: "success", text: result.message || "Profilen er klar." });
    } catch (error) {
      setNotice({ severity: "error", text: error.message });
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    await handleProfileAction("login");
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();

    if (!profile) {
      setNotice({ severity: "info", text: "Logg inn med navn og PIN før du poster." });
      return;
    }

    try {
      await createHubPost({
        userId: profile.user.id,
        token: profile.token,
        title: postForm.title.trim(),
        body: postForm.body.trim(),
        category: postForm.category,
        location: location.name,
        lat: location.lat,
        lon: location.lon,
        weatherCondition: getWeatherSummary(weather),
        temperature: getWeatherTemp(weather),
      });
      setPostForm({ title: "", body: "", category: "general" });
      setNotice({ severity: "success", text: "Innlegget er publisert." });
      await refreshCommunityData();
    } catch (error) {
      setNotice({ severity: "error", text: error.message });
    }
  };

  const handleVote = async (postId, vote) => {
    if (!profile) {
      setNotice({ severity: "info", text: "Logg inn med navn og PIN for å stemme." });
      return;
    }

    try {
      const result = await voteHubPost({
        userId: profile.user.id,
        token: profile.token,
        postId,
        vote,
      });
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, score: result.score, voteCount: result.voteCount }
            : post
        )
      );
    } catch (error) {
      setNotice({ severity: "error", text: error.message });
    }
  };

  const logout = () => {
    setProfile(null);
    window.localStorage.removeItem(PROFILE_KEY);
    setNotice({ severity: "info", text: "Du er logget ut av Værhub." });
  };

  return (
    <Grid item xs={12} sx={{ mt: { xs: 2.5, md: 3.5 }, mb: { xs: 8, md: 3 } }}>
      <Stack spacing={2}>
        {notice && (
          <Alert
            severity={notice.severity}
            onClose={() => setNotice(null)}
            sx={{
              borderRadius: "16px",
              backgroundColor: "rgba(9, 16, 36, .92)",
              color: "rgba(255,255,255,.88)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            {notice.text}
          </Alert>
        )}

        <Box sx={sectionSx}>
          <SectionHeading
            title="Lokalt fra Værvakt"
            subtitle={`Rapporter og observasjoner nær ${location.name}.`}
            action={
              <WeatherPillButton onClick={refreshCommunityData} disabled={isLoading}>
                Oppdater
              </WeatherPillButton>
            }
          />

          <Grid container spacing={1.4} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Stack component="form" spacing={1.2} onSubmit={handleReportSubmit} sx={{ ...cardSx, p: 1.5, height: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box>
                    <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.96rem" }}>
                      Send værrapport
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,.46)", fontSize: "0.75rem" }}>
                      Vises sammen med varselet for stedet ditt.
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "1.8rem", lineHeight: 1 }}>🌡️</Typography>
                </Stack>

                <TextField
                  label="Navn"
                  value={reportForm.username}
                  onChange={(event) =>
                    setReportForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  fullWidth
                  sx={inputSx}
                />

                <Stack direction={{ xs: "column", sm: "row", md: "column", lg: "row" }} spacing={1}>
                  <TextField
                    label="Temperatur"
                    value={reportForm.temperature}
                    onChange={(event) =>
                      setReportForm((current) => ({
                        ...current,
                        temperature: event.target.value,
                      }))
                    }
                    fullWidth
                    inputProps={{ inputMode: "decimal" }}
                    sx={inputSx}
                  />
                  <TextField
                    select
                    label="Værtype"
                    value={reportForm.condition}
                    onChange={(event) =>
                      setReportForm((current) => ({
                        ...current,
                        condition: event.target.value,
                      }))
                    }
                    fullWidth
                    SelectProps={{ MenuProps: selectMenuProps }}
                    sx={inputSx}
                  >
                    {CONDITIONS.map((condition) => (
                      <MenuItem key={condition.value} value={condition.value}>
                        {condition.icon} {condition.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    borderRadius: "14px",
                    py: 1.05,
                    color: "#06111f",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #7dd3fc, #38bdf8)",
                    boxShadow: "0 10px 24px rgba(56, 189, 248, .18)",
                    textTransform: "none",
                    "&:hover": {
                      background: "linear-gradient(135deg, #bae6fd, #38bdf8)",
                    },
                  }}
                >
                  Send værrapport
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack spacing={0.8}>
                {reports.length === 0 && (
                  <EmptyState>Ingen lokale rapporter her enda. Bli førstemann.</EmptyState>
                )}
                {reports.map((report) => (
                  <Stack
                    key={report.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1.5}
                    sx={{
                      ...cardSx,
                      px: { xs: 1.2, sm: 1.5 },
                      py: 1.05,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.1} minWidth={0}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          flex: "0 0 auto",
                          borderRadius: "14px",
                          display: "grid",
                          placeItems: "center",
                          background:
                            "radial-gradient(circle at 35% 30%, rgba(255,255,255,.22), rgba(56,189,248,.08) 55%, rgba(255,255,255,.04))",
                          fontSize: "1.25rem",
                        }}
                      >
                        {report.icon || getConditionIcon(report.condition)}
                      </Box>
                      <Box minWidth={0}>
                        <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.2 }}>
                          {report.condition}
                        </Typography>
                        <Typography
                          noWrap
                          sx={{ color: "rgba(255,255,255,.45)", fontSize: "0.72rem", mt: 0.35 }}
                        >
                          {report.reporter} · {report.location} · {report.time}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ color: "white", fontWeight: 800, fontSize: "1rem" }}>
                      {report.temp}°
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <Box
          sx={{
            ...cardSx,
            p: { xs: 1.4, sm: 1.6 },
            borderRadius: { xs: "18px", sm: "22px" },
            background:
              "linear-gradient(135deg, rgba(255,91,36,.17), rgba(255,45,85,.08) 48%, rgba(9,16,36,.82))",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1.4}
          >
            <Box>
              <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.98rem" }}>
                Hold Værvakt annonsefri
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,.52)", fontSize: "0.78rem", mt: 0.3 }}>
                Vipps-støtte går til drift, API-er og videre utvikling.
              </Typography>
            </Box>
            <Button
              component="a"
              href={VIPPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderRadius: "14px",
                px: 2.2,
                py: 1,
                color: "#fff",
                fontWeight: 900,
                background: "linear-gradient(135deg, #ff7a3d, #ff2d55)",
                textTransform: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  background: "linear-gradient(135deg, #ff8f5c, #ff4770)",
                },
              }}
            >
              Støtt med Vipps
            </Button>
          </Stack>
        </Box>

        <Box sx={sectionSx}>
          <SectionHeading
            title="Værhub"
            subtitle="Spør, varsle og del små lokale værtegn."
            action={
              <Stack direction="row" spacing={0.75}>
                <WeatherPillButton selected={sort === "new"} onClick={() => setSort("new")}>
                  Nyeste
                </WeatherPillButton>
                <WeatherPillButton selected={sort === "top"} onClick={() => setSort("top")}>
                  Topp
                </WeatherPillButton>
              </Stack>
            }
          />

          <Grid container spacing={1.4}>
            <Grid item xs={12} md={5}>
              <Stack spacing={1.2} sx={{ ...cardSx, p: 1.5 }}>
                {!profile ? (
                  <Stack component="form" spacing={1.15} onSubmit={handleProfileSubmit}>
                    <Box>
                      <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.94rem" }}>
                        Lokal profil
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,.45)", fontSize: "0.74rem", mt: 0.25 }}>
                        Bare navn og PIN. Ingen e-post eller tracking-konto.
                      </Typography>
                    </Box>
                    <TextField
                      label="Navn"
                      value={profileForm.displayName}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          displayName: event.target.value,
                        }))
                      }
                      fullWidth
                      sx={inputSx}
                    />
                    <TextField
                      label="PIN"
                      type="password"
                      value={profileForm.pin}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          pin: event.target.value,
                        }))
                      }
                      fullWidth
                      inputProps={{ inputMode: "numeric" }}
                      sx={inputSx}
                    />
                    <Stack direction="row" spacing={1}>
                      <WeatherPillButton type="submit" selected>
                        Logg inn
                      </WeatherPillButton>
                      <WeatherPillButton type="button" onClick={() => handleProfileAction("register")}>
                        Opprett
                      </WeatherPillButton>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Box>
                      <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.94rem" }}>
                        {profile.user.displayName}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,.45)", fontSize: "0.74rem" }}>
                        Klar til å poste og stemme.
                      </Typography>
                    </Box>
                    <WeatherPillButton onClick={logout}>Logg ut</WeatherPillButton>
                  </Stack>
                )}

                <Divider sx={{ borderColor: "rgba(255,255,255,.08)" }} />

                <Stack component="form" spacing={1.15} onSubmit={handlePostSubmit}>
                  <TextField
                    label="Tittel"
                    value={postForm.title}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, title: event.target.value }))
                    }
                    fullWidth
                    sx={inputSx}
                  />
                  <TextField
                    label="Hva skjer?"
                    value={postForm.body}
                    onChange={(event) =>
                      setPostForm((current) => ({ ...current, body: event.target.value }))
                    }
                    multiline
                    minRows={2}
                    fullWidth
                    sx={inputSx}
                  />
                  <TextField
                    select
                    label="Kategori"
                    value={postForm.category}
                    onChange={(event) =>
                      setPostForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    fullWidth
                    SelectProps={{ MenuProps: selectMenuProps }}
                    sx={inputSx}
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!profile}
                    sx={{
                      borderRadius: "14px",
                      py: 1.05,
                      color: "#06111f",
                      fontWeight: 900,
                      background: "linear-gradient(135deg, #7dd3fc, #38bdf8)",
                      textTransform: "none",
                      "&:hover": {
                        background: "linear-gradient(135deg, #bae6fd, #38bdf8)",
                      },
                    }}
                  >
                    Post i Værhub
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack spacing={0.9}>
                {posts.length === 0 && (
                  <EmptyState>Ingen innlegg i nærheten enda. Start praten.</EmptyState>
                )}
                {posts.map((post) => (
                  <Box key={post.id} sx={{ ...cardSx, p: 1.3 }}>
                    <Stack direction="row" justifyContent="space-between" gap={1.5}>
                      <Box minWidth={0}>
                        <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mb: 0.65 }}>
                          <Chip
                            label={CATEGORIES.find((item) => item.value === post.category)?.label || "Info"}
                            size="small"
                            sx={{
                              height: "21px",
                              borderRadius: "999px",
                              color: "#7dd3fc",
                              backgroundColor: "rgba(56,189,248,.1)",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                            }}
                          />
                          <Typography sx={{ color: "rgba(255,255,255,.42)", fontSize: "0.72rem" }}>
                            {post.time}
                          </Typography>
                        </Stack>
                        <Typography sx={{ color: "white", fontWeight: 800, fontSize: "0.94rem", lineHeight: 1.25 }}>
                          {post.title}
                        </Typography>
                        <Typography sx={{ color: "rgba(255,255,255,.66)", fontSize: "0.82rem", mt: 0.45, lineHeight: 1.45 }}>
                          {post.body}
                        </Typography>
                        <Typography noWrap sx={{ color: "rgba(255,255,255,.42)", fontSize: "0.72rem", mt: 0.8 }}>
                          {post.displayName} · {post.location}
                        </Typography>
                      </Box>
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                          flex: "0 0 38px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(255,255,255,.045)",
                          border: "1px solid rgba(255,255,255,.07)",
                        }}
                      >
                        <Button
                          size="small"
                          onClick={() => handleVote(post.id, 1)}
                          sx={{ minWidth: 28, color: "#7dd3fc", py: 0, lineHeight: 1 }}
                        >
                          ▲
                        </Button>
                        <Typography sx={{ color: "white", fontWeight: 900, fontSize: "0.86rem" }}>
                          {post.score}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => handleVote(post.id, -1)}
                          sx={{ minWidth: 28, color: "rgba(255,255,255,.48)", py: 0, lineHeight: 1 }}
                        >
                          ▼
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Grid>
  );
}

export default VaervaktFeatures;
