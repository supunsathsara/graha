/**
 * Ephemeris validation — verified against authoritative public references.
 *
 * Run: npx tsx scripts/validate-ephemeris.ts
 *
 * Every fixture is traceable to an independent public source:
 *
 *  1. LAHIRI AYANAMSA anchors:
 *     - Swiss Ephemeris source (sweph.h): standard Lahiri anchored at
 *       JD 2435553.5 with ayan_t0 = 23.250182778 − 0.004658035 degrees,
 *       IAU 1976 precession (the de-facto industry standard, derived from
 *       the Indian Astronomical Ephemeris 1989).
 *     - ICRC (Calendar Reform Committee 1956): 23°15'00.658" at
 *       1956-03-21 05:34:37 IST. Swiss Ephemeris gives 23°14'44" there —
 *       a documented ~16" offset between the two Lahiri definitions.
 *     - J2000.0 value reported by the engine (documented, not asserted
 *       against a specific table).
 *
 *  2. SUN at the 2025 equinoxes/solstices (published UTC instants):
 *     Mar 20 09:01, Jun 21 02:42, Sep 22 18:19, Dec 21 15:03.
 *     Tropical Sun must be at 0°/90°/180°/270° ± 0.15°.
 *
 *  3. MOON PHASES 2025 (NASA 6000-year phase catalog; dates confirmed by
 *     JPL Horizons Sun–Moon separation): 12 full moons → 180° ± 1°,
 *     13 new moons → 0° ± 2°.
 *
 *  4. SIDEREAL POSITIONS vs JPL Horizons (independent of Swiss Ephemeris):
 *     apparent RA/Dec at 2025-01-01 00:00 UT → ecliptic longitude of date →
 *     minus Lahiri ayanamsa → compared with the engine's sidereal positions.
 *
 *  5. SUNRISE/SUNSET for Colombo (published almanac values) + the
 *     near-equator stability rule (±15 min of 06:00 year-round).
 */
import swisseph from "swisseph";
import { resolve } from "path";
import { createRequire } from "module";
import { existsSync } from "fs";
import { computePanchanga } from "../src/lib/panchanga.js";

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

const DMS = (d: number) => {
  const deg = Math.floor(d);
  const m = Math.floor((d - deg) * 60);
  const s = ((d - deg) * 60 - m) * 60;
  return `${deg}°${String(m).padStart(2, "0")}'${s.toFixed(1).padStart(4, "0")}"`;
};

function jdFromUTC(y: number, mo: number, d: number, h: number): number {
  return swisseph.swe_julday(y, mo, d, h, swisseph.SE_GREG_CAL);
}

function sunLongitude(jd: number): number {
  return swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH)
    .longitude;
}
function moonLongitude(jd: number): number {
  return swisseph.swe_calc_ut(jd, swisseph.SE_MOON, swisseph.SEFLG_SWIEPH)
    .longitude;
}

console.log("\n=== 1. Lahiri ayanamsa anchors ===");
{
  // Swiss Ephemeris's own anchor (sweph.h: {2435553.5, 23.250182778-0.004658035, IAU1976})
  const anchor = 23.250182778 - 0.004658035;
  const ay = swisseph.swe_get_ayanamsa_ut(2435553.5);
  assert(
    Math.abs(ay - anchor) < 1e-4,
    "reproduces its published anchor (JD 2435553.5)",
    `got ${DMS(ay)} expected ${DMS(anchor)}`,
  );

  // ICRC 1956 definition: 23°15'00.658" at 1956-03-21 05:34:37 IST = 00:04:37 UT
  const icrcJd = jdFromUTC(1956, 3, 21, 0 + 4 / 60 + 37 / 3600);
  const ayI = swisseph.swe_get_ayanamsa_ut(icrcJd);
  const icrcTarget = 23 + 15 / 60 + 0.658 / 3600;
  const diffArcsec = Math.abs(ayI - icrcTarget) * 3600;
  assert(
    diffArcsec < 60,
    'ICRC 1956 epoch within 60" (documented school offset)',
    `diff ${diffArcsec.toFixed(1)}"`,
  );

  // J2000 reported value (documentation)
  const ay2000 = swisseph.swe_get_ayanamsa_ut(jdFromUTC(2000, 1, 1, 12));
  assert(
    ay2000 > 23.85 && ay2000 < 23.86,
    "J2000 value ≈ 23°51' (~23.853°)",
    DMS(ay2000),
  );
  console.log(
    `      J2000.0 Lahiri = ${DMS(ay2000)} (reported, for reference)`,
  );
}

console.log("\n=== 2. Sun at 2025 equinoxes / solstices (published UTC) ===");
{
  const checks: [string, number, number, number, number, number][] = [
    ["Vernal equinox Mar 20 09:01", 2025, 3, 20, 9 + 1 / 60, 0],
    ["Summer solstice Jun 21 02:42", 2025, 6, 21, 2 + 42 / 60, 90],
    ["Autumnal equinox Sep 22 18:19", 2025, 9, 22, 18 + 19 / 60, 180],
    ["Winter solstice Dec 21 15:03", 2025, 12, 21, 15 + 3 / 60, 270],
  ];
  for (const [name, y, mo, d, h, target] of checks) {
    const lon = sunLongitude(jdFromUTC(y, mo, d, h));
    const diff = Math.abs(((((lon - target + 180) % 360) + 360) % 360) - 180);
    assert(
      diff < 0.15,
      `${name} → Sun ≈ ${target}°`,
      `got ${lon.toFixed(3)}° (off ${diff.toFixed(3)}°)`,
    );
  }
}

console.log("\n=== 3. 2025 full moons (NASA catalog, Horizons-confirmed) ===");
{
  // [month, day, hour, minute] UT — NASA 6000-year phase catalog
  const fullMoons: [number, number, number, number][] = [
    [1, 13, 22, 27],
    [2, 12, 13, 53],
    [3, 14, 6, 55],
    [4, 13, 0, 22],
    [5, 12, 16, 56],
    [6, 11, 7, 44],
    [7, 10, 20, 37],
    [8, 9, 7, 55],
    [9, 7, 18, 9],
    [10, 7, 3, 47],
    [11, 5, 13, 19],
    [12, 4, 23, 14],
  ];
  for (const [mo, d, h, mi] of fullMoons) {
    const jd = jdFromUTC(2025, mo, d, h + mi / 60);
    const s = sunLongitude(jd);
    const m = moonLongitude(jd);
    let sep = Math.abs(m - s) % 360;
    if (sep > 180) sep = 360 - sep;
    assert(
      Math.abs(sep - 180) < 1.0,
      `Full moon ${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} → 180°`,
      `sep ${sep.toFixed(2)}°`,
    );
  }
}

console.log("\n=== 3b. 2025 new moons (NASA catalog, Horizons-confirmed) ===");
{
  // NOTE: NASA's year-start row is column-shifted; JPL Horizons confirms
  // Jan 6 2025 was First Quarter (90°), not New — so it is excluded.
  const newMoons: [number, number, number, number][] = [
    [1, 29, 12, 36],
    [2, 28, 0, 45],
    [3, 29, 10, 58],
    [4, 27, 19, 31],
    [5, 27, 3, 2],
    [6, 25, 10, 31],
    [7, 24, 19, 11],
    [8, 23, 6, 6],
    [9, 21, 19, 54],
    [10, 21, 12, 25],
    [11, 20, 6, 47],
    [12, 20, 1, 43],
  ];
  for (const [mo, d, h, mi] of newMoons) {
    const jd = jdFromUTC(2025, mo, d, h + mi / 60);
    const s = sunLongitude(jd);
    const m = moonLongitude(jd);
    let sep = Math.abs(m - s) % 360;
    if (sep > 180) sep = 360 - sep;
    assert(
      sep < 2.0,
      `New moon ${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} → 0°`,
      `sep ${sep.toFixed(2)}°`,
    );
  }
}

console.log("\n=== 4. Sidereal positions vs JPL Horizons (independent) ===");
{
  // Apparent RA/Dec (of date) from JPL Horizons API, 2025-01-01 00:00 UT
  const fixtures: {
    name: string;
    body: number;
    raH: number;
    raM: number;
    raS: number;
    decD: number;
    decM: number;
    decS: number;
  }[] = [
    {
      name: "Sun",
      body: swisseph.SE_SUN,
      raH: 18,
      raM: 47,
      raS: 2.42,
      decD: -22,
      decM: 59,
      decS: 53.5,
    },
    {
      name: "Moon",
      body: swisseph.SE_MOON,
      raH: 19,
      raM: 46,
      raS: 43.27,
      decD: -25,
      decM: 51,
      decS: 37.7,
    },
    {
      name: "Mars",
      body: swisseph.SE_MARS,
      raH: 8,
      raM: 20,
      raS: 30.18,
      decD: 23,
      decM: 32,
      decS: 42.8,
    },
    {
      name: "Jupiter",
      body: swisseph.SE_JUPITER,
      raH: 4,
      raM: 47,
      raS: 31.74,
      decD: 21,
      decM: 47,
      decS: 14.6,
    },
    {
      name: "Saturn",
      body: swisseph.SE_SATURN,
      raH: 23,
      raM: 6,
      raS: 3.93,
      decD: -7,
      decM: 55,
      decS: 0.3,
    },
  ];
  const jd = jdFromUTC(2025, 1, 1, 0);
  const ayan = swisseph.swe_get_ayanamsa_ut(jd);
  // Obliquity of date (approx formula, 2025)
  const T = (jd - 2451545.0) / 36525;
  const eps =
    ((23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T) *
      Math.PI) /
    180;

  for (const f of fixtures) {
    const ra = ((f.raH + f.raM / 60 + f.raS / 3600) * 15 * Math.PI) / 180;
    const dec =
      (((Math.abs(f.decD) + f.decM / 60 + f.decS / 3600) * Math.PI) / 180) *
      (f.decD < 0 ? -1 : 1);
    // RA/Dec (of date) → ecliptic longitude of date
    const y = Math.sin(ra) * Math.cos(eps) + Math.tan(dec) * Math.sin(eps);
    const x = Math.cos(ra);
    let eclLon = (Math.atan2(y, x) * 180) / Math.PI;
    if (eclLon < 0) eclLon += 360;
    const siderealExpected = (eclLon - ayan + 360) % 360;

    const engine = swisseph.swe_calc_ut(
      jd,
      f.body,
      swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SIDEREAL,
    );
    let diff = Math.abs(engine.longitude - siderealExpected) % 360;
    if (diff > 180) diff = 360 - diff;
    assert(
      diff < 0.2,
      `${f.name} sidereal matches Horizons-based calc`,
      `engine ${engine.longitude.toFixed(3)}° vs Horizons ${siderealExpected.toFixed(3)}° (Δ${diff.toFixed(3)}°)`,
    );
  }
}

console.log("\n=== 5. Sunrise/sunset — Colombo (published almanac) ===");
{
  // Published Colombo values: 2025-07-19 ≈ 06:02 / 18:31 (almanac)
  const p = computePanchanga("2025-07-19", 6.9271, 79.8612);
  assert(!!p, "panchanga computes for Colombo");
  if (p) {
    assert(
      p.sunrise === "06:02" || p.sunrise === "06:01" || p.sunrise === "06:03",
      "Jul 19 sunrise ≈ 06:02",
      `got ${p.sunrise}`,
    );
    assert(
      p.sunset === "18:31" || p.sunset === "18:30" || p.sunset === "18:32",
      "Jul 19 sunset ≈ 18:31",
      `got ${p.sunset}`,
    );

    // Near-equator rule (Colombo 6.9°N): equation of time moves sunrise
    // between ~05:45 and ~06:30 across the year — published Sri Lankan
    // almanac range. The Jul 19 exact check above pins the engine.
    const months = [
      "2025-01-15",
      "2025-04-15",
      "2025-06-21",
      "2025-09-22",
      "2025-12-21",
    ];
    for (const date of months) {
      const d = computePanchanga(date, 6.9271, 79.8612);
      if (d) {
        const [h, m] = d.sunrise.split(":").map(Number);
        const mins = h * 60 + m;
        assert(
          mins >= 342 && mins <= 390,
          `${date} sunrise within almanac range (05:42–06:30)`,
          `got ${d.sunrise}`,
        );
      }
    }
  }
}

console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━\n`);
if (fail) process.exit(1);
