/**
 * Nakshatra (lunar mansion) interpretations.
 *
 * Each nakshatra has a deity, symbol, power, and personality traits.
 */
export type NakshatraEntry = {
  index: number; // 0-26
  name: string;
  range: [number, number]; // degrees in zodiac
  lord: string; // planet name
  deity: string;
  symbol: string;
  shakti: string; // divine power
  personality: string;
  career: string;
};

const NAKSHATRAS: NakshatraEntry[] = [
  { index: 0, name: "Ashwini", range: [0, 13.33], lord: "Ketu", deity: "Ashwini Kumaras (divine twin horsemen)", symbol: "Horse's head", shakti: "Ability to heal and bring swiftness", personality: "Quick, healing, pioneering, independent. Fast learners, natural healers.", career: "Medicine, healing, horses, transportation, emergency services." },
  { index: 1, name: "Bharani", range: [13.33, 26.67], lord: "Venus", deity: "Yama (god of death)", symbol: "Yoni (female organ)", shakti: "Power to cleanse and remove obstacles", personality: "Responsible, disciplined, transformative. Bear burdens well, dedicated.", career: "Psychology, death-related work, research, law, finance." },
  { index: 2, name: "Krittika", range: [26.67, 40], lord: "Sun", deity: "Agni (fire god)", symbol: "Razor or flame", shakti: "Power to purify and cut through illusions", personality: "Sharp, determined, courageous, critical. Natural leaders.", career: "Surgery, military, management, cutting-edge technology." },
  { index: 3, name: "Rohini", range: [40, 53.33], lord: "Moon", deity: "Brahma or Prajapati (creator)", symbol: "Chariot or cart", shakti: "Power to create and nurture", personality: "Creative, nurturing, beautiful, artistic. Loves comfort and luxury.", career: "Arts, beauty, farming, entertainment, creative work." },
  { index: 4, name: "Mrigashira", range: [53.33, 66.67], lord: "Mars", deity: "Soma or Chandra (moon god)", symbol: "Deer's head", shakti: "Power to seek and explore", personality: "Curious, searching, restless, gentle. Always exploring.", career: "Research, travel, journalism, exploration, hunting." },
  { index: 5, name: "Ardra", range: [66.67, 80], lord: "Rahu", deity: "Rudra (storm god)", symbol: "Teardrop or diamond", shakti: "Power to bring storms and transformation", personality: "Intense, emotional, transformative. Faces challenges courageously.", career: "Storm chasing, psychology, technology, research, healing." },
  { index: 6, name: "Punarvasu", range: [80, 93.33], lord: "Jupiter", deity: "Aditi (mother of gods)", symbol: "Quiver of arrows", shakti: "Power to return and renew", personality: "Optimistic, philosophical, adaptable. Bounces back from setbacks.", career: "Teaching, counseling, travel, returning to old paths." },
  { index: 7, name: "Pushya", range: [93.33, 106.67], lord: "Saturn", deity: "Brihaspati (Jupiter)", symbol: "Cow's udder or flower", shakti: "Power to nourish and strengthen", personality: "Nurturing, spiritual, disciplined. Excellent caretaker.", career: "Nursing, teaching, spirituality, nourishment, care work." },
  { index: 8, name: "Ashlesha", range: [106.67, 120], lord: "Mercury", deity: "Shesha (serpent king)", symbol: "Coiled serpent", shakti: "Power to wrap and entangle", personality: "Magnetic, mysterious, intense, wise. Deep understanding of human nature.", career: "Psychology, investigation, occult, therapy, counseling." },
  { index: 9, name: "Magha", range: [120, 133.33], lord: "Ketu", deity: "Pitris (ancestors)", symbol: "Royal throne", shakti: "Power to honor and continue lineage", personality: "Proud, noble, authoritative, respectful of tradition.", career: "Leadership, royalty, management, ancestral work." },
  { index: 10, name: "Purva Phalguni", range: [133.33, 146.67], lord: "Venus", deity: "Bhaga (god of marriage/prosperity)", symbol: "Front legs of bed", shakti: "Power of creativity and procreation", personality: "Creative, romantic, social, artistic. Loves pleasure and beauty.", career: "Arts, entertainment, romance, beauty, social work." },
  { index: 11, name: "Uttara Phalguni", range: [146.67, 160], lord: "Sun", deity: "Aryaman (god of patronage)", symbol: "Back legs of bed", shakti: "Power of patronage and friendship", personality: "Generous, friendly, helpful, supportive. Good leader.", career: "Management, social work, hospitality, public service." },
  { index: 12, name: "Hasta", range: [160, 173.33], lord: "Moon", deity: "Savitr (sun god)", symbol: "Hand or fist", shakti: "Power to achieve through hands", personality: "Skillful, clever, dexterous, practical. Excellent with hands.", career: "Crafts, surgery, art, writing, skilled trades." },
  { index: 13, name: "Chitra", range: [173.33, 186.67], lord: "Mars", deity: "Tvashtar (divine architect)", symbol: "Pearl or jewel", shakti: "Power to create beauty", personality: "Artistic, beautiful, creative, perfectionist.", career: "Arts, design, architecture, jewelry, creative work." },
  { index: 14, name: "Swati", range: [186.67, 200], lord: "Rahu", deity: "Vayu (wind god)", symbol: "Coral or sword", shakti: "Power to self-sustain and adapt", personality: "Independent, flexible, adaptable, self-reliant.", career: "Business, entrepreneurship, trade, wind energy." },
  { index: 15, name: "Vishakha", range: [200, 213.33], lord: "Jupiter", deity: "Indra-Agni (gods of power)", symbol: "Gateway or potter's wheel", shakti: "Power to achieve goals", personality: "Determined, focused, ambitious, goal-oriented.", career: "Management, leadership, law, politics, achievement-oriented work." },
  { index: 16, name: "Anuradha", range: [213.33, 226.67], lord: "Saturn", deity: "Mitra (god of friendship)", symbol: "Lotus or staff", shakti: "Power to create harmony", personality: "Loyal, friendly, harmonious, devoted. Good team player.", career: "Diplomacy, counseling, friendship-oriented work, teamwork." },
  { index: 17, name: "Jyeshtha", range: [226.67, 240], lord: "Mercury", deity: "Indra (king of gods)", symbol: "Umbrella or earring", shakti: "Power to protect and lead", personality: "Protective, authoritative, elder-like, responsible.", career: "Leadership, elder care, protection, security, politics." },
  { index: 18, name: "Mula", range: [240, 253.33], lord: "Ketu", deity: "Nirriti (goddess of destruction)", symbol: "Tied roots", shakti: "Power to uproot and destroy", personality: "Deep, investigative, truth-seeking, transformative.", career: "Research, investigation, rooting out corruption, archaeology." },
  { index: 19, name: "Purva Ashadha", range: [253.33, 266.67], lord: "Venus", deity: "Apah (water goddess)", symbol: "Elephant tusk or fan", shakti: "Power to purify and energize", personality: "Victorious, energetic, purifying, determined.", career: "Water management, purification, victory-oriented fields." },
  { index: 20, name: "Uttara Ashadha", range: [266.67, 280], lord: "Sun", deity: "Vishvadevas (universal gods)", symbol: "Elephant tusk", shakti: "Power to achieve universal success", personality: "Determined, successful, universal in outlook, leader.", career: "Universal leadership, management, large-scale projects." },
  { index: 21, name: "Shravana", range: [280, 293.33], lord: "Moon", deity: "Vishnu (preserver)", symbol: "Ear or trident", shakti: "Power to listen and learn", personality: "Good listener, learned, devoted, religious.", career: "Teaching, preaching, music, listening-based work, spirituality." },
  { index: 22, name: "Dhanishta", range: [293.33, 306.67], lord: "Mars", deity: "Eight Vasus (elemental gods)", symbol: "Drum or flute", shakti: "Power to bring prosperity", personality: "Musical, rhythmic, wealthy, generous.", career: "Music, finance, charity, percussion, wealth management." },
  { index: 23, name: "Shatabhisha", range: [306.67, 320], lord: "Rahu", deity: "Varuna (god of cosmic waters)", symbol: "Empty circle or 100 healers", shakti: "Power to heal", personality: "Healing, secretive, mysterious, scientific.", career: "Medicine, research, science, healing arts, investigation." },
  { index: 24, name: "Purva Bhadrapada", range: [320, 333.33], lord: "Jupiter", deity: "Aja Ekapada (one-footed goat)", symbol: "Sword or front of funeral cot", shakti: "Power to burn and purify", personality: "Intense, spiritual, transformative, fiery.", career: "Spirituality, transformation work, funerals, psychology." },
  { index: 25, name: "Uttara Bhadrapada", range: [333.33, 346.67], lord: "Saturn", deity: "Ahir Budhnya (serpent of the deep)", symbol: "Twins or back legs of funeral cot", shakti: "Power to stabilize and ground", personality: "Stable, grounded, wise, patient. Good in crisis.", career: "Stabilization work, crisis management, counseling, psychology." },
  { index: 26, name: "Revati", range: [346.67, 360], lord: "Mercury", deity: "Pushan (nourisher)", symbol: "Fish or drum", shakti: "Power to nourish and protect", personality: "Nurturing, protective, compassionate, gentle.", career: "Nursing, caring, shipping, travel, protection services." },
];

export function getNakshatraByIndex(index: number): NakshatraEntry | null {
  return NAKSHATRAS[index] || null;
}

export function getNakshatraByName(name: string): NakshatraEntry | null {
  return NAKSHATRAS.find(n => n.name.toLowerCase() === name.toLowerCase()) || null;
}

export function getNakshatraByLongitude(longitude: number): NakshatraEntry {
  const norm = ((longitude % 360) + 360) % 360;
  for (const nak of NAKSHATRAS) {
    if (norm >= nak.range[0] && norm < nak.range[1]) return nak;
  }
  return NAKSHATRAS[26]; // Revati (wraps around)
}

export function getAllNakshatras(): NakshatraEntry[] {
  return NAKSHATRAS;
}
