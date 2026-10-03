# CLAUDE.md

## Project Overview

Personal portfolio website built with Next.js 15 (App Router), TypeScript, and React 19. Uses Bun as the package manager. Single-page design: bio and projects together on the home page, with long-form writeups on their own routes.

## Commands

- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint

## Project Structure

- `app/` — Next.js App Router
  - `app/page.tsx` — home page (bio + full project list)
  - `app/projects/radiant/page.tsx` — Radiant project writeup (`/projects` itself 308-redirects to `/` via `next.config.ts` so old links don't break)
  - `app/layout.tsx` — root layout
  - `app/globals.css` — global styles and CSS variables (single light `:root` palette)
- `components/` — React components, each in its own folder
  - `About/` — bio section on home
  - `BackButton/` — "Back to …" link at the bottom of writeups
  - `Contributor/` — a collaborator name link, listed on a project's mono "with:" line
  - `Demo/` — video/image demo media below project text
  - `Footer/` — currently unused (not rendered anywhere)
  - `Heartbeat/` — ECG-style divider between About and Projects; draws and pulses once per visit, then rests faint
  - `InProgress/` — animated "Building" label shown inline with the date on in-progress projects
  - `Project/` — individual project entry (text-first: title, date, description, tech list, links, then media)
  - `Projects/` — projects section on home; owns the game-menu ▸ hover cursor
  - `VideoPlayer/` — custom video player wrapper
  - `Writeup/` — long-form project writeup layout
- `types/` — shared TypeScript interfaces (ProjectProps, DemoProps, ContributorProps)
- `text/` — content data as typed TS constants (AboutText, ProjectList)
- `public/` — static assets (videos, images)

## Conventions

### Components

Each component lives in its own folder with three files:

- `index.tsx` — barrel export (`export { Foo } from "./Foo"`)
- `Foo.tsx` — implementation (most use `"use client"`)
- `Foo.module.css` — scoped styles

### Styling

CSS Modules for component styles. Single light theme — the palette is CSS variables on `:root` in `app/globals.css` (blue-ink text, sky/steel blue accents). There is deliberately no dark theme; `color-scheme: light` pins native UI (scrollbars, form controls) to light for visitors whose OS prefers dark. Use existing CSS variables rather than hardcoding colors. `--color-sky` fails contrast on the light background; use `--color-accent` for links/interactive text.

Design language: quiet and editorial, like a lab notebook. No card boxes or decorative borders; whitespace separates content, media is borderless with a soft shadow, and tech tags are muted text lines (pills are reserved for clickable things). Faint graph-paper grid on the page background.

Type: `--font-display` (Instrument Serif) for the name and titles, `--font-mono` (IBM Plex Mono) for dates, tech lines and labels, Jost for body text.

Motion: the heartbeat divider is the page's only load-time moment and plays once per visit. Everything else moves only on hover or press (cursor spring and bob, title nudge and settle bounce, link squash). Don't add loops or entrance animations. All motion respects `prefers-reduced-motion`.

### Types

Shared interfaces live in `types/` (ProjectProps, DemoProps, ContributorProps). `github`/`writeup` links live at the project level, not on the demo.

### Content

Site content is data-driven via typed arrays/constants in `text/`. Update content there, not in components. Which projects show media (and what kind) is a per-project content decision in `text/ProjectList.ts`.

### Path Alias

`@/*` maps to the project root (e.g., `@/components/Project`).

## Git & Deployment

- Commit message prefixes: `feat:`, `fix:`, `add:`, `update:`
- Vercel auto-deployments
