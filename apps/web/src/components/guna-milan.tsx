"use client";

import { motion } from "framer-motion";
import {
  PLANET_GLYPHS,
  ZODIAC_GLYPHS,
  ZODIAC_EN,
  nakNameSi,
} from "@/lib/astro";
import { cn } from "@/lib/utils";

/**
 * Guna Milan results dashboard — 36-point Ashtakoota breakdown.
 */

export interface MatchResult {
  success: boolean;
  matchId?: string;
  boy: {
    name?: string;
    moonSign: number;
    nakshatra: string;
    nakshatraPada: number;
    lagnaSign: number;
    manglik: boolean;
    mangal: {
      hasDosha: boolean;
      severity: string;
      positions: { ref: string; house: number }[];
      cancellations: string[];
      manglik: boolean;
    };
  };
  girl: {
    name?: string;
    moonSign: number;
    nakshatra: string;
    nakshatraPada: number;
    lagnaSign: number;
    manglik: boolean;
    mangal: {
      hasDosha: boolean;
      severity: string;
      positions: { ref: string; house: number }[];
      cancellations: string[];
      manglik: boolean;
    };
  };
  kootas: {
    key: string;
    name: string;
    nameSi?: string;
    max: number;
    points: number;
    detail: string;
    sub?: Record<string, string>;
  }[];
  total: number;
  maxTotal: number;
  verdict: {
    grade: string;
    gradeSi?: string;
    label: string;
    color: "excellent" | "good" | "average" | "poor" | "very-poor";
    note: string;
  };
  doshas: {
    key: string;
    name: string;
    nameSi?: string;
    present: boolean;
    severity: "high" | "medium" | "low";
    description: string;
    cancelled?: boolean;
    cancellationNote?: string;
  }[];
  vedhaPair?: { boy: string; girl: string };
  rajju: { present: boolean; boyPart: string; girlPart: string };
  lagna?: {
    boySign: number;
    girlSign: number;
    boyLord: string;
    girlLord: string;
    relation: "friend" | "neutral" | "enemy";
    relationDetail: string;
    houseRelation: string;
    favorable: boolean;
    note: string;
  };
  recommendations: string[];
}

const VERDICT_STYLES: Record<
  MatchResult["verdict"]["color"],
  { ring: string; text: string; bar: string }
> = {
  excellent: { ring: "text-tulsi", text: "text-tulsi", bar: "bg-tulsi" },
  good: { ring: "text-turmeric", text: "text-turmeric", bar: "bg-turmeric" },
  average: { ring: "text-ash", text: "text-ash", bar: "bg-ash" },
  poor: {
    ring: "text-yellow-500",
    text: "text-yellow-500",
    bar: "bg-yellow-500",
  },
  "very-poor": {
    ring: "text-sindoor",
    text: "text-sindoor",
    bar: "bg-sindoor",
  },
};

export function GunaMilanResult({ result }: { result: MatchResult }) {
  const pct = (result.total / result.maxTotal) * 100;
  const style = VERDICT_STYLES[result.verdict.color];
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-8">
      {/* Score hero */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-card border border-border rounded-2xl p-6 md:p-8">
        {/* Gauge */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 120 120" className="w-40 h-40 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - (pct / 100) * C }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={style.bar}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl text-ola-leaf tabular-nums">
              {result.total}
              <span className="text-sm text-ash">/{result.maxTotal}</span>
            </span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest font-medium mt-0.5",
                style.text,
              )}
            >
              {result.verdict.label}
            </span>
          </div>
        </div>

        {/* Verdict */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <p className="font-display text-2xl">
            {result.verdict.grade}
            {result.verdict.gradeSi && (
              <span className="font-sans text-base text-ola-leaf">
                {" "}
                · {result.verdict.gradeSi}
              </span>
            )}{" "}
            <span
              className={cn(
                "text-sm font-sans font-medium uppercase tracking-wider",
                style.text,
              )}
            >
              · {result.verdict.label}
            </span>
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            {result.verdict.note}
          </p>

          {/* Person summary chips */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
            <PersonChip
              label={result.boy.name || "Boy"}
              sign={result.boy.moonSign}
              nak={result.boy.nakshatra}
              pada={result.boy.nakshatraPada}
              manglik={result.boy.manglik}
            />
            <PersonChip
              label={result.girl.name || "Girl"}
              sign={result.girl.moonSign}
              nak={result.girl.nakshatra}
              pada={result.girl.nakshatraPada}
              manglik={result.girl.manglik}
            />
          </div>
        </div>
      </div>

      {/* Koota grid */}
      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">
          Ashtakoota breakdown (36 points)
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {result.kootas.map((k, i) => (
            <motion.div
              key={k.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl border p-4",
                k.points === k.max
                  ? "border-tulsi/30 bg-tulsi/5"
                  : k.points === 0
                    ? "border-sindoor/25 bg-sindoor/5"
                    : "border-border bg-secondary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {k.name}
                  {k.nameSi && (
                    <span className="ml-1.5 normal-case font-sans">
                      {k.nameSi}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    k.points === k.max
                      ? "text-tulsi"
                      : k.points === 0
                        ? "text-sindoor"
                        : "text-ola-leaf",
                  )}
                >
                  {k.points}/{k.max}
                </span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(k.points / k.max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={cn(
                    "h-full",
                    k.points === k.max
                      ? "bg-tulsi"
                      : k.points === 0
                        ? "bg-sindoor"
                        : "bg-primary/70",
                  )}
                />
              </div>
              {k.sub && (
                <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-mono text-ash">
                  {Object.entries(k.sub).map(([label, val]) => (
                    <span key={label} className="capitalize">
                      {label}:{" "}
                      <span className="text-muted-foreground">{val}</span>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                {k.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Doshas */}
      <div>
        <h4 className="text-sm font-semibold text-primary mb-3">
          Dosha analysis
        </h4>
        {result.doshas.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-tulsi/25 bg-tulsi/5 p-4">
            No matching doshas detected. The match is traditionally clean.
          </p>
        ) : (
          <div className="space-y-3">
            {result.doshas.map((d, i) => (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "rounded-xl border p-4",
                  d.cancelled
                    ? "border-tulsi/30 bg-tulsi/5"
                    : d.severity === "high"
                      ? "border-sindoor/30 bg-sindoor/5"
                      : "border-yellow-500/30 bg-yellow-500/5",
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      d.cancelled
                        ? "text-tulsi"
                        : d.severity === "high"
                          ? "text-sindoor"
                          : "text-yellow-400",
                    )}
                  >
                    {d.name}
                    {d.nameSi && (
                      <span className="ml-1.5 font-sans font-normal">
                        {d.nameSi}
                      </span>
                    )}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-medium",
                      d.cancelled
                        ? "text-tulsi border-tulsi/40 bg-tulsi/10"
                        : d.severity === "high"
                          ? "text-sindoor border-sindoor/40 bg-sindoor/10"
                          : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
                    )}
                  >
                    {d.cancelled ? "Cancelled" : d.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                  {d.description}
                </p>
                {d.cancellationNote && (
                  <p className="text-xs text-tulsi mt-1.5">
                    {d.cancellationNote}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lagna compatibility — Sri Lankan practice */}
      {result.lagna && (
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-primary">
              Lagna compatibility{" "}
              <span className="text-muted-foreground font-normal">
                (Sri Lankan practice)
              </span>
            </h4>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-medium",
                result.lagna.favorable
                  ? "text-tulsi border-tulsi/40 bg-tulsi/10"
                  : result.lagna.relation === "enemy"
                    ? "text-sindoor border-sindoor/40 bg-sindoor/10"
                    : "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
              )}
            >
              {result.lagna.favorable ? "Favorable" : "Caution"}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 font-mono text-xs text-muted-foreground">
            <span>
              Boy lagna:{" "}
              <span className="text-ola-leaf">
                {ZODIAC_GLYPHS[result.lagna.boySign]}{" "}
                {ZODIAC_EN[result.lagna.boySign]}
              </span>{" "}
              <span className="text-ash">({result.lagna.boyLord})</span>
            </span>
            <span>
              Girl lagna:{" "}
              <span className="text-ola-leaf">
                {ZODIAC_GLYPHS[result.lagna.girlSign]}{" "}
                {ZODIAC_EN[result.lagna.girlSign]}
              </span>{" "}
              <span className="text-ash">({result.lagna.girlLord})</span>
            </span>
            <span>
              Relation:{" "}
              <span className="text-ola-leaf">
                {result.lagna.relationDetail}
              </span>
            </span>
            <span>
              Houses:{" "}
              <span className="text-ola-leaf">
                {result.lagna.houseRelation}
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            {result.lagna.note}
          </p>
        </div>
      )}

      {/* Mangal details per person */}
      <div className="grid md:grid-cols-2 gap-4">
        <MangalCard
          title={`${result.boy.name || "Boy"} — Mangal`}
          mangal={result.boy.mangal}
        />
        <MangalCard
          title={`${result.girl.name || "Girl"} — Mangal`}
          mangal={result.girl.mangal}
        />
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <h4 className="text-sm font-semibold text-primary mb-3">
          Traditional recommendations
        </h4>
        <ul className="space-y-2">
          {result.recommendations.map((r, i) => (
            <li
              key={i}
              className="text-sm text-muted-foreground flex items-start gap-2"
            >
              <span className="text-turmeric mt-0.5">◆</span>
              {r}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-ash mt-4 leading-relaxed">
          This analysis follows the classical Ashtakoota (Guna Milan) system and
          the traditional Mangal / Nadi / Bhakoot / Vedha / Rajju dosha rules —
          the same framework used by generations of Jyotishis. Every score is
          computed from precise Swiss Ephemeris positions. For marriage
          decisions, always consult a qualified Jyotishi together with your
          family tradition.
        </p>
      </div>
    </div>
  );
}

function PersonChip({
  label,
  sign,
  nak,
  pada,
  manglik,
}: {
  label: string;
  sign: number;
  nak: string;
  pada: number;
  manglik: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <span className="text-xl leading-none text-turmeric">
        {ZODIAC_GLYPHS[sign]}
      </span>
      <div className="text-left">
        <p className="text-xs font-medium">{label}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {ZODIAC_EN[sign]} · {nak} {pada}
          {nakNameSi(nak) && <span> · {nakNameSi(nak)}</span>} ·{" "}
          {manglik ? "Manglik" : "Non-Manglik"}
        </p>
      </div>
    </div>
  );
}

function MangalCard({
  title,
  mangal,
}: {
  title: string;
  mangal: MatchResult["boy"]["mangal"];
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </p>
      {!mangal.hasDosha ? (
        <p className="text-sm text-tulsi">
          No Mangal dosha — Mars is not in a dosha position.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Mars in{" "}
            {mangal.positions.map((p, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <span className="text-foreground font-medium">
                  {p.ref} house {p.house}
                </span>
              </span>
            ))}
          </p>
          {mangal.cancellations.length > 0 ? (
            <ul className="space-y-1">
              {mangal.cancellations.map((c, i) => (
                <li
                  key={i}
                  className="text-xs text-tulsi flex items-start gap-1.5"
                >
                  <span>✓</span>
                  {c}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-sindoor">
              No classical cancellation applies —{" "}
              {mangal.manglik
                ? "dosha is active (Manglik)."
                : "dosha is active."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
