"use client";

// The tutorial's waypoint in the world: anchored 1.6 units above a
// landmark's top center, inside the rotating group so it turns with the
// piazza, its tether hanging down to the prop. drei's <Html> keeps it real
// DOM (focusable, readable) over the canvas.

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { frameFor, toThree } from "@/lib/piazza/space";
import { MaxZ, type Landmark } from "@/lib/piazza/world";
import { WaypointMark } from "./WaypointMark";

const ABOVE = 1.6;

type WaypointProps = {
  landmark: Landmark;
  onGo(): void;
  onDismiss(): void;
};

export function Waypoint({ landmark, onGo, onDismiss }: WaypointProps) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  // Screen pixels per world unit of height: the rig's zoom is s·√1.5 and a
  // vertical unit foreshortens by √(2/3) along the isometric view, so s.
  const s = useMemo(() => frameFor(width, height, MaxZ - 2).s, [width, height]);
  const { on } = landmark;
  const at = toThree({ x: on.x + 0.5, y: on.y + 0.5, z: on.z + 1 + landmark.height + ABOVE });
  // From the diamond's lower tip down to just above the prop.
  const tether = ABOVE * s - 16;
  return (
    <Html position={at} zIndexRange={[1, 0]}>
      <WaypointMark label={`${landmark.title} · click to walk`} tether={tether} onGo={onGo} onDismiss={onDismiss} />
    </Html>
  );
}
