// The painting's surface, ported from the prototype's post shader
// (piazza/post.kage): the air shimmers sideways very slightly, the canvas
// weave shows faintly in the paint, and everything is warmed a touch. The
// grain and the vignette are CSS overlays (they cover the backdrop too), so
// they are not here.
//
// The prototype works in sRGB screen pixels; postprocessing hands effects
// linear color in drawing-buffer pixels, so the shader converts both ways.
// The canvas is transparent where the backdrop shows through: the weave is
// scaled by alpha so empty sky stays empty.

import { BlendFunction, Effect } from "postprocessing";
import * as THREE from "three";

const fragmentShader = /* glsl */ `
uniform float uShimmer;
uniform float uWeave;
uniform float uDpr;
uniform vec3 uTint;

vec3 paintToSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
vec3 paintToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

void mainUv(inout vec2 uv) {
  // sin(y·0.012 + t·0.7)·0.7 CSS pixels, sideways.
  float y = gl_FragCoord.y / uDpr;
  uv.x += sin(y * 0.012 + time * 0.7) * 0.7 * uShimmer * uDpr / resolution.x;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 p = gl_FragCoord.xy / uDpr;
  float weave = sin(p.x * 1.9) * sin(p.y * 1.9) * 0.018 * uWeave;
  vec3 c = paintToSRGB(max(inputColor.rgb, 0.0));
  c = (c + weave * inputColor.a) * uTint;
  outputColor = vec4(paintToLinear(clamp(c, 0.0, 1.0)), inputColor.a);
}
`;

export const TINT = new THREE.Vector3(1.04, 1, 0.9);

export class PaintEffect extends Effect {
  constructor({ moving = true, dpr = 1 }: { moving?: boolean; dpr?: number } = {}) {
    super("PaintEffect", fragmentShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>([
        ["uShimmer", new THREE.Uniform(moving ? 1 : 0)],
        ["uWeave", new THREE.Uniform(moving ? 1 : 0)],
        ["uDpr", new THREE.Uniform(dpr)],
        ["uTint", new THREE.Uniform(TINT.clone())],
      ]),
    });
  }

  // Under reduced motion only the tint stays.
  set moving(on: boolean) {
    this.uniforms.get("uShimmer")!.value = on ? 1 : 0;
    this.uniforms.get("uWeave")!.value = on ? 1 : 0;
  }

  set dpr(v: number) {
    this.uniforms.get("uDpr")!.value = v;
  }
}
