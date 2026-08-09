import { motion } from "framer-motion";
import {
  PLANET_SHORT,
  PLANET_GLYPHS,
  ZODIAC_GLYPHS,
  ZODIAC_EN,
} from "@/lib/astro";
import { cn } from "@/lib/utils";

/**
 * South Indian fixed-grid Vedic chart wheel.
 * Works for both Rasi (D1) and Navamsa (D9) — houses are fixed cells;
 * the lagna sign determines which sign each cell holds, and planets are
 * placed by their house. Vargottama / highlighted planets get a Tulsi dot.
 *
 * Accessibility: the visual grid is accompanied by a visually-hidden table
 * of house → sign → planets so screen readers get the same data.
 */

// Grid index (row-major, 16 cells) → house number. 0 = center / skip.
const HOUSE_GRID = [12, 1, 2, 3, 11, 0, 0, 4, 10, 0, 0, 5, 9, 8, 7, 6];

export interface ChartPlanet {
  planetId: number;
  house: number;
  /** e.g. "Vargottama" — adds a marker */
  marker?: string;
}

export function VedicChart({
  lagnaSign,
  planets = [],
  chartLabel = "D1 Rasi",
  showEmpty = true,
  selectedHouse,
  onHouseSelect,
  className = "",
  animate = true,
}: {
  lagnaSign: number;
  planets?: ChartPlanet[];
  chartLabel?: string;
  showEmpty?: boolean;
  selectedHouse?: number | null;
  onHouseSelect?: (house: number) => void;
  className?: string;
  animate?: boolean;
}) {
  const housePlanets: Record<number, ChartPlanet[]> = {};
  for (const p of planets) {
    if (!housePlanets[p.house]) housePlanets[p.house] = [];
    housePlanets[p.house].push(p);
  }

  const houseSign = (h: number) => (h - 1 + lagnaSign) % 12;

  const renderCell = (gridIndex: number) => {
    const houseNum = HOUSE_GRID[gridIndex];
    if (houseNum === 0) {
      if (gridIndex === 5) {
        return (
          <div
            key="center"
            className="chart-center flex items-center justify-center"
          >
            <div className="text-center relative z-10 p-1">
              <div className="font-display text-xs text-ash uppercase tracking-widest">
                {chartLabel}
              </div>
              <div className="font-data text-[9px] text-ash/50 mt-1">
                Lahiri Ayanamsa
              </div>
            </div>
          </div>
        );
      }
      return (
        <div key={`skip-${gridIndex}`} className="border-0 bg-transparent" />
      );
    }

    const sign = houseSign(houseNum);
    const isLagna = houseNum === 1;
    const cellPlanets = housePlanets[houseNum] || [];
    const isSelected = selectedHouse === houseNum;
    const clickable = !!onHouseSelect;

    const inner = (
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onHouseSelect?.(houseNum) : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onHouseSelect?.(houseNum);
                }
              }
            : undefined
        }
        aria-label={
          `House ${houseNum}, ${ZODIAC_EN[sign]}, ` +
          (cellPlanets.length
            ? cellPlanets.map((p) => PLANET_SHORT[p.planetId]).join(", ")
            : "no planets")
        }
        className={cn(
          "relative flex flex-col items-center justify-center p-2 h-full w-full select-none cursor-default",
          clickable && "cursor-pointer hover:bg-turmeric/5 transition-colors",
          isSelected && "bg-turmeric/10",
        )}
      >
        {/* House number */}
        <span
          className={cn(
            "absolute top-1 left-1 font-data text-[9px] leading-none",
            isLagna ? "text-turmeric" : "text-ash/70",
          )}
        >
          {houseNum}
        </span>

        {/* Zodiac glyph */}
        <span className="absolute bottom-1 right-1 font-data text-[9px] text-ash/50 leading-none">
          {ZODIAC_GLYPHS[sign]}
        </span>

        {/* Planets */}
        {cellPlanets.length > 0 ? (
          <span
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-1 gap-y-0 font-data text-[11px] md:text-xs text-center leading-tight",
              isLagna ? "font-bold text-turmeric" : "text-turmeric",
            )}
          >
            {cellPlanets.map((p) => (
              <span
                key={p.planetId}
                className="relative inline-flex items-center gap-0.5"
              >
                {PLANET_GLYPHS[p.planetId]}
                {PLANET_SHORT[p.planetId]}
                {p.marker && (
                  <span
                    className="absolute -top-1 -right-1.5 size-1 rounded-full bg-tulsi"
                    title={p.marker}
                  />
                )}
              </span>
            ))}
          </span>
        ) : (
          showEmpty && (
            <span className="text-ash/30 font-data text-[10px]">·</span>
          )
        )}

        {isLagna && cellPlanets.length === 0 && (
          <span className="text-turmeric font-data text-[11px] md:text-xs font-bold">
            As
          </span>
        )}
      </div>
    );

    const motionProps = animate
      ? {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: {
            delay: 0.5 + houseNum * 0.05,
            type: "spring" as const,
            stiffness: 120,
            damping: 18,
          },
        }
      : {};

    return (
      <motion.div
        key={`house-${houseNum}`}
        className="h-full w-full"
        {...motionProps}
      >
        {inner}
      </motion.div>
    );
  };

  // Screen-reader table
  const srRows = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const sign = houseSign(h);
    const names =
      housePlanets[h]?.map((p) => PLANET_SHORT[p.planetId]).join(", ") || "—";
    return { h, sign: ZODIAC_EN[sign], names };
  });

  return (
    <div
      className={cn(
        "relative aspect-square w-full bg-manuscript/10 p-1",
        className,
      )}
    >
      {/* Grid drawing */}
      <svg
        className="absolute inset-0 w-full h-full text-ash/25 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="25"
          x2="100"
          y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="75"
          x2="100"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="25"
          y1="0"
          x2="25"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="0"
          x2="75"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="50"
          x2="25"
          y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="50"
          x2="100"
          y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="75"
          x2="50"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="25"
          y1="25"
          x2="75"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="25"
          x2="25"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <polygon
          points="50,25 75,50 50,75 25,50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        {/* Lagna marker — thin turmeric border, precision not decoration */}
        <rect
          x="25.5"
          y="0.5"
          width="24"
          height="24"
          stroke="hsl(var(--turmeric))"
          strokeWidth="1.25"
          fill="rgba(227, 162, 61, 0.04)"
        />
      </svg>

      {/* Planet/house overlay */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 w-full h-full z-10">
        {Array.from({ length: 16 }, (_, i) => renderCell(i))}
      </div>

      {/* Screen-reader equivalent */}
      <table className="sr-only">
        <caption>{chartLabel} — house, sign, planets</caption>
        <thead>
          <tr>
            <th scope="col">House</th>
            <th scope="col">Sign</th>
            <th scope="col">Planets</th>
          </tr>
        </thead>
        <tbody>
          {srRows.map((r) => (
            <tr key={r.h}>
              <td>{r.h}</td>
              <td>{r.sign}</td>
              <td>{r.names}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Static faint outline preview for the empty state. */
export function ChartPreview({
  label = "D1 Rasi",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full bg-manuscript/5 p-1 opacity-30",
        className,
      )}
    >
      <svg
        className="absolute inset-0 w-full h-full text-ash/25 pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="25"
          x2="100"
          y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="75"
          x2="100"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="25"
          y1="0"
          x2="25"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="0"
          x2="75"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="50"
          x2="25"
          y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="50"
          x2="100"
          y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="50"
          y1="75"
          x2="50"
          y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="25"
          y1="25"
          x2="75"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <line
          x1="75"
          y1="25"
          x2="25"
          y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
        <polygon
          points="50,25 75,50 50,75 25,50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <span className="font-display text-xs text-ash uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
}
