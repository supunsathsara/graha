"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PLANET_GLYPHS,
  PLANET_NAME_BY_ID,
  ZODIAC_GLYPHS,
  ZODIAC_EN,
  SIGN_LORDS,
  HOUSE_SIGNIFICANCE,
} from "@/lib/astro";
import { cn } from "@/lib/utils";

/**
 * 12-house explorer — grid of all bhavas with sign, lord, and occupants.
 * Click a house to see its detailed influence text below.
 */

interface HouseLike {
  number: number;
  sign: number;
  lord: number;
  startLongitude: number;
  endLongitude: number;
}

interface PlanetLike {
  planet: number;
  name?: { en: string };
  house: number;
  sign: number;
  signDegree: number;
  isRetrograde?: boolean;
}

export function HouseExplorer({
  houses,
  planets,
  influences,
}: {
  houses: HouseLike[];
  planets: PlanetLike[];
  influences?: string[];
}) {
  const [selected, setSelected] = useState<number>(1);

  const planetsByHouse: Record<number, PlanetLike[]> = {};
  for (const p of planets) {
    if (!planetsByHouse[p.house]) planetsByHouse[p.house] = [];
    planetsByHouse[p.house].push(p);
  }

  const house = houses.find((h) => h.number === selected);
  const selectedPlanets = planetsByHouse[selected] || [];
  const influenceText = influences?.[selected - 1];

  return (
    <div className="space-y-6">
      {/* 12-house grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {houses.map((h) => {
          const occupants = planetsByHouse[h.number] || [];
          const active = selected === h.number;
          return (
            <motion.button
              key={h.number}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: h.number * 0.03 }}
              onClick={() => setSelected(h.number)}
              data-house={h.number}
              aria-pressed={active}
              className={cn(
                "text-left rounded-lg border p-2.5 transition-all",
                active
                  ? "border-turmeric/70 bg-turmeric/5 shadow-[0_0_0_1px_hsl(var(--turmeric)/0.3)]"
                  : "border-border bg-secondary/40 hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-data text-[10px] text-ash">{h.number}</span>
                <span className="font-data text-[10px] text-ash/70">{ZODIAC_GLYPHS[h.sign]}</span>
              </div>
              <div className="mt-1">
                <p className="font-data text-sm leading-none text-turmeric flex flex-wrap gap-x-1">
                  {occupants.length > 0 ? (
                    occupants.map((p) => (
                      <span key={p.planet} title={p.name?.en}>
                        {PLANET_GLYPHS[p.planet]}
                        {p.isRetrograde ? "↩" : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-ash/40 text-[10px]">—</span>
                  )}
                </p>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{ZODIAC_EN[h.sign]}</span>
                <span title={`Lord: ${PLANET_NAME_BY_ID[h.lord]}`}>
                  {PLANET_GLYPHS[h.lord]}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail panel */}
      {house && (
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-xl bg-card/60 p-4 md:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-base">
                House {house.number} — {HOUSE_SIGNIFICANCE[house.number] ?? "Matters"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sign: <span className="text-foreground">{ZODIAC_EN[house.sign]}</span> ·{" "}
                Lord: <span className="text-foreground">{PLANET_NAME_BY_ID[SIGN_LORDS[house.sign]] ?? PLANET_NAME_BY_ID[house.lord]}</span>
              </p>
            </div>
            <span className="font-mono text-[10px] text-ash uppercase tracking-wider">
              {house.startLongitude.toFixed(2)}° → {house.endLongitude.toFixed(2)}°
            </span>
          </div>

          {selectedPlanets.length > 0 ? (
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {selectedPlanets.map((p) => (
                <div key={p.planet} className="rounded-lg bg-secondary/50 border border-border p-2.5">
                  <p className="text-sm font-medium">
                    {PLANET_GLYPHS[p.planet]} {p.name?.en}{" "}
                    {p.isRetrograde && <span className="text-yellow-400">↩</span>}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {ZODIAC_EN[p.sign]} {p.signDegree.toFixed(2)}°
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No planets occupy this house — its matters are directed by its lord
              ({PLANET_NAME_BY_ID[house.lord]}) placed elsewhere in the chart.
            </p>
          )}

          {influenceText && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Influence
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {influenceText}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
