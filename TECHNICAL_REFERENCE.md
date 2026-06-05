# 🛰️ PolarScope: Engineering & Physics Documentation

This document covers the electromagnetic physics, mathematical frameworks, and NEC-2 solver integration used in PolarScope.

---

## 1. Coordinate System & Transformations

The software uses a global Cartesian coordinate system $(X, Y, Z)$ where $Z$ is the vertical axis and the $XY$-plane represents the ground.

### Rotation Logic (`rotPt`)
To simulate antenna orientation (Azimuth and Elevation), every mesh point is transformed into the antenna's local frame:

$$P_{local} = R_z(-az) \cdot R_x(-el) \cdot P_{global}$$

- **Elevation ($el$):** Rotation around the $X$-axis
- **Azimuth ($az$):** Rotation around the $Z$-axis

For Yagi and polarisation-flipped antennas, an additional 90° elevation offset (`polFlipped`) is applied without moving the UI slider. The pattern mesh rotates rigidly with the antenna — the same `rotPt` transform is applied to NEC wire geometry before card generation, so ground interaction is computed in the physically correct orientation.

---

## 2. NEC-2 Method of Moments Solver

PolarScope uses a platform-appropriate NEC-2 (Numerical Electromagnetics Code) solver via a local HTTP bridge (`necserver.js` on port 7373):

- **Windows** — `nec2dxs500.exe` (500-segment capacity, stdin-prompt protocol)
- **macOS / Linux** — `nec2c` compiled from the canonical 5B4AZ source (`-i` / `-o` CLI flags)

Both produce numerically identical output for the same input deck. The bridge auto-selects the correct binary and spawn mode at startup based on `process.platform`.

### Method of Moments
NEC-2 solves for the current distribution on a wire structure by enforcing the electric field boundary condition on each wire segment:

$$\sum_{n} Z_{mn} I_n = V_m$$

where $Z_{mn}$ is the impedance matrix element between segments $m$ and $n$, $I_n$ is the unknown current on segment $n$, and $V_m$ is the applied excitation voltage. The full matrix is solved via LU decomposition, giving exact currents on all elements including mutual coupling between elements.

### Far-Field Radiation Pattern
From the computed current distribution, the far-field electric field at angle $(\theta, \phi)$ is:

$$\vec{E}(\theta, \phi) = \sum_{n} I_n \cdot \vec{f}_n(\theta, \phi)$$

where $\vec{f}_n$ is the element pattern factor for segment $n$. PolarScope requests a full **181×360** radiation pattern (1° resolution in both theta and phi) via the NEC-2 `RP` card.

### NEC Card Deck Structure
Card order required by NEC-2 (enforced by `NECBridge.js`):

```
CM  — Comment
CE  — End comment
GW  — Wire geometry (one per element segment group)
GE  — Geometry end
GN  — Sommerfeld ground (when height > 0)
LD  — Lumped loading (optional)
FR  — Frequency
EX  — Excitation (voltage source)
RP  — Radiation pattern request (solve) or XQ (sweep)
EN  — End
```

### Sommerfeld Ground
When ground is active, NEC-2 uses the Sommerfeld integral method (GN card type 2) for accurate near-ground impedance and pattern computation. This accounts for surface wave contributions and is significantly more accurate than the Method of Images for low antenna heights. Ground parameters:

| Type   | $\epsilon_r$ | $\sigma$ (S/m) |
|--------|-------------|----------------|
| Dry    | 5           | 0.001          |
| Medium | 13          | 0.005          |
| Wet    | 20          | 0.030          |

The antenna is shifted up by `zOff` metres so no wire touches the Sommerfeld $z = 0$ plane. For drooped GP radials, the z-offset accounts for the lowest radial tip position.

### Lumped Loading (LD Card)
A series R+jωL load is placed on the driven element at the chosen position (base, centre, or top):

```
LD 0 TAG SEG SEG R L_H 0
```

where `L_H` is inductance in henries. This enables coil loading simulation for shortened antennas.

---

## 3. Physics Fallback Model

When the NEC-2 server is unavailable, PolarScope falls back to analytical far-field approximations.

### Linear Elements (Dipole, Yagi, Collinear, V-Dipole, GP)
The element factor for a thin-wire element of half-length $L/2$:

$$E(\theta) = \frac{\cos\!\left(\frac{kL}{2} \cos \theta\right) - \cos\!\left(\frac{kL}{2}\right)}{\sin \theta}$$

where $k = 2\pi/\lambda$.

- **Yagi-Uda:** Array factor summation — driven element, reflector, and $N$ directors. Boom runs along $+X$ (directors forward, reflector behind). Elements run along $Y$ (horizontal) or $Z$ (vertical, when `yagiV` is set). The element-factor projection uses the element axis, not the boom axis — adding directors correctly increases forward gain along $+X$.
- **Collinear:** Elements stacked along $Z$. Phase shift for element $n$: $k \cdot d_n \cdot \cos\theta$.
- **Ground Plane / V-Dipole:** Single radiator with $N$ radials. Radial droop angle modifies feedpoint impedance via $R \approx 35 + 15 \cdot (\text{droop}/45°)$.

### 2-Element Directional (Moxon)
The Moxon is a folded rectangular antenna in the $YZ$ plane. Driven element sits at $Y = 0$ with bent tips of length $B$ projecting toward $-Y$; the reflector sits at $Y = -E$ with bent tips of length $D$ projecting toward $+Y$. Tip gap $C$ separates them. The geometry uses the standard moxgen / VK1OD calculator labels:

$$E = B + C + D$$

Pattern is computed by 2-element end-fire array factor with a $\pi - kD$ phase shift on the reflector for back-lobe cancellation. The high front-to-back ratio (>20 dB at the design frequency) comes from the gap-coupled end loading of the bent tips.

The driven element is split at the centre with a feedpoint gap; a 1-segment NEC feed wire bridges the gap and carries the EX source.

### End-Fed with Matching Stub (J-Pole)
A half-wave radiator end-fed via a quarter-wave parallel-rod matching stub at the base:

- Short rod and radiator rod separated by `stubSpacing` mm
- Both split at the feed tap point so the coax cross-wire endpoints coincide with NEC wire junctions
- Bottom shorting bar closes the quarter-wave transmission-line stub
- Tap position along the stub sets the impedance transformation: $Z_{tap} \approx Z_0 \cdot \tan^2(k \cdot \text{tap})$ where $Z_0$ is the characteristic impedance of the parallel-rod line

The radiator above the stub carries the radiating half-wave current; the stub is a non-radiating matching network (currents on the two parallel rods are anti-phase and cancel in the far field).

### Circular & Helical Elements
- **Loop:** Magnetic dipole approximation for small loops; full-wave integration for large loops.
- **Turnstile:** Crossed dipoles in the $XY$ plane fed in phase quadrature ($+90°$ for RHCP, $-90°$ for LHCP) via NEC `EX` card phase.
- **QFH:** Two bifilar helical loops fed in phase quadrature (90°). Fields of four fractional-turn wires summed, producing the characteristic hemispherical circularly polarised pattern.
- **Helix:** Axial-mode helical antenna; winding direction reversed via $Y$-coordinate negation for LHCP.

### Matching Networks (Yagi)
Three driven-element matching topologies are modelled:

- **None (split):** simple centre-fed dipole with feedpoint gap
- **Folded (300 Ω):** rectangular folded dipole with end caps closing the loop — `4:1` impedance transform
- **Gamma (50 Ω):** capacitively-tuned single-rod match. The gamma rod runs parallel to the driven element with rod length and separation set by sliders. A series capacitor is modelled as a `LD` card on the gamma feed wire:

$$\text{LD 0 } \texttt{TAG}_\text{feed} \texttt{ 1 1 0 0 } C_\text{F}$$

where $C_\text{F}$ is the capacitance in farads (`gammaCapPF` × $10^{-12}$). This cancels the gamma rod's inductive reactance to bring the feed point to ~50 Ω resistive.

### DL6WU Feedpoint Gap
For a single-wire driven element, the optimal physical feed gap is:

$$g = 0.01292 \cdot \lambda_\text{mm} + 0.02383 \cdot d_\text{mm}$$

where $d$ is the element diameter. Used by the parametric Yagi auto-tune and the custom-import gap detector when only one driven wire is present.

---

## 4. Ground Interaction (Fallback)

When using the physics model without NEC-2, ground reflection uses the **Method of Images**:

$$E_{total} = E_{direct} \cdot \left[1 + \Gamma \cdot e^{-j(2kh \sin \psi)}\right]$$

where $\psi$ is the grazing angle and $\Gamma$ is the Fresnel reflection coefficient. The complex pseudo-Brewster angle is used to model the take-off angle and ground gain.

---

## 5. SWR & Impedance

### NEC-2 (Primary)
Impedance is extracted directly from NEC-2's `ANTENNA INPUT PARAMETERS` block:

```
Z = R + jX  (Ω)
Γ = (Z - 50) / (Z + 50)
SWR = (1 + |Γ|) / (1 - |Γ|)
```

The SWR sweep uses an `FR` card with $N$ linear frequency steps (51 points with Sommerfeld, 151 without) and an `XQ` card instead of `RP` — this skips the radiation pattern computation for each point, making the sweep ~10× faster than a full solve per frequency.

**Sweep range:**
- Default (auto): **0.35× to 2.2×** centre frequency
- User-defined: `swrFStart` and `swrFEnd` in MHz, set per-pane via the SWR overlay header. When both are set with `swrFEnd > swrFStart`, NECBridge uses them directly. The Auto button resets both to `null`.

### Physics Fallback (Secondary)
When NEC-2 is unavailable, impedance is modelled as a series RLC circuit:

$$X(f) = Q_{sys} \cdot R \cdot \left( \frac{f}{f_r} - \frac{f_r}{f} \right)$$

where $Q_{sys}$ is the system quality factor (10–12 for thin-wire antennas) and $f_r$ is the resonance frequency adjusted for feedpoint gap capacitance.

---

## 6. Structural Mast System

### Lattice Tower Generation
The tower is a rigid lattice anchored at $z = 0$ extending to height $H$. Cross-bracing segment count adjusts dynamically with $H$ to maintain realistic geometric proportions.

### Guy Wire Physics (Catenary Sag)
Guy lines are modelled with a simplified catenary approximation. Anchors project at $0.7H$ radially, drooping downward by a user-controlled slack factor across up to 3 support levels.

### Structural Tension Heatmap
Stress metric $S$ at height $z$:

$$S(z) = M_a \cdot g + I(z)$$

where $M_a$ is antenna mass (estimated from total element length at ~2700 kg/m³ aluminium density) and $I(z)$ is instability, increasing linearly with height and decreasing with active guy levels.

---

## 7. Performance Optimisations

- **LUT:** 64×64 pattern lookup table for wave propagation — avoids `localField` per pixel, ~20× speedup
- **Float32Array:** All mesh vertices and trig values use typed arrays to minimise GC pressure
- **Render Throttling:** `requestAnimationFrame` coalesces slider events into one WebGL redraw per frame
- **Plotly.purge():** Called before `newPlot` to prevent WebGL context and memory leaks
- **XQ vs RP:** Sweep solves use `XQ` (no pattern) rather than `RP` (full 181×360 pattern) — each sweep point is ~10× faster

---

## Technical Specifications

| Parameter | Value |
|-----------|-------|
| Solver (Windows) | NEC-2 MoM via nec2dxs500.exe (500 segments) |
| Solver (macOS / Linux) | NEC-2 MoM via nec2c (5B4AZ source) |
| Platforms | Windows 10+, macOS (Apple Silicon + Intel), Linux (x86\_64 + arm64) |
| Antenna types | 11 — Dipole, V-Dipole, GP, Yagi, Turnstile, QFH, Collinear, Loop, Helix, Moxon, J-Pole |
| Pattern resolution | 181 × 360 (1° × 1°) |
| Sweep points | 51 (with Sommerfeld) / 151 (free space) |
| Sweep range | 0.35× – 2.2× centre (default) or user-defined MHz range |
| Mesh resolution | 72 × 96 (6,912 vertices) |
| Wave prop LUT | 64 × 64 |
| Reference impedance | 50 Ω |
| Undo history | 80 snapshots, debounced |
| Render engine | Plotly.js WebGL (Electron 28) |
| Accuracy | Far-field ($r \gg \lambda$), Sommerfeld ground |
