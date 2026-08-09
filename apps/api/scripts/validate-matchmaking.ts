/**
 * Matchmaking engine — rule-by-rule validation.
 *
 * Constructs synthetic BirthChart objects and asserts the expected
 * traditional scores for every koota and dosha rule.
 *
 * Run: npx tsx scripts/validate-matchmaking.ts
 */
import { computeGunaMilan } from "../src/lib/matchmaking.js";
import type { BirthChart, PlanetaryPosition } from "../src/types/chart.js";

function makeChart(opts: {
  name?: string;
  moonSign: number;
  moonNak: string;
  moonPada?: number;
  moonHouse?: number;
  lagnaSign?: number;
  planets?: Partial<PlanetaryPosition & { planet: number }>[];
}): BirthChart {
  const planets: PlanetaryPosition[] = (opts.planets || []).map((p, i) => ({
    planet: p.planet,
    name: { en: `P${p.planet}`, si: "" },
    longitude: p.longitude ?? 0,
    latitude: 0,
    speed: 1,
    sign: p.sign ?? 0,
    signDegree: p.signDegree ?? 0,
    house: p.house ?? 1,
    nakshatra: p.nakshatra ?? "Ashwini",
    nakshatraLord: p.nakshatraLord ?? "",
    nakshatraPada: p.nakshatraPada ?? 1,
    isRetrograde: false,
    dignity: "neutral",
  }));
  // Ensure Moon is present with the requested nakshatra/sign
  const moon: PlanetaryPosition = {
    planet: 1,
    name: { en: "Moon", si: "" },
    longitude: opts.moonSign * 30 + 5,
    latitude: 0,
    speed: 1,
    sign: opts.moonSign,
    signDegree: 5,
    house: opts.moonHouse ?? 1,
    nakshatra: opts.moonNak,
    nakshatraLord: "",
    nakshatraPada: opts.moonPada ?? 1,
    isRetrograde: false,
    dignity: "neutral",
  };
  const existing = planets.filter((p) => p.planet !== 1);
  existing.push(moon);

  return {
    name: opts.name,
    birthDate: "1990-01-01",
    birthTime: "10:00",
    latitude: 6.9,
    longitude: 79.8,
    timezone: "Asia/Colombo",
    lagna: { sign: opts.lagnaSign ?? 0, degree: 10, longitude: 10 },
    houses: [],
    planets: existing,
    rasiChart: [],
    navamsaChart: [],
    currentDasa: null,
  };
}

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(cond: boolean, name: string, extra = "") {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ""}`);
  }
}

function koota(m: any, key: string) {
  return m.kootas.find((k: any) => k.key === key);
}

console.log("\n=== 1. Varna ===");
{
  // Both same varna (Aries+Leo = kshatriya)
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 4, moonNak: "Magha" }),
  );
  assert(koota(m, "varna").points === 1, "Aries+Leo (both kshatriya) → 1");
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
  );
  assert(
    koota(m2, "varna").points === 0,
    "Aries+Taurus (kshatriya/vaishya) → 0",
  );
}

console.log("\n=== 2. Vashya ===");
{
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 2, moonNak: "Punarvasu" }),
  );
  assert(
    koota(m, "vashya").points === 2,
    "Aries(chatushpada)+Gemini(manav) mutual → 2",
  );
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 3, moonNak: "Pushya" }),
    makeChart({ moonSign: 7, moonNak: "Jyeshtha" }),
  );
  assert(
    koota(m2, "vashya").points === 2,
    "Cancer(jalachara)+Scorpio(keeta) mutual → 2",
  );
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 7, moonNak: "Jyeshtha" }),
  );
  assert(
    koota(m3, "vashya").points === 0,
    "Aries(chatushpada)+Scorpio(keeta) → 0",
  );
}

console.log("\n=== 3. Tara ===");
{
  // Ashwini(1) → Bharani(2): distance 2 → Sampat → 3
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(koota(m, "tara").points === 3, "distance 2 (Sampat) → 3");
  // Ashwini(1) → Krittika(3): distance 3 → Vipat → 0
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Krittika" }),
  );
  assert(koota(m2, "tara").points === 0, "distance 3 (Vipat) → 0");
  // Ashwini(1) → Ashlesha(9): distance 9 → Ati-mitra → 3
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 3, moonNak: "Ashlesha" }),
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
  );
  assert(koota(m3, "tara").points === 3, "distance 9 (Ati-mitra) → 3");
  // Ashwini(1) → Hasta(13): distance 13 → 13%9=4 → Kshema → 3
  const m4 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 5, moonNak: "Hasta" }),
  );
  assert(koota(m4, "tara").points === 3, "distance 13 (Kshema) → 3");
}

console.log("\n=== 4. Yoni ===");
{
  // Ashwini (Ashwa m) + Shatabhisha (Ashwa f): same yoni opposite gender → 4
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 10, moonNak: "Shatabhisha" }),
  );
  assert(koota(m, "yoni").points === 4, "same yoni opposite gender → 4");
  // Ashwini (Ashwa) + Bharani (Gaja): friends → 4
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(koota(m2, "yoni").points === 4, "Ashwa+Gaja friends → 4");
  // Ashwini (Ashwa) + Mula (Shwan): enemies → 0
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 8, moonNak: "Mula" }),
  );
  assert(koota(m3, "yoni").points === 0, "Ashwa+Shwan enemies → 0");
  // Ashwini (Ashwa m) + Shatabhisha-like same gender case: Jyeshtha (Mriga m) + Anuradha (Mriga f) → 4
  const m4 = computeGunaMilan(
    makeChart({ moonSign: 7, moonNak: "Jyeshtha" }),
    makeChart({ moonSign: 7, moonNak: "Anuradha" }),
  );
  assert(
    koota(m4, "yoni").points === 4,
    "same yoni (Mriga) opposite gender → 4",
  );
}

console.log("\n=== 5. Graha Maitri ===");
{
  // Sun(Mars lord? no) — Aries lord Mars(4) + Scorpio lord Mars(4): same → friend+friend → 5
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 7, moonNak: "Jyeshtha" }),
  );
  assert(koota(m, "maitri").points === 5, "Mars+Mars (same lord) → 5");
  // Mars(4) + Mercury(2): Mars enemy of Mercury? Mars friends [0,1,5], enemies [2] → Mars sees Mercury enemy; Mercury friends [0,3], enemies [1] → Mercury sees Mars neutral → enemy+neutral → 1
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 5, moonNak: "Hasta" }),
  );
  assert(koota(m2, "maitri").points === 1, "Mars+Mercury (enemy/neutral) → 1");
  // Sun(0)+Moon(1): mutual friends → 5
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 4, moonNak: "Magha" }),
    makeChart({ moonSign: 3, moonNak: "Pushya" }),
  );
  assert(koota(m3, "maitri").points === 5, "Sun+Moon friends → 5");
}

console.log("\n=== 6. Gana ===");
{
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 3, moonNak: "Punarvasu" }),
  );
  assert(koota(m, "gana").points === 6, "deva+deva → 6");
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
  );
  assert(koota(m2, "gana").points === 6, "deva(boy)+manushya(girl) → 6");
  const m2b = computeGunaMilan(
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
  );
  assert(koota(m2b, "gana").points === 5, "manushya(boy)+deva(girl) → 5");
  const m2c = computeGunaMilan(
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
    makeChart({ moonSign: 3, moonNak: "Ashlesha" }),
  );
  assert(koota(m2c, "gana").points === 1, "manushya(boy)+rakshasa(girl) → 1");
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 3, moonNak: "Ashlesha" }),
  );
  assert(koota(m3, "gana").points === 0, "deva+rakshasa → 0");
  const m4 = computeGunaMilan(
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
    makeChart({ moonSign: 3, moonNak: "Ashlesha" }),
  );
  assert(koota(m4, "gana").points === 1, "manushya(boy)+rakshasa(girl) → 1");
}

console.log("\n=== 7. Bhakoot ===");
{
  // Aries(0) → Taurus(1): 2nd house → 0
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
  );
  assert(koota(m, "bhakoot").points === 0, "2/12 relation → 0 (vedha)");
  // Aries(0) → Leo(4): 5th house → 0
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 4, moonNak: "Magha" }),
  );
  assert(koota(m2, "bhakoot").points === 0, "5/9 relation → 0 (vedha)");
  // Aries(0) → Cancer(3): 4th house → 7
  const m3 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 3, moonNak: "Pushya" }),
  );
  assert(koota(m3, "bhakoot").points === 7, "4th house → 7");
  // Aries(0) → Libra(6): 7th (opposite) → 7
  const m4 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 6, moonNak: "Swati" }),
  );
  assert(koota(m4, "bhakoot").points === 7, "7th house → 7");
}

console.log("\n=== 8. Nadi ===");
{
  // Ashwini (adi) + Ardra (adi) → same → 0
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 5, moonNak: "Ardra" }),
  );
  assert(koota(m, "nadi").points === 0, "same nadi → 0");
  assert(
    m.doshas.some(
      (d: any) => d.key === "nadi" && d.present && d.severity === "high",
    ),
    "nadi dosha present (high)",
  );
  // Ashwini (adi) + Bharani (madhya) → 8
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(koota(m2, "nadi").points === 8, "different nadi → 8");
}

console.log("\n=== Nadi exception (same lord) ===");
{
  // Ashwini (Ketu, adi) + Mula (Ketu, adi) — both Ketu-ruled, same nadi → same lord exception cancels
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 8, moonNak: "Mula" }),
  );
  const nadiDosha = m.doshas.find((d: any) => d.key === "nadi");
  assert(
    !!nadiDosha?.cancelled,
    "same-lord same-nadi → cancelled",
    JSON.stringify(nadiDosha),
  );
}

console.log("\n=== Bhakoot exception (friend lords) ===");
{
  // Aries(0)→Taurus(1) = 2/12 vedha; lords Mars(4) & Venus(3). Mars friends [0,1,5], Venus not in it; Venus friends [2,6] — not friends → NOT cancelled
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Rohini" }),
  );
  const bh = m.doshas.find((d: any) => d.key === "bhakoot");
  assert(
    !!bh && !bh.cancelled && bh.severity === "high",
    "Mars/Venus 2/12 → uncancelled",
  );
  // Leo(4)→Cancer(3) = 12th vedha; lords Sun(0) & Moon(1) — mutual friends → cancelled
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 4, moonNak: "Magha" }),
    makeChart({ moonSign: 3, moonNak: "Pushya" }),
  );
  const bh2 = m2.doshas.find((d: any) => d.key === "bhakoot");
  assert(
    !!bh2?.cancelled,
    "Sun/Moon 12th relation → cancelled",
    JSON.stringify(bh2),
  );
}

console.log("\n=== Vedha pairs ===");
{
  // Ashwini(1) + Pushya(8) — vedha pair
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 3, moonNak: "Pushya" }),
  );
  assert(!!m.vedhaPair, "Ashwini+Pushya → vedha pair");
  // Ashwini + Bharani — not a pair
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(!m2.vedhaPair, "Ashwini+Bharani → no vedha");
}

console.log("\n=== Rajju ===");
{
  // Both pada 1 in group 1 (Ashwini, Bharani) → Kantha
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini", moonPada: 1 }),
    makeChart({ moonSign: 1, moonNak: "Bharani", moonPada: 1 }),
  );
  assert(m.rajju.present, "same pada position → rajju present");
  // Different padas → no rajju
  const m2 = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini", moonPada: 1 }),
    makeChart({ moonSign: 1, moonNak: "Bharani", moonPada: 3 }),
  );
  assert(!m2.rajju.present, "different padas → no rajju");
}

console.log("\n=== Mangal dosha ===");
{
  // No Mars → no dosha
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(!m.boy.manglik, "no Mars → not manglik");

  // Gemini lagna (lord Mercury); Mars in Sagittarius = 7th; Moon in 2nd (not kendra) → no cancellations fire
  const manglikBoy = makeChart({
    moonSign: 0,
    moonNak: "Ashwini",
    moonHouse: 2,
    lagnaSign: 2,
    planets: [{ planet: 4, sign: 8, house: 7 }],
  });
  const m2 = computeGunaMilan(
    manglikBoy,
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(m2.boy.manglik, "Mars in 7th → manglik");
  assert(
    m2.boy.mangal.positions.some(
      (p: any) => p.ref === "Lagna" && p.house === 7,
    ),
    "position recorded as 7th from lagna",
  );

  // Mars in Aries (own sign) → cancelled
  const ownSign = makeChart({
    moonSign: 0,
    moonNak: "Ashwini",
    lagnaSign: 3, // Cancer lagna; Mars in Aries = 10th from lagna... need dosha position: use lagna Aries?
    planets: [{ planet: 4, sign: 0, house: 1 }],
  });
  // Mars in Aries in 1st house from Aries lagna → dosha position (1) but own sign → cancelled
  const ownSign2 = makeChart({
    moonSign: 0,
    moonNak: "Ashwini",
    lagnaSign: 0,
    planets: [{ planet: 4, sign: 0, house: 1 }],
  });
  const m3 = computeGunaMilan(
    ownSign2,
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  assert(
    m3.boy.mangal.hasDosha && !m3.boy.manglik,
    "Mars own sign in 1st → dosha nullified",
  );

  // Both Gemini lagna, Mars in Sagittarius 7th, Moon in 2nd → both manglik → mutual cancellation
  const manglikGirl = makeChart({
    moonSign: 1,
    moonNak: "Bharani",
    moonHouse: 2,
    lagnaSign: 2,
    planets: [{ planet: 4, sign: 8, house: 7 }],
  });
  const m4 = computeGunaMilan(manglikBoy, manglikGirl);
  assert(
    m4.doshas.some((d: any) => d.key === "mangal" && d.severity === "low"),
    "both manglik → mutual cancellation",
  );
}

console.log("\n=== Verdict ===");
{
  const m = computeGunaMilan(
    makeChart({ moonSign: 0, moonNak: "Ashwini" }),
    makeChart({ moonSign: 1, moonNak: "Bharani" }),
  );
  const total = m.total;
  const expected =
    total >= 32
      ? "Ati Uttam"
      : total >= 25
        ? "Uttam"
        : total >= 18
          ? "Madhyam"
          : total >= 12
            ? "Mand"
            : "Neech";
  assert(
    m.verdict.grade === expected,
    `verdict matches total ${total} → ${expected}`,
  );
}

console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━\n`);
if (fail > 0) {
  console.log("Failures:");
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
