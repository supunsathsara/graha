"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  MapPin,
  Clock,
  Calendar,
  User,
  Globe,
  Loader2,
  AlertCircle,
  Stars,
  Sun,
  Moon,
  BookOpen,
  Gem,
} from "lucide-react";
import { ZODIAC_NAMES } from "@graha/shared";

const ZODIAC_SYMBOLS: Record<number, string> = {
  0: "♈",
  1: "♉",
  2: "♊",
  3: "♋",
  4: "♌",
  5: "♍",
  6: "♎",
  7: "♏",
  8: "♐",
  9: "♑",
  10: "♒",
  11: "♓",
};

const PLANET_SYMBOLS: Record<number, string> = {
  0: "☉",
  1: "☽",
  2: "☿",
  3: "♀",
  4: "♂",
  5: "♃",
  6: "♄",
  7: "♅",
  8: "♆",
  9: "♇",
  10: "☊",
  11: "☋",
};

const PLANET_IDS: Record<string, number> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  rahu: 10,
  ketu: 11,
};
function getPlanetId(name: string): number {
  return PLANET_IDS[name.toLowerCase()] ?? -1;
}

const SRI_LANKA_CITIES = [
  { name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { name: "Kandy", lat: 7.2906, lon: 80.6337 },
  { name: "Galle", lat: 6.0535, lon: 80.221 },
  { name: "Jaffna", lat: 9.6615, lon: 80.0255 },
  { name: "Kurunegala", lat: 7.4861, lon: 80.3648 },
];

// Simple Nominatim query cache to avoid duplicate requests
const geocodeCache = new Map<
  string,
  Array<{ display_name: string; lat: string; lon: string }>
>();

type TabName = "overview" | "planets" | "yogas" | "navamsa" | "remedies";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    latitude: "",
    longitude: "",
    timezone: "Asia/Colombo",
  });
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prediction/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          timezone: form.timezone,
          name: form.name || undefined,
          aiMode: "polish",
        }),
      });
      if (!res.ok) throw new Error("Failed to compute horoscope");
      return res.json();
    },
  });

  const setCity = (lat: number, lon: number) => {
    setForm((f) => ({
      ...f,
      latitude: lat.toString(),
      longitude: lon.toString(),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-[#0a0a1a]">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 py-8 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm mb-4 md:mb-6">
              <Stars className="w-3 h-3 md:w-4 md:h-4" />
              <span>Vedic Astrology Engine</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-3 md:mb-4 bg-gradient-to-r from-primary via-purple-300 to-primary bg-clip-text text-transparent">
              Graha
            </h1>
            <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              Accurate birth chart calculations powered by Swiss Ephemeris.
              Sidereal Vedic astrology with planetary dignities, yogas, doshas,
              and remedies.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-4 md:py-8 -mt-6 md:-mt-8 relative z-10">
        <div className="grid lg:grid-cols-[400px_1fr] gap-4 md:gap-6 items-start">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 md:space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Birth Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Name{" "}
                    <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Kamal Perera"
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Birthplace
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setLocationQuery(q);
                        setSelectedLocation("");
                        if (searchTimeout) clearTimeout(searchTimeout);
                        if (q.length < 3) {
                          setLocationResults([]);
                          return;
                        }
                        searchTimeout = setTimeout(async () => {
                          // Check cache first
                          const cached = geocodeCache.get(q);
                          if (cached) {
                            setLocationResults(cached);
                            return;
                          }
                          setSearchingLocation(true);
                          try {
                            const res = await fetch(
                              `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`,
                            );
                            if (!res.ok) {
                              return;
                            }
                            const raw = await res.json();
                            // Photon returns GeoJSON format — transform to simple format
                            const data = (raw.features || []).map((f: any) => {
                              const props = f.properties || {};
                              const coords = f.geometry?.coordinates || [0, 0];
                              const parts = [
                                props.name,
                                props.city,
                                props.state,
                                props.country,
                              ].filter(Boolean);
                              return {
                                display_name: [...new Set(parts)].join(", "),
                                lat: String(coords[1]),
                                lon: String(coords[0]),
                              };
                            });
                            geocodeCache.set(q, data);
                            setLocationResults(data);
                          } catch {}
                          setSearchingLocation(false);
                        }, 2000);
                      }}
                      placeholder="Search for a city (e.g. Colombo, Galle)"
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                    {searchingLocation && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5 text-muted-foreground" />
                    )}
                    {locationResults.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {locationResults.map((r, i) => {
                          const shortName = r.display_name.split(",")[0];
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({
                                  ...f,
                                  latitude: r.lat,
                                  longitude: r.lon,
                                }));
                                setLocationQuery(shortName);
                                setSelectedLocation(r.display_name);
                                setLocationResults([]);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 transition border-b border-border last:border-0"
                            >
                              <span className="font-medium">{shortName}</span>
                              <span className="block text-muted-foreground truncate">
                                {r.display_name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {selectedLocation && (
                    <span className="text-xs text-muted-foreground">
                      {form.latitude && form.longitude
                        ? `${form.latitude}°N, ${form.longitude}°E`
                        : ""}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Birth Date
                    </label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, birthDate: e.target.value }))
                      }
                      required
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Birth Time
                    </label>
                    <input
                      type="time"
                      value={form.birthTime}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, birthTime: e.target.value }))
                      }
                      required
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, latitude: e.target.value }))
                      }
                      placeholder="e.g. 6.9271"
                      required
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, longitude: e.target.value }))
                      }
                      placeholder="e.g. 79.8612"
                      required
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    />
                  </div>
                </div>

                {/* Quick city buttons */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Quick fill (Sri Lanka)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SRI_LANKA_CITIES.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => setCity(city.lat, city.lon)}
                        className="px-2.5 py-1 text-xs rounded-md bg-secondary border border-border hover:border-primary/50 transition"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, timezone: e.target.value }))
                    }
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  >
                    <option value="Asia/Colombo">Sri Lanka (UTC+5:30)</option>
                    <option value="Asia/Kolkata">India (UTC+5:30)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Computing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Compute Horoscope
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results */}
          <div className="space-y-4">
            {/* Error */}
            <AnimatePresence>
              {mutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Error</p>
                    <p className="text-sm text-muted-foreground">
                      {(mutation.error as Error)?.message ||
                        "Something went wrong"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading skeleton */}
            {mutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-xl p-8 space-y-4"
              >
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
              {mutation.isSuccess && mutation.data?.reading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ChartResults
                    reading={mutation.data.reading}
                    chart={mutation.data.chart}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!mutation.isPending &&
              !mutation.isSuccess &&
              !mutation.isError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card border border-border rounded-xl p-8 md:p-12 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-3xl"
                  >
                    <Sun className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3">
                    Your Horoscope Awaits
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Enter birth details to compute an accurate Vedic birth chart
                    with planetary positions, yogas, doshas, and personalized
                    remedies.
                  </p>
                  <div className="flex items-center justify-center gap-2 md:gap-4 mt-6 text-xs text-muted-foreground">
                    <span>📅 Date</span>
                    <span className="text-border">→</span>
                    <span>📍 Location</span>
                    <span className="text-border">→</span>
                    <span>🌟 Chart</span>
                  </div>
                </motion.div>
              )}
          </div>
        </div>
      </main>
      <footer className="border-t border-border/40 py-6 md:py-8">
        <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Graha — Vedic Astrology Engine
          </p>
          <p className="text-xs text-muted-foreground">
            Made with{" "}
            <span className="text-red-400">♥</span>{" "}
            by{" "}
            <a
              href="https://supunsathsara.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline transition"
            >
              chutte
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Chart Results ──────────────────────────────────────────
function ChartResults({
  reading,
  chart,
  activeTab,
  onTabChange,
}: {
  reading: any;
  chart: any;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}) {
  const tabs: { id: TabName; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Sun className="w-4 h-4" /> },
    { id: "planets", label: "Planets", icon: <Stars className="w-4 h-4" /> },
    { id: "yogas", label: "Yogas", icon: <Sparkles className="w-4 h-4" /> },
    { id: "navamsa", label: "Navamsa", icon: <BookOpen className="w-4 h-4" /> },
    { id: "remedies", label: "Remedies", icon: <Gem className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Chart header */}
      <div className="p-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {chart?.name || "Birth Chart"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {chart?.birthDate} at {chart?.birthTime} •{" "}
              {ZODIAC_NAMES[chart?.lagna?.sign]?.en || "—"} Lagna
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-medium whitespace-nowrap transition border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6">
        {activeTab === "overview" && (
          <OverviewTab reading={reading} chart={chart} />
        )}
        {activeTab === "planets" && (
          <PlanetsTab reading={reading} chart={chart} />
        )}
        {activeTab === "yogas" && <YogasTab reading={reading} />}
        {activeTab === "navamsa" && <NavamsaTab reading={reading} />}
        {activeTab === "remedies" && <RemediesTab reading={reading} />}
      </div>
    </div>
  );
}

// ─── Tab: Overview ──────────────────────────────────────────
function OverviewTab({ reading, chart }: { reading: any; chart: any }) {
  const i = reading.interpretation || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Core info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard
          label="Lagna"
          value={`${ZODIAC_SYMBOLS[chart?.lagna?.sign] || ""} ${ZODIAC_NAMES[chart?.lagna?.sign]?.en || "—"}`}
        />
        <StatCard
          label="Lagna Degree"
          value={`${chart?.lagna?.degree?.toFixed(1) || "—"}°`}
        />
        <StatCard label="Planets" value={`${chart?.planets?.length || 0}`} />
        <StatCard
          label="Dasa"
          value={reading?.currentDasa?.lordName?.en || "—"}
        />
      </div>

      {/* Reading sections */}
      {i.general && <Section title="General Reading" text={i.general} />}
      <div className="grid md:grid-cols-2 gap-4">
        {i.career && <Section title="Career" text={i.career} />}
        {i.relationships && (
          <Section title="Relationships" text={i.relationships} />
        )}
        {i.health && <Section title="Health" text={i.health} />}
        {i.finance && <Section title="Finance" text={i.finance} />}
      </div>

      {/* Strengths & Challenges */}
      <div className="grid md:grid-cols-2 gap-4">
        {reading.strengths?.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-2">
              ✨ Strengths
            </h4>
            <ul className="space-y-1">
              {reading.strengths.slice(0, 4).map((s: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-emerald-400 mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {reading.challenges?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-400 mb-2">
              ⚠️ Challenges
            </h4>
            <ul className="space-y-1">
              {reading.challenges.slice(0, 4).map((c: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-red-400 mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Current Dasa */}
      {reading.currentDasa && (
        <Section title="Current Dasa Period" text={reading.currentDasa} />
      )}
    </motion.div>
  );
}

// ─── Tab: Planets ───────────────────────────────────────────
function PlanetsTab({ reading, chart }: { reading: any; chart: any }) {
  const dignities = reading.planetaryDignities || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Panchamahapurusha Yogas */}
      {reading.panchamahapurushaYogas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            🌟 Panchamahapurusha Yogas
          </h4>
          <div className="grid gap-3">
            {reading.panchamahapurushaYogas.map((y: any, i: number) => (
              <div
                key={i}
                className="bg-primary/5 border border-primary/20 rounded-lg p-3"
              >
                <p className="font-medium text-sm">
                  {y.name}{" "}
                  <span className="text-muted-foreground">({y.planet})</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {y.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dignities */}
      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">
          Planetary Dignities
        </h4>
        <div className="grid md:grid-cols-2 gap-2">
          {dignities.map((d: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-secondary/50 border border-border rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {PLANET_SYMBOLS[getPlanetId(d.planet)] || ""} {d.planet}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    ["exalted", "moolatrikona", "own"].includes(d.dignity)
                      ? "bg-emerald-500/10 text-emerald-400"
                      : d.dignity === "debilitated"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {d.dignity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{d.explanation}</p>
              {d.isCombust && (
                <p className="text-xs text-red-400 mt-1">
                  🔥 Combust — weakened by Sun
                </p>
              )}
              {d.retrogradeEffect && (
                <p className="text-xs text-yellow-400 mt-1">
                  ↩ {d.retrogradeEffect}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Aspects summary */}
      {reading.aspects?.summary?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Planetary Aspects
          </h4>
          <div className="space-y-1.5">
            {reading.aspects.summary.slice(0, 6).map((s: string, i: number) => (
              <p
                key={i}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-1">•</span>
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Planet positions */}
      {chart?.planets?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Positions</h4>
          <div className="grid md:grid-cols-2 gap-2">
            {chart.planets.map((p: any, i: number) => (
              <div
                key={i}
                className="bg-secondary/50 border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {PLANET_SYMBOLS[p.planet] || ""} {p.name?.en}{" "}
                    {p.isRetrograde && "↩"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    House {p.house}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ZODIAC_NAMES[p.sign]?.en || "—"} {p.signDegree?.toFixed(2)}°
                  • {p.nakshatra}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab: Yogas ─────────────────────────────────────────────
function YogasTab({ reading }: { reading: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {reading.yogas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            🌟 Beneficial Yogas
          </h4>
          <div className="grid gap-3">
            {reading.yogas.map((y: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4"
              >
                <p className="font-medium text-sm text-emerald-400">{y.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {y.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {reading.doshas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-3">
            ⚠️ Doshas (Afflictions)
          </h4>
          <div className="grid gap-3">
            {reading.doshas.map((d: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-red-500/5 border border-red-500/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-red-400">{d.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      d.severity === "high"
                        ? "bg-red-500/10 text-red-400"
                        : d.severity === "medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {d.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{d.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!reading.yogas?.length && !reading.doshas?.length && (
        <p className="text-sm text-muted-foreground">
          No yogas or doshas detected.
        </p>
      )}
    </motion.div>
  );
}

// ─── Tab: Navamsa D9 ────────────────────────────────────────
function NavamsaTab({ reading }: { reading: any }) {
  const n = reading.navamsa;
  if (!n)
    return (
      <p className="text-sm text-muted-foreground">
        No Navamsa data available.
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <StatCard
          label="Navamsa Lagna"
          value={`${ZODIAC_SYMBOLS[n.lagna] || ""} ${ZODIAC_NAMES[n.lagna]?.en || "—"}`}
        />
        <StatCard
          label="Vargottama Planets"
          value={n.vargottamaPlanets?.join(", ") || "None"}
        />
      </div>

      {n.marriageAnalysis?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Marriage Analysis
          </h4>
          <div className="space-y-2">
            {n.marriageAnalysis.map((m: string, i: number) => (
              <p
                key={i}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-1 shrink-0">•</span>
                {m}
              </p>
            ))}
          </div>
        </div>
      )}

      {n.planetPlacements?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Planets in D9
          </h4>
          <div className="grid md:grid-cols-2 gap-2">
            {n.planetPlacements.map((p: any, i: number) => (
              <div
                key={i}
                className="bg-secondary/50 border border-border rounded-lg p-3"
              >
                <p className="font-medium text-sm">
                  {p.planet}{" "}
                  <span className="text-muted-foreground">→ {p.sign}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.interpretation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab: Remedies ──────────────────────────────────────────
function RemediesTab({ reading }: { reading: any }) {
  const remedies = reading.remedies || [];
  if (!remedies.length)
    return (
      <p className="text-sm text-muted-foreground">
        No remedies data available.
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid md:grid-cols-2 gap-3"
    >
      {remedies.map((r: any, i: number) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-secondary/50 border border-border rounded-lg p-4 hover:border-primary/30 transition"
        >
          <p className="font-medium text-sm text-primary mb-2">{r.planet}</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">Gem:</span>{" "}
              {r.gem || "None specific"}
            </p>
            <p>
              <span className="text-foreground">Mantra:</span>{" "}
              <code className="text-primary">{r.mantra}</code>
            </p>
            <p>
              <span className="text-foreground">Action:</span> {r.action}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── Shared Components ──────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-primary mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
