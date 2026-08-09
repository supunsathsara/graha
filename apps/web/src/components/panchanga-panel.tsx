"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, Sunrise, Sunset } from "lucide-react";
import type { BirthFormData } from "@/components/birth-form";
import { cn } from "@/lib/utils";

interface PanchangaDay {
  date: string;
  weekDay: { en: string; si: string };
  beYear: number;
  sinhalaMonth: { en: string; si: string };
  sunrise: string;
  sunset: string;
  dayNakshatra: { name: string; nameSi: string; lord: string };
  rahuKala: {
    name: string;
    nameSi: string;
    start: string;
    end: string;
    segment: number;
    guidance: string;
    guidanceSi: string;
  };
  yamaKala: {
    name: string;
    nameSi: string;
    start: string;
    end: string;
    segment: number;
    guidance: string;
    guidanceSi: string;
  };
  gulikaKala: {
    name: string;
    nameSi: string;
    start: string;
    end: string;
    segment: number;
    guidance: string;
    guidanceSi: string;
  };
  auspiciousWindows: { start: string; end: string }[];
  dayNotes: string[];
}

function fmtTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

export function PanchangaPanel({ form }: { form: BirthFormData }) {
  const [data, setData] = useState<PanchangaDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lon)) {
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/api/panchanga?date=${today}&lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success && d.panchanga) setData(d.panchanga);
        else setError(d.error || "Panchanga unavailable");
      })
      .catch(() => !cancelled && setError("Panchanga unavailable"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [form.latitude, form.longitude]);

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 md:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          Panchanga · Daily almanac
          <span className="text-muted-foreground font-normal">
            (Sinhala tradition)
          </span>
        </h4>
        {data && (
          <span className="font-mono text-[11px] text-ash">
            {data.weekDay.en} · {data.sinhalaMonth.en} {data.beYear} B.E.
          </span>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 w-full bg-secondary animate-pulse rounded"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-sindoor" /> {error}
        </p>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-4"
        >
          {/* Date + sun */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p className="font-display text-lg text-ola-leaf">
                {data.weekDay.si}{" "}
                <span className="text-ash font-sans text-sm">
                  ({data.weekDay.en})
                </span>
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {data.sinhalaMonth.si} {data.beYear} B.E. ·{" "}
                {data.sinhalaMonth.en} {data.beYear - 543}
              </p>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-turmeric" />{" "}
                {fmtTime(data.sunrise)}
              </span>
              <span className="flex items-center gap-1">
                <Sunset className="w-3.5 h-3.5 text-sindoor" />{" "}
                {fmtTime(data.sunset)}
              </span>
              <span className="text-ash">
                නැකත: {data.dayNakshatra.nameSi} ({data.dayNakshatra.name}) ·{" "}
                {data.dayNakshatra.lord}
              </span>
            </div>
          </div>

          {/* The three Kalas */}
          <div className="grid sm:grid-cols-3 gap-2">
            <KalaCard period={data.rahuKala} tone="bad" />
            <KalaCard period={data.yamaKala} tone="warn" />
            <KalaCard period={data.gulikaKala} tone="warn" />
          </div>

          {/* Auspicious windows */}
          {data.auspiciousWindows.length > 0 && (
            <div className="rounded-lg border border-tulsi/25 bg-tulsi/5 p-3">
              <p className="text-xs text-tulsi uppercase tracking-wider font-medium">
                Auspicious windows (outside all Kalas)
              </p>
              <div className="flex flex-wrap gap-3 mt-1.5 font-mono text-sm text-ola-leaf">
                {data.auspiciousWindows.map((w, i) => (
                  <span key={i}>
                    {fmtTime(w.start)} – {fmtTime(w.end)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Day notes */}
          <ul className="space-y-1">
            {data.dayNotes.map((n, i) => (
              <li
                key={i}
                className={cn(
                  "text-xs leading-relaxed",
                  i === data.dayNotes.length - 1
                    ? "text-ash"
                    : "text-muted-foreground",
                )}
              >
                {n}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

function KalaCard({
  period,
  tone,
}: {
  period: PanchangaDay["rahuKala"];
  tone: "bad" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "bad"
          ? "border-sindoor/30 bg-sindoor/5"
          : "border-yellow-500/30 bg-yellow-500/5",
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-xs font-medium",
            tone === "bad" ? "text-sindoor" : "text-yellow-400",
          )}
        >
          {period.name} <span className="ml-1 font-sans">{period.nameSi}</span>
        </p>
        <span className="font-mono text-[10px] text-ash">
          #{period.segment}
        </span>
      </div>
      <p className="font-mono text-sm text-ola-leaf mt-1">
        {fmtTime(period.start)} – {fmtTime(period.end)}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
        {period.guidance}
      </p>
    </div>
  );
}
