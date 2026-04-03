# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio website for Vladimir Batocanin, deployed via GitHub Pages. The site is split across three files with no build step, no package manager, and no test framework.

## Deployment

Push to `master` → GitHub Pages rebuilds and serves automatically. To preview locally, open `index.html` directly in a browser or use any static file server:

```
python3 -m http.server
```

## Architecture

- **`index.html`** — Markup only. Fixed/overlaid elements outside `.container`: boot screen, scroll progress bar, custom cursor (dot + ring), particle canvas, blackout overlay, nav, mobile menu. Inside `.container`: sections `#about`, `#experience`, `#projects`, `#stack`, `#contact`, footer, terminal popup, snake modal, command palette, rage/toast messages.

- **`style.css`** — All styles. Ordered as: CSS custom properties (theme vars), component styles (nav, hero, cards, modals), animations, media queries. Dark mode is the default; light mode is toggled via the `html.light` class. `html.blackout` triggers a full-screen blackout overlay for the theme transition.

- **`main.js`** — All interactivity (`defer`-loaded). Key systems:
  - **Boot screen**: typewriter boot sequence on first load; skipped on subsequent visits via `sessionStorage`. Tap/keypress skips it.
  - **Theme toggle**: `startBlackout()` / `lightOn()` — see Key Interactive Behaviors.
  - **Audio engine** (`AudioEngine`): Web Audio API sound cues on section reveal; toggled by the mute button.
  - **Custom cursor**: dot + lagging ring; disabled on touch devices.
  - **Scroll progress bar**: thin accent bar at top tracking page position.
  - **Scroll-spy nav**: highlights active section link; auto-hides nav on scroll-down.
  - **Particle canvas background**: animated floating particles.
  - **Section reveal animations**: IntersectionObserver adds `.visible` and fires an audio cue.
  - **Section count-up numbers**: `[data-target]` spans animate to their target value on reveal.
  - **Terminal**: type `bash` anywhere (not in an input) to open; `Escape` or clicking outside closes it. Supports commands: `help`, `snake`, `clear`.
  - **Snake game**: triggered from the terminal (`snake` command); playable via arrow keys, D-pad, or swipe.
  - **Command palette**: `Cmd/Ctrl+K` opens a searchable command list.
  - **Mobile hamburger menu**: `#nav-hamburger` toggles `#mobile-menu`; `closeMobileMenu()` closes it.
  - **Konami code**: triggers `launchDucks()` — a duck explosion easter egg.
  - **Cursor trail**: `Ctrl+T` toggles a neural-net-style trailing dot effect.
  - **Click sparks**: small particles burst on click.
  - **3D tilt**: project cards tilt on hover.
  - **Rage-click detection**: 6+ clicks within 1.2 s shows a tooltip.
  - **Duck float**: clicking the hero duck triggers a float animation.
  - **Penguin click counter**: clicking the swordguin spins up an arm animation; 10 clicks triggers a victory toast.
  - **Barbell scroll-shake**: the barbell SVG glows and shakes based on scroll speed.
  - **Flying duck animation**: tied to rage-click and Konami code.
  - **URL param greeting**: `?from=linkedin|github|twitter|cv` swaps the hero eyebrow text.

- **`favicon.svg`** — Inline SVG favicon.

## CSS Variables (theming)

```
--bg, --bg-card, --text, --muted, --accent, --border
--font-display ("Nunito"), --font-mono ("IBM Plex Mono")
```

Overridden under `html.light { ... }` for light mode.

## Key Interactive Behaviors

- **Theme toggle**: clicking the moon/sun toggle calls `startBlackout()`. If already in light mode, it switches back to dark directly. Otherwise it adds `html.blackout`, plays a typewriter message, then reveals the candle/torch button. Clicking the torch calls `lightOn()` which removes `html.blackout` and adds `html.light`. The toggle knob slides between moon (dark) and sun (light) positions via CSS.
- **Terminal**: type `bash` anywhere (focus not on an input) to open. `Escape` or clicking outside closes it.
- **Konami code** (↑↑↓↓←→←→BA): triggers `launchDucks()`.
- **Command palette**: `Cmd/Ctrl+K` opens `#cmd-palette`; `Escape` closes it.