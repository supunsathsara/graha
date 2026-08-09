"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Heart,
  Loader2,
  Share2,
} from "lucide-react";
import { ZODIAC_NAMES } from "@graha/shared";
import { VedicChart, ChartPreview } from "@/components/vedic-chart";
import { BirthForm, type BirthFormData } from "@/components/birth-form";
import { ChartResults, type TabId } from "@/components/chart-results";
import { VaultPanel } from "@/components/vault-panel";
import { KeyModal } from "@/components/key-modal";
import {
  saveChart,
  getChart,
  keyAcknowledged,
  markKeyAcknowledged,
} from "@/lib/vault";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChartKind = "d1" | "d9" | "d10";

const EMPTY_FORM: BirthFormData = {
  name: "",
  birthDate: "",
  birthTime: "",
  latitude: "",
  longitude: "",
  timezone: "Asia/Colombo",
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Encode form data into a shareable URL hash. */
function encodeShare(form: BirthFormData): string {
  const params = new URLSearchParams();
  if (form.name) params.set("n", form.name);
  params.set("d", form.birthDate);
  params.set("t", form.birthTime);
  params.set("la", form.latitude);
  params.set("lo", form.longitude);
  params.set("tz", form.timezone);
  return `#chart=${params.toString()}`;
}

function decodeShare(hash: string): Partial<BirthFormData> | null {
  const m = hash.match(/#chart=(.*)/);
  if (!m) return null;
  const params = new URLSearchParams(m[1]);
  const d = params.get("d");
  const t = params.get("t");
  const la = params.get("la");
  const lo = params.get("lo");
  if (!d || !t || !la || !lo) return null;
  return {
    name: params.get("n") || "",
    birthDate: d,
    birthTime: t,
    latitude: la,
    longitude: lo,
    timezone: params.get("tz") || "Asia/Colombo",
  };
}

export default function Home() {
  const [form, setForm] = useState<BirthFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [chartKind, setChartKind] = useState<ChartKind>("d1");
  const [shared, setShared] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [loadedResult, setLoadedResult] = useState<{
    chart: any;
    reading: any;
    birthData: any;
  } | null>(null);
  const [savePending, setSavePending] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Prefill from shareable URL hash
  useEffect(() => {
    const decoded = decodeShare(window.location.hash);
    if (decoded) {
      const prefilled = { ...EMPTY_FORM, ...decoded };
      setForm(prefilled);
      mutation.mutate(prefilled);
    }
    setReducedMotion(prefersReducedMotion());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: async (f: BirthFormData) => {
      const res = await fetch(`/api/prediction/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: f.birthDate,
          birthTime: f.birthTime,
          latitude: parseFloat(f.latitude),
          longitude: parseFloat(f.longitude),
          timezone: f.timezone,
          name: f.name || undefined,
          aiMode: "polish",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to compute horoscope");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      setLoadedResult(null); // a fresh computation replaces any vault load
      setActiveTab("overview");
      setChartKind("d1");
    },
  });

  const handleSubmit = useCallback(
    (data: BirthFormData) => {
      setForm(data);
      mutation.mutate(data);
    },
    [mutation],
  );

  const handleShare = async () => {
    const url =
      window.location.origin + window.location.pathname + encodeShare(form);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      window.prompt("Copy this link to share your chart:", url);
    }
  };

  // ─── Family vault handlers ──────────────────────────────
  const handleVaultSave = async () => {
    if (!mutation.data?.chart || !mutation.data?.reading) return;
    setSavePending(true);
    try {
      const label =
        form.name?.trim() || `${form.birthDate} · ${form.birthTime}`;
      await saveChart(label, form, mutation.data.chart, mutation.data.reading);
      // First save → make sure the user backs up the recovery key.
      if (!keyAcknowledged()) setShowKeyModal(true);
    } catch {}
    setSavePending(false);
  };

  const handleVaultLoad = async (id: string) => {
    try {
      const saved = await getChart(id);
      setForm((f) => ({ ...f, ...saved.birthData }));
      setLoadedResult({
        chart: saved.chart,
        reading: saved.reading,
        birthData: saved.birthData,
      });
      setActiveTab("overview");
      setChartKind("d1");
    } catch {}
  };

  // Displayed results: a vault load wins, otherwise the latest computation.
  const chart = loadedResult?.chart || mutation.data?.chart;
  const reading = loadedResult?.reading || mutation.data?.reading;
  const lagnaSign = chart?.lagna?.sign ?? 0;

  // D9 planets from reading (with planetId/signId now exposed by the API)
  const d9Planets = useMemo(() => {
    const n = reading?.navamsa;
    if (!n?.planetPlacements) return [];
    return n.planetPlacements
      .filter(
        (p: any) =>
          typeof p.planetId === "number" && typeof p.signId === "number",
      )
      .map((p: any) => ({
        planetId: p.planetId,
        house: ((p.signId - n.lagna + 12) % 12) + 1,
        marker: n.vargottamaPlanets?.includes(p.planet)
          ? "Vargottama"
          : undefined,
      }));
  }, [reading]);

  // D10 (Dashamsha) planets — same South-Indian grid, keyed by D10 lagna
  const d10Planets = useMemo(() => {
    const d = reading?.dashamsha;
    if (!d?.planetPlacements) return [];
    return d.planetPlacements
      .filter((p: any) => typeof p.signId === "number")
      .map((p: any) => ({
        planetId: p.planetId,
        house: ((p.signId - d.lagna + 12) % 12) + 1,
      }));
  }, [reading]);

  const d1Planets = useMemo(
    () =>
      (chart?.planets || []).map((p: any) => ({
        planetId: p.planet,
        house: p.house,
      })),
    [chart],
  );

  const activePlanets =
    chartKind === "d1"
      ? d1Planets
      : chartKind === "d9"
        ? d9Planets
        : d10Planets;
  const activeLagna =
    chartKind === "d1"
      ? lagnaSign
      : chartKind === "d9"
        ? reading?.navamsa?.lagna
        : reading?.dashamsha?.lagna;
  const activeLabel =
    chartKind === "d1"
      ? "D1 Rasi"
      : chartKind === "d9"
        ? "D9 Navamsa"
        : "D10 Dashamsha";

  return (
    <div className="flex flex-col min-h-screen bg-night text-ola-leaf overflow-x-hidden">
      {/* Header */}
      <SiteHeader
        right={
          <div className="flex items-center gap-2">
            <VaultPanel
              canSave={!!mutation.data?.chart}
              onSave={handleVaultSave}
              onLoad={handleVaultLoad}
              savePending={savePending}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              disabled={!chart}
              title="Copy a link to this chart"
            >
              {shared ? (
                <Check className="w-3.5 h-3.5 text-tulsi" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {shared ? "Copied" : "Share"}
              </span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT: Birth details */}
        <aside className="w-full lg:w-[380px] xl:w-[400px] border-r border-ash/30 p-4 md:p-8 flex flex-col gap-6 bg-manuscript/40">
          <div className="flex flex-col gap-1.5">
            <h2 className="font-display text-xl font-medium text-ola-leaf">
              Native Details
            </h2>
            <p className="font-sans text-sm text-ash leading-relaxed">
              Sidereal calculation · Lahiri Ayanamsa · Placidus houses
            </p>
          </div>

          <BirthForm
            onSubmit={handleSubmit}
            pending={mutation.isPending}
            initial={form}
          />

          <p className="text-[11px] text-ash/70 leading-relaxed">
            Charts are computed on the fly with the Swiss Ephemeris. No account
            needed; recent charts are stored only in your browser.
          </p>
        </aside>

        {/* RIGHT: Results */}
        <section className="flex-1 p-4 md:p-8 flex flex-col gap-8 bg-night min-w-0">
          {/* Chart wheel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="w-full max-w-[480px] mx-auto lg:mx-0">
              {/* Chart kind toggle */}
              <div className="flex items-center justify-between mb-3 border-b border-ash/20 pb-2">
                <div
                  className="flex items-center gap-1"
                  role="tablist"
                  aria-label="Chart type"
                >
                  {(
                    [
                      { id: "d1", label: "D1 Rasi" },
                      { id: "d9", label: "D9 Navamsa" },
                      { id: "d10", label: "D10 Dashamsha" },
                    ] as const
                  ).map((k) => (
                    <button
                      key={k.id}
                      role="tab"
                      aria-selected={chartKind === k.id}
                      onClick={() => setChartKind(k.id)}
                      disabled={!mutation.isSuccess}
                      className={cn(
                        "font-display text-sm px-2 py-0.5 transition border-b-2",
                        chartKind === k.id
                          ? "text-turmeric border-turmeric"
                          : "text-ash border-transparent hover:text-ola-leaf disabled:opacity-40",
                      )}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                <span className="font-mono text-[10px] text-ash">SIDEREAL</span>
              </div>

              {chart ? (
                <VedicChart
                  lagnaSign={activeLagna ?? lagnaSign}
                  planets={activePlanets}
                  chartLabel={activeLabel}
                  animate={!reducedMotion}
                />
              ) : (
                <ChartPreview label={activeLabel} />
              )}

              {/* Mini readout */}
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-ash">
                <span>
                  Lagna:{" "}
                  <span className="text-turmeric">
                    {chart ? ZODIAC_NAMES[activeLagna ?? lagnaSign]?.en : "—"}
                  </span>
                </span>
                <span>
                  Mahadasa:{" "}
                  <span className="text-turmeric">
                    {chart ? reading?.currentDasa?.lordName?.en || "—" : "—"}
                  </span>
                </span>
              </div>
            </div>

            {/* Intro / empty state */}
            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col gap-2 border-b border-ash/20 pb-4">
                <h3 className="font-display text-xl text-ola-leaf">
                  Instrument Reading
                </h3>
                {!chart ? (
                  <p className="font-sans text-sm text-ash leading-relaxed">
                    Enter a birth date, time, and place to generate a Rasi
                    chart, dasa timeline, house analysis, and remedies.
                  </p>
                ) : (
                  <p className="font-sans text-sm text-ash leading-relaxed">
                    Calculations complete — {chart?.name || "chart"} ready.
                    Explore the tabs below for planetary dignities, yogas,
                    Navamsa, daily transits, and remedies.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4 md:space-y-6">
            {/* Error */}
            <AnimatePresence>
              {mutation.isError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-sindoor/10 border border-sindoor/30 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-sindoor shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Computation failed</p>
                    <p className="text-sm text-muted-foreground">
                      {(mutation.error as Error)?.message ||
                        "Something went wrong"}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {mutation.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-xl p-6 md:p-8 space-y-4"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Computing ephemeris…
                </p>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
              {(mutation.isSuccess || loadedResult) && reading && chart && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ChartResults
                    chart={chart}
                    reading={reading}
                    form={form}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />

                  {/* Cross-link: kundli matching with a partner */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4"
                  >
                    <div className="text-sm text-muted-foreground min-w-0">
                      <p className="text-ola-leaf font-medium flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-sindoor" />
                        Check compatibility with a partner
                      </p>
                      <p className="text-xs mt-0.5">
                        Guna Milan — 36-point Ashtakoota, Kuja dosha and Lagna
                        compatibility, following classical Sinhala practice.
                      </p>
                    </div>
                    <Link
                      href="/match"
                      className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-medium hover:bg-primary/80 transition"
                    >
                      Kundli match
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <SiteFooter />

      {/* First-save recovery key modal */}
      <KeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />
    </div>
  );
}
