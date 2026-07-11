/**
 * Vedic remedies for planetary afflictions.
 */
export type RemedyEntry = {
  planetId: number;
  condition: "weak" | "afflicted" | "debilitated" | "retrograde" | "general";
  gem: string | null;
  mantra: string;
  color: string;
  day: string;
  action: string;
  food: string;
};

const REMEDIES: RemedyEntry[] = [
  { planetId: 0, condition: "general", gem: "Ruby", mantra: "Om Hram Hreem Hraum Sah Suryaya Namah", color: "Red/Gold", day: "Sunday", action: "Donate wheat or jaggery. Offer water to the sun at sunrise.", food: "Wheat, red foods" },
  { planetId: 0, condition: "weak", gem: "Ruby", mantra: "Om Hram Hreem Hraum Sah Suryaya Namah (108 times at sunrise)", color: "Red", day: "Sunday", action: "Fast on Sundays. Serve fathers/elders.", food: "Avoid salt on Sundays" },
  { planetId: 0, condition: "debilitated", gem: "Ruby with copper", mantra: "Om Suryaaya Namah (x1000)", color: "Gold", day: "Sunday", action: "Donate red cloth to temples. Feed crows.", food: "Red lentils, jaggery" },

  { planetId: 1, condition: "general", gem: "Pearl", mantra: "Om Som Somaya Namah", color: "White/Silver", day: "Monday", action: "Donate rice or milk. Serve mothers.", food: "Rice, milk, white foods" },
  { planetId: 1, condition: "weak", gem: "Pearl", mantra: "Om Chandraya Namah (x108)", color: "White", day: "Monday", action: "Fast on Mondays. Offer milk to Shiva.", food: "White rice, dairy" },
  { planetId: 1, condition: "afflicted", gem: "Moonstone", mantra: "Om Shri Ramaya Namah", color: "Silver", day: "Monday", action: "Donate white cloth. Serve women.", food: "Cooling foods, avoid spicy" },

  { planetId: 2, condition: "general", gem: "Emerald", mantra: "Om Budhaya Namah", color: "Green", day: "Wednesday", action: "Donate green vegetables. Serve children.", food: "Green vegetables, milk" },
  { planetId: 2, condition: "weak", gem: "Emerald", mantra: "Om Bram Breem Broom Sah Budhaya Namah (x108)", color: "Green", day: "Wednesday", action: "Fast on Wednesdays. Donate books.", food: "Green grams, spinach" },

  { planetId: 3, condition: "general", gem: "Diamond", mantra: "Om Shukraya Namah", color: "White/Pink", day: "Friday", action: "Donate white cloth or perfume. Serve women.", food: "White foods, sweets" },
  { planetId: 3, condition: "weak", gem: "White Zircon", mantra: "Om Draam Dreem Droum Sah Shukraya Namah", color: "White", day: "Friday", action: "Fast on Fridays. Donate cow's milk.", food: "Dairy, sweets, avoid oily" },
  { planetId: 3, condition: "debilitated", gem: "Diamond in silver", mantra: "Om Shukra devaya Namah (x108)", color: "White", day: "Friday", action: "Donate white flowers. Charitable work for women.", food: "Pure vegetarian diet" },

  { planetId: 4, condition: "general", gem: "Red Coral", mantra: "Om Mangalaya Namah", color: "Red", day: "Tuesday", action: "Donate red lentils. Serve brothers.", food: "Red lentils, wheat" },
  { planetId: 4, condition: "weak", gem: "Red Coral", mantra: "Om Kram Kreem Kroom Sah Bhaumaya Namah", color: "Red", day: "Tuesday", action: "Fast on Tuesdays. Donate red cloth.", food: "Avoid meat, spicy food" },
  { planetId: 4, condition: "debilitated", gem: "Red Coral in copper", mantra: "Maha Mrityunjaya mantra (x108)", color: "Red", day: "Tuesday", action: "Feed Hanuman temples. Donate in Mars temples.", food: "Red rice, pomegranate" },

  { planetId: 5, condition: "general", gem: "Yellow Sapphire", mantra: "Om Gurave Namah", color: "Yellow", day: "Thursday", action: "Donate yellow cloth or turmeric. Serve teachers.", food: "Yellow foods, chickpeas" },
  { planetId: 5, condition: "weak", gem: "Yellow Sapphire", mantra: "Om Gram Greem Groom Sah Gurave Namah", color: "Yellow/Gold", day: "Thursday", action: "Fast on Thursdays. Donate bananas.", food: "Yellow lentils, bananas" },
  { planetId: 5, condition: "debilitated", gem: "Yellow Sapphire in gold", mantra: "Om Brim Brihaspataye Namah (x108)", color: "Yellow", day: "Thursday", action: "Donate gold or yellow items to Brahmins.", food: "Chickpeas, turmeric foods" },

  { planetId: 6, condition: "general", gem: "Blue Sapphire", mantra: "Om Shanaye Namah", color: "Blue/Black", day: "Saturday", action: "Donate black sesame or iron. Serve the poor.", food: "Black sesame, urad dal" },
  { planetId: 6, condition: "weak", gem: "Blue Sapphire", mantra: "Om Sham Shanaishcharaya Namah", color: "Dark Blue", day: "Saturday", action: "Fast on Saturdays. Donate black cloth.", food: "Black lentils, avoid salt" },
  { planetId: 6, condition: "debilitated", gem: "Blue Sapphire in iron", mantra: "Mahamrityunjaya mantra (x108)", color: "Blue", day: "Saturday", action: "Serve at old age homes. Donate blankets.", food: "Black gram, sesame" },

  { planetId: 10, condition: "general", gem: "Hessonite (Gomed)", mantra: "Om Rahave Namah", color: "Brown/Mixed", day: "Saturday", action: "Donate brown cloth or coconut. Serve foreign workers.", food: "Mixed grains, coconut" },
  { planetId: 10, condition: "weak", gem: "Hessonite", mantra: "Om Raam Reem Rroom Sah Rahave Namah", color: "Brown", day: "Saturday", action: "Feed crows. Donate at crossroads.", food: "Black sesame, coconut" },

  { planetId: 11, condition: "general", gem: "Cat's Eye (Lehsunia)", mantra: "Om Ketave Namah", color: "Grey/Multi", day: "Tuesday", action: "Donate grey cloth. Serve dogs.", food: "Mixed grains" },
  { planetId: 11, condition: "weak", gem: "Cat's Eye", mantra: "Om Kram Kreem Kroom Sah Ketave Namah", color: "Grey", day: "Tuesday", action: "Feed stray dogs. Donate black/white items.", food: "Sesame, multi-grain" },
];

export function getRemedy(planetId: number, condition: RemedyEntry["condition"]): RemedyEntry | null {
  return REMEDIES.find(r => r.planetId === planetId && r.condition === condition) || null;
}

export function getGeneralRemedy(planetId: number): RemedyEntry | null {
  return REMEDIES.find(r => r.planetId === planetId && r.condition === "general") || null;
}
