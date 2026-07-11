/**
 * House lord placement interpretations (Bhavaphaladhyaya).
 *
 * Each entry: what it means when the lord of house A is placed in house B.
 * Keyed by [lordOfHouse, placedInHouse] — both 1-12.
 */
export type HouseLordEntry = {
  lordOfHouse: number; // 1-12
  placedInHouse: number; // 1-12
  interpretation: string;
};

const HOUSE_LORDS: HouseLordEntry[] = [
  // ────────── LORD OF 1ST HOUSE (LAGNA LORD) ──────────
  { lordOfHouse: 1, placedInHouse: 1, interpretation: "Strong self-awareness, good health, confident personality. Lagna lord in its own house gives physical strength and presence." },
  { lordOfHouse: 1, placedInHouse: 2, interpretation: "Wealthy, well-spoken. Earnings support identity. Good family background." },
  { lordOfHouse: 1, placedInHouse: 3, interpretation: "Courageous, independent, good with siblings. Initiative and communication skills." },
  { lordOfHouse: 1, placedInHouse: 4, interpretation: "Educated, comfortable home, vehicle owner. Happiness from mother and property." },
  { lordOfHouse: 1, placedInHouse: 5, interpretation: "Intelligent, creative, good with children. Speculative gains. Dharmic." },
  { lordOfHouse: 1, placedInHouse: 6, interpretation: "Health challenges, enemies. Overcomes through effort. Service-oriented." },
  { lordOfHouse: 1, placedInHouse: 7, interpretation: "Marriage partner reflects your personality. Public relationships." },
  { lordOfHouse: 1, placedInHouse: 8, interpretation: "Challenging health, longevity struggles. Interest in occult. Transformative life." },
  { lordOfHouse: 1, placedInHouse: 9, interpretation: "Fortunate, spiritual, philosophical. Good relationship with father/guru." },
  { lordOfHouse: 1, placedInHouse: 10, interpretation: "Career-focused, ambitious, public recognition. Identity tied to profession." },
  { lordOfHouse: 1, placedInHouse: 11, interpretation: "Income through personal efforts. Many friends. Desires fulfilled." },
  { lordOfHouse: 1, placedInHouse: 12, interpretation: "Spending on self, foreign travel. Hospitalization possible. Spiritual inclination." },

  // ────────── LORD OF 2ND HOUSE ──────────
  { lordOfHouse: 2, placedInHouse: 1, interpretation: "Wealthy, good speech, attractive personality. Earnings come early in life." },
  { lordOfHouse: 2, placedInHouse: 2, interpretation: "Very wealthy, family prosperity. Excellent speech, strong family values." },
  { lordOfHouse: 2, placedInHouse: 3, interpretation: "Wealth through communication, writing, skills. Good relationship with siblings." },
  { lordOfHouse: 2, placedInHouse: 4, interpretation: "Family wealth, property, vehicles. Comfortable domestic life." },
  { lordOfHouse: 2, placedInHouse: 5, interpretation: "Wealth through creativity, speculation. Good education. Intelligent." },
  { lordOfHouse: 2, placedInHouse: 6, interpretation: "Wealth through service, healthcare. Debts challenge family finances." },
  { lordOfHouse: 2, placedInHouse: 7, interpretation: "Partner brings wealth. Business partnerships profitable." },
  { lordOfHouse: 2, placedInHouse: 8, interpretation: "Sudden gains, inheritance. Family secrets. Wealth through hidden sources." },
  { lordOfHouse: 2, placedInHouse: 9, interpretation: "Wealth through luck, father's support. Fortunate family." },
  { lordOfHouse: 2, placedInHouse: 10, interpretation: "Career brings wealth. Professional success leads to financial stability." },
  { lordOfHouse: 2, placedInHouse: 11, interpretation: "Multiple income sources. Wealthy friends. Gains through network." },
  { lordOfHouse: 2, placedInHouse: 12, interpretation: "Spending on family, foreign expenses. Wealth flows outward." },

  // ────────── LORD OF 3RD HOUSE ──────────
  { lordOfHouse: 3, placedInHouse: 1, interpretation: "Courageous, independent, good communicator. Strong personal initiatives." },
  { lordOfHouse: 3, placedInHouse: 2, interpretation: "Income through writing, speaking. Good relationship with siblings." },
  { lordOfHouse: 3, placedInHouse: 3, interpretation: "Very courageous, skilled communicator. Strong siblings. Adventurous." },
  { lordOfHouse: 3, placedInHouse: 4, interpretation: "Property through siblings. Education supportive. Home-based communication work." },
  { lordOfHouse: 3, placedInHouse: 5, interpretation: "Creative writing, intelligent. Good with children. Speculation through skills." },
  { lordOfHouse: 3, placedInHouse: 6, interpretation: "Victory through communication. Overcome enemies with speech." },
  { lordOfHouse: 3, placedInHouse: 7, interpretation: "Marriage through communication. Partnership with communicative person." },
  { lordOfHouse: 3, placedInHouse: 8, interpretation: "Secret communication, research writing. Siblings may have challenges." },
  { lordOfHouse: 3, placedInHouse: 9, interpretation: "Higher education in communication. Writing/philosophy. Fortunate siblings." },
  { lordOfHouse: 3, placedInHouse: 10, interpretation: "Career in communication, media, writing. Professional success through skills." },
  { lordOfHouse: 3, placedInHouse: 11, interpretation: "Income through writing, communication. Friends in media." },
  { lordOfHouse: 3, placedInHouse: 12, interpretation: "Foreign communication, spiritual writing. Expenses on siblings." },

  // ────────── LORD OF 4TH HOUSE ──────────
  { lordOfHouse: 4, placedInHouse: 1, interpretation: "Educated, comfortable, property owner. Happy home life." },
  { lordOfHouse: 4, placedInHouse: 2, interpretation: "Family wealth, property income. Comfortable family." },
  { lordOfHouse: 4, placedInHouse: 3, interpretation: "Property through siblings. Happy from communication with mother." },
  { lordOfHouse: 4, placedInHouse: 4, interpretation: "Maximum domestic happiness, vehicles, property, education. Excellent mother relationship." },
  { lordOfHouse: 4, placedInHouse: 5, interpretation: "Education in creative fields. Property from speculative gains. Happy children." },
  { lordOfHouse: 4, placedInHouse: 6, interpretation: "Property disputes, challenges with mother. Service in domestic life." },
  { lordOfHouse: 4, placedInHouse: 7, interpretation: "Spouse from similar background. Happy married life in good home." },
  { lordOfHouse: 4, placedInHouse: 8, interpretation: "Property loss, mother's health challenges. Hidden domestic issues." },
  { lordOfHouse: 4, placedInHouse: 9, interpretation: "Fortunate home, educated mother. Property through luck." },
  { lordOfHouse: 4, placedInHouse: 10, interpretation: "Career in real estate, education. Professional success through domestic support." },
  { lordOfHouse: 4, placedInHouse: 11, interpretation: "Multiple properties, income from real estate. Happy domestic circle." },
  { lordOfHouse: 4, placedInHouse: 12, interpretation: "Foreign property, mother may be abroad. Spending on home." },

  // ────────── LORD OF 5TH HOUSE ──────────
  { lordOfHouse: 5, placedInHouse: 1, interpretation: "Intelligent, creative, good with children. Dharmic nature. Speculative gains." },
  { lordOfHouse: 5, placedInHouse: 2, interpretation: "Wealth through creativity, speculation. Intelligent family." },
  { lordOfHouse: 5, placedInHouse: 3, interpretation: "Creative communication. Intelligent siblings. Skillful." },
  { lordOfHouse: 5, placedInHouse: 4, interpretation: "Educated, creative home. Happy from children and education." },
  { lordOfHouse: 5, placedInHouse: 5, interpretation: "Maximum creativity, intelligence, prosperity through children. Strong dharma." },
  { lordOfHouse: 5, placedInHouse: 6, interpretation: "Speculative losses. Challenges with children's health. Service through teaching." },
  { lordOfHouse: 5, placedInHouse: 7, interpretation: "Romantic marriage, speculative business partnerships. Children bless marriage." },
  { lordOfHouse: 5, placedInHouse: 8, interpretation: "Challenges with children. Interest in occult. Speculative losses." },
  { lordOfHouse: 5, placedInHouse: 9, interpretation: "Higher education, spiritual wisdom. Fortunate children." },
  { lordOfHouse: 5, placedInHouse: 10, interpretation: "Creative career, teaching profession. Fame through intelligence." },
  { lordOfHouse: 5, placedInHouse: 11, interpretation: "Income through creativity. Gains from children. Fulfilled wishes." },
  { lordOfHouse: 5, placedInHouse: 12, interpretation: "Spending on children's education. Foreign creativity. Spiritual inclination." },

  // ────────── LORD OF 6TH HOUSE ──────────
  { lordOfHouse: 6, placedInHouse: 1, interpretation: "Health challenges, enemies. Competitive nature. Overcomes obstacles." },
  { lordOfHouse: 6, placedInHouse: 2, interpretation: "Debts in family. Oral health issues. Arguments over money." },
  { lordOfHouse: 6, placedInHouse: 3, interpretation: "Victory through effort. Conflicts with siblings overcome." },
  { lordOfHouse: 6, placedInHouse: 4, interpretation: "Property disputes, mother's health. Service in domestic life." },
  { lordOfHouse: 6, placedInHouse: 5, interpretation: "Speculative losses. Challenges with children. Service through teaching." },
  { lordOfHouse: 6, placedInHouse: 6, interpretation: "Excellent health, victory over enemies. Best for 6th lord. Strong service orientation." },
  { lordOfHouse: 6, placedInHouse: 7, interpretation: "Spouse may have health issues. Conflicts in marriage." },
  { lordOfHouse: 6, placedInHouse: 8, interpretation: "Chronic health but long life. Hidden enemies." },
  { lordOfHouse: 6, placedInHouse: 9, interpretation: "Fortunate in overcoming obstacles. Father may have health issues." },
  { lordOfHouse: 6, placedInHouse: 10, interpretation: "Career in healthcare, law, service. Professional success through competition." },
  { lordOfHouse: 6, placedInHouse: 11, interpretation: "Victory over enemies, good health. Income through service." },
  { lordOfHouse: 6, placedInHouse: 12, interpretation: "Hospitalization, institutional service. Enemies cause expenses." },

  // ────────── LORD OF 7TH HOUSE ──────────
  { lordOfHouse: 7, placedInHouse: 1, interpretation: "Marriage shapes identity. Attractive personality. Public relationships." },
  { lordOfHouse: 7, placedInHouse: 2, interpretation: "Wealth through marriage, partner brings prosperity." },
  { lordOfHouse: 7, placedInHouse: 3, interpretation: "Communication with spouse. Marriage to someone from local area." },
  { lordOfHouse: 7, placedInHouse: 4, interpretation: "Domestic happiness, property through spouse. Happy married home." },
  { lordOfHouse: 7, placedInHouse: 5, interpretation: "Romantic marriage, children through marriage. Creative partnerships." },
  { lordOfHouse: 7, placedInHouse: 6, interpretation: "Spouse may have health issues. Service through marriage." },
  { lordOfHouse: 7, placedInHouse: 7, interpretation: "Strong marriage, good partnership. Business success through partnership." },
  { lordOfHouse: 7, placedInHouse: 8, interpretation: "Marital challenges, spouse's health. Hidden issues in marriage." },
  { lordOfHouse: 7, placedInHouse: 9, interpretation: "Fortunate marriage, spouse from good family. Dharma partner." },
  { lordOfHouse: 7, placedInHouse: 10, interpretation: "Marriage to career-oriented person. Public partnership." },
  { lordOfHouse: 7, placedInHouse: 11, interpretation: "Income through spouse, partner helpful. Friends through marriage." },
  { lordOfHouse: 7, placedInHouse: 12, interpretation: "Foreign spouse, marriage expenses. Spiritual partnership." },

  // ────────── LORD OF 8TH HOUSE ──────────
  { lordOfHouse: 8, placedInHouse: 1, interpretation: "Intense personality, transformative life. Longevity challenges overcome." },
  { lordOfHouse: 8, placedInHouse: 2, interpretation: "Sudden wealth, inheritance. Family secrets." },
  { lordOfHouse: 8, placedInHouse: 3, interpretation: "Courage through challenges. Investigation skills." },
  { lordOfHouse: 8, placedInHouse: 4, interpretation: "Property through inheritance. Mother's health challenges." },
  { lordOfHouse: 8, placedInHouse: 5, interpretation: "Occult intelligence. Challenges with children transformed." },
  { lordOfHouse: 8, placedInHouse: 6, interpretation: "Victory over hidden enemies. Healing ability." },
  { lordOfHouse: 8, placedInHouse: 7, interpretation: "Intense marriage, transformative partnership." },
  { lordOfHouse: 8, placedInHouse: 8, interpretation: "Long life, deep occult knowledge. Maximum transformation." },
  { lordOfHouse: 8, placedInHouse: 9, interpretation: "Spiritual wisdom through challenges. Fortunate in occult." },
  { lordOfHouse: 8, placedInHouse: 10, interpretation: "Career in investigation, research. Transformative profession." },
  { lordOfHouse: 8, placedInHouse: 11, interpretation: "Sudden gains, inheritance. Friends from research." },
  { lordOfHouse: 8, placedInHouse: 12, interpretation: "Expenses in foreign lands. Hospitalization." },

  // ────────── LORD OF 9TH HOUSE ──────────
  { lordOfHouse: 9, placedInHouse: 1, interpretation: "Fortunate, spiritual, philosophical. Wisdom evident in personality." },
  { lordOfHouse: 9, placedInHouse: 2, interpretation: "Wealth through luck, family fortune. Religious family." },
  { lordOfHouse: 9, placedInHouse: 3, interpretation: "Fortunate siblings, philosophical communication." },
  { lordOfHouse: 9, placedInHouse: 4, interpretation: "Fortunate home, educated mother. Property through luck." },
  { lordOfHouse: 9, placedInHouse: 5, interpretation: "Spiritual creativity, dharma. Fortunate children." },
  { lordOfHouse: 9, placedInHouse: 6, interpretation: "Overcome challenges through faith. Father supports health." },
  { lordOfHouse: 9, placedInHouse: 7, interpretation: "Fortunate marriage, partner from good background." },
  { lordOfHouse: 9, placedInHouse: 8, interpretation: "Spiritual transformation. Occult wisdom." },
  { lordOfHouse: 9, placedInHouse: 9, interpretation: "Maximum fortune, deep spirituality, wisdom. Best for 9th lord." },
  { lordOfHouse: 9, placedInHouse: 10, interpretation: "Career in teaching, religion, law. Fortunate profession." },
  { lordOfHouse: 9, placedInHouse: 11, interpretation: "Fulfilled wishes, fortunate gains." },
  { lordOfHouse: 9, placedInHouse: 12, interpretation: "Spiritual spending, foreign wisdom. Philanthropy." },

  // ────────── LORD OF 10TH HOUSE ──────────
  { lordOfHouse: 10, placedInHouse: 1, interpretation: "Career-focused, ambitious, public recognition. Identity tied to work." },
  { lordOfHouse: 10, placedInHouse: 2, interpretation: "Income from profession. Wealth through career." },
  { lordOfHouse: 10, placedInHouse: 3, interpretation: "Career in communication, skilled work. Professional initiatives." },
  { lordOfHouse: 10, placedInHouse: 4, interpretation: "Career in real estate, education. Work from home." },
  { lordOfHouse: 10, placedInHouse: 5, interpretation: "Career in teaching, creative arts. Professional through intelligence." },
  { lordOfHouse: 10, placedInHouse: 6, interpretation: "Career in service, healthcare, law." },
  { lordOfHouse: 10, placedInHouse: 7, interpretation: "Career through partnerships. Public-facing profession." },
  { lordOfHouse: 10, placedInHouse: 8, interpretation: "Career changes, investigative profession. Research." },
  { lordOfHouse: 10, placedInHouse: 9, interpretation: "Career in teaching, religion, publishing. Fortunate profession." },
  { lordOfHouse: 10, placedInHouse: 10, interpretation: "Maximum career success, fame, authority. Best for 10th lord." },
  { lordOfHouse: 10, placedInHouse: 11, interpretation: "Income growth through career. Professional network." },
  { lordOfHouse: 10, placedInHouse: 12, interpretation: "Career abroad, foreign work. Expenses on profession." },

  // ────────── LORD OF 11TH HOUSE ──────────
  { lordOfHouse: 11, placedInHouse: 1, interpretation: "Fulfilled desires, helpful friends. Social success." },
  { lordOfHouse: 11, placedInHouse: 2, interpretation: "Multiple income streams, wealthy friends." },
  { lordOfHouse: 11, placedInHouse: 3, interpretation: "Friends among siblings, income through skills." },
  { lordOfHouse: 11, placedInHouse: 4, interpretation: "Property gains, happy social circle at home." },
  { lordOfHouse: 11, placedInHouse: 5, interpretation: "Creative gains, income through children." },
  { lordOfHouse: 11, placedInHouse: 6, interpretation: "Income through service, victory over enemies." },
  { lordOfHouse: 11, placedInHouse: 7, interpretation: "Spouse brings income, gains through partnerships." },
  { lordOfHouse: 11, placedInHouse: 8, interpretation: "Sudden gains, inheritance. Hidden income." },
  { lordOfHouse: 11, placedInHouse: 9, interpretation: "Fortunate gains, wealthy father." },
  { lordOfHouse: 11, placedInHouse: 10, interpretation: "Career brings income, professional gains." },
  { lordOfHouse: 11, placedInHouse: 11, interpretation: "Maximum gains, many friends, fulfilled desires. Best for 11th lord." },
  { lordOfHouse: 11, placedInHouse: 12, interpretation: "Expenses on friends, foreign income." },

  // ────────── LORD OF 12TH HOUSE ──────────
  { lordOfHouse: 12, placedInHouse: 1, interpretation: "Spending nature, foreign connections. Spiritual personality." },
  { lordOfHouse: 12, placedInHouse: 2, interpretation: "Spending on family, foreign income. Philanthropic." },
  { lordOfHouse: 12, placedInHouse: 3, interpretation: "Expenses on communication, foreign siblings." },
  { lordOfHouse: 12, placedInHouse: 4, interpretation: "Spending on home, foreign property. Mother's expenses." },
  { lordOfHouse: 12, placedInHouse: 5, interpretation: "Spending on children's education, foreign creativity." },
  { lordOfHouse: 12, placedInHouse: 6, interpretation: "Hospital expenses, service in foreign lands." },
  { lordOfHouse: 12, placedInHouse: 7, interpretation: "Foreign spouse, expenses on marriage." },
  { lordOfHouse: 12, placedInHouse: 8, interpretation: "Spiritual liberation, foreign transformation." },
  { lordOfHouse: 12, placedInHouse: 9, interpretation: "Foreign spirituality, spending on philosophy." },
  { lordOfHouse: 12, placedInHouse: 10, interpretation: "Career abroad, expenses on profession." },
  { lordOfHouse: 12, placedInHouse: 11, interpretation: "Foreign income, expenses balanced by gains." },
  { lordOfHouse: 12, placedInHouse: 12, interpretation: "Maximum spiritual liberation, foreign settlement. Philanthropy." },
];

export function getHouseLordInterpretation(lordOfHouse: number, placedInHouse: number): HouseLordEntry | null {
  return HOUSE_LORDS.find(e => e.lordOfHouse === lordOfHouse && e.placedInHouse === placedInHouse) || null;
}
