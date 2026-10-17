# The Piazza (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the davidshubov.com home page with the piazza: a playable isometric de Chirico/Escher scene on desktop, a living painting plus a scrolling collection on phones, and the collection as the accessible, no-WebGL fallback everywhere.

**Architecture:** Game logic stays in the pure-TS engine `lib/piazza/` (no React or three imports, tested with `bun test`). A React Three Fiber scene renders the engine's world and reports clicks back to it as screen keys. Everything a visitor must be able to read (identity block, plaques, the collection) is server-rendered HTML styled by a `data-mode` attribute on `<html>`, so content never waits on WebGL.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Bun, three + @react-three/fiber 9 + @react-three/drei 10 + @react-three/postprocessing 3, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-10-17-piazza-site-design.md`. Background: `HANDOVER.md`, which covers the prototype, palette and rendering notes. The Go prototype in `piazza/` is the behavioral reference: read `piazza/main.go`, `cat.go` and `render.go` when a task says "as the prototype".

## Global Constraints

- All work on branch `piazza`. Never merge to `main` or push to production.
- Commit prefixes: `feat:`, `fix:`, `add:`, `update:`. End every commit message with:
  `Generated with AI` / blank line / `Co-Authored-By: Claude <noreply@anthropic.com>`.
- `lib/piazza/` must not import `react`, `three` or anything DOM-only, except `memory.ts`, which touches `localStorage` defensively.
- Identity block (name, "cloud & infrastructure engineer", LinkedIn `https://linkedin.com/in/david-shubov`, GitHub `https://github.com/drshooby`) is server-rendered HTML, visible before any JS or WebGL runs.
- All content comes from `text/ProjectList.ts` and `text/AboutText.ts`. No project copy in components or in `world.ts`.
- Collaborator credit (`awesomePeople`) appears on every project plaque in every view, each name linked as the existing `Contributor` component does.
- Every motion respects `prefers-reduced-motion`. Under reduced motion there is no entrance, no shimmer, no train, no grain flicker and no waypoint bob.
- Style guardrails: flat Lambert or toon materials in the prototype palette, no PBR or gloss, crisp hard shadows, simple primitive props.
- Palette (prototype, verbatim): Wall `#e9dcbf`/side `#e3d4b2`; Brick `#c0623b`/`#b4552f`; Path `#d9aa5e`/`#cdb88d`; Arcade `#e9dcbf`/`#e6d6b2`; shadow `#35271f`; marble `#ebe3d1`; cat `#18130f`; cat eyes `#c9d84a`; flag `#b8322a`; plaque `#efe6cf`, ink `#2b211b`; sky `#142b27 → #2f5a45 → #d3d08c` (horizon at 64% height); ground `#9c8448 → #4e3b22`; city `#34402f`; waypoint gold `#f3d37a`; frame `#2b211b` with gilt line `#b89a5a`.
- Copy, verbatim: hint "click to walk · q / e or ⟲ ⟳ to turn"; waypoint "Radiant · click to walk", then "turn the world, other paths appear"; unreachable "From here, the way to {Title} cannot be seen."; plaque footer "click anywhere to step back"; collection control "The Collection"; about entry heading "About the artist".
- Phase 1 has no landmarks for Blueprint or EKS (collection only).
- Every task ends green on `bun test`, `bunx tsc --noEmit` and `bun run lint`. From Task 4 on, `bun run build` must also pass.

## Review Focus

1. **Storage unavailable or corrupted** (Safari private mode, a user editing `localStorage`, an old schema): the site must behave as a first visit and never throw. Pinned in Task 3.
2. **Input spam:** clicks while the cat walks, Q/E held down or mashed during a rotation, Q/E while a plaque is open, clicking the same landmark twice. All are ignored or harmless, and the cat never ends up on a cell that isn't a walkable node. Pinned in Task 1.
3. **Viewport extremes:** 21:9, 1:1, short laptop screens (1280×600), and the tower at its maximum height. The whole scene fits on screen at every rotation, and the tower top is never clipped (a known prototype bug). Pinned in Task 2.
4. **Mode changes at runtime:** resizing a desktop window narrow, rotating a tablet, or WebGL being unavailable or the context getting lost. The page switches layout cleanly and content stays reachable. Pinned in Task 3 (`pickMode`) and Task 9 (error boundary, context-loss fallback).
5. **Overlays and focus:** Esc, a click outside, or the close button closes a plaque or the collection. Focus returns to what opened it, videos inside a closed overlay stop playing, and Q/E do nothing while an overlay is open. Pinned in Task 7.

---

## File Structure

```
lib/piazza/
  world.ts         (modify) landmarks lose date/body; World takes {towerTop}; towerTop getter
  view.ts          (exists) 2D isometric projection, the reference for screen math
  cat.ts           (modify) + catWorldPos(): the cat's 3D point, sliding across seams on the front layer
  space.ts         (new) world <-> three coordinates, rotPoint, keyAtPoint, frameFor
  game.ts          (new) game controller: rotation easing, settle, click/landmark walking, events
  tutorial.ts      (new) waypoint state machine
  memory.ts        (new) localStorage persistence (defensive)
  mode.ts          (new) pickMode(): "play" | "painting" | "fallback"
  *.test.ts        tests beside each module
text/
  collection.ts    (new) CollectionEntry[] (about + projects) and entryForLandmark()
  collection.test.ts
types/project.ts   (modify) + still?: "relic" | "eks"
components/
  Identity/        name, role, links; data-phase-driven entrance styling
  Plaque/          framed work (video | image | still) + museum label; about and project variants
  Collection/      list of Plaques (overlay on desktop, page section on phones)
  Overlay/         <dialog> wrapper: Esc, outside click, close button, focus return
  Controls/        hint, turn buttons, The Collection button, keyboard landmark list, turn waypoint
  Backdrop/        CSS/SVG sky, ground, city, train; grain and vignette overlays
  Scene/           R3F: Scene.tsx, Voxels.tsx, Props.tsx, CatMesh.tsx, Picker.tsx, Waypoint.tsx, PaintEffect.ts
  Piazza/          client shell: mode, Game instance, entrance phases, tutorial, memory, wiring
app/
  layout.tsx       (modify) fonts (EB Garamond + IBM Plex Mono), early mode script
  page.tsx         (modify) Identity + Piazza + Collection
  globals.css      (rewrite) piazza palette tokens
public/
  avatar.png, still-relic.png, still-eks.png, piazza.png
scripts/
  shot.sh          (new) headless-Chrome screenshot helper
```

Delete in Task 11: `components/{About,Heartbeat,Projects,Project,InProgress,Footer,Demo}`.

---

### Task 1: Game controller

**Files:**
- Modify: `lib/piazza/world.ts`
- Create: `lib/piazza/game.ts`, `lib/piazza/game.test.ts`

**Interfaces:**
- Consumes: `World`, `NodeMap`, `keyOf`, `findPath`, `settleCell` (world.ts); `Cat` (cat.ts); `makeView` (view.ts).
- Produces:
  - `Landmark` becomes `{ title: string; prop: Prop; on: Cell; height: number }`. Delete `date` and `body`. `title` stays and is the join key to content.
  - `new World(opts?: { towerTop?: number })`. `towerTop` is clamped to `[6, MaxZ - 2]` and non-numbers fall back to 6. Add a `get towerTop(): number` getter (rename the private field).
  - ```ts
    export type GameEvent =
      | { type: "arrived"; landmark: number }
      | { type: "unreachable"; landmark: number }
      | { type: "turned"; rot: number }; // rot & 3 after settling
    export class Game {
      constructor(world: World);
      readonly world: World;
      readonly cat: Cat;
      rot: number;          // unbounded integer; use rot & 3 for lookups
      theta: number;        // eased angle, radians
      nodes: NodeMap;       // for rot & 3, recomputed on settle and growTower
      get rotating(): boolean;   // |theta - rot*π/2| > 1e-4
      get busy(): boolean;       // rotating || cat.walking
      turn(dir: 1 | -1): boolean;          // false (no-op) when busy
      clickKey(key: Key): void;            // walk to a walkable node; no-op when busy or unwalkable
      goToLandmark(i: number): void;       // queues "unreachable" if no path; "arrived" immediately if already adjacent
      tick(dt: number): GameEvent[];       // eases theta by (target-theta)*min(1, dt*5), snaps under 2e-3 then settles; else advances cat
      growTower(): void;                   // world.growTower() + recompute nodes
    }
    ```

- [ ] **Step 1: Update existing tests for the slimmer `Landmark`.** `world.test.ts` only reads `title` and `on`, so it should still compile. Run `bun test lib/piazza` and expect PASS. This is the baseline.
- [ ] **Step 2: Write failing tests in `game.test.ts`:**
  - `walks to Radiant and arrives`: `g.goToLandmark(4)`, then tick at `1/60` until an event. Expect `[{type:"arrived", landmark:4}]`, and `g.cat.cell` is a walkable node adjacent in key space to Radiant's key.
  - `Veil is unreachable at r0 and reachable after one turn`: `goToLandmark(2)` at r0 gives an `unreachable` event on the next tick. Then `turn(1)`, tick until `turned` with `rot: 1`, then `goToLandmark(2)` leads to `arrived`.
  - `turn is ignored while walking and while rotating`: start a walk, then `turn(1)` returns `false` and `rot` is unchanged. After the walk ends, `turn(1)` then `turn(1)` again: the second returns `false`.
  - `clicks are ignored while busy`: during a walk, `clickKey(otherWalkableKey)` leaves `cat.path` unchanged.
  - `the cat is always on a walkable node`: seeded random spam (mulberry32, seed 1) of 2000 actions drawn from `turn(±1)`, `clickKey(random key in [-12,12]²)`, `goToLandmark(rand 0..4)`, `tick(1/60)`. After every settle, `g.nodes.get(keyOf(g.cat.cell, g.rot & 3))?.walkable === true`.
  - `World clamps towerTop`: `new World({towerTop: 99}).towerTop === 10`, `new World({towerTop: NaN}).towerTop === 6`, `new World({towerTop: 3}).towerTop === 6`.
  - `growTower stops at the cap`: 10 calls give `towerTop === 10`.
- [ ] **Step 3: Run `bun test lib/piazza/game.test.ts`.** Expect FAIL (module missing).
- [ ] **Step 4: Implement** `game.ts` and the `world.ts` changes, following `piazza/main.go` `Update`, `settle` and `goTo` (lines 92–203). Events are pushed into an internal queue drained by `tick`. `cat.update` gets `makeView(theta, 1)`. On arrival, emit `arrived` only when `cat.target >= 0`, then reset `cat.target = -1`.
- [ ] **Step 5: Run `bun test`.** Expect PASS, including the golden tests from before.
- [ ] **Step 6: Commit:** `feat: piazza game controller`.

### Task 2: Space mapping, seams and framing

**Files:**
- Create: `lib/piazza/space.ts`, `lib/piazza/space.test.ts`
- Modify: `lib/piazza/cat.ts`, `lib/piazza/world.test.ts` (add `catWorldPos` tests)
- Dev dependency: `three`, `@types/three`. Tests use three only for the projection check, and `space.ts` itself must not import three.

**Interfaces:**
- Produces (in `space.ts`):
  - `toThree(p: Vec3): [number, number, number]` returns `[p.x - N/2, p.z, p.y - N/2]`. `fromThree(v: [number, number, number]): Vec3` is its inverse.
  - `groupRotationY(theta: number): number` returns `-theta`. It is the world group's `rotation.y`, matching view.ts's `rot()`.
  - `ISO_DIR: [number, number, number] = [1, 1, 1]`. The camera sits at `target + ISO_DIR * 50`, looking at the target, with up `[0, 1, 0]`.
  - `rotPoint(x: number, y: number, r: number): [number, number]` is the continuous version of `rotCell`. r1: `(N - y, x)`, r2: `(N - x, N - y)`, r3: `(y, N - x)`.
  - `keyAtPoint(p: Vec3, r: number): Key` returns `packKey(floor(rx - p.z), floor(ry - p.z))`. It works for any visible surface point, because an isometric screen point fixes `(rx - z, ry - z)`.
  - `frameFor(width: number, height: number, towerTop: number): View` returns `ox = width/2` and `oy = height/2`, with `s` and `zc` chosen so the scene fits (see the test). Three's camera then uses `zoom = view.s * Math.sqrt(1.5)` and target `toThree({x: N/2, y: N/2, z: view.zc})`.
- Produces (in `cat.ts`): `catWorldPos(cat: Cat, r: number): Vec3`. At rest it returns the cell's top center. While walking segment A→B, both endpoints move along the view axis onto the layer `h = max(A.z, B.z)`. In rotated space a cell shifts by `d·(1,1,1)`, which in world space is `unrotVec(1,1,r)·d` plus `d` in z. The function lerps the shifted top centers by `cat.t`. Using the front layer keeps the cat drawn in front of what it crosses.

- [ ] **Step 1: Write failing tests:**
  - `keyAtPoint matches keyOf at every node's top center`: for r in 0..3 and every node in `world.nodes(r)`, `keyAtPoint(topCenterPoint(node.cell), r) === key`.
  - `three camera reproduces the 2D projection`: build a `THREE.OrthographicCamera` at `ISO_DIR*50` looking at the origin, with a group rotated by `groupRotationY(r·π/2)`. For 30 seeded random points, ndc.x is a positive constant multiple of `proj(v,p).x - proj(v,center).x`, and −ndc.y likewise for y (tolerance 1e-6). This proves the screen-key alignment survives in 3D.
  - `(x,y,z) and (x+1,y+1,z+1) land on the same screen point` under the three camera, for all 4 rotations.
  - `catWorldPos projects to cat.pos`: for each landmark walk from the golden walk test, at t ∈ {0, 0.3, 0.7} of every segment, `proj(view, catWorldPos(cat, r))` equals `cat.pos(view)` within 1e-9.
  - `frameFor fits everything`: for sizes 1920×1080, 1280×600, 2560×1080, 1000×1000 and 820×1180, every corner of every non-air voxel (`towerTop` = 10, plus 2 voxels of flag headroom) projects inside `[24, w-24] × [24, h-24]` at r 0..3. Also `view.s >= 0.85 * min(w/24, h/19.5)`, so the scene isn't tiny.
- [ ] **Step 2: Run them.** Expect FAIL.
- [ ] **Step 3: Implement.** `frameFor`: start from `s = min(w/24, h/19.5)` and `zc = 3.5`. Measure the projected bounds over all rotations at the given `towerTop + 2`, then solve for the `s` and `zc` that center the bounds and fit the margins. Do it analytically from the bounds, not by iterating.
- [ ] **Step 4: Run `bun test`.** Expect PASS.
- [ ] **Step 5: Commit:** `feat: piazza space mapping and framing`.

### Task 3: Tutorial, memory and mode

**Files:**
- Create: `lib/piazza/tutorial.ts`, `lib/piazza/memory.ts`, `lib/piazza/mode.ts`, plus a `.test.ts` for each.

**Interfaces:**
- ```ts
  // tutorial.ts
  export type TutorialStep = "radiant" | "turn" | "done";
  export type TutorialEvent =
    | { type: "plaqueClosed"; title: string }   // an in-world plaque closed
    | { type: "turned" }
    | { type: "dismissed" };
  export function nextStep(step: TutorialStep, e: TutorialEvent): TutorialStep;
  // memory.ts
  export interface Memory { visited: boolean; tutorial: TutorialStep; towerTop: number }
  export const MEMORY_KEY = "piazza:v1";
  export function loadMemory(storage?: Storage | null): Memory;   // never throws
  export function saveMemory(patch: Partial<Memory>, storage?: Storage | null): void; // never throws; merges
  // mode.ts
  export type Mode = "play" | "painting" | "fallback";
  export function pickMode(env: { coarse: boolean; width: number; webgl: boolean }): Mode;
  export const PAINTING_QUERY = "(pointer: coarse) and (max-width: 600px), (max-width: 480px)";
  ```
- `storage` defaults to `globalThis.localStorage`, read inside a try.

- [ ] **Step 1: Write failing tests:**
  - tutorial: `radiant + plaqueClosed("Radiant") → turn`; `radiant + plaqueClosed("Relic") → radiant`; `radiant + turned → done`; `turn + turned → done`; any step `+ dismissed → done`; `done` is sticky for every event.
  - memory: an empty storage gives `{visited:false, tutorial:"radiant", towerTop:6}`. A round trip of a saved patch works. Garbage JSON, a wrong-typed field (`tutorial: 7`) or `towerTop: 99` fall back or clamp per field. A storage whose `getItem` and `setItem` throw yields the defaults and no throw. `storage = null` yields the defaults.
  - mode: `{coarse:true, width:390, webgl:true} → painting`; `{coarse:true, width:820} → play` (tablet); `{coarse:false, width:1440} → play`; `{coarse:false, width:420} → painting`; `webgl:false → fallback` regardless of the rest.
- [ ] **Step 2: Run.** Expect FAIL. **Step 3: Implement.** **Step 4: Run `bun test`.** Expect PASS.
- [ ] **Step 5: Commit:** `feat: piazza tutorial, memory and mode`.

### Task 4: Content model, palette, fonts and the Plaque

**Files:**
- Create: `text/collection.ts`, `text/collection.test.ts`, `components/Plaque/{index.ts,Plaque.tsx,Plaque.module.css}`, `scripts/shot.sh`
- Modify: `types/project.ts` (add `still?: "relic" | "eks"`), `text/ProjectList.ts` (Relic `still: "relic"`, EKS `still: "eks"`), `app/globals.css` (rewrite to piazza tokens), `app/layout.tsx` (fonts)
- Copy: `piazza/assets/avatar.png` → `public/avatar.png`

**Interfaces:**
- ```ts
  // text/collection.ts
  export type CollectionEntry =
    | { kind: "about"; id: "about"; title: string; role: string; paragraphs: string[]; image: string }
    | { kind: "project"; id: string; project: ProjectProps };   // id = slug of title, contributors = awesomePeople
  export const collection: CollectionEntry[];      // about first, then ProjectList order
  export function entryForLandmark(title: string): CollectionEntry | undefined; // "David Shubov" → about
  // components/Plaque
  export function Plaque(props: { entry: CollectionEntry; headingLevel?: 2 | 3; onClose?: () => void }): JSX.Element;
  ```
- CSS tokens in `:root` (Task 5+ use these names): `--sky-top --sky-mid --sky-horizon --ground-top --ground-bottom --city --plaque --ink --ink-muted --gilt --frame --flag --gold --link-on-plaque`. The last one is `#7a4b1e` and must stay ≥ 4.5:1 on `#efe6cf`. Fonts: `--font-serif` (EB Garamond via `next/font/google`, with `font-feature-settings: "smcp"` for small-caps titles) and `--font-mono` (IBM Plex Mono). Drop Jost and Instrument Serif, but leave `app/_fonts` and `opengraph-image.tsx` alone.
- `scripts/shot.sh <url> <out.png> <width> <height>` runs `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=W,H --virtual-time-budget=6000 --screenshot=OUT URL`.

- [ ] **Step 1: Write failing tests** in `collection.test.ts`:
  - `about entry first`: title "David Shubov", role "Cloud and infrastructure engineer", `paragraphs` equal to `aboutText`, image `/avatar.png`.
  - `every landmark has an entry`: for each `new World().landmarks`, `entryForLandmark(l.title)` is defined.
  - `credit survives`: for every project in `projects` with `awesomePeople`, the entry's `project.contributors` deep-equals it.
  - `every project has media or a still`: each project has `demo` or `still`.
- [ ] **Step 2: Run.** Expect FAIL. **Step 3: Implement `collection.ts` and the type and content edits.** **Step 4: Run.** Expect PASS.
- [ ] **Step 5: Implement `Plaque`.** The frame is `--frame` with a 1px `--gilt` inner outline. Inside the frame: a `VideoPlayer` for `demo`, `<img src="/still-{still}.png">` for `still`, or `<img src="/avatar.png">` for about. A missing still image file shows the frame's dark fill, never a broken-image icon (`onError` hides the img). The label underneath, in order: a mono date line with a red "Building" marker when `inProgress`; the small-caps title; description paragraphs through `react-markdown`, with the link handling copied from `components/Project/Project.tsx:91-104`; the mono tech line joined with " · "; a "with:" line of `Contributor`s; and links ("GitHub ↗" and "Read the writeup →" to `/projects/{writeup}`). With `onClose`, it adds a visible close button and the footer "click anywhere to step back".
- [ ] **Step 6: Temporarily render** `collection.map(e => <Plaque entry={e}/>)` in `app/page.tsx` (Task 5 replaces it). Run `bun run build && bun run start`, then `scripts/shot.sh http://localhost:3000 /tmp/plaques.png 1280 2400`, and view the screenshot. Expect cream plaques, framed videos, the Relic and EKS frames dark (stills arrive in Task 10), and the credit lines present.
- [ ] **Step 7: Run tests, tsc, lint and build.** Expect all green. **Commit:** `feat: plaque, collection data and piazza palette`.

### Task 5: Page shell: Identity, Collection, Overlay, mode attribute

**Files:**
- Create: `components/Identity/*`, `components/Collection/*`, `components/Overlay/*`
- Modify: `app/page.tsx`, `app/layout.tsx`

**Interfaces:**
- `Identity()` is a server component: `<header>` with name (h1), role, and LinkedIn and GitHub links. Its CSS reads `html[data-mode]` and `html[data-phase]` (Task 8 animates `data-phase`: `title | descent | settled`).
- `Collection({ id = "collection" })` is a server component: a `<section aria-labelledby>` with the heading "The Collection" and a `Plaque` per `collection` entry (heading level 3).
- `Overlay(props: { open: boolean; onClose: () => void; label: string; children: ReactNode })` is a client component built on `<dialog>` with `showModal()`. Esc and a backdrop click call `onClose`. It restores focus to the element that was focused before opening, and pauses every `<video>` inside on close.
- Early mode script: an inline `<script>` at the top of `<body>` in `layout.tsx` that sets `document.documentElement.dataset.mode` using the same rule as `pickMode`. It uses `matchMedia(PAINTING_QUERY)` plus a WebGL probe (`canvas.getContext("webgl2") || getContext("webgl")`) and is wrapped in try. With no JS, `data-mode` is absent, which CSS treats as fallback. Keep the rule in one place: export the script string from `lib/piazza/mode.ts` as `MODE_SCRIPT`, built from `PAINTING_QUERY`.
- Layout by mode (CSS in `app/globals.css` + modules):
  - absent / `fallback`: page scrolls. A painting area (60vh) shows `/piazza.png` as a cover image with the Identity overlaid top left, then the Collection.
  - `painting`: same as fallback, except the painting area later hosts the live scene (Task 9).
  - `play`: `body` has no scroll and the stage fills the viewport. The Collection section is still in the DOM (for SEO and screen readers via the overlay), but visually lives only inside the Overlay (Task 7). Before hydration in play mode, the Collection is `display:none`.

- [ ] **Step 1: Implement the components and page:** `app/page.tsx` renders `<Identity/>`, `<div id="stage"/>` (a placeholder for Piazza), and `<Collection/>`.
- [ ] **Step 2: Verify the no-JS fallback:** `bun run build && bun run start`, then `scripts/shot.sh` at 390×844 and 1440×900 with Chrome `--blink-settings=scriptEnabled=false` added. Both screenshots must show the identity block and the Collection. Run `curl -s localhost:3000 | grep -c 'with:'` and expect at least 4 (credit lines in the server HTML).
- [ ] **Step 3: Verify the play-mode attribute:** a 1440×900 shot with JS shows the identity block and no Collection on screen.
- [ ] **Step 4: tsc, lint, build green. Commit:** `feat: piazza page shell and modes`.

### Task 6: Static R3F scene (renderer gate)

**Files:**
- Create: `components/Scene/{index.ts,Scene.tsx,Voxels.tsx,Props.tsx,Scene.module.css}`, `components/Backdrop/*`
- Dependencies: `three @react-three/fiber@^9 @react-three/drei@^10`

**Interfaces:**
- `Scene(props: { game: Game; interactive: boolean; entranceOffset?: React.MutableRefObject<number> })` is a client component. `Piazza` (Task 7) loads it with `next/dynamic` and `{ ssr: false }`. It renders a transparent `<Canvas orthographic shadows dpr={[1, 2]}>`. The camera follows `space.ts`: position `target + ISO_DIR*50`, `zoom = frameFor(...).s * √1.5`, recomputed on resize. A `<group rotation-y={groupRotationY(game.theta)}>` is updated in `useFrame` from the game (refs, never React state).
- `Voxels({ world, version })`: one `InstancedMesh` of unit boxes per `Kind`, built from `world.at()`, with Lambert materials in the palette's top colors. `castShadow` and `receiveShadow` are on. It rebuilds when `version` changes (bumped by `growTower`). The arcade's arches are dark (`#35271f`) planes on the Arcade voxels' outward faces, shaped as the prototype's (`t` −1→0.55, `u` 0.2–0.8). The tower has a small window arch on the level below its top and a `#b8322a` flag on the cap.
- `Props({ world, onLandmark?, onHover? })`: one primitive group per landmark at the top center of `on`. Easel: wooden legs plus a plane textured with `/avatar.png`. Column: a broken cylinder in marble. Statue: a cone or capsule in marble with a veil. Doorway: an arch frame in the Wall color whose dark interior occasionally glows `#f3d37a` (a 0.6s pulse every 9–14s, off under reduced motion). Bananas: two curved yellow capsules. Each prop's shadow-casting height matches its `height`.
- Lighting: `ambientLight` (warm, about 0.55) plus a `directionalLight` from `Sun` (converted with `toThree`, rotated with the group each frame). Use a hard `BasicShadowMap`, `mapSize` 2048, a shadow camera covering the world, and tuned bias so there's no acne. Visually, side faces facing away from the sun should land near the prototype's "mix 0.42 toward shadow".
- `Backdrop()`: CSS gradient sky and ground (horizon at 64%), with an SVG city silhouette in `--city` at the horizon. It sits behind the canvas, and the canvas is transparent.

- [ ] **Step 1: Install dependencies.** Implement Scene, Voxels, Props and Backdrop. Add a temporary dev route `app/piazza-test/page.tsx` that renders `Backdrop` and `Scene` with a fresh `Game` and `interactive=false`, plus `?r=0..3` to set `game.rot` and `theta`.
- [ ] **Step 2: Screenshot** all four rotations at 1440×900 and 1280×600 with `scripts/shot.sh` and view them. **Gate:** compare them against the golden dumps (`lib/piazza/golden/rot*.txt`). Tiles that the dumps show as adjacent must visibly touch on screen. The tower and flag must be unclipped. Shadows must be long, hard, and falling away from the sun (toward screen lower-left at r0). It should read as a painting (flat color, no gloss). If alignment fails and can't be fixed through the camera, stop and switch to the SVG fallback described in the spec, and record the decision in the commit message. Otherwise continue with R3F.
- [ ] **Step 3: tsc, lint, build green. Commit:** `feat: static piazza scene in r3f`.

### Task 7: Interactive piazza on desktop

**Files:**
- Create: `components/Scene/{Picker.tsx,CatMesh.tsx}`, `components/Controls/*`, `components/Piazza/{index.ts,Piazza.tsx,Piazza.module.css}`
- Modify: `app/page.tsx` (render `<Piazza/>` in the stage; remove the dev route from Task 6)

**Interfaces:**
- `Piazza()` is a client component. It owns `const game = useRef(new Game(new World({ towerTop: loadMemory().towerTop })))`, the current mode (from `pickMode`, with a matchMedia listener that updates `data-mode` live), `plaque: number | null`, `collectionOpen: boolean`, `hoverLandmark: number | null` and `message: string | null` (cleared after 3s). A `useFrame`-driven `game.tick(dt)` inside the Scene calls back `onEvents(events: GameEvent[])`, and Piazza turns those into React state:
  - `arrived` opens the plaque.
  - `unreachable` sets the message "From here, the way to {Title} cannot be seen."
  - `turned` feeds the tutorial (Task 8).
- `Picker`: R3F pointer handlers on the voxel group. It converts `e.point` to group-local coordinates, then `fromThree`, then `keyAtPoint(p, game.rot & 3)`. Hover over a walkable node sets `document.body.style.cursor = "pointer"` and draws a faint rhombus highlight. Click calls `game.clickKey(key)`. Landmark props: hover shows a drei `<Html>` label with the title in small caps on the plaque color; click calls `game.goToLandmark(i)`. All input is ignored while a plaque or the collection is open.
- `CatMesh`: primitives in `#18130f` (capsule body, sphere head, cone ears, tube tail, four legs), positioned each frame at `toThree(catWorldPos(game.cat, game.rot & 3))`. It yaws toward the screen direction of travel, swings its legs with `cat.phase` while walking, and has `castShadow=false` (its own shadow comes in Task 10).
- `Controls(props: { onTurn(dir: 1 | -1): void; onOpenCollection(): void; landmarks: {title: string}[]; onLandmark(i: number): void; waypointOnTurn: boolean })`. Bottom left: the hint "click to walk · q / e or ⟲ ⟳ to turn", where ⟲ and ⟳ are `<button aria-label="Turn the world left/right">`. Top right: a "The Collection" button. A visually hidden list of buttons "Walk to {title}" becomes visible on focus. Keyboard: Q / ArrowLeft and E / ArrowRight turn when no overlay is open.
- The in-world plaque renders `<Overlay>` with `<Plaque entry={entryForLandmark(title)} onClose>`. The desktop collection renders `<Overlay label="The Collection">` around `<Collection/>` content (reuse the same entries; the server `<section>` stays for SEO).

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Manual check with `bun dev`** in a real browser at 1440×900: walk to every landmark (Veil and Blink after one turn), turn with Q/E and with the buttons, try every Review Focus #5 behavior (Esc, outside click, close button, focus return, video stops, Q/E inert under an overlay), and spam clicks and keys during a walk. Then screenshot a walk mid-seam (the cat crossing from the piazza to the gallery) and confirm the cat isn't hidden behind geometry.
- [ ] **Step 3: tsc, lint, build green. Commit:** `feat: playable piazza`.

### Task 8: Entrance, waypoint and memory

**Files:**
- Create: `components/Scene/Waypoint.tsx`
- Modify: `components/Piazza/Piazza.tsx`, `components/Identity/Identity.module.css`, `components/Controls/*`

**Interfaces:**
- Entrance (play mode only). Piazza sets `document.documentElement.dataset.phase` through `title → descent → settled`:
  - First visit: title holds 1.2s, then descent for 1.8s.
  - Returning visit (`memory.visited`): no hold, 0.9s descent.
  - Reduced motion: `settled` immediately.
  - Any click or keydown before `settled` jumps to `settled`.

  During `title` and `descent`, the Identity is centered and large. On `settled` it transitions (transform plus font-size; the links fade in) to the top-left corner. The camera pan: `entranceOffset` (a ref read in `useFrame`) eases from 14 to 0 world units of target height during `descent`. The camera *direction* never changes, so the isometry holds the whole time. Input to the game is ignored until `settled`. `saveMemory({ visited: true })` runs on `settled`.
- `Waypoint({ landmark })`: a drei `<Html>` anchored 1.6 units above the landmark's top center, inside the rotating group. It's a gold `#f3d37a` outlined diamond with a filled core and a dashed tether down, labeled "Radiant · click to walk" in mono. It bobs ±4px over 1.6s (static under reduced motion) and is clickable (it calls `goToLandmark`).
- Tutorial wiring: `step` starts at `loadMemory().tutorial`, and every change goes through `saveMemory({ tutorial })`.
  - `step === "radiant"`: render the Waypoint on Radiant.
  - `step === "turn"`: Controls renders the waypoint beside the turn buttons with "turn the world, other paths appear".
  - Feed `nextStep` with `plaqueClosed` when the in-world plaque closes (with that landmark's title), `turned` on the `turned` event, and `dismissed` from a small "×" on the waypoint label.
- Tower memory: on `visibilitychange` to `visible` (not the first load), call `game.growTower()`, bump the Voxels `version`, and `saveMemory({ towerTop: game.world.towerTop })`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Manual check with `bun dev`**, starting with localStorage cleared: a full entrance (about 3s), then the waypoint on Radiant, walk, close the plaque, the waypoint moves to the turn buttons, turn, and it's gone. Reload: the short entrance plays and there's no waypoint. Switch tabs and come back: the tower is one taller. Reload: the tower is still taller. Toggle reduced motion in DevTools rendering: no entrance and a static waypoint. Clear storage and check the first visit again.
- [ ] **Step 3: tsc, lint, build green. Commit:** `feat: piazza entrance, waypoint tutorial and memory`.

### Task 9: Phone painting, fallback and accessibility

**Files:**
- Modify: `components/Piazza/Piazza.tsx`, `components/Scene/Scene.tsx`, the Piazza CSS
- Create: `components/Piazza/SceneBoundary.tsx` (error boundary)

**Interfaces:**
- `painting` mode: Piazza mounts `Scene` with `interactive={false}` inside the 60vh painting area, under the Identity. The canvas gets `pointer-events: none`, `dpr={[1, 1.5]}` and shadow `mapSize` 1024. The cat dozes: no walk, a slow 4s breathing scale of ±2%, and eyes closed except for a blink every 6–10s. Rendering pauses (`frameloop="never"`) when the painting area is out of view (IntersectionObserver) and when `document.hidden`. No entrance and no waypoint.
- `SceneBoundary` wraps Scene. On a render error, or a `webglcontextlost` event on the canvas, it sets `data-mode="fallback"` and unmounts the scene, leaving the static `/piazza.png` and the Collection.
- Mode changes at runtime (the matchMedia listener from Task 7) switch between play and painting without a reload: close open overlays, then remount the scene with the new props.
- Accessibility check: Tab order goes identity links, The Collection, turn buttons, then the landmark list. Every icon-only control has an aria-label, the plaque headings are in order, and the decorative canvas has `aria-hidden`.

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Verify:**
  - Use `scripts/shot.sh` at 390×844 with the Chrome flag `--touch-events=enabled`. If the shot doesn't emulate a coarse pointer, check in Chrome DevTools device mode instead. Expect the live painting, the identity block, and the collection below.
  - Force a fallback by temporarily throwing in Scene: confirm the static image and the collection, then remove the throw.
  - Narrow a desktop window below 480px and back: the layout switches both ways with no reload.
  - Run a Lighthouse accessibility audit on `/` in both modes and record the scores in the commit body. Target ≥ 95.
- [ ] **Step 3: tsc, lint, build green. Commit:** `feat: piazza phone painting and fallback`.

### Task 10: Atmosphere, the wrong touches and stills

**Files:**
- Create: `components/Scene/PaintEffect.ts`
- Modify: `components/Backdrop/*`, `components/Scene/CatMesh.tsx`, `components/Scene/Scene.tsx`
- Dependencies: `@react-three/postprocessing@^3 postprocessing`
- Create assets: `public/piazza.png`, `public/still-relic.png`, `public/still-eks.png`

**Interfaces:**
- Train (Backdrop): an SVG locomotive plus 3 carriages in `#18130f` running along the horizon line. Every 34s it makes one 16s crossing, left to right, with smoke puffs that rise, grow and fade. It's absent under reduced motion.
- Grain and vignette: CSS overlays above canvas and backdrop, with `pointer-events: none`. Grain is an SVG `feTurbulence` tile at about ±3.5% luminance; its offset jumps 10 times per second via `steps()` (static under reduced motion). The vignette is a radial gradient matching `1 − smoothstep(0.35, 0.9, dist)`, scaling brightness from 0.62 to 1.
- `PaintEffect`: a custom `postprocessing` `Effect` on the canvas, ported from `piazza/post.kage`. It applies a horizontal shimmer of `sin(y·0.012 + t·0.7)·0.7px`, a canvas weave of `sin(x·1.9)·sin(y·1.9)·0.018` and a warm tint of `(1.04, 1, 0.9)`. Disabled under reduced motion (except the tint) and in painting mode on low-end devices (`navigator.hardwareConcurrency <= 4`).
- Cat's wrong shadow: a `#35271f` plane at 0.6 opacity lying on the cat's current top face. It's an elongated teardrop (prototype `cat.go` 39–48: length 1.9, width 0.13), pointing **toward** the sun in world space.
- Eyes follow the cursor: two `#c9d84a` eye meshes offset up to 0.018 world units toward the pointer's screen direction from the head (pointer from R3F state). In painting mode they're closed or blinking (Task 9).
- Stills (one-off capture, committed as PNGs): add a `?capture=scene|relic|train` dev-only behavior to Piazza, ignored in production builds (`process.env.NODE_ENV !== "production"`). It hides the UI, skips the entrance, and:
  - `scene`: frames the default view.
  - `relic`: zooms 3× onto Relic's column at r0.
  - `train`: freezes the train mid-crossing and frames the horizon.

  Capture with `scripts/shot.sh` (scene 1600×1000; relic and train 1280×720) into `public/`.

- [ ] **Step 1: Implement and capture.** View each PNG. Each should look like a painting, not a screenshot of a 3D app. Retake if the UI leaks in.
- [ ] **Step 2: Manual check with `bun dev`:**
  - The train passes and looks right.
  - The cat's shadow points the opposite way from every other shadow, at all 4 rotations.
  - The eyes track the cursor.
  - The grain is barely noticeable at normal viewing distance.
  - Performance: Chrome performance panel at 1440×900 averages ≥ 55fps on this machine.
- [ ] **Step 3: tsc, lint, build green. Commit:** `feat: piazza atmosphere and stills`.

### Task 11: Writeup restyle, cleanup, docs

**Files:**
- Delete: `components/{About,Heartbeat,Projects,Project,InProgress,Footer,Demo}`
- Modify: `components/Writeup/Writeup.module.css`, `components/BackButton/BackButton.module.css`, `app/projects/radiant/page.tsx` (only if it uses removed CSS variables), `CLAUDE.md`

**Interfaces:**
- The writeup page renders on the plaque palette: `--plaque` background, `--ink` text, the serif and mono fonts, and links in `--link-on-plaque`. The back link reads "Back to the piazza" and goes to `/`.
- CLAUDE.md: rewrite Project Overview, Project Structure, Styling, Type and Motion for the piazza. Cover the engine and renderer split, data-mode, the palette tokens, the fonts, the motion rules (the entrance and waypoint are the only scripted motion; reduced motion is honored), the credit requirement, and `bun test`. Remove the lab-notebook and heartbeat sections.

- [ ] **Step 1:** Run `grep -rn "components/\(About\|Heartbeat\|Projects\|Project\|InProgress\|Footer\|Demo\)" app components lib text`. Expect no hits, then delete the folders. Grep the old CSS variables (`--color-`, `--font-display`, `--grid-size`, `--ease-spring`) across `app components`, and replace any remaining uses with the new tokens.
- [ ] **Step 2:** Run `bun test && bunx tsc --noEmit && bun run lint && bun run build`. Expect all green. Then run `bun run start` and check that `curl -sI localhost:3000/projects` shows a 308 to `/` and `/projects/radiant` returns 200. Screenshot `/projects/radiant` and view it.
- [ ] **Step 3: Commit:** `update: retire old home components, restyle writeup, document the piazza`.
