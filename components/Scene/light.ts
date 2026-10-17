// The scene's palette and light rig, in one place so the voxels, props and
// lights agree. The goal is the prototype's flat painted look, not a lit
// "3D" look: lit tops land exactly on the palette, shadows land near the
// prototype's "mix 0.62 toward shadow", and side faces land on the
// prototype's side colors (mixed 0.42·(1 − lit) toward shadow).
//
// three's Lambert and toon materials divide all irradiance by π, so a
// surface shows its own color when ambient + sun·cosθ = π. The ambient is
// chosen from the prototype's shadow depth (about a quarter of the lit
// color in linear light, warm); the sun's color is then solved per channel
// so a sunlit top face shows its palette color exactly.

import * as THREE from "three";
import { Kind, Sun } from "@/lib/piazza/world";

export const HEX = {
  wallTop: "#e9dcbf",
  wallSide: "#e3d4b2",
  brickTop: "#c0623b",
  brickSide: "#b4552f",
  pathTop: "#d9aa5e",
  pathSide: "#cdb88d",
  arcadeTop: "#e9dcbf",
  arcadeSide: "#e6d6b2",
  shadow: "#35271f",
  marble: "#ebe3d1",
  veil: "#f4efe3",
  flag: "#b8322a",
  ink: "#18130f", // the flag pole, in the cat's black
  wood: "#4a3020",
  canvasBack: "#2a1c12",
  banana: "#e2c043",
  gold: "#f3d37a",
} as const;

export const TOP: Record<Exclude<Kind, Kind.Air>, string> = {
  [Kind.Wall]: HEX.wallTop,
  [Kind.Brick]: HEX.brickTop,
  [Kind.Path]: HEX.pathTop,
  [Kind.Arcade]: HEX.arcadeTop,
};

export const SIDE: Record<Exclude<Kind, Kind.Air>, string> = {
  [Kind.Wall]: HEX.wallSide,
  [Kind.Brick]: HEX.brickSide,
  [Kind.Path]: HEX.pathSide,
  [Kind.Arcade]: HEX.arcadeSide,
};

// Toward the sun, in three's axes (engine z is three y). Lives inside the
// world group, so it turns with the world just as the prototype's
// precomputed shadows did.
export const SUN3 = new THREE.Vector3(Sun.x, Sun.z, Sun.y);

// Linear-light ambient: (0.25, 0.235, 0.24) of a surface's color, times π.
// Slightly warm, close to the prototype's shadows on the ochre path and
// the cream walls.
export const AMBIENT = new THREE.Color().setRGB(0.25 * Math.PI, 0.235 * Math.PI, 0.24 * Math.PI);

// Solved so a sunlit top face (cosθ = SUN3.y) reflects exactly its color.
export const SUN_COLOR = new THREE.Color().setRGB(
  (Math.PI - AMBIENT.r) / SUN3.y,
  (Math.PI - AMBIENT.g) / SUN3.y,
  (Math.PI - AMBIENT.b) / SUN3.y,
);

// The fraction of a color a face shows under this rig, per channel.
export function lightAt(normal: THREE.Vector3): THREE.Color {
  const d = Math.max(0, normal.dot(SUN3));
  return new THREE.Color().setRGB(
    (AMBIENT.r + SUN_COLOR.r * d) / Math.PI,
    (AMBIENT.g + SUN_COLOR.g * d) / Math.PI,
    (AMBIENT.b + SUN_COLOR.b * d) / Math.PI,
  );
}

// The prototype mixes in sRGB, so this does too, returning linear.
export function mixSRGB(a: string, b: string, t: number): THREE.Color {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  ca.convertLinearToSRGB();
  cb.convertLinearToSRGB();
  ca.lerp(cb, t);
  return ca.convertSRGBToLinear();
}

// Toon ramp for props: the lit side reflects exactly its color, the side
// away from the sun about 0.45 of it, like the prototype's two-tone props.
// three samples the ramp at cosθ·0.5 + 0.5 and uses its red channel.
let ramp: THREE.DataTexture | null = null;
export function toonRamp(): THREE.DataTexture {
  if (ramp) return ramp;
  const lit = SUN3.y;
  const away = (0.45 * Math.PI - AMBIENT.r) / SUN_COLOR.r;
  const data = new Uint8Array([Math.round(away * 255), Math.round(lit * 255)]);
  ramp = new THREE.DataTexture(data, 2, 1, THREE.RedFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.generateMipmaps = false;
  ramp.needsUpdate = true;
  return ramp;
}

export const toon = (color: string, extra: THREE.MeshToonMaterialParameters = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: toonRamp(), ...extra });
