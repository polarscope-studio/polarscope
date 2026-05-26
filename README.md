<img width="3093" height="1080" alt="polarscope_1" src="https://github.com/user-attachments/assets/27c2d3e3-20ae-4e81-a663-c51a71231aed" />


# 📡 POLARSCOPE - Antenna Radiation Pattern Visualizer

**by Jack Mitchell — M7PXZ**

**EMAIL:** m7pxzqrz@gmail.com (Bugs & fixes)

**DISCORD:** https://discord.gg/zBAam3TZKf (#polarstudio-dev)

**YOUTUBE:** https://www.youtube.com/@M7PXZ

FAR-FIELD 3D · RF Engineering Tool · Powered By Real Electromagnetics

---

## Overview

PolarScope is a desktop antenna radiation pattern simulator powered by a real NEC-2 electromagnetic solver. Model antennas, simulate impedance, plot 3D far-field radiation patterns, and sweep SWR across frequency all running locally on your machine with no cloud, no server, and no data leaving your device.

Built as an Electron app wrapping a single-file HTML/JS frontend against a local NEC-2 HTTP bridge (necserver.js). The bundled `nec2dxs500.exe` solver handles all electromagnetic computation.

---

## Installation

### Windows

1. Go to "Releases"
2. Download `PolarScope Setup 1.5.0.exe`
3. Run the installer, no admin rights required by default
4. Launch **PolarScope** from the Desktop or Start Menu
5. Click **Start Simulator**

No Node.js, no Python, no external dependencies. Everything is bundled.

VirusTotal: https://www.virustotal.com/gui/file/e959eefa099b9b91dddc08a835fff98e1b9aaaf4d8a7b4e03e82a217c03b047c

### macOS (running from source)

PolarScope runs on macOS via Electron. Because the bundled `nec2dxs500.exe` is a Windows binary, you need to compile the open-source **nec2c** solver natively first. The process takes about 2 minutes.

**Prerequisites**
- [Node.js](https://nodejs.org) 18 or later
- Xcode Command Line Tools
- [Homebrew](https://brew.sh) *(optional — only needed if `autoconf`/`automake` are missing)*

**Steps**

```bash
# 1. Install Xcode Command Line Tools (skip if already installed)
xcode-select --install

# 2. Clone the repository
git clone https://github.com/yuryja/polarscope.git
cd polarscope

# 3. Install Node dependencies
npm install

# 4. Compile the NEC-2 solver for macOS (one-time, ~1-2 min)
bash scripts/build-nec2c-mac.sh

# 5. Launch PolarScope
npm start
```

The build script clones [nec2c](https://github.com/KJ7LNW/nec2c), compiles it with `gcc`, and places the native binary at `NEC/nec2c`. Both Intel and Apple Silicon (arm64) Macs are supported.

> **Note:** The NEC-2 solver runs fully locally — no data leaves your machine.

---

## Features

### 9 Antenna Types
- **Dipole** — Half-wave dipole with feedpoint gap and end-fed option
- **V-Dipole** — Variable apex angle with optional reflector
- **Ground Plane (¼λ GP)** — Vertical with configurable radials and droop angle
- **Yagi-Uda** — Up to 12 directors, optional reflector, per-element editing
- **Turnstile** — Crossed dipoles with optional tilted reflector
- **QFH (Quadrifilar Helix)** — Configurable turns for satellite reception patterns
- **Collinear** — Stacked vertical elements, per-element length control
- **Loop** — Small and full-wave loop with circumference control
- **Helix** — Axial-mode with configurable turns and pitch angle

### NEC-2 Electromagnetic Solver
- Powered by `nec2dxs500.exe` — a real NEC-2 Method of Moments solver
- Full 181×360 far-field radiation pattern (1° resolution)
- Accurate complex impedance (R ± jX Ω) and SWR at the operating frequency
- Sommerfeld ground modelling — height, conductivity, drooped radial clearance
- Lumped loading (LD card) — series R+L at base, centre, or top of driven element
- Physical antenna rotation fed into NEC geometry for accurate ground interaction
- Export ready-to-use `.nec` card decks for external tools (4NEC2, EZNEC, etc.)

### SWR & Impedance Panel
- Real NEC-2 sweep: 51–151 frequency points across 0.35× to 2.2× centre frequency
- Live impedance readout (R ± jX Ω) and SWR at operating frequency
- NEC diamond marker on the curve — colour-coded green (SWR ≤ 2.0) / red (SWR > 2.0)
- JetBrains Mono hover tooltips with frequency and SWR readout
- Resonance frequency and bandwidth detection

### 3D Radiation Pattern Viewer
- Real-time Plotly.js WebGL rendering of NEC-2 far-field data
- Orbit, pan, zoom controls
- 6 snap views (Y, X, Z, -Y, -X, -Z) plus ISO
- 5 colour themes (Dark, Light, Terminal, Space, Amber)
- 5 colormaps (Default Thermal, Jet, Viridis, Plasma, Cool)
- dBi / dBd unit toggle
- Adjustable lobe opacity
- Wireframe mode with theta rings and phi meridians
- Current distribution overlay

### Orientation Control
- V/H pill switch — toggle vertical/horizontal for any antenna type
- Free azimuth and elevation rotation (-180° to 180°)
- Pattern mesh rotates rigidly with antenna orientation
- Flip uses `polFlipped` flag — elevation slider stays at 0° after flip

### Side-by-Side Comparison
- Two independent antenna windows with separate NEC-2 solvers
- Per-window antenna type, parameters, and overlays
- Independent wave propagation and polar slice panels
- Active window indicator and window selector dropdowns

### Wave Propagation Overlay
- Canvas-based 2D animated wavefronts
- Near-Field mode: element-level interference patterns
- Far-Field mode: 64×64 pattern LUT (~20× faster)
- 8 colour themes: Thermal, Ocean, Fire, Neon, Mono, Plasma, Ember, Aurora
- Independent speed control and V/H cut toggle per pane

### Polar Slice Panel
- Interactive 2D scatterpolar gain plot
- Per-angle hover readout with absolute gain
- Gold star markers on lobe peaks
- Dark red star markers on nulls with exact dBi/dBd tooltips
- -3dB reference circle

### Edit Mode
- Per-element length, diameter, and feed point editing
- Live NEC re-solve on every change
- Colour picker per element
- Bidirectional sync with global sliders
- Precision Typing Lock — prevents state overwrites during manual input

### Structural Mast System
- Dynamic 3D lattice tower generation
- Configurable multi-level guy wire lines with slack physics
- Real-time Structural Tension Heatmap
- Automatic ground plane enforcement when tower is active

### Take-Off Angle (TOA)
- Three modes: Strongest, Lowest, Highest
- Orbitable marker label
- Optional beam lines at TOA elevation

### Other Features
- Amateur band labels with QRZ-style colours (2200m through 1.2cm)
- Frequency input with MHz/kHz/GHz selector
- Precision ◀/▶ stepper buttons for exact lengths and angles
- Feedpoint gap control (default 2mm for dipole)
- Splash screen with About, Features, Controls, Links, and Changelog tabs

---

## Architecture

### Electron Desktop App
PolarScope runs as a native desktop app via Electron on **Windows and macOS**. The main process (`main.js`) starts the NEC-2 HTTP bridge at launch and serves the frontend via a `BrowserWindow`.

### NEC-2 Bridge
`necserver.js` wraps the platform-appropriate NEC-2 solver as a local HTTP server on port 7373:
- **Windows** — `NEC/nec2dxs500.exe` (PE32 binary, stdin-driven)
- **macOS / Linux** — `NEC/nec2c` (compiled from source, `-i`/`-o` CLI flags)

Endpoints:
- `POST /solve` — single-frequency full radiation pattern solve
- `POST /sweep` — multi-frequency impedance sweep (no RP card, fast)
- `GET /ping` — server health check
- `GET /debug` — last raw NEC output for diagnostics

### NECBridge.js
Translates the UI state object into NEC-2 card decks:
- GW wires from `geometryArray` with rotation, z-offset, and segment count
- GE / GN (Sommerfeld ground) cards when ground is active
- LD lumped loading cards
- FR frequency cards
- EX excitation cards
- RP radiation pattern card (181×360, 1° step)

### Frontend
Single HTML file (`polarscopemain.html`) — all CSS, JavaScript, and antenna models. Communicates with necserver.js via `fetch()`.

### Key State Design
- `WINS[]` array holds per-window state objects
- `S = WINS[activeWin]` is the active window shortcut
- `defaultState()` returns a fresh state with all parameters
- `_necDirty` flag triggers NEC re-solve on next render

### Pattern Computation
1. Pattern computed in **local antenna frame** via `localField(lx, ly, lz, st)`
2. Mesh points rotated via `rotPt()` for azimuth/elevation rotation
3. Ground reflection applied in **global frame** using true elevation
4. NEC-2 results override the physics model when server is available

### Performance
- `requestAnimationFrame` render throttling
- Pre-computed sin/cos arrays (`Float32Array`)
- 64×64 pattern LUT for wave propagation
- `Plotly.purge()` before `newPlot` to prevent WebGL memory leaks

---

## File Structure

```
polarscopemain.html        — Frontend (single-file app)
polarscopestyle.css        — Stylesheet
NECBridge.js               — UI state → NEC-2 card deck translator
necserver.js               — NEC-2 HTTP server (port 7373)
main.js                    — Electron entry point
package.json               — Electron + electron-builder config
NEC/
  nec2dxs500.exe           — NEC-2 solver for Windows (PE32, 500-segment)
  nec2c                    — NEC-2 solver for macOS/Linux (compiled from source)
scripts/
  build-nec2c-mac.sh       — Compiles nec2c for macOS (one-time setup)
dist/
  PolarScope Setup x.x.x.exe  — Windows installer
README.md                  — This file
TECHNICAL_REFERENCE.md     — Physics & maths reference
LICENSE.txt                — License
```

---

## Tech Stack

- **NEC-2 (nec2dxs500.exe / nec2c)** — Method of Moments electromagnetic solver (Windows / macOS)
- **Electron 28** — Desktop app wrapper (Windows & macOS)
- **Plotly.js 2.27.0** — 3D surface/scatter plots, polar charts
- **Node.js HTTP** — Local NEC-2 bridge server
- **Canvas API** — Wave propagation animation
- **Vanilla JavaScript** — No frameworks, no build tools
- **Google Fonts** — JetBrains Mono, DM Sans

---

## Changelog

### v1.4.0 — NEC-2 Engine & Electron App (25 Apr 2026)

- Full NEC-2 simulation via bundled nec2dxs500.exe (real Method of Moments solver)
- Local HTTP bridge (necserver.js) — impedance, SWR, and full 181×360 radiation pattern
- SWR sweep: real impedance vs frequency curve with 51–151 sample points
- NEC diamond marker on SWR plot — live Z and SWR, colour-coded green/red
- Export .nec deck for use in external tools
- Lumped loading (LD card) — series R+L at base, centre, or top of driven element
- Sommerfeld ground integration — height, conductivity, drooped radial clearance
- V/H orientation pill switch replaces Vertical checkbox and Flip Orientation button
- Pattern mesh rotates rigidly with antenna orientation
- Flip uses `polFlipped` flag — elevation slider stays at 0° after flip
- SWR hover: JetBrains Mono font, frequency + SWR readout, no spike line
- Plot title updates correctly for every antenna type on each render
- Dipole default feedpoint gap changed from 0 mm to 2 mm
- Yagi Units dropdown removed
- Packaged as standalone Windows installer (Electron + NSIS, no Node.js required)

### v1.3.0 — Physics-Driven Q-Factor Engine (31 Mar 2026)

- Universal Dynamic Q-Factor engine replacing hard-coded SWR bandwidths
- Real-time "Pinch" effect: SWR sharpness reacts to geometry, thickness, and ground loading
- Element Diameter UI control with dual-unit (mm/λ) badge system
- Array Complexity Modelling for narrower high-gain Yagi bandwidths
- Intelligent Plotly X-axis auto-scaling based on real-time Q calculation
- Integrated Ground Proximity Loading (h < 0.2λ) into SWR simulation

### v1.2.0 — Structural Mast & Orientation (30 Mar 2026)

- Lattice towers & mast mounting system
- Multi-level guy wire lines with slack physics
- Structural Tension Heatmap
- Yagi Horizontal Mode 3D geometry fixed
- Rotation freedom unlocked (-180° to 180°)
- Flip Orientation button repaired
- Dynamic Editor UI refresh & element sync fixes

### v1.1.0 — Precision & Visualization (30 Mar 2026)

- Precision ◀/▶ stepper buttons on all critical sliders
- Smart 10mm/10° stepping across all unit types
- Visual Null Markers on polar plots with exact dBi/dBd tooltips
- 3D structural null scanning (H+V cuts)
- Independent element length tracking in Edit Mode
- Bidirectional unit conversion & live refresh
- Fixed pattern slice Z-fighting

### v1.0.0 — Initial Release (28 Mar 2026)

- 9 antenna types with physics-based field models
- 3D interactive radiation pattern viewer
- Side-by-side antenna comparison mode
- Wave propagation overlay (NF/FF, 8 themes)
- Polar slice panel with hover gain readouts
- Per-element editing in Edit Mode
- Ground reflection modelling
- Draggable & resizable overlay panels
- Take-off angle analysis
- 5 colour themes, 5 colormaps
- Splash screen

---

## Known Limitations

- **Element coupling**: Not modelled in the physics fallback — NEC-2 handles this correctly when the server is running
- **Mobile**: Not supported — Electron app is Windows desktop only
- **Far-field only**: Near-field in wave propagation is approximate (spherical wave superposition)

---

## Support

If you find this tool useful, consider buying me a coffee!

☕ **[paypal.me/mitchkmn](https://www.paypal.me/mitchkmn)**

73 de M7PXZ 🤙

---

*Powered By Real Electromagnetics · Built with Electron & Plotly.js · Created by Jack Mitchell — M7PXZ*
