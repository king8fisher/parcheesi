# AGENTS.md

Guidance for agents (and humans) working in this repository.

## Project

Parcheesi — a browser Parcheesi board game built with Next.js 16, Pixi.js v8,
React 19 and TypeScript. Originally designed as a local hot-seat game on a
single device; now evolving toward online multiplayer.

- Game runtime: `src/app/parcheesi.ts` (`GameBoard`, `GameBoardMenu`, supporting graphics classes).
- Bootstrap: `src/app/main.ts` wires the renderer, loads assets, creates the menu/game lifecycle.
- Canvas host: `src/components/GameCanvas.tsx`.
- Package manager: **pnpm** (via `mise` + corepack). Do not use `npm` or `yarn`.
- Node: pinned to `22` by `mise.toml`.

## Commands

- **ci**:
  1. `pnpm tsc --noEmit` — type-check
  2. `pnpm lint` — lint (`eslint .`)
  3. `pnpm test` — run all tests (`vitest --run`)
- **test**: `pnpm test` — run all tests once
- **test-watch**: `pnpm test:watch` — watch mode
- **test-file**: `pnpm vitest run <file>` — run a single test file
- **lint**: `pnpm lint`
- **dev**: `pnpm dev` — local Next.js dev server
- **build**: `pnpm build`

> Note: `vitest` is referenced by `package.json` scripts but is not yet in
> `devDependencies`. The first step that introduces tests must add
> `vitest` (and `@vitest/ui` if desired) to `devDependencies` and configure
> it for the project.

## Planning

This project uses the `docs/prd/` + `docs/impl/` planning structure.

- **Goals**: `docs/prd/01-goals.md`
- **Multiplayer design brainstorm**: `docs/prd/02-multiplayer.md`
- **Known bugs**: `docs/prd/bugs/README.md`
- **Step Index (source of truth for progress)**: `docs/impl/README.md`

When adding work, use `/plan-step`. When implementing, use `/implement-step`.

## Conventions

- TypeScript strict. No `any` unless justified with a comment.
- Keep Pixi rendering code in `src/app/*.ts`. React components stay thin.
- New utility modules go under `src/app/` or `src/lib/` (create `src/lib/` as needed).
- Test files live next to source as `*.test.ts` or under `test/` — either is fine, pick one per sub-tree and stay consistent.
- Never attribute commits/PRs to an AI agent.
