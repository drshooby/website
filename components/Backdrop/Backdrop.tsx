// The painting's sky and ground, behind the transparent scene canvas: the
// prototype's dusk gradient falling to a pale horizon at 64% of the height,
// ochre ground below, and a low dark city on the horizon. The city is drawn
// in "u" units (1/140 of the stage height, as in the prototype) so its
// proportions hold at any aspect ratio.

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

export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <City className={styles.cityLeft} {...LEFT} />
      <City className={styles.cityRight} {...RIGHT} />
    </div>
  );
}
