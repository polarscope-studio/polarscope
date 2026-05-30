/**
 * necserver.js
 * Local HTTP server that wraps the NEC-2 solver for real simulation.
 *
 * Windows : NEC/nec2dxs500.exe  — stdin-prompt protocol
 * macOS / Linux : NEC/nec2c     — CLI flags  -i <input> -o <output>
 *
 * Start with: node necserver.js
 * Listens on http://localhost:7373
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 7373;
const IS_WIN = process.platform === 'win32';

const NEC_EXE = process.env.NEC_EXE_PATH ||
    path.join(__dirname, 'NEC', IS_WIN ? 'nec2dxs500.exe' : 'nec2c');

// nec2c has a hard 75-character filename limit. os.tmpdir() on macOS returns a
// long /var/folders/… path that blows straight past it. /tmp is safe on both
// macOS and Linux; on Windows we keep os.tmpdir() (no limit issue there).
const TMP_DIR = IS_WIN ? os.tmpdir() : '/tmp';

// Short counter-based names keep paths well under 75 chars on Unix.
let _necCounter = 0;
function _nextId() {
    _necCounter = (_necCounter + 1) % 100000;
    return String(_necCounter).padStart(5, '0');
}

function runNEC(necString) {
    return new Promise((resolve, reject) => {
        const id = _nextId();
        const inputFile  = path.join(TMP_DIR, `ps_in_${id}.nec`);
        const outputFile = path.join(TMP_DIR, `ps_out_${id}.out`);

        fs.writeFileSync(inputFile, necString, 'utf8');

        let proc;
        if (IS_WIN) {
            // nec2dxs500.exe prompts for filenames on stdin
            proc = spawn(NEC_EXE, [], { cwd: TMP_DIR });
            proc.stdin.write(inputFile + '\r\n');
            proc.stdin.write(outputFile + '\r\n');
            proc.stdin.end();
        } else {
            // nec2c uses CLI flags; chmod ensures the binary is executable after git clone
            try { fs.chmodSync(NEC_EXE, 0o755); } catch (_) {}
            proc = spawn(NEC_EXE, ['-i', inputFile, '-o', outputFile], { cwd: TMP_DIR });
        }

        let stderr = '';
        proc.stderr.on('data', d => { stderr += d.toString(); });

        const solverName = IS_WIN ? 'nec2dxs500.exe' : 'nec2c';

        const timeout = setTimeout(() => {
            proc.kill();
            reject(new Error(`${solverName} timed out after 120s`));
        }, 120000);

        proc.on('close', (code) => {
            clearTimeout(timeout);
            try { fs.unlinkSync(inputFile); } catch (_) {}

            if (!fs.existsSync(outputFile)) {
                return reject(new Error(
                    `${solverName} exited ${code}, no output file. stderr: ${stderr}`
                ));
            }

            let output;
            try {
                output = fs.readFileSync(outputFile, 'utf8');
            } catch (e) {
                return reject(new Error('Could not read output file: ' + e.message));
            }
            try { fs.unlinkSync(outputFile); } catch (_) {}

            resolve(output);
        });

        proc.on('error', (e) => {
            clearTimeout(timeout);
            reject(new Error(`Failed to spawn ${solverName}: ${e.message}`));
        });
    });
}

function calcSWR(r, x) {
    const z0 = 50;
    const rho2 = ((r - z0) ** 2 + x ** 2) / ((r + z0) ** 2 + x ** 2);
    const gamma = Math.sqrt(Math.max(0, rho2));
    return Math.min(999, gamma < 0.9999 ? (1 + gamma) / (1 - gamma) : 999);
}

function parseImpedanceBlock(line) {
    // Use global regex to split correctly even when NEC concatenates numbers without spaces
    // e.g. "8.18392E-03-2.87134E-03" (negative imag current directly attached to real)
    const nums = (line.match(/([-+]?\d\.\d+E[+-]\d+)/g) || []).map(parseFloat);
    if (nums.length < 6) return null;
    // cols: volt_r, volt_i, curr_r, curr_i, imp_r, imp_i, adm_r, adm_i, power
    const r = nums[4], x = nums[5];
    return { r, x, swr: calcSWR(r, x) };
}

// Parse a single-frequency NEC output → full results object
function parseOutput(text) {
    const results = {
        impedance: { r: 50, x: 0 },
        swr: 1.0,
        gainDbi: 0,
        pattern: []
    };

    const lines = text.split('\n');

    // Impedance from ANTENNA INPUT PARAMETERS block
    let inInputParams = false;
    for (const line of lines) {
        if (line.includes('ANTENNA INPUT PARAMETERS')) {
            inInputParams = true;
            continue;
        }
        if (inInputParams && (line.includes('E+') || line.includes('E-'))) {
            const imp = parseImpedanceBlock(line);
            if (imp) {
                results.impedance.r = imp.r;
                results.impedance.x = imp.x;
                results.swr = imp.swr;
                inInputParams = false;
            }
        }
    }

    // Radiation pattern — 1° grid matching RP card (181×360).
    // Each slot stores {gain, gainV, gainH, axial} — total, E-theta, E-phi, axial ratio.
    const NTHETA = 181, NPHI = 360, STEP = 1.0;
    const patMap = new Map();
    const rpIdx = text.indexOf('RADIATION PATTERNS');
    if (rpIdx >= 0) {
        for (const line of text.slice(rpIdx).split('\n')) {
            // Cols: theta phi vert_gain horiz_gain total_gain axial_ratio tilt sense
            const m = line.match(/^\s*([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)\s+([-+]?\d+\.\d+)(?:\s+([-+]?\d+\.\d+))?(?:\s+([-+]?\d+\.\d+))?\s*([A-Za-z]+)?/);
            if (m) {
                const theta = parseFloat(m[1]), phi = parseFloat(m[2]);
                const ti = Math.round(theta / STEP);
                const pi = Math.round(phi / STEP) % NPHI;
                if (ti >= 0 && ti < NTHETA) {
                    const key = ti + NTHETA * pi;
                    if (!patMap.has(key)) {
                        const gainTot = parseFloat(m[5]);
                        const axial = m[6] ? parseFloat(m[6]) : 0;
                        const sense = m[8] ? m[8].toUpperCase() : '';
                        const r = Math.min(1, Math.max(0, isNaN(axial) ? 0 : axial));
                        let gainRHCP = -999.99, gainLHCP = -999.99;
                        if (gainTot > -900) {
                            const G = Math.pow(10, gainTot / 10);
                            const Gp = G * (1 + r) * (1 + r) / (2 * (1 + r * r));
                            const Gs = G * (1 - r) * (1 - r) / (2 * (1 + r * r));
                            const isLHCP = sense === 'LEFT';
                            gainRHCP = Gp > 1e-20 ? 10 * Math.log10(isLHCP ? Gs : Gp) : -999.99;
                            gainLHCP = Gp > 1e-20 ? 10 * Math.log10(isLHCP ? Gp : Gs) : -999.99;
                            if (gainRHCP < -999) gainRHCP = -999.99;
                            if (gainLHCP < -999) gainLHCP = -999.99;
                        }
                        patMap.set(key, {
                            gainV: parseFloat(m[3]),
                            gainH: parseFloat(m[4]),
                            gain:  gainTot,
                            axial, gainRHCP, gainLHCP
                        });
                    }
                }
            }
        }
    }
    // Rebuild in canonical order; missing slots get sentinel values
    const MISS = { gain: -999.99, gainV: -999.99, gainH: -999.99, axial: 0, gainRHCP: -999.99, gainLHCP: -999.99 };
    for (let pi = 0; pi < NPHI; pi++) {
        for (let ti = 0; ti < NTHETA; ti++) {
            const pt = patMap.get(ti + NTHETA * pi) || MISS;
            results.pattern.push({ theta: ti * STEP, phi: pi * STEP,
                gain: pt.gain, gainV: pt.gainV, gainH: pt.gainH,
                axial: pt.axial, gainRHCP: pt.gainRHCP, gainLHCP: pt.gainLHCP });
        }
    }
    console.log(`[NEC] Pattern slots filled: ${patMap.size}/${NTHETA * NPHI}`);
    let cpCount = 0, maxAxial = 0, senses = {};
    for (const [, pt] of patMap) {
        if (pt.axial > 0.05) cpCount++;
        if (pt.axial > maxAxial) maxAxial = pt.axial;
        const s = pt.axial > 0.05 ? (pt.gainRHCP > pt.gainLHCP ? 'R' : 'L') : 'Lin';
        senses[s] = (senses[s] || 0) + 1;
    }
    console.log(`[NEC] CP: maxAxial=${maxAxial.toFixed(4)} cpPoints=${cpCount} dist=${JSON.stringify(senses)}`);

    for (const pt of results.pattern) {
        if (pt.gain > -900 && pt.gain > results.gainDbi) results.gainDbi = pt.gain;
    }

    return results;
}

// Parse multi-frequency sweep output → array of {freq, r, x, swr}
function parseSweepOutput(text) {
    const points = [];
    const lines = text.split('\n');
    let currentFreq = null;
    let inInputParams = false;

    for (const line of lines) {
        const fm = line.match(/FREQUENCY\s*=\s*([\d.E+\-]+)\s*MHz/i);
        if (fm) { currentFreq = parseFloat(fm[1]); inInputParams = false; continue; }

        if (line.includes('ANTENNA INPUT PARAMETERS')) { inInputParams = true; continue; }

        if (inInputParams && currentFreq !== null && (line.includes('E+') || line.includes('E-'))) {
            const imp = parseImpedanceBlock(line);
            if (imp) {
                points.push({ freq: currentFreq, r: imp.r, x: imp.x, swr: imp.swr });
                inInputParams = false;
                currentFreq = null;
            }
        }
    }
    return points;
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.method === 'POST' && req.url === '/solve') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                console.log(`[NEC] Solving ${body.split('\n').length} card lines...`);
                const rawOutput = await runNEC(body);
                fs.writeFileSync(path.join(TMP_DIR, 'nec_debug_last.txt'), rawOutput, 'utf8');
                const parsed = parseOutput(rawOutput);
                console.log(`[NEC] Z=${parsed.impedance.r.toFixed(1)}+j${parsed.impedance.x.toFixed(1)}Ω  SWR=${parsed.swr.toFixed(2)}  Gain=${parsed.gainDbi.toFixed(1)}dBi  Pattern=${parsed.pattern.length}pts`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(parsed));
            } catch (e) {
                console.error('[NEC] Error:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/sweep') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const nLines = body.split('\n').length;
                console.log(`[NEC] Sweep ${nLines} card lines...`);
                const rawOutput = await runNEC(body);
                const points = parseSweepOutput(rawOutput);
                console.log(`[NEC] Sweep done — ${points.length} frequency points`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(points));
            } catch (e) {
                console.error('[NEC] Sweep error:', e.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('pong');
    }

    if (req.method === 'GET' && req.url === '/debug') {
        const f = path.join(TMP_DIR, 'nec_debug_last.txt');
        if (fs.existsSync(f)) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end(fs.readFileSync(f, 'utf8'));
        }
        res.writeHead(404); return res.end('No debug output yet — solve something first');
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[NEC Server] Ready on http://127.0.0.1:${PORT}`);
    console.log(`[NEC Server] Platform: ${process.platform} — Solver: ${NEC_EXE}`);
    if (!fs.existsSync(NEC_EXE)) {
        console.error(`[NEC Server] WARNING: ${NEC_EXE} not found!`);
        if (!IS_WIN) console.error(`[NEC Server] Run: bash scripts/build-nec2c.sh`);
    }
});
