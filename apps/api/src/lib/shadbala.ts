/**
 * Shadbala (six-fold strength) — core components.
 *
 * Classical Jyotish measures planetary strength in six categories
 * (shad = six, bala = strength). This implementation covers the
 * components whose classical formulas are unambiguous and verifiable:
 *
 *   1. UCHCHA BALA     — positional: angular distance from deep debilitation
 *   2. DIG BALA        — directional: strength at dig-bala point
 *   3. NAISARGIKA BALA — natural: fixed classical values
 *   4. PAKSHA BALA     — temporal: lunar phase strength (Sun & Moon)
 *   5. CHESHTA BALA    — motional: speed/retrogression (min/max derived
 *                        from the ephemeris itself — documented method)
 *   6. DRIK BALA       — aspectual: graded benefic/malefic aspects received
 *
 * NOT yet included (documented, requires careful sourcing): Saptavargaja,
 * Ojayugma, Kendradi, Drekkana (sthana sub-parts), Nathonnata, Tribhaga,
 * Abda/Masa/Vara/Hora (kala sub-parts). The total is therefore presented
 * as "Shadbala core" with an explicit component breakdown — not as the
 * full classical Shadbala.
 *
 * Units: shastyamsha (virupa). 60 shastyamsha = 1 rupa.
 * Classical reference threshold for a strong planet ≈ 6 rupas (full
 * Shadbala); for core components we report the rupa total + the per-planet
 * ranking without implying the full-6-rupa test.
 */
import swisseph from "swisseph";
import type { BirthChart, PlanetaryPosition } from "../types/chart.js";

// Naisargika Bala (classical fixed values, shastyamsha):
// Sun 60, Moon 360/7, Venus 300/7, Jupiter 275/7, Mercury 240/7,
// Mars 200/7, Saturn 140/7.
const NAISARGIKA: Record<number, number> = {
  0: 60,
  1: 360 / 7,
  2: 240 / 7,
  3: 300 / 7,
  4: 200 / 7,
  5: 275 / 7,
  6: 140 / 7,
  10: 0,
  11: 0,
};

// Deep exaltation / debilitation points (longitude of exaltation point;
// debilitation = exaltation + 180).
const EXALTATION_LON: Record<number, number> = {
  0: 10, // Sun 10° Aries
  1: 33, // Moon 3° Taurus
  2: 165, // Mercury 15° Virgo
  3: 357, // Venus 27° Pisces
  4: 298, // Mars 28° Capricorn
  5: 95, // Jupiter 5° Cancer
  6: 200, // Saturn 20° Libra
};

// Dig-bala points (house cusps where each planet is strongest):
// Sun/Mars → 10th; Jupiter/Mercury → 1st (Lagna); Saturn → 7th; Moon/Venus → 4th.
// Angular distance from the dig-bala point: Dig = 60 − dist/3 (dist in degrees).
const DIG_POINT: Record<number, "asc" | "ic" | "dc" | "mc"> = {
  0: "mc",
  1: "ic",
  2: "asc",
  3: "ic",
  4: "mc",
  5: "asc",
  6: "dc",
};

// Drik Bala: aspect strength graded by the angular arc (classical drishti table),
// signed by the aspecting planet's nature (benefic +, malefic −).
const DRIK_ARC: Record<number, number> = {
  30: 7.5,
  60: 15,
  90: 30,
  120: 45,
  150: 22.5,
  180: 60,
};
const BENEFICS = [1, 2, 3, 5]; // Moon, Mercury, Venus, Jupiter (classical)
const MALEFICS = [0, 4, 6, 10, 11]; // Sun, Mars, Saturn, Rahu, Ketu

// ─── Ephemeris-derived speed extremes (for Cheshta Bala) ─────
// Sampled lazily from the Swiss Ephemeris itself so Cheshta Bala always
// reflects the real min/max speeds of the planet over a 40-year window.
let speedExtremes: Record<number, { min: number; max: number }> | null = null;

function getSpeedExtremes(): Record<number, { min: number; max: number }> {
  if (speedExtremes) return speedExtremes;
  speedExtremes = {};
  const planets = [0, 1, 2, 3, 4, 5, 6];
  for (const p of planets) {
    let min = Infinity;
    let max = -Infinity;
    // Sample every 10 days across 1970–2010 (covers retrograde extremes)
    for (let jd = 2440587.5; jd < 2455197.5; jd += 10) {
      const res = swisseph_speed(jd, p);
      if (res < min) min = res;
      if (res > max) max = res;
    }
    speedExtremes[p] = { min, max };
  }
  return speedExtremes;
}

function swisseph_speed(jd: number, planet: number): number {
  const res = swisseph.swe_calc_ut(
    jd,
    planet,
    swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED,
  );
  return "longitudeSpeed" in res ? (res.longitudeSpeed ?? 0) : 0;
}

// ─── Component scorers ───────────────────────────────────────

function uchchaBala(planetId: number, longitude: number): number {
  const ex = EXALTATION_LON[planetId];
  if (ex === undefined) return 0;
  const deb = (ex + 180) % 360;
  let dist = Math.abs((((longitude - deb) % 360) + 360) % 360);
  if (dist > 180) dist = 360 - dist;
  return dist / 3; // 0 at debilitation, 60 at exaltation
}

function digBala(
  planetId: number,
  longitude: number,
  cusps: { asc: number; ic: number; dc: number; mc: number },
): number {
  const point = DIG_POINT[planetId];
  if (!point) return 0;
  const ref = cusps[point];
  let dist = Math.abs((((longitude - ref) % 360) + 360) % 360);
  if (dist > 180) dist = 360 - dist;
  return 60 - dist / 3; // 60 at dig-bala point, 0 opposite
}

function pakshaBala(planetId: number, sunLon: number, moonLon: number): number {
  let sep = (((moonLon - sunLon) % 360) + 360) % 360; // 0-360, waxing distance
  if (planetId === 1) {
    // Moon: 60 at full moon (180°), 0 at new moon (0°)
    return Math.max(0, 60 - Math.abs(sep - 180) / 3);
  }
  if (planetId === 0) {
    // Sun: 60 at new moon (0°), 0 at full moon (180°)
    return Math.max(0, 60 - sep / 3);
  }
  return 0;
}

function cheshtaBala(planetId: number, speed: number): number {
  if (planetId > 6) return 0; // nodes: no classical chesta
  const extremes = getSpeedExtremes();
  const { min, max } = extremes[planetId] || { min: 0, max: 1 };
  const span = max - min;
  if (span <= 0) return 30;
  // Retrograde (speed ≤ 0 or below mean) → high; fast direct → low.
  const bala = 60 * ((max - speed) / span);
  return Math.max(0, Math.min(60, bala));
}

function drishtiArc(angleDeg: number): number {
  const a = Math.floor(angleDeg / 30) * 30;
  return DRIK_ARC[a] ?? 0;
}

function drikBala(planetId: number, planets: PlanetaryPosition[]): number {
  const self = planets.find((p) => p.planet === planetId);
  if (!self) return 60;
  let sum = 0;
  for (const other of planets) {
    if (other.planet === planetId || other.planet > 9) continue;
    let diff = Math.abs(other.longitude - self.longitude) % 360;
    if (diff > 180) diff = 360 - diff;
    const grade = drishtiArc(diff);
    const sign = BENEFICS.includes(other.planet)
      ? 1
      : MALEFICS.includes(other.planet)
        ? -1
        : 0;
    sum += grade * sign;
  }
  // +60 makes the result positive (classical convention)
  return Math.max(0, 60 + sum);
}

// ─── Public API ──────────────────────────────────────────────

export interface ShadbalaReport {
  planet: string;
  planetId: number;
  components: {
    uchcha: number;
    dig: number;
    naisargika: number;
    paksha: number;
    cheshta: number;
    drik: number;
  };
  totalShastyamsha: number;
  totalRupas: number;
  strongest: boolean;
}

export function computeShadbala(chart: BirthChart): ShadbalaReport[] {
  const sun = chart.planets.find((p) => p.planet === 0)?.longitude ?? 0;
  const moon = chart.planets.find((p) => p.planet === 1)?.longitude ?? 0;
  const asc = chart.lagna.longitude;
  const mc = chart.houses.find((h) => h.number === 10)?.startLongitude ?? asc;
  const ic = (mc + 180) % 360;
  const dc = (asc + 180) % 360;
  const cusps = { asc, ic, dc, mc };

  const reports: ShadbalaReport[] = [];
  for (const planet of chart.planets) {
    const pid = planet.planet as unknown as number;
    if (pid > 6) continue; // nodes excluded from classical Shadbala
    const components = {
      uchcha: Math.round(uchchaBala(pid, planet.longitude) * 100) / 100,
      dig: Math.round(digBala(pid, planet.longitude, cusps) * 100) / 100,
      naisargika: Math.round((NAISARGIKA[pid] ?? 0) * 100) / 100,
      paksha: Math.round(pakshaBala(pid, sun, moon) * 100) / 100,
      cheshta: Math.round(cheshtaBala(pid, planet.speed) * 100) / 100,
      drik: Math.round(drikBala(pid, chart.planets) * 100) / 100,
    };
    const totalShastyamsha = Object.values(components).reduce(
      (a, b) => a + b,
      0,
    );
    reports.push({
      planet: planet.name.en,
      planetId: pid,
      components,
      totalShastyamsha: Math.round(totalShastyamsha * 100) / 100,
      totalRupas: Math.round((totalShastyamsha / 60) * 100) / 100,
      strongest: false,
    });
  }

  reports.sort((a, b) => b.totalShastyamsha - a.totalShastyamsha);
  if (reports.length) reports[0].strongest = true;
  return reports;
}
