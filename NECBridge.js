/**
 * NECBridge.js
 * Bridges the PolarScope UI State to nec2dxs500.exe via necserver.js.
 * Start the server first: node necserver.js
 */

const NECBridge = {
    serverUrl: 'http://127.0.0.1:7373',
    _serverOk: null,

    async checkServer() {
        try {
            const r = await fetch(`${this.serverUrl}/ping`, { signal: AbortSignal.timeout(2000) });
            this._serverOk = r.ok;
        } catch (_) {
            this._serverOk = false;
        }
        return this._serverOk;
    },

    _groundHeightM(st) {
        const h = parseFloat(st.groundHeight) || 0;
        const u = st.groundUnit || 'm';
        if (u === 'ft') return h * 0.3048;
        if (u === 'λ') return h * (300 / Math.max(0.1, parseFloat(st.freqMHz) || 146));
        return h;
    },

    _gnLine(st) {
        const GROUNDS = [[5, 0.001], [13, 0.005], [20, 0.030]]; // dry / medium / wet
        const idx = Math.min(2, Math.max(0, parseInt(st.groundCond) >= 0 ? parseInt(st.groundCond) : 1));
        const [er, sg] = GROUNDS[idx];
        return `GN 2 0 0 0 ${er}.0 ${sg} 0.0`;
    },

    _zOffset(st) {
        if (st.type !== 'gp') return 0;
        const dR = (parseFloat(st.gpDroop) || 0) * Math.PI / 180;
        if (dR <= 0) return 0.001; // tiny clearance from Sommerfeld z=0
        // Drooped radials go to z = -rLen*sin(dR). Shift entire antenna up so
        // the lowest radial tip is just above the NEC ground plane.
        const lambda = 300 / Math.max(0.1, parseFloat(st.freqMHz) || 146);
        const radLens = st.gpRadLens || [];
        const maxRadWl = radLens.length > 0 ? Math.max(...radLens) : (parseFloat(st.L) || 0.25) * 0.9;
        return maxRadWl * lambda * Math.sin(dR) + 0.001;
    },

    /** Rotate a point by elevation (around X) then azimuth (around Z) — matches buildMesh rotPt */
    _rotPt(x, y, z, az, el) {
        const ce = Math.cos(el * Math.PI / 180), se = Math.sin(el * Math.PI / 180);
        const y1 = y * ce - z * se, z1 = y * se + z * ce;
        const ca = Math.cos(az * Math.PI / 180), sa = Math.sin(az * Math.PI / 180);
        return [x * ca - y1 * sa, x * sa + y1 * ca, z1];
    },

    /** Build wire geometry lines from state's geometryArray, shifted up by zOff metres.
     *  When showGnd=true, wires are physically rotated by (rotAz, rotEl) so Sommerfeld
     *  ground interaction is computed for the actual antenna orientation. */
    _buildWireLines(st, zOff) {
        const dz = zOff || 0;
        const lines = [];
        let tag = 1;
        const elements = st.geometryArray || [];
        // Physically rotate wires only when ground is active — rotEl/rotAz are visual-only otherwise
        const az = st.showGnd ? (parseFloat(st.rotAz) || 0) : 0;
        const el = st.showGnd ? ((parseFloat(st.rotEl) || 0) + (st.polFlipped ? 90 : 0)) : 0;
        const doRot = (az !== 0 || el !== 0);
        if (elements.length === 0) {
            lines.push(`GW 1 11 0.0000 0.0020 ${(0.5+dz).toFixed(5)} 0.0000 0.1702 ${(0.5+dz).toFixed(5)} 0.007500`);
            lines.push(`GW 2 11 0.0000 -0.0020 ${(0.5+dz).toFixed(5)} 0.0000 -0.1702 ${(0.5+dz).toFixed(5)} 0.007500`);
        } else {
            for (const wire of elements) {
                const radM = (parseFloat(wire.diam) || 15) / 2000;
                const segs = parseInt(wire.segments) || 21;
                let [x1, y1, z1] = doRot ? this._rotPt(wire.p1.x, wire.p1.y, wire.p1.z, az, el) : [wire.p1.x, wire.p1.y, wire.p1.z];
                let [x2, y2, z2] = doRot ? this._rotPt(wire.p2.x, wire.p2.y, wire.p2.z, az, el) : [wire.p2.x, wire.p2.y, wire.p2.z];
                lines.push(`GW ${tag} ${segs} ${x1.toFixed(5)} ${y1.toFixed(5)} ${(z1+dz).toFixed(5)} ${x2.toFixed(5)} ${y2.toFixed(5)} ${(z2+dz).toFixed(5)} ${radM.toFixed(6)}`);
                tag++;
            }
        }
        return lines;
    },

    /** Build EX excitation lines from state's geometryArray */
    _buildExLines(st) {
        const lines = [];
        const elements = st.geometryArray || [];
        if (elements.length === 0) {
            lines.push(`EX 0 1 1 0 1.0 0.0`);
        } else {
            let srcTag = 1;
            let anyFed = false;
            for (const el of elements) {
                if (el.isFed) {
                    anyFed = true;
                    const midSeg = Math.floor((parseInt(el.segments) || 21) / 2) + 1;
                    const feedSeg = el.feedSeg || midSeg;
                    // Use amplitude/phase from the original EX card if available
                    const real = el.feedReal !== undefined ? el.feedReal :
                        ((el.feedPhase === 90 || el.feedPhase === -90) ? 0.0 : 1.0);
                    const imag = el.feedImag !== undefined ? el.feedImag :
                        ((el.feedPhase === 90) ? 1.0 : (el.feedPhase === -90) ? -1.0 : 0.0);
                    lines.push(`EX 0 ${srcTag} ${feedSeg} 0 ${real} ${imag}`);
                }
                srcTag++;
            }
            // Fallback: feed wire 1 at midpoint if nothing is marked fed
            if (!anyFed) {
                const firstEl = elements[0];
                const midSeg = Math.floor((parseInt(firstEl.segments) || 11) / 2) + 1;
                lines.push(`EX 0 1 ${midSeg} 0 1.0 0.0`);
            }
        }
        return lines;
    },

    /**
     * Build LD (lumped loading) lines from state.
     * Places a series R+jωL load on the fed wire at the chosen position.
     * NEC-2 LD card: LD LDTYP LDTAG LDTAGF LDTAGT ZLR ZLI ZLC
     *   LDTYP=0 → series RLC; ZLC=0 means no capacitor.
     */
    _buildLDLines(st) {
        if (!st.ldEnabled) return [];
        const L_H = Math.max(0, parseFloat(st.ldUH) || 0) * 1e-6;   // μH → H
        const R   = Math.max(0, parseFloat(st.ldR)  || 0);
        if (L_H === 0 && R === 0) return [];

        const elements = st.geometryArray || [];
        let tag = 1;
        for (const el of elements) {
            if (el.isFed) {
                const segs = parseInt(el.segments) || 21;
                let seg;
                switch (st.ldPos || 'base') {
                    case 'base':   seg = 1; break;
                    case 'center': seg = Math.round(segs / 2); break;
                    case 'top':    seg = segs; break;
                    default:       seg = 1;
                }
                return [`LD 0 ${tag} ${seg} ${seg} ${R.toFixed(4)} ${L_H.toExponential(6)} 0`];
            }
            tag++;
        }
        return [];
    },

    /**
     * Gamma match series capacitor — LD card on the gamma feed wire.
     * Models the tuning sleeve/capacitor that cancels the inductive reactance
     * of the gamma rod, bringing the feedpoint to ~50Ω resistive.
     * Only emitted for parametric yagi with gamma match and gammaCapPF > 0.
     */
    _buildGammaCapLines(st) {
        if (st.customMode) return [];
        if (st.type !== 'yagi' || st.yagiMatch !== 'gamma') return [];
        const capPF = parseFloat(st.gammaCapPF) || 0;
        if (capPF <= 0) return [];
        const elements = st.geometryArray || [];
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].id === 'yagi_gammaFeed') {
                const C = capPF * 1e-12; // pF → F
                return [`LD 0 ${i + 1} 1 1 0 0 ${C.toExponential(6)}`];
            }
        }
        return [];
    },

    /**
     * Translates the Granular Geometry Array into a .nec card string
     * for a single-frequency solve with full radiation pattern.
     *
     * Correct NEC-2 card order: GW → GE → GN → LD → FR → EX → RP → EN
     */
    generateNECString(st) {
        if (!st) throw new Error("State object is null");
        const freqMHz = Math.max(0.1, parseFloat(st.freqMHz) || 435);

        const lines = [];
        lines.push(`CM PolarScope NEC-2 Export`);
        lines.push(`CM Frequency: ${freqMHz.toFixed(3)} MHz`);
        lines.push(`CE`);

        // Use Sommerfeld ground when height-above-ground is enabled with a positive height.
        // This makes Z, SWR, and Gain in the results accurate for the mounting height.
        const lambdaM = 300 / freqMHz;
        const gHeightM = st.showGnd ? this._groundHeightM(st) : 0;
        const useSommerfeld = gHeightM > 0.001;

        // Shift antenna up so it sits at gHeightM above the Sommerfeld z=0 plane,
        // keeping all wires above ground.  When rotated, find the actual lowest wire z.
        let zOff = 0;
        if (useSommerfeld) {
            const antHalfM = (parseFloat(st.L) || 0.25) * lambdaM * 0.5;
            let clearance = st.type === 'gp' ? this._zOffset(st) : antHalfM + 0.001;
            // Account for physical rotation: rotated wires may dip below z=0
            const az = parseFloat(st.rotAz) || 0, el = parseFloat(st.rotEl) || 0;
            if (az !== 0 || el !== 0) {
                let minZLambda = 0;
                for (const wire of (st.geometryArray || [])) {
                    const [,,rz1] = this._rotPt(wire.p1.x, wire.p1.y, wire.p1.z, az, el);
                    const [,,rz2] = this._rotPt(wire.p2.x, wire.p2.y, wire.p2.z, az, el);
                    minZLambda = Math.min(minZLambda, rz1, rz2);
                }
                clearance = Math.max(clearance, (-minZLambda) * lambdaM + 0.001);
            }
            zOff = Math.max(gHeightM, clearance);
        }

        if (st.customMode) {
            // Custom NEC: coordinates already in absolute metres — no z-offset.
            // GN is only active when the user enables height-above-ground; otherwise free space.
            const useCustomGnd = !!(st.customGNLine && st.showGnd);
            lines.push(...this._buildWireLines(st, 0));
            lines.push(useCustomGnd ? "GE 1" : "GE 0");
            if (useCustomGnd) lines.push(st.customGNLine);
            if (st.customLDLines && st.customLDLines.length) lines.push(...st.customLDLines);
            else lines.push(...this._buildLDLines(st));
            if (st.customEK) lines.push("EK");
        } else {
            lines.push(...this._buildWireLines(st, zOff));
            lines.push("GE 0");
            if (useSommerfeld) lines.push(this._gnLine(st));
            lines.push(...this._buildLDLines(st));
            lines.push(...this._buildGammaCapLines(st));
        }

        lines.push(`FR 0 1 0 0 ${freqMHz.toFixed(3)} 0`);
        lines.push(...this._buildExLines(st));

        lines.push("RP 0 181 360 1001 0 0 1.0 1.0 0 0");
        lines.push("EN");
        return lines.join("\n");
    },

    /**
     * Generates a multi-frequency NEC deck WITHOUT a radiation pattern card.
     * Used for the SWR sweep — just impedance vs frequency, much faster.
     * Returns { deck, freqs[] } where freqs[] is the list of frequencies.
     */
    generateSweepDeck(st) {
        if (!st) throw new Error("State object is null");
        const fc = Math.max(0.1, parseFloat(st.freqMHz) || 435);
        // User-defined range takes priority; otherwise auto-span 0.35×–2.2× centre frequency
        const userStart = parseFloat(st.swrFStart);
        const userEnd   = parseFloat(st.swrFEnd);
        const hasUserRange = isFinite(userStart) && isFinite(userEnd) && userStart > 0 && userEnd > userStart;
        const fStart = hasUserRange ? parseFloat(userStart.toFixed(4)) : parseFloat((fc * 0.35).toFixed(4));
        const fEnd   = hasUserRange ? parseFloat(userEnd.toFixed(4))   : parseFloat((fc * 2.2).toFixed(4));
        const lambdaM = 300 / fc;
        const gHeightM = st.showGnd ? this._groundHeightM(st) : 0;
        const useSommerfeld = gHeightM > 0.001;
        // Fewer sweep points with Sommerfeld — each point is ~10× slower
        const N = useSommerfeld ? 51 : 151;
        const dF = (fEnd - fStart) / (N - 1);

        const lines = [];
        lines.push(`CM PolarScope NEC-2 Sweep`);
        lines.push(`CM Centre: ${fc.toFixed(3)} MHz, Sweep: ${fStart.toFixed(2)}-${fEnd.toFixed(2)} MHz`);
        lines.push(`CE`);

        if (st.customMode) {
            // Custom NEC: absolute coordinates. GN only when user enables height-above-ground.
            const useCustomGnd = !!(st.customGNLine && st.showGnd);
            lines.push(...this._buildWireLines(st, 0));
            lines.push(useCustomGnd ? "GE 1" : "GE 0");
            if (useCustomGnd) lines.push(st.customGNLine);
            if (st.customLDLines && st.customLDLines.length) lines.push(...st.customLDLines);
            else lines.push(...this._buildLDLines(st));
            if (st.customEK) lines.push("EK");
        } else if (useSommerfeld) {
            const antHalfM = (parseFloat(st.L) || 0.25) * lambdaM * 0.5;
            let clearance = st.type === 'gp' ? this._zOffset(st) : antHalfM + 0.001;
            const az = parseFloat(st.rotAz) || 0, el = parseFloat(st.rotEl) || 0;
            if (az !== 0 || el !== 0) {
                let minZLambda = 0;
                for (const wire of (st.geometryArray || [])) {
                    const [,,rz1] = this._rotPt(wire.p1.x, wire.p1.y, wire.p1.z, az, el);
                    const [,,rz2] = this._rotPt(wire.p2.x, wire.p2.y, wire.p2.z, az, el);
                    minZLambda = Math.min(minZLambda, rz1, rz2);
                }
                clearance = Math.max(clearance, (-minZLambda) * lambdaM + 0.001);
            }
            const zOff = Math.max(gHeightM, clearance);
            lines.push(...this._buildWireLines(st, zOff));
            lines.push("GE 0");
            lines.push(this._gnLine(st));
            lines.push(...this._buildLDLines(st));
            lines.push(...this._buildGammaCapLines(st));
        } else {
            lines.push(...this._buildWireLines(st, 0));
            lines.push("GE 0");
            lines.push(...this._buildLDLines(st));
            lines.push(...this._buildGammaCapLines(st));
        }

        // Multi-frequency FR: IFRQ=0 linear step, NFRQ=N
        lines.push(`FR 0 ${N} 0 0 ${fStart.toFixed(4)} ${dF.toFixed(5)}`);
        lines.push(...this._buildExLines(st));

        // XQ triggers matrix solve without computing radiation pattern (much faster than RP)
        lines.push("XQ");
        lines.push("EN");

        const freqs = [];
        for (let i = 0; i < N; i++) freqs.push(parseFloat((fStart + dF * i).toFixed(4)));

        return { deck: lines.join("\n"), freqs, fStart, fEnd };
    },

    /** POSTs a single-frequency deck to /solve, returns full results {impedance,swr,gainDbi,pattern} */
    async solve(necString) {
        if (this._serverOk === false) throw new Error("NEC server is not running. Start it with: node necserver.js");
        console.log("[NECBridge] Sending to nec2dxs500.exe server...");
        let response;
        try {
            response = await fetch(`${this.serverUrl}/solve`, {
                method: 'POST', headers: { 'Content-Type': 'text/plain' },
                body: necString, signal: AbortSignal.timeout(30000)
            });
        } catch (e) {
            this._serverOk = false;
            throw new Error("NEC server unreachable (" + e.message + ")");
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown server error' }));
            throw new Error("NEC server error: " + (err.error || response.statusText));
        }
        this._serverOk = true;
        const results = await response.json();
        console.log(`[NECBridge] Z=${results.impedance.r.toFixed(1)}+j${results.impedance.x.toFixed(2)}Ω  SWR=${results.swr.toFixed(2)}  Gain=${results.gainDbi.toFixed(1)}dBi`);
        return results;
    },

    /** POSTs a sweep deck to /sweep, returns array of {freq,r,x,swr} */
    async sweepImpedance(st) {
        const { deck, freqs, fStart, fEnd } = this.generateSweepDeck(st);
        console.log(`[NECBridge] Sweep ${freqs.length} pts ${fStart.toFixed(1)}-${fEnd.toFixed(1)} MHz...`);
        let response;
        try {
            response = await fetch(`${this.serverUrl}/sweep`, {
                method: 'POST', headers: { 'Content-Type': 'text/plain' },
                body: deck, signal: AbortSignal.timeout(60000)
            });
        } catch (e) {
            this._serverOk = false;
            throw new Error("NEC sweep unreachable (" + e.message + ")");
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error("NEC sweep error: " + (err.error || response.statusText));
        }
        this._serverOk = true;
        const data = await response.json();
        console.log(`[NECBridge] Sweep returned ${data.length} impedance points`);
        return data; // [{freq,r,x,swr}, ...]
    }
};

window.NECBridge = NECBridge;
