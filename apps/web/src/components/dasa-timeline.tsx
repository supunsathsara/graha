"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { PLANET_GLYPHS, PLANET_NAME_BY_ID } from "@/lib/astro";
import { cn } from "@/lib/utils";

/**
 * Vimshottari Dasa timeline — full 120-year cycle with real calendar dates.
 * `timeline` is the 9-Mahadasa sequence from the API (chart.dasaTimeline);
 * the Mahadasa active today is highlighted, and its Antardasas are shown
 * with expandable detail.
 */

interface SubDasaLike {
  lord: number;
  lordName: { en: string; si?: string };
  startDate: string; // ISO date
  endDate: string;
  totalMonths: number;
}

interface DasaLike {
  lord: number;
  lordName: { en: string; si?: string };
  startDate: string;
  endDate: string;
  totalYears: number;
  subPeriods: SubDasaLike[];
}

const DASA_COLORS: Record<number, string> = {
  0: "bg-[#D6A63F]",
  1: "bg-[#A8B8C8]",
  2: "bg-[#7FB069]",
  3: "bg-[#E0A2B8]",
  4: "bg-[#C95A4A]",
  5: "bg-[#E8C76A]",
  6: "bg-[#6E7B9F]",
  10: "bg-[#8F7AC0]",
  11: "bg-[#B08968]",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d ? parseInt(d) : ""} ${months[parseInt(m) - 1] || ""} ${y}`.trim();
}

/** Is `today` inside this Mahadasa's [start, end) window? */
function isActive(p: DasaLike, today: string): boolean {
  if (!p.startDate || !p.endDate) return false;
  const t = today.slice(0, 10);
  return t >= p.startDate && t < p.endDate;
}

export function DasaTimeline({
  timeline,
  current,
  className,
}: {
  timeline?: DasaLike[] | null;
  current?: DasaLike | null;
  className?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [expanded, setExpanded] = useState(false);

  const active = timeline?.find((p) => isActive(p, today)) || current;

  // Fallback: single current dasa without a timeline
  if (!timeline?.length) {
    if (!current) {
      return (
        <p className="text-sm text-muted-foreground">
          No Vimshottari Dasa data available.
        </p>
      );
    }
    return <SingleDasa dasa={current} />;
  }

  const totalDays = (() => {
    const s = new Date(timeline[0].startDate).getTime();
    const e = new Date(timeline[timeline.length - 1].endDate).getTime();
    return Math.max(e - s, 1);
  })();

  return (
    <div className={cn("space-y-5", className)}>
      {/* Active Mahadasa header */}
      {active && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none text-turmeric">
              {PLANET_GLYPHS[active.lord] ?? ""}
            </span>
            <div>
              <p className="text-sm font-semibold">
                Current: Mahadasa of {active.lordName.en}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · {active.totalYears.toFixed(1)}y
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {fmtDate(active.startDate)} → {fmtDate(active.endDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            Antardasas
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </div>
      )}

      {/* Full 120-year Mahadasa bar */}
      <div>
        <div className="flex w-full h-8 rounded-md overflow-hidden bg-secondary">
          {timeline.map((p, i) => {
            const start = new Date(p.startDate).getTime();
            const end = new Date(p.endDate).getTime();
            const pct = Math.max(((end - start) / totalDays) * 100, 0.5);
            const activeNow = active && p.startDate === active.startDate;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                title={`${p.lordName.en}: ${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}`}
                style={{ width: `${pct}%` }}
                className={cn(
                  "relative h-full border-r border-background/40 last:border-r-0",
                  DASA_COLORS[p.lord] ?? "bg-primary/70",
                  activeNow && "ring-2 ring-turmeric ring-inset",
                )}
              />
            );
          })}
        </div>
        {/* Segment labels — every Mahadasa glyph */}
        <div className="flex w-full mt-1.5">
          {timeline.map((p, i) => {
            const start = new Date(p.startDate).getTime();
            const end = new Date(p.endDate).getTime();
            const pct = ((end - start) / totalDays) * 100;
            return (
              <span
                key={i}
                style={{ width: `${Math.max(pct, 4)}%` }}
                className={cn(
                  "font-mono text-[10px] truncate pr-1",
                  active && p.startDate === active.startDate
                    ? "text-turmeric font-bold"
                    : "text-ash/80",
                )}
                title={`${p.lordName.en}: ${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}`}
              >
                {PLANET_GLYPHS[p.lord]} {p.lordName.en.slice(0, 3)}
              </span>
            );
          })}
        </div>
        <div className="flex justify-between font-mono text-[10px] text-ash mt-1">
          <span>{fmtDate(timeline[0].startDate)}</span>
          <span>120-year Vimshottari cycle</span>
          <span>{fmtDate(timeline[timeline.length - 1].endDate)}</span>
        </div>
      </div>

      {/* Antardasa detail for the active Mahadasa */}
      {expanded && active && active.subPeriods?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 overflow-hidden"
        >
          <div className="flex w-full h-6 rounded-md overflow-hidden bg-secondary">
            {active.subPeriods.map((s, i) => {
              const pct = (s.totalMonths / (active.totalYears * 12)) * 100;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  title={`${s.lordName.en}: ${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}`}
                  style={{ width: `${pct}%` }}
                  className={cn(
                    "h-full border-r border-background/40 last:border-r-0",
                    DASA_COLORS[s.lord] ?? "bg-primary/60",
                  )}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {active.subPeriods.map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    DASA_COLORS[s.lord] ?? "bg-primary/60",
                  )}
                />
                {PLANET_GLYPHS[s.lord] ?? ""} {s.lordName.en}
                <span className="font-mono text-[10px] text-ash">
                  {fmtDate(s.startDate)} – {fmtDate(s.endDate)}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Vimshottari Dasa — the classical 120-year cycle. Each Mahadasa activates
        the themes of its ruling planet; Antardasas refine the timing within it.
        Dates are computed from the Moon&apos;s nakshatra position at birth.
      </p>
    </div>
  );
}

function SingleDasa({ dasa }: { dasa: DasaLike }) {
  const totalMonths =
    dasa.subPeriods?.reduce((a, s) => a + s.totalMonths, 0) || 1;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none text-turmeric">
          {PLANET_GLYPHS[dasa.lord] ?? ""}
        </span>
        <div>
          <p className="text-sm font-semibold">
            Mahadasa of {dasa.lordName.en}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {fmtDate(dasa.startDate)} → {fmtDate(dasa.endDate)} ·{" "}
            {dasa.totalYears}y
          </p>
        </div>
      </div>
      {dasa.subPeriods?.length > 0 && (
        <>
          <div className="flex w-full h-6 rounded-md overflow-hidden bg-secondary">
            {dasa.subPeriods.map((s, i) => (
              <div
                key={i}
                title={`${s.lordName.en}: ${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}`}
                style={{ width: `${(s.totalMonths / totalMonths) * 100}%` }}
                className={cn(
                  "h-full border-r border-background/40 last:border-r-0",
                  DASA_COLORS[s.lord] ?? "bg-primary/60",
                )}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {dasa.subPeriods.map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    DASA_COLORS[s.lord] ?? "bg-primary/60",
                  )}
                />
                {PLANET_GLYPHS[s.lord] ?? ""} {s.lordName.en}
                <span className="font-mono text-[10px] text-ash">
                  {fmtDate(s.startDate)} – {fmtDate(s.endDate)}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
