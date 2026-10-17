"use client";

// TEMPORARY dev route for the renderer gate (Task 6): the static scene over
// the backdrop, at the rotation given by ?r=0..3 (and the tower height by
// ?top=, to check the tallest tower stays in frame). Removed once Piazza (Task
// 7) mounts the scene on the home page.

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { Backdrop } from "@/components/Backdrop";
import { Game } from "@/lib/piazza/game";
import { World } from "@/lib/piazza/world";

const Scene = dynamic(() => import("@/components/Scene").then((m) => m.Scene), { ssr: false });

export default function PiazzaTest({ searchParams }: { searchParams: Promise<{ r?: string; top?: string }> }) {
  const { r, top } = use(searchParams);
  const [game] = useState(() => {
    const g = new Game(new World({ towerTop: top ? Number(top) : undefined }));
    const rot = Number(r) & 3;
    g.rot = rot;
    g.theta = (rot * Math.PI) / 2;
    g.nodes = g.world.nodes(rot);
    return g;
  });
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Backdrop />
      <Scene game={game} interactive={false} />
    </div>
  );
}
