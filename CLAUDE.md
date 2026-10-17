# CLAUDE.md

## Project Overview

Personal portfolio website built with Next.js 15 (App Router), TypeScript, and React 19. Uses Bun as the package manager.

The home page is **the piazza**: a small isometric, Escher-like de Chirico square rendered live in three.js. A cat walks where tiles *look* connected on screen, the world turns in quarter steps, and each landmark opens a museum plaque for a project. Everything is also reachable as plain HTML (identity block + The Collection), and long-form writeups live on their own routes. For depth read the spec `docs/superpowers/specs/2026-10-17-piazza-site-design.md` and the plan `docs/superpowers/plans/2026-10-17-piazza-site.md` (plus `HANDOVER.md`, if present locally). The Go prototype in `piazza/` is the sketchbook the engine was ported from; it is never shipped.

## Commands

- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint
- `bun test` — engine and content unit tests (`lib/piazza/`, `text/`)
- `bunx tsc --noEmit` — type check
- `scripts/shot.sh <url> <out.png> <w> <h>` — headless Chrome screenshot
- `scripts/stills.sh [base-url]` — regenerate `public/piazza.webp` and the `still-*.webp` stills from a running dev server (uses the dev-only `?capture=scene|relic|train` views)

## Project Structure

- `app/` — Next.js App Router
  - `app/page.tsx` — the piazza: the inline `MODE_SCRIPT`, `Identity`, `#stage` (with `Piazza`), `Collection`
  - `app/projects/radiant/page.tsx` — Radiant writeup (`/projects` itself 308-redirects to `/` via `next.config.ts`)
  - `app/layout.tsx` — root layout and fonts
  - `app/globals.css` — palette tokens and the per-mode page layout
  - `app/opengraph-image.tsx` — OG card (still the old site's design; colors inlined by hand)
- `lib/piazza/` — the engine, pure TS with no React/three/DOM imports (only `memory.ts` touches `localStorage`, defensively). World and walking rule, projection (`view.ts`) and its three.js mapping (`space.ts`), cat, game controller, mode/entrance picking, first-visit tutorial, return-visit memory. Tested with `bun test`, partly against golden output from the Go prototype
- `components/` — React components, each in its own folder
  - `Piazza/` — client shell: owns the Game, live `data-mode`, the entrance (`useEntrance`), tutorial, overlays; `SceneBoundary` falls back on render errors or WebGL context loss
  - `Scene/` — the R3F renderer: orthographic iso camera, merged voxel meshes, cat, props, waypoint, picking, `PaintEffect` (shimmer/weave). Reads per-frame state from the Game in `useFrame`, never React state
  - `Backdrop/` — sky, ground, city and the passing train (CSS), plus grain/vignette atmosphere
  - `Identity/` — server-rendered name, role, LinkedIn/GitHub; visible before any JS
  - `Controls/` — turn hint and buttons, The Collection button, keyboard "Walk to …" route
  - `Overlay/` — `<dialog>` modal for a plaque or The Collection
  - `Plaque/` — framed work + cream label; one component for every view
  - `Collection/` — every plaque, About first; server-rendered
  - `Contributor/` — a collaborator's linked name on a plaque's "with:" line
  - `VideoPlayer/` — demo video inside a plaque frame
  - `Writeup/`, `BackButton/` — long-form writeup layout and its "Back to the piazza" link
- `text/` — content as typed TS constants (`AboutText`, `ProjectList`, `collection` = display order + landmark lookup)
- `types/` — shared interfaces (ProjectProps, DemoProps, ContributorProps)
- `scripts/` — screenshot and stills tooling
- `public/` — videos, stills (`.webp`), images

## Conventions

### Components

Each component lives in its own folder: an `index.ts(x)` barrel, `Foo.tsx`, and `Foo.module.css`.

### Engine and renderer

Game logic belongs in `lib/piazza/` as plain TS with tests; components only render it and route input. Keep the engine free of `react`, `three` and DOM APIs (test files may import three).

### Modes and phases

Home page only: `MODE_SCRIPT` (`lib/piazza/mode.ts`, inlined at the top of `app/page.tsx`) sets `html[data-mode]` before first paint: `play` (full-viewport interactive scene, no page scroll), `painting` (phones: the scene as an untouchable living painting in a scrolling page) or `fallback` (no WebGL: static `/piazza.webp` + scrolling Collection). Absent (no JS) behaves as fallback. CSS layout per mode lives in `globals.css`. In play mode without reduced motion it also sets `html[data-phase]` (`title` → `descent` → `settled`; absent = settled) for the entrance, with a failsafe that settles on its own. `Piazza` keeps `data-mode` live and clears these attributes when it unmounts, so other routes (writeups) never carry them. `pickMode`'s rule and `PAINTING_QUERY` must stay equivalent.

### Styling

CSS Modules; use the tokens on `:root` in `app/globals.css`, don't hardcode palette colors. The palette is taken verbatim from the prototype: `--sky-top --sky-mid --sky-horizon` (and `--stage-sky`, the shared sky/ground gradient), `--ground-top --ground-bottom --city`, `--plaque --ink --ink-muted --frame --gilt --link-on-plaque`, `--flag --gold`. The document is dark (`color-scheme: dark`); plaques and writeups are cream `--plaque` with `--ink` text and `--link-on-plaque` links (keep ≥ 4.5:1). A writeup switches the document to light itself (an inline `<style>` in `Writeup`).

Design language: a quiet museum. Flat Lambert/toon materials, hard shadows, simple primitive props, no PBR or gloss. Plaques are a dark frame with a gilt line over a cream label; spacing separates content, no pills or decorative borders.

Type: `--font-serif` (EB Garamond; titles in true small caps) for everything set in type, `--font-mono` (IBM Plex Mono) for dates, tech lines and labels.

Motion: the entrance (title card → descent) and the first-visit waypoint are the only scripted motion. Atmosphere loops: the horizon train, canvas grain, air shimmer and the cat's doze in the painting. Everything else answers input (walking, turning, hover). All motion respects `prefers-reduced-motion`: no entrance, train, shimmer, grain flicker or waypoint bob.

### Content

Content is data-driven in `text/`; no project copy in components or the engine. Landmarks find their plaque by title. Collaborator credit (`awesomePeople`) must appear on every project plaque in every view, each name linked via `Contributor`.

### Path Alias

`@/*` maps to the project root (e.g., `@/components/Plaque`).

## Git & Deployment

- Commit message prefixes: `feat:`, `fix:`, `add:`, `update:`
- Vercel auto-deployments
