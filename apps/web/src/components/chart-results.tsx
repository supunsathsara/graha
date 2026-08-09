"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Gem,
  Home,
  Sparkles,
  Stars,
  Sun,
} from "lucide-react";
import { ZODIAC_NAMES } from "@graha/shared";
import {
  PLANET_GLYPHS,
  PLANET_NAME_BY_ID,
  ZODIAC_GLYPHS,
  ZODIAC_EN,
  getPlanetId,
  DIGNITY_TONE,
  nakNameSi,
} from "@/lib/astro";
import { VedicChart } from "@/components/vedic-chart";
import { DasaTimeline } from "@/components/dasa-timeline";
import { HouseExplorer } from "@/components/house-explorer";
import { DailyPrediction } from "@/components/daily-prediction";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BirthFormData } from "@/components/birth-form";

export type TabId =
  | "overview"
  | "planets"
  | "houses"
  | "yogas"
  | "navamsa"
  | "daily"
  | "remedies";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Sun className="w-4 h-4" /> },
  { id: "planets", label: "Planets", icon: <Stars className="w-4 h-4" /> },
  { id: "houses", label: "Houses", icon: <Home className="w-4 h-4" /> },
  { id: "yogas", label: "Yogas", icon: <Sparkles className="w-4 h-4" /> },
  {
    id: "navamsa",
    label: "Navamsa D9",
    icon: <BookOpen className="w-4 h-4" />,
  },
  { id: "daily", label: "Daily", icon: <CalendarDays className="w-4 h-4" /> },
  { id: "remedies", label: "Remedies", icon: <Gem className="w-4 h-4" /> },
];

export function ChartResults({
  chart,
  reading,
  form,
  activeTab,
  onTabChange,
}: {
  chart: any;
  reading: any;
  form: BirthFormData;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const lagnaSign = chart?.lagna?.sign ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold">
            {chart?.name || "Birth Chart"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-[13px]">
            {chart?.birthDate} · {chart?.birthTime} ·{" "}
            {ZODIAC_NAMES[lagnaSign]?.en || "—"} Lagna
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            SIDEREAL
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            LAHIRI
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Chart analysis sections"
        className="flex border-b border-border overflow-x-auto scrollbar-none"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-medium whitespace-nowrap transition border-b-2",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <OverviewTab reading={reading} chart={chart} />
            )}
            {activeTab === "planets" && (
              <PlanetsTab reading={reading} chart={chart} />
            )}
            {activeTab === "houses" && (
              <HouseExplorer
                houses={chart?.houses || []}
                planets={chart?.planets || []}
                influences={reading?.houseInfluences}
              />
            )}
            {activeTab === "yogas" && <YogasTab reading={reading} />}
            {activeTab === "navamsa" && <NavamsaTab reading={reading} />}
            {activeTab === "daily" && <DailyPrediction form={form} />}
            {activeTab === "remedies" && <RemediesTab reading={reading} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────
function OverviewTab({ reading, chart }: { reading: any; chart: any }) {
  const i = reading?.interpretation || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard
          label="Lagna"
          value={`${ZODIAC_GLYPHS[chart?.lagna?.sign ?? 0] ?? ""} ${ZODIAC_NAMES[chart?.lagna?.sign]?.en || "—"}`}
        />
        <StatCard
          label="Lagna degree"
          value={`${chart?.lagna?.degree?.toFixed(1) || "—"}°`}
        />
        <StatCard label="Planets" value={`${chart?.planets?.length || 0}`} />
        <StatCard
          label="Mahadasa"
          value={reading?.currentDasa?.lordName?.en || "—"}
        />
      </div>

      {reading?.currentDasa && (
        <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-5">
          <h4 className="text-sm font-semibold text-primary mb-4">
            Vimshottari Dasa
          </h4>
          <DasaTimeline
            timeline={chart?.dasaTimeline}
            current={chart?.currentDasa}
          />
        </div>
      )}

      {i.general && <Section title="General reading" text={i.general} />}
      <div className="grid md:grid-cols-2 gap-4">
        {i.career && <Section title="Career" text={i.career} />}
        {i.relationships && (
          <Section title="Relationships" text={i.relationships} />
        )}
        {i.health && <Section title="Health" text={i.health} />}
        {i.finance && <Section title="Finance" text={i.finance} />}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {reading?.strengths?.length > 0 && (
          <div className="bg-tulsi/5 border border-tulsi/25 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-tulsi mb-2">Strengths</h4>
            <ul className="space-y-1">
              {reading.strengths.slice(0, 5).map((s: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-tulsi mt-0.5">•</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {reading?.challenges?.length > 0 && (
          <div className="bg-sindoor/5 border border-sindoor/25 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-sindoor mb-2">
              Challenges
            </h4>
            <ul className="space-y-1">
              {reading.challenges.slice(0, 5).map((c: string, i: number) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-sindoor mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Planets ───────────────────────────────────────────────
function PlanetsTab({ reading, chart }: { reading: any; chart: any }) {
  const dignities = reading?.planetaryDignities || [];
  const aspectDetails = reading?.aspects?.details || [];
  const shadbala = reading?.shadbala || [];

  return (
    <div className="space-y-6">
      {shadbala.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Shadbala — planetary strength{" "}
            <span className="text-muted-foreground font-normal">
              (core components)
            </span>
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Planet</th>
                  <th className="px-3 py-2 font-medium">Strength</th>
                  <th className="px-3 py-2 font-medium">Uchcha</th>
                  <th className="px-3 py-2 font-medium">Dig</th>
                  <th className="px-3 py-2 font-medium">Paksha</th>
                  <th className="px-3 py-2 font-medium">Cheshta</th>
                  <th className="px-3 py-2 font-medium">Drik</th>
                  <th className="px-3 py-2 font-medium">Naisargika</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shadbala.map((s: any) => {
                  const max = Math.max(
                    ...shadbala.map((x: any) => x.totalShastyamsha),
                    1,
                  );
                  return (
                    <tr key={s.planetId}>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-lg leading-none">
                            {PLANET_GLYPHS[s.planetId] || ""}
                          </span>
                          {s.planet}
                          {s.strongest && (
                            <span className="text-[9px] text-tulsi uppercase tracking-wide">
                              ★ strongest
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full",
                                s.strongest ? "bg-tulsi" : "bg-primary/70",
                              )}
                              style={{
                                width: `${(s.totalShastyamsha / max) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {s.totalRupas.toFixed(2)} r
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.uchcha.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.dig.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.paksha.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.cheshta.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.drik.toFixed(0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {s.components.naisargika.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-ash mt-2 leading-relaxed">
            Shadbala core components (shastyamsha units): Uchcha (exaltation),
            Dig (direction), Paksha (lunar phase), Cheshta (motion), Drik
            (aspects), Naisargika (natural). Extended components (Saptavargaja,
            Kendradi, Nathonnata) are not yet included — totals are relative,
            not the full classical Shadbala.
          </p>
        </div>
      )}
      {reading?.panchamahapurushaYogas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Panchamahapurusha Yogas
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

      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">
          Planetary dignities
        </h4>
        <div className="grid md:grid-cols-2 gap-2">
          {dignities.map((d: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-secondary/50 border border-border rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <span className="text-lg leading-none">
                    {PLANET_GLYPHS[getPlanetId(d.planet)] || ""}
                  </span>
                  {d.planet}
                </span>
                <DignityBadge dignity={d.dignity} />
              </div>
              <p className="text-xs text-muted-foreground">{d.explanation}</p>
              {d.isCombust && (
                <p className="text-xs text-sindoor mt-1">
                  Combust — weakened by Sun proximity
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

      {aspectDetails.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">
            Planetary aspects
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">To house</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {aspectDetails.map((a: any, i: number) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {PLANET_GLYPHS[getPlanetId(a.fromPlanet)] || ""}{" "}
                      {a.fromPlanet}
                      <span className="text-muted-foreground font-mono text-xs">
                        {" "}
                        · H{a.fromHouse}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge
                        variant={a.isBenefic ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {a.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      House {a.toHouse}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {a.interpretation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">Positions</h4>
        <div className="grid md:grid-cols-2 gap-2">
          {chart?.planets?.map((p: any, i: number) => (
            <div
              key={i}
              className="bg-secondary/50 border border-border rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm flex items-center gap-1.5">
                  <span className="text-lg leading-none">
                    {PLANET_GLYPHS[p.planet] || ""}
                  </span>
                  {p.name?.en} {p.isRetrograde && "↩"}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  House {p.house}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {ZODIAC_NAMES[p.sign]?.en || "—"} {p.signDegree?.toFixed(2)}° ·{" "}
                {p.nakshatra}
                {nakNameSi(p.nakshatra) && (
                  <span className="text-ash"> ({nakNameSi(p.nakshatra)})</span>
                )}
                {p.nakshatraLord ? ` · ${p.nakshatraLord}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Yogas ─────────────────────────────────────────────────
function YogasTab({ reading }: { reading: any }) {
  return (
    <div className="space-y-6">
      {reading?.yogas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-tulsi mb-3">
            Beneficial yogas
          </h4>
          <div className="grid gap-3">
            {reading.yogas.map((y: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-tulsi/5 border border-tulsi/25 rounded-lg p-4"
              >
                <p className="font-medium text-sm text-tulsi">{y.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {y.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {reading?.doshas?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-sindoor mb-3">
            Doshas (afflictions)
          </h4>
          <div className="grid gap-3">
            {reading.doshas.map((d: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-sindoor/5 border border-sindoor/25 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-sindoor">{d.name}</p>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border",
                      d.severity === "high"
                        ? "bg-sindoor/10 text-sindoor border-sindoor/30"
                        : d.severity === "medium"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                          : "bg-tulsi/10 text-tulsi border-tulsi/30",
                    )}
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

      {!reading?.yogas?.length && !reading?.doshas?.length && (
        <p className="text-sm text-muted-foreground">
          No yogas or doshas detected.
        </p>
      )}
    </div>
  );
}

// ─── Navamsa D9 ────────────────────────────────────────────
function NavamsaTab({ reading }: { reading: any }) {
  const n = reading?.navamsa;
  const [showChart, setShowChart] = useState(true);

  const d9Planets = useMemo(() => {
    if (!n?.planetPlacements) return [];
    return n.planetPlacements
      .filter(
        (p: any) =>
          typeof p.planetId === "number" && typeof p.signId === "number",
      )
      .map((p: any) => ({
        planetId: p.planetId,
        // South Indian grid: house 1 = lagna sign; house = offset from lagna + 1
        house: ((p.signId - n.lagna + 12) % 12) + 1,
        marker: n.vargottamaPlanets?.includes(p.planet)
          ? "Vargottama"
          : undefined,
      }));
  }, [n]);

  if (!n) {
    return (
      <p className="text-sm text-muted-foreground">
        No Navamsa data available.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* D9 chart */}
        <div className="w-full max-w-[380px] mx-auto lg:mx-0">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm text-turmeric">
              D9 Navamsa Chart
            </span>
            <button
              type="button"
              onClick={() => setShowChart((s) => !s)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {showChart ? "Hide" : "Show"} chart
            </button>
          </div>
          <AnimatePresence>
            {showChart && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <VedicChart
                  lagnaSign={n.lagna}
                  planets={d9Planets}
                  chartLabel="D9 Navamsa"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              label="Navamsa lagna"
              value={`${ZODIAC_GLYPHS[n.lagna] ?? ""} ${ZODIAC_NAMES[n.lagna]?.en || "—"}`}
            />
            <StatCard
              label="Vargottama"
              value={n.vargottamaPlanets?.join(", ") || "None"}
            />
          </div>

          {n.marriageAnalysis?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">
                Marriage & relationships
              </h4>
              <div className="space-y-1.5">
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
              <h4 className="text-sm font-semibold text-primary mb-2">
                Planets in D9
              </h4>
              <div className="grid md:grid-cols-2 gap-2">
                {n.planetPlacements.map((p: any, i: number) => (
                  <div
                    key={i}
                    className="bg-secondary/50 border border-border rounded-lg p-3"
                  >
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      {PLANET_GLYPHS[getPlanetId(p.planet)] || ""} {p.planet}
                      <Badge variant="outline" className="text-[10px]">
                        {ZODIAC_GLYPHS[p.signId ?? 0]} {p.sign}
                      </Badge>
                      {n.vargottamaPlanets?.includes(p.planet) && (
                        <span className="text-[10px] text-tulsi font-normal">
                          vargottama
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.interpretation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Remedies ──────────────────────────────────────────────
function RemediesTab({ reading }: { reading: any }) {
  const remedies = reading?.remedies || [];
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
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          className="bg-secondary/50 border border-border rounded-lg p-4 hover:border-primary/30 transition"
        >
          <p className="font-medium text-sm text-primary mb-2 flex items-center gap-1.5">
            {PLANET_GLYPHS[getPlanetId(r.planet)] || ""} {r.planet}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="text-foreground">Gem:</span>{" "}
              {r.gem || "None specific"}
            </p>
            <p>
              <span className="text-foreground">Mantra:</span>{" "}
              <code className="text-primary font-mono">{r.mantra}</code>
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

// ─── Shared bits ───────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate" title={value}>
        {value}
      </p>
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

function DignityBadge({ dignity }: { dignity: string }) {
  const tone = DIGNITY_TONE[dignity] ?? "neutral";
  return (
    <span
      className={cn(
        "text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide",
        tone === "good" && "text-tulsi border-tulsi/40 bg-tulsi/10",
        tone === "warn" &&
          "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
        tone === "bad" && "text-sindoor border-sindoor/40 bg-sindoor/10",
        tone === "neutral" && "text-ash border-border bg-secondary/60",
      )}
    >
      {dignity}
    </span>
  );
}
