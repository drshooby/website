"use client";

// Click-to-walk on the voxels. Any visible surface point names a screen key
// (an isometric screen point fixes rx - z, ry - z whatever the height), so
// the hit point is taken into the world group's frame, back to engine
// coordinates, and keyed for the current quarter turn. Hovering a walkable
// key draws a faint rhombus on its top face; clicking it walks the cat.
// Nothing reacts while the game is busy or input is off (an overlay is open).

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Game } from "@/lib/piazza/game";
import { fromThree, keyAtPoint, toThree } from "@/lib/piazza/space";
import type { Key } from "@/lib/piazza/world";
import { HEX } from "./light";

type PickerProps = {
  game: Game;
  canInput: () => boolean;
  // Reports whether a walkable key is under the pointer (for the cursor).
  onHoverNode: (on: boolean) => void;
  children: ReactNode;
};

const LIFT = 0.01; // above the top face, so the highlight never z-fights it

export function Picker({ game, canInput, onHoverNode, children }: PickerProps) {
  const group = useRef<THREE.Group>(null);
  const mark = useRef<THREE.Mesh>(null);
  const hover = useRef<Key | null>(null);
  const local = useRef(new THREE.Vector3());

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []); // flat, facing up
  useEffect(() => () => geometry.dispose(), [geometry]);

  const set = (key: Key | null) => {
    if (hover.current === key) return;
    hover.current = key;
    onHoverNode(key !== null);
  };

  // The walkable key under a hit, or null.
  const keyUnder = (e: ThreeEvent<PointerEvent | MouseEvent>): Key | null => {
    const g = group.current;
    if (!g || game.busy || !canInput()) return null;
    const p = g.worldToLocal(local.current.copy(e.point));
    const key = keyAtPoint(fromThree([p.x, p.y, p.z]), game.rot & 3);
    return game.nodes.get(key)?.walkable ? key : null;
  };

  // A rotation or a walk moves the world under a resting pointer, and an
  // overlay takes input away: drop the hover until the pointer moves again.
  useFrame(() => {
    if (hover.current !== null && (game.busy || !canInput())) set(null);
    const m = mark.current;
    if (!m) return;
    const node = hover.current === null ? undefined : game.nodes.get(hover.current);
    m.visible = !!node;
    if (node) {
      const [x, y, z] = toThree({ x: node.cell.x + 0.5, y: node.cell.y + 0.5, z: node.cell.z + 1 + LIFT });
      m.position.set(x, y, z);
    }
  });

  useEffect(() => () => onHoverNode(false), [onHoverNode]);

  return (
    <>
      <group
        ref={group}
        onPointerMove={(e) => set(keyUnder(e))}
        onPointerOut={() => set(null)}
        onClick={(e) => {
          e.stopPropagation();
          const key = keyUnder(e);
          if (key !== null) {
            game.clickKey(key);
            set(null);
          }
        }}
      >
        {children}
      </group>
      <mesh ref={mark} geometry={geometry} visible={false} renderOrder={1} raycast={() => null}>
        <meshBasicMaterial
          color={HEX.gold}
          transparent
          opacity={0.32}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </>
  );
}
