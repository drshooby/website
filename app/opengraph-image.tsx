import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Next renders this at build time and serves it as the OG/Twitter card image.
// It's the top of the home page frozen in one frame: graph paper, the serif
// name, the mono role line, and the heartbeat caught mid-pulse.
// Colors are the globals.css palette inlined — ImageResponse can't read CSS
// variables, so these have to be kept in sync with :root by hand.
export const alt = "David Shubov — cloud and infrastructure engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAD_X = 96;
const LINE_W = size.width - PAD_X * 2;
const LINE_H = 90;
const DOT_R = 6;
// The trace stops one dot-radius short of the edge so the dot isn't clipped.
const TRACE_END = LINE_W - DOT_R;

// Same beat as components/Heartbeat, drawn taller so it survives being
// shrunk to a link-preview thumbnail.
function heartbeatPath() {
  const g = (d: number, mu: number, sigma: number, amp: number) =>
    amp * Math.exp(-(((d - mu) / sigma) ** 2));
  const scale = 2.6;
  const mid = LINE_H / 2;
  const centre = TRACE_END / 2;
  let d = "";
  for (let x = 0; x <= TRACE_END; x += Math.abs(x - centre) < 150 ? 1 : 8) {
    const t = (x - centre) / scale;
    const y =
      mid +
      scale *
        (g(t, -40, 6, -2.6) +
          g(t, -8, 2.2, 3.2) +
          g(t, 0, 2.4, -15) +
          g(t, 7, 2.6, 5.5) +
          g(t, 36, 8.5, -4.2));
    d += `${d ? "L" : "M"}${x} ${y.toFixed(2)}`;
  }
  return d;
}

export default async function OpengraphImage() {
  // Satori needs real font data; it can't use next/font. These are the same
  // faces the site renders in, committed under app/_fonts so the card doesn't
  // silently fall back to a generic font and stop looking like the site.
  const [serif, serifItalic, mono] = await Promise.all([
    readFile(join(process.cwd(), "app/_fonts/InstrumentSerif-Regular.ttf")),
    readFile(join(process.cwd(), "app/_fonts/InstrumentSerif-Italic.ttf")),
    readFile(join(process.cwd(), "app/_fonts/IBMPlexMono-Regular.ttf")),
  ]);

  const grid = "rgba(74, 111, 165, 0.09)";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `0 ${PAD_X}px`,
        backgroundColor: "#eef1f5",
        backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Instrument Serif",
          fontSize: 132,
          color: "#232c38",
          letterSpacing: "-0.015em",
          lineHeight: 1,
        }}
      >
        David
        <span style={{ fontStyle: "italic", color: "#4a6fa5", marginLeft: 30 }}>
          Shubov
        </span>
      </div>

      <div
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 30,
          color: "#626d7b",
          marginTop: 26,
        }}
      >
        Cloud and infrastructure engineer
      </div>

      <svg
        width={LINE_W}
        height={LINE_H}
        viewBox={`0 0 ${LINE_W} ${LINE_H}`}
        style={{ marginTop: 44 }}
      >
        <path
          d={heartbeatPath()}
          fill="none"
          stroke="#4a6fa5"
          strokeOpacity={0.55}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={TRACE_END} cy={LINE_H / 2} r={DOT_R} fill="#2a6bb0" />
      </svg>

      <div
        style={{
          fontFamily: "IBM Plex Mono",
          fontSize: 24,
          color: "#626d7b",
          marginTop: 40,
        }}
      >
        davidshubov.com
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
        { name: "Instrument Serif", data: serifItalic, weight: 400, style: "italic" },
        { name: "IBM Plex Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
