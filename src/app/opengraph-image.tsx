import { ImageResponse } from "next/og";

export const alt = "Kiler — Dolabında ne varsa, bugünün tarifi o.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#3F5B3A", padding: 72, color: "#FFFDF9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44, fontWeight: 700 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#FFFDF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: "#D9532B" }} />
          </div>
          Kiler
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700, maxWidth: 900 }}>Dolabında ne varsa, bugünün tarifi o.</div>
          <div style={{ fontSize: 30, color: "#E9A23B" }}>Malzemene göre tarif · alışveriş listesi · haftalık plan · AI asistan</div>
        </div>
      </div>
    ),
    size,
  );
}
