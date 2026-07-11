import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b14",
        borderRadius: 8,
        position: "relative",
      }}
    >
      {/* Orbit ring */}
      <div
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1.5px solid #c084fc",
          opacity: 0.55,
          transform: "rotate(-20deg)",
          display: "flex",
        }}
      />

      {/* Planet body */}
      <div
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          background: "#e9d5ff",
          display: "flex",
        }}
      />

      {/* Moon on the orbit */}
      <div
        style={{
          position: "absolute",
          top: 4,
          right: 5,
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#c084fc",
          display: "flex",
        }}
      />
    </div>,
    { ...size },
  );
}
