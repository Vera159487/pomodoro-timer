# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Apple-style Pomodoro timer with two coexisting implementations, ordered by readiness:

| Artifact | Type | Status |
|----------|------|--------|
| `pomodoro-timer.html` | Single-file HTML (full-featured) | ✅ Ready — open in browser |
| `pomodoro-app/` | Electron + React + TypeScript + TailwindCSS | ⚠️ Blocked — Electron binary can't download on this network |

## Development Commands

Both `.html` files are **zero-dependency, zero-build** — open them directly in a browser to test.

For the Electron project (when network permits):
```bash
cd pomodoro-app
npm install          # install deps (536 packages)
npm run dev          # start electron-vite dev server
npm run build        # production build to out/
npm run package      # build + package with electron-builder
```

## Architecture

### Shared patterns across all implementations

- **Timer core**: `setInterval`-based countdown, state machine with modes (`work` → `break`/`long-break` → `work`), auto-switch on completion.
- **SVG ring progress**: `circle` with `r`, `stroke-dasharray` = `2 * π * r`, `stroke-dashoffset` = `circumference * (1 - progress)`.
- **Theming**: CSS custom properties on `<html>` or attribute selectors (`html.dark`, `html.light`, `[data-theme="dark"]`).
- **Audio**: Web Audio API — `OscillatorNode` + `GainNode` with `exponentialRampToValueAtTime` for click sounds and sequenced alarm chimes.
- **Persistence**: `localStorage` with `try-catch` wrappers, separate keys for theme, tasks, stats, settings.
- **Keyboard shortcuts**: `keydown` listener — `Space` (toggle), `R` (reset), `1`/`2`/`3` (switch mode).

### `pomodoro-timer.html` — Full-featured

- **4-page SPA**: Timer, Tasks, Stats, Settings — toggled via `.page` visibility and nav buttons.
- **5 theme blocks**: dark, light, forest, ocean, sunset — each a `[data-theme="…"]` selector with full CSS variable overrides.
- **Task management**: Add/edit/delete tasks, estimated pomodoros, active task selection, auto-advance on completion.
- **Statistics**: Daily/weekly/monthly focus time tracking, chart-like bar visualization via CSS, completion streak.
- **Notifications**: Web Notification API + Page Visibility API fallback (chime-only when tab hidden).
- **Code quality patterns** (post `/simplify`):
  - Cached DOM refs via `els` object and `$id()` helper (avoids repeated `getElementById`).
  - Event delegation on parent `<ul>` instead of per-item listeners.
  - Stats cache (`_statsCache`) invalidated on `saveStats()`.
  - History pruned to 365 days; derived state `totalDuration` removed — computed via `getDurationForMode()`.
  - `applyTheme(theme, skipSave)` and `applyCustomColor(color, skipSave)` for deduped saves.

### `pomodoro-app/` — Electron desktop app

- **Main process** (`electron/main.ts`): `BrowserWindow` with `frame: false`, `transparent: true`, `vibrancy: 'under-window'` (macOS). System tray with context menu. IPC handlers for `set-always-on-top`, `get-always-on-top`, `minimize-to-tray`.
- **Preload** (`electron/preload.ts`): `contextBridge.exposeInMainWorld('electronAPI', {…})` — only 3 IPC methods exposed.
- **Renderer** (`src/`): React 19 + TypeScript + TailwindCSS 3. Single `App` component with `useState`/`useEffect`/`useRef` for timer logic. `global.d.ts` declares `Window.electronAPI` interface.
- **Styling** (`src/index.css`): Tailwind directives + custom `.glass`, `.ring-progress`, `.btn-press`, `.mode-switch` classes.
- **Build**: `electron-vite` with separate rollup configs for main/preload/renderer. PostCSS with Tailwind + Autoprefixer.
- **Blocked**: `electron` npm package post-install downloads platform binary from GitHub releases — network-restricted here.

## Key Constraints

- **No Electron binary** available on this machine — can't run or test the `pomodoro-app/` Electron project.
- **Windows PowerShell 5.1** — no `&&` chaining, no ternary/null-coalescing operators, UTF-16 LE default encoding.
- **Git remote**: `git@github.com:Vera159487/pomodoro-timer.git` (SSH auth, HTTPS blocked).
- **DeepSeek API** used as Claude-compatible backend (configured in `~/.claude/settings.json`).
