# 📡 Antenna Radiation Pattern Visualizer

**by Jack Mitchell — M7PXZ**

FAR-FIELD 3D · RF Engineering Tool · Physics Powered by AI

---

## Overview

A real-time 3D antenna radiation pattern simulator built entirely in the browser as a single HTML file. Visualise far-field patterns, compare antennas side-by-side, and explore wave propagation — all powered by physics-based electromagnetic models using Plotly.js for 3D rendering.

No installation required. No data leaves your device. No server needed — just open the HTML file in any modern browser.

---

## Features

### 9 Antenna Types
- **Dipole** — Half-wave dipole with end-fed option
- **V-Dipole** — Variable apex angle with optional reflector
- **Ground Plane (¼λ GP)** — Vertical with configurable radials and droop angle
- **Yagi-Uda** — Up to 12 directors, optional reflector, per-element editing
- **Turnstile** — Crossed dipoles with optional tilted reflector
- **QFH (Quadrifilar Helix)** — Configurable turns for satellite reception patterns
- **Collinear** — Stacked vertical elements, per-element length control
- **Loop** — Small and full-wave loop with circumference control
- **Helix** — Axial-mode with configurable turns and pitch angle (free-space model)

### 3D Radiation Pattern Viewer
- Real-time Plotly.js WebGL rendering
- Orbit, pan, zoom controls
- 6 snap views (Y, X, Z, -Y, -X, -Z) plus ISO
- 5 colour themes (Dark, Light, Terminal, Space, Amber)
- 5 colormaps (Default Thermal, Jet, Viridis, Plasma, Cool)
- dBi / dBd unit toggle
- Adjustable lobe opacity
- Wireframe mode with theta rings and phi meridians

### Side-by-Side Comparison
- Two independent antenna windows
- Per-window antenna type, parameters, and overlays
- Independent wave propagation and polar slice panels
- Window selector dropdowns (L: and R:)
- Active window indicator

### Wave Propagation Overlay
- Canvas-based 2D animated wavefronts
- Near-Field mode: individual element sources with interference patterns
- Far-Field mode: radiation pattern lookup table (64×64 LUT, ~20× faster)
- 8 colour themes: Thermal, Ocean, Fire, Neon, Mono, Plasma, Ember, Aurora
- Independent speed control per pane
- Independent φ slice per pane
- GPU-accelerated compositing

### Polar Slice Panel
- Interactive 2D scatterpolar gain plot
- Hover gain readout on entire lobe edge (elevation + absolute gain)
- Gold star markers on lobe peaks
- -3dB reference circle
- Independent φ slider per pane
- Live resize with Plotly.relayout

### Edit Mode
- Per-element length editing for all antenna types
- Colour picker per element
- Live radiation pattern and geometry updates
- Turnstile: Dipole X, Dipole Y, Reflector X, Reflector Y (all independent)
- Yagi: Reflector, Driven, each Director (all independent)
- Collinear: each element independent
- QFH: Loop 1, Loop 2
- Loop: Element (circumference)
- Helix: Element (circumference affecting pattern)

### Ground Reflection Model
- Height above ground (m, cm, mm, in, ft, wavelengths)
- Conductivity: Dry, Medium, Wet
- Phase-based reflection with elevation-dependent attenuation
- Accounts for antenna tilt via rotPt global frame transform

### Take-Off Angle (TOA)
- Three modes: Strongest, Lowest, Highest
- Orbitable marker label (slider moves gold marker around ring)
- Optional beam lines (8 radial lines at TOA elevation)
- Zenith detection

### Overlay Panel System
- Drag-to-move via header bar
- Resize from any edge or corner (8 invisible hit zones)
- Content scales proportionally (text, charts, canvas)
- Panels clamped to parent pane bounds
- Works independently in SBS mode
- Pointer-events isolation — camera never grabs during overlay interaction

### Responsive Design
- 5 CSS breakpoints: >1400px, 1200-1400, 900-1100, 640-900, <640px
- Mobile: vertical layout, panel on top, deferred WebGL init
- Orientation change handler
- SBS overlay auto-scaling

### Other Features
- Amateur band labels with QRZ-style colours (2200m through 1.2cm)
- Frequency input with MHz/kHz/GHz selector
- Coaxial cable presets (RG-8, RG-58, RG-213, LMR-400)
- Antenna geometry overlay with current arcs
- Feedpoint markers
- Splash screen with About, Features, Controls, and Support tabs
- Presets for each antenna type

---

## Architecture

### Single File
Everything is contained in one HTML file — CSS, JavaScript, and all antenna models. No build step, no dependencies beyond the Plotly.js CDN.

### Pattern Computation
1. Pattern computed in **local antenna frame** first via `localField(lx, ly, lz, st)`
2. Mesh points rotated via `rotPt()` to account for azimuth and elevation rotation
3. Eliminates lobe warping on rotation
4. Ground reflection applied in **global frame** using true elevation

### Key State Design
- `WINS[]` array holds per-window state objects
- `S = WINS[activeWin]` is the active window shortcut
- `defaultState()` returns a fresh state with all parameters
- Each window stores its own antenna type, parameters, overlay states, and display options

### Performance Optimisations
- `requestAnimationFrame` render throttling — coalesces multiple slider events into one render per frame
- Pre-computed sin/cos arrays for theta and phi (`Float32Array`)
- 64×64 pattern lookup table (LUT) for wave propagation — avoids calling `localField` per pixel
- LUT auto-invalidates on antenna parameter change
- `Plotly.purge()` before `newPlot` to prevent WebGL memory leaks
- GPU compositing hints (`will-change`, `transform: translateZ(0)`) on wave canvases
- Mesh resolution: NT=72, NP=96 (6,912 vertices)

### Coordinate System
- **Yagi**: Elements along Z axis, boom along +Y. Field model uses `cosT` for element factor, `(-ly)` for array phase
- **Helix**: Element length `L` = circumference `C`, spacing `Sp = C × tan(pitch)`
- **Ground**: Always horizontal (global Z), reflection uses `gz` component after rotation

---

## Changelog

### v1.0.0 — Initial Release

#### Core Simulator
- 9 antenna types with physics-based field models
- 3D radiation pattern rendering via Plotly.js WebGL
- Rotation (azimuth + elevation tilt) for all antenna types
- Ground reflection model with height, conductivity, ground size
- 5 colour themes and 5 colormaps
- dBi/dBd unit toggle
- Frequency input with amateur band detection
- Coaxial cable presets
- Antenna geometry overlay with current arcs and feedpoint markers
- Presets for each antenna type

#### Side-by-Side Comparison
- Dual independent windows with per-window state
- Window selector dropdowns
- Active window indicator
- Independent overlays per pane

#### Wave Propagation
- Canvas-based 2D animated wavefronts
- Near-Field mode with element-level interference
- Far-Field mode with 64×64 pattern LUT (~20× speedup)
- 8 colour themes
- Per-pane speed and φ controls
- GPU-accelerated compositing

#### Polar Slice Panel
- Interactive 2D gain plot with hover readouts on entire lobe edge
- Gold star markers on lobe peaks
- -3dB reference circle
- Per-pane φ slider

#### Edit Mode
- Per-element length editing for all antenna types
- Independent element control (Turnstile 4 elements, Yagi N+2 elements, Collinear N elements)
- Field model reads per-element lengths for accurate pattern updates
- Colour picker per element

#### Wireframe Mode
- Explicit scatter3d line traces (~15 theta rings + ~24 phi meridians)
- Replaces glitchy Plotly contour approach
- Hides filled radiation lobe when active

#### Take-Off Angle
- Three modes: Strongest, Lowest, Highest
- Orbitable marker label
- Optional beam lines

#### Overlay Panel System
- Drag-to-move via header bar
- Resize from any edge or corner (8 invisible hit zones)
- Proportional text scaling
- Live polar chart resize via `Plotly.relayout`
- Camera isolation via `pointer-events: none` during interaction
- Panels clamped to parent pane bounds
- SBS-aware positioning with auto-reset on mode toggle

#### Performance
- `requestAnimationFrame` render throttling
- `Float32Array` mesh building with pre-computed trig
- `Plotly.purge()` before `newPlot` for memory cleanup
- Pattern LUT cache for wave propagation

#### Responsive Design
- 5 CSS breakpoints (desktop → mobile)
- Mobile vertical layout with deferred WebGL init
- Orientation change handler
- SBS overlay auto-scaling

#### Splash Screen
- Landing page with tabbed content
- About, Features, Controls, Buy Me a Coffee tabs
- Smooth fade-out transition

---

## Known Limitations

- **Parabolic antenna**: Attempted but abandoned — beam direction vs dish geometry could not be resolved
- **Mobile 3D rendering**: May be blank on some devices despite explicit sizing and delayed init
- **Helix model**: Free-space only (no ground plane reflector) — presets labelled accordingly
- **Element coupling**: Not modelled — each element's field is computed independently
- **Far-field only**: Near-field in wave prop is approximate (spherical wave superposition)

---

## Tech Stack

- **Plotly.js 2.27.0** — 3D surface/scatter plots, polar charts
- **Canvas API** — Wave propagation animation
- **CSS Custom Properties** — Theming system
- **Vanilla JavaScript** — No frameworks, no build tools
- **Google Fonts** — JetBrains Mono, DM Sans

---

## Browser Support

- Chrome/Edge 90+ (recommended)
- Firefox 90+
- Safari 15+
- Mobile browsers (responsive layout, touch support)

---

## Getting Started

1. Download `Noice.html`
2. Open in any modern browser
3. Click **Start Simulator**
4. Select an antenna type and explore!

No server, no install, no dependencies.

---

## File Structure

```
Noice.html          — The entire simulator (single file)
PROJECT_DOCS.md     — This documentation
```

---

## Support

If you find this tool useful, consider buying me a coffee!

☕ **[paypal.me/mitchkmn](https://www.paypal.me/mitchkmn)**

73 de M7PXZ 🤙

---

*Physics powered by AI · Built with Plotly.js · Created by Jack Mitchell — M7PXZ*
