import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Graha — Vedic Horoscope Engine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLANETS = ["☉", "☽", "☿", "♀", "♂", "♃", "♄"];
const FEATURES = [
  "Swiss Ephemeris",
  "Sidereal Lahiri",
  "Yogas & Doshas",
  "Navamsa D9",
];

// Scattered background stars — fixed positions so the image is deterministic
const STARS = [
  { x: 90, y: 80, r: 2, o: 0.5 },
  { x: 180, y: 220, r: 1.5, o: 0.4 },
  { x: 1040, y: 100, r: 2, o: 0.45 },
  { x: 1120, y: 260, r: 1.5, o: 0.35 },
  { x: 60, y: 420, r: 1.5, o: 0.4 },
  { x: 1080, y: 460, r: 2, o: 0.5 },
  { x: 300, y: 60, r: 1.5, o: 0.35 },
  { x: 900, y: 560, r: 1.5, o: 0.35 },
  { x: 150, y: 540, r: 2, o: 0.4 },
  { x: 1000, y: 340, r: 1.5, o: 0.3 },
];

async function loadFont(weight: 400 | 500 | 700) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
  ).then((res) => res.text());
  const url = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
  )?.[1];
  if (!url) throw new Error(`Could not load Inter ${weight}`);
  return fetch(url).then((res) => res.arrayBuffer());
}

export default async function OGImage() {
  let fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 500 | 700;
    style: "normal";
  }[] = [];

  try {
    const [inter400, inter500, inter700] = await Promise.all([
      loadFont(400),
      loadFont(500),
      loadFont(700),
    ]);
    fonts = [
      { name: "Inter", data: inter400, weight: 400, style: "normal" },
      { name: "Inter", data: inter500, weight: 500, style: "normal" },
      { name: "Inter", data: inter700, weight: 700, style: "normal" },
    ];
  } catch {
    // If Google Fonts is unreachable, fall back to Satori's default
    // sans-serif rather than failing the whole OG image build.
    fonts = [];
  }

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
        background: "#0b0b14",
      }}
    >
      {/* Base radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 50% 42%, #1e1240 0%, #120b26 45%, #0b0b14 80%)",
        }}
      />

      {/* Star scatter */}
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.y,
            left: s.x,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: "50%",
            background: `rgba(224,208,255,${s.o})`,
            display: "flex",
          }}
        />
      ))}

      {/* Concentric rings behind the title */}
      {[520, 400, 280].map((d, i) => (
        <div
          key={d}
          style={{
            position: "absolute",
            width: d,
            height: d,
            borderRadius: "50%",
            border: `1px solid rgba(192,132,252,${0.14 - i * 0.03})`,
            display: "flex",
          }}
        />
      ))}

      {/* Kundli-style diamond (North Indian chart motif) */}
      <div
        style={{
          position: "absolute",
          width: 330,
          height: 330,
          border: "1px solid rgba(192,132,252,0.16)",
          transform: "rotate(45deg)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 330,
          height: 1,
          background: "rgba(192,132,252,0.12)",
          transform: "rotate(45deg)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 330,
          height: 1,
          background: "rgba(192,132,252,0.12)",
          transform: "rotate(-45deg)",
          display: "flex",
        }}
      />

      {/* Corner glows */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          display: "flex",
          background:
            "radial-gradient(circle, rgba(192,132,252,0.16) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 340,
          height: 340,
          borderRadius: "50%",
          display: "flex",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Planet glyph row */}
      <div style={{ display: "flex", gap: 22, marginBottom: 28 }}>
        {PLANETS.map((s) => (
          <span
            key={s}
            style={{
              fontSize: 26,
              color: "#c084fc",
              opacity: 0.75,
              fontFamily: "Inter",
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          borderRadius: 999,
          border: "1px solid rgba(192,132,252,0.35)",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#d8b4fe",
            fontWeight: 500,
            letterSpacing: "0.08em",
          }}
        >
          VEDIC ASTROLOGY ENGINE
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 104,
          fontWeight: 700,
          color: "#f3e8ff",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          display: "flex",
        }}
      >
        Graha
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
        {FEATURES.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(192,132,252,0.08)",
              border: "1px solid rgba(192,132,252,0.2)",
              fontSize: 16,
              color: "#c4b5fd",
              fontWeight: 500,
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* Domain caption */}
      <div
        style={{
          display: "flex",
          marginTop: 26,
          fontSize: 14,
          color: "rgba(196,181,253,0.45)",
          letterSpacing: "0.04em",
        }}
      >
        graha.chutte.dev
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          display: "flex",
          background:
            "linear-gradient(90deg, transparent, #c084fc, transparent)",
        }}
      />
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
