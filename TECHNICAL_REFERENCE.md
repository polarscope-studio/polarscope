This technical documentation provides a deep dive into the electromagnetic physics and mathematical frameworks used in the **FAR-FIELD 3D** antenna radiation pattern visualizer.

# 🛰️ FAR-FIELD 3D: Engineering & Physics Documentation

This document outlines the mathematical models used to compute radiation patterns, the coordinate transformations for 3D rendering, and the ground interaction physics implemented in the software.

---

## 1. Coordinate System & Transformations
The software utilizes a global Cartesian coordinate system $(X, Y, Z)$ where $Z$ is the vertical axis (altitude) and the $XY$-plane represents the ground.

### 🔄 Rotation Logic (`rotPt`)
To simulate antenna orientation (Azimuth and Elevation), every mesh point in the global frame is transformed into the antenna's local frame.
* **Elevation ($el$):** Rotation around the $X$-axis.
* **Azimuth ($az$):** Rotation around the $Z$-axis.

The transformation follows the standard rotation matrix application:
$$P_{local} = R_z(-az) \cdot R_x(-el) \cdot P_{global}$$
This ensures that the radiation pattern is always computed relative to the antenna's physical orientation before being projected into 3D space.

---

## 2. Electromagnetic Field Models
The engine computes the far-field pattern by calculating the electric field intensity $E(\theta, \phi)$ at each point on a spherical mesh.

### 🥢 Linear Elements (Dipole, Yagi, Collinear)
For a thin-wire linear element of length $L$ at frequency $f$ (wavelength $\lambda$), the element factor is derived from the current distribution:
$$E(\theta) = \frac{\cos(\frac{kL}{2} \cos \theta) - \cos(\frac{kL}{2})}{\sin \theta}$$
where $k = 2\pi/\lambda$ is the wavenumber.

* **Yagi-Uda:** Implements an array factor summation. The total field is the vector sum of the driven element, the reflector, and $N$ directors, each with unique phase shifts based on their $Y$-axis position (boom position).
* **Collinear:** Elements are stacked along the $Z$-axis. The phase shift for the $n$-th element is calculated as $k \cdot d_n \cdot \cos \theta$, where $d_n$ is the vertical displacement from the origin.

### 🌀 Circular & Helical Elements
* **Loop Antennas:** Calculated using the magnetic dipole approximation for small loops or the full-wave integration for large loops.
* **QFH (Quadrifilar Helix):** Simulates two bifilar helical loops fed in phase quadrature ($90^\circ$). The pattern is computed by summing the fields of four fractional-turn helical wires, producing the characteristic hemispherical circularly polarized pattern.

---

## 3. Ground Interaction Physics
The software transitions from "Free Space" to "Real World" by applying a **Ground Reflection Model**.

### 🪞 The Method of Images
When an antenna is placed at height $h$ above ground, the software creates a virtual "image" antenna below the ground plane. The total field is the interference pattern between the direct wave and the reflected wave:
$$E_{total} = E_{direct} \cdot [1 + \Gamma \cdot e^{-j(2kh \sin \psi)}]$$
where $\psi$ is the grazing angle and $\Gamma$ is the **Fresnel Reflection Coefficient**.

### 🌍 Ground Parameters
The reflection coefficient $\Gamma$ is dynamically adjusted based on the selected ground type:
* **Conductivity ($\sigma$):** Varies from $0.001$ S/m (Dry) to $0.030$ S/m (Wet).
* **Permittivity ($\epsilon_r$):** Varies from $5$ to $25$.
The software calculates the complex pseudo-Brewster angle to accurately model the "Take-Off Angle" (TOA) and ground gain.

---

## 4. Performance Optimizations
To maintain 60FPS during real-time slider manipulation, several "nerd-tier" optimizations were implemented:

* **LUT (Lookup Tables):** For wave propagation animations, the engine avoids re-calculating the 3D field for every pixel. Instead, it generates a $64 \times 64$ texture map of the pattern and uses it as a 2D lookup table, resulting in a $\sim 20\times$ speed increase.
* **Typed Arrays:** All mesh vertices and trig values are stored in `Float32Array` buffers to minimize garbage collection and leverage browser-level math optimizations.
* **Render Throttling:** The `requestAnimationFrame` API ensures that if multiple parameters change simultaneously (e.g., dragging a slider), only one 3D redraw is executed per display refresh cycle.

---
**Technical Specs:**
* **Mesh Resolution:** $72 \times 96$ (6,912 vertices).
* **Engine:** Vanilla JS / WebGL (via Plotly.js).
* **Accuracy:** Far-field approximation ($r \gg \lambda$).