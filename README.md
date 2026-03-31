# vbatocanin.github.io

Personal portfolio site for Vladimir Batocanin — software engineer, PhD candidate, duck enthusiast.

Single-file static site (HTML + CSS + JS), deployed via GitHub Pages on push to `master`.

---

## Running locally

```
python3 -m http.server
```

Then open `http://localhost:8000`. No build step, no dependencies.

---

## What you can do

### Theme

Click the moon/sun toggle in the nav. On the way to light mode: the lights go out, a candle appears, and you have to pick it up before the page comes back. Clicking the sun again skips the ceremony and goes straight back to dark.

### Sound

The speaker icon in the nav enables reactive audio (off by default). Once on: nav clicks, terminal keystrokes, the blackout transition, and the Konami ducks all have distinct Web Audio API-generated sounds — no external files.

### Command palette

`⌘K` / `Ctrl+K` from anywhere. Fuzzy-searchable. Covers navigation, theme, terminal, external links, and a couple of secrets. Also available as `palette` or `cmd` in the terminal.

### Terminal

Type `bash` anywhere on the page (not in an input field) to open it. Available commands:

| Command | What it does |
|---|---|
| `help` | list all commands |
| `ls` | directory listing |
| `git log` | authentic-looking commit history |
| `whoami` | who dis |
| `sudo hire vladimir` | makes the smart choice |
| `cat duck.txt` | important document |
| `cd secrets/` | authentication failure |
| `rm -rf /` | nice try |
| `date` | current UTC time |
| `palette` | open command palette |
| `clear` / `exit` | self-explanatory |

### Navigation

- The nav hides on scroll-down and reappears on scroll-up.
- The active section is highlighted in the nav pill.
- Nav links have a subtle magnetic pull on hover (desktop only).
- On mobile: hamburger menu with full-screen overlay.

### Animations

- Section headers scramble and re-form when they scroll into view.
- Tech tags and contact links stagger-animate in.
- Experience rows slide in from the left.
- Project cards tilt in 3D on hover.
- The hero name and description have a parallax offset on scroll.
- Count-up numbers in the About section animate when reached.
- A particle constellation runs in the background and reacts to the cursor.

### First visit

A boot sequence plays before the page appears. It types out kernel-style lines, then fades away. Press any key or click to skip. Does not repeat on the same session.

---

## Easter eggs

<details>
<summary>Spoilers — expand to see all of them</summary>

- **Konami code** (`↑↑↓↓←→←→BA`): spawns 18 ducks that fly off the screen, each with a quack.
- **Click the maze icon** on the Genetic Maze Generator project row: opens a playable snake game.
- **Click the swordguin** (penguin with sword, Wings Software): speeds up the sword swing. Hit 10× for a victory toast.
- **Click the duck** in the hero section: it bounces.
- **`Ctrl+T`**: toggles a neural-net cursor trail. Toggle off to remove it.
- **Rage click** (6+ clicks within 1.2 seconds): a sassy tooltip appears next to your cursor.
- **Scroll fast** near the Spider Gym barbell: it glows and shakes proportional to scroll speed.
- **URL parameters**: append `?from=linkedin`, `?from=github`, `?from=twitter`, or `?from=cv` to get a personalised greeting in the hero eyebrow.
- **`sudo hire vladimir`** in the terminal: opens a mailto link after a fake auth sequence.

</details>

---

## Files

```
index.html   — markup
style.css    — all styles
main.js      — all interactivity
favicon.svg  — site icon
```
