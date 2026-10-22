"use client";

import { useEffect, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/lib/piazza/mode";

// prefers-reduced-motion, kept live.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
