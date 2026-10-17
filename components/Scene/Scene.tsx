"use client";

// The piazza in three.js. An orthographic camera looks down the true
// isometric diagonal (lib/piazza/space.ts proves it reproduces the 2D
// projection), so tiles that touch on screen are the tiles the walking
// rule connects. The world group turns by groupRotationY(game.theta); the
// sun lives inside it, so shadows turn with the world as in the prototype.
// Per-frame state is read from the game and refs in useFrame, never from
// React state.

import { useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ISO_DIR, frameFor, groupRotationY, toThree } from "@/lib/piazza/space";
import { MaxZ, N } from "@/lib/piazza/world";
import type { Game } from "@/lib/piazza/game";
import { AMBIENT, SUN3, SUN_COLOR } from "./light";
import { Props } from "./Props";
import { Voxels } from "./Voxels";
import styles from "./Scene.module.css";

export type SceneProps = {
  game: Game;
  interactive: boolean;
  // World units added to the camera target's height (the entrance pan).
  entranceOffset?: React.MutableRefObject<number>;
  // Bump after game.growTower() to rebuild the voxels.
  version?: number;
};

const CAMERA_DISTANCE = 50;

// Frames the scene per space.ts: zoom from frameFor (sized for the tallest
// tower, so the camera never jumps as it grows), target at the world's
// center at height zc, camera along ISO_DIR.
function Rig({ entranceOffset }: { entranceOffset?: React.MutableRefObject<number> }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const target = useRef(new THREE.Vector3());

  useLayoutEffect(() => {
    const view = frameFor(width, height, MaxZ - 2);
    target.current.set(...toThree({ x: N / 2, y: N / 2, z: view.zc }));
    camera.zoom = view.s * Math.sqrt(1.5);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  useFrame(() => {
    const t = target.current;
    const dy = entranceOffset?.current ?? 0;
    camera.up.set(0, 1, 0);
    camera.position.set(
      t.x + ISO_DIR[0] * CAMERA_DISTANCE,
      t.y + dy + ISO_DIR[1] * CAMERA_DISTANCE,
      t.z + ISO_DIR[2] * CAMERA_DISTANCE,
    );
    camera.lookAt(t.x, t.y + dy, t.z);
  }, -1);
  return null;
}

// The sun: a directional light toward Sun, aimed at the world's middle.
// Hard BasicShadowMap shadows; the shadow camera covers the whole world
// (radius ~10.4 around its center, plus the flag) at ~90 texels per voxel.
const CENTER = new THREE.Vector3(0, MaxZ / 2, 0);
const SUN_DISTANCE = 30;
const SUN_POS = CENTER.clone().addScaledVector(SUN3, SUN_DISTANCE);
const R = 11;

function Sunlight() {
  const light = useRef<THREE.DirectionalLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (light.current && aim.current) light.current.target = aim.current;
  }, []);
  return (
    <>
      <object3D ref={aim} position={CENTER} />
      <directionalLight
        ref={light}
        position={SUN_POS}
        color={SUN_COLOR}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-R}
        shadow-camera-right={R}
        shadow-camera-top={R}
        shadow-camera-bottom={-R}
        shadow-camera-near={SUN_DISTANCE - R - 2}
        shadow-camera-far={SUN_DISTANCE + R + 2}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

function Piazza3D({ game, version }: { game: Game; version: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = groupRotationY(game.theta);
  });
  return (
    <group ref={group} rotation-y={groupRotationY(game.theta)}>
      <Sunlight />
      <Voxels world={game.world} version={version} />
      <Props world={game.world} />
    </group>
  );
}

export function Scene({ game, interactive, entranceOffset, version = 0 }: SceneProps) {
  return (
    <div className={styles.scene} data-interactive={interactive || undefined}>
      <Canvas
        orthographic
        shadows="basic"
        flat
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE], near: 0.1, far: 400, zoom: 1 }}
      >
        <ambientLight color={AMBIENT} intensity={1} />
        <Rig entranceOffset={entranceOffset} />
        <Piazza3D game={game} version={version} />
      </Canvas>
    </div>
  );
}
