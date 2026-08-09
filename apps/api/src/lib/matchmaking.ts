/**
 * Guna Milan (Ashtakoota) — traditional Vedic matchmaking engine.
 *
 * Pure rule engine. No AI. Every score traces to the classical 36-point
 * Ashtakoota system plus traditional dosha analysis:
 *
 *   Varna (1) · Vashya (2) · Tara (3) · Yoni (4)
 *   Graha Maitri (5) · Gana (6) · Bhakoot (7) · Nadi (8)  → 36 points
 *
 * Plus: Mangal (Kuja) dosha with classical cancellation rules, nakshatra
 * Vedha (obstruction) pairs, and Rajju dosha (based on nakshatra padas).
 *
 * Tables follow standard classical Jyotish references (Phaladeepika,
 * Muhurta Chintamani, and the Ashtakoota system as published in
 * mainstream Indian matchmaking practice). Where traditions differ,
 * the most widely adopted convention is used and documented inline.
 */
import type { BirthChart, PlanetaryPosition } from "../types/chart.js";

// ─── Nakshatra table (27) ────────────────────────────────────
// lord: 0-6,10,11 planet ids | yoni animal + gender | gana | nadi
const NAKSHATRAS: {
  name: string;
  lord: number;
  yoni: string;
  yoniGender: "m" | "f";
  gana: "deva" | "manushya" | "rakshasa";
  nadi: "adi" | "madhya" | "antya";
}[] = [
  {
    name: "Ashwini",
    lord: 11,
    yoni: "Ashwa",
    yoniGender: "m",
    gana: "deva",
    nadi: "adi",
  },
  {
    name: "Bharani",
    lord: 3,
    yoni: "Gaja",
    yoniGender: "m",
    gana: "manushya",
    nadi: "madhya",
  },
  {
    name: "Krittika",
    lord: 0,
    yoni: "Mesha",
    yoniGender: "f",
    gana: "rakshasa",
    nadi: "antya",
  },
  {
    name: "Rohini",
    lord: 1,
    yoni: "Sarpa",
    yoniGender: "m",
    gana: "manushya",
    nadi: "antya",
  },
  {
    name: "Mrigashira",
    lord: 4,
    yoni: "Sarpa",
    yoniGender: "f",
    gana: "deva",
    nadi: "madhya",
  },
  {
    name: "Ardra",
    lord: 10,
    yoni: "Shwan",
    yoniGender: "f",
    gana: "manushya",
    nadi: "adi",
  },
  {
    name: "Punarvasu",
    lord: 5,
    yoni: "Marjar",
    yoniGender: "f",
    gana: "deva",
    nadi: "adi",
  },
  {
    name: "Pushya",
    lord: 6,
    yoni: "Mesha",
    yoniGender: "m",
    gana: "deva",
    nadi: "madhya",
  },
  {
    name: "Ashlesha",
    lord: 2,
    yoni: "Marjar",
    yoniGender: "m",
    gana: "rakshasa",
    nadi: "antya",
  },
  {
    name: "Magha",
    lord: 11,
    yoni: "Mushaka",
    yoniGender: "m",
    gana: "rakshasa",
    nadi: "antya",
  },
  {
    name: "Purva Phalguni",
    lord: 3,
    yoni: "Mushaka",
    yoniGender: "f",
    gana: "manushya",
    nadi: "madhya",
  },
  {
    name: "Uttara Phalguni",
    lord: 0,
    yoni: "Go",
    yoniGender: "m",
    gana: "manushya",
    nadi: "adi",
  },
  {
    name: "Hasta",
    lord: 1,
    yoni: "Mahisha",
    yoniGender: "f",
    gana: "deva",
    nadi: "adi",
  },
  {
    name: "Chitra",
    lord: 4,
    yoni: "Vyaghra",
    yoniGender: "f",
    gana: "rakshasa",
    nadi: "madhya",
  },
  {
    name: "Swati",
    lord: 10,
    yoni: "Mahisha",
    yoniGender: "m",
    gana: "deva",
    nadi: "antya",
  },
  {
    name: "Vishakha",
    lord: 5,
    yoni: "Vyaghra",
    yoniGender: "m",
    gana: "rakshasa",
    nadi: "antya",
  },
  {
    name: "Anuradha",
    lord: 6,
    yoni: "Mriga",
    yoniGender: "f",
    gana: "deva",
    nadi: "madhya",
  },
  {
    name: "Jyeshtha",
    lord: 2,
    yoni: "Mriga",
    yoniGender: "m",
    gana: "rakshasa",
    nadi: "adi",
  },
  {
    name: "Mula",
    lord: 11,
    yoni: "Shwan",
    yoniGender: "m",
    gana: "rakshasa",
    nadi: "adi",
  },
  {
    name: "Purva Ashadha",
    lord: 3,
    yoni: "Vanara",
    yoniGender: "m",
    gana: "manushya",
    nadi: "madhya",
  },
  {
    name: "Uttara Ashadha",
    lord: 0,
    yoni: "Nakula",
    yoniGender: "m",
    gana: "manushya",
    nadi: "antya",
  },
  {
    name: "Shravana",
    lord: 1,
    yoni: "Vanara",
    yoniGender: "f",
    gana: "deva",
    nadi: "antya",
  },
  {
    name: "Dhanishta",
    lord: 4,
    yoni: "Simha",
    yoniGender: "f",
    gana: "rakshasa",
    nadi: "madhya",
  },
  {
    name: "Shatabhisha",
    lord: 10,
    yoni: "Ashwa",
    yoniGender: "f",
    gana: "rakshasa",
    nadi: "adi",
  },
  {
    name: "Purva Bhadrapada",
    lord: 5,
    yoni: "Simha",
    yoniGender: "m",
    gana: "manushya",
    nadi: "adi",
  },
  {
    name: "Uttara Bhadrapada",
    lord: 6,
    yoni: "Go",
    yoniGender: "f",
    gana: "manushya",
    nadi: "madhya",
  },
  {
    name: "Revati",
    lord: 2,
    yoni: "Gaja",
    yoniGender: "f",
    gana: "deva",
    nadi: "antya",
  },
];

// ─── Sign tables ─────────────────────────────────────────────
// Varna (1 pt) — Moon sign → varna group.
const VARNA_BY_SIGN: Record<number, string> = {
  0: "kshatriya",
  1: "vaishya",
  2: "shudra",
  3: "brahmin",
  4: "kshatriya",
  5: "vaishya",
  6: "shudra",
  7: "brahmin",
  8: "kshatriya",
  9: "vaishya",
  10: "shudra",
  11: "brahmin",
};

// Vashya (2 pts) — Moon sign → vashya group.
// Convention per classical matchmaking references.
const VASHYA_BY_SIGN: Record<number, string> = {
  0: "chatushpada",
  1: "chatushpada",
  2: "manav",
  3: "jalachara",
  4: "vanachar",
  5: "manav",
  6: "manav",
  7: "keeta",
  8: "chatushpada",
  9: "jalachara",
  10: "manav",
  11: "jalachara",
};

// Sign lord (Moon-sign lord used for Graha Maitri).
const SIGN_LORD: Record<number, number> = {
  0: 4,
  1: 3,
  2: 2,
  3: 1,
  4: 0,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 6,
  11: 5,
};

// Graha Maitri (5 pts) — natural friendship of planets.
// friends/enemies per classical planetary friendship table.
const PLANET_FRIENDS: Record<number, number[]> = {
  0: [1, 4, 5], // Sun
  1: [0, 2], // Moon
  2: [0, 3], // Mercury
  3: [2, 6], // Venus
  4: [0, 1, 5], // Mars
  5: [0, 1, 4], // Jupiter
  6: [2, 3], // Saturn
};
const PLANET_ENEMIES: Record<number, number[]> = {
  0: [3, 6],
  1: [],
  2: [1],
  3: [0, 1],
  4: [2],
  5: [2, 3],
  6: [0, 1, 4],
};

// Yoni (4 pts) — animal friendship matrix.
const YONI_FRIENDS: Record<string, string[]> = {
  Ashwa: ["Gaja", "Vyaghra", "Sarpa"],
  Gaja: ["Ashwa", "Simha", "Mriga"],
  Mesha: ["Mriga", "Vanara"],
  Sarpa: ["Go", "Mahisha", "Mriga"],
  Shwan: ["Vanara"],
  Marjar: ["Mushaka", "Shwan"],
  Mushaka: ["Marjar", "Simha"],
  Go: ["Sarpa", "Vyaghra", "Mahisha", "Mriga"],
  Mahisha: ["Sarpa", "Go", "Mriga"],
  Vyaghra: ["Ashwa", "Go", "Vanara"],
  Mriga: ["Gaja", "Mesha", "Sarpa", "Go", "Mahisha"],
  Vanara: ["Shwan", "Vyaghra", "Mesha"],
  Nakula: ["Simha"],
  Simha: ["Gaja", "Mushaka", "Go"],
};
const YONI_ENEMIES: Record<string, string[]> = {
  Ashwa: ["Shwan", "Mahisha"],
  Gaja: ["Mushaka", "Shwan"],
  Mesha: ["Simha", "Shwan"],
  Sarpa: ["Nakula", "Marjar"],
  Shwan: ["Ashwa", "Gaja", "Simha"],
  Marjar: ["Sarpa", "Nakula"],
  Mushaka: ["Gaja", "Vanara", "Go"],
  Go: ["Mushaka", "Vanara", "Simha"],
  Mahisha: ["Ashwa", "Vyaghra", "Vanara"],
  Vyaghra: ["Mahisha"],
  Mriga: ["Simha", "Shwan"],
  Vanara: ["Gaja", "Mushaka", "Go", "Mahisha", "Simha"],
  Nakula: ["Sarpa", "Marjar"],
  Simha: ["Mriga", "Mesha", "Shwan", "Vanara"],
};

// Nakshatra Vedha pairs — the 26 obstruction pairs (1-indexed stars).
const VEDHA_PAIRS: [number, number][] = [
  [1, 8],
  [2, 9],
  [3, 10],
  [4, 11],
  [5, 12],
  [6, 13],
  [7, 14],
  [8, 15],
  [9, 16],
  [10, 17],
  [11, 18],
  [12, 19],
  [13, 20],
  [14, 21],
  [15, 22],
  [16, 23],
  [17, 24],
  [18, 25],
  [19, 26],
  [20, 27],
  [21, 1],
  [22, 2],
  [23, 3],
  [24, 4],
  [25, 5],
  [26, 6],
  [27, 7],
];

// Rajju dosha — body-part mapping by nakshatra group and pada.
// Groups: 1-9 (Ashwini..Ashlesha), 10-18 (Magha..Jyeshtha), 19-27 (Mula..Revati)
const RAJJU_PARTS = ["Kantha", "Kati", "Nadi", "Pada"] as const;

// ─── Helpers ─────────────────────────────────────────────────
function nakIndexByName(name: string): number {
  return NAKSHATRAS.findIndex((n) => n.name === name);
}

function nakshatraOf(chart: BirthChart) {
  const moon = chart.planets.find((p) => p.planet === 1);
  if (!moon) return null;
  const idx = nakIndexByName(moon.nakshatra);
  if (idx === -1) return null;
  return {
    idx,
    pada: moon.nakshatraPada ?? 1,
    sign: moon.sign,
    lord: SIGN_LORD[moon.sign],
  };
}

function houseFromSign(fromSign: number, toSign: number): number {
  return (((toSign - fromSign) % 12) + 12) % 12; // 0 = same sign
}

function planetById(
  chart: BirthChart,
  id: number,
): PlanetaryPosition | undefined {
  return chart.planets.find((p) => p.planet === id);
}

function houseOf(chart: BirthChart, id: number): number {
  return planetById(chart, id)?.house ?? 0;
}

/** Does the planet at `fromHouse` aspect `targetHouse` (Vedic full aspect rules)? */
function aspectsHouse(
  planetId: number,
  fromHouse: number,
  targetHouse: number,
): boolean {
  if (fromHouse === 0 || targetHouse === 0) return false;
  const offset = (((targetHouse - fromHouse) % 12) + 12) % 12; // 0-11
  if (offset === 6) return true; // every planet aspects its 7th
  if (planetId === 4 && (offset === 3 || offset === 7)) return true; // Mars: 4,7,8
  if (planetId === 6 && (offset === 2 || offset === 9)) return true; // Saturn: 3,7,10
  if (planetId === 5 && (offset === 4 || offset === 8)) return true; // Jupiter: 5,7,9
  return false;
}

// ─── Koota scorers ───────────────────────────────────────────

function scoreVarna(boySign: number, girlSign: number) {
  const b = VARNA_BY_SIGN[boySign];
  const g = VARNA_BY_SIGN[girlSign];
  return {
    points: b === g ? 1 : 0,
    boy: b,
    girl: g,
    detail:
      b === g
        ? `Both Moon signs belong to the same Varna (${b}) — full marks.`
        : `Moon signs belong to different Varnas (${b} / ${g}) — no points.`,
  };
}

function scoreVashya(boySign: number, girlSign: number) {
  const b = VASHYA_BY_SIGN[boySign];
  const g = VASHYA_BY_SIGN[girlSign];
  const compatible =
    b === g ||
    (b === "chatushpada" && g === "manav") ||
    (b === "manav" && g === "chatushpada") ||
    (b === "jalachara" && g === "keeta") ||
    (b === "keeta" && g === "jalachara") ||
    (b === "vanachar" && g === "chatushpada");
  return {
    points: compatible ? 2 : 0,
    boy: b,
    girl: g,
    detail: compatible
      ? `Vashya groups (${b} / ${g}) are mutually compatible or controlling — 2 points.`
      : `Vashya groups (${b} / ${g}) have no mutual attraction — 0 points.`,
  };
}

function scoreTara(boyIdx: number, girlIdx: number) {
  // Count from the boy's star to the girl's star (1-27)
  const distance = ((((girlIdx - boyIdx) % 27) + 27) % 27) + 1;
  const r = distance % 9; // 1..9 pattern
  const taraNames: Record<number, string> = {
    1: "Janma",
    2: "Sampat",
    3: "Vipat",
    4: "Kshema",
    5: "Pratyari",
    6: "Sadhaka",
    7: "Vadha",
    8: "Mitra",
    0: "Ati-mitra",
  };
  const beneficial = [2, 4, 6, 8, 0].includes(r);
  const name = taraNames[r];
  return {
    points: beneficial ? 3 : 0,
    distance,
    tara: name,
    detail: `${girlIdx + 1}th star counted from the boy's star → ${name} tara — ${beneficial ? "auspicious, 3 points" : "inauspicious, 0 points"}.`,
  };
}

function scoreYoni(
  boyYoni: string,
  boyGender: string,
  girlYoni: string,
  girlGender: string,
) {
  if (boyYoni === girlYoni) {
    if (boyGender !== girlGender) {
      return {
        points: 4,
        detail: `Same Yoni (${boyYoni}) with opposing genders — 4 points.`,
      };
    }
    return {
      points: 0,
      detail: `Same Yoni (${boyYoni}) but same gender — no points.`,
    };
  }
  if (
    YONI_FRIENDS[boyYoni]?.includes(girlYoni) ||
    YONI_FRIENDS[girlYoni]?.includes(boyYoni)
  ) {
    return {
      points: 4,
      detail: `Yonis are friendly (${boyYoni} / ${girlYoni}) — 4 points.`,
    };
  }
  if (
    YONI_ENEMIES[boyYoni]?.includes(girlYoni) ||
    YONI_ENEMIES[girlYoni]?.includes(boyYoni)
  ) {
    return {
      points: 0,
      detail: `Yonis are enemies (${boyYoni} / ${girlYoni}) — 0 points.`,
    };
  }
  return {
    points: 2,
    detail: `Yonis are neutral (${boyYoni} / ${girlYoni}) — 2 points.`,
  };
}

function scoreGrahaMaitri(boyLord: number, girlLord: number) {
  const rel = (a: number, b: number) =>
    a === b
      ? "friend"
      : PLANET_FRIENDS[a]?.includes(b)
        ? "friend"
        : PLANET_ENEMIES[a]?.includes(b)
          ? "enemy"
          : "neutral";
  const br = rel(boyLord, girlLord);
  const gr = rel(girlLord, boyLord);
  const pair = [br, gr].sort().join("+") as string;
  const table: Record<string, number> = {
    "friend+friend": 5,
    "friend+neutral": 4,
    "neutral+neutral": 3,
    "enemy+friend": 2,
    "enemy+neutral": 1,
    "enemy+enemy": 0,
  };
  const points = table[pair] ?? 0;
  const lordName = (id: number) =>
    ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"][id] ??
    `P${id}`;
  return {
    points,
    boyLord: lordName(boyLord),
    girlLord: lordName(girlLord),
    detail: `Moon-sign lords ${lordName(boyLord)} and ${lordName(girlLord)}: ${br}/${gr} — ${points} points.`,
  };
}

function scoreGana(boyGana: string, girlGana: string) {
  // Classical directional table (boy's gana × girl's gana):
  //   same gana            → 6
  //   Deva boy, Manushya girl → 6
  //   Manushya boy, Deva girl → 5
  //   Manushya boy, Rakshasa girl → 1
  //   any other mix        → 0
  const table: Record<string, number> = {
    "deva+deva": 6,
    "manushya+manushya": 6,
    "rakshasa+rakshasa": 6,
    "deva+manushya": 6,
    "manushya+deva": 5,
    "manushya+rakshasa": 1,
    "deva+rakshasa": 0,
    "rakshasa+deva": 0,
    "rakshasa+manushya": 0,
  };
  const points = table[`${boyGana}+${girlGana}`] ?? 0;
  return {
    points,
    boy: boyGana,
    girl: girlGana,
    detail:
      points >= 5
        ? `Ganas (${boyGana} / ${girlGana}) are compatible — ${points} points.`
        : points === 1
          ? `Ganas (${boyGana} / ${girlGana}) — only 1 point; Rakshasa influence on the girl's side.`
          : `Ganas (${boyGana} / ${girlGana}) are incompatible (Rakshasa involved) — 0 points.`,
  };
}

function scoreBhakoot(boySign: number, girlSign: number) {
  const dist = houseFromSign(boySign, girlSign); // 0-11
  const compatible = [0, 2, 3, 6, 9, 10].includes(dist);
  const houseApart = dist + 1;
  return {
    points: compatible ? 7 : 0,
    distance: houseApart,
    detail: compatible
      ? `Moon signs are ${houseApart} houses apart — Bhakoot compatible, 7 points.`
      : `Moon signs are ${houseApart} houses apart — Bhakoot VEDHA (2/12, 5/9, 6/8), 0 points.`,
  };
}

function scoreNadi(boyNadi: string, girlNadi: string) {
  return {
    points: boyNadi === girlNadi ? 0 : 8,
    boy: boyNadi,
    girl: girlNadi,
    detail:
      boyNadi === girlNadi
        ? `Same Nadi (${boyNadi}) — 0 points. This is the most serious koota dosha.`
        : `Different Nadi (${boyNadi} / ${girlNadi}) — 8 points.`,
  };
}

// ─── Dosha analysis ──────────────────────────────────────────

/** Mangal (Kuja) dosha per chart with classical cancellations. */
function analyzeMangal(chart: BirthChart): {
  hasDosha: boolean;
  severity: "high" | "medium" | "none";
  positions: { ref: string; house: number }[];
  cancellations: string[];
  manglik: boolean;
} {
  const mars = planetById(chart, 4);
  const positions: { ref: string; house: number }[] = [];
  const cancellations: string[] = [];

  if (!mars)
    return {
      hasDosha: false,
      severity: "none",
      positions: [],
      cancellations: [],
      manglik: false,
    };

  const lagnaSign = chart.lagna.sign;
  const moon = planetById(chart, 1);
  const venus = planetById(chart, 3);

  const checkRef = (refName: string, refSign: number | undefined) => {
    if (refSign === undefined) return;
    const dist = houseFromSign(refSign, mars.sign); // 0-11
    const house = dist + 1;
    if ([1, 2, 4, 7, 8, 12].includes(house)) {
      positions.push({ ref: refName, house });
    }
  };
  checkRef("Lagna", lagnaSign);
  checkRef("Moon", moon?.sign);
  checkRef("Venus", venus?.sign);

  const marsHouse = mars.house;

  // Cancellations (classical rules)
  // 1. Own sign / exaltation
  if (mars.sign === 0 || mars.sign === 7 || mars.sign === 9) {
    cancellations.push(
      "Mars in its own sign (Aries/Scorpio) or exaltation (Capricorn) — dosha nullified.",
    );
  }
  // 2. 7th lord in Kendra/Trikona
  const seventhLord = SIGN_LORD[(lagnaSign + 6) % 12];
  const seventhLordHouse = houseOf(chart, seventhLord);
  if ([1, 4, 5, 7, 9, 10].includes(seventhLordHouse)) {
    cancellations.push(
      `7th house lord placed in Kendra/Trikona (house ${seventhLordHouse}) — dosha nullified.`,
    );
  }
  // 3. Jupiter aspects the 7th house
  const jupiterHouse = houseOf(chart, 5);
  if (aspectsHouse(5, jupiterHouse, 7)) {
    cancellations.push("Jupiter aspects the 7th house — dosha nullified.");
  }
  // 4. Venus aspects the 7th house
  const venusHouse = houseOf(chart, 3);
  if (aspectsHouse(3, venusHouse, 7)) {
    cancellations.push("Venus aspects the 7th house — dosha nullified.");
  }
  // 5. Lagna lord in Kendra/Trikona
  const lagnaLordHouse = houseOf(chart, SIGN_LORD[lagnaSign]);
  if ([1, 4, 5, 7, 9, 10].includes(lagnaLordHouse)) {
    cancellations.push(
      `Lagna lord in Kendra/Trikona (house ${lagnaLordHouse}) — dosha nullified.`,
    );
  }
  // 6. Moon in Kendra from lagna
  const moonHouse = houseOf(chart, 1);
  if ([1, 4, 7, 10].includes(moonHouse)) {
    cancellations.push(
      `Moon in Kendra (house ${moonHouse}) — dosha nullified.`,
    );
  }
  // 7. Mars in 8th aspected by Jupiter
  if (marsHouse === 8 && aspectsHouse(5, jupiterHouse, 8)) {
    cancellations.push(
      "Mars in the 8th house is aspected by Jupiter — dosha nullified.",
    );
  }
  // 8. Mars is the 7th lord and in Kendra
  if (seventhLord === 4 && [1, 4, 7, 10].includes(marsHouse)) {
    cancellations.push(
      `Mars rules the 7th house and is in Kendra (house ${marsHouse}) — dosha nullified.`,
    );
  }
  // 9. Mars in 2nd house with Sun in 12th
  const sunHouse = houseOf(chart, 0);
  if (marsHouse === 2 && sunHouse === 12) {
    cancellations.push(
      "Mars in the 2nd with Sun in the 12th — dosha nullified.",
    );
  }

  const hasDosha = positions.length > 0;
  const manglik = hasDosha && cancellations.length === 0;
  const severity: "high" | "medium" | "none" = !hasDosha
    ? "none"
    : cancellations.length > 0
      ? "medium"
      : "high";

  return { hasDosha, severity, positions, cancellations, manglik };
}

const ZODIAC_EN_NAMES: string[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

/**
 * Lagna compatibility — Sri Lankan practice.
 * Beyond the Moon-based Ashtakoota, Sinhala astrologers check the two
 * ascendants: the natural friendship of the Lagna lords, and whether the
 * Lagnas stand in a favourable (Kendra/Trikona) or adverse relation.
 */
function analyzeLagna(boyChart: BirthChart, girlChart: BirthChart) {
  const boySign = boyChart.lagna.sign;
  const girlSign = girlChart.lagna.sign;
  const boyLord = SIGN_LORD[boySign];
  const girlLord = SIGN_LORD[girlSign];

  const rel = (a: number, b: number) =>
    a === b
      ? "friend"
      : PLANET_FRIENDS[a]?.includes(b)
        ? "friend"
        : PLANET_ENEMIES[a]?.includes(b)
          ? "enemy"
          : "neutral";
  const br = rel(boyLord, girlLord);
  const gr = rel(girlLord, boyLord);
  const relation: "friend" | "neutral" | "enemy" =
    br === "friend" && gr === "friend"
      ? "friend"
      : br === "enemy" && gr === "enemy"
        ? "enemy"
        : "neutral";

  // House relation of the two Lagna signs (counted either direction).
  const dist = Math.min(
    houseFromSign(boySign, girlSign),
    houseFromSign(girlSign, boySign),
  );
  const kendra = [0, 3, 6].includes(dist); // 1st, 4th, 7th
  const trikona = [4, 8].includes(dist); // 5th, 9th
  const ordinal = (n: number) =>
    n +
    (n % 10 === 1 && n !== 11
      ? "st"
      : n % 10 === 2 && n !== 12
        ? "nd"
        : n % 10 === 3 && n !== 13
          ? "rd"
          : "th");
  const houseRelation = kendra
    ? `Kendra (${ordinal(dist + 1)} from each other)`
    : trikona
      ? `Trikona (${ordinal(dist + 1)} from each other)`
      : `${ordinal(dist + 1)} from each other`;

  const favorable =
    relation === "friend" ||
    (relation === "neutral" && (kendra || trikona || dist === 6));
  const note =
    relation === "enemy"
      ? `The Lagna lords (${PLANET_EN[boyLord]} / ${PLANET_EN[girlLord]}) are natural enemies — Sri Lankan practice advises caution with this Lagna combination.`
      : favorable
        ? `The Lagnas are compatible: lords ${PLANET_EN[boyLord]} and ${PLANET_EN[girlLord]} are ${br === gr ? br + "s" : "neutral"}, and the ascendants stand in a ${houseRelation} relation.`
        : `The Lagna lords (${PLANET_EN[boyLord]} / ${PLANET_EN[girlLord]}) are ${br}/${gr} — a mixed relation. Lagna compatibility is moderate.`;

  return {
    boySign,
    girlSign,
    boyLord: PLANET_EN[boyLord],
    girlLord: PLANET_EN[girlLord],
    relation,
    relationDetail: `${br}/${gr}`,
    houseRelation,
    favorable,
    note: `${note} Lagna names: ${ZODIAC_EN_NAMES[boySign]} / ${ZODIAC_EN_NAMES[girlSign]}.`,
  };
}

/** Rajju dosha — same body part from nakshatra group + pada. */
function analyzeRajju(
  boyIdx: number,
  boyPada: number,
  girlIdx: number,
  girlPada: number,
) {
  const part = (idx: number, pada: number) => {
    const group = Math.floor(idx / 9); // 0,1,2
    const shift = group; // group 1 shifts by 0, group 2 by 1, group 3 by 2
    return RAJJU_PARTS[(pada - 1 + shift) % 4];
  };
  const b = part(boyIdx, boyPada);
  const g = part(girlIdx, girlPada);
  return { boyPart: b, girlPart: g, present: b === g };
}

// ─── Main engine ─────────────────────────────────────────────

export interface MatchKoota {
  key: string;
  name: string;
  /** Sinhala name (නැකැත් ගැලපීම vocabulary) */
  nameSi: string;
  max: number;
  points: number;
  detail: string;
  sub?: Record<string, string>;
}

export interface MatchDosha {
  key: string;
  name: string;
  /** Sinhala name */
  nameSi: string;
  present: boolean;
  severity: "high" | "medium" | "low";
  description: string;
  cancelled?: boolean;
  cancellationNote?: string;
}

export interface MatchResult {
  success: boolean;
  boy: {
    name?: string;
    moonSign: number;
    nakshatra: string;
    nakshatraPada: number;
    lagnaSign: number;
    manglik: boolean;
    mangal: ReturnType<typeof analyzeMangal>;
  };
  girl: {
    name?: string;
    moonSign: number;
    nakshatra: string;
    nakshatraPada: number;
    lagnaSign: number;
    manglik: boolean;
    mangal: ReturnType<typeof analyzeMangal>;
  };
  kootas: MatchKoota[];
  total: number;
  maxTotal: number;
  verdict: {
    grade: string;
    gradeSi: string;
    label: string;
    color: "excellent" | "good" | "average" | "poor" | "very-poor";
    note: string;
  };
  doshas: MatchDosha[];
  nadiException?: string;
  bhakootException?: string;
  vedhaPair?: { boy: string; girl: string };
  rajju: { present: boolean; boyPart: string; girlPart: string };
  /** Sri Lankan practice — Lagna (ascendant) compatibility, in addition to Moon-based Ashtakoota. */
  lagna: {
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

const PLANET_EN: Record<number, string> = {
  0: "Sun",
  1: "Moon",
  2: "Mercury",
  3: "Venus",
  4: "Mars",
  5: "Jupiter",
  6: "Saturn",
  10: "Rahu",
  11: "Ketu",
};

export function computeGunaMilan(
  boyChart: BirthChart,
  girlChart: BirthChart,
): MatchResult {
  const boy = nakshatraOf(boyChart);
  const girl = nakshatraOf(girlChart);

  if (!boy || !girl) {
    throw new Error(
      "Moon nakshatra could not be determined for one or both charts.",
    );
  }

  const kootas: MatchKoota[] = [];

  // 1. Varna
  const varna = scoreVarna(boy.sign, girl.sign);
  kootas.push({
    key: "varna",
    nameSi: "වර්ණ",
    name: "Varna",
    max: 1,
    points: varna.points,
    detail: varna.detail,
    sub: { Boy: varna.boy, Girl: varna.girl },
  });

  // 2. Vashya
  const vashya = scoreVashya(boy.sign, girl.sign);
  kootas.push({
    key: "vashya",
    nameSi: "වශ්‍ය",
    name: "Vashya",
    max: 2,
    points: vashya.points,
    detail: vashya.detail,
    sub: { Boy: vashya.boy, Girl: vashya.girl },
  });

  // 3. Tara
  const tara = scoreTara(boy.idx, girl.idx);
  kootas.push({
    key: "tara",
    nameSi: "තාරා",
    name: "Tara",
    max: 3,
    points: tara.points,
    detail: tara.detail,
    sub: { "Stars apart": `${tara.distance}`, Tara: tara.tara },
  });

  // 4. Yoni
  const boyNak = NAKSHATRAS[boy.idx];
  const girlNak = NAKSHATRAS[girl.idx];
  const yoni = scoreYoni(
    boyNak.yoni,
    boyNak.yoniGender,
    girlNak.yoni,
    girlNak.yoniGender,
  );
  kootas.push({
    key: "yoni",
    nameSi: "යෝනි",
    name: "Yoni",
    max: 4,
    points: yoni.points,
    detail: yoni.detail,
    sub: { Boy: boyNak.yoni, Girl: girlNak.yoni },
  });

  // 5. Graha Maitri
  const maitri = scoreGrahaMaitri(boy.lord, girl.lord);
  kootas.push({
    key: "maitri",
    nameSi: "ග්‍රහ මෛත්‍රී",
    name: "Graha Maitri",
    max: 5,
    points: maitri.points,
    detail: maitri.detail,
    sub: { "Boy lord": maitri.boyLord, "Girl lord": maitri.girlLord },
  });

  // 6. Gana
  const gana = scoreGana(boyNak.gana, girlNak.gana);
  kootas.push({
    key: "gana",
    nameSi: "ගණ",
    name: "Gana",
    max: 6,
    points: gana.points,
    detail: gana.detail,
    sub: { Boy: boyNak.gana, Girl: girlNak.gana },
  });

  // 7. Bhakoot
  const bhakoot = scoreBhakoot(boy.sign, girl.sign);
  kootas.push({
    key: "bhakoot",
    nameSi: "භකූට",
    name: "Bhakoot",
    max: 7,
    points: bhakoot.points,
    detail: bhakoot.detail,
    sub: { "Houses apart": `${bhakoot.distance}` },
  });

  // 8. Nadi
  const nadi = scoreNadi(boyNak.nadi, girlNak.nadi);
  kootas.push({
    key: "nadi",
    nameSi: "නාඩි",
    name: "Nadi",
    max: 8,
    points: nadi.points,
    detail: nadi.detail,
    sub: { Boy: boyNak.nadi, Girl: girlNak.nadi },
  });

  const total = kootas.reduce((s, k) => s + k.points, 0);

  // ─── Doshas ─────────────────────────────────────────────
  const doshas: MatchDosha[] = [];
  let nadiException: string | undefined;
  let bhakootException: string | undefined;
  let vedhaPair: { boy: string; girl: string } | undefined;

  // Nadi dosha + exception (same nakshatra lord)
  if (nadi.points === 0) {
    if (boyNak.lord === girlNak.lord) {
      nadiException = `Both nakshatras are ruled by ${PLANET_EN[boyNak.lord]} — Nadi dosha is cancelled by tradition.`;
      doshas.push({
        key: "nadi",
        nameSi: "නාඩි දෝෂය",
        name: "Nadi dosha",
        present: true,
        severity: "low",
        cancelled: true,
        description:
          "Same Nadi detected, but both nakshatras share the same lord — dosha cancelled.",
        cancellationNote: nadiException,
      });
    } else {
      doshas.push({
        key: "nadi",
        name: "Nadi dosha",
        nameSi: "නාඩි දෝෂය",
        present: true,
        severity: "high",
        description: `Same Nadi (${boyNak.nadi}). This is considered the most serious matching dosha — traditionally requiring careful consideration or remediation even with a high total.`,
      });
    }
  }

  // Bhakoot dosha + exception (same lord or mutual friends)
  if (bhakoot.points === 0) {
    const b = boy.lord;
    const g = girl.lord;
    const friends =
      b === g ||
      PLANET_FRIENDS[b]?.includes(g) ||
      PLANET_FRIENDS[g]?.includes(b);
    if (friends) {
      bhakootException = `Moon-sign lords ${PLANET_EN[b]} and ${PLANET_EN[g]} are the same or mutual friends — Bhakoot dosha cancelled.`;
      doshas.push({
        key: "bhakoot",
        nameSi: "භකූට දෝෂය",
        name: "Bhakoot dosha",
        present: true,
        severity: "low",
        cancelled: true,
        description:
          "Bhakoot VEDHA detected, but the Moon-sign lords are same/mutual friends — dosha cancelled.",
        cancellationNote: bhakootException,
      });
    } else {
      doshas.push({
        key: "bhakoot",
        name: "Bhakoot dosha",
        nameSi: "භකූට දෝෂය",
        present: true,
        severity: "high",
        description: `Bhakoot VEDHA — Moon signs ${bhakoot.distance} houses apart (a 2/12, 5/9 or 6/8 relation). Traditionally considered a serious obstruction to the match.`,
      });
    }
  }

  // Nakshatra Vedha
  const isVedhaPair = VEDHA_PAIRS.some(
    ([a, b]) =>
      (a - 1 === boy.idx && b - 1 === girl.idx) ||
      (a - 1 === girl.idx && b - 1 === boy.idx),
  );
  if (isVedhaPair) {
    vedhaPair = { boy: boyNak.name, girl: girlNak.name };
    doshas.push({
      key: "vedha",
      nameSi: "නැකැත් වේධ",
      name: "Nakshatra Vedha",
      present: true,
      severity: "medium",
      description: `The birth stars ${boyNak.name} and ${girlNak.name} form a Vedha (obstruction) pair — the nakshatras cancel each other's auspiciousness.`,
    });
  }

  // Rajju dosha
  const rajju = analyzeRajju(boy.idx, boy.pada, girl.idx, girl.pada);
  if (rajju.present) {
    doshas.push({
      key: "rajju",
      nameSi: "රජ්ජු දෝෂය",
      name: "Rajju dosha",
      present: true,
      severity: "medium",
      description: `Both Moons fall on the same Rajju body part (${rajju.boyPart}) — a traditionally feared dosha relating to longevity and well-being.`,
    });
  }

  // Mangal matching
  const boyMangal = analyzeMangal(boyChart);
  const girlMangal = analyzeMangal(girlChart);
  // Sri Lankan practice — Lagna compatibility check
  const lagna = analyzeLagna(boyChart, girlChart);
  const bothManglik = boyMangal.manglik && girlMangal.manglik;
  const oneManglik = boyMangal.manglik !== girlMangal.manglik;
  if (bothManglik) {
    doshas.push({
      key: "mangal",
      nameSi: "කුජ දෝෂය",
      name: "Mangal (Kuja) dosha",
      present: true,
      severity: "low",
      description:
        "Both natives are Manglik — the doshas cancel each other by tradition.",
    });
  } else if (oneManglik) {
    const manglikSide = boyMangal.manglik ? "the boy" : "the girl";
    doshas.push({
      key: "mangal",
      name: "Mangal (Kuja) dosha",
      nameSi: "කුජ දෝෂය",
      present: true,
      severity: "high",
      description: `${manglikSide} carries uncancelled Mangal dosha while the other does not. Traditionally this match requires careful consideration and remedial measures.`,
    });
  }

  // ─── Verdict ────────────────────────────────────────────
  let grade: MatchResult["verdict"]["grade"];
  let gradeSi = "";
  let label: string;
  let color: MatchResult["verdict"]["color"];
  if (total >= 32) {
    grade = "Ati Uttam";
    gradeSi = "අති උත්තම";
    label = "Excellent";
    color = "excellent";
  } else if (total >= 25) {
    grade = "Uttam";
    gradeSi = "උත්තම";
    label = "Very good";
    color = "good";
  } else if (total >= 18) {
    grade = "Madhyam";
    gradeSi = "මධ්‍යම";
    label = "Acceptable";
    color = "average";
  } else if (total >= 12) {
    grade = "Mand";
    gradeSi = "මන්ද";
    label = "Below average";
    color = "poor";
  } else {
    grade = "Neech";
    gradeSi = "නීච";
    label = "Very poor";
    color = "very-poor";
  }

  const serious = doshas.filter(
    (d) =>
      d.present && !d.cancelled && (d.key === "nadi" || d.key === "bhakoot"),
  );
  const note =
    serious.length > 0
      ? `Total of ${total}/36, but ${serious.map((d) => d.name).join(" and ")} present uncancelled — tradition regards such VEDHA as overriding the total score.`
      : total >= 18
        ? `Total of ${total}/36 meets the traditional acceptance threshold of 18+.`
        : `Total of ${total}/36 falls below the traditional acceptance threshold of 18.`;

  const recommendations: string[] = [];
  if (!lagna.favorable)
    recommendations.push(
      "Lagna compatibility is not favourable — Sinhala practice advises consulting an astrologer for a full Lagna-based assessment in addition to Guna Milan.",
    );
  if (total < 18)
    recommendations.push(
      "The Guna Milan total is below 18 — tradition advises against this match unless specific remedial measures are taken.",
    );
  if (doshas.some((d) => d.key === "nadi" && d.present && !d.cancelled))
    recommendations.push(
      "Nadi dosha present — consult a qualified astrologer; traditional remedies include specific rituals prescribed per family tradition.",
    );
  if (doshas.some((d) => d.key === "bhakoot" && d.present && !d.cancelled))
    recommendations.push(
      "Bhakoot VEDHA present — consider the lords' relationship and seek an expert opinion before proceeding.",
    );
  if (doshas.some((d) => d.key === "mangal" && d.severity === "high"))
    recommendations.push(
      "Mangal dosha mismatch — traditional remedies (Kumbha Vivaha, Mangal Shanti) are sometimes prescribed; consult an expert.",
    );
  if (vedhaPair)
    recommendations.push(
      `Nakshatra Vedha between ${vedhaPair.boy} and ${vedhaPair.girl} — the couple is advised to be mindful of mutual obstruction and perform joint auspicious activities on days favourable to both stars.`,
    );
  if (doshas.some((d) => d.key === "rajju" && d.present))
    recommendations.push(
      "Rajju dosha present — traditionally associated with longevity concerns; remedial poojas are advised.",
    );
  if (!recommendations.length)
    recommendations.push(
      "No major doshas detected — the match is considered traditionally favourable.",
    );

  return {
    success: true,
    boy: {
      name: boyChart.name,
      moonSign: boy.sign,
      nakshatra: boyNak.name,
      nakshatraPada: boy.pada,
      lagnaSign: boyChart.lagna.sign,
      manglik: boyMangal.manglik,
      mangal: boyMangal,
    },
    girl: {
      name: girlChart.name,
      moonSign: girl.sign,
      nakshatra: girlNak.name,
      nakshatraPada: girl.pada,
      lagnaSign: girlChart.lagna.sign,
      manglik: girlMangal.manglik,
      mangal: girlMangal,
    },
    kootas,
    total,
    maxTotal: 36,
    verdict: { grade, gradeSi, label, color, note },
    doshas,
    nadiException,
    bhakootException,
    vedhaPair,
    rajju,
    lagna,
    recommendations,
  };
}
