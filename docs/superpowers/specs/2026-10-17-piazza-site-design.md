# The Piazza: davidshubov.com rebuilt as a walkable painting (Phase 1)

Date: 2026-10-17 · Branch: `piazza` (all work stays on this branch)

Background reading: `HANDOVER.md` (repo root) explains the origin, the Go
prototype in `piazza/`, the walking rule, the palette and the rendering notes.
This document records what Phase 1 must deliver and the decisions made since.

## Intent

David's portfolio is being replaced with an interactive art piece: an
isometric scene of Escher-style impossible walkways painted in de Chirico's
dusk palette. A small black cat walks between landmarks, and each landmark is
one of his projects. The goal is "art, not polish". The site should feel
slightly wrong, the kind of thing that makes people say "okay, that's kinda
cool". It must still do the job of a portfolio.

Guiding principle (from the handover): **wrong in feel, never wrong in
function.** Navigation always works, content is always readable, and links go
where they say. The strangeness lives in shadows, timing, memory and physics.

## Goals for Phase 1

Every first-time visitor, on any device, should come away with:

1. **What David does:** cloud and infrastructure software engineer.
2. **How to see his projects**, if they care to look.
3. **His LinkedIn**, visible without hunting.

Success test: a stranger on desktop knows his role and has seen the LinkedIn
link within a few seconds. Within about 10 seconds they have walked the cat to
a project and seen its demo, without reading instructions.

## Anti-goals (failure even if it technically works)

- **A visitor dropped into an empty world with no idea how to navigate.**
  David's words: "bad ux == nobody wants to visit." This is the most
  important anti-goal and drives the guidance system below.
- Content that is only reachable by playing.
- Name, role or LinkedIn hidden behind WebGL loading, an animation or a click.
- Drifting into a generic glossy "3D website" look (see style guardrails).

## Non-goals for Phase 1

- New landmarks for Blueprint or EKS (they appear in the collection only).
- Touch gameplay on phones.
- Backlog mechanics from the handover (extra "wrong" behaviors, Penrose
  scrolling, gravity sections, the meowl easter egg, the colophon page).

## The experience

### Desktop (fine pointer)

The piazza **is** the page. It fills the viewport and the page does not
scroll. Projects are reached by playing (walking the cat to a landmark) or
through **The Collection** (below).

**Entrance.** On first visit:

1. *Title card:* dusk sky only. "David Shubov" in large small-caps serif with
   "cloud & infrastructure engineer" beneath, centered like a film title.
2. *Descent:* the camera tilts down from the sky into the isometric view as the
   scene comes in. The title drifts up and shrinks.
3. *Settled:* the title lands in the top-left corner and becomes the permanent
   identity block. The links fade in beneath it.

About 3 seconds in total. A click or any key skips straight to the settled
state. Returning visitors (remembered in `localStorage`) get a **shorter**
version; its exact form is the builder's call (for example, about 1 second
with no hold on the title card). With `prefers-reduced-motion`, the page starts
already settled.

**The identity block must be real HTML and must render before WebGL loads.**
The entrance animates DOM text over the canvas; it is not text drawn into the
canvas.

**Permanent layout once settled** (layout "A", chosen by David):

- **Top left:** name, role, then links: LinkedIn
  (`https://linkedin.com/in/david-shubov`) and GitHub
  (`https://github.com/drshooby`).
- **Top right:** a "The Collection" control.
- **Bottom left:** a control hint that is always visible: "click to walk ·
  q / e or ⟲ ⟳ to turn". The ⟲ ⟳ glyphs are real buttons, so mouse-only
  visitors can turn the world.

**Guidance system** (the answer to the main anti-goal):

- **Waypoint tutorial, first visit only.** It starts once the entrance
  settles.
  1. A game-style waypoint marker (a gold diamond with a dashed tether that
     bobs gently) hovers over **Radiant**'s landmark, labeled "Radiant · click
     to walk".
  2. When the visitor clicks, the cat walks there and Radiant's plaque opens.
  3. When the plaque closes, the waypoint moves to the turn buttons with a
     line like "turn the world, other paths appear".
  4. After the first turn, or if dismissed, the waypoint is gone for good on
     that device (`localStorage`).

  If the visitor clicks another landmark first, that is fine: the waypoint
  simply stays on Radiant until step 2 happens or the visitor turns the world.
- **Hover labels** on every landmark, and a pointer cursor over anything
  clickable.
- **Unreachable message** carried over from the prototype: "From here, the
  way to X cannot be seen." It appears when a landmark can't be reached from
  the current angle.
- **The Collection** is a guaranteed exit from the game for anyone who just
  wants the content.

**Landmarks** are as in `lib/piazza/world.ts`: David Shubov (easel), Relic
(column), Veil (statue), Blink (doorway), Radiant (bananas). Clicking one
walks the cat there and opens its plaque on arrival, as in the prototype.
The David Shubov easel's plaque holds the **full bio** (`text/AboutText.ts`),
not just the first sentence.

**The Collection overlay.** A full-screen overlay over the scene. It opens
with **"About the artist"**: the avatar painting (`piazza/assets/avatar.png`,
copied into `public/`) framed like the other works, with the full bio as its
label. This is the same content as the easel plaque, so the bio is never only
reachable by playing *(Claude's call)*. After that come all six projects in
`text/ProjectList.ts` order, each as a framed work (see Plaque). It closes with Esc, a close button, or a click outside a work. Items
can also offer "find it in the piazza" for projects that have a landmark;
this is optional for Phase 1, builder's call.

### Phone (coarse pointer, narrow viewport)

The scene is **not playable**. It's a living painting at the top of the page
(about 60% of the viewport height): the train passes, shadows are long, the
cat dozes or blinks, and touch does nothing. The identity block (name, role,
links) is overlaid top left, as on desktop. No waypoint, no entrance sequence
(builder's call whether a light fade-in is used).

Below the painting, the page scrolls into **The Collection**: the same framed
works as the desktop overlay, hung one after another down the page.

Tablets and anything with a fine pointer get the desktop experience. The
exact media query is the builder's call; base it on `pointer: coarse` plus
width, not width alone.

### The Plaque (shared by every view)

One component used in three places: the plaque that opens on arrival in the
piazza, items in the desktop Collection overlay, and the phone Collection.

- **A framed demo at the top:** the project's demo video in a dark frame with
  a thin gilt inner line, like a painting on a gallery wall. Reuse the
  existing videos in `public/` and the existing VideoPlayer behavior where
  sensible. Videos never autoplay with sound.
- **Projects without media** (Relic, EKS): a still image in the same frame.
  For Relic, a crop of its broken-column landmark rendered from the scene. For
  EKS, which has no landmark, the train on the horizon (a nod to blue/green
  deployments switching tracks). How the stills are produced (rendered once
  and saved to `public/`, or rendered live) is the builder's call.
- **The museum label underneath:** date (with a red "Building" marker for
  `inProgress`), title in small caps, the full description (markdown links,
  as today), the tech line in mono, the "with:" contributors line, and links
  (GitHub ↗, "Read the writeup →" for Radiant).
- **Collaborator credit is a requirement, not a detail.** Every project's
  `awesomePeople` from `text/ProjectList.ts` appears on its plaque, each name
  linking to that person's LinkedIn or personal site, as the current site's
  Contributor component does. The credit shows wherever the project appears:
  the in-world plaque, the desktop Collection and the phone Collection. This
  matters to David.
- In-world: "click outside to step back" (only the dimmed area outside the sheet closes it; never a click inside, where the links are) plus Esc and a visible close
  control.

Content stays data-driven from `text/ProjectList.ts` and `text/AboutText.ts`.
Landmark plaque text should come from the same data rather than duplicating
it in `world.ts`. The shape of that link (for example, landmarks referencing
projects by title or id) is the builder's call.

### The "wrong" touches carried over from the prototype

- The cat's shadow points **toward** the sun; everything else's points away.
- The cat's eyes follow the cursor.
- **The tower grows one block** each time the tab regains visibility
  (`visibilitychange`). The height persists in `localStorage`, so it is
  taller than the last time you were here. Keep the prototype's cap.
- The train crosses the horizon on a long loop, plus a subtle shimmer, grain
  and vignette.

Under reduced motion: no shimmer, no train, and no waypoint bob (the waypoint
is static).

## Accessibility, fallback, SEO

- All Collection content (bio and all six projects with links) is rendered as
  server HTML so search engines and screen readers get it. On desktop it can
  live in the overlay markup, hidden until opened, as long as it's in the DOM
  and reachable by keyboard.
- **No WebGL** (or a scene error): render the phone layout, with a static
  image of the scene in place of the live painting.
- Keyboard: Tab reaches the identity links, The Collection, the turn buttons
  and the landmarks (as focusable labels or a list); Enter walks to a
  landmark. Q/E turn. Esc closes overlays.

## How it gets made

Decided:

- **Stack:** the existing Next.js 15 App Router + TypeScript + React 19 + Bun
  site on Vercel.
- **Engine:** `lib/piazza/` (already ported from Go and tested: world, walking
  rule, projection, cat state machine, with golden-file parity tests against
  the prototype). It stays plain TS with no React or three imports. Extend it
  there with tests when gameplay logic grows.
- **Renderer: React Three Fiber** (three.js, `@react-three/fiber`, drei,
  `@react-three/postprocessing`), per the handover's decision. Follow the
  handover's "Rendering approach" section: an orthographic camera at true
  isometric angles so screen-key alignment stays exact, 90° world rotation,
  the cat moved along the view axis when it crosses an impossible seam,
  per-frame state in refs and `useFrame` (not React state), and the scene
  lazy-loaded so the identity block and Collection never wait on it.
  **Fallback** if R3F can't meet the style guardrails or the isometric
  alignment: SVG with the prototype's projection and painter's sort. David
  has delegated this decision: the builder judges the step 1 experiment
  against the guardrails and the alignment check, and commits without a
  review stop. The same goes for the other subjective checks (the 10-second
  test, whether the wrong touches land). David trusts the builder to make it
  beautiful and pleasant to use.
- **Style guardrails** (from the handover): flat or toon materials in the
  prototype palette, no glossy PBR, crisp hard-edged shadows, arches as
  cut-outs or dark decals, simple primitive props, and grain + vignette +
  shimmer on top.
- **Palette:** the prototype's (handover → Rendering → Palette). The HTML
  layer (plaques, labels) uses plaque `#efe6cf` with ink `#2b211b`.

Builder's calls:

- Fonts. The current site uses Instrument Serif, IBM Plex Mono and Jost.
  Small-caps serif for titles and mono for labels fit the mockups. Keep
  Instrument Serif or pick a better de Chirico serif.
- Exact timings and easing, the waypoint's final art, and the frame and plaque
  details.
- Camera framing. It must fix the prototype's clipped tower top at rotation 0
  and leave room for a tower that grows to its cap.
- Whether the 2D post effects run in WebGL postprocessing or as CSS/SVG
  overlays.

## What happens to the existing site

- `/` becomes the piazza.
- `/projects/radiant` (the writeup) stays, linked from Radiant's plaque. Bring
  it into the new palette enough that it doesn't feel like a different site,
  and keep the back link to `/`. The `/projects` → `/` redirect stays.
- Components the new home no longer uses (About, Heartbeat, Projects,
  Project, InProgress, Footer and so on) are removed or replaced. Reuse
  VideoPlayer/Demo/Contributor logic where it fits the Plaque.
- `app/globals.css`'s light "lab notebook" palette is replaced by the piazza
  palette. **Update `CLAUDE.md`** to describe the new design language and
  structure; its old motion and theme rules described the previous site.
- Metadata and the OG image: keep working. A new OG image of the piazza is
  nice-to-have, not required.
- The Go prototype in `piazza/` stays in the branch as the sketchbook. Do not
  ship it.

## Where Phase 1 ends

Phase 1 stays on the `piazza` branch, shown through Vercel's preview
deployment for the branch. Merging to `main` (going live) is a separate
decision David makes after Phase 1. Launch checks (metadata and OG image, old
URLs, WebGL performance on real phones) are deferred until then. Deleting old
components and rewriting `globals.css` and `CLAUDE.md` *on this branch* is
expected.

## Order of work (suggested)

1. A static R3F scene experiment: the level as boxes, an isometric
   orthographic camera, a directional light with hard shadows, the palette.
   Verify tiles that should line up do line up across all four rotations.
2. Cat, click-to-walk, rotation, settle. Landmarks and hover.
3. The HTML layer: identity block, controls, Plaque, Collection.
4. The entrance, the waypoint tutorial, and `localStorage` memory.
5. The phone layout, the no-WebGL fallback, accessibility, reduced motion.
6. Post effects, the train, the wrong touches.
7. Radiant writeup restyle, cleanup of old components, CLAUDE.md.
