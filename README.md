<img width="3093" height="1080" alt="polarscope_1" src="https://github.com/user-attachments/assets/27c2d3e3-20ae-4e81-a663-c51a71231aed" />


# 📡 POLARSCOPE - Antenna Radiation Pattern Visualizer

**by Jack Mitchell — M7PXZ**

**WEBSITE:** [https://polarscope-studio.github.io/polarscope/](https://polarscope-studio.github.io/polarscope/)

**MAIN WEBSITE:** [www.polarplot.net](https://www.polarplot.net)

**LIVE DEMO VIDEO:** https://youtu.be/cLPWEIdKRf0

**EMAIL:** m7pxzqrz@gmail.com (Bugs & fixes)

**DISCORD:** https://discord.gg/zBAam3TZKf (#polarscope-dev)

FAR-FIELD 3D · RF Engineering Tool · Powered By Physics

---

## Overview

A real-time 3D antenna radiation pattern simulator built entirely in the browser as a single HTML file. Visualise far-field patterns, compare antennas side-by-side, and explore wave propagation — all powered by physics-based electromagnetic models using Plotly.js for 3D rendering.

No installation required. No data leaves your device. No server needed — just open the `index.html` file in any modern browser.

---

## Features

---

### 9 Antenna Types

![antennatypes](https://github.com/user-attachments/assets/d8f1b383-8194-4750-8fc9-fdda571ee761)


- **Dipole** — Half-wave dipole with end-fed option
- **V-Dipole** — Variable apex angle with optional reflector
- **Ground Plane (¼λ GP)** — Vertical with configurable radials and droop angle
- **Yagi-Uda** — Up to 12 directors, optional reflector, per-element editing
- **Turnstile** — Crossed dipoles with optional tilted reflector
- **QFH (Quadrifilar Helix)** — Configurable turns for satellite reception patterns
- **Collinear** — Stacked vertical elements, per-element length control
- **Loop** — Small and full-wave loop with circumference control
- **Helix** — Axial-mode with configurable turns and pitch angle (free-space model)

---

### 3D Radiation Pattern Viewer

![radiationpattern](https://github.com/user-attachments/assets/a4a4d215-5618-4a3d-9072-c4faf0387d7b)


- Real-time Plotly.js WebGL rendering
- Orbit, pan, zoom controls
- 6 snap views (Y, X, Z, -Y, -X, -Z) plus ISO
- 5 colour themes (Dark, Light, Terminal, Space, Amber)
- 5 colormaps (Default Thermal, Jet, Viridis, Plasma, Cool)
- dBi / dBd unit toggle
- Adjustable lobe opacity
- Wireframe mode with theta rings and phi meridians

---

### Side-by-Side Comparison

![sidebyside](https://github.com/user-attachments/assets/f5140f5d-8b9a-407c-9d27-fba6675367b1)


- Two independent antenna windows
- Per-window antenna type, parameters, and overlays
- Independent wave propagation and polar slice panels
- Window selector dropdowns (L: and R:)
- Active window indicator

---

### Wave Propagation Overlay

![waveprop](https://github.com/user-attachments/assets/f1005712-5749-4f6b-9865-8caabf1e9bcc)


- Canvas-based 2D animated wavefronts
- Near-Field mode: individual element sources with interference patterns
- Far-Field mode: radiation pattern lookup table (64×64 LUT, ~20× faster)
- 8 colour themes: Thermal, Ocean, Fire, Neon, Mono, Plasma, Ember, Aurora
- Independent speed control per pane
- Independent V/H cut toggle per pane (Vertical φ or Horizontal θ)
- GPU-accelerated compositing

---

### Polar Slice Panel

![polarslice](https://github.com/user-attachments/assets/e3bc1ab8-a773-4d38-9a62-5dcc020d5d20)


- Interactive 2D scatterpolar gain plot
- Hover gain readout on entire lobe edge (elevation + absolute gain)
- Gold star markers on lobe peaks
- Dark red star markers on lobe nulls with exact dB tooltips
- -3dB reference circle
- Independent V/H cut toggle (Vertical φ or Horizontal θ)
- Live resize with Plotly.relayout

---

### Edit Mode

![editmode](https://github.com/user-attachments/assets/658ce305-50b9-409a-bc02-8fcc37b89187)


- Per-element length editing for all antenna types
- Bidirectional sync: Live unit conversion between global sliders and Edit Mode fields
- Precision Typing Lock: Prevents state overwrites while manually editing numbers
- Colour picker per element
- Live radiation pattern and geometry updates
- Turnstile: Dipole X, Dipole Y, Reflector X, Reflector Y (all independent)
- Yagi: Reflector, Driven, each Director (all independent)
- Collinear: each element independent
- QFH: Loop 1, Loop 2
- Loop: Element (circumference)
- Helix: Element (circumference affecting pattern)

---

### Ground Reflection Model

![groundplane](https://github.com/user-attachments/assets/82cbb744-7dce-43a7-b23e-02187ea883ec)


- Height above ground (m, cm, mm, in, ft, wavelengths)
- Conductivity: Dry, Medium, Wet
- Phase-based reflection with elevation-dependent attenuation
- Accounts for antenna tilt via rotPt global frame transform

---

### Take-Off Angle (TOA)

![TOA](https://github.com/user-attachments/assets/270bb5a0-f042-44d4-8f24-4b5e37a609e8)


- Three modes: Strongest, Lowest, Highest
- Orbitable marker label (slider moves gold marker around ring)
- Optional beam lines (8 radial lines at TOA elevation)
- Zenith detection

---

### Structural Mast System

![mast](https://github.com/user-attachments/assets/55917f06-2206-4fc9-aca0-84ac44b67e8d)


- Dynamic 3D lattice tower generation that scales automatically with height
- Configurable multi-level guy wire lines (up to 3 levels)
- Catenary curve simulation (toggleable 'Taut' or 'Slack' wire gravitational droop)
- Real-time Structural Tension Heatmap factoring in antenna weight and mast instability
- Automatic ground UI enforcement when a tower is active
- Precise visual anchoring to the ground plane

---

### Overlay Panel System

![overlays](https://github.com/user-attachments/assets/52768d73-96d0-4e28-b512-b42dcd65617c)


- Drag-to-move via header bar
- Resize from any edge or corner (8 invisible hit zones)
- Content scales proportionally (text, charts, canvas)
- Panels clamped to parent pane bounds
- Works independently in SBS mode
- Pointer-events isolation — camera never grabs during overlay interaction

---

### Responsive Design
- 5 CSS breakpoints: >1400px, 1200-1400, 900-1100, 640-900, <640px
- Mobile: vertical layout, panel on top, deferred WebGL init
- Orientation change handler
- SBS overlay auto-scaling

---

### Other Features
- Amateur band labels with QRZ-style colours (2200m through 1.2cm)
- Frequency input with MHz/kHz/GHz selector
- Precision controls: ◀/▶ stepper buttons for exact lengths and angles
- Smart stepping: 10mm / 10° logical increments across all measurement units
- Antenna geometry overlay with current arcs
- Feedpoint markers
- Splash screen with About, Features, Controls, Links, and Changelog tabs
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

### v1.2.0 — Antenna Orientation & Structural Features (30 Mar 2026)

#### Structural Mast System
- **Lattice Towers & Masts**: Added a complete structural modelling system allowing you to mount antennas on detailed 3D lattice towers or simple poles.
- **Guy Wire Physics**: Implemented configurable, multi-level guy wire supports. Guy lines automatically anchor to the ground plane and support configurable slack/sag physics.
- **Structural Tension Map**: An interactive stress heatmap visually highlights strain points on the tower based on the mounted antenna's mass, wind load instability, and the support provided by the guy wires.

#### Antenna Orientation & UI
- **Yagi Horizontal Mode**: Fixed 3D geometry rendering so that driven, reflector, and director elements correctly lay along the X-axis when the antenna is flipped to horizontal mode.
- **Rotation Freedom**: Expanded both Azimuth and Elevation sliders from restricted ranges to a full -180° to 180°, allowing unrestricted 360-degree pointing of all antenna types.
- **Flip Button Repair**: Restored functionality to the "Flip Orientation" button so that UI controls and the 3D model now sync and re-render immediately upon clicking.

#### Editor Upgrades
- **Dynamic Editor Refresh**: Resolved a bug where the "Edit Mode" side panel failed to update when dynamically adding or removing elements (like Yagi directors or Collinear sections), ensuring the editor always matches the active 3D model.
- **Element Syncing**: Fixed logic errors where adjusting single-element dimensions incorrectly modified multi-element arrays (e.g., V-dipole arms or Turnstile reflectors). Synchronised overall length sliders specifically for single-loop and single-helix antennas to alter circumference directly.

### v1.1.0 — Precision & Visualization Update (30 Mar 2026)

#### Precision & UX
- **Control Steppers**: Added precision ◀/▶ buttons to all critical sliders (Length, Orientation, Height, Spacing).
- **Smart Stepping**: Logical 10mm/10° increments that work seamlessly across all 6 unit types.
- **Edit Mode Sync**: Global length unit selection now synchronizes live with individual element fields.
- **Typing Lock**: Manual input fields now "lock" during typing to prevent UI updates from wiping user changes.
- **UI Structure**: Added layout separators for better grouping of antenna parameters.

#### Advanced Visualization
- **Visual Null Markers**: Dark red stars on polar plots mark deep nulls with exact dBi/dBd hover data.
- **3D Null Scanning**: Matrix-based structural scan across both H and V planes for accurate multi-plane detection.
- **Cut Toggles**: Independent V/H cut switching on both Polar Slice and Wave Propagation overlays.
- **Rendering Fixes**: Resolved line Z-fighting in 3D viewer and improved slice visibility.

#### Improvements & Fixes
- **Yagi counts**: Updated presets to match standard amateur radio element conventions (R+D+Directors).
- **State Persistence**: Overlays now persist their visibility and position when switching antenna types.
- **Pattern accuracy**: Improved peak detection for dipole models.
- **Splash Screen**: Reorganized splash menu with dedicated Changelog and Links tabs.

### v1.0.0 — Initial Release (28 Mar 2026)

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
- **Element coupling**: Not modelled — each element's field is computed independently (maybe future update)
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

- Chrome/Edge/Brave 90+ (recommended)
- Firefox 90+
- Safari 15+
- Mobile browsers (experience may vary, mobile scaling is a nightmare!)

---

## Getting Started

1. Download `index.html`
2. Open in any modern browser
3. Click **Start Simulator**
4. Select an antenna type and explore!

No server, no install, no dependencies.

---

## File Structure

```
index.html                 — The Entire Simulator (Single File)
README.md                  — This Documentation
TECHNICAL_REFERENCE.md     — Technical Maths & Physics Documentation
LICENSE.txt                — License Documentation
```

---

## Support

If you find this tool useful, consider buying me a coffee!

☕ **[paypal.me/mitchkmn](https://www.paypal.me/mitchkmn)**

73 de M7PXZ 🤙

---

*Powered By Physics · Built with Plotly.js · Created by Jack Mitchell — M7PXZ*
