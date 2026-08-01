import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Next renders this at build time and serves it as the OG/Twitter card image.
// Colors are the globals.css palette inlined — ImageResponse can't read CSS
// variables, so these have to be kept in sync with :root by hand.
export const alt = "David Shubov — cloud and infrastructure engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Satori needs real font data; it can't use next/font. These are the same
  // Jost weights the site renders in, committed under app/_fonts so the card
  // doesn't silently fall back to a generic sans and stop looking like the site.
  const [regular, medium] = await Promise.all([
    readFile(join(process.cwd(), "app/_fonts/Jost-Regular.ttf")),
    readFile(join(process.cwd(), "app/_fonts/Jost-Medium.ttf")),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#eef1f5",
        padding: "0 96px",
        fontFamily: "Jost",
      }}
    >
      {/* Accent rule — the one piece of ornament, matching the site's
            restraint. Steel blue rather than sky, which fails contrast. */}
      <div
        style={{
          width: 64,
          height: 5,
          backgroundColor: "#2a6bb0",
          marginBottom: 40,
        }}
      />

      <div
        style={{
          fontSize: 92,
          fontWeight: 500,
          color: "#232c38",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
        }}
      >
        David Shubov
      </div>

      <div
        style={{
          fontSize: 38,
          fontWeight: 400,
          color: "#3d4756",
          marginTop: 22,
          lineHeight: 1.35,
          maxWidth: 780,
        }}
      >
        Cloud and infrastructure engineer
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 400,
          color: "#626d7b",
          marginTop: 40,
          letterSpacing: "0.02em",
        }}
      >
        davidshubov.com
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Jost", data: regular, weight: 400, style: "normal" },
        { name: "Jost", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
