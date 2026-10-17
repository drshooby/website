// The painting's sky and ground, behind the transparent scene canvas: the
// prototype's dusk gradient falling to a pale horizon at 64% of the height,
// ochre ground below, and a low dark city on the horizon. The city is drawn
// in "u" units (1/140 of the stage height, as in the prototype) so its
// proportions hold at any aspect ratio.
//
// Every 34s a small dark train makes one 16s crossing along the horizon,
// left to right, its smoke rising, swelling and fading (prototype
// render.go drawSky). It runs on CSS animations only, behind the scene
// canvas, and is gone under reduced motion.
//
// Atmosphere is the painting's surface over everything (canvas and
// backdrop): a faint flickering grain and the prototype's vignette.

import styles from "./Backdrop.module.css";

type Block = [x: number, h: number, w: number];

// Two clusters, left and right of the piazza: [x, height, width] in u,
// plus an optional dome [cx, r] sitting on the horizon.
const LEFT: { blocks: Block[]; dome?: [number, number] } = {
  blocks: [
    [0, 5, 6],
    [6.7, 3, 12],
    [15.6, 8, 4],
    [19.6, 4, 10],
  ],
  dome: [25.7, 3],
};
const RIGHT: { blocks: Block[] } = {
  blocks: [
    [0, 6, 8],
    [9, 9, 3],
    [17.9, 4, 14],
    [40.3, 5, 6],
    [49.3, 3, 10],
  ],
};

function City({ blocks, dome, className }: { blocks: Block[]; dome?: [number, number]; className: string }) {
  const width = Math.max(...blocks.map(([x, , w]) => x + w), dome ? dome[0] + dome[1] : 0);
  return (
    <svg className={className} viewBox={`0 -9 ${width} 9`} aria-hidden="true" focusable="false">
      {blocks.map(([x, h, w]) => (
        <rect key={x} x={x} y={-h} width={w} height={h} />
      ))}
      {dome && (
        <>
          <circle cx={dome[0]} cy={-4} r={dome[1]} />
          <rect x={dome[0] - dome[1]} y={-4} width={dome[1] * 2} height={4} />
        </>
      )}
    </svg>
  );
}

// The train in its own units (1.2u, as in the prototype), drawn from its
// anchor x = 0 on the horizon y = 0: the locomotive ahead (cab, chimney),
// three carriages trailing to the left, on small wheels.
const TRAIN_RECTS: [x: number, y: number, w: number, h: number][] = [
  [0, -3, 7, 2.4],
  [4.6, -4.8, 2.4, 1.8],
  [1, -4.6, 0.9, 1.6],
  ...[1, 2, 3].map((k): [number, number, number, number] => [-6.4 * k, -2.6, 5.8, 2]),
];
// Wheels under the bodies, so the train runs on the horizon.
const WHEELS: [cx: number, r: number][] = [
  [1.2, 0.4],
  [3.4, 0.4],
  [5.7, 0.4],
  ...[1, 2, 3].flatMap((k): [number, number][] => [
    [-6.4 * k + 1.1, 0.3],
    [-6.4 * k + 4.7, 0.3],
  ]),
];
const PUFFS = 9;

function Train({ frozenAt }: { frozenAt?: number }) {
  // A still (dev capture) holds it this far through its crossing.
  const style =
    frozenAt === undefined
      ? undefined
      : ({ animationDelay: `${-frozenAt * 16}s`, animationPlayState: "paused" } as React.CSSProperties);
  return (
    <div className={styles.track} style={style}>
      <svg className={styles.train} viewBox="-19.2 -4.8 26.2 4.8" focusable="false">
        {TRAIN_RECTS.map(([x, y, w, h]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={w} height={h} />
        ))}
        {WHEELS.map(([cx, r]) => (
          <circle key={cx} cx={cx} cy={-r} r={r} />
        ))}
      </svg>
      {Array.from({ length: PUFFS }, (_, k) => (
        <span key={k} className={styles.puff} style={{ animationDelay: `${(-k / PUFFS) * (1 / 0.7)}s` }} />
      ))}
    </div>
  );
}

export function Backdrop({ trainAt, style }: { trainAt?: number; style?: React.CSSProperties } = {}) {
  return (
    <div className={styles.backdrop} style={style} aria-hidden="true">
      <City className={styles.cityLeft} {...LEFT} />
      <City className={styles.cityRight} {...RIGHT} />
      <Train frozenAt={trainAt} />
    </div>
  );
}

// Above the canvas and the backdrop, never in the way of the pointer.
export function Atmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  );
}
