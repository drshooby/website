"use client";

import { useEffect, useRef } from "react";
import styles from "./Heartbeat.module.css";

// A one-time welcome between the bio and the projects. The first time the
// strip is fully on screen, a pen draws an ECG beat left to right, the line
// pulses once, then it rests as a faint gray trace for the rest of the visit.

const HEIGHT = 36;
const MID = HEIGHT / 2;
const START_DELAY = 300; // ms after the strip comes into view
const SWEEP = 2600; // pen crossing the strip
const PULSE = 1100; // flash once the pen reaches the end

// Module scope, so it survives client-side navigation (home → writeup → home)
// but resets on a full reload: the beat plays once per visit.
let played = false;

function gauss(d: number, mu: number, sigma: number, amp: number) {
  return amp * Math.exp(-(((d - mu) / sigma) ** 2));
}

function smooth(s: number) {
  return s * s * (3 - 2 * s);
}

// One beat centred on the strip: P bump, the Q-R-S down-up-down, T wave.
// Negative values are up.
function beatY(x: number, width: number) {
  const d = x - width / 2;
  return (
    MID +
    gauss(d, -40, 6, -2.6) + // P
    gauss(d, -8, 2.2, 3.2) + // Q
    gauss(d, 0, 2.4, -15) + // R
    gauss(d, 7, 2.6, 5.5) + // S
    gauss(d, 36, 8.5, -4.2) // T
  );
}

// Path from `from` to `to`, sampled finely around the beat and coarsely on
// the flat stretches either side.
function tracePath(from: number, to: number, width: number) {
  const centre = width / 2;
  let d = "";
  for (let x = from; x <= to; x += Math.abs(x - centre) < 60 ? 1 : 4) {
    d += `${d ? "L" : "M"}${x.toFixed(1)} ${beatY(x, width).toFixed(2)}`;
  }
  return `${d}L${to.toFixed(1)} ${beatY(to, width).toFixed(2)}`;
}

export function Heartbeat() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);
  const restRef = useRef<SVGPathElement>(null);
  const penRef = useRef<SVGPathElement>(null);
  const flashRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const gradient = gradientRef.current;
    const rest = restRef.current;
    const pen = penRef.current;
    const flash = flashRef.current;
    const dot = dotRef.current;
    if (!svg || !gradient || !rest || !pen || !flash || !dot) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let fullPath = "";
    let frame = 0;
    let start: number | null = null;

    function measure() {
      width = Math.round(svg!.clientWidth) || 640;
      svg!.setAttribute("viewBox", `0 0 ${width} ${HEIGHT}`);
      fullPath = tracePath(0, width, width);
      rest!.setAttribute("d", fullPath);
      flash!.setAttribute("d", fullPath);
    }

    function show(el: SVGElement, visible: boolean) {
      el.style.display = visible ? "" : "none";
    }

    function showResting() {
      rest!.style.opacity = "";
      show(rest!, true);
      show(pen!, false);
      show(flash!, false);
      show(dot!, false);
    }

    function draw(now: number) {
      const t = now - (start ?? now);
      if (t < 0) {
        frame = requestAnimationFrame(draw);
        return;
      }

      // 1. Drawing: the line exists only where the pen has been, the newest
      //    stretch in accent blue fading back to the resting tone.
      if (t < SWEEP) {
        const head = Math.max(1, (t / SWEEP) * width);
        gradient!.setAttribute("x1", (head - 120).toFixed(1));
        gradient!.setAttribute("x2", head.toFixed(1));
        pen!.setAttribute("d", tracePath(0, head, width));
        dot!.setAttribute("cx", head.toFixed(1));
        dot!.setAttribute("cy", beatY(head, width).toFixed(2));
        show(rest!, false);
        show(pen!, true);
        show(dot!, true);
        frame = requestAnimationFrame(draw);
        return;
      }

      // 2. Pulse: the whole beat flashes softly, then settles to gray.
      if (t < SWEEP + PULSE) {
        const q = (t - SWEEP) / PULSE;
        const level = q < 0.2 ? smooth(q / 0.2) : 1 - smooth((q - 0.2) / 0.8);
        // From the pen's tone (0.4) down to the resting 0.16.
        rest!.style.opacity = (0.4 - 0.24 * smooth(q)).toFixed(3);
        flash!.style.opacity = (0.6 * level).toFixed(3);
        flash!.style.strokeWidth = (1.4 + 0.35 * level).toFixed(2);
        dot!.style.opacity = (1 - smooth(Math.min(1, q * 3))).toFixed(3);
        dot!.setAttribute("cx", String(width));
        dot!.setAttribute("cy", String(MID));
        show(pen!, false);
        show(rest!, true);
        show(flash!, true);
        frame = requestAnimationFrame(draw);
        return;
      }

      // 3. Rest.
      dot!.style.opacity = "";
      showResting();
    }

    measure();

    const resize = new ResizeObserver(() => {
      measure();
    });
    resize.observe(svg);

    if (played || reduceMotion) {
      showResting();
      return () => resize.disconnect();
    }

    // Nothing on the strip until the pen draws it.
    show(rest, false);
    show(pen, false);
    show(flash, false);
    show(dot, false);

    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        played = true;
        start = performance.now() + START_DELAY;
        frame = requestAnimationFrame(draw);
      },
      { threshold: 1 },
    );
    seen.observe(svg);

    return () => {
      seen.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <svg ref={svgRef} className={styles.strip} viewBox={`0 0 640 ${HEIGHT}`}>
        <defs>
          <linearGradient
            ref={gradientRef}
            id="heartbeat-ink"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0"
            y2="0"
          >
            <stop offset="0" className={styles.inkTail} />
            <stop offset="1" className={styles.inkHead} />
          </linearGradient>
        </defs>
        <path ref={restRef} className={styles.rest} />
        <path ref={penRef} className={styles.pen} stroke="url(#heartbeat-ink)" />
        <path ref={flashRef} className={styles.flash} />
        <circle ref={dotRef} className={styles.dot} r="1.8" />
      </svg>
    </div>
  );
}
