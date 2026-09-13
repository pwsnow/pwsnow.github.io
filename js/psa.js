/**
 * psa.js — Probabilistic Sensitivity Analysis Engine
 * UCLTouchRehab PLP Health Economic Analysis
 *
 * Implements:
 *   • Beta sampler (method of moments)     — utilities
 *   • Gamma sampler (Marsaglia–Tsang)      — costs
 *   • Dirichlet sampler                    — transition rows
 *   • Chunked async PSA runner             — non-blocking progress
 *   • CE scatter + CEAC Chart.js renderers
 *   • Results table + CSV export
 */

// Parameter sample stores for EVPPI calculation
let _psaEfficacySamples = [];
let _psaUtilSamples     = [];
let _psaCostSamples     = [];
let _psaTransSamples    = [];  // P[Sev→Sev] samples for EVPPI

// Evidence-calibrated P[Sev→Sev] Beta distribution parameters
// Mean = 0.970714 (Nikolajsen & Jensen 2001; Wettstein et al. 2021)
// SD   = 0.030    => Beta(α=29.69, β=0.90), 95% CI [0.8897, 0.9995]
const PSA_PSS_ALPHA = 29.69;
const PSA_PSS_BETA  = 0.90;
const PSA_PSS_MEAN  = 0.970714;  // used if transCv = 0 (no sampling)

/* ═══════════════════════════════════════════════════════════════
   LIVE MEAN REFRESH — reads current sidebar values into PSA table
   ═══════════════════════════════════════════════════════════════ */

window.refreshPSAMeans = function () {
    // Guard — getInputs lives in app.js and must be loaded first
    if (typeof getInputs !== 'function') {
        console.warn('[PSA] refreshPSAMeans: getInputs() not available yet');
        return;
    }

    const p = getInputs();
    console.log('[PSA] refreshPSAMeans fired. Parameter snapshot:', {
        vrCost:           p.vrCost,
        costOneOff:       p.costOneOff,
        painReduction:    p.painReduction,
        utilPf:           p.utilPf,
        utilMild:         p.utilMild,
        utilMod:          p.utilMod,
        utilSev:          p.utilSev,
        costGpVisit:      p.costGpVisit,
        costSpecialist:   p.costSpecialist,
        costCaregiverRate:p.costCaregiverRate,
        costGabapentin:   p.costGabapentin,
        costPregabalin:   p.costPregabalin,
        costAmitriptyline:p.costAmitriptyline,
        costDuloxetine:   p.costDuloxetine,
    });

    // Use ?? (nullish coalescing) — preserves intentional 0 values
    const fmtGBP  = v => '\u00a3' + Number(v ?? 0).toFixed(2);
    const fmtPct  = v => Number(v ?? 0).toFixed(2) + '%';
    const fmtUtil = v => Number(v ?? 0).toFixed(3);
    const setText = (id, v) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = v;
        } else {
            console.warn('[PSA] refreshPSAMeans: span #' + id + ' not found in DOM');
        }
    };

    // Intervention costs
    setText('psaMeanVrCost',   fmtGBP(p.vrCost   ?? 40.55));
    const oneOff = p.costOneOff ?? 0;
    setText('psaMeanOneOff',   oneOff === 0 ? '\u00a30.00\u00a0(none)' : fmtGBP(oneOff));

    // Efficacy
    setText('psaMeanEfficacy', fmtPct(p.painReduction ?? 2.8));

    // Utilities
    setText('psaMeanUtilPf',   fmtUtil(p.utilPf   ?? 0.80));
    setText('psaMeanUtilMild', fmtUtil(p.utilMild ?? 0.67));
    setText('psaMeanUtilMod',  fmtUtil(p.utilMod  ?? 0.46));
    setText('psaMeanUtilSev',  fmtUtil(p.utilSev  ?? 0.16));

    // Healthcare costs
    setText('psaMeanGp',   fmtGBP(p.costGpVisit      ?? 97.50));
    setText('psaMeanSp',   fmtGBP(p.costSpecialist    ?? 133.00));
    setText('psaMeanCg',   fmtGBP(p.costCaregiverRate ?? 12.71) + '/hr');

    // Drug costs — all 4 on one line
    const gab  = Number(p.costGabapentin    ?? 1.60).toFixed(2);
    const preg = Number(p.costPregabalin    ?? 10.90).toFixed(2);
    const ami  = Number(p.costAmitriptyline ?? 0.55).toFixed(2);
    const dul  = Number(p.costDuloxetine    ?? 3.30).toFixed(2);
    setText('psaMeanDrugs',
        'Gab \u00a3' + gab + ' \u00b7 Preg \u00a3' + preg + '/day \u00b7 Ami \u00a3' + ami + ' \u00b7 Dul \u00a3' + dul);

    // Transition matrix — now shows Beta distribution parameters for P[Sev→Sev]
    setText('psaMeanTrans', 'P[Sev→Sev]: Beta(29.69, 0.90) — 95% CI [0.890, 0.9995]');

    // Visual feedback: pulse the "Mean" header cell
    const hdr = document.querySelector('#tab-psa th:nth-child(4)');
    if (hdr) {
        hdr.style.transition = 'background .15s, color .15s';
        hdr.style.background = 'rgba(56,189,248,.2)';
        hdr.style.color = '#38bdf8';
        setTimeout(() => {
            hdr.style.background = '';
            hdr.style.color = '';
        }, 500);
    }

    console.log('[PSA] refreshPSAMeans complete.');
};


/** Box-Muller standard normal */
function psaRandNorm() {
    let u1, u2;
    do { u1 = Math.random(); } while (u1 === 0);
    do { u2 = Math.random(); } while (u2 === 0);
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Marsaglia–Tsang Gamma(shape, 1) — shape > 0 */
function psaRandGammaStd(shape) {
    if (shape <= 0) return 0;
    if (shape < 1) return psaRandGammaStd(1 + shape) * Math.pow(Math.random(), 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
        let z, v;
        do { z = psaRandNorm(); v = 1 + c * z; } while (v <= 0);
        v = v * v * v;
        const u = Math.random();
        const z2 = z * z;
        if (u < 1 - 0.0331 * z2 * z2) return d * v;
        if (Math.log(u) < 0.5 * z2 + d * (1 - v + Math.log(v))) return d * v;
    }
}

/**
 * Sample Gamma(mean, cv) — method of moments
 * @param {number} mean  Point estimate
 * @param {number} cv    Coefficient of variation (0–1), e.g. 0.15 for 15%
 */
function psaSampleGamma(mean, cv) {
    if (!cv || cv <= 0 || !mean || mean <= 0) return mean;
    const shape = 1 / (cv * cv);
    const scale = mean / shape;
    return Math.max(1e-6, psaRandGammaStd(shape) * scale);
}

/**
 * Sample Beta(mean, se) — method of moments
 * @param {number} mean  Point estimate (0, 1)
 * @param {number} se    Standard error
 */
function psaSampleBeta(mean, se) {
    if (!se || se <= 0 || !mean || mean <= 0 || mean >= 1) return mean;
    const v  = se * se;
    const ab = mean * (1 - mean) / v - 1;
    if (ab <= 0) return mean;            // SE too large for distribution
    const alpha = mean * ab;
    const beta  = (1 - mean) * ab;
    if (alpha <= 0 || beta <= 0) return mean;
    const x = psaRandGammaStd(alpha);
    const y = psaRandGammaStd(beta);
    if (x + y === 0) return mean;
    return Math.max(0.001, Math.min(0.999, x / (x + y)));
}

/**
 * Sample Dirichlet from a transition-probability row
 * Uses Gamma relationship: Dir(α) proportional to [Gamma(αᵢ)]
 * @param {number[]} row  Row of transition matrix (sums to 1)
 * @param {number}   cv   Coefficient of variation applied to each α
 */
function psaSampleDirichlet(row, cv) {
    if (!cv || cv <= 0) return row.slice();
    const samples = row.map(p => {
        const alpha = Math.max(p, 1e-6) / (cv * cv);
        return alpha > 1e-8 ? psaRandGammaStd(alpha) : 0;
    });
    const total = samples.reduce((s, x) => s + x, 0);
    if (total === 0) return row.slice();
    return samples.map(x => x / total);
}

/* ═══════════════════════════════════════════════════════════════
   INNER SIMULATION (mirrors model.js but parameter-injectable)
   ═══════════════════════════════════════════════════════════════ */

function psaSimulate(p, isVR) {
    const d = 0.0005, cycles = 12;
    const utils = [p.utilPf, p.utilMild, p.utilMod, p.utilSev, 0];

    // NICE PMG36: 3.5%/yr discount applied monthly to costs AND QALYs
    // One-off costs at t=0 are NOT discounted (v_0 = 1)
    const annualDisc    = p.discountRate !== undefined ? p.discountRate : 0.035;
    const monthlyDisc   = Math.pow(1 + annualDisc, 1 / 12) - 1;

    /* Month 1 transition matrix */
    let m1 = [
        [1 - d,    0,         0,          0,      d],
        [0,        1 - d,     0,          0,      d],
        [0.1667,   0.3333,    0.5 - d,    0,      d],
        [0.4,      0.2,       0.4 - d,    0,      d],
        [0,        0,         0,          0,      1]
    ];

    /* Month 2–12 transition matrix */
    let m2 = [
        [0.8892 - d, 0.1108,   0,          0,      d],
        [0,          0.92 - d, 0.08,       0,      d],
        [0,          0.0626,   0.8748 - d, 0.0626, d],
        [0,          0,        0,          1 - d,  d],  // will be overridden below
        [0,          0,        0,          0,      1]
    ];

    // Rebuild Severe row with sampled P[Sev→Sev] (or calibrated default)
    const pSS = (p.pSevSev !== undefined) ? Math.max(0.01, Math.min(0.9995, p.pSevSev))
                                           : PSA_PSS_MEAN;
    const pSM = Math.max(0, 1 - pSS - d);
    m2[3] = [0, 0, pSM, pSS, d];  // Sev: [PF=0, Mild=0, Mod=pSM, Sev=pSS, Dead=d]

    /* Apply Dirichlet noise to rows if transition uncertainty is included */
    if (p.transCv > 0) {
        m1 = m1.map(row => psaSampleDirichlet(row, p.transCv));
        m2 = m2.map(row => psaSampleDirichlet(row, p.transCv));
    }

    const gpU  = p.costGpVisit     + p.tpv;
    const spU  = p.costSpecialist  + p.tpv;
    const hrsM = 0.5  * 30.4375;
    const hrsMo = 7.5 * 30.4375;
    const hrsS = 17.0 * 30.4375;
    const dM   = p.costGab  * 30.4375;
    const dMo  = p.costPreg * 30.4375;
    const dS   = (p.costAmi + p.costDul) * 30.4375;
    const spec = [0, 0.1, 0.2, 0.3, 0];

    /* Starting state vector */
    let s = [0, 0, 0.6, 0.4, 0.0];

    /* t=0 efficacy shift (VR arm only) */
    if (isVR && p.painReduction > 0) {
        const eff = Math.min(0.5, p.painReduction / 100);
        const sm  = s[2] * eff, sv = s[3] * eff;
        s[2] -= sm; s[1] += sm; s[3] -= sv; s[2] += sv;
    }

    let tc = isVR ? (p.vrCost + (p.costOneOff || 0)) : 0;  // t=0: undiscounted
    let tq = 0;

    for (let c = 0; c < cycles; c++) {
        const gv = c === 0 ? [0, 0.5, 1, 1, 0]
                 : c <= 2  ? [0, 0.25, 0.5, 0.5, 0]
                 :            [0, 0, 0.111, 0.222, 0];

        const sc_ = [
            gv[0] * gpU,
            gv[1] * gpU + spec[1] * spU + hrsM  * p.caregiverRate + dM,
            gv[2] * gpU + spec[2] * spU + hrsMo * p.caregiverRate + dMo,
            gv[3] * gpU + spec[3] * spU + hrsS  * p.caregiverRate + dS,
            0
        ];

        // Apply discount: v_{c+1} = 1/(1+monthly_rate)^(c+1)
        const vt = 1 / Math.pow(1 + monthlyDisc, c + 1);

        tq += (s[0] * utils[0] / 12 + s[1] * utils[1] / 12
             + s[2] * utils[2] / 12 + s[3] * utils[3] / 12) * vt;
        tc += (s[0] * sc_[0] + s[1] * sc_[1] + s[2] * sc_[2] + s[3] * sc_[3]) * vt;

        const M = c === 0 ? m1 : m2;
        const ns = [0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) ns[j] += s[i] * M[i][j];
        s = ns;
    }
    return { tc, tq };
}

/* ═══════════════════════════════════════════════════════════════
   PSA RUNNER — chunked async to keep UI responsive
   ═══════════════════════════════════════════════════════════════ */

let _psaAborted    = false;
let _psaDcSamples  = [];
let _psaDqSamples  = [];

window.abortPSA = function () { _psaAborted = true; };

/**
 * Run the PSA Monte Carlo simulation.
 * @param {number}   N           Number of iterations
 * @param {object}   psaParams   Distribution controls
 * @param {function} onProgress  Callback(percent 0–100)
 * @returns {{ dc: number[], dq: number[] }}
 */
window.runPSA = async function (N, psaParams, onProgress) {
    _psaAborted   = false;
    _psaDcSamples = [];
    _psaDqSamples = [];
    _psaEfficacySamples = [];
    _psaUtilSamples = [];
    _psaCostSamples = [];

    const CHUNK = 150;                           // iterations per frame
    const base  = (typeof getInputs === 'function') ? getInputs() : {};
    const tpv   = (base.travelDistanceKm || 4.8) * 2
                * (base.travelCostKm || 0.35)
                + (base.parkingCost || 3.50);

    for (let i = 0; i < N && !_psaAborted; i += CHUNK) {
        const end = Math.min(i + CHUNK, N);

        for (let j = i; j < end; j++) {
            const eff0 = (base.painReduction || 2.8) / 100;  // efficacy as fraction

            const p = {
                /* VR / setup costs */
                vrCost:      psaParams.inclVrCost
                    ? psaSampleGamma(base.vrCost     || 40.55,   psaParams.vrCostCv)
                    : (base.vrCost  || 40.55),
                costOneOff:  psaParams.inclOneOff && (base.costOneOff || 0) > 0
                    ? psaSampleGamma(base.costOneOff || 0.01,    psaParams.oneOffCv)
                    : (base.costOneOff || 0),

                /* Efficacy — Beta on the [0,1] fraction, rescale to % */
                painReduction: psaParams.inclEfficacy
                    ? Math.max(0, Math.min(50,
                        psaSampleBeta(Math.max(0.001, Math.min(0.999, eff0)),
                                      psaParams.efficacySe) * 100))
                    : (base.painReduction || 2.8),

                /* Utilities — Beta */
                utilPf:   psaParams.inclUtils ? psaSampleBeta(base.utilPf   || 0.80, psaParams.utilPfSe)   : (base.utilPf   || 0.80),
                utilMild: psaParams.inclUtils ? psaSampleBeta(base.utilMild || 0.67, psaParams.utilMildSe) : (base.utilMild || 0.67),
                utilMod:  psaParams.inclUtils ? psaSampleBeta(base.utilMod  || 0.46, psaParams.utilModSe)  : (base.utilMod  || 0.46),
                utilSev:  psaParams.inclUtils ? psaSampleBeta(base.utilSev  || 0.16, psaParams.utilSevSe)  : (base.utilSev  || 0.16),

                /* Healthcare costs — Gamma */
                costGpVisit:    psaParams.inclCosts ? psaSampleGamma(base.costGpVisit      || 97.50,  psaParams.gpCv) : (base.costGpVisit      || 97.50),
                costSpecialist: psaParams.inclCosts ? psaSampleGamma(base.costSpecialist   || 133.00, psaParams.spCv) : (base.costSpecialist   || 133.00),
                caregiverRate:  psaParams.inclCosts ? psaSampleGamma(base.costCaregiverRate|| 12.71,  psaParams.cgCv) : (base.costCaregiverRate || 12.71),

                /* Drug costs — Gamma */
                costGab:  psaParams.inclDrugs ? psaSampleGamma(base.costGabapentin    || 1.60,  psaParams.drugCv) : (base.costGabapentin    || 1.60),
                costPreg: psaParams.inclDrugs ? psaSampleGamma(base.costPregabalin    || 10.90, psaParams.drugCv) : (base.costPregabalin    || 10.90),
                costAmi:  psaParams.inclDrugs ? psaSampleGamma(base.costAmitriptyline || 0.55,  psaParams.drugCv) : (base.costAmitriptyline || 0.55),
                costDul:  psaParams.inclDrugs ? psaSampleGamma(base.costDuloxetine    || 3.30,  psaParams.drugCv) : (base.costDuloxetine    || 3.30),

                /* P[Sev→Sev] — Beta(α=29.69, β=0.90) — evidence-calibrated
                 * Mean=0.970714 | 95% CI [0.8897, 0.9995]
                 * Nikolajsen & Jensen (2001); Wettstein et al. (2021)
                 * Included in PSA even when inclTrans = false (structural parameter)
                 */
                pSevSev: (function() {
                    // Sample using Beta relationship to Gamma: Beta(α,β) = Gamma(α) / (Gamma(α)+Gamma(β))
                    const ga = psaRandGammaStd(PSA_PSS_ALPHA);
                    const gb = psaRandGammaStd(PSA_PSS_BETA);
                    return (ga + gb === 0) ? PSA_PSS_MEAN : ga / (ga + gb);
                })(),

                /* Transition matrix Dirichlet CV (other rows) */
                transCv: psaParams.inclTrans ? psaParams.transCv : 0,

                tpv
            };

            _psaEfficacySamples.push(p.painReduction);
            _psaUtilSamples.push((p.utilPf + p.utilMild + p.utilMod + p.utilSev) / 4);
            _psaCostSamples.push(p.costGpVisit + p.costSpecialist + p.costGab + p.costPreg);
            _psaTransSamples.push(p.pSevSev);  // store P[Sev→Sev] for EVPPI

            const vr = psaSimulate(p, true);
            const sc = psaSimulate(p, false);
            _psaDcSamples.push(vr.tc - sc.tc);
            _psaDqSamples.push(vr.tq - sc.tq);
        }

        onProgress((end / N) * 100);
        await new Promise(resolve => setTimeout(resolve, 0));   // yield to browser
    }

    return { dc: _psaDcSamples, dq: _psaDqSamples };
};

/* ═══════════════════════════════════════════════════════════════
   STATISTICS HELPERS
   ═══════════════════════════════════════════════════════════════ */

function psaMean(arr) { return arr.reduce((s, x) => s + x, 0) / arr.length; }

function psaSD(arr) {
    const m = psaMean(arr);
    return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1));
}

function psaPct(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lo  = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function psaCEAC(dc, dq, wtpValues) {
    const n = dc.length;
    return wtpValues.map(wtp => {
        const pos = dc.reduce((s, d, i) => s + (dq[i] * wtp - d > 0 ? 1 : 0), 0);
        return pos / n * 100;
    });
}

/* ═══════════════════════════════════════════════════════════════
   VALUE OF INFORMATION — EVPI, EVPPI
   ═══════════════════════════════════════════════════════════════ */

/**
 * EVPI per patient at a given WTP threshold.
 * EVPI = E[max(NMB, 0)] − max(E[NMB], 0)
 * This is the expected gain from having perfect information about
 * ALL parameters before deciding (Briggs et al. 2006, DSU TSD 10).
 * @param {number[]} dc  - array of ΔC samples
 * @param {number[]} dq  - array of ΔE samples
 * @param {number}   wtp - willingness-to-pay threshold (£/QALY)
 * @returns {number} EVPI per patient (£)
 */
function calcEVPI(dc, dq, wtp) {
    const nmb = dc.map((d, i) => dq[i] * wtp - d);
    const enmbWithInfo    = psaMean(nmb.map(v => Math.max(v, 0)));  // E[max(NMB,0)]
    const enmbWithoutInfo = Math.max(psaMean(nmb), 0);              // max(E[NMB],0)
    return Math.max(0, enmbWithInfo - enmbWithoutInfo);
}

/**
 * Population EVPI = per-patient EVPI × relevant patient population.
 * The population is: annual incident PLP patients in England who would
 * be treated during the period of decision uncertainty (typically ~3-5yr
 * evidence generation lag).
 * @param {number} evpiPerPt     - EVPI per patient (£)
 * @param {number} annualPts     - annual incident patients (default 5762, NHS HES 2023/24)
 * @param {number} horizonYears  - years of decision relevance (default 4)
 * @param {number} discountRate  - annual discount rate (default 0.035)
 * @returns {number} population EVPI (£)
 */
function calcPopEVPI(evpiPerPt, annualPts = 5762, horizonYears = 4, discountRate = 0.035) {
    // Sum of discounted annual populations: Σ annualPts/(1+r)^t  t=1..T
    let pv = 0;
    for (let t = 1; t <= horizonYears; t++) {
        pv += annualPts / Math.pow(1 + discountRate, t);
    }
    return evpiPerPt * pv;
}

/**
 * EVPPI for a single parameter group using the regression/smoothing approach.
 * Approximated by sorting NMB by the group's sampled values and computing
 * the variance of conditional means (Tuffaha et al. 2014 method; Sadatsafavi 2013).
 *
 * For each group we have the NMB array and the sampled parameter vector.
 * We sort by parameter, compute a moving average of NMB, then:
 *   EVPPI_g ≈ E[max(E[NMB|theta_g], 0)] − max(E[NMB], 0)
 *
 * @param {number[]} nmb       - NMB for each iteration
 * @param {number[]} paramSamples - sampled values of the parameter group (must be same length)
 * @param {number}   windowFrac - fraction of data in moving window (default 0.2)
 * @returns {number} EVPPI estimate (£/patient)
 */
function calcEVPPIbyParam(nmb, paramSamples, windowFrac = 0.2) {
    const N = nmb.length;
    if (N < 10) return 0;
    // Sort by param value
    const idx = Array.from({length: N}, (_, i) => i)
        .sort((a, b) => paramSamples[a] - paramSamples[b]);
    const sortedNMB = idx.map(i => nmb[i]);
    // Moving window average of NMB given param
    const w = Math.max(3, Math.floor(N * windowFrac));
    const condMeans = [];
    for (let i = 0; i < N; i++) {
        const lo = Math.max(0, i - Math.floor(w/2));
        const hi = Math.min(N, lo + w);
        const slice = sortedNMB.slice(lo, hi);
        condMeans.push(slice.reduce((s,v)=>s+v,0)/slice.length);
    }
    // EVPPI = E[max(E[NMB|theta],0)] - max(E[NMB],0)
    const eMaxCondMean = condMeans.reduce((s,v)=>s+Math.max(v,0),0)/N;
    const maxENMB      = Math.max(psaMean(nmb), 0);
    return Math.max(0, eMaxCondMean - maxENMB);
}

/* ═══════════════════════════════════════════════════════════════
   CHART 1 — CE Scatter (N sampled points + base case + WTP lines)
   ═══════════════════════════════════════════════════════════════ */

let _psaScatterChart = null;

function renderCEScatter(dc, dq) {
    const ctx = document.getElementById('psaScatterChart');
    if (!ctx) return;
    if (_psaScatterChart) { _psaScatterChart.destroy(); _psaScatterChart = null; }

    /* CORRECT CE-plane convention: x = ΔE (QALYs), y = ΔC (cost)
     * PSA array: dc[i] = incremental cost, dq[i] = incremental QALYs        */
    const pts = dq.map((q, i) => ({ x: q, y: dc[i] }));   // x=ΔE, y=ΔC

    /* Base case (deterministic) — use res properties incQaly / incCost        */
    let bPts = [];
    if (typeof getInputs === 'function' && typeof PLPMarkovModel !== 'undefined') {
        try {
            const bm = new PLPMarkovModel(getInputs());
            const br = bm.run();
            bPts = [{ x: br.incQaly, y: br.incCost }];   // incQaly / incCost
        } catch (_) { /* silent */ }
    }

    /* ── Tight data-driven bounds ─────────────────────────────────────────── */
    const allX = pts.map(p => p.x).filter(isFinite);
    const allY = pts.map(p => p.y).filter(isFinite);
    if (bPts.length) { allX.push(bPts[0].x); allY.push(bPts[0].y); }

    const pad    = 0.15;
    const rawXlo = Math.min(...allX), rawXhi = Math.max(...allX);
    const rawYlo = Math.min(...allY), rawYhi = Math.max(...allY);
    const xSpan  = Math.max(rawXhi - rawXlo, 0.0001);
    const ySpan  = Math.max(rawYhi - rawYlo, 10);

    let xMin = rawXlo - xSpan * pad;
    let xMax = rawXhi + xSpan * pad;
    let yMin = rawYlo - ySpan * pad;
    let yMax = rawYhi + ySpan * pad;

    // Include zero on both axes for quadrant visibility
    if (xMin > -xSpan * 0.04) xMin = -xSpan * 0.04;
    if (xMax <  xSpan * 0.04) xMax =  xSpan * 0.04;
    if (yMin >  0)             yMin = -ySpan * 0.04;
    if (yMax <  0)             yMax =  ySpan * 0.04;

    /* WTP lines through origin: slope = WTP (y = WTP × x, i.e. ΔC = WTP × ΔE) */
    const wtp25line = [{ x: xMin, y: xMin * 25000 }, { x: xMax, y: xMax * 25000 }];
    const wtp35line = [{ x: xMin, y: xMin * 35000 }, { x: xMax, y: xMax * 35000 }];

    /* Y-axis tick formatter */
    const fmtY = v => {
        if (Math.abs(v) >= 1000) return (v < 0 ? '-£' : '£') + Math.abs(v / 1000).toFixed(1) + 'k';
        return (v < 0 ? '-£' : '£') + Math.abs(Math.round(v));
    };

    _psaScatterChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: `PSA cloud (${dc.length.toLocaleString()} iterations)`,
                    data: pts,
                    backgroundColor: pts.length > 3000 ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.18)',
                    pointRadius: pts.length > 5000 ? 1.5 : pts.length > 2000 ? 2 : 2.5,
                    pointHoverRadius: 5,
                    order: 2
                },
                {
                    label: 'Base case (deterministic)',
                    data: bPts,
                    backgroundColor: '#f59e0b',
                    borderColor: '#0d1829',
                    borderWidth: 1.5,
                    pointRadius: 9,
                    pointStyle: 'star',
                    order: 1
                },
                {
                    label: 'WTP = £25,000/QALY',
                    data: wtp25line,
                    type: 'line',
                    borderColor: 'rgba(16,185,129,0.75)',
                    borderDash: [6, 4],
                    borderWidth: 1.8,
                    pointRadius: 0,
                    fill: false,
                    order: 3
                },
                {
                    label: 'WTP = £35,000/QALY',
                    data: wtp35line,
                    type: 'line',
                    borderColor: 'rgba(168,85,247,0.75)',
                    borderDash: [3, 3],
                    borderWidth: 1.8,
                    pointRadius: 0,
                    fill: false,
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 14 } },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.datasetIndex === 0
                            ? `ΔE: ${ctx.raw.x.toFixed(6)} QALYs | ΔC: £${ctx.raw.y.toFixed(0)}`
                            : ctx.dataset.label
                    }
                }
            },
            scales: {
                x: {
                    min: xMin, max: xMax,
                    title: { display: true, text: 'Incremental QALYs ΔE', color: '#94a3b8', font: { size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { color: '#94a3b8', callback: v => v.toFixed(4) }
                },
                y: {
                    min: yMin, max: yMax,
                    title: { display: true, text: 'Incremental Cost ΔC (£)', color: '#94a3b8', font: { size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    ticks: { color: '#94a3b8', callback: fmtY }
                }
            }
        }
    });

    /* Draw quadrant labels via plugin */
    _psaScatterChart.data._qLabels = true;
}

function renderCEAC(dc, dq) {
    const ctx = document.getElementById('psaCEACChart');
    if (!ctx) return;
    if (_psaCEACChart) { _psaCEACChart.destroy(); _psaCEACChart = null; }

    const pcts  = psaCEAC(dc, dq, CEAC_WTPS);
    const wtp25idx = CEAC_WTPS.indexOf(25000);
    const wtp35idx = CEAC_WTPS.indexOf(35000);

    _psaCEACChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: CEAC_WTPS.map(v => '£' + v.toLocaleString('en-GB')),
            datasets: [
                {
                    label: 'P(Cost-Effective)',
                    data: pcts,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: pcts.map((_, i) =>
                        i === wtp25idx ? '#38bdf8' : i === wtp35idx ? '#a855f7' : '#10b981'),
                    pointRadius: pcts.map((_, i) =>
                        (i === wtp25idx || i === wtp35idx) ? 7 : 4),
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400 },
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `P(CE) = ${ctx.raw.toFixed(1)}%`,
                        title: ctx => 'WTP: ' + ctx[0].label
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Willingness-to-Pay (£/QALY)', color: '#94a3b8', font: { size: 11 } },
                    ticks: { color: '#94a3b8', maxRotation: 40, font: { size: 10 } },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                },
                y: {
                    min: 0, max: 100,
                    title: { display: true, text: '% Iterations Cost-Effective', color: '#94a3b8', font: { size: 11 } },
                    ticks: { color: '#94a3b8', callback: v => v + '%' },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                }
            }
        }
    });
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS TABLE
   ═══════════════════════════════════════════════════════════════ */

function renderPSATable(dc, dq) {
    const N     = dc.length;
    const wtp   = (window._lastInputs || {}).wtp || 25000;
    const nmb25 = dc.map((d, i) => dq[i] * 25000 - d);
    const nmb35 = dc.map((d, i) => dq[i] * 35000 - d);
    const nmbWtp = dc.map((d, i) => dq[i] * wtp   - d);

    const fmtGBP = v => (v >= 0 ? '+' : '') + '£' +
        Math.abs(v).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtQ   = v => (v >= 0 ? '+' : '') + v.toFixed(6);
    const fmtPct = arr => (arr.filter(x => x > 0).length / arr.length * 100).toFixed(1) + '%';

    const dom = dc.filter((d, i) => d < 0 && dq[i] > 0).length / N * 100;
    const extDom = dc.filter((d, i) => d < 0 && dq[i] < 0).length / N * 100;
    const ce    = dc.filter((d, i) => d > 0 && dq[i] > 0).length / N * 100;
    const domd  = dc.filter((d, i) => d > 0 && dq[i] < 0).length / N * 100;

    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    setText('psaN',          N.toLocaleString());
    setText('psaDcMean',     fmtGBP(psaMean(dc)));
    setText('psaDcSD',       '£' + psaSD(dc).toFixed(2));
    setText('psaDcCI',       fmtGBP(psaPct(dc, 2.5)) + ' to ' + fmtGBP(psaPct(dc, 97.5)));
    setText('psaDqMean',     fmtQ(psaMean(dq)));
    setText('psaDqSD',       psaSD(dq).toFixed(6));
    setText('psaDqCI',       fmtQ(psaPct(dq, 2.5)) + ' to ' + fmtQ(psaPct(dq, 97.5)));
    setText('psaNmbMean25',  fmtGBP(psaMean(nmb25)));
    setText('psaNmbCI25',    fmtGBP(psaPct(nmb25, 2.5)) + ' to ' + fmtGBP(psaPct(nmb25, 97.5)));
    setText('psaNmbMean35',  fmtGBP(psaMean(nmb35)));
    setText('psaNmbCI35',    fmtGBP(psaPct(nmb35, 2.5)) + ' to ' + fmtGBP(psaPct(nmb35, 97.5)));
    setText('psaPctDom',     dom.toFixed(1) + '%');
    setText('psaPctExtDom',  extDom.toFixed(1) + '%');
    setText('psaPctCE',      ce.toFixed(1) + '%');
    setText('psaPctDomd',    domd.toFixed(1) + '%');
    setText('psaPctCe25',    fmtPct(nmb25));
    setText('psaPctCe35',    fmtPct(nmb35));
    setText('psaPctCeWtp',   fmtPct(nmbWtp));
    setText('psaCeacAt25',   psaCEAC(dc, dq, [25000])[0].toFixed(1) + '%');
    setText('psaCeacAt35',   psaCEAC(dc, dq, [35000])[0].toFixed(1) + '%');

    /* Colour-code the dominant cell */
    const domEl = document.getElementById('psaPctDom');
    if (domEl) domEl.style.color = dom > 90 ? '#10b981' : dom > 70 ? '#38bdf8' : '#f59e0b';

    document.getElementById('psaResultsSection').style.display = 'block';

    /* ── Value of Information ──────────────────────────────────── */
    const wtp25k = 25000;
    const wtp35k = 35000;
    const nmb25  = dc.map((d, i) => dq[i] * wtp25k - d);
    const nmb35  = dc.map((d, i) => dq[i] * wtp35k - d);

    // EVPI
    const evpi25 = calcEVPI(dc, dq, wtp25k);
    const evpi35 = calcEVPI(dc, dq, wtp35k);
    const popEvpi25 = calcPopEVPI(evpi25);
    const popEvpi35 = calcPopEVPI(evpi35);

    // EVPPI — retrieve sampled parameter arrays stored during runPSA
    // We compute EVPPI for 4 groups: efficacy, utilities, costs, transition
    const evppiEfficacy = (_psaEfficacySamples.length === N)
        ? calcEVPPIbyParam(nmb25, _psaEfficacySamples)
        : null;
    const evppiUtils = (_psaUtilSamples.length === N)
        ? calcEVPPIbyParam(nmb25, _psaUtilSamples)
        : null;
    const evppiCosts = (_psaCostSamples.length === N)
        ? calcEVPPIbyParam(nmb25, _psaCostSamples)
        : null;

    const fmtGBPk = v => {
        if (v >= 1e6) return '£' + (v/1e6).toFixed(2) + 'M';
        if (v >= 1e3) return '£' + (v/1e3).toFixed(1) + 'k';
        return '£' + v.toFixed(2);
    };

    // Update DOM elements (they are added to HTML separately)
    setText('voiEvpi25',     '£' + evpi25.toFixed(2) + '/pt');
    setText('voiEvpi35',     '£' + evpi35.toFixed(2) + '/pt');
    setText('voiPopEvpi25',  fmtGBPk(popEvpi25));
    setText('voiPopEvpi35',  fmtGBPk(popEvpi35));
    if (evppiEfficacy !== null) setText('voiEvppiEfficacy', '£' + evppiEfficacy.toFixed(2) + '/pt');
    if (evppiUtils    !== null) setText('voiEvppiUtils',    '£' + evppiUtils.toFixed(2)    + '/pt');
    if (evppiCosts    !== null) setText('voiEvppiCosts',    '£' + evppiCosts.toFixed(2)    + '/pt');

    // Interpret EVPI vs CEAC: if EVPI > 0 but P(CE) < 100%, more research is valuable
    const pce25 = nmb25.filter(v => v > 0).length / N * 100;
    let voiVerdict = '';
    if (evpi25 < 1) {
        voiVerdict = '✅ EVPI ≈ £0: Decision is robust. Further research adds minimal value at £25k WTP.';
    } else if (pce25 > 95) {
        voiVerdict = '✅ High P(CE) with small EVPI: intervention is likely cost-effective. Any residual research value is small.';
    } else if (evpi25 > 100) {
        voiVerdict = '⚠️ EVPI > £100/pt: Substantial uncertainty remains. A confirmatory RCT would likely be cost-effective to conduct.';
    } else {
        voiVerdict = '🔍 Moderate EVPI: Some decision uncertainty remains — EVPPI analysis identifies which parameters to prioritise.';
    }
    setText('voiVerdict', voiVerdict);

    // Show VOI panel
    const voiPanel = document.getElementById('voiPanel');
    if (voiPanel) voiPanel.style.display = 'block';
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC ENTRY POINT — called by onclick on Run button
   ═══════════════════════════════════════════════════════════════ */

window.startPSA = async function () {
    const N = parseInt(document.getElementById('psaNIter').value, 10) || 1000;

    const gv  = id => parseFloat(document.getElementById(id)?.value) || 0;
    const gcb = id => document.getElementById(id)?.checked ?? true;

    const psaParams = {
        inclVrCost:   gcb('psaInclVrCost'),    vrCostCv:    gv('psaVrCostCv')  / 100,
        inclOneOff:   gcb('psaInclOneOff'),    oneOffCv:    gv('psaOneOffCv')  / 100,
        inclEfficacy: gcb('psaInclEfficacy'),  efficacySe:  gv('psaEfficacySe')/ 100,
        inclUtils:    gcb('psaInclUtils'),
        utilPfSe:     gv('psaUtilPfSe'),
        utilMildSe:   gv('psaUtilMildSe'),
        utilModSe:    gv('psaUtilModSe'),
        utilSevSe:    gv('psaUtilSevSe'),
        inclCosts:    gcb('psaInclCosts'),
        gpCv:         gv('psaGpCv')   / 100,
        spCv:         gv('psaSpCv')   / 100,
        cgCv:         gv('psaCgCv')   / 100,
        inclDrugs:    gcb('psaInclDrugs'),     drugCv:      gv('psaDrugCv')   / 100,
        inclTrans:    gcb('psaInclTrans'),      transCv:     gv('psaTransCv')  / 100,
    };

    /* UI: start state */
    const runBtn  = document.getElementById('psaRunBtn');
    const abrtBtn = document.getElementById('psaAbortBtn');
    const progWrap = document.getElementById('psaProgWrap');
    const progBar  = document.getElementById('psaProgBar');
    const progTxt  = document.getElementById('psaProgText');

    if (runBtn)   runBtn.disabled  = true;
    if (abrtBtn)  abrtBtn.style.display = 'inline-flex';
    if (progWrap) progWrap.style.display = 'block';
    if (progTxt)  progTxt.textContent   = 'Starting…';

    const t0 = Date.now();

    const result = await runPSA(N, psaParams, pct => {
        if (progBar)  progBar.style.width  = pct.toFixed(0) + '%';
        if (progTxt)  progTxt.textContent  =
            `Running… ${pct.toFixed(0)}% · ${Math.round(pct / 100 * N).toLocaleString()} / ${N.toLocaleString()} iterations`;
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const done    = result.dc.length;
    if (progTxt)  progTxt.textContent = `✅ ${done.toLocaleString()} iterations completed in ${elapsed}s`;
    if (progBar)  progBar.style.width = '100%';
    if (runBtn)   runBtn.disabled  = false;
    if (abrtBtn)  abrtBtn.style.display = 'none';

    if (done === 0) return;

    renderCEScatter(result.dc, result.dq);
    renderCEAC(result.dc, result.dq);
    renderPSATable(result.dc, result.dq);
};

/* ═══════════════════════════════════════════════════════════════
   CSV EXPORT
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   CHART PNG DOWNLOAD
   ═══════════════════════════════════════════════════════════════ */

/**
 * Download a Chart.js canvas as a PNG.
 * Composites the chart on a dark background so transparent pixels
 * don't produce a white/blank image when opened in image viewers.
 *
 * @param {string} canvasId   - id of the <canvas> element
 * @param {string} filename   - suggested download filename
 */
window.downloadPSAChart = function (canvasId, filename) {
    const srcCanvas = document.getElementById(canvasId);
    if (!srcCanvas) {
        alert('Chart not found — run PSA first.');
        return;
    }

    // Check the canvas has been painted (width > 0)
    if (srcCanvas.width === 0 || srcCanvas.height === 0) {
        alert('Run PSA first to generate the chart, then download.');
        return;
    }

    // Compose onto a new canvas with app-theme dark background
    const out = document.createElement('canvas');
    out.width  = srcCanvas.width;
    out.height = srcCanvas.height;
    const ctx  = out.getContext('2d');

    // Dark background matching app theme (#080f1e)
    ctx.fillStyle = '#080f1e';
    ctx.fillRect(0, 0, out.width, out.height);

    // Draw the chart on top
    ctx.drawImage(srcCanvas, 0, 0);

    // Trigger download
    const link = document.createElement('a');
    link.download = filename || 'PSA_Chart.png';
    link.href     = out.toDataURL('image/png');
    link.click();
};

/* ═══════════════════════════════════════════════════════════════
   CSV EXPORT
   ═══════════════════════════════════════════════════════════════ */

window.exportPSACSV = function () {
    const dc = _psaDcSamples, dq = _psaDqSamples;
    if (!dc.length) { alert('Run PSA first.'); return; }
    const rows = ['iteration,delta_cost_gbp,delta_qalys,nmb_wtp25k,nmb_wtp35k,dominant,ce_wtp25k,ce_wtp35k'];
    dc.forEach((d, i) => {
        const q = dq[i];
        rows.push([
            i + 1,
            d.toFixed(4), q.toFixed(8),
            (q * 25000 - d).toFixed(4), (q * 35000 - d).toFixed(4),
            (d < 0 && q > 0 ? 1 : 0),
            (q * 25000 - d > 0 ? 1 : 0),
            (q * 35000 - d > 0 ? 1 : 0)
        ].join(','));
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'UCLTouchRehab_PSA_Results.csv';
    a.click();
    URL.revokeObjectURL(a.href);
};
