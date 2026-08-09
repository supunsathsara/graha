"use client";

import { motion } from "framer-motion";
import { PLANET_GLYPHS, PLANET_NAME_BY_ID } from "@/lib/astro";
import { cn } from "@/lib/utils";

/**
 * Vimshottari Dasa timeline — visual Mahadasa bar with Antardasa segments.
 * Data comes from chart.currentDasa (lordName, totalYears, subPeriods[]).
 */

interface SubDasaLike {
  lord: number;
  lordName: { en: string; si?: string };
  startDate: string; // "Xy Ym"
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

function parseMonths(s: string): number {
  const m = s.match(/(\d+)y\s*(\d+)m/);
  if (m) return parseInt(m[1]) * 12 + parseInt(m[2]);
  const y = s.match(/(\d+)/);
  return y ? parseInt(y[1]) * 12 : 0;
}

export function DasaTimeline({ dasa }: { dasa: DasaLike | null | undefined }) {
  if (!dasa || !dasa.subPeriods?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No Vimshottari Dasa data available.
      </p>
    );
  }

  const totalMonths = dasa.subPeriods.reduce((acc, s) => acc + s.totalMonths, 0) || 1;

  return (
    <div className="space-y-5">
      {/* Mahadasa header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none text-turmeric">
            {PLANET_GLYPHS[dasa.lord] ?? ""}
          </span>
          <div>
            <p className="text-sm font-semibold">
              Mahadasa of {dasa.lordName.en}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {dasa.totalYears} years · {dasa.startDate} → {dasa.endDate}
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ash">
          Vimshottari · 120y cycle
        </span>
      </div>

      {/* Mahadasa bar */}
      <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", DASA_COLORS[dasa.lord] ?? "bg-primary")}
        />
      </div>

      {/* Antardasa segments */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Antardasa periods
        </p>
        <div className="flex w-full h-6 rounded-md overflow-hidden bg-secondary">
          {dasa.subPeriods.map((s, i) => {
            const pct = (s.totalMonths / totalMonths) * 100;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scaleY: 0.6 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                title={`${s.lordName.en}: ${s.startDate} → ${s.endDate}`}
                style={{ width: `${pct}%` }}
                className={cn(
                  "h-full border-r border-background/40 last:border-r-0",
                  DASA_COLORS[s.lord] ?? "bg-primary/70"
                )}
              />
            );
          })}
        </div>
        {/* legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {dasa.subPeriods.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", DASA_COLORS[s.lord] ?? "bg-primary/70")} />
              {PLANET_GLYPHS[s.lord] ?? ""} {s.lordName.en}
              <span className="font-mono text-[10px] text-ash">
                {s.startDate}–{s.endDate}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Semantic note */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Currently in the <span className="text-foreground font-medium">Mahadasa of {dasa.lordName.en}</span>.
        Sub-periods activate the themes of their ruling planet for their duration —
        the dominant planetary period shapes career, relationships, and personal focus.
      </p>
    </div>
  );
}

export function planetName(id: number): string {
  return PLANET_NAME_BY_ID[id] ?? `Planet ${id}`;
}
