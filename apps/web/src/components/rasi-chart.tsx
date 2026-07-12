/**
 * South Indian Rasi (D1) chart wheel — SVG.
 *
 * Fixed 4×4 grid. Houses are fixed in position; signs rotate based on lagna.
 * Planets are placed in their house cells using astrological glyphs.
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

const PLANET_SYMBOLS: Record<number, string> = {
  0: "☉", 1: "☽", 2: "☿", 3: "♀", 4: "♂",
  5: "♃", 6: "♄", 7: "♅", 8: "♆", 9: "♇",
  10: "☊", 11: "☋",
  // Lagna
  100: "As",
};

// House positions in the 4×4 grid (top-left is (0,0))
// Indices 0-11 map to grid positions row-major
const HOUSE_GRID = [10, 11, 12, 1, 9, 0, 0, 2, 8, 0, 0, 3, 7, 6, 5, 4];

const CELL_SIZE = 72;
const GRID_SIZE = 4;
const PADDING = 2;

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
  const width = GRID_SIZE * CELL_SIZE + PADDING * 2;
  const height = GRID_SIZE * CELL_SIZE + PADDING * 2;

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

  const renderCell = (gridIndex: number) => {
    const houseNum = HOUSE_GRID[gridIndex];
    if (houseNum === 0 && !showEmpty) return null;
    if (houseNum === 0) {
      // Empty center cell
      const x = (gridIndex % GRID_SIZE) * CELL_SIZE + PADDING;
      const y = Math.floor(gridIndex / GRID_SIZE) * CELL_SIZE + PADDING;
      return (
        <rect key={`empty-${gridIndex}`} x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} fill="hsl(var(--card))" stroke="none" />
      );
    }

    const col = gridIndex % GRID_SIZE;
    const row = Math.floor(gridIndex / GRID_SIZE);
    const x = col * CELL_SIZE + PADDING;
    const y = row * CELL_SIZE + PADDING;
    const sign = houseSign(houseNum);
    const isLagna = houseNum === 1;
    const housePlanetIds = housePlanets[houseNum] || [];

    return (
      <g key={`house-${houseNum}`}>
        <rect
          x={x}
          y={y}
          width={CELL_SIZE}
          height={CELL_SIZE}
          fill={isLagna ? "hsl(var(--turmeric) / 0.06)" : "hsl(var(--card))"}
          stroke={isLagna ? "hsl(var(--turmeric))" : "hsl(var(--border))"}
          strokeWidth={isLagna ? 1.5 : 0.5}
        />
        {/* Sign symbol */}
        <text
          x={x + CELL_SIZE / 2}
          y={y + 18}
          textAnchor="middle"
          fill="hsl(var(--ash))"
          fontSize={11}
          fontFamily="JetBrains Mono, monospace"
        >
          {ZODIAC_SYMBOLS[sign]}
        </text>
        {/* House number */}
        <text
          x={x + 4}
          y={y + 12}
          fill="hsl(var(--muted-foreground))"
          fontSize={8}
          fontFamily="JetBrains Mono, monospace"
          opacity={0.6}
        >
          {houseNum}
        </text>
        {/* Planets in this house */}
        {housePlanetIds.length > 0 && (
          <text
            x={x + CELL_SIZE / 2}
            y={y + CELL_SIZE - 10}
            textAnchor="middle"
            fill={isLagna ? "hsl(var(--turmeric))" : "hsl(var(--ola-leaf))"}
            fontSize={14}
            fontFamily="JetBrains Mono, monospace"
            letterSpacing={4}
          >
            {housePlanetIds.map((id) => PLANET_SYMBOLS[id] || "").join("")}
          </text>
        )}
        {/* Lagna marker */}
        {isLagna && (
          <text
            x={x + CELL_SIZE - 4}
            y={y + CELL_SIZE - 4}
            textAnchor="end"
            fill="hsl(var(--turmeric))"
            fontSize={7}
            fontFamily="JetBrains Mono, monospace"
          >
            Lagna
          </text>
        )}
      </g>
    );
  };

  if (!showEmpty && !planets) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <svg width={width} height={height} className="opacity-30">
          {Array.from({ length: 16 }, (_, i) => renderCell(i))}
        </svg>
      </div>
    );
  }

  return (
    <div className={className}>
      <svg width={width} height={height}>
        {Array.from({ length: 16 }, (_, i) => renderCell(i))}
      </svg>
    </div>
  );
}

export function RasiChartPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={4 * 72 + 4} height={4 * 72 + 4} className="opacity-20">
        {Array.from({ length: 16 }, (_, i) => {
          const houseNum = HOUSE_GRID[i];
          if (houseNum === 0) return null;
          const col = i % GRID_SIZE;
          const row = Math.floor(i / GRID_SIZE);
          const x = col * 72 + 2;
          const y = row * 72 + 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={72}
              height={72}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              rx={2}
            />
          );
        })}
      </svg>
    </div>
  );
}
