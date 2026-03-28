# EcoBench — Benchmark Results Website

## Project Overview

A benchmark results website for displaying and comparing evaluation data. Design language is inspired by Culture Amp's Kaizen design system — clean, purple-accented, card-based layout with modern typography.

## Tech Stack

- **Frontend**: Static HTML/CSS/JS (no build step required)
- **Typography**: Nunito Sans (display), Inter (body), system monospace
- **Styling**: Custom CSS with CSS custom properties (design tokens), no framework
- **JS**: Vanilla JavaScript, no dependencies

## File Structure

```
index.html    — Main page (nav, hero, leaderboard, categories, comparison, methodology, footer)
styles.css    — All styles, design tokens, dark mode, responsive breakpoints
script.js     — Interactivity, placeholder data, rendering logic
CLAUDE.md     — This file
```

## Design Tokens

Colors follow a purple palette (`--purple-50` through `--purple-900`) with neutral grays. Semantic tokens (`--color-primary`, `--color-bg`, etc.) switch between light/dark themes via `[data-theme="dark"]`.

## Data Model

All benchmark data lives in `script.js` as plain JS arrays (`MODELS`, `CATEGORIES`, `HERO_STATS`). These are placeholder values. When real data is ready, replace these arrays or refactor to fetch from an API / JSON file.

### Model schema:
```js
{ id, name, org, avatar, scores: { overall, catA, catB, catC }, date }
```

### Category schema:
```js
{ id, name, icon, desc, tasks, key }
```

## Key Patterns

- **Leaderboard** re-renders on filter button click (sorted by selected category)
- **Comparison** section uses two `<select>` dropdowns and renders horizontal bar charts
- **Theme toggle** respects `prefers-color-scheme` and stores state on `<html data-theme>`
- **Animated counters** in hero stats using `requestAnimationFrame`
- **Score bars** animate width on render via double-rAF trick

## How to Run

Open `index.html` in a browser. No server or build step needed. For local development with live reload, use any static file server:

```sh
npx serve .
# or
python3 -m http.server 8000
```

## Next Steps

- Replace placeholder data with real benchmark results
- Add data loading from JSON/API endpoint
- Expand categories and scoring dimensions as needed
- Add per-model detail pages
- Add chart visualizations (radar chart, line chart for trends)
