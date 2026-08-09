/**
 * Panchanga — Sinhala (Sri Lankan) daily almanac engine.
 *
 * Pure rule engine. Computes the daily timings Sri Lankan astrologers and
 * families actually use:
 *
 *   - Sunrise / sunset (Swiss Ephemeris, topocentric)
 *   - Rahu Kala   (රාහු කාලය)   — inauspicious; avoid starting new work
 *   - Yama Kala   (යම කාලය)    — inauspicious for travel
 *   - Gulika Kala (ගුලික කාලය)  — inauspicious for medical treatment
 *   - Buddhist Era date (B.E. = CE + 543), Sinhala month & weekday
 *   - Day nakshatra (නැකත) at sunrise — the star governing the day
 *
 * The Kala tables follow the standard eight-part division of daylight used
 * in Sri Lankan almanacs (Panchangas):
 *   daylight = sunset − sunrise, divided into 8 equal segments.
 * Each weekday has a fixed segment for Rahu / Yama / Gulika.
 */
import swisseph from "swisseph";
import { DateTime } from "luxon";

export interface KalaPeriod {
  /** Name in English */
  name: string;
  /** Name in Sinhala */
  nameSi: string;
  start: string; // HH:mm local
  end: string; // HH:mm local
  segment: number; // 1-8
  guidance: string;
  guidanceSi: string;
}

export interface PanchangaDay {
  date: string; // YYYY-MM-DD
  weekDay: { en: string; si: string };
  beYear: number; // Buddhist Era year
  sinhalaMonth: { en: string; si: string };
  sunrise: string;
  sunset: string;
  dayNakshatra: { name: string; nameSi: string; lord: string };
  rahuKala: KalaPeriod;
  yamaKala: KalaPeriod;
  gulikaKala: KalaPeriod;
  /** The two most auspicious time windows (outside all Kalas), ~48 min each. */
  auspiciousWindows: { start: string; end: string }[];
  /** Short rule-based suitability notes for the day. */
  dayNotes: string[];
}

// Segment (1-8, counted from sunrise) for each weekday. JS getDay(): 0=Sun..6=Sat
const RAHU_SEGMENT: Record<number, number> = {
  0: 8,
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3,
};
const YAMA_SEGMENT: Record<number, number> = {
  0: 6,
  1: 4,
  2: 8,
  3: 3,
  4: 7,
  5: 1,
  6: 5,
};
const GULIKA_SEGMENT: Record<number, number> = {
  0: 4,
  1: 8,
  2: 5,
  3: 6,
  4: 2,
  5: 3,
  6: 7,
};

const WEEKDAYS: Record<number, { en: string; si: string }> = {
  0: { en: "Sunday", si: "ඉරිදා" },
  1: { en: "Monday", si: "සඳුදා" },
  2: { en: "Tuesday", si: "අඟහරුවාදා" },
  3: { en: "Wednesday", si: "බදාදා" },
  4: { en: "Thursday", si: "බ්‍රහස්පතින්දා" },
  5: { en: "Friday", si: "සිකුරාදා" },
  6: { en: "Saturday", si: "සෙනසුරාදා" },
};

const SINHALA_MONTHS: Record<number, { en: string; si: string }> = {
  1: { en: "Duruthu", si: "දුරුතු" },
  2: { en: "Navam", si: "නවම්" },
  3: { en: "Madin", si: "මැදින්" },
  4: { en: "Bak", si: "බක්" },
  5: { en: "Vesak", si: "වෙසක්" },
  6: { en: "Poson", si: "පොසොන්" },
  7: { en: "Esala", si: "ඇසළ" },
  8: { en: "Nikini", si: "නිකිණි" },
  9: { en: "Binara", si: "බිනර" },
  10: { en: "Vap", si: "වප්" },
  11: { en: "Il", si: "ඉල්" },
  12: { en: "Unduvap", si: "උඳුවප්" },
};

// Sinhala nakshatra (නැකත) names — 27, indexed like the ephemeris table.
const NAK_SI: string[] = [
  "අස්විද",
  "බෙරණ",
  "කැති",
  "රේහන",
  "මුවසිරස",
  "අද",
  "පුනර්වස",
  "පුෂ",
  "අස්ලිය",
  "මා",
  "පුර පලග",
  "උතුරු පලග",
  "හත",
  "සිත",
  "ස්වාති",
  "විසා",
  "අනුරාධ",
  "ජෙෂ්ඨ",
  "මුල",
  "පුර ඇසළ",
  "උතුරු ඇසළ",
  "සවන",
  "දෙනට",
  "සත භිෂ",
  "පුර බඳුරු",
  "උතුරු බඳුරු",
  "රේවති",
];

const NAK_EN: string[] = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const NAK_LORDS: string[] = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
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

const KALA_GUIDANCE: Record<string, { en: string; si: string }> = {
  rahu: {
    en: "Avoid starting new ventures, purchases, or travel during Rahu Kala.",
    si: "රාහු කාලයේදී නව ව්‍යාපාර, මිලදී ගැනීම් හෝ ගමන් ආරම්භ කිරීමෙන් වළකින්න.",
  },
  yama: {
    en: "Yama Kala is traditionally avoided for long-distance travel.",
    si: "යම කාලය දිගු ගමන් සඳහා සම්ප්‍රදායිකව වළක්වා ගනී.",
  },
  gulika: {
    en: "Avoid medical treatments and important health decisions during Gulika Kala.",
    si: "ගුලික කාලයේදී ප්‍රතිකාර සහ වැදගත් සෞඛ්‍ය තීරණ වළක්වා ගන්න.",
  },
};

// ─── Sunrise / sunset ─────────────────────────────────────────
function getSunTimes(
  dateStr: string,
  lat: number,
  lon: number,
): { rise: DateTime; set: DateTime } | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  // search from local midnight; swe_rise_trans works in UT
  const local = DateTime.fromObject(
    { year: y, month: m, day: d },
    { zone: "Asia/Colombo" },
  );
  const jd0 = local.toUTC().toMillis() / 86400000 + 2440587.5;

  const rise = swisseph.swe_rise_trans(
    jd0,
    swisseph.SE_SUN,
    "",
    swisseph.SEFLG_SWIEPH,
    swisseph.SE_CALC_RISE,
    lon,
    lat,
    0,
    0,
    0,
  );
  const set = swisseph.swe_rise_trans(
    jd0,
    swisseph.SE_SUN,
    "",
    swisseph.SEFLG_SWIEPH,
    swisseph.SE_CALC_SET,
    lon,
    lat,
    0,
    0,
    0,
  );
  if (!("transitTime" in rise) || !("transitTime" in set)) return null;
  if (
    typeof rise.transitTime !== "number" ||
    typeof set.transitTime !== "number"
  )
    return null;

  const riseUtc = DateTime.fromMillis(
    (rise.transitTime - 2440587.5) * 86400000,
    { zone: "utc" },
  );
  const setUtc = DateTime.fromMillis((set.transitTime - 2440587.5) * 86400000, {
    zone: "utc",
  });
  return {
    rise: riseUtc.setZone("Asia/Colombo"),
    set: setUtc.setZone("Asia/Colombo"),
  };
}

// ─── Kala period computation ──────────────────────────────────
function kalaPeriod(
  dayNum: number,
  rise: DateTime,
  set: DateTime,
  segment: number,
  kind: "rahu" | "yama" | "gulika",
): KalaPeriod {
  const dayLenMin = set.diff(rise, "minutes").minutes;
  const segMin = dayLenMin / 8;
  const start = rise.plus({ minutes: (segment - 1) * segMin });
  const end = start.plus({ minutes: segMin });
  const fmt = (t: DateTime) => t.toFormat("HH:mm");
  return {
    name:
      kind === "rahu"
        ? "Rahu Kala"
        : kind === "yama"
          ? "Yama Kala"
          : "Gulika Kala",
    nameSi:
      kind === "rahu"
        ? "රාහු කාලය"
        : kind === "yama"
          ? "යම කාලය"
          : "ගුලික කාලය",
    start: fmt(start),
    end: fmt(end),
    segment,
    guidance: KALA_GUIDANCE[kind].en,
    guidanceSi: KALA_GUIDANCE[kind].si,
  };
}

/** Moon's nakshatra at the given JD (simplified — longitude → 13°20′ spans). */
function nakshatraAt(jd: number): number {
  const pos = swisseph.swe_calc_ut(
    jd,
    swisseph.SE_MOON,
    swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SIDEREAL,
  );
  const lon = "longitude" in pos ? (pos.longitude ?? 0) : 0;
  return Math.floor((((lon % 360) + 360) % 360) / (360 / 27));
}

// ─── Main ─────────────────────────────────────────────────────
export function computePanchanga(
  dateStr: string, // YYYY-MM-DD
  lat: number,
  lon: number,
): PanchangaDay | null {
  const times = getSunTimes(dateStr, lat, lon);
  if (!times) return null;

  const dt = DateTime.fromISO(dateStr, { zone: "Asia/Colombo" });
  const dayNum = dt.weekday % 7; // luxon: 1=Mon..7=Sun → 0=Sun..6=Sat

  const rahu = kalaPeriod(
    dayNum,
    times.rise,
    times.set,
    RAHU_SEGMENT[dayNum],
    "rahu",
  );
  const yama = kalaPeriod(
    dayNum,
    times.rise,
    times.set,
    YAMA_SEGMENT[dayNum],
    "yama",
  );
  const gulika = kalaPeriod(
    dayNum,
    times.rise,
    times.set,
    GULIKA_SEGMENT[dayNum],
    "gulika",
  );

  // Day nakshatra at sunrise (Sri Lankan practice reads the star at sunrise).
  const jdSunrise = times.rise.toUTC().toMillis() / 86400000 + 2440587.5;
  const nakIdx = nakshatraAt(jdSunrise);

  // Auspicious windows: two ~48-minute gaps away from any Kala period.
  const bad: { start: DateTime; end: DateTime }[] = [rahu, yama, gulika].map(
    (k) => ({
      start: DateTime.fromFormat(k.start, "HH:mm", { zone: "Asia/Colombo" }),
      end: DateTime.fromFormat(k.end, "HH:mm", { zone: "Asia/Colombo" }),
    }),
  );
  const auspiciousWindows: { start: string; end: string }[] = [];
  // Slice the day into 12 equal parts, pick parts not overlapping a Kala.
  const dayLenMin = times.set.diff(times.rise, "minutes").minutes;
  const sliceMin = dayLenMin / 12;
  for (let i = 0; i < 12; i++) {
    const s = times.rise.plus({ minutes: i * sliceMin });
    const e = times.rise.plus({ minutes: (i + 1) * sliceMin });
    const overlaps = bad.some((b) => s < b.end && e > b.start);
    if (!overlaps) {
      auspiciousWindows.push({
        start: s.toFormat("HH:mm"),
        end: e.toFormat("HH:mm"),
      });
    }
    if (auspiciousWindows.length >= 2) break;
  }

  // Day suitability notes (rule-based, per Sinhala tradition).
  const dayNotes: string[] = [];
  const lordByDay: Record<number, string> = {
    0: "Sun",
    1: "Moon",
    2: "Mars",
    3: "Mercury",
    4: "Jupiter",
    5: "Venus",
    6: "Saturn",
  };
  const noteByLord: Record<string, { en: string; si: string }> = {
    Sun: {
      en: "Irida — good for official work, meetings with authorities, and beginning long-term projects.",
      si: "ඉරිදා — රාජකාරි, බලධාරීන් හමුවීම් සහ දිගුකාලීන ව්‍යාපෘති ආරම්භයට සුදුසුයි.",
    },
    Moon: {
      en: "Sanduda — favourable for family matters, travel, and emotional wellbeing.",
      si: "සඳුදා — පවුල් කටයුතු, ගමන් සහ මානසික සුවයට සුදුසුයි.",
    },
    Mars: {
      en: "Angaharu wada — good for energetic tasks, sports, and conflict resolution; be careful in dealings.",
      si: "අඟහරුවාදා — ජවසම්පන්න කටයුතු, ක්‍රීඩා සහ ගැටුම් නිරාකරණයට සුදුසුයි; කටයුතුවලදී ප්‍රවේශම් වන්න.",
    },
    Mercury: {
      en: "Badada — excellent for education, business, communication, and contracts.",
      si: "බදාදා — අධ්‍යාපනය, ව්‍යාපාර, සන්නිවේදනය සහ ගිවිසුම් සඳහා ඉතා සුදුසුයි.",
    },
    Jupiter: {
      en: "Brahaspatinda — auspicious for religious ceremonies, weddings, and financial decisions.",
      si: "බ්‍රහස්පතින්දා — ආගමික උත්සව, විවාහ සහ මූල්‍ය තීරණ සඳහා ශුභදායීයි.",
    },
    Venus: {
      en: "Sikurada — favourable for romance, artistic work, and new relationships.",
      si: "සිකුරාදා — ප්‍රේමය, කලා කටයුතු සහ නව සබඳතා සඳහා සුදුසුයි.",
    },
    Saturn: {
      en: "Senasurada — suited for disciplined work and completing pending tasks; avoid starting major ventures.",
      si: "සෙනසුරාදා — විනයගරුක වැඩ සහ ප්‍රමාද වූ කටයුතු සඳහා සුදුසුයි; විශාල ව්‍යාපාර ආරම්භයෙන් වළකින්න.",
    },
  };

  return {
    date: dateStr,
    weekDay: WEEKDAYS[dayNum],
    beYear: dt.year + 543,
    sinhalaMonth: SINHALA_MONTHS[dt.month],
    sunrise: times.rise.toFormat("HH:mm"),
    sunset: times.set.toFormat("HH:mm"),
    dayNakshatra: {
      name: NAK_EN[nakIdx],
      nameSi: NAK_SI[nakIdx],
      lord: NAK_LORDS[nakIdx],
    },
    rahuKala: rahu,
    yamaKala: yama,
    gulikaKala: gulika,
    auspiciousWindows,
    dayNotes: [
      noteByLord[lordByDay[dayNum]].en,
      noteByLord[lordByDay[dayNum]].si,
      `Day nakshatra: ${NAK_EN[nakIdx]} (${NAK_SI[nakIdx]}), lord ${NAK_LORDS[nakIdx]}.`,
    ],
  };
}
