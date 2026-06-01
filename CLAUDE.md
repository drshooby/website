# CLAUDE.md

## Project Overview
Personal portfolio website built with Next.js 15 (App Router), TypeScript, and React 19. Uses Bun as the package manager.

## Commands
- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint

## Project Structure
- `app/` — Next.js App Router with real routes
  - `app/page.tsx` — home page (landing with name + nav links)
  - `app/projects/page.tsx` — projects listing
  - `app/projects/radiant/page.tsx` — Radiant project writeup
  - `app/layout.tsx` — root layout (Header + Footer wrap all pages)
  - `app/globals.css` — global styles and CSS variables
- `components/` — React components, each in its own folder
  - `About/` — intro section with bio text
  - `Contributor/` — renders contributor links on project cards
  - `Demo/` — video/image demo display for projects
  - `Footer/` — site footer
  - `Header/` — navigation (breadcrumb on subpages, nav links on home)
  - `InProgress/` — badge shown on in-progress projects
  - `Project/` — individual project card
  - `Projects/` — project list page layout
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
CSS Modules for component styles. Global CSS variables defined in `app/globals.css` (dark theme with sky blue/steel blue accents). Use existing CSS variables rather than hardcoding colors.

### Types
Shared interfaces live in `types/` (ProjectProps, DemoProps, ContributorProps).

### Content
Site content is data-driven via typed arrays/constants in `text/`. Update content there, not in components.

### Path Alias
`@/*` maps to the project root (e.g., `@/components/Header`).

## Git & Deployment
- Commit message prefixes: `deploy:`, `fix:`, `add:`, `update:`
- Commits containing "deploy" in the message trigger Vercel deployment via GitHub Actions webhook
- No test suite currently
