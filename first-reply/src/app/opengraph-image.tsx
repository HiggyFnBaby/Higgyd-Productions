import { ImageResponse } from "next/og";

export const alt = "FirstReply — instant lead follow-up for real estate agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg,#050505 0%,#14110a 60%,#2a2008 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#e9c46a", letterSpacing: 4 }}>
          FIRSTREPLY
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          Never lose another lead to slow response.
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#d4d4d8", marginTop: 32 }}>
          Instant replies and follow-ups for real estate agents.
        </div>
      </div>
    ),
    size,
  );
}
