/**
 * Planet-in-sign interpretations (Graha Rashi Phala).
 *
 * Each entry: what a planet means in a specific zodiac sign.
 * Keyed by planetId and signId (0-11).
 */
export type PlanetInSignEntry = {
  planetId: number;
  sign: number; // 0=Aries..11=Pisces
  effect: "exalted" | "moolatrikona" | "own" | "friendly" | "neutral" | "enemy" | "debilitated";
  interpretation: string;
};

const PLANET_IN_SIGN: PlanetInSignEntry[] = [
  // ────────── SUN (0) ──────────
  { planetId: 0, sign: 0, effect: "exalted", interpretation: "Sun is exalted in Aries at 10°. Strong leadership, courage, authority, vitality, and commanding presence." },
  { planetId: 0, sign: 1, effect: "enemy", interpretation: "Sun in Taurus is in enemy sign. Fixed opinions, stubborn, struggles with change." },
  { planetId: 0, sign: 2, effect: "friendly", interpretation: "Sun in Gemini is friendly. Intelligent, communicative, good at multitasking." },
  { planetId: 0, sign: 3, effect: "neutral", interpretation: "Sun in Cancer is neutral. Emotional leadership, protective, nurturing authority." },
  { planetId: 0, sign: 4, effect: "own", interpretation: "Sun in Leo is its own sign. Maximum confidence, creativity, royalty, generosity." },
  { planetId: 0, sign: 5, effect: "enemy", interpretation: "Sun in Virgo is enemy sign. Critical, analytical leadership, health consciousness." },
  { planetId: 0, sign: 6, effect: "neutral", interpretation: "Sun in Libra is neutral. Diplomatic, balanced, fair leadership." },
  { planetId: 0, sign: 7, effect: "friendly", interpretation: "Sun in Scorpio is friendly. Intense, determined, transformational leader." },
  { planetId: 0, sign: 8, effect: "friendly", interpretation: "Sun in Sagittarius is friendly. Optimistic, philosophical, adventurous, inspirational." },
  { planetId: 0, sign: 9, effect: "neutral", interpretation: "Sun in Capricorn is neutral. Disciplined, ambitious, hardworking leader." },
  { planetId: 0, sign: 10, effect: "enemy", interpretation: "Sun in Aquarius is enemy. Unconventional, rebellious, humanitarian leadership." },
  { planetId: 0, sign: 11, effect: "debilitated", interpretation: "Sun is debilitated in Libra at 10°. Weak vitality, lack of confidence, passive nature." },

  // ────────── MOON (1) ──────────
  { planetId: 1, sign: 0, effect: "friendly", interpretation: "Moon in Aries is friendly. Quick emotions, impulsive, enthusiastic." },
  { planetId: 1, sign: 1, effect: "exalted", interpretation: "Moon is exalted in Taurus at 3°. Stable emotions, calm mind, nurturing, comfort-loving." },
  { planetId: 1, sign: 2, effect: "neutral", interpretation: "Moon in Gemini is neutral. Changeable emotions, curious, communicative." },
  { planetId: 1, sign: 3, effect: "own", interpretation: "Moon in Cancer is its own sign. Deep emotions, nurturing, intuitive, psychic, caring." },
  { planetId: 1, sign: 4, effect: "friendly", interpretation: "Moon in Leo is friendly. Dramatic emotions, proud, warm-hearted." },
  { planetId: 1, sign: 5, effect: "neutral", interpretation: "Moon in Virgo is neutral. Analytical emotions, worry-prone, helpful." },
  { planetId: 1, sign: 6, effect: "enemy", interpretation: "Moon in Libra is enemy. Diplomatic emotions, relationship-focused, indecisive." },
  { planetId: 1, sign: 7, effect: "friendly", interpretation: "Moon in Scorpio is friendly. Intense emotions, secretive, transformative." },
  { planetId: 1, sign: 8, effect: "friendly", interpretation: "Moon in Sagittarius is friendly. Optimistic emotions, adventurous, philosophical." },
  { planetId: 1, sign: 9, effect: "neutral", interpretation: "Moon in Capricorn is neutral. Disciplined emotions, reserved, ambitious." },
  { planetId: 1, sign: 10, effect: "neutral", interpretation: "Moon in Aquarius is neutral. Detached emotions, humanitarian, innovative." },
  { planetId: 1, sign: 11, effect: "friendly", interpretation: "Moon in Pisces is friendly. Dreamy emotions, compassionate, artistic." },

  // ────────── MERCURY (2) ──────────
  { planetId: 2, sign: 0, effect: "enemy", interpretation: "Mercury in Aries is enemy. Quick thinker, impulsive decisions, argumentative." },
  { planetId: 2, sign: 1, effect: "friendly", interpretation: "Mercury in Taurus is friendly. Practical thinking, methodical, patient learner." },
  { planetId: 2, sign: 2, effect: "own", interpretation: "Mercury in Gemini is its own sign. Brilliant mind, excellent communication, versatile." },
  { planetId: 2, sign: 3, effect: "friendly", interpretation: "Mercury in Cancer is friendly. Intuitive thinking, memory, emotional communication." },
  { planetId: 2, sign: 4, effect: "neutral", interpretation: "Mercury in Leo is neutral. Creative communication, confident expression." },
  { planetId: 2, sign: 5, effect: "exalted", interpretation: "Mercury is exalted in Virgo at 15°. Sharp mind, analytical brilliance, detail-oriented." },
  { planetId: 2, sign: 6, effect: "neutral", interpretation: "Mercury in Libra is neutral. Balanced thinking, diplomatic communication." },
  { planetId: 2, sign: 7, effect: "friendly", interpretation: "Mercury in Scorpio is friendly. Deep thinker, investigative, penetrating mind." },
  { planetId: 2, sign: 8, effect: "friendly", interpretation: "Mercury in Sagittarius is friendly. Philosophical mind, big-picture thinking." },
  { planetId: 2, sign: 9, effect: "neutral", interpretation: "Mercury in Capricorn is neutral. Disciplined thinking, practical, strategic." },
  { planetId: 2, sign: 10, effect: "friendly", interpretation: "Mercury in Aquarius is friendly. Innovative thinking, unconventional ideas." },
  { planetId: 2, sign: 11, effect: "debilitated", interpretation: "Mercury is debilitated in Pisces at 15°. Dreamy thinking, lacks focus, intuitive." },

  // ────────── VENUS (3) ──────────
  { planetId: 3, sign: 0, effect: "enemy", interpretation: "Venus in Aries is enemy. Impulsive in love, passionate but short-lived." },
  { planetId: 3, sign: 1, effect: "own", interpretation: "Venus in Taurus is its own sign. Sensual, artistic, loyal in love." },
  { planetId: 3, sign: 2, effect: "neutral", interpretation: "Venus in Gemini is neutral. Flirtatious, intellectual love, communicative." },
  { planetId: 3, sign: 3, effect: "friendly", interpretation: "Venus in Cancer is friendly. Nurturing love, emotional bonding, family-oriented." },
  { planetId: 3, sign: 4, effect: "friendly", interpretation: "Venus in Leo is friendly. Romantic, passionate, generous lover." },
  { planetId: 3, sign: 5, effect: "debilitated", interpretation: "Venus is debilitated in Virgo at 27°. Critical in love, practical relationships." },
  { planetId: 3, sign: 6, effect: "own", interpretation: "Venus in Libra is its own sign. Harmonious, diplomatic, beauty-loving." },
  { planetId: 3, sign: 7, effect: "neutral", interpretation: "Venus in Scorpio is neutral. Intense passion, transformative love." },
  { planetId: 3, sign: 8, effect: "friendly", interpretation: "Venus in Sagittarius is friendly. Adventurous love, optimistic." },
  { planetId: 3, sign: 9, effect: "neutral", interpretation: "Venus in Capricorn is neutral. Disciplined love, practical romance." },
  { planetId: 3, sign: 10, effect: "enemy", interpretation: "Venus in Aquarius is enemy. Unconventional love, detached romance." },
  { planetId: 3, sign: 11, effect: "exalted", interpretation: "Venus is exalted in Pisces at 27°. Divine love, artistic genius, compassionate." },

  // ────────── MARS (4) ──────────
  { planetId: 4, sign: 0, effect: "own", interpretation: "Mars in Aries is its own sign. Maximum courage, initiative, warrior spirit." },
  { planetId: 4, sign: 1, effect: "neutral", interpretation: "Mars in Taurus is neutral. Determined, stubborn, steady in action." },
  { planetId: 4, sign: 2, effect: "enemy", interpretation: "Mars in Gemini is enemy. Argumentative, mental aggression." },
  { planetId: 4, sign: 3, effect: "debilitated", interpretation: "Mars is debilitated in Cancer at 28°. Passive aggression, sensitive ego." },
  { planetId: 4, sign: 4, effect: "friendly", interpretation: "Mars in Leo is friendly. Confident courage, proud warrior." },
  { planetId: 4, sign: 5, effect: "neutral", interpretation: "Mars in Virgo is neutral. Strategic action, detail-oriented." },
  { planetId: 4, sign: 6, effect: "friendly", interpretation: "Mars in Libra is friendly. Balanced action, fair fighter." },
  { planetId: 4, sign: 7, effect: "own", interpretation: "Mars in Scorpio is its own sign. Intense power, strategic warrior." },
  { planetId: 4, sign: 8, effect: "friendly", interpretation: "Mars in Sagittarius is friendly. Adventurous action, enthusiastic." },
  { planetId: 4, sign: 9, effect: "exalted", interpretation: "Mars is exalted in Capricorn at 28°. Disciplined power, strategic leader." },
  { planetId: 4, sign: 10, effect: "enemy", interpretation: "Mars in Aquarius is enemy. Unconventional action, rebellious." },
  { planetId: 4, sign: 11, effect: "friendly", interpretation: "Mars in Pisces is friendly. Compassionate action, spiritual warrior." },

  // ────────── JUPITER (5) ──────────
  { planetId: 5, sign: 0, effect: "neutral", interpretation: "Jupiter in Aries is neutral. Bold wisdom, pioneering spirit." },
  { planetId: 5, sign: 1, effect: "friendly", interpretation: "Jupiter in Taurus is friendly. Practical wisdom, steady growth." },
  { planetId: 5, sign: 2, effect: "neutral", interpretation: "Jupiter in Gemini is neutral. Intellectual wisdom, teaching." },
  { planetId: 5, sign: 3, effect: "exalted", interpretation: "Jupiter is exalted in Cancer at 5°. Supreme wisdom, nurturing, divine knowledge." },
  { planetId: 5, sign: 4, effect: "friendly", interpretation: "Jupiter in Leo is friendly. Generous wisdom, leadership." },
  { planetId: 5, sign: 5, effect: "neutral", interpretation: "Jupiter in Virgo is neutral. Analytical wisdom, service." },
  { planetId: 5, sign: 6, effect: "neutral", interpretation: "Jupiter in Libra is neutral. Balanced wisdom, justice." },
  { planetId: 5, sign: 7, effect: "friendly", interpretation: "Jupiter in Scorpio is friendly. Deep wisdom, transformative." },
  { planetId: 5, sign: 8, effect: "own", interpretation: "Jupiter in Sagittarius is its own sign. Supreme wisdom, philosopher, guru." },
  { planetId: 5, sign: 9, effect: "debilitated", interpretation: "Jupiter is debilitated in Capricorn at 5°. Restricted wisdom, material focus." },
  { planetId: 5, sign: 10, effect: "neutral", interpretation: "Jupiter in Aquarius is neutral. Humanitarian wisdom, innovative." },
  { planetId: 5, sign: 11, effect: "own", interpretation: "Jupiter in Pisces is its own sign. Divine wisdom, spiritual genius." },

  // ────────── SATURN (6) ──────────
  { planetId: 6, sign: 0, effect: "neutral", interpretation: "Saturn in Aries is neutral. Disciplined courage, slow initiative." },
  { planetId: 6, sign: 1, effect: "enemy", interpretation: "Saturn in Taurus is enemy. Stubborn, slow but steady." },
  { planetId: 6, sign: 2, effect: "neutral", interpretation: "Saturn in Gemini is neutral. Disciplined thinking, serious communication." },
  { planetId: 6, sign: 3, effect: "friendly", interpretation: "Saturn in Cancer is friendly. Protective discipline, emotional boundaries." },
  { planetId: 6, sign: 4, effect: "enemy", interpretation: "Saturn in Leo is enemy. Authoritative, struggles with ego." },
  { planetId: 6, sign: 5, effect: "neutral", interpretation: "Saturn in Virgo is neutral. Service discipline, practical." },
  { planetId: 6, sign: 6, effect: "debilitated", interpretation: "Saturn is debilitated in Aries at 20°. Weak discipline, lack of direction." },
  { planetId: 6, sign: 7, effect: "exalted", interpretation: "Saturn is exalted in Libra at 20°. Just discipline, balanced authority." },
  { planetId: 6, sign: 8, effect: "friendly", interpretation: "Saturn in Scorpio is friendly. Intense discipline, deep transformation." },
  { planetId: 6, sign: 9, effect: "own", interpretation: "Saturn in Capricorn is its own sign. Maximum discipline, ambition, authority." },
  { planetId: 6, sign: 10, effect: "own", interpretation: "Saturn in Aquarius is its own sign. Humanitarian discipline, innovation." },
  { planetId: 6, sign: 11, effect: "friendly", interpretation: "Saturn in Pisces is friendly. Spiritual discipline, compassionate." },

  // ────────── RAHU (10) ──────────
  { planetId: 10, sign: 0, effect: "neutral", interpretation: "Rahu in Aries. Bold, pioneering, impulsive ambition. Foreign connections." },
  { planetId: 10, sign: 1, effect: "neutral", interpretation: "Rahu in Taurus. Obsessive about wealth, comfort, and stability." },
  { planetId: 10, sign: 2, effect: "neutral", interpretation: "Rahu in Gemini. Cunning communication, intellectual ambition." },
  { planetId: 10, sign: 3, effect: "neutral", interpretation: "Rahu in Cancer. Emotional manipulation, attachment to home." },
  { planetId: 10, sign: 4, effect: "neutral", interpretation: "Rahu in Leo. Obsessive about power, fame, and recognition." },
  { planetId: 10, sign: 5, effect: "neutral", interpretation: "Rahu in Virgo. Obsessive about health, analysis, and service." },
  { planetId: 10, sign: 6, effect: "neutral", interpretation: "Rahu in Libra. Obsessive about relationships and balance." },
  { planetId: 10, sign: 7, effect: "neutral", interpretation: "Rahu in Scorpio. Intense, secretive, occult interests." },
  { planetId: 10, sign: 8, effect: "neutral", interpretation: "Rahu in Sagittarius. Obsessive about philosophy, religion." },
  { planetId: 10, sign: 9, effect: "neutral", interpretation: "Rahu in Capricorn. Ambitious, disciplined, strategic." },
  { planetId: 10, sign: 10, effect: "neutral", interpretation: "Rahu in Aquarius. Unconventional, innovative, humanitarian." },
  { planetId: 10, sign: 11, effect: "neutral", interpretation: "Rahu in Pisces. Spiritual obsession, escapism, artistic." },

  // ────────── KETU (11) ──────────
  { planetId: 11, sign: 0, effect: "neutral", interpretation: "Ketu in Aries. Spiritual warrior, detachment through courage." },
  { planetId: 11, sign: 1, effect: "neutral", interpretation: "Ketu in Taurus. Detachment from materialism, spiritual growth." },
  { planetId: 11, sign: 2, effect: "neutral", interpretation: "Ketu in Gemini. Detached intellect, spiritual research." },
  { planetId: 11, sign: 3, effect: "neutral", interpretation: "Ketu in Cancer. Detachment from family, spiritual nurturing." },
  { planetId: 11, sign: 4, effect: "neutral", interpretation: "Ketu in Leo. Detachment from ego, spiritual leadership." },
  { planetId: 11, sign: 5, effect: "neutral", interpretation: "Ketu in Virgo. Detachment from health, spiritual service." },
  { planetId: 11, sign: 6, effect: "neutral", interpretation: "Ketu in Libra. Detachment from relationships." },
  { planetId: 11, sign: 7, effect: "neutral", interpretation: "Ketu in Scorpio. Deep spirituality, mystical detachment." },
  { planetId: 11, sign: 8, effect: "neutral", interpretation: "Ketu in Sagittarius. Detachment from religion, spiritual philosophy." },
  { planetId: 11, sign: 9, effect: "neutral", interpretation: "Ketu in Capricorn. Detachment through discipline." },
  { planetId: 11, sign: 10, effect: "neutral", interpretation: "Ketu in Aquarius. Detached, humanitarian, unconventional." },
  { planetId: 11, sign: 11, effect: "neutral", interpretation: "Ketu in Pisces. Spiritual genius, enlightenment, detachment." },
];

export function getPlanetInSignInterpretation(planetId: number, sign: number): PlanetInSignEntry | null {
  return PLANET_IN_SIGN.find(e => e.planetId === planetId && e.sign === sign) || null;
}
