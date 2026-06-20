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

const panelSx = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "24px",
  background:
    "linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72))",
  boxShadow: "0 24px 60px rgba(2, 6, 23, 0.34)",
  backdropFilter: "blur(18px)",
  color: "#e2e8f0",
  p: { xs: 2, sm: 2.5 },
};

const inputSx = {
  "& .MuiInputBase-root": {
    borderRadius: "16px",
    backgroundColor: "rgba(2, 6, 23, 0.42)",
    color: "#e2e8f0",
    fontSize: "16px",
  },
  "& .MuiInputBase-input": {
    fontSize: "16px",
  },
  "& .MuiInputLabel-root": {
    color: "#94a3b8",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#38bdf8",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(56, 189, 248, 0.46)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#38bdf8",
  },
  "& .MuiSelect-icon": {
    color: "#94a3b8",
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

function EmptyState({ children }) {
  return (
    <Box
      sx={{
        border: "1px dashed rgba(148, 163, 184, 0.22)",
        borderRadius: "18px",
        p: 2,
        color: "#94a3b8",
      }}
    >
      <Typography sx={{ fontSize: "0.92rem" }}>{children}</Typography>
    </Box>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      gap={2}
      sx={{ mb: 1.5 }}
    >
      <Box>
        <Typography
          sx={{
            color: "#38bdf8",
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
        <Typography sx={{ color: "#f8fafc", fontSize: "1.1rem", fontWeight: 800 }}>
          {title}
        </Typography>
      </Box>
      {action}
    </Stack>
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
    <Grid item xs={12} sx={{ mt: 2, mb: { xs: 8, md: 2 } }}>
      <Grid container spacing={2}>
        {notice && (
          <Grid item xs={12}>
            <Alert
              severity={notice.severity}
              onClose={() => setNotice(null)}
              sx={{
                borderRadius: "18px",
                backgroundColor: "rgba(15, 23, 42, 0.92)",
                color: "#e2e8f0",
              }}
            >
              {notice.text}
            </Alert>
          </Grid>
        )}

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Box sx={panelSx}>
              <SectionTitle eyebrow="Rapporter" title="Send lokalt vær" />
              <Stack component="form" spacing={1.5} onSubmit={handleReportSubmit}>
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
                    sx={inputSx}
                  >
                    {CONDITIONS.map((condition) => (
                      <MenuItem key={condition.value} value={condition.value}>
                        {condition.icon} {condition.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                  Rapporten kobles til {location.name}.
                </Typography>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={{
                    borderRadius: "999px",
                    py: 1.2,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
                  }}
                >
                  Send værrapport
                </Button>
              </Stack>
            </Box>

            <Box sx={panelSx}>
              <SectionTitle eyebrow="Støtt" title="Hold Værvakt annonsefri" />
              <Typography sx={{ color: "#cbd5e1", mb: 2, fontSize: "0.94rem" }}>
                Hvis du liker prosjektet, kan du støtte videre utvikling med Vipps.
              </Typography>
              <Button
                component="a"
                href={VIPPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                sx={{
                  borderRadius: "999px",
                  py: 1.2,
                  color: "#fff",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #ff5b24, #ff2d55)",
                  textTransform: "none",
                }}
              >
                Støtt med Vipps
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            <Box sx={panelSx}>
              <SectionTitle
                eyebrow="Lokalt"
                title="Siste rapporter"
                action={
                  <Button
                    size="small"
                    onClick={refreshCommunityData}
                    disabled={isLoading}
                    sx={{
                      color: "#e2e8f0",
                      border: "1px solid rgba(148, 163, 184, 0.22)",
                      borderRadius: "999px",
                      px: 1.5,
                    }}
                  >
                    Oppdater
                  </Button>
                }
              />

              <Stack spacing={1}>
                {reports.length === 0 && (
                  <EmptyState>Ingen lokale rapporter her enda. Bli førstemann.</EmptyState>
                )}
                {reports.map((report) => (
                  <Stack
                    key={report.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={2}
                    sx={{
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "18px",
                      p: 1.4,
                      backgroundColor: "rgba(2, 6, 23, 0.28)",
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1.2}>
                      <Typography sx={{ fontSize: "1.6rem" }}>{report.icon}</Typography>
                      <Box>
                        <Typography sx={{ color: "#f8fafc", fontWeight: 800 }}>
                          {report.condition}
                        </Typography>
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                          {report.reporter} · {report.location} · {report.time}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ color: "#f8fafc", fontWeight: 900 }}>
                      {report.temp}°
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box sx={panelSx}>
              <SectionTitle
                eyebrow="Værhub"
                title="Lokal prat"
                action={
                  <Stack direction="row" spacing={0.75}>
                    <Chip
                      label="Nyeste"
                      onClick={() => setSort("new")}
                      size="small"
                      sx={{
                        color: sort === "new" ? "#020617" : "#cbd5e1",
                        backgroundColor: sort === "new" ? "#38bdf8" : "rgba(148,163,184,.12)",
                      }}
                    />
                    <Chip
                      label="Topp"
                      onClick={() => setSort("top")}
                      size="small"
                      sx={{
                        color: sort === "top" ? "#020617" : "#cbd5e1",
                        backgroundColor: sort === "top" ? "#38bdf8" : "rgba(148,163,184,.12)",
                      }}
                    />
                  </Stack>
                }
              />

              {!profile ? (
                <Stack component="form" spacing={1.3} onSubmit={handleProfileSubmit} sx={{ mb: 2 }}>
                  <Typography sx={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                    Lag en enkel lokal profil med bare navn og PIN. Ingen e-post.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3}>
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
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{ borderRadius: "999px", textTransform: "none", fontWeight: 800 }}
                    >
                      Logg inn
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleProfileAction("register")}
                      sx={{
                        borderRadius: "999px",
                        textTransform: "none",
                        color: "#cbd5e1",
                        border: "1px solid rgba(148,163,184,.22)",
                      }}
                    >
                      Opprett
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    mb: 2,
                    border: "1px solid rgba(56,189,248,.18)",
                    borderRadius: "18px",
                    p: 1.2,
                    backgroundColor: "rgba(14,165,233,.08)",
                  }}
                >
                  <Typography sx={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
                    Innlogget som <strong>{profile.user.displayName}</strong>
                  </Typography>
                  <Button size="small" onClick={logout} sx={{ color: "#94a3b8" }}>
                    Logg ut
                  </Button>
                </Stack>
              )}

              <Stack component="form" spacing={1.3} onSubmit={handlePostSubmit}>
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3}>
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
                      minWidth: { sm: "160px" },
                      borderRadius: "16px",
                      textTransform: "none",
                      fontWeight: 900,
                    }}
                  >
                    Post
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ borderColor: "rgba(148,163,184,.16)", my: 2 }} />

              <Stack spacing={1.2}>
                {posts.length === 0 && (
                  <EmptyState>Ingen innlegg i nærheten enda. Start praten.</EmptyState>
                )}
                {posts.map((post) => (
                  <Box
                    key={post.id}
                    sx={{
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      borderRadius: "18px",
                      p: 1.5,
                      backgroundColor: "rgba(2, 6, 23, 0.28)",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Chip
                            label={CATEGORIES.find((item) => item.value === post.category)?.label || "Info"}
                            size="small"
                            sx={{
                              height: "22px",
                              color: "#7dd3fc",
                              backgroundColor: "rgba(14,165,233,.12)",
                              fontSize: "0.72rem",
                            }}
                          />
                          <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                            {post.time}
                          </Typography>
                        </Stack>
                        <Typography sx={{ color: "#f8fafc", fontWeight: 900 }}>
                          {post.title}
                        </Typography>
                        <Typography sx={{ color: "#cbd5e1", fontSize: "0.9rem", mt: 0.4 }}>
                          {post.body}
                        </Typography>
                        <Typography sx={{ color: "#94a3b8", fontSize: "0.78rem", mt: 0.8 }}>
                          {post.displayName} · {post.location}
                        </Typography>
                      </Box>
                      <Stack alignItems="center" spacing={0.3}>
                        <Button
                          size="small"
                          onClick={() => handleVote(post.id, 1)}
                          sx={{ minWidth: 34, color: "#38bdf8" }}
                        >
                          ▲
                        </Button>
                        <Typography sx={{ color: "#f8fafc", fontWeight: 900 }}>
                          {post.score}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => handleVote(post.id, -1)}
                          sx={{ minWidth: 34, color: "#94a3b8" }}
                        >
                          ▼
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default VaervaktFeatures;
