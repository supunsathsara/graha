import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b14",
        position: "relative",
      }}
    >
      {/* Radial glow background, matching the OG image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(circle at 50% 45%, #1e1240 0%, #120b26 55%, #0b0b14 85%)",
        }}
      />

      {/* Outer orbit ring */}
      <div
        style={{
          position: "absolute",
          width: 130,
          height: 130,
          borderRadius: "50%",
          border: "3px solid #c084fc",
          opacity: 0.5,
          transform: "rotate(-20deg)",
          display: "flex",
        }}
      />

      {/* Inner faint ring for depth */}
      <div
        style={{
          position: "absolute",
          width: 100,
          height: 100,
          borderRadius: "50%",
          border: "1.5px solid #c084fc",
          opacity: 0.25,
          display: "flex",
        }}
      />

      {/* Planet body */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #f3e8ff, #c084fc 70%)",
          display: "flex",
        }}
      />

      {/* Moon on the orbit */}
      <div
        style={{
          position: "absolute",
          top: 26,
          right: 30,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#e9d5ff",
          display: "flex",
        }}
      />
    </div>,
    { ...size },
  );
}
