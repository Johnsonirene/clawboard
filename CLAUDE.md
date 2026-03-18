# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (builds manifest first, then Vite on port 5173)
npm run build     # Production build (manifest → tsc → vite build)
npm run preview   # Preview production build locally
```

There are no lint or test commands configured.

**Important**: `scripts/build-manifest.js` must run before the app starts — it scans `/public/data/*.json` and generates `/public/data/manifest.json`. This happens automatically via the dev/build scripts.

## Architecture

**Clawboard** is a static SPA dashboard for visualizing LLM benchmark results. No backend — it loads pre-computed JSON files from `/public/data/`.

### Data Flow

```
/public/data/*.json  →  useBenchmarkData.ts  →  DataContext  →  Pages
```

1. `scripts/build-manifest.js` generates `manifest.json` indexing all benchmark JSON files in `/public/data/`
2. `useBenchmarkData.ts` fetches the manifest, parallel-loads all report JSONs, and computes derived data (rankings, category scores, task matrix, efficiency metrics)
3. `App.tsx` exposes everything via a single `DataContext` — all pages read from it, no prop drilling
4. Pages render via Recharts charts, custom heatmaps, and expandable tables

### Key Files

- `src/hooks/useBenchmarkData.ts` — all data loading and aggregation logic; this is the core of the app
- `src/types/benchmark.ts` — TypeScript interfaces for all data shapes; check here before adding fields
- `src/utils/colors.ts` — score coloring thresholds (red < 0.4 < amber < 0.7 < green), model color palette (10 colors, cycles), rank colors
- `src/utils/format.ts` — score (%), time (m:s), number (k/M/B), date formatters
- `src/App.tsx` — route definitions and DataContext definition (the context type lives here)

### Pages

| Route | Page | What it shows |
|-------|------|---------------|
| `/` | OverviewPage | 4 nav cards to sub-pages |
| `/leaderboard` | LeaderboardPage | Models ranked by average score, expandable per-task details |
| `/category` | CategoryPage | Radar / bar / heatmap tabs for category comparisons |
| `/tasks` | TaskComparisonPage | Sticky heatmap table: tasks × models |
| `/efficiency` | EfficiencyPage | Exec time, per-task time, request counts, token usage |

### Adding Benchmark Data

Drop a new `.json` file into `/public/data/` matching the existing report schema (see `src/types/benchmark.ts`), then restart the dev server — the manifest is rebuilt automatically.

### TypeScript Config

Strict mode is on with `noUnusedLocals` and `noUnusedParameters`. Fix all TS errors before building — `tsc -b` runs as part of `npm run build`.
