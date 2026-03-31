# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio website for Vladimir Batocanin, deployed via GitHub Pages. The entire site is a **single file**: `index.html`, with all CSS in an inline `<style>` block and all JavaScript at the bottom of the file. There is no build step, no package manager, and no test framework.

## Deployment

Push to `master` → GitHub Pages rebuilds and serves automatically. To preview locally, open `index.html` directly in a browser or use any static file server:

```
python3 -m http.server
```

## Architecture

The site is three files:

- **`style.css`** — All styles, ordered roughly as: CSS custom properties (theme vars), component styles (nav, hero, cards, modals), and media queries. Dark mode is the default; light mode is toggled via the `html.light` class. A special `html.blackout` class triggers a full-screen blackout overlay used as a theatrical transition when switching themes.

- **`index.html`** — Markup only. Sections in order: `#about`, `#experience`, `#projects`, `#stack`, `#contact`. Each section uses `data-section` attributes for scroll-spy. Fixed/overlaid elements (nav, blackout overlay, terminal popup, snake modal, cursor elements, particle canvas) are declared outside the main `.container`.

- **`main.js`** — All interactivity (`defer`-loaded), including:
   - Custom cursor (dot + trailing ring)
   - Particle canvas background
   - Scroll-spy nav highlighting and auto-hide on scroll-down
   - Dark/light theme toggle with blackout animation sequence
   - Terminal easter egg (open with `` ` `` key or Konami code)
   - Snake game easter egg (triggered from the terminal)
   - Click spark particles and 3D tilt effect on project cards
   - Rage-click detection, flying duck animation, section count-up numbers

## CSS Variables (theming)

```
--bg, --bg-card, --text, --muted, --accent, --border
--font-display ("Nunito"), --font-mono ("IBM Plex Mono")
```

Overridden under `html.light { ... }` for light mode.

## Key Interactive Behaviors

- **Theme toggle**: clicking the moon/sun button calls `startBlackout()`, which plays a typewriter animation on the blackout screen, then swaps `html.light` and removes `html.blackout`.
- **Terminal**: toggled by `` ` `` key; supports commands like `help`, `snake`, `clear`.
- **Konami code**: triggers an easter egg overlay.
- **Torch button**: appears on the blackout screen; clicking it calls `lightOn()` to exit the blackout immediately.
