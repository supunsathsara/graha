/**
 * D10 Dashamsha + Shadbala core — validation.
 *
 * Run: npx tsx scripts/validate-divisional.ts
 *
 * D10 (Parashara rule): odd signs start from the same sign, even signs
 * from the 9th from it. Verified against the canonical published table:
 *
 *   Aries   → Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn
 *   Taurus  → Capricorn, Aquarius, Pisces, Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra
 *   Leo     → Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Aries, Taurus
 *   Aquarius→ Scorpio, Sagittarius, Capricorn, Aquarius, Pisces, Aries, Taurus, Gemini, Cancer, Leo
 *
 * Shadbala component anchors:
 *   Uchcha:  60 at deep exaltation, 0 at deep debilitation
 *   Dig:     60 at the dig-bala point, 0 opposite
 *   Paksha:  Moon 60 at full moon / 0 at new; Sun opposite
 *   Naisargika: classical fixed table
 *   Cheshta: retrograde > direct (for the same planet)
 */
import swisseph from "swisseph";
import { resolve } from "path";
import { createRequire } from "module";
import { existsSync } from "fs";
import { getDashamshaSign } from "../src/lib/interpretations/navamsa.js";
import {
  computeShadbala,
  // internal functions are tested through computeShadbala on synthetic charts
} from "../src/lib/shadbala.js";
import type { BirthChart } from "../src/types/chart.js";

const require = createRequire(import.meta.url);
const bundled = resolve(require.resolve("swisseph"), "../../ephe");
if (existsSync(bundled)) swisseph.swe_set_ephe_path(bundled);
swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

let pass = 0;
let fail = 0;

function assert(cond: boolean, name: string, extra = "") {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

console.log("\n=== 1. Dashamsha (D10) canonical table ===");
{
  const table: Record<number, number[]> = {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], // Aries (odd) → same sign
    1: [9, 10, 11, 0, 1, 2, 3, 4, 5, 6], // Taurus (even) → 9th from it (Capricorn)
    4: [4, 5, 6, 7, 8, 9, 10, 11, 0, 1], // Leo (odd) → same sign
    10: [10, 11, 0, 1, 2, 3, 4, 5, 6, 7], // Aquarius (odd, 11th sign) → same sign
    3: [11, 0, 1, 2, 3, 4, 5, 6, 7, 8], // Cancer (even) → 9th from it (Pisces)
  };
  for (const [sign, expected] of Object.entries(table)) {
    const s = parseInt(sign);
    let ok = true;
    for (let part = 0; part < 10; part++) {
      const lon = s * 30 + part * 3 + 1.5; // middle of each 3° dashamsha
      const got = getDashamshaSign(lon);
      if (got !== expected[part]) ok = false;
    }
    assert(
      ok,
      `sign ${s} (${["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][s]}) D10 table matches canonical`,
    );
  }
  // Boundary: exactly at a 3° boundary belongs to the next dashamsha
  assert(getDashamshaSign(3.0) === 1, "3° Aries → Taurus (part boundary)");
  assert(getDashamshaSign(29.9) === 9, "29.9° Aries → Capricorn (part 9)");
}

console.log("\n=== 2. Shadbala component anchors ===");
{
  // Helper: synthetic chart with planets at given longitudes
  const mk = (
    lagnaLon: number,
    planetLons: Record<number, number>,
    speeds: Record<number, number> = {},
  ): BirthChart => ({
    name: "test",
    birthDate: "1990-01-01",
    birthTime: "10:00",
    latitude: 6.9,
    longitude: 79.8,
    timezone: "Asia/Colombo",
    lagna: {
      sign: Math.floor(lagnaLon / 30),
      degree: lagnaLon % 30,
      longitude: lagnaLon,
    },
    houses: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      startLongitude: lagnaLon + i * 30,
      endLongitude: lagnaLon + (i + 1) * 30,
      sign: (Math.floor(lagnaLon / 30) + i) % 12,
      lord: 0,
    })),
    planets: Object.entries(planetLons).map(([pid, lon]) => ({
      planet: parseInt(pid),
      name: { en: `P${pid}`, si: "" },
      longitude: lon,
      latitude: 0,
      speed: speeds[parseInt(pid)] ?? 1,
      sign: Math.floor(lon / 30),
      signDegree: lon % 30,
      house: 1,
      nakshatra: "Ashwini",
      nakshatraLord: "Ketu",
      nakshatraPada: 1,
      isRetrograde: (speeds[parseInt(pid)] ?? 1) < 0,
      dignity: "neutral",
    })),
    rasiChart: [],
    navamsaChart: [],
    currentDasa: null,
    dasaTimeline: [],
  });

  // Uchcha: Sun at exaltation (10° Aries) → uchcha component = 60
  {
    const c = mk(0, { 0: 10, 1: 30 });
    const rep = computeShadbala(c).find((r) => r.planetId === 0)!;
    assert(
      Math.abs(rep.components.uchcha - 60) < 1,
      "Sun at 10° Aries → Uchcha = 60",
      `got ${rep.components.uchcha}`,
    );
  }
  // Uchcha: Sun at debilitation (10° Libra = 190°) → 0
  {
    const c = mk(0, { 0: 190, 1: 30 });
    const rep = computeShadbala(c).find((r) => r.planetId === 0)!;
    assert(
      rep.components.uchcha < 1,
      "Sun at 10° Libra → Uchcha = 0",
      `got ${rep.components.uchcha}`,
    );
  }
  // Dig: Jupiter at Lagna (asc = 0°) → dig = 60; opposite (180°) → 0
  {
    const c = mk(0, { 0: 10, 1: 30, 5: 0 });
    const rep = computeShadbala(c).find((r) => r.planetId === 5)!;
    assert(
      Math.abs(rep.components.dig - 60) < 1,
      "Jupiter at Lagna → Dig = 60",
      `got ${rep.components.dig}`,
    );
    const c2 = mk(0, { 0: 10, 1: 30, 5: 180 });
    const rep2 = computeShadbala(c2).find((r) => r.planetId === 5)!;
    assert(
      rep2.components.dig < 1,
      "Jupiter opposite Lagna → Dig = 0",
      `got ${rep2.components.dig}`,
    );
  }
  // Paksha: full moon — Moon at 180° from Sun → Moon paksha = 60, Sun = 0
  {
    const c = mk(0, { 0: 0, 1: 180 });
    const moon = computeShadbala(c).find((r) => r.planetId === 1)!;
    const sun = computeShadbala(c).find((r) => r.planetId === 0)!;
    assert(
      Math.abs(moon.components.paksha - 60) < 1,
      "Full moon → Moon Paksha = 60",
      `got ${moon.components.paksha}`,
    );
    assert(
      sun.components.paksha < 1,
      "Full moon → Sun Paksha = 0",
      `got ${sun.components.paksha}`,
    );
  }
  // Paksha: new moon — Moon at 0° from Sun → Moon paksha = 0, Sun = 60
  {
    const c = mk(0, { 0: 0, 1: 0.1 });
    const moon = computeShadbala(c).find((r) => r.planetId === 1)!;
    const sun = computeShadbala(c).find((r) => r.planetId === 0)!;
    assert(
      moon.components.paksha < 1,
      "New moon → Moon Paksha = 0",
      `got ${moon.components.paksha}`,
    );
    assert(
      Math.abs(sun.components.paksha - 60) < 1,
      "New moon → Sun Paksha = 60",
      `got ${sun.components.paksha}`,
    );
  }
  // Naisargika: fixed table
  {
    const c = mk(0, { 0: 10, 1: 30, 2: 60, 3: 90, 4: 120, 5: 150, 6: 180 });
    const reps = computeShadbala(c);
    const expected: Record<number, number> = {
      0: 60,
      1: 51.43,
      2: 34.29,
      3: 42.86,
      4: 28.57,
      5: 39.29,
      6: 20,
    };
    for (const [pid, val] of Object.entries(expected)) {
      const rep = reps.find((r) => r.planetId === parseInt(pid))!;
      assert(
        Math.abs(rep.components.naisargika - val) < 0.05,
        `Naisargika P${pid} = ${val.toFixed(2)}`,
        `got ${rep.components.naisargika.toFixed(2)}`,
      );
    }
  }
  // Cheshta: retrograde Mars should beat direct Mars (same chart family)
  {
    const cRetro = mk(0, { 0: 10, 1: 30, 4: 120 }, { 4: -0.2 });
    const cDirect = mk(0, { 0: 10, 1: 30, 4: 120 }, { 4: 0.6 });
    const retro = computeShadbala(cRetro).find((r) => r.planetId === 4)!;
    const direct = computeShadbala(cDirect).find((r) => r.planetId === 4)!;
    assert(
      retro.components.cheshta > direct.components.cheshta + 20,
      "Retrograde Mars Cheshta > direct Mars",
      `retro ${retro.components.cheshta} vs direct ${direct.components.cheshta}`,
    );
  }
  // Drik: benefic aspects raise, malefic aspects lower — use a graded arc (60°)
  {
    const cJup = mk(0, { 0: 10, 1: 30, 5: 70 }); // Jupiter exactly 60° from Sun
    const cSat = mk(0, { 0: 10, 1: 30, 6: 70 }); // Saturn exactly 60° from Sun
    const sunJup = computeShadbala(cJup).find((r) => r.planetId === 0)!;
    const sunSat = computeShadbala(cSat).find((r) => r.planetId === 0)!;
    assert(
      sunJup.components.drik > 70,
      "Sun drik raised by Jupiter aspect (60° = grade 15)",
      `got ${sunJup.components.drik}`,
    );
    assert(
      sunSat.components.drik < 50,
      "Sun drik lowered by Saturn aspect (60° = grade 15)",
      `got ${sunSat.components.drik}`,
    );
  }
  // Strongest flag on the top planet
  {
    const c = mk(0, { 0: 10, 1: 180, 5: 95 }); // Sun exalted, Moon full, Jupiter exalted
    const reps = computeShadbala(c);
    const top = reps[0];
    assert(
      top.strongest === true &&
        top.totalShastyamsha >= reps[1].totalShastyamsha,
      "strongest flag + sorted ranking",
    );
  }
}

console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━\n`);
if (fail) process.exit(1);
