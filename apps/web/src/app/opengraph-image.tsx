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

async function loadFont(weight: 400 | 500 | 600 | 700) {
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
  const [inter500, inter600, inter400] = await Promise.all([
    loadFont(500),
    loadFont(600),
    loadFont(400),
  ]);

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

      {/* Yantra-style concentric rings behind the title */}
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
      fonts: [
        { name: "Inter", data: inter400, weight: 400, style: "normal" },
        { name: "Inter", data: inter500, weight: 500, style: "normal" },
        { name: "Inter", data: inter600, weight: 600, style: "normal" },
      ],
    },
  );
}
