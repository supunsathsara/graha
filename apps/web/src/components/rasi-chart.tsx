import { motion } from "framer-motion";

/**
 * South Indian Rasi (D1) chart wheel — HTML/CSS Grid based with realtime drawing animations.
 */

const ZODIAC_SYMBOLS: Record<number, string> = {
  0: "♈", 1: "♉", 2: "♊", 3: "♋",
  4: "♌", 5: "♍", 6: "♎", 7: "♏",
  8: "♐", 9: "♑", 10: "♒", 11: "♓",
};

const ZODIAC_NAMES: Record<number, string> = {
  0: "Aries", 1: "Taurus", 2: "Gemini", 3: "Cancer",
  4: "Leo", 5: "Virgo", 6: "Libra", 7: "Scorpio",
  8: "Sagittarius", 9: "Capricorn", 10: "Aquarius", 11: "Pisces",
};

const PLANET_NAMES: Record<number, string> = {
  0: "Su", 1: "Mo", 2: "Me", 3: "Ve", 4: "Ma",
  5: "Ju", 6: "Sa", 7: "Ur", 8: "Ne", 9: "Pl",
  10: "Ra", 11: "Ke",
};

// House positions in the 4x4 grid (top-left is (0,0))
// Indices 0-11 map to grid positions row-major
const HOUSE_GRID = [12, 1, 2, 3, 11, 0, 0, 4, 10, 0, 0, 5, 9, 8, 7, 6];

// Helper to get coordinates (in % or 0-100 viewBox) of a house
// Row/Col indices:
// 12 -> row 0, col 0
// 1  -> row 0, col 1
// 2  -> row 0, col 2
// 3  -> row 0, col 3
// 11 -> row 1, col 0
// 4  -> row 1, col 3
// 10 -> row 2, col 0
// 5  -> row 2, col 3
// 9  -> row 3, col 0
// 8  -> row 3, col 1
// 7  -> row 3, col 2
// 6  -> row 3, col 3
const HOUSE_POSITIONS: Record<number, { x: number; y: number }> = {
  12: { x: 0, y: 0 },
  1:  { x: 25, y: 0 },
  2:  { x: 50, y: 0 },
  3:  { x: 75, y: 0 },
  4:  { x: 75, y: 25 },
  5:  { x: 75, y: 50 },
  6:  { x: 75, y: 75 },
  7:  { x: 50, y: 75 },
  8:  { x: 25, y: 75 },
  9:  { x: 0, y: 75 },
  10: { x: 0, y: 50 },
  11: { x: 0, y: 25 },
};

export function RasiChart({
  lagnaSign,
  planets,
  showEmpty = true,
  className = "",
}: {
  lagnaSign: number;
  planets?: Array<{ planet: number; name?: { en: string }; house: number }>;
  showEmpty?: boolean;
  className?: string;
}) {
  // Build house → planets map
  const housePlanets: Record<number, number[]> = {};
  if (planets) {
    for (const p of planets) {
      const h = p.house;
      if (!housePlanets[h]) housePlanets[h] = [];
      housePlanets[h].push(p.planet);
    }
  }

  // Determine sign for each house based on lagna
  const houseSign = (houseNum: number) => (houseNum - 1 + lagnaSign) % 12;

  // Let's render the text elements overlay
  const renderCellText = (gridIndex: number) => {
    const houseNum = HOUSE_GRID[gridIndex];
    if (houseNum === 0) {
      if (gridIndex === 5) {
        // Center label animation
        return (
          <div key="center" className="chart-center border-0 bg-transparent">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="text-center relative z-10 p-1"
            >
              <div className="font-display text-xs text-ash uppercase tracking-widest">Sidereal</div>
              <div className="font-data text-[10px] text-ash/50 mt-1">Lahiri Ayanamsa</div>
            </motion.div>
          </div>
        );
      }
      return <div key={`empty-${gridIndex}`} />;
    }

    const sign = houseSign(houseNum);
    const isLagna = houseNum === 1;
    const housePlanetIds = housePlanets[houseNum] || [];

    return (
      <div key={`house-${houseNum}`} className="relative flex flex-col items-center justify-center p-4 h-full w-full select-none">
        {/* House number */}
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 + houseNum * 0.05 }}
          className={`absolute top-1.5 left-1.5 font-data text-[9px] ${isLagna ? 'text-turmeric' : 'text-ash'}`}
        >
          {houseNum}
        </motion.span>

        {/* Zodiac Symbol */}
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.3 + houseNum * 0.05 }}
          className="absolute bottom-1.5 right-1.5 font-data text-[9px] text-ash"
        >
          {ZODIAC_SYMBOLS[sign]}
        </motion.span>

        {/* Planet names */}
        {housePlanetIds.length > 0 && (
          <motion.span 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 + houseNum * 0.05, type: "spring", stiffness: 100 }}
            className={`text-turmeric font-data text-xs md:text-sm text-center ${isLagna ? 'font-bold' : ''}`}
          >
            {housePlanetIds.map(id => PLANET_NAMES[id] || "").join(" ")}
            {isLagna && <><br/>As</>}
          </motion.span>
        )}

        {isLagna && housePlanetIds.length === 0 && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: "spring" }}
            className="text-turmeric font-data text-xs md:text-sm font-bold"
          >
            As
          </motion.span>
        )}
      </div>
    );
  };

  return (
    <div className={`relative aspect-square w-full bg-manuscript/10 p-1 ${className}`}>
      {/* SVG Drawing Layer */}
      <svg className="absolute inset-0 w-full h-full text-ash/20 pointer-events-none" viewBox="0 0 100 100" fill="none">
        {/* Outer border */}
        <motion.rect
          x="0.5" y="0.5" width="99" height="99"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Horizontal grid lines */}
        <motion.line
          x1="0" y1="25" x2="100" y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        />
        <motion.line
          x1="0" y1="75" x2="100" y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        />

        {/* Vertical grid lines */}
        <motion.line
          x1="25" y1="0" x2="25" y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
        />
        <motion.line
          x1="75" y1="0" x2="75" y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeInOut" }}
        />

        {/* Short inner grids */}
        <motion.line
          x1="0" y1="50" x2="25" y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeInOut" }}
        />
        <motion.line
          x1="75" y1="50" x2="100" y2="50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeInOut" }}
        />
        <motion.line
          x1="50" y1="0" x2="50" y2="25"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeInOut" }}
        />
        <motion.line
          x1="50" y1="75" x2="50" y2="100"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 0.4, ease: "easeInOut" }}
        />

        {/* Center diagonals */}
        <motion.line
          x1="25" y1="25" x2="75" y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.0, duration: 0.6, ease: "easeInOut" }}
        />
        <motion.line
          x1="75" y1="25" x2="25" y2="75"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.0, duration: 0.6, ease: "easeInOut" }}
        />

        {/* Center Diamond */}
        <motion.polygon
          points="50,25 75,50 50,75 25,50"
          stroke="hsl(var(--ash))"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.2, duration: 0.8, ease: "easeInOut" }}
        />

        {/* Lagna Highlight Box */}
        <motion.rect
          x="25.5" y="0.5" width="24" height="24"
          stroke="hsl(var(--turmeric))"
          strokeWidth="1.5"
          fill="rgba(227, 162, 61, 0.05)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8, ease: "easeInOut" }}
        />
      </svg>

      {/* HTML Content Overlay */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 w-full h-full z-10 pointer-events-none [&>*]:pointer-events-auto">
        {Array.from({ length: 16 }, (_, i) => renderCellText(i))}
      </div>
    </div>
  );
}

export function RasiChartPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full bg-manuscript/5 p-1 ${className} opacity-30`}>
      <svg className="absolute inset-0 w-full h-full text-ash/20 pointer-events-none" viewBox="0 0 100 100" fill="none">
        <rect x="0.5" y="0.5" width="99" height="99" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="25" y1="0" x2="25" y2="100" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="75" y1="0" x2="75" y2="100" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="25" y2="50" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="75" y1="50" x2="100" y2="50" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="25" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="50" y1="75" x2="50" y2="100" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="25" y1="25" x2="75" y2="75" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <line x1="75" y1="25" x2="25" y2="75" stroke="hsl(var(--ash))" strokeWidth="0.5" />
        <polygon points="50,25 75,50 50,75 25,50" stroke="hsl(var(--ash))" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
