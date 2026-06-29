# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing two independent FICO score simulation prototypes. They are **separate Vite apps** with no shared code—each has its own `package.json`, `node_modules`, and dev server.

- `driving-score/` — FICO Safe Driving Score (telematics-based, 150–800 scale)
- `credit-score/` — FICO Credit Score (traditional credit factors, 300–850 scale)

Both apps have an identical file structure and parallel architecture but different scoring domains, color themes, and input parameters.

## Commands

### Root-level (from `live-prototype/`)

```bash
npm run dev          # Start BOTH dev servers (driving :5173, credit :5174)
npm run dev:driving  # Start only the driving score server
npm run dev:credit   # Start only the credit score server
npm run build        # TypeScript check + production build for both apps
npm run lint         # Lint both apps
```

### Per-app (from `driving-score/` or `credit-score/`)

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build (tsc -b && vite build)
npm run lint     # Run oxlint
npm run preview  # Preview production build locally
```

### Cleanup

```bash
taskkill //F //IM node.exe   # Kill all Node processes (MINGW64/Git Bash)
taskkill /F /IM node.exe     # Kill all Node processes (PowerShell/CMD)
```

The root `package.json` uses `concurrently` to run both dev servers in a single terminal. Each app also has its own `package.json` and can be run independently.

## Architecture

Each app follows the same pattern:

```
src/
  App.tsx              # Root component: state management, layout, demo profile selector
  main.tsx             # React entry point
  index.css            # Tailwind v4 import + @theme custom color tokens
  lib/scoring.ts       # Pure scoring engine (no React dependencies)
  data/demos.ts        # Preset demo profiles (e.g., "Low Risk", "High Risk")
  components/
    InputPanel.tsx     # Slider-based input form with collapsible tier sections
    ScoreGauge.tsx     # SVG semicircular gauge with animated needle
```

### Scoring Engine (`lib/scoring.ts`)

The scoring logic is the core of each app. Key design:

- **Weighted tiers**: Each score is composed of multiple tiers with explicit percentage weights (e.g., driving: Behavior 50%, Trip Context 30%, Profile 20%; credit: Payment History 35%, Amounts Owed 30%, History Length 15%, New Credit 10%, Credit Mix 10% — matching the real FICO five-factor model)
- **Normalize-and-weight pattern**: All inputs are normalized to 0–1 via `normalize()` (with optional invert for "lower is better" inputs), then multiplied by sub-weights within each tier
- **Score floors**: Both apps have a minimum score (driving: 150, credit: 300) so the worst possible inputs still produce a realistic baseline, not zero
- **`INPUT_BOUNDS` export**: Defines min/max/step/unit for every input field—used by both the scoring engine and `InputPanel` sliders
- **`generateHints()`**: "What-if" engine that tests multiple improvement targets (25%, 50%, and minimum) for each improvable input, picks the best gain, and returns the top 3. Only includes inputs the user can realistically change (e.g., excludes `totalDebt` from credit hints)
- **Top factors**: Sub-factors are ranked by deviation from optimal (`(1 - normalizedValue) * weight`), prioritizing negative factors first—shows what's actually hurting the score, not just which weights are biggest

### State Flow

`App.tsx` owns all state. Score calculations and hint generation are wrapped in `useMemo` to avoid redundant recomputation. Inputs flow down to `InputPanel` and scoring results flow down to `ScoreGauge` and the tier/factor/hint display sections. Demo profiles replace the entire input state when selected.

## Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (not PostCSS)—configured in `vite.config.ts`
- Custom color tokens defined in `index.css` using `@theme {}` blocks (not `tailwind.config`)
- Driving score uses a navy/blue theme (`navy-*`, `accent` = blue)
- Credit score uses a charcoal/gold theme (`charcoal-*`, `gold-*`)
- Score category colors: poor=red, fair=orange, good=green, excellent=emerald (credit uses 5 categories: Poor, Fair, Good, Very Good, Exceptional — matching real FICO terminology)
- All color references in JSX use CSS custom properties (`var(--color-*)`) or Tailwind token classes—no hardcoded hex values in component code

## Accessibility

- All slider inputs include `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `aria-valuetext`
- Score gauges use `role="figure"` with descriptive `aria-label` (score value + category)
- Decorative elements (color dots, chevron icons) are marked `aria-hidden="true"`
- Collapsible tier sections use `aria-expanded`

## SVG Gauge Implementation

The `ScoreGauge` component renders a semicircular gauge with an animated needle. The needle is clipped via SVG `<clipPath>` to avoid overlapping the score text in the center—not an opaque background rect. Both gauges accept `minScore` and `maxScore` props and compute tick labels dynamically from the range.

## Tech Stack

- React 19, TypeScript 6, Vite 8
- Linting: oxlint (not ESLint)
- No test framework configured
- No routing, no backend, no API calls—pure client-side simulation
