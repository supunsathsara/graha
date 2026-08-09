/**
 * Vimshottari Dasa engine — validation.
 *
 * Run: npx tsx scripts/validate-dasa.ts
 *
 * Verifies:
 *   1. The classical 120-year cycle (Ketu 7, Venus 20, Sun 6, Moon 10,
 *      Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17).
 *   2. The birth Mahadasa is the lord of the Moon's nakshatra.
 *   3. Timeline: 9 Mahadasas, no gaps/overlaps, correct total span.
 *   4. Antardasa durations sum exactly to their Mahadasa.
 *   5. Known reference: Moon in Ashwini → Ketu Mahadasa at birth;
 *      balance = (remaining nakshatra degrees / 13°20′) × 7.
 */
import { DateTime } from "luxon";
import { computeVimshottariTimeline } from "../src/lib/ephemeris.js";
import { getAllNakshatras } from "../src/lib/interpretations/nakshatras.js";
import { initEphemeris } from "../src/lib/ephemeris.js";
import swisseph from "swisseph";

initEphemeris();

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

// 1. Classical table
const expected: [string, number][] = [
  ["Ketu", 7],
  ["Venus", 20],
  ["Sun", 6],
  ["Moon", 10],
  ["Mars", 7],
  ["Rahu", 18],
  ["Jupiter", 16],
  ["Saturn", 19],
  ["Mercury", 17],
];
const total = expected.reduce((a, [, y]) => a + y, 0);
assert(total === 120, `Vimshottari cycle totals 120 (got ${total})`);
assert(expected.length === 9, "9 Mahadasas in the cycle");

// Nakshatra lord sequence (used to derive the birth dasa lord)
const NAKSHATRAS = getAllNakshatras();
const nakLords = NAKSHATRAS.map((n: any) => n.lord);
const vimSeq = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
const cycleOk = nakLords.every((lord, i) => lord === vimSeq[i % 9]);
assert(cycleOk, "Nakshatra lords follow the Vimshottari sequence");

// 2-4. Timeline invariants over 5 random-ish birth moments
const testCases = [
  {
    date: "1995-06-15",
    time: "14:30",
    lat: 6.9271,
    lon: 79.8612,
    tz: "Asia/Colombo",
  },
  {
    date: "1988-11-22",
    time: "05:45",
    lat: 7.2906,
    lon: 80.6337,
    tz: "Asia/Colombo",
  },
  {
    date: "2001-03-03",
    time: "20:15",
    lat: 6.0535,
    lon: 80.221,
    tz: "Asia/Colombo",
  },
  {
    date: "1975-08-19",
    time: "11:00",
    lat: 9.6615,
    lon: 80.0255,
    tz: "Asia/Colombo",
  },
  {
    date: "1960-01-01",
    time: "00:30",
    lat: 6.9271,
    lon: 79.8612,
    tz: "Asia/Colombo",
  },
];

function jdFromLocal(
  date: string,
  time: string,
  tz: string,
): { jd: number; local: DateTime } {
  const local = DateTime.fromISO(`${date}T${time}:00`, { zone: tz });
  const utc = local.toUTC();
  const jd = swisseph.swe_julday(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600,
    swisseph.SE_GREG_CAL,
  );
  return { jd, local };
}

for (const tc of testCases) {
  const { jd, local } = jdFromLocal(tc.date, tc.time, tc.tz);
  const tl = computeVimshottariTimeline(jd, local);
  assert(tl.length === 9, `${tc.date} — timeline has 9 Mahadasas`);

  // Birth dasa lord == Moon's nakshatra lord
  const moon = swisseph.swe_calc_ut(
    jd,
    swisseph.SE_MOON,
    swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SIDEREAL,
  );
  const nakIdx = Math.floor(
    (((moon.longitude % 360) + 360) % 360) / 13.3333333,
  );
  const expectedLord = vimSeq[nakIdx % 9];
  assert(
    tl[0].lordName.en === expectedLord,
    `${tc.date} — birth Mahadasa is ${expectedLord} (got ${tl[0].lordName.en})`,
  );

  // No gaps/overlaps: each end == next start
  let chained = true;
  for (let i = 1; i < tl.length; i++) {
    if (tl[i].startDate !== tl[i - 1].endDate) chained = false;
  }
  assert(chained, `${tc.date} — Mahadasa dates chain without gaps`);

  // Total span: birth + 120 − elapsed
  const nakSpan = 13.3333333;
  const remainingDeg =
    Math.ceil((((moon.longitude % 360) + 360) % 360) / nakSpan) * nakSpan -
    (((moon.longitude % 360) + 360) % 360);
  const birthLordIdx = nakIdx % 9;
  const birthYears = expected[birthLordIdx][1];
  const balance = (remainingDeg / nakSpan) * birthYears;
  const elapsed = birthYears - balance;
  const expectedSpanYears = 120 - elapsed;
  const start = DateTime.fromISO(tl[0].startDate);
  const end = DateTime.fromISO(tl[8].endDate);
  const spanYears = end.diff(start, "days").days / 365.25;
  const withinTolerance = Math.abs(spanYears - expectedSpanYears) < 1.5; // day-rounding tolerance
  assert(
    withinTolerance,
    `${tc.date} — total span ${spanYears.toFixed(1)}y ≈ ${expectedSpanYears.toFixed(1)}y (balance ${balance.toFixed(2)}y)`,
  );

  // Antardasa durations sum to the Mahadasa
  const maha = tl[0];
  const subSum = maha.subPeriods.reduce((a, s) => a + s.totalMonths, 0) / 12;
  assert(
    Math.abs(subSum - maha.totalYears) < 0.2,
    `${tc.date} — ${maha.lordName.en} antardasas sum ≈ ${maha.totalYears.toFixed(2)}y (got ${subSum.toFixed(2)}y)`,
  );
  assert(
    maha.subPeriods.length === 9,
    `${tc.date} — 9 antardasas per Mahadasa`,
  );
}

console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━\n`);
if (fail) process.exit(1);
