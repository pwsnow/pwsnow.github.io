/**
 * app.js – UI Controller for UCLTouchRehab PLP Health Economic Analysis
 */

/* ─── Tab Switching ─── */
window.switchTabByName = function (name) {
    const BTNS = {
        model:'btnTabModel', ceanalysis:'btnTabCeAnalysis', structure:'btnTabStructure',
        table:'btnTabTable', hta:'btnTabHta', societal:'btnTabSocietal',
        results:'btnTabResults', walkthrough:'btnTabWalkthrough'
    };
    const TABS = {
        model:'tab-model', ceanalysis:'tab-ceanalysis', structure:'tab-structure',
        table:'tab-table', hta:'tab-hta', societal:'tab-societal',
        results:'tab-results', walkthrough:'tab-walkthrough'
    };

    Object.values(BTNS).forEach(id => { const b = document.getElementById(id); if (b) b.classList.remove('active'); });
    Object.values(TABS).forEach(id => {
        const t = document.getElementById(id);
        if (t) { t.classList.remove('active'); t.style.setProperty('display','none','important'); }
    });

    const btn = document.getElementById(BTNS[name]);
    const tab = document.getElementById(TABS[name]);
    if (btn) btn.classList.add('active');
    if (tab) {
        tab.classList.add('active');
        const disp = tab.classList.contains('dashboard') ? 'grid' : 'block';
        tab.style.setProperty('display', disp, 'important');
    }

    if (name === 'societal') updateSocietalTab(window._lastRes, window._lastInputs);
    if (name === 'hta' && window._lastRes) updateHtaDisplay(window._lastRes, window._lastInputs);
    if (name === 'results' && window._lastRes) updateResultsTab(window._lastRes, window._lastInputs);
    if (name === 'ceanalysis' && typeof window.updateCeAnalysisTab === 'function') {
        window.updateCeAnalysisTab(true);
    }
};

/* ─── Chart instances ─── */
const _charts = {};
function destroyChart(id) {
    if (_charts[id]) { try { _charts[id].destroy(); } catch(e){} delete _charts[id]; }
}

/* ─── Save chart as PNG ─── */
window.saveChart = function (canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Create a temp canvas with dark background (charts are transparent by default)
    const tmp = document.createElement('canvas');
    tmp.width  = canvas.width;
    tmp.height = canvas.height;
    const ctx  = tmp.getContext('2d');

    // Fill dark background matching the app theme
    ctx.fillStyle = '#0d1829';
    ctx.fillRect(0, 0, tmp.width, tmp.height);

    // Draw the chart on top
    ctx.drawImage(canvas, 0, 0);

    // Download
    const link = document.createElement('a');
    const ts   = new Date().toISOString().slice(0,10);
    link.download = `UCLTouchRehab_${filename}_${ts}.png`;
    link.href = tmp.toDataURL('image/png');
    link.click();

    // Flash button feedback
    const btn = document.querySelector(`button[onclick*="${canvasId}"]`);
    if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.color = '#10b981';
        btn.style.opacity = '1';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; btn.style.opacity = ''; }, 1800);
    }
};

/* ─── Auto-resize chart wrapper ─── */
/**
 * After creating a chart, call this to set the wrapper height based on the data.
 * wrapperId   : id of the div.chart-wrap / div.chart-wrap-res
 * chartType   : 'scatter'|'line'|'bar'|'bar-h' (horizontal bar = tornado)
 * dataCount   : number of rows/points (for vertical bar/tornado: sets height per bar)
 * dataRange   : { min, max } for the primary axis — used to add breathing room
 * minH / maxH : pixel floor/ceiling
 */
function autoResizeChart(wrapperId, chartType, dataCount, minH, maxH) {
    const wrap = document.getElementById(wrapperId);
    if (!wrap) return;

    let h;
    if (chartType === 'bar-h') {
        // Horizontal bar (tornado): each bar needs ~36px, plus axis overhead
        h = Math.max(minH || 200, Math.min(maxH || 600, 60 + dataCount * 38));
    } else {
        // Scatter, line, vertical bar: use a comfortable fixed height scaled to data density
        // More data points → slightly taller to avoid overcrowding
        const base = minH || 280;
        h = Math.min(maxH || 420, base + Math.max(0, (dataCount - 12) * 4));
    }

    wrap.style.height = h + 'px';
}

/* ─── Cost builder (sidebar calculator for VR therapy cost) ─── */
window.calcCostBuilder = function () {
    const hw    = parseFloat(document.getElementById('cb_hw')?.value)   || 0;
    const hwyr  = parseFloat(document.getElementById('cb_hwyr')?.value) || 1;
    const ppy   = parseFloat(document.getElementById('cb_ppy')?.value)  || 1;
    const sw    = parseFloat(document.getElementById('cb_sw')?.value)   || 0;
    const tr    = parseFloat(document.getElementById('cb_tr')?.value)   || 0;
    const tryr  = parseFloat(document.getElementById('cb_tryr')?.value) || 1;
    const st    = parseFloat(document.getElementById('cb_st')?.value)   || 0;
    const cons  = parseFloat(document.getElementById('cb_cons')?.value) || 0;

    // Hardware amortised per patient = (£hw / hwyr) / ppy
    const hwPP  = (hw / hwyr) / ppy;
    // Software licence per patient = £sw/yr / ppy
    const swPP  = sw / ppy;
    // Training amortised per patient = (£tr / tryr) / ppy
    const trPP  = (tr / tryr) / ppy;
    // Staff + consumables are already per-patient
    const total = hwPP + swPP + trPP + st + cons;

    const el = document.getElementById('cb_result');
    if (el) {
        el.textContent = '£' + total.toFixed(2) + '/pt';
        el.style.color  = total <= 3916.50 ? '#10b981' : total <= 4385.25 ? '#38bdf8' : '#f59e0b';
        // Tooltip breakdown
        el.title = [
            `Hardware:  £${hwPP.toFixed(2)}/pt  (£${hw} ÷ ${hwyr}yr ÷ ${ppy}pts/yr)`,
            `Software:  £${swPP.toFixed(2)}/pt  (£${sw}/yr ÷ ${ppy}pts/yr)`,
            `Training:  £${trPP.toFixed(2)}/pt  (£${tr} ÷ ${tryr}yr ÷ ${ppy}pts/yr)`,
            `Staff:     £${st.toFixed(2)}/pt`,
            `Consumables: £${cons.toFixed(2)}/pt`,
            `─────────────────────`,
            `TOTAL:     £${total.toFixed(2)}/pt`,
        ].join('\n');
    }
    return total;
};

window.applyCostBuilder = function () {
    const total = window.calcCostBuilder();
    const field = document.getElementById('vrCost');
    if (field) {
        field.value = total.toFixed(2);
        recalculateAll();
    }
};

/* ─── AEC (Annual Equivalent Cost) helper ─── */
/**
 * Compute per-patient cost using NICE-preferred AEC/annuity method.
 * AEC = K × r(1+r)^n / [(1+r)^n − 1]   per year for the whole system
 * Per-patient = AEC / patientsPerYear
 * @param {number} K    - total system price £
 * @param {number} r    - annual discount rate (default 0.035 = 3.5%)
 * @param {number} n    - system lifespan years
 * @param {number} pts  - patients per year
 */
window.aecPerPatient = function (K, r, n, pts) {
    if (r === 0) return K / (pts * n);               // degenerate case
    const annuityFactor = r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
    return K * annuityFactor / pts;
};

/** Simple average: K ÷ (pts × n) */
window.simplePerPatient = function (K, n, pts) {
    return K / (pts * n);
};

/** Toggle flag: true = use AEC, false = use simple */
window.SP_AEC_MODE = false;

window.toggleAecMode = function (useAec) {
    window.SP_AEC_MODE = useAec;
    window.calcSystemPrice();
};

/* ─── System Price → per-patient calculator ─── */
window.calcSystemPrice = function () {
    const total = parseFloat(document.getElementById('sp_total')?.value) || 0;
    const ppy   = parseFloat(document.getElementById('sp_ppy')?.value)   || 1;
    const life  = parseFloat(document.getElementById('sp_life')?.value)  || 1;
    const r     = 0.035;  // NICE 3.5%/yr

    const simple = window.simplePerPatient(total, life, ppy);
    const aec    = window.aecPerPatient(total, r, life, ppy);
    const active = window.SP_AEC_MODE ? aec : simple;

    // Update selected result display
    const elA = document.getElementById('sp_result_simple');
    const elB = document.getElementById('sp_result_aec');
    const csFn = v => v <= 538 ? '#10b981' : v <= 1006 ? '#38bdf8' : v <= 1193 ? '#f59e0b' : '#ef4444';

    if (elA) { elA.textContent = '£' + simple.toFixed(2) + '/pt'; elA.style.color = csFn(simple); }
    if (elB) {
        elB.textContent = '£' + aec.toFixed(2) + '/pt  (' + (((aec-simple)/simple)*100).toFixed(1) + '% higher)';
        elB.style.color = csFn(aec);
    }

    // Backward-compat: keep sp_result if it exists (old callers)
    const elLeg = document.getElementById('sp_result');
    if (elLeg) {
        elLeg.textContent = '£' + active.toFixed(2) + '/pt';
        elLeg.style.color = csFn(active);
    }
    return active;
};

window.applySystemPrice = function () {
    const perPt = window.calcSystemPrice();
    const field = document.getElementById('costOneOff');
    if (field) {
        field.value = perPt.toFixed(2);
        recalculateAll();
    }
};

// Run once on load to initialise both calculators
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cb_hw'))    window.calcCostBuilder();
    if (document.getElementById('sp_total')) window.calcSystemPrice();
});


/* ─── Reverse efficacy solver ─────────────────────────────────────────────
 * Groenveld's approach: given system price, find the MINIMUM within-group
 * efficacy % that makes the model CS / CE at the specified WTP.
 *
 * Binary search on painReduction (0–50%) with the device cost set to zero
 * (thresholds are device-independent), comparing the resulting threshold
 * against the user's actual total cost.
 * ──────────────────────────────────────────────────────────────────────── */
function solveMinEfficacy(targetType, totalCost) {
    if (totalCost <= 0) return 0;
    const base = getInputs();
    let lo = 0, hi = 100;   // FIX: was capped at 50 — now sweeps full 0-100%
    for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        // Strip device cost — thresholds are independent of price
        const m = new PLPMarkovModel({ ...base, vrCost: 0, costOneOff: 0, painReduction: mid });
        const r = m.run();
        let threshold;
        if      (targetType === 'cs')   threshold = r.costSavingThreshold;
        else if (targetType === 'ce25') threshold = r.costEffectiveThreshold25 ?? r.costEffectiveThreshold;
        else                            threshold = r.costEffectiveThreshold35  ?? r.costEffectiveThreshold;
        if (threshold >= totalCost) hi = mid;
        else                        lo = mid;
    }
    const result = (lo + hi) / 2;
    // If even at 100% efficacy the threshold cannot be met, return Infinity
    const mCheck = new PLPMarkovModel({ ...base, vrCost: 0, costOneOff: 0, painReduction: 100 });
    const rCheck = mCheck.run();
    const maxThr = targetType === 'cs'   ? rCheck.costSavingThreshold
                 : targetType === 'ce25' ? (rCheck.costEffectiveThreshold25 ?? rCheck.costEffectiveThreshold)
                 :                         (rCheck.costEffectiveThreshold35  ?? rCheck.costEffectiveThreshold);
    return maxThr < totalCost ? Infinity : result;
}

/* Called from recalculateAll() whenever inputs change */
function updateMinEfficacyDisplay(inputs) {
    const totalCost = inputs.vrCost + inputs.costOneOff;
    if (totalCost <= 0) {
        setText('meCS',   '—'); setText('meCE25', '—'); setText('meCE35', '—');
        setText('meCurrent', 'Enter a price above');
        return;
    }

    const fmtEff = n => isFinite(n) ? n.toFixed(4) + '%' : '> 50%';

    const eCS   = solveMinEfficacy('cs',   totalCost);
    const eCE25 = solveMinEfficacy('ce25', totalCost);
    const eCE35 = solveMinEfficacy('ce35', totalCost);
    const eCurrent = inputs.painReduction;

    setText('meCS',   fmtEff(eCS));
    setText('meCE25', fmtEff(eCE25));
    setText('meCE35', fmtEff(eCE35));

    // Status: does your current trial data clear the bar?
    const statusEl = document.getElementById('meCurrent');
    if (statusEl) {
        if (!isFinite(eCS)) {
            statusEl.textContent = '⚠️ No efficacy achieves CS at this price';
            statusEl.style.color = '#ef4444';
        } else if (eCurrent >= eCS) {
            statusEl.innerHTML = `✅ Your efficacy (${eCurrent}%) exceeds CS bar (${fmtEff(eCS)})`;
            statusEl.style.color = '#10b981';
        } else if (eCurrent >= eCE25) {
            statusEl.innerHTML = `✅ Clears CE@£25k bar (${fmtEff(eCE25)}), below CS bar (${fmtEff(eCS)})`;
            statusEl.style.color = '#38bdf8';
        } else if (eCurrent >= eCE35) {
            statusEl.innerHTML = `⚠️ Clears CE@£35k only (bar: ${fmtEff(eCE35)})`;
            statusEl.style.color = '#f59e0b';
        } else {
            statusEl.innerHTML = `❌ Current efficacy (${eCurrent}%) is below all bars. Need ≥ ${fmtEff(eCE35)} for CE@£35k`;
            statusEl.style.color = '#ef4444';
        }
    }

    // Also update the headroom cell colour against current efficacy
    const hrEl = document.getElementById('meHeadroomBar');
    if (hrEl && isFinite(eCS)) {
        const pct = Math.min(100, (eCurrent / eCS) * 100);
        hrEl.style.width = pct.toFixed(1) + '%';
        hrEl.style.background = pct >= 100 ? '#10b981' : pct >= 70 ? '#38bdf8' : pct >= 40 ? '#f59e0b' : '#ef4444';
    }
}

/* ─── Number formatting ─── */
const fmt  = n => '£' + (isFinite(n) && !isNaN(n) ? n.toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2}) : '—');
const fmt0 = n => '£' + (isFinite(n) && !isNaN(n) ? Math.round(n).toLocaleString('en-GB') : '—');
const fmtN = (n, dp=2) => isFinite(n) && !isNaN(n) ? n.toFixed(dp) : '—';

/* ─── Safe numeric input reader ─── */
function vd(id, def) {
    const el = document.getElementById(id);
    if (!el) return def;
    const n = parseFloat(el.value);
    return isNaN(n) ? def : n;
}

function vbool(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

/* ─── Collect all inputs ─── */
function getInputs() {
    const csEl = document.getElementById('cohortSize');
    const cs   = csEl ? parseInt(csEl.value, 10) : 8231;

    // ── Read Table 1 §1 Transition Matrix inputs ──
    // Row IDs: t[row]_[col]  where row=1..18, col=1..4 (col1=Month1, col4=Month4+)
    // Row-to-matrix mapping:
    //   Rows 1-4   = PF row  (PF→PF, PF→Mild, PF→Mod, PF→Sev)
    //   Rows 5-8   = Mild row (Mild→PF, Mild→Mild, Mild→Mod, Mild→Sev)
    //   Rows 9-12  = Mod row  (Mod→PF, Mod→Mild, Mod→Mod, Mod→Sev)
    //   Rows 13-16 = Sev row  (Sev→PF, Sev→Mild, Sev→Mod, Sev→Sev)
    //   Row 17     = Any living→Death (background mortality)
    //   Row 18     = Death→Death (absorbing)
    //
    // The Table 1 HTML shows transition values WITHOUT the death column.
    // The death probability (t17) is embedded into each row by subtracting it
    // from the row's self-loop (diagonal) element, and placing it in column 4 (Death).
    // This matches the model.js convention: death probability is subtracted from the diagonal.
    const t = (id, fb) => vd(id, fb);

    // Helper to build 5x5 matrix for a given column index (1=M1, 2=M2, 3=M3, 4=M4+)
    const buildMatrix = (col) => {
        const d = t(`t17_${col}`, 0.0005);
        const p16 = t(`t16_${col}`, col === 1 ? 0.0000 : 0.9707);
        // If Sev->Sev is 0 in M1, subtract mortality from Sev->Mod (t15)
        const dSevMod = (col === 1 && p16 === 0) ? d : 0;
        const dSevSev = (col === 1 && p16 === 0) ? 0 : d;
        return [
            [ t(`t1_${col}`,  col===1?1.0000:0.8892)-d, t(`t2_${col}`,  col===1?0.0000:0.1108), t(`t3_${col}`,0.0000), t(`t4_${col}`,0.0000), d ],
            [ t(`t5_${col}`,  0.0000), t(`t6_${col}`,  col===1?1.0000:0.9200)-d, t(`t7_${col}`,  col===1?0.0000:0.0800), t(`t8_${col}`,0.0000), d ],
            [ t(`t9_${col}`,  col===1?0.1667:0.0000), t(`t10_${col}`, col===1?0.3333:0.0626), t(`t11_${col}`,col===1?0.5000:0.8748)-d, t(`t12_${col}`,col===1?0.0000:0.0626), d ],
            [ t(`t13_${col}`, col===1?0.4000:0.0000), t(`t14_${col}`, col===1?0.2000:0.0000), t(`t15_${col}`,col===1?0.4000:0.0288)-dSevMod, t(`t16_${col}`,col===1?0.0000:0.9707)-dSevSev, d ],
            [ 0.0000, 0.0000, 0.0000, 0.0000, 1.0000 ],
        ];
    };

    const tM1 = buildMatrix(1);
    const tM2 = buildMatrix(2);
    const tM3 = buildMatrix(3);
    const tM4 = buildMatrix(4);

    // ── Read Table 1 §2 GP visit inputs for all 4 time bands ──
    const gpM1     = [ vd('gp1_1',0.00), vd('gp2_1',0.50), vd('gp3_1',1.00), vd('gp4_1',1.00), 0.00 ];
    const gpM2     = [ vd('gp1_2',0.00), vd('gp2_2',0.25), vd('gp3_2',0.50), vd('gp4_2',0.50), 0.00 ];
    const gpM3     = [ vd('gp1_3',0.00), vd('gp2_3',0.25), vd('gp3_3',0.50), vd('gp4_3',0.50), 0.00 ];
    const gpM4plus = [ vd('gp1_4',0.00), vd('gp2_4',0.00), vd('gp3_4',0.111), vd('gp4_4',0.222), 0.00 ];

    return {
        wtp:               vd('wtp',            25000),
        vrCost:            vd('vrCost',          vd('mc0', 40.55)),
        costOneOff:        vd('costOneOff',       vd('mc0b', 0.00)),
        painReduction:     vd('painReduction',    50),      // default 50% calibrated efficacy
        cohortSize:        isNaN(cs) ? 8231 : cs,
        useCTMC:           vbool('useCTMC'),
        ctmcObsPeriod:     vd('ctmcObsPeriod',   3.45),
        utilPf:            vd('ut1',              vd('utilPf',   0.80)),
        utilMild:          vd('ut2',              vd('utilMild', 0.67)),
        utilMod:           vd('ut3',              vd('utilMod',  0.46)),
        utilSev:           vd('ut4',              vd('utilSev',  0.16)),
        costGabapentin:    vd('mc1',              1.60),   // £/day - BNF
        costPregabalin:    vd('mc2',              0.08),   // £/day - NHS generic
        costAmitriptyline: vd('mc3',              0.55),   // £/day - BNF
        costDuloxetine:    vd('mc4',              3.30),   // £/day - BNF
        costGpVisit:       vd('mc5',            102.00),   // £/visit - PSSRU 2024
        costSpecialist:    vd('mc6',            139.00),   // £/visit - NHS NCC 2023/24
        travelCostKm:      vd('nmc1',             0.35),
        travelDistanceKm:  vd('nmc2',             4.8),
        parkingCost:       vd('nmc3',             3.50),
        costCaregiverRate: vd('nmc4',            25.05),   // £/hr - DHSC MSIF 2025-26
        durMild:           vd('nmc5',             0.0),     // hrs/day Mild PLP
        durMod:            vd('nmc6',             1.0),     // hrs/day Moderate PLP
        durSev:            vd('nmc7',             2.0),     // hrs/day Severe PLP
        durConst:          vd('nmc8',            24.0),
        // Table 1 §1 transition matrices
        tMatrix1: tM1,
        tMatrix2: tM2,
        tMatrix3: tM3,
        tMatrix4: tM4,
        // Table 1 §2 GP visit schedules
        gpM1, gpM2, gpM3, gpM4plus,
    };
}

/* ─── Debounce helper for auto-refresh ─── */
let _debounceTimer = null;
function scheduleRefresh() {
    // Auto-refresh disabled â use the Recalculate Model button
}

/* ─── Wire auto-refresh to all dashboard inputs ─── */
function wireAutoRefresh() {
    // Visual sync only: mc0/mc0b mirror vrCost/costOneOff, ut1..ut4 mirror utilPf..utilSev
    [
        ['mc0','vrCost'], ['mc0b','costOneOff'],
        ['ut1','utilPf'], ['ut2','utilMild'], ['ut3','utilMod'], ['ut4','utilSev']
    ].forEach(([tId,sId]) => {
        const t = document.getElementById(tId);
        const s = document.getElementById(sId);
        if (!t || !s) return;
        t.addEventListener('input',  () => { s.value = t.value; });
        t.addEventListener('change', () => { s.value = t.value; });
        s.addEventListener('input',  () => { t.value = s.value; });
        s.addEventListener('change', () => { t.value = s.value; });
    });
}

/* ─── Main Recalculate ─── */
function recalculateAll() {
    const statusEl = document.getElementById('statusText');
    if (statusEl) statusEl.textContent = 'Calculating…';

    // Use setTimeout so browser can repaint status first
    setTimeout(() => {
        let res, inputs, model;
        try {
            inputs = getInputs();
            model  = new PLPMarkovModel(inputs);
            res    = model.run();
            window._lastRes    = res;
            window._lastInputs = inputs;
            window._lastModel  = model;
        } catch(err) {
            console.error('[recalculate] Model error:', err);
            if (statusEl) statusEl.textContent = '⚠ Model error: ' + err.message;
            return;
        }

        // Run each chart update independently so one failure doesn't block others
        const safe = (label, fn) => {
            try { fn(); }
            catch(e) { console.error('[' + label + ']', e); }
        };

        safe('kpis',        () => updateKpis(res, inputs));
        safe('badges',      () => updateBadges(res, inputs));
        safe('paramSummary',() => updateParamSummary(res, inputs));
        safe('minEfficacy', () => updateMinEfficacyDisplay(inputs));
        safe('cePlane',     () => updateCePlane(res, inputs));
        safe('cohortTrace', () => updateCohortTrace(res));
        safe('headroom',    () => updateHeadroom(res, inputs));
        safe('tornado',     () => updateTornado(res));
        safe('tornadoMR',   () => updateTornadoMR(res));
        safe('fig2',        () => updateFig2Threshold(res, inputs));
        safe('hta',         () => updateHtaDisplay(res, inputs));
        safe('ctmc',        () => updateCtmcPanel(model));
        safe('societal',    () => updateSocietalTab(res, inputs));
        safe('resultsTab',  () => updateResultsTab(res, inputs));
        safe('adaptTab',    () => updateAdaptationTab(res, inputs));
        safe('groenveld',   () => updateGroenveldThreshold(res, inputs));
        safe('ceAnalysis',  () => { if (typeof window.updateCeAnalysisTab === 'function') window.updateCeAnalysisTab(); });

        if (statusEl) statusEl.textContent = '✓ Updated ' + new Date().toLocaleTimeString('en-GB');
        document.dispatchEvent(new CustomEvent('modelrecalculated'));
    }, 10);
}

/* ─── Parameter Summary Panel ─── */
function updateParamSummary(res, inputs) {
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const fC = v => (v < 0 ? '-£' : '£') + Math.abs(v).toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2});
    const ri = (id, fb) => {
        const e = document.getElementById(id);
        if (!e) return fb;
        const n = Number(e.value);
        return isNaN(n) ? fb : n;
    };
    const vrCost   = ri('vrCost',       40.55);
    const oneOff   = ri('costOneOff',    0);
    const efficacy = ri('painReduction', 50);
    const wtp      = ri('wtp',           25000);
    const gp       = ri('mc5',           102.00);
    const spec     = ri('mc6',          139.00);
    const carer    = ri('nmc4',          25.05);
    const uPf      = ri('utilPf',         0.80);
    const uMild    = ri('utilMild',       0.67);
    const uMod     = ri('utilMod',        0.46);
    const uSev     = ri('utilSev',        0.16);
    const discount = inputs.discountRate ?? 0.035;

    set('ps_timestamp',  new Date().toLocaleString('en-GB',{dateStyle:'short',timeStyle:'medium'}));
    set('ps_efficacy',   efficacy.toFixed(1) + '%');
    set('ps_discount',   (discount * 100).toFixed(1));
    set('ps_vrCost',     fC(vrCost));
    set('ps_oneOff',     fC(oneOff));
    set('ps_gp',         fC(gp));
    set('ps_spec',       fC(spec));
    set('ps_carer',      fC(carer));
    set('ps_uPf',        uPf.toFixed(3));
    set('ps_uMild',      uMild.toFixed(3));
    set('ps_uMod',       uMod.toFixed(3));
    set('ps_uSev',       uSev.toFixed(3));
    set('ps_wtp',        '£' + wtp.toLocaleString('en-GB'));
    set('ps_dC',         fC(res.incCost));
    set('ps_dE',         '+' + res.incQaly.toFixed(4));
    set('ps_nmb',        fC(res.nmb));
    set('ps_csThresh',   fC(res.costSavingThreshold));
    set('ps_ce25Thresh', fC(res.costEffectiveThreshold25 ?? 0));

    const dom = res.incCost < 0 && res.incQaly > 0;
    const ce  = !dom && res.nmb > 0;
    if (dom)                                  set('ps_icer', 'Dominant — saves £' + Math.round(Math.abs(res.incCost/res.incQaly)).toLocaleString('en-GB') + '/QALY');
    else if (isFinite(res.icer) && res.incQaly > 0) set('ps_icer', '£' + Math.round(res.icer).toLocaleString('en-GB') + '/QALY');
    else                                      set('ps_icer', 'N/A');

    const dCel  = document.getElementById('ps_dC');
    if (dCel)  dCel.style.color  = res.incCost < 0 ? '#10b981' : '#f59e0b';
    const nmbEl = document.getElementById('ps_nmb');
    if (nmbEl) nmbEl.style.color = res.nmb >= 0 ? '#10b981' : '#ef4444';

    const badge = document.getElementById('ps_badge');
    if (badge) {
        const cfg = dom ? {t:'Dominant',bg:'rgba(16,185,129,.15)',col:'#10b981',bd:'rgba(16,185,129,.35)'}
                  : ce  ? {t:'Cost-Effective',bg:'rgba(245,158,11,.12)',col:'#f59e0b',bd:'rgba(245,158,11,.3)'}
                  :        {t:'Not CE',bg:'rgba(239,68,68,.12)',col:'#ef4444',bd:'rgba(239,68,68,.3)'};
        badge.textContent = cfg.t;
        Object.assign(badge.style, {background:cfg.bg, color:cfg.col, borderColor:cfg.bd});
    }
    const col  = dom ? '#10b981' : ce ? '#f59e0b' : '#ef4444';
    const bg   = dom ? 'rgba(16,185,129,.07)' : ce ? 'rgba(245,158,11,.06)' : 'rgba(239,68,68,.06)';
    const bdr  = dom ? 'rgba(16,185,129,.2)'  : ce ? 'rgba(245,158,11,.2)'  : 'rgba(239,68,68,.2)';
    const card  = document.getElementById('ps_resultsCard');
    const label = document.getElementById('ps_resultsLabel');
    if (card)  { card.style.background = bg; card.style.borderColor = bdr; }
    if (label)   label.style.color = col;
}

/* ─── KPI Updates ─── */
function updateKpis(res, inputs) {
    setText('kpiIncCost', fmt(res.incCost));
    setText('kpiIncQaly', fmtN(res.incQaly, 4));
    colorEl('kpiNmb', res.nmb >= 0 ? 'var(--success)' : 'var(--danger)');
    setText('kpiNmb', fmt(res.nmb));

    if (res.incCost < 0 && res.incQaly > 0) {
        // Dominant: show the actual ratio value so it has scientific meaning
        const savingPerQaly = Math.abs(res.incCost / res.incQaly);
        setText('kpiIcer', `🌟 £${Math.round(savingPerQaly).toLocaleString('en-GB')}/QALY saved`);
        setText('kpiIcerSub', 'Dominant — cost-saving AND more QALYs');
        colorEl('kpiIcer', 'var(--accent-purple)');
    } else if (!isFinite(res.icer) || res.incQaly <= 0) {
        setText('kpiIcer', 'Dominated');
        setText('kpiIcerSub', 'Less effective than usual care (ΔE ≤ 0)');
        colorEl('kpiIcer', 'var(--danger)');
    } else {
        setText('kpiIcer', fmt0(res.icer) + '/QALY');
        const ce = res.icer <= inputs.wtp;
        setText('kpiIcerSub', ce ? '✅ Cost-effective @ WTP' : '⚠️ Above WTP threshold');
        colorEl('kpiIcer', ce ? 'var(--success)' : 'var(--warning)');
    }
}

/* ─── Badge Row (legacy compat) + Live Threshold Panel ─── */
function updateBadges(res, inputs) {
    // Legacy badge fields (hidden but kept for other code that may reference them)
    setText('badgeCsSavVal', fmt0(res.costSavingThreshold));
    setText('badgeCeEffVal', fmt0(res.costEffectiveThreshold));

    const el   = document.getElementById('badgeStatus');
    const icon = document.getElementById('badgeStatusIcon');
    const val  = document.getElementById('badgeStatusVal');
    if (res.incCost < 0 && res.incQaly > 0) {
        setClass(el, 'badge-card badge-dominant');
        if (icon) icon.textContent = '🌟';
        if (val)  { val.textContent = 'Dominant'; val.style.color = 'var(--accent-purple)'; }
    } else if (isFinite(res.icer) && res.icer <= inputs.wtp && res.incQaly > 0) {
        setClass(el, 'badge-card badge-eff');
        if (icon) icon.textContent = '✅';
        if (val)  { val.textContent = 'Cost-Effective'; val.style.color = 'var(--success)'; }
    } else if (res.incQaly <= 0) {
        setClass(el, 'badge-card badge-danger');
        if (icon) icon.textContent = '❌';
        if (val)  { val.textContent = 'Dominated'; val.style.color = 'var(--danger)'; }
    } else {
        setClass(el, 'badge-card');
        if (icon) icon.textContent = '⚠️';
        if (val)  { val.textContent = 'Above WTP'; val.style.color = 'var(--warning)'; }
    }

    // ── Live Threshold Panel ──
    const cs   = res.costSavingThreshold;
    const ce25 = res.costEffectiveThreshold25 !== undefined ? res.costEffectiveThreshold25 : res.costEffectiveThreshold;
    const ce35 = res.costEffectiveThreshold35 !== undefined ? res.costEffectiveThreshold35 : (res.costEffectiveThreshold + (35000-25000)*(res.incQaly));
    const cur  = inputs.vrCost + inputs.costOneOff;
    const headroom = cs - cur;
    const savings  = cs;   // cs ceiling = downstream savings when device cost = 0
    const dq       = res.incQaly; // note: incQaly computed at current price — but savings = cs is device-independent

    const fmtTh  = n => (isFinite(n) && !isNaN(n)) ? '£' + n.toFixed(2) : '—';
    const fmtTh0 = n => (isFinite(n) && !isNaN(n)) ? '£' + Math.round(n).toLocaleString('en-GB') : '—';

    setText('thCS',         fmtTh(cs));
    setText('thCE25',       fmtTh(ce25));
    setText('thCE35',       fmtTh(ce35));
    setText('thCurrent',    fmtTh(cur));
    setText('thHeadroom',   headroom >= 0 ? '+' + fmtTh(headroom) : fmtTh(headroom));
    setText('thSavingsVal', fmtTh(savings));
    setText('thDeltaQVal',  isFinite(dq) ? dq.toFixed(6) : '—');

    // ICER display
    const icerEl = document.getElementById('thIcerVal');
    if (icerEl) {
        if (res.incCost < 0 && res.incQaly > 0) {
            icerEl.textContent = `Dominant (saves ${fmtTh(Math.abs(res.icer))}/QALY)`;
            icerEl.style.color = '#a855f7';
        } else if (!isFinite(res.icer) || res.incQaly <= 0) {
            icerEl.textContent = 'N/A (ΔE ≤ 0)';
            icerEl.style.color = '#ef4444';
        } else {
            icerEl.textContent = fmtTh0(res.icer) + '/QALY';
            icerEl.style.color = res.icer <= 25000 ? '#10b981' : res.icer <= 35000 ? '#f59e0b' : '#ef4444';
        }
    }

    // Headroom colour
    const hrEl = document.getElementById('thHeadroom');
    if (hrEl) hrEl.style.color = headroom > 100 ? '#10b981' : headroom > 0 ? '#f59e0b' : '#ef4444';

    // Current status badge inside the tile
    const csEl = document.getElementById('thCurrentStatus');
    if (csEl) {
        if (cur <= cs)   { csEl.textContent = '✅ Cost-Saving';   csEl.style.color = '#10b981'; }
        else if (cur <= ce25) { csEl.textContent = '✅ CE @ £25k'; csEl.style.color = '#38bdf8'; }
        else if (cur <= ce35) { csEl.textContent = '⚠️ CE @ £35k'; csEl.style.color = '#f59e0b'; }
        else              { csEl.textContent = '❌ Not CE';        csEl.style.color = '#ef4444'; }
    }

    // Verdict pill
    const vEl = document.getElementById('thresholdVerdict');
    if (vEl) {
        if (res.incCost < 0 && res.incQaly > 0) {
            vEl.textContent = '🌟 Dominant — saves money & improves outcomes';
            vEl.style.background = 'rgba(168,85,247,.12)'; vEl.style.color = '#a855f7'; vEl.style.borderColor = 'rgba(168,85,247,.35)';
        } else if (cur <= cs) {
            vEl.textContent = '✅ Cost-Saving at current price';
            vEl.style.background = 'rgba(16,185,129,.12)'; vEl.style.color = '#10b981'; vEl.style.borderColor = 'rgba(16,185,129,.35)';
        } else if (cur <= ce25) {
            vEl.textContent = '✅ Cost-Effective @ £25k WTP';
            vEl.style.background = 'rgba(56,189,248,.12)'; vEl.style.color = '#38bdf8'; vEl.style.borderColor = 'rgba(56,189,248,.35)';
        } else if (cur <= ce35) {
            vEl.textContent = '⚠️ CE @ £35k band only';
            vEl.style.background = 'rgba(245,158,11,.1)'; vEl.style.color = '#f59e0b'; vEl.style.borderColor = 'rgba(245,158,11,.3)';
        } else {
            vEl.textContent = '❌ Exceeds CE thresholds';
            vEl.style.background = 'rgba(239,68,68,.08)'; vEl.style.color = '#ef4444'; vEl.style.borderColor = 'rgba(239,68,68,.25)';
        }
    }

    // Validation strip — human-readable algebraic confirmation
    const stripEl = document.getElementById('thValidationStrip');
    if (stripEl) {
        const nmb25 = isFinite(dq) ? (dq * 25000 - res.incCost).toFixed(2) : '—';
        const nmb35 = isFinite(dq) ? (dq * 35000 - res.incCost).toFixed(2) : '—';
        stripEl.innerHTML =
            `<strong style="color:#10b981;">Verified:</strong>&nbsp;&nbsp;` +
            `CS ceiling = savings = <strong>${fmtTh(cs)}</strong>&nbsp;|&nbsp;` +
            `CE25 = savings + 25,000 × ${isFinite(dq)?dq.toFixed(6):'—'} = <strong>${fmtTh(ce25)}</strong>&nbsp;|&nbsp;` +
            `CE35 = savings + 35,000 × ${isFinite(dq)?dq.toFixed(6):'—'} = <strong>${fmtTh(ce35)}</strong>&nbsp;|&nbsp;` +
            `NMB@£25k = <strong style="color:${parseFloat(nmb25)>=0?'#10b981':'#ef4444'}">${parseFloat(nmb25)>=0?'+':''}£${Math.abs(parseFloat(nmb25)).toFixed(2)}</strong>&nbsp;|&nbsp;` +
            `NMB@£35k = <strong style="color:${parseFloat(nmb35)>=0?'#10b981':'#ef4444'}">${parseFloat(nmb35)>=0?'+':''}£${Math.abs(parseFloat(nmb35)).toFixed(2)}</strong>`;
    }
}

/* ── CE Plane A — Deterministic Efficacy Sweep ── */
function updateCePlane(res, inputs) {
    destroyChart('ce');
    const canvas = document.getElementById('cePlaneChart');
    if (!canvas) return;

    // ── Run deterministic Markov sweep: efficacy 0 % → 100 % in 5 % steps ──
    // Each point = full Markov simulation at that efficacy level; all other params fixed.
    const sweepPoints = [];
    const step = 5;
    for (let eff = 0; eff <= 100; eff += step) {
        try {
            const m   = new PLPMarkovModel({ ...inputs, painReduction: eff });
            const sc2 = m.simulateArm(false);
            const vr2 = m.simulateArm(true);
            const dq  = vr2.totalQALYs - sc2.totalQALYs;
            const dc  = vr2.totalCosts  - sc2.totalCosts;
            if (isFinite(dq) && isFinite(dc)) {
                sweepPoints.push({ x: dq, y: dc, eff });
            }
        } catch(e) { /* skip failed iterations */ }
    }

    if (!sweepPoints.length) return;

    // ── Split sweep into CE regions for colour-coding ──
    const wtp = inputs.wtp || 25000;
    const ptsDominant = sweepPoints.filter(p => p.y < 0 && p.x > 0);
    const ptsCeOnly   = sweepPoints.filter(p => !(p.y < 0 && p.x > 0) && p.x > 0 && p.y < p.x * wtp);
    const ptsNotCe    = sweepPoints.filter(p => !(p.y < 0 && p.x > 0) && !(p.x > 0 && p.y < p.x * wtp));

    // ── Axis bounds from sweep data ──
    const allX = sweepPoints.map(p => p.x);
    const allY = sweepPoints.map(p => p.y);
    const pad  = 0.12;
    const xSpan = Math.max(Math.max(...allX) - Math.min(...allX), 0.001);
    const ySpan = Math.max(Math.max(...allY) - Math.min(...allY), 10);
    let xMin = Math.min(...allX) - xSpan * pad;
    let xMax = Math.max(...allX) + xSpan * pad;
    let yMin = Math.min(...allY) - ySpan * pad;
    let yMax = Math.max(...allY) + ySpan * pad;
    // Always include origin so quadrant lines are visible
    if (xMin > 0) xMin = -xSpan * 0.03;
    if (xMax < 0) xMax =  xSpan * 0.03;
    if (yMin > 0) yMin = -ySpan * 0.03;
    if (yMax < 0) yMax =  ySpan * 0.03;
    xMin = Math.round(xMin * 10000) / 10000;
    xMax = Math.round(xMax * 10000) / 10000;
    yMin = Math.round(yMin / 10) * 10;
    yMax = Math.round(yMax / 10) * 10;

    // Honour explicit user axis overrides
    const userXmin = parseFloat(document.getElementById('axCeXmin')?.value);
    const userXmax = parseFloat(document.getElementById('axCeXmax')?.value);
    const userYmin = parseFloat(document.getElementById('axCeYmin')?.value);
    const userYmax = parseFloat(document.getElementById('axCeYmax')?.value);
    if (isFinite(userXmin) && userXmin < xMin) xMin = userXmin;
    if (isFinite(userXmax) && userXmax > xMax) xMax = userXmax;
    if (isFinite(userYmin) && userYmin < yMin) yMin = userYmin;
    if (isFinite(userYmax) && userYmax > yMax) yMax = userYmax;

    const updEl = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
    updEl('axCeXmin', xMin); updEl('axCeXmax', xMax);
    updEl('axCeYmin', yMin); updEl('axCeYmax', yMax);

    // WTP threshold line across full axis range
    const wtpLine = [{ x: xMin, y: xMin * wtp }, { x: xMax, y: xMax * wtp }];

    const fmtTick = v => {
        if (Math.abs(v) >= 1000) return (v < 0 ? '-£' : '£') + Math.abs(v / 1000).toFixed(1) + 'k';
        return (v < 0 ? '-£' : '£') + Math.abs(Math.round(v));
    };

    _charts['ce'] = new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        data: {
            datasets: [
                {
                    // Full sweep as a connected line (grey, behind coloured dots)
                    label: 'Efficacy sweep trajectory (0%→100%)',
                    data:  sweepPoints,
                    type:  'line',
                    borderColor: 'rgba(148,163,184,0.35)',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.3,
                    showLine: true,
                    order: 4
                },
                {
                    label: '🟢 Dominant (ΔC<0 & ΔE>0)',
                    data:  ptsDominant,
                    backgroundColor: 'rgba(16,185,129,0.85)',
                    pointRadius: 5,
                    pointStyle: 'circle',
                    order: 2
                },
                {
                    label: '🟡 CE-only (ICER ≤ WTP)',
                    data:  ptsCeOnly,
                    backgroundColor: 'rgba(245,158,11,0.85)',
                    pointRadius: 5,
                    pointStyle: 'circle',
                    order: 2
                },
                {
                    label: '🔴 Not CE (ICER > WTP)',
                    data:  ptsNotCe,
                    backgroundColor: 'rgba(239,68,68,0.75)',
                    pointRadius: 5,
                    pointStyle: 'circle',
                    order: 2
                },
                {
                    // Base-case efficacy point (highlighted diamond)
                    label: `Base Case (◆ ${(inputs.painReduction || 0).toFixed(0)}% efficacy)`,
                    data:  [{ x: res.incQaly, y: res.incCost }],
                    backgroundColor: res.nmb >= 0 ? '#10b981' : '#ef4444',
                    pointStyle: 'rectRot',
                    pointRadius: 14,
                    order: 1
                },
                {
                    label: `WTP Line (£${wtp.toLocaleString('en-GB')}/QALY)`,
                    data:  wtpLine,
                    type: 'line',
                    borderColor: 'rgba(245,158,11,0.75)',
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    order: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: c => {
                            const p = c.raw;
                            const effLabel = (p && p.eff !== undefined) ? ` (efficacy ${p.eff}%)` : '';
                            return `ΔE=${fmtN(c.parsed.x, 4)}, ΔC=${fmt(c.parsed.y)}${effLabel}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: xMin, max: xMax,
                    title: { display: true, text: 'Incremental QALYs (ΔE)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8', callback: v => fmtN(v, 3) },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    min: yMin, max: yMax,
                    title: { display: true, text: 'Incremental Cost (ΔC) [£]', color: '#94a3b8' },
                    ticks: { color: '#94a3b8', callback: fmtTick },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
    autoResizeChart('wrap-cePlaneChart', 'scatter', sweepPoints.length, 280, 380);
    if (_charts['ce']) _charts['ce'].resize();
}




/* ── CE Plane B — PSA only (cePSAChart) ── */
function updateCePlanePSA(res, inputs) {
    destroyChart('cePSA');
    const canvas = document.getElementById('cePSAChart');
    if (!canvas) return;

    const psaPoints = res.psa || [];
    console.log('[cePSAChart] psa points:', psaPoints.length, '| res.psa type:', typeof res.psa);
    if (!psaPoints.length) {
        console.warn('[cePSAChart] EMPTY — PSA may have failed in model.run(). Check statusText.');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#475569';
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PSA not available — click \u201cRecalculate Model\u201d', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Colour-code each point by CE region
    const wtp = inputs.wtp || 25000;
    const coloured = psaPoints.map(p => ({
        x: p.x,
        y: p.y,
        // Dominant (cost-saving + health gain) → green, CE-only → amber, not-CE → red
        bg: (p.y < 0 && p.x > 0) ? 'rgba(16,185,129,0.55)'
          : (p.x > 0 && p.y < p.x * wtp) ? 'rgba(245,158,11,0.55)'
          : 'rgba(239,68,68,0.45)'
    }));

    // Determine axis bounds from PSA data
    const allX = psaPoints.map(p => p.x).filter(isFinite);
    const allY = psaPoints.map(p => p.y).filter(isFinite);
    const pad  = 0.15;
    const xSpan = Math.max(Math.max(...allX) - Math.min(...allX), 0.001);
    const ySpan = Math.max(Math.max(...allY) - Math.min(...allY), 10);
    let xMin = Math.min(...allX) - xSpan * pad;
    let xMax = Math.max(...allX) + xSpan * pad;
    let yMin = Math.min(...allY) - ySpan * pad;
    let yMax = Math.max(...allY) + ySpan * pad;
    // Always include origin so quadrant lines are visible
    if (xMin > 0) xMin = -xSpan * 0.04;
    if (xMax < 0) xMax =  xSpan * 0.04;
    if (yMin > 0) yMin = -ySpan * 0.04;
    if (yMax < 0) yMax =  ySpan * 0.04;
    xMin = Math.round(xMin * 1000) / 1000;
    xMax = Math.round(xMax * 1000) / 1000;
    yMin = Math.round(yMin / 10) * 10;
    yMax = Math.round(yMax / 10) * 10;

    const fmtTick = v => {
        if (Math.abs(v) >= 1000) return (v < 0 ? '-£' : '£') + Math.abs(v / 1000).toFixed(1) + 'k';
        return (v < 0 ? '-£' : '£') + Math.abs(Math.round(v));
    };

    const wtpLine = [
        { x: xMin, y: xMin * wtp },
        { x: xMax, y: xMax * wtp }
    ];

    _charts['cePSA'] = new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '🟢 Cost-Saving (ΔC<0 & ΔE>0)',
                    data:  coloured.filter(p => p.bg.startsWith('rgba(16,185')),
                    backgroundColor: 'rgba(16,185,129,0.55)',
                    pointRadius: 2.5,
                    order: 3
                },
                {
                    label: '🟡 CE-only (ICER ≤ WTP)',
                    data:  coloured.filter(p => p.bg.startsWith('rgba(245,158')),
                    backgroundColor: 'rgba(245,158,11,0.55)',
                    pointRadius: 2.5,
                    order: 3
                },
                {
                    label: '🔴 Not CE (ICER > WTP)',
                    data:  coloured.filter(p => p.bg.startsWith('rgba(239,68')),
                    backgroundColor: 'rgba(239,68,68,0.45)',
                    pointRadius: 2.5,
                    order: 3
                },
                {
                    label: 'Base Case (◆)',
                    data:  [{ x: res.incQaly, y: res.incCost }],
                    backgroundColor: res.nmb >= 0 ? '#10b981' : '#ef4444',
                    pointStyle: 'rectRot',
                    pointRadius: 13,
                    order: 1
                },
                {
                    label: `WTP Line (£${wtp.toLocaleString('en-GB')}/QALY)`,
                    data:  wtpLine,
                    type: 'line',
                    borderColor: 'rgba(245,158,11,0.75)',
                    borderDash: [6, 4],
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } } },
                tooltip: {
                    callbacks: {
                        label: c => {
                            const region = c.datasetIndex === 0 ? 'Cost-Saving'
                                         : c.datasetIndex === 1 ? 'CE-only'
                                         : c.datasetIndex === 2 ? 'Not CE' : 'Base Case';
                            return `${region}: ΔE=${fmtN(c.parsed.x,4)}, ΔC=${fmt(c.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: xMin, max: xMax,
                    title: { display: true, text: 'Incremental QALYs (ΔE)', color: '#94a3b8' },
                    ticks: { color: '#94a3b8', callback: v => fmtN(v, 3) },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    min: yMin, max: yMax,
                    title: { display: true, text: 'Incremental Cost (ΔC) [£]', color: '#94a3b8' },
                    ticks: { color: '#94a3b8', callback: fmtTick },
                    grid:  { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
    autoResizeChart('wrap-cePSAChart', 'scatter', psaPoints.length, 280, 380);
    if (_charts['cePSA']) _charts['cePSA'].resize();
}


function updateCohortTrace(res) {
    destroyChart('trace');
    const canvas = document.getElementById('cohortTraceChart');
    if (!canvas) return;

    const labels = Array.from({length:12},(_,i) => 'M'+(i+1));
    const cols   = ['#38bdf8','#10b981','#f59e0b','#ef4444','#64748b'];
    const names  = ['Pain Free','Mild PLP','Moderate PLP','Severe PLP','Death'];

    _charts['trace'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                ...names.map((name,i) => ({
                    label: name + ' (VR)', data: res.vr.cohortHistory.map(h => +(h[i]*100).toFixed(2)),
                    borderColor: cols[i], backgroundColor:'transparent', fill:false,
                    tension:0.3, pointRadius:3, borderWidth:2
                })),
                ...names.map((name,i) => ({
                    label: name + ' (UC)', data: res.sc.cohortHistory.map(h => +(h[i]*100).toFixed(2)),
                    borderColor: cols[i], backgroundColor:'transparent', fill:false,
                    tension:0.3, pointRadius:2, borderWidth:1.5, borderDash:[4,3]
                }))
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', boxWidth:10, font:{size:10} } } },
            scales: {
                x:{ title:{display:true, text:'Monthly Cycle', color:'#94a3b8'}, ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.05)'} },
                y:{ title:{display:true, text:'% of Cohort', color:'#94a3b8'},
                    ticks:{color:'#94a3b8', callback:v=>v+'%'}, grid:{color:'rgba(255,255,255,0.05)'}, min:0, max:100 }
            }
        }
    });
    // Auto-resize: 12-month trace with 10 datasets — taller for legend
    autoResizeChart('wrap-cohortTraceChart', 'line', 12, 300, 420);
    if (_charts['trace']) _charts['trace'].resize();
}


function updateHeadroom(res, inputs) {
    destroyChart('hr');
    const canvas = document.getElementById('headroomChart');
    if (!canvas) return;

    // Auto-scale Y axis from actual model data
    const csValues  = res.headroom.map(h => h.costSavingMax).filter(isFinite);
    const ceValues  = res.headroom.map(h => h.costEffectiveMax).filter(isFinite);
    const dataCeMax = Math.max(...ceValues, ...csValues, 100);
    const autoYmax  = Math.ceil(dataCeMax * 1.15 / 500) * 500;
    const userYmax  = vd('axHrYmax', 6000);
    const yMax      = Math.max(autoYmax, userYmax);
    const axEl = document.getElementById('axHrYmax');
    if (axEl && parseFloat(axEl.value) < autoYmax) axEl.value = autoYmax;

    // Zone threshold values (constant across efficacy — from base model)
    const csThresh = res.costSavingThreshold  || (csValues.length ? csValues[Math.floor(csValues.length/2)] : 3916);
    const ceThresh = res.costEffectiveThreshold25 || (ceValues.length ? ceValues[Math.floor(ceValues.length/2)] : 4385);
    const labels   = res.headroom.map(h => h.effectiveness + '%');
    const nPts     = labels.length;

    _charts['hr'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                // ── Zone fills (drawn first, behind lines) ──────────
                {
                    // Top zone: Not Cost-Effective (above CE line)
                    label: 'Not Cost-Effective Zone',
                    data:  res.headroom.map(() => yMax),
                    backgroundColor: 'rgba(239,68,68,0.07)',
                    borderColor: 'transparent',
                    fill: true,
                    pointRadius: 0, tension: 0, borderWidth: 0,
                    order: 10
                },
                {
                    // Middle zone: Cost-Effective (between CS and CE lines) — drawn over top
                    label: 'Cost-Effective Zone',
                    data:  res.headroom.map(h => h.costEffectiveMax),
                    backgroundColor: 'rgba(56,189,248,0.10)',
                    borderColor: 'transparent',
                    fill: true,
                    pointRadius: 0, tension: 0.3, borderWidth: 0,
                    order: 9
                },
                {
                    // Bottom zone: Cost-Saving (below CS line)
                    label: 'Cost-Saving Zone',
                    data:  res.headroom.map(h => h.costSavingMax),
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    borderColor: 'transparent',
                    fill: true,
                    pointRadius: 0, tension: 0.3, borderWidth: 0,
                    order: 8
                },
                // ── Boundary lines ───────────────────────────────────
                {
                    label: '— Cost-Saving Ceiling (£)',
                    data:  res.headroom.map(h => h.costSavingMax),
                    borderColor: '#10b981', backgroundColor: 'transparent',
                    fill: false, tension: 0.3, borderWidth: 2.5,
                    pointRadius: 3, pointBackgroundColor: '#10b981',
                    order: 3
                },
                {
                    label: `— Cost-Effective Ceiling @ £${inputs.wtp.toLocaleString('en-GB')}/QALY (£)`,
                    data:  res.headroom.map(h => h.costEffectiveMax),
                    borderColor: '#38bdf8', backgroundColor: 'transparent',
                    fill: false, tension: 0.3, borderWidth: 2.5,
                    pointRadius: 3, pointBackgroundColor: '#38bdf8',
                    order: 2
                },
                {
                    label: `— Current Price £${(inputs.vrCost + inputs.costOneOff).toFixed(2)}/patient`,
                    data:  res.headroom.map(() => inputs.vrCost + inputs.costOneOff),
                    borderColor: '#f59e0b', backgroundColor: 'transparent',
                    borderDash: [7, 4], pointRadius: 0,
                    fill: false, tension: 0, borderWidth: 2,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8', boxWidth: 14, font: { size: 11 },
                        filter: item => !item.text.includes('Zone')  // hide zone fills from legend
                    }
                },
                tooltip: {
                    callbacks: {
                        label: c => {
                            const v = c.raw;
                            if (!isFinite(v)) return '';
                            return `${c.dataset.label}: £${Math.round(v).toLocaleString('en-GB')}/patient`;
                        }
                    }
                },
                // Zone labels via afterDraw plugin
                afterDraw: undefined
            },
            scales: {
                x: {
                    title: { display: true, text: 'Effect of VR Therapy (%)', color: '#94a3b8', font: { size: 12, weight: '600' } },
                    ticks: { color: '#94a3b8', maxRotation: 0 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Cost of VR Therapy per Patient (£)', color: '#94a3b8', font: { size: 12, weight: '600' } },
                    ticks: { color: '#94a3b8', callback: v => '£' + v.toLocaleString('en-GB') },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0, max: yMax
                }
            }
        },
        plugins: [{
            // Draw zone labels directly on canvas
            id: 'zoneLabels',
            afterDraw(chart) {
                const ctx  = chart.ctx;
                const xEnd = chart.chartArea.right;
                const xMid = (chart.chartArea.left + chart.chartArea.right) / 2;
                const yA   = chart.scales.y;

                const csMax = Math.max(...res.headroom.map(h => h.costSavingMax).filter(isFinite), 0);
                const ceMax = Math.max(...res.headroom.map(h => h.costEffectiveMax).filter(isFinite), 0);
                const yCsTop = yA.getPixelForValue(csMax);
                const yCeTop = yA.getPixelForValue(ceMax);
                const yBot  = chart.chartArea.bottom;
                const yTop  = chart.chartArea.top;

                ctx.save();
                ctx.font = 'bold 11px Inter, system-ui, sans-serif';
                ctx.textAlign = 'right';

                // Cost-Saving zone label (green)
                const yCs = (yCsTop + yBot) / 2;
                ctx.fillStyle = 'rgba(16,185,129,0.85)';
                ctx.fillText('✓ Cost-Saving', xEnd - 8, yCs);

                // Cost-Effective zone label (blue)
                if (yCeTop < yCsTop - 20) {
                    const yCe = (yCeTop + yCsTop) / 2;
                    ctx.fillStyle = 'rgba(56,189,248,0.85)';
                    ctx.fillText('✓ Cost-Effective', xEnd - 8, yCe);
                }

                // Not Cost-Effective zone label (red)
                if (yTop < yCeTop - 20) {
                    const yNce = (yTop + yCeTop) / 2;
                    ctx.fillStyle = 'rgba(239,68,68,0.75)';
                    ctx.fillText('✗ Not Cost-Effective', xEnd - 8, yNce);
                }

                ctx.restore();
            }
        }]
    });

    const hrPoints = res.headroom ? res.headroom.length : 21;
    autoResizeChart('wrap-headroomChart', 'line', hrPoints, 300, 420);
    if (_charts['hr']) _charts['hr'].resize();
}


function updateTornado(res) {
    destroyChart('tor');
    const canvas = document.getElementById('tornadoChart');
    if (!canvas || !res.tornado) return;
    renderTornadoOnCanvas('tor', canvas, res, 'wrap-tornadoChart');
}


/* ─── Model Results Tab: Figure 3 — One-Way SA Tornado ─────────────────────
 *  Renders the ±20% univariate DSA on the Model Results tab canvas.
 *  X-axis: "ICER — Cost (£) per QALY Gained" (not NMB).
 *  Floating bars [base, val] straddle the base-case line correctly.
 *  Sorted descending: largest ICER spread at the top.
 * ─────────────────────────────────────────────────────────────────────────── */
function updateTornadoMR(res) {
    destroyChart('torMR');
    const canvas = document.getElementById('tornadoChartMR');
    if (!canvas || !res.tornado) return;
    renderTornadoOnCanvas('torMR', canvas, res, 'wrap-tornadoChartMR');
}


/* ─── Figure 2: Threshold + Headroom Analysis (Groenveld 2025 Fig 2 equivalent) ─────────────
 * X-axis: VR efficacy 0–100%
 * Y-axis: Max viable VR cost per patient (£)
 * Curve 1 (blue):  Cost-effective boundary — ICER = £25,000/QALY
 * Curve 2 (green): Cost-saving boundary    — ΔC = 0
 * H-line (amber):  Current VR therapy cost (from inputs.vrCost)
 * Annotation: vertical markers where current cost crosses each boundary
 * ─────────────────────────────────────────────────────────────────────────── */
function updateFig2Threshold(res, inputs) {
    destroyChart('fig2thresh');
    const canvas = document.getElementById('fig2ThreshCanvas');
    if (!canvas) return;

    const wtp      = inputs.wtp || 25000;
    const vrCost   = inputs.vrCost || 40.55;
    const model    = new PLPMarkovModel(inputs);

    // Sweep efficacy 0–100%, compute max CE and CS cost with zero VR cost baseline
    const effPts   = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,1.5,2,3,4,5,7,10,15,20,30,40,50,60,70,80,90,100];
    const labels   = effPts.map(e => e < 1 ? e.toFixed(1)+'%' : e % 1 === 0 ? e+'%' : e.toFixed(1)+'%');

    // Run UC arm once (efficacy=0, vrCost=0 → same as SC)
    const baseModel = new PLPMarkovModel({...inputs, vrCost: 0, costOneOff: 0, painReduction: 0});
    const baseRes   = baseModel.run();
    const tc_uc = baseRes.vr.totalCost;  // with eff=0, VR arm = UC arm effectively
    const tq_uc = baseRes.vr.totalQaly;

    const maxCE = [];
    const maxCS = [];
    let ceThresh = null, csThresh = null;

    effPts.forEach(eff => {
        const m  = new PLPMarkovModel({...inputs, vrCost: 0, costOneOff: 0, painReduction: eff});
        const r  = m.run();
        const dq = r.vr.totalQaly - tq_uc;
        const dc0 = r.vr.totalCost - tc_uc;  // ΔC with vrCost=0 (includes state cost difference)

        // Max CE cost: vr_cost such that ICER = wtp → vr_cost = wtp*dq - dc0
        const ce = dq > 0 ? Math.max(0, wtp * dq - dc0) : 0;
        // Max CS cost: vr_cost such that ΔC = 0 → vr_cost = -dc0
        const cs = Math.max(0, -dc0);

        maxCE.push(ce);
        maxCS.push(cs);

        // Find where these curves cross current VR cost
        if (ceThresh === null && ce >= vrCost) ceThresh = eff;
        if (csThresh === null && cs >= vrCost) csThresh = eff;
    });

    // Update summary KPI labels
    if (ceThresh !== null) setText('mrThreshCE', (ceThresh < 1 ? ceThresh.toFixed(1) : ceThresh.toFixed(0)) + '%');
    if (csThresh !== null) setText('mrThreshCS', (csThresh < 1 ? csThresh.toFixed(1) : csThresh.toFixed(0)) + '%');
    // Max CE cost at base efficacy (50%)
    const baseIdx = effPts.indexOf(50);
    if (baseIdx >= 0) setText('mrMaxCECost', '£' + Math.round(maxCE[baseIdx]).toLocaleString('en-GB'));

    const yMax = Math.min(Math.max(...maxCE.filter(isFinite)) * 1.12, 10000);

    _charts['fig2thresh'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Max CE cost (ICER ≤ £' + wtp.toLocaleString('en-GB') + '/QALY)',
                    data:  maxCE,
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56,189,248,0.08)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    borderWidth: 2.5
                },
                {
                    label: 'Max CS cost (cost-saving threshold)',
                    data:  maxCS,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    fill: false,
                    tension: 0.4,
                    pointRadius: 2,
                    borderWidth: 2.5
                },
                {
                    label: 'Current VR cost (£' + vrCost.toFixed(2) + '/patient)',
                    data:  effPts.map(() => vrCost),
                    borderColor: '#f59e0b',
                    borderDash: [7, 4],
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', boxWidth: 14, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: c => {
                            if (c.datasetIndex === 2) return `Current cost: £${vrCost.toFixed(2)}`;
                            return `${c.dataset.label}: £${Math.round(c.parsed.y).toLocaleString('en-GB')}/patient`;
                        },
                        afterBody: items => {
                            if (items[0].datasetIndex === 2) return [];
                            const eff = effPts[items[0].dataIndex];
                            const ceV = maxCE[items[0].dataIndex];
                            const csV = maxCS[items[0].dataIndex];
                            return [
                                `At ${eff}% efficacy:`,
                                `  CE boundary: £${Math.round(ceV).toLocaleString('en-GB')}/pt`,
                                `  CS boundary: £${Math.round(csV).toLocaleString('en-GB')}/pt`,
                                `  Current cost (£${vrCost.toFixed(2)}) is ${ceV >= vrCost ? '✅ CE' : '❌ not CE'}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'VR Therapy Efficacy — % Pain Reduction',
                        color: '#94a3b8',
                        font: { size: 11, weight: '600' }
                    },
                    ticks: { color: '#94a3b8', maxTicksLimit: 14 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Max VR Cost per Patient (£) — CE or CS Boundary',
                        color: '#94a3b8',
                        font: { size: 11, weight: '600' }
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: v => '£' + v.toLocaleString('en-GB')
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0,
                    max: yMax
                }
            }
        }
    });
}

/* ─── Shared tornado render engine ──────────────────────────────────────────
 * chartKey  : key in _charts dict (e.g. 'tor' or 'torMR')
 * canvas    : the <canvas> element
 * res       : model result object containing res.tornado
 * wrapId    : id of the wrapping div for auto-resize
 *
 * CORRECT TORNADO CHART DESIGN:
 *   - Each horizontal bar is a FLOATING BAR [base_icer, param_icer]
 *     so bars extend either side of the base-case line.
 *   - Orange bar: what happens when parameter is at its LOW value (−20%)
 *   - Blue bar  : what happens when parameter is at its HIGH value (+20%)
 *   - Sorted DESCENDING by ICER range so the most influential parameter
 *     (largest bar width = widest swing) appears at the TOP.
 *   - Chart.js indexAxis:'y' puts labels[0] at the TOP of the chart.
 * ─────────────────────────────────────────────────────────────────────────── */
function renderTornadoOnCanvas(chartKey, canvas, res, wrapId) {
    const base = isFinite(res.tornado.baseICER) ? res.tornado.baseICER : 0;

    // Descending sort: largest ICER swing → first in array → top of chart
    // (Chart.js indexAxis:'y' renders labels[0] at the top)
    const sorted = [...res.tornado.data].sort((a, b) =>
        Math.abs(b.highImpactValue - b.lowImpactValue) -
        Math.abs(a.highImpactValue - a.lowImpactValue)
    );

    const labels = sorted.map(d => d.label);

    // FLOATING BARS: each datum is [start, end] anchored at base-case ICER
    // Orange = low param value (−20%): bar from base → lo_icer
    // Blue   = high param value (+20%): bar from base → hi_icer
    const loData = sorted.map(d => [base, d.lowImpactValue]);
    const hiData = sorted.map(d => [base, d.highImpactValue]);

    const allVals = [...sorted.map(d => d.lowImpactValue),
                     ...sorted.map(d => d.highImpactValue), base].filter(isFinite);
    const pad  = Math.abs(Math.max(...allVals) - Math.min(...allVals)) * 0.08 || 5000;
    const xMin = Math.floor((Math.min(...allVals) - pad) / 5000) * 5000;
    const xMax = Math.ceil( (Math.max(...allVals) + pad) / 5000) * 5000;

    const fmtIcer = v => {
        if (!isFinite(v)) return 'N/A';
        return v < 0
            ? `DOM −£${Math.abs(Math.round(v)).toLocaleString('en-GB')}/QALY`
            : `£${Math.round(v).toLocaleString('en-GB')}/QALY`;
    };

    _charts[chartKey] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '−20% of base-case value',
                    data:  loData,
                    backgroundColor: 'rgba(245,158,11,0.82)',
                    borderColor:     'rgba(245,158,11,1)',
                    borderWidth: 1,
                    borderSkipped: false
                },
                {
                    label: '+20% of base-case value',
                    data:  hiData,
                    backgroundColor: 'rgba(56,189,248,0.82)',
                    borderColor:     'rgba(56,189,248,1)',
                    borderWidth: 1,
                    borderSkipped: false
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        title: items => items[0].label,
                        label: c => {
                            const [start, end] = Array.isArray(c.raw) ? c.raw : [base, c.raw];
                            const pct  = c.datasetIndex === 0 ? '−20%' : '+20%';
                            const icer = end;  // the ICER at this parameter value
                            return `${pct}: ${fmtIcer(icer)}`;
                        },
                        afterBody: items => {
                            const d = sorted[items[0].dataIndex];
                            if (!d) return [];
                            const swing = Math.abs(d.highImpactValue - d.lowImpactValue);
                            return [
                                `ICER range: ${fmtIcer(d.lowImpactValue)} → ${fmtIcer(d.highImpactValue)}`,
                                `Swing: £${Math.round(swing).toLocaleString('en-GB')}/QALY`,
                                `Base ICER: ${fmtIcer(base)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'ICER — Cost (£) per QALY Gained   (negative = dominant / cost-saving)',
                        color: '#94a3b8',
                        font: { size: 11, weight: '600' }
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: v => v < 0
                            ? `−£${Math.abs(v / 1000).toFixed(0)}k`
                            : `£${(v / 1000).toFixed(0)}k`
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: xMin,
                    max: xMax
                },
                y: {
                    ticks: { color: '#94a3b8', font: { size: 10 } },
                    grid:  { color: 'rgba(255,255,255,0.04)' }
                }
            }
        },
        plugins: [{
            // Draw the base-case reference line
            id: 'baseIcerLine_' + chartKey,
            afterDraw(chart) {
                const ctx = chart.ctx;
                const xSc = chart.scales.x;
                const xB  = xSc.getPixelForValue(base);
                const yT  = chart.chartArea.top;
                const yB  = chart.chartArea.bottom;
                ctx.save();
                ctx.strokeStyle = 'rgba(168,85,247,0.95)';
                ctx.lineWidth   = 2.5;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(xB, yT);
                ctx.lineTo(xB, yB);
                ctx.stroke();
                // Label above line
                ctx.fillStyle = 'rgba(168,85,247,0.95)';
                ctx.font      = 'bold 10px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.setLineDash([]);
                ctx.fillText('Base case', xB, yT - 5);
                ctx.restore();
            }
        }]
    });

    autoResizeChart(wrapId, 'bar-h', sorted.length, 300, 600);
    if (_charts[chartKey]) _charts[chartKey].resize();
}

/* ─────────────────────────────────────────────────────────────────────────────
 * updateGroenveldThreshold(res, inputs)
 * Groenveld et al. (2025) Int J Surg 111(5):3386-3394 methodology:
 * Sweep VR efficacy 0%→100% in 1% steps, computing full Markov model at each
 * point. Plot ICER vs efficacy with CE (£25k WTP) and CS (ΔC=0) threshold lines.
 * ───────────────────────────────────────────────────────────────────────────── */
function updateGroenveldThreshold(res, inputs) {
    destroyChart('groenThresh');
    const canvas = document.getElementById('groenThreshChart');
    const tbody  = document.getElementById('groenThreshTableBody');
    if (!canvas) return;

    const wtp        = inputs.wtp || 25000;
    const base       = { ...inputs };
    const points     = [];  // { eff, vrC, dC, dQ, icer, nmb }
    let ceThresh     = null;  // first eff where CE
    let csThresh     = null;  // first eff where CS (dominant)

    // Sweep 0–100% in 1% steps
    for (let pct = 0; pct <= 100; pct++) {
        const m = new PLPMarkovModel({ ...base, painReduction: pct });
        const r = m.runDeterministic();
        const dC   = r.incCost;
        const dQ   = r.incQaly;
        const icer = (dQ !== 0) ? dC / dQ : Infinity;
        const nmb  = dQ * wtp - dC;
        points.push({ eff: pct, vrC: r.vr.totalCosts, dC, dQ, icer, nmb });
        if (ceThresh === null && isFinite(icer) && icer < wtp && dQ > 0) ceThresh = pct;
        if (csThresh === null && dC < 0 && dQ > 0) csThresh = pct;
    }

    // Update KPI badges
    const fmt2 = n => n !== null ? n + '%' : '—';
    const ceEl = document.getElementById('groenCeThresh');
    const csEl = document.getElementById('groenCsThresh');
    const ceNoteEl = document.getElementById('groenCeNote');
    const csNoteEl = document.getElementById('groenCsNote');
    const cur = inputs.painReduction;

    if (ceEl) ceEl.textContent = fmt2(ceThresh);
    if (csEl) csEl.textContent = fmt2(csThresh);

    if (ceNoteEl) {
        if (ceThresh === null) {
            ceNoteEl.textContent = 'Not achievable at any efficacy';
            ceNoteEl.style.color = '#ef4444';
        } else if (cur >= ceThresh) {
            ceNoteEl.innerHTML = `✅ Current efficacy ${cur}% clears this bar`;
            ceNoteEl.style.color = '#10b981';
        } else {
            ceNoteEl.innerHTML = `⚠ Current ${cur}% is below — need ≥${ceThresh}%`;
            ceNoteEl.style.color = '#f59e0b';
        }
    }
    if (csNoteEl) {
        if (csThresh === null) {
            csNoteEl.textContent = 'Not achievable at any efficacy';
            csNoteEl.style.color = '#ef4444';
        } else if (cur >= csThresh) {
            csNoteEl.innerHTML = `✅ Current efficacy ${cur}% clears this bar`;
            csNoteEl.style.color = '#a855f7';
        } else {
            csNoteEl.innerHTML = `⚠ Current ${cur}% is below — need ≥${csThresh}%`;
            csNoteEl.style.color = '#f59e0b';
        }
    }

    // Clamp ICER display range for chart readability (-30k to +60k)
    const ICER_MIN = -30000, ICER_MAX = 60000;
    const icerClamped = points.map(p =>
        isFinite(p.icer) ? Math.max(ICER_MIN, Math.min(ICER_MAX, p.icer)) : null
    );

    // Colour points: dominant=purple, CE-only=green, not-CE=red
    const ptColors = points.map(p => {
        if (p.dC < 0 && p.dQ > 0) return 'rgba(168,85,247,0.85)';
        if (isFinite(p.icer) && p.icer < wtp && p.dQ > 0) return 'rgba(16,185,129,0.85)';
        return 'rgba(239,68,68,0.7)';
    });

    const labels = points.map(p => p.eff + '%');

    // Vertical annotation lines
    const annotations = {};
    if (ceThresh !== null) {
        annotations['ceAnnot'] = {
            type: 'line', xMin: ceThresh, xMax: ceThresh,
            borderColor: '#10b981', borderWidth: 2, borderDash: [6,4],
            label: { content: `CE ≥${ceThresh}%`, display: true, position: 'start',
                     backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981',
                     font: { size: 10, weight: 'bold' }, padding: 4 }
        };
    }
    if (csThresh !== null) {
        annotations['csAnnot'] = {
            type: 'line', xMin: csThresh, xMax: csThresh,
            borderColor: '#a855f7', borderWidth: 2, borderDash: [6,4],
            label: { content: `CS ≥${csThresh}%`, display: true, position: 'start',
                     backgroundColor: 'rgba(168,85,247,0.15)', color: '#a855f7',
                     font: { size: 10, weight: 'bold' }, padding: 4 }
        };
    }
    // Current efficacy marker
    annotations['curAnnot'] = {
        type: 'line', xMin: cur, xMax: cur,
        borderColor: '#f59e0b', borderWidth: 2, borderDash: [3,3],
        label: { content: `Base ${cur}%`, display: true, position: 'end',
                 backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                 font: { size: 10, weight: 'bold' }, padding: 4 }
    };
    // WTP line (y=0 is CS; y=25000 is CE)
    annotations['wtpLine'] = {
        type: 'line', yMin: wtp, yMax: wtp,
        borderColor: '#38bdf8', borderWidth: 1, borderDash: [4,4],
        label: { content: `WTP £${(wtp/1000).toFixed(0)}k/QALY`, display: true,
                 position: 'end', backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                 font: { size: 9 }, padding: 3 }
    };
    annotations['csLine'] = {
        type: 'line', yMin: 0, yMax: 0,
        borderColor: '#a855f7', borderWidth: 1, borderDash: [4,4],
        label: { content: 'Cost-Saving (ΔC=0)', display: true, position: 'end',
                 backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7',
                 font: { size: 9 }, padding: 3 }
    };

    _charts['groenThresh'] = new Chart(canvas, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'ICER £/QALY by Efficacy',
                data: points.map((p, i) => ({ x: p.eff, y: icerClamped[i] })),
                pointBackgroundColor: ptColors,
                pointBorderColor: ptColors,
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: true,
                borderColor: 'rgba(148,163,184,0.3)',
                borderWidth: 1,
                tension: 0,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: ctx => `Efficacy: ${ctx[0].parsed.x}%`,
                        label: ctx => {
                            const p = points[ctx.dataIndex];
                            const ic = isFinite(p.icer) ? `£${Math.round(p.icer).toLocaleString('en-GB')}` : '∞';
                            const status = p.dC < 0 && p.dQ > 0 ? 'DOMINANT'
                                         : isFinite(p.icer) && p.icer < wtp ? 'CE'
                                         : 'NOT CE';
                            return [
                                `ICER: ${ic}/QALY`,
                                `ΔCost: £${Math.round(p.dC).toLocaleString('en-GB')}`,
                                `ΔQALY: ${p.dQ.toFixed(4)}`,
                                `NMB: £${Math.round(p.nmb).toLocaleString('en-GB')}`,
                                `Status: ${status}`
                            ];
                        }
                    }
                },
                annotation: { annotations }
            },
            scales: {
                x: {
                    title: { display: true, text: 'VR Efficacy (%)', color: '#94a3b8', font: { size: 11 } },
                    min: 0, max: 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b', stepSize: 10 }
                },
                y: {
                    title: { display: true, text: 'ICER (£/QALY) — clamped ±30k/60k', color: '#94a3b8', font: { size: 11 } },
                    min: ICER_MIN, max: ICER_MAX,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: '#64748b',
                        callback: v => v === 0 ? 'CS line' : `£${(v/1000).toFixed(0)}k`
                    }
                }
            }
        }
    });

    // Populate table (every 5% + threshold rows)
    if (tbody) {
        const keyPcts = new Set([0, ceThresh, csThresh, cur, 25, 50, 75, 100].filter(v => v !== null));
        tbody.innerHTML = points
            .filter((p, i) => i % 5 === 0 || keyPcts.has(p.eff))
            .map(p => {
                const isKey = keyPcts.has(p.eff);
                const ic  = isFinite(p.icer) ? `£${Math.round(p.icer).toLocaleString('en-GB')}` : '∞';
                const nm  = `£${Math.round(p.nmb).toLocaleString('en-GB')}`;
                let statusHtml, rowStyle = '';
                if (p.dC < 0 && p.dQ > 0) {
                    statusHtml = '<span style="color:#a855f7;font-weight:700;">DOMINANT</span>';
                    rowStyle = 'background:rgba(168,85,247,0.06);';
                } else if (isFinite(p.icer) && p.icer < wtp && p.dQ > 0) {
                    statusHtml = '<span style="color:#10b981;font-weight:700;">CE</span>';
                    rowStyle = 'background:rgba(16,185,129,0.06);';
                } else {
                    statusHtml = '<span style="color:#ef4444;">Not CE</span>';
                }
                const highlight = isKey ? 'font-weight:700;' : '';
                return `<tr style="border-bottom:1px solid #1e293b;${rowStyle}${highlight}">
                    <td style="padding:.35rem .6rem;">${p.eff}%${p.eff === cur ? ' ← base' : ''}${p.eff === ceThresh ? ' ← CE threshold' : ''}${p.eff === csThresh ? ' ← CS threshold' : ''}</td>
                    <td style="padding:.35rem .6rem;text-align:right;">£${Math.round(p.vrC).toLocaleString('en-GB')}</td>
                    <td style="padding:.35rem .6rem;text-align:right;color:${p.dC<0?'#10b981':'#f87171'};">${p.dC<0?'':'+'}£${Math.round(Math.abs(p.dC)).toLocaleString('en-GB')}</td>
                    <td style="padding:.35rem .6rem;text-align:right;">+${p.dQ.toFixed(4)}</td>
                    <td style="padding:.35rem .6rem;text-align:right;">${ic}</td>
                    <td style="padding:.35rem .6rem;text-align:right;color:${p.nmb>=0?'#10b981':'#f87171'};">${nm}</td>
                    <td style="padding:.35rem .6rem;text-align:center;">${statusHtml}</td>
                </tr>`;
            }).join('');
    }
}


function updateHtaDisplay(res, inputs) {
    const el = document.getElementById('htaIcerDisplay');

    if (!el) return;
    const wtp     = inputs.wtp;
    const wtpHigh = Math.round(wtp * 1.4);  // upper of NICE band (~35k if wtp=25k)
    const modMax  = Math.round(wtp * 2.38); // severity modifier ×1.7 on upper band
    if (res.incCost < 0 && res.incQaly > 0) {
        const sav = Math.abs(res.incCost / res.incQaly);
        el.textContent = `🌟 DOMINANT — £${Math.round(sav).toLocaleString('en-GB')}/QALY saved — UCLTouchRehab saves money and improves outcomes`;
        el.style.color = '#a855f7';
    } else if (!isFinite(res.icer) || res.incQaly <= 0) {
        el.textContent = 'ICER: Not calculable (ΔE ≤ 0) — dominated scenario';
        el.style.color = '#ef4444';
    } else if (res.icer <= wtp) {
        el.textContent = `✅ ICER: ${fmt0(res.icer)}/QALY — Cost-effective at £${wtp.toLocaleString('en-GB')}/QALY threshold`;
        el.style.color = '#10b981';
    } else if (res.icer <= wtpHigh) {
        el.textContent = `⚠️ ICER: ${fmt0(res.icer)}/QALY — Borderline (£${wtp.toLocaleString('en-GB')}k–£${wtpHigh.toLocaleString('en-GB')}/QALY band)`;
        el.style.color = '#f59e0b';
    } else if (res.icer <= modMax) {
        el.textContent = `🔶 ICER: ${fmt0(res.icer)}/QALY — Above standard threshold, within severity-modifier range (×1.7 max = £${modMax.toLocaleString('en-GB')})`;
        el.style.color = '#f59e0b';
    } else {
        el.textContent = `❌ ICER: ${fmt0(res.icer)}/QALY — Above £${modMax.toLocaleString('en-GB')}/QALY (severity-modifier ceiling)`;
        el.style.color = '#ef4444';
    }

    const bi = document.getElementById('htaBudgetImpact');
    if (bi) {
        const popSize     = 2000;
        const totalBudget = (inputs.vrCost + inputs.costOneOff) * popSize;
        const totalSaving = (res.sc.totalCosts - (res.vr.totalCosts - inputs.vrCost - inputs.costOneOff)) * popSize;
        bi.innerHTML = `
            <strong>Estimated NHS England Budget Impact (N≈2,000 upper-limb amputees/year):</strong><br>
            Technology acquisition: <strong>${fmt0(totalBudget)}/year</strong> &nbsp;|&nbsp;
            Estimated downstream savings: <strong>${fmt0(totalSaving)}/year</strong> &nbsp;|&nbsp;
            Net budget impact: <strong style="color:${totalSaving > totalBudget ? '#10b981' : '#f59e0b'}">${fmt0(totalBudget - totalSaving)}</strong>
        `;
    }
}

/* ═══════════════════ THRESHOLD PRICE SETTERS ═══════════════════ */

/**
 * Compute downstream savings with ZERO device cost, then set either
 * vrCost or costOneOff to the appropriate ceiling, keeping the other fixed.
 *
 * targetType : 'cs'  → cost-saving ceiling  (ΔC = 0)
 *              'ce25' → CE ceiling at £25,000/QALY (NMB = 0 at λ=25000)
 *              'ce35' → CE ceiling at £35,000/QALY (NMB = 0 at λ=35000)
 * assignTo   : 'vr'     → set vrCost input
 *              'oneoff' → set costOneOff input
 */
window.solveToThreshold = function (targetType, assignTo) {
    const inputs = getInputs();

    // Run model with ZERO device costs to isolate pure downstream state savings
    const inputs0 = { ...inputs, vrCost: 0, costOneOff: 0 };
    const res0    = new PLPMarkovModel(inputs0).run();
    const savings = res0.sc.totalCosts - res0.vr.totalCosts;   // positive = VR saves money
    const deltaQ  = res0.vr.totalQALYs - res0.sc.totalQALYs;  // positive = VR gives more QALYs

    // Full ceiling — the OTHER cost is zeroed, so the solved field gets the entire budget
    let ceiling;
    if (targetType === 'cs')   ceiling = savings;
    if (targetType === 'ce25') ceiling = savings + 25000 * deltaQ;
    if (targetType === 'ce35') ceiling = savings + 35000 * deltaQ;

    const solved = Math.max(0, parseFloat(ceiling.toFixed(2)));

    // IDs for the solved field and the field to zero out
    const solvedId = assignTo === 'vr' ? 'vrCost'    : 'costOneOff';
    const zeroId   = assignTo === 'vr' ? 'costOneOff': 'vrCost';

    // Set solved field
    const el = document.getElementById(solvedId);
    if (!el) return;
    el.value = solved;
    el.style.transition = 'background 0.3s';
    el.style.background = 'rgba(16,185,129,0.25)';
    setTimeout(() => { el.style.background = ''; }, 1200);

    // Zero out the other field
    const elZero = document.getElementById(zeroId);
    if (elZero) {
        elZero.value = '0';
        elZero.style.transition = 'background 0.3s';
        elZero.style.background = 'rgba(100,116,139,0.2)';
        setTimeout(() => { elZero.style.background = ''; }, 1200);
    }

    // Feedback badge
    const labels   = { cs: 'Cost-Saving', ce25: 'CE @ £25k WTP', ce35: 'CE @ £35k WTP' };
    const fieldName = assignTo === 'vr' ? 'VR Therapy Cost' : 'One-off Setup Cost';
    const zeroName  = assignTo === 'vr' ? 'One-off cost'    : 'VR Therapy Cost';
    const badge = document.getElementById('solverBadge');
    if (badge) {
        badge.textContent = `✅ ${fieldName} → £${solved.toFixed(2)} (${labels[targetType]} ceiling) | ${zeroName} → £0 | Savings £${savings.toFixed(2)}, ΔQALYs ${deltaQ.toFixed(5)}`;
        badge.style.display = 'block';
        setTimeout(() => { badge.style.display = 'none'; }, 7000);
    }

    recalculateAll();
};

/**
 * Binary-search the minimum efficacy % at current prices to achieve
 * the target (cost-saving or CE at £25k WTP).
 *
 * targetType : 'cs'  → cost-saving (ΔC < 0)
 *              'ce25' → CE at £25,000/QALY
 */
window.solveEfficacy = function (targetType) {
    const inputs = getInputs();
    const wtp    = targetType === 'ce25' ? 25000 : 0;

    // Binary search between 0 and 100%
    let lo = 0, hi = 100, mid, isMet;
    for (let iter = 0; iter < 50; iter++) {
        mid  = (lo + hi) / 2;
        const r = new PLPMarkovModel({ ...inputs, painReduction: mid }).run();
        const dc = r.vr.totalCosts - r.sc.totalCosts;
        const dq = r.vr.totalQALYs - r.sc.totalQALYs;
        if (targetType === 'cs')   isMet = (dc < 0);
        if (targetType === 'ce25') isMet = (dq * 25000 - dc >= 0);
        if (isMet) hi = mid; else lo = mid;
        if (hi - lo < 0.0001) break;
    }

    const solved = parseFloat(mid.toFixed(3));
    const el = document.getElementById('painReduction');
    if (!el) return;
    el.value = solved;

    el.style.transition = 'background 0.3s';
    el.style.background = 'rgba(56,189,248,0.25)';
    setTimeout(() => { el.style.background = ''; }, 1200);

    const badge = document.getElementById('solverBadge');
    const labels = { cs: 'Cost-Saving', ce25: 'CE @ £25k WTP' };
    if (badge) {
        badge.textContent = `🔍 Min Efficacy for ${labels[targetType]}: ${solved.toFixed(3)}% at current VR cost £${inputs.vrCost.toFixed(2)} + setup £${inputs.costOneOff.toFixed(2)}`;
        badge.style.display = 'block';
        setTimeout(() => { badge.style.display = 'none'; }, 6000);
    }

    recalculateAll();
};

/* ═══════════════════ CAPITAL BUDGET RANGE SOLVER ═══════════════════ */
window.solveBudgetRange = function () {
    const inputs = getInputs();
    const capMin = vd('capBudMin', 10);
    const capMax = vd('capBudMax', 200);
    const steps  = 10;
    const step   = (capMax - capMin) / steps;

    const tbody = document.getElementById('capBudTbody');
    if (!tbody) { console.error('capBudTbody not found'); return; }

    // Keep the subtitle cohort-N span in sync with the current cohort size
    const capBudCohortN = document.getElementById('capBudCohortN');
    if (capBudCohortN) capBudCohortN.textContent = (inputs.cohortSize || 8231).toLocaleString('en-GB');


    // Usual-care arm is constant regardless of VR device cost
    const scArm = new PLPMarkovModel(inputs).simulateArm(false);

    let rows = '';
    for (let i = 0; i <= steps; i++) {
        const cost = parseFloat((capMin + i * step).toFixed(2));

        // Create model with this specific VR therapy cost (keep costOneOff fixed)
        const m   = new PLPMarkovModel({ ...inputs, vrCost: cost });
        const vr  = m.simulateArm(true);
        const dq  = vr.totalQALYs - scArm.totalQALYs;
        const ic  = vr.totalCosts  - scArm.totalCosts;
        const icer = (dq !== 0 && isFinite(ic / dq)) ? ic / dq : Infinity;
        const nmb  = dq * inputs.wtp - ic;
        const cohortBudget = (cost + inputs.costOneOff) * inputs.cohortSize;

        let statusText, statusCol;
        if (ic < 0 && dq > 0)                          { statusText = '🌟 Dominant'; statusCol = '#a855f7'; }
        else if (isFinite(icer) && icer <= inputs.wtp)  { statusText = '✅ Cost-effective'; statusCol = '#10b981'; }
        else if (!isFinite(icer))                        { statusText = '⚠ N/A';      statusCol = '#64748b'; }
        else                                             { statusText = '❌ Not CE';   statusCol = '#ef4444'; }

        // When dominant show £X/QALY SAVED so the cell carries scientific meaning
        const icerDisplay = (ic < 0 && dq > 0)
            ? `🌟 ${fmt0(Math.abs(ic / dq))}/QALY saved`
            : (isFinite(icer) ? fmt0(icer) + '/QALY' : '—');

        rows += `<tr>
            <td>£${cost.toFixed(2)}</td>
            <td>${fmt(cohortBudget)}</td>
            <td style="color:${ic < 0 ? '#10b981' : '#ef4444'}">${fmt(ic)}</td>
            <td>${fmtN(dq, 4)}</td>
            <td>${icerDisplay}</td>
            <td style="color:${nmb >= 0 ? '#10b981' : '#ef4444'}">${fmt(nmb)}</td>
            <td style="color:${statusCol}; font-weight:700;">${statusText}</td>
        </tr>`;
    }

    tbody.innerHTML = rows;

    // Reveal table
    const wrap = document.getElementById('capBudTableWrap');
    if (wrap) wrap.style.display = '';
};

/* ─── CTMC Panel Update ─── */
function updateCtmcPanel(model) {
    const panel = document.getElementById('ctmcPanel');
    if (!panel) return;

    if (!model.p.useCTMC) {
        panel.innerHTML = '<p style="color:var(--text-muted); font-size:0.875rem;">Enable CTMC in the sidebar to see the derived monthly transition matrix and generator matrix Q.</p>';
        return;
    }

    if (!model.ctmcMonthly) {
        panel.innerHTML = '<p style="color:var(--danger);">CTMC computation failed — check browser console.</p>';
        return;
    }

    const Q    = model.ctmcGenerator;
    const Qraw = model.ctmcGeneratorRaw;
    const Pm   = model.ctmcMonthly;
    const Prec = model.ctmcReconstruction;
    const Pobs = model.ctmcObsMatrix;
    const val  = model.ctmcValidation;
    const pmv  = model.ctmcPmValidation;
    const t    = model.p.ctmcObsPeriod;
    const nc   = model.ctmcNumClamped  || 0;
    const mc   = model.ctmcMaxClamp    || 0;
    const STATES = ['Pain Free', 'Mild PLP', 'Moderate PLP', 'Severe PLP', 'Death'];

    // Reconstruction error — max |exp(Q×t) - P_obs| for non-death states
    let reconErr = 0;
    if (Prec && Pobs) {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 5; j++)
                reconErr = Math.max(reconErr, Math.abs(Prec[i][j] - Pobs[i][j]));
    }

    const validIcon = v => v.valid ? '✅' : (nc > 0 ? '🔧' : '⚠️');

    const matTable = (M, title, highlight, compareM) => {
        let h = `<div style="margin-top:1.2rem;"><h4 style="color:${highlight}; margin-bottom:0.5rem; font-size:0.9rem;">${title}</h4><div style="overflow-x:auto;"><table class="param-table" style="font-size:0.77rem;">`;
        h += '<thead><tr><th>From \ To</th>' + STATES.map(s => `<th>${s}</th>`).join('') + '</tr></thead><tbody>';
        M.forEach((r, i) => {
            h += `<tr><td><strong>${STATES[i]}</strong></td>` + r.map((v, j) => {
                const isNeg  = (i !== j) && v < -1e-9;
                const isZero = Math.abs(v) < 1e-9;
                let color = isZero ? '#64748b' : (isNeg ? '#ef4444' : '#e2e8f0');
                // Highlight cells that were clamped (raw had negative, now 0)
                let bgStyle = '';
                if (compareM && i !== j && compareM[i][j] < -1e-9 && Math.abs(v) < 1e-9) {
                    bgStyle = ' background:rgba(16,185,129,0.12);';
                    color = '#10b981';
                }
                return `<td style="color:${color};${bgStyle}">${v.toFixed(5)}</td>`;
            }).join('') + '</tr>';
        });
        h += '</tbody></table></div></div>';
        return h;
    };

    // KPI row
    let html = `<div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
        <div class="kpi-card" style="flex:1; min-width:160px;">
            <div class="kpi-label">Observation Period</div>
            <div class="kpi-value" style="font-size:1.3rem;">${t} months</div>
            <div class="kpi-sub">${(t * 4.345).toFixed(1)} weeks</div>
        </div>
        <div class="kpi-card" style="flex:1; min-width:160px;">
            <div class="kpi-label">Generator Valid</div>
            <div class="kpi-value" style="font-size:1.3rem;">${validIcon(val)} ${val.valid ? 'Yes' : (nc>0 ? 'Fixed' : 'Issues')}</div>
            <div class="kpi-sub">${nc === 0 ? 'No clamping needed' : `${nc} entr${nc>1?'ies':'y'} clamped, max = ${mc.toFixed(5)}`}</div>
        </div>
        <div class="kpi-card" style="flex:1; min-width:160px;">
            <div class="kpi-label">P₁ₘₒ Stochastic</div>
            <div class="kpi-value" style="font-size:1.3rem;">${pmv.valid ? '✅ Yes' : '⚠️ Issues'}</div>
            <div class="kpi-sub">${pmv.valid ? 'All entries in [0,1], rows ≈ 1' : pmv.issues[0]}</div>
        </div>
        <div class="kpi-card" style="flex:1; min-width:160px;">
            <div class="kpi-label">Reconstruction Error</div>
            <div class="kpi-value" style="font-size:1.3rem; color:${reconErr < 0.01 ? '#10b981' : '#f59e0b'}">${reconErr < 0.01 ? '✅' : '⚠️'} ${reconErr.toFixed(5)}</div>
            <div class="kpi-sub">max |exp(Q·t) − P_obs|  ${reconErr < 0.01 ? '(good)' : '(>0.01)'}</div>
        </div>
    </div>`;

    // Clamping explanation if needed
    if (nc > 0) {
        html += `<div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.85rem 1rem; margin-bottom:1rem; font-size:0.82rem; color:#a7f3d0;">
            <strong>🔧 Embedding problem auto-corrected (Israel-Rosenthal-Wei 2001):</strong> The raw matrix logarithm produced ${nc} negative off-diagonal entr${nc>1?'ies':'y'} (max = ${mc.toFixed(6)}/month) in Q_raw. These were clamped to 0 and the diagonal renormalised to maintain row-sum = 0. This is the standard NICE DSU TSD-14 / CADTH approach and has a negligible impact on results (max adjustment = ${mc.toFixed(5)}/month). <span style="color:#10b981;">Highlighted cells (green) show clamped entries in Q below.</span>
        </div>`;
    }

    // Run self-test summary
    const testResult = CTMCMath.selfTest();
    html += `<details style="margin-bottom:1rem;">
        <summary style="cursor:pointer; color:#38bdf8; font-size:0.85rem; font-weight:600;">🧪 Self-Test Suite — ${testResult.failed === 0 ? '✅ ' + testResult.passed + ' tests passed' : '❌ ' + testResult.failed + ' failures'}</summary>
        <div style="background:rgba(0,0,0,0.4); border-radius:6px; padding:0.75rem; margin-top:0.5rem; font-family:monospace; font-size:0.75rem; color:#94a3b8; line-height:1.7; white-space:pre-wrap;">${testResult.log.join('\n')}</div>
    </details>`;

    html += matTable(Q, `Generator Q (clamped) = clamp(log(P_obs) / ${t})  [rates per month, green = clamped from negative]`, '#38bdf8', Qraw);
    if (nc > 0) {
        html += matTable(Qraw, 'Generator Q_raw (before clamping, red = negative off-diagonals)', '#f59e0b');
    }
    html += matTable(Pm, 'Derived Monthly Transition Matrix  P₁ₘₒₙₜₕ = exp(Q)  [used in model]', '#10b981');
    if (Prec) {
        html += matTable(Prec, `Reconstruction Check  exp(Q × ${t}) — should ≈ P_obs (recon error = ${reconErr.toFixed(5)})`, '#a855f7');
    }

    panel.innerHTML = html;
}

/* ─── Societal Tab ─── */
function updateSocietalTab(res, inputs) {
    // Accept pre-computed res/inputs; fall back to re-computing if called standalone
    if (!res || !inputs) {
        try {
            inputs = getInputs();
            const m = new PLPMarkovModel(inputs);
            res = m.run();
        } catch(e) { console.error('[updateSocietalTab]', e); return; }
    }

    const rate    = inputs.costCaregiverRate;
    const hrsMild = inputs.durMild  * 30.4375;
    const hrsMod  = inputs.durMod   * 30.4375;
    const hrsSev  = inputs.durSev   * 30.4375;

    /* ── Panel A: NHS/PSS base-case ── */
    const dc   = res.incCost;
    const dq   = res.incQaly;
    const wtp  = inputs.wtp || 25000;
    const icer = (dq !== 0) ? dc / dq : null;
    const isDominant = dc < 0 && dq > 0;
    const nmb  = wtp * dq - dc;

    // Bug fix: fmtIcer must be delta-aware — old version used outer isDominant
    // which was always computed from NHS dc, making societal rows show wrong status.
    function fmtIcer(ic, delta_c_arg, delta_q_arg) {
        const d_c = (delta_c_arg !== undefined) ? delta_c_arg : dc;
        const d_q = (delta_q_arg !== undefined) ? delta_q_arg : dq;
        if (d_c < 0 && d_q > 0) return 'DOMINANT';
        if (ic === null || !isFinite(ic)) return 'N/A';
        return '£' + Math.round(ic).toLocaleString('en-GB') + '/QALY';
    }
    function fmtDec(d_c, d_q) {
        if (d_c < 0 && d_q > 0) return '✅ Dominant';
        if (!isFinite(d_c / d_q) || d_q <= 0) return '⚠️ N/A';
        const ic = d_c / d_q;
        return ic <= wtp ? '✅ Cost-effective' : '⚠️ Above threshold';
    }

    setText('socA_dc',       fmt(dc));
    setText('socA_dq',       (dq >= 0 ? '+' : '') + dq.toFixed(5) + ' QALYs');
    setText('socA_icer',     fmtIcer(icer));
    setText('socA_decision', fmtDec(dc, dq));

    /* ── Panel B: Caregiver savings (per patient, 12 months) ── */
    setText('socB_cgRate', '£' + rate.toFixed(2) + '/hr');

    const cgMildMo  = Math.round(hrsMild * rate);
    const cgModMo   = Math.round(hrsMod  * rate);
    const cgSevMo   = Math.round(hrsSev  * rate);

    setText('socB_cgMild_mo', '£' + cgMildMo.toLocaleString('en-GB'));
    setText('socB_cgMild_yr', '£' + (cgMildMo * 12).toLocaleString('en-GB'));
    setText('socB_cgMod_mo',  '£' + cgModMo.toLocaleString('en-GB'));
    setText('socB_cgMod_yr',  '£' + (cgModMo * 12).toLocaleString('en-GB'));
    setText('socB_cgSev_mo',  '£' + cgSevMo.toLocaleString('en-GB'));
    setText('socB_cgSev_yr',  '£' + (cgSevMo * 12).toLocaleString('en-GB'));

    // Compute per-patient caregiver saving over 12 months (VR vs UC)
    // = sum over months of [(UC state distribution − VR state distribution) · hrs · rate]
    let cgSaving = 0;
    for (let t = 0; t < 12; t++) {
        const vrH  = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH  = res.sc.cohortHistory[t] || [0,0,0,0,0];
        // UC cohort spends more time in higher-pain states → more caregiver time
        // Saving = (UC hours – VR hours) × rate
        const ucHrs = scH[1]*hrsMild + scH[2]*hrsMod + scH[3]*hrsSev;
        const vrHrs = vrH[1]*hrsMild + vrH[2]*hrsMod + vrH[3]*hrsSev;
        cgSaving += (ucHrs - vrHrs) * rate;
    }

    setText('socB_cgSaving', cgSaving >= 0
        ? '£' + Math.round(cgSaving).toLocaleString('en-GB') + ' saved'
        : '−£' + Math.round(Math.abs(cgSaving)).toLocaleString('en-GB'));

    /* ── Panel B: Friction cost productivity saving — employment-rate adjusted ── */
    // Friction period = 68 working days (CIPD UK Resourcing Survey 2023;
    //   widely used in UK HTA productivity analysis; see Koopmanschap et al. 1995)
    // AWE Feb 2025 total pay = £716/week (ONS EARN01, release Mar 2025;
    //   daily wage = £716/5 = £143.20/day)
    // Employment rate adjustment: UK upper-limb amputees ~54% employed
    //   (Davidson JH et al., 2002, J Hand Ther, 15(1):62-70;
    //    DWP Disability Employment Gap report 2024, doi:10.57130/DWP.2024)
    //   Of those employed, absenteeism rates:
    //     Mild: ~15 sick days/yr (Eccleston et al. 2012, Pain, 153:711-715)
    //     Mod: ~45 days (Henschel et al. 2011, Eur J Pain, 15:597-603)
    //     Sev: ~68 days (capped at friction period; Koopmanschap et al. 1995)
    const dailyWage      = 716 / 5;          // ONS EARN01 total pay Feb 2025: £716/wk ÷ 5 = £143.20/day
    const frictionDays   = 68;               // CIPD UK Resourcing Survey 2023 vacancy duration
    const empRate        = 0.54;             // UK upper-limb amputee employment rate (Davidson et al. 2002)
    const fcMild_gross   = Math.min(15, frictionDays) * dailyWage;   // £2,148
    const fcMod_gross    = Math.min(45, frictionDays) * dailyWage;   // £6,444
    const fcSev_gross    = Math.min(68, frictionDays) * dailyWage;   // £9,738 (capped at friction period)
    const fcMild  = fcMild_gross * empRate;  // £1,160 adjusted
    const fcMod   = fcMod_gross  * empRate;  // £3,480 adjusted
    const fcSev   = fcSev_gross  * empRate;  // £5,258 adjusted

    setText('socB_fcMild', '£' + Math.round(fcMild).toLocaleString('en-GB'));
    setText('socB_fcMod',  '£' + Math.round(fcMod).toLocaleString('en-GB'));
    setText('socB_fcSev',  '£' + Math.round(fcSev).toLocaleString('en-GB'));

    // Per-patient productivity saving (VR shifts people out of high-sick-day states)
    // Both gross and employment-rate-adjusted variants computed
    let prodSaving = 0, prodSavingGross = 0;
    for (let t = 0; t < 12; t++) {
        const vrH = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH = res.sc.cohortHistory[t] || [0,0,0,0,0];
        // Monthly share of annual friction cost (employment-rate-adjusted = primary)
        const ucProd = scH[1]*fcMild/12 + scH[2]*fcMod/12 + scH[3]*fcSev/12;
        const vrProd = vrH[1]*fcMild/12 + vrH[2]*fcMod/12 + vrH[3]*fcSev/12;
        prodSaving += (ucProd - vrProd);
        // Gross (unadjusted) for reference
        const ucProdG = scH[1]*fcMild_gross/12 + scH[2]*fcMod_gross/12 + scH[3]*fcSev_gross/12;
        const vrProdG = vrH[1]*fcMild_gross/12 + vrH[2]*fcMod_gross/12 + vrH[3]*fcSev_gross/12;
        prodSavingGross += (ucProdG - vrProdG);
    }
    setText('socB_prodSaving', prodSaving >= 0
        ? '£' + Math.round(prodSaving).toLocaleString('en-GB') + ' saved (adj.)'
        : '−£' + Math.round(Math.abs(prodSaving)).toLocaleString('en-GB'));

    /* ── Carer travel time saving (NEW) ── */
    // UK National Living Wage 2025: £12.21/hr
    // Avg carer travel time per appt: 1.5 hrs (NHS Digital appointment attendance data)
    // Appts per month: Mild=0 (no formal carer), Mod=2, Sev=3 (Pain Clinic + GP + review)
    const carerTravelRate = 12.21;  // NLW 2025 £/hr
    const ctMod = carerTravelRate * 1.5 * 2;   // £36.63/mo Moderate
    const ctSev = carerTravelRate * 1.5 * 3;   // £54.94/mo Severe
    let carerTravelSaving = 0;
    for (let t = 0; t < 12; t++) {
        const vrH = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH = res.sc.cohortHistory[t] || [0,0,0,0,0];
        carerTravelSaving += (scH[2] - vrH[2]) * ctMod + (scH[3] - vrH[3]) * ctSev;
    }

    /* ── Carer QALY spillover — model-integrated ── */
    // Carer disutility by patient state — conservative estimates derived from:
    //   Brouwer WBF, van Exel J, Koopmanschap MA, Rutten FFH (1999)
    //   "Economic evaluation of informal care."
    //   Health Policy, 48(1):13-27. doi:10.1016/S0168-8510(99)00021-7
    // and:
    //   van den Berg B, Brouwer WBF, van Exel J, Koopmanschap MA (2005)
    //   "Economic valuation of informal care: the contingent valuation method
    //    applied to informal caregiving."
    //   Health Economics, 14(2):169-183. doi:10.1002/hec.913
    // UK EQ-5D carer studies in chronic musculoskeletal conditions report disutility
    //   of −0.02 to −0.08/yr (Beecham et al. 2010, QoL Res).
    //   Our values (−0.05 Moderate, −0.10 Severe) are conservative upper estimates,
    //   consistent with NICE PMG36 §4.7 guidance on carer HRQoL in non-reference-case analyses.
    const carerUtil = [0, 0, -0.05/12, -0.10/12, 0];  // per month per carer (1 carer per patient assumed)
    let carerQalyGainVR = 0, carerQalyGainSC = 0;
    for (let t = 0; t < 12; t++) {
        const vrH = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH = res.sc.cohortHistory[t] || [0,0,0,0,0];
        for (let i = 0; i < 5; i++) {
            carerQalyGainVR += vrH[i] * (-carerUtil[i]);  // disutility relief (positive = better)
            carerQalyGainSC += scH[i] * (-carerUtil[i]);
        }
    }
    const incCarerQaly = carerQalyGainVR - carerQalyGainSC;  // incremental carer QALY gain (VR better if positive)
    const carerQalyNMB = incCarerQaly * (inputs.wtp || 25000);

    // Display carer QALY results
    if (document.getElementById('socC_carerQalyGain')) {
        setText('socC_carerQalyGain', '+' + Math.abs(incCarerQaly).toFixed(4) + ' carer QALYs');
    }
    if (document.getElementById('socC_carerQalyNMB')) {
        setText('socC_carerQalyNMB', '£' + Math.round(carerQalyNMB).toLocaleString('en-GB'));
    }

    /* ── Panel B: Societal ICER summary table ── */
    // Row 1: NHS only
    setText('socB_icer_nhs_dc',  fmt(dc));
    setText('socB_icer_nhs_dq',  dq.toFixed(5));
    setText('socB_icer_nhs',     fmtIcer(icer, dc, dq));
    setText('socB_icer_nhs_dec', fmtDec(dc, dq));
    // Row 2: + caregiver savings (reduces ΔC further negative)
    const dc_cg = dc - cgSaving;
    setText('socB_icer_cg_dc',  fmt(dc_cg));
    setText('socB_icer_cg',     fmtIcer(dq > 0 ? dc_cg / dq : null, dc_cg, dq));
    setText('socB_icer_cg_dec', fmtDec(dc_cg, dq));
    // Row 3: + caregiver + productivity
    const dc_full = dc_cg - prodSaving;
    setText('socB_icer_full_dc',  fmt(dc_full));
    setText('socB_icer_full',     fmtIcer(dq > 0 ? dc_full / dq : null, dc_full, dq));
    setText('socB_icer_full_dec', fmtDec(dc_full, dq));

    /* ── Panel D: Full ICER comparison table ── */
    // LA social care: eligibility-adjusted (stated assumption, conservative estimate)
    // LA funding for social care under Care Act 2014 is means-tested (UCL £23,250);
    // no official published percentage exists for chronic pain patients specifically.
    // We use 15% (Moderate) and 25% (Severe) as conservative stated assumptions,
    // consistent with the proportion of working-age adults with disability who
    // receive local authority support (NHS Digital Adult Social Care 2023/24 Survey
    // of Adult Social Care Activity: ~25% of adults with care needs receive LA funding).
    // These should be treated as expert-elicited assumptions in any HTA submission.
    const laEligSev = 0.25;  // 25% of Severe PLP patients assumed to qualify (stated assumption)
    const laEligMod = 0.15;  // 15% of Moderate PLP patients assumed to qualify (stated assumption)
    let laSaving = 0;
    for (let t = 0; t < 12; t++) {
        const vrH = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH = res.sc.cohortHistory[t] || [0,0,0,0,0];
        const ucLA = scH[2] * 900 * laEligMod + scH[3] * 2850 * laEligSev;   // eligibility-adjusted £/month
        const vrLA = vrH[2] * 900 * laEligMod + vrH[3] * 2850 * laEligSev;
        laSaving += (ucLA - vrLA);
    }

    // Disability benefits: DWP April 2025 rates (2024/25 uprating, effective 8 April 2024)
    // Enhanced PIP Daily Living: £108.55/week
    // Enhanced PIP Mobility:     £75.75/week
    // Total:                     £184.30/week = £798.63/month
    // Source: GOV.UK Benefit and Pension Rates 2024 to 2025
    //   https://www.gov.uk/government/publications/benefit-and-pension-rates-2024-to-2025
    // ESA/UC Health component: £400/mo (standard allowance + work-related activity group)
    // DWP award rate: ~50% of musculoskeletal/neuropathic pain PIP applicants
    //   receive the enhanced rate (DWP PIP Statistics October 2024 release;
    //   GOV.UK: personal-independence-payment-statistics-to-october-2024)
    const pipMonthly    = 799;       // DWP 2024/25 enhanced PIP total (£184.30/wk × 4.333)
    const pipEligRate   = 0.50;      // DWP 2024: ~50% of pain claimants receive enhanced PIP
    const ucEsaMonthly  = 400;       // UC/ESA Health Component (£400/mo stated assumption)
    const benefitPerSevPt = (pipMonthly * pipEligRate) + (ucEsaMonthly * pipEligRate);
    // = £799 × 0.50 + £400 × 0.50 = £399.50 + £200 = £599.50/month expected per Severe patient
    let benefitSaving = 0;
    for (let t = 0; t < 12; t++) {
        const vrH = res.vr.cohortHistory[t] || [0,0,0,0,0];
        const scH = res.sc.cohortHistory[t] || [0,0,0,0,0];
        // DWP saving when moving from Severe (where patient qualifies) to Moderate (where they may not)
        const ucBen = scH[3] * benefitPerSevPt;
        const vrBen = vrH[3] * benefitPerSevPt;
        benefitSaving += (ucBen - vrBen);
    }

    // Bug fix: panelDRow was using outer 'dq' instead of the passed 'delta_q' parameter
    function panelDRow(id_prefix, delta_c, delta_q) {
        const nmb_row = wtp * delta_q - delta_c;
        setText(id_prefix + '_dc',   fmt(delta_c));
        setText(id_prefix + '_icer', fmtIcer(delta_q > 0 ? delta_c / delta_q : null, delta_c, delta_q));
        setText(id_prefix + '_nmb',  fmt(nmb_row));
        setText(id_prefix + '_dec',  fmtDec(delta_c, delta_q));
        if (document.getElementById(id_prefix + '_dq'))
            setText(id_prefix + '_dq', delta_q.toFixed(5));  // fix: was using outer dq
    }

    panelDRow('socD_r1', dc,                              dq);  // NHS only
    panelDRow('socD_r2', dc - cgSaving,                   dq);  // + caregiver
    panelDRow('socD_r3', dc - cgSaving - prodSaving,      dq);  // + caregiver + productivity (adjusted)
    panelDRow('socD_r4', dc - cgSaving - prodSaving - laSaving, dq);  // + LA social care (eligibility-adj.)
    panelDRow('socD_r5', dc - cgSaving - prodSaving - laSaving - benefitSaving, dq);  // + DWP benefits (DWP 2024)

    /* ── Productivity display update with employment adjustment note ── */
    setText('socB_fcMild', '£' + Math.round(fcMild_gross).toLocaleString('en-GB') + ' (gross) / £' + Math.round(fcMild).toLocaleString('en-GB') + ' (54% emp. adj.)');
    setText('socB_fcMod',  '£' + Math.round(fcMod_gross).toLocaleString('en-GB')  + ' (gross) / £' + Math.round(fcMod).toLocaleString('en-GB')  + ' (54% emp. adj.)');
    setText('socB_fcSev',  '£' + Math.round(fcSev_gross).toLocaleString('en-GB')  + ' (gross) / £' + Math.round(fcSev).toLocaleString('en-GB')  + ' (54% emp. adj.)');

    const vrCostPt   = Math.max(0.01, (inputs.vrCost || 40.55) + (inputs.costOneOff || 0));
    // ⚠ SROI note: for commissioner communications, cite the conservative (caregiver-only) SROI.
    // The full-extended SROI includes DWP benefits and LA social care which are outside NHS perspective.
    // All SROI ratios are extremely high because the device cost (£40.55) is tiny relative to
    // chronic pain burden — a characteristic of low-cost digital health for high-burden conditions.
    // Employment-rate-adjusted productivity saving (55% employment rate, Fitzpatrick 2019) is used.
    const prodSavingForSROI = prodSaving;  // employment-adjusted (primary)
    const sroi_con   = cgSaving / vrCostPt;
    const sroi_panB  = (cgSaving + prodSavingForSROI) / vrCostPt;
    const sroi_full  = (cgSaving + prodSavingForSROI + laSaving + benefitSaving) / vrCostPt;

    setText('socSroi_vrCost',     '£' + vrCostPt.toFixed(2));
    setText('socSroi_conservative', sroi_con >= 0 ? sroi_con.toFixed(0) + '×' : '0×');
    setText('socSroi_panelB',     sroi_panB >= 0 ? sroi_panB.toFixed(0) + '×' : '0×');
    setText('socSroi_full',       sroi_full >= 0 ? sroi_full.toFixed(0) + '×' : '0×');

    const t1num = cgSaving;
    const t2num = cgSaving + prodSavingForSROI;
    const t3num = cgSaving + prodSavingForSROI + laSaving + benefitSaving + carerTravelSaving;
    setText('socSroi_t1_num',   fmt(t1num));
    setText('socSroi_t1_den',   '£' + vrCostPt.toFixed(2));
    setText('socSroi_t1_ratio', t1num > 0 ? (t1num/vrCostPt).toFixed(0) + '×' : '0×');
    setText('socSroi_t2_num',   fmt(t2num));
    setText('socSroi_t2_den',   '£' + vrCostPt.toFixed(2));
    setText('socSroi_t2_ratio', t2num > 0 ? (t2num/vrCostPt).toFixed(0) + '×' : '0×');
    setText('socSroi_t3_num',   fmt(t3num));
    setText('socSroi_t3_den',   '£' + vrCostPt.toFixed(2));
    setText('socSroi_t3_ratio', t3num > 0 ? (t3num/vrCostPt).toFixed(0) + '×' : '0×');

    /* ── Population-level caregiver burden ── */
    const annualPts = 5762;
    const weightedCgMo = 0.6 * cgModMo + 0.4 * cgSevMo;  // 60% Mod, 40% Sev start
    const popBurden    = Math.round(weightedCgMo * 12 * annualPts);
    const popSaving    = Math.round(cgSaving * annualPts);
    setText('socPop_cgBurden', '£' + (popBurden/1e6).toFixed(0) + 'M/yr');
    setText('socPop_cgSaving', '£' + (popSaving/1e6).toFixed(0) + 'M/yr');

    /* ── Dynamic caregiver table ── */
    const tbody = document.getElementById('socCgTableBody');
    if (tbody) {
        const rows = [
            ['Pain Free',    0,              0,          0,              0],
            ['Mild PLP',     inputs.durMild, hrsMild,    hrsMild*rate,   hrsMild*rate*12],
            ['Moderate PLP', inputs.durMod,  hrsMod,     hrsMod*rate,    hrsMod*rate*12],
            ['Severe PLP',   inputs.durSev,  hrsSev,     hrsSev*rate,    hrsSev*rate*12],
        ];
        tbody.innerHTML = rows.map(r => {
            const perThousand = Math.round(r[4] * 1000);
            return `<tr>
                <td>${r[0]}</td>
                <td class="num">${r[1]}</td>
                <td class="num">${r[2].toFixed(1)} hrs</td>
                <td class="num">£${Math.round(r[3]).toLocaleString('en-GB')}</td>
                <td class="num">£${Math.round(r[4]).toLocaleString('en-GB')}</td>
                <td class="num">£${(perThousand/1e6).toFixed(1)}M</td>
            </tr>`;
        }).join('');
    }
}


/* ─── Threshold Modal ─── */
window.openThresholdModal = function () {
    const inputs    = getInputs();
    const customWtp = vd('customWtp', 25000);
    const model     = new PLPMarkovModel({ ...inputs, wtp: customWtp });
    const res       = model.run();

    setText('modalCsSaving',    fmt0(res.costSavingThreshold));
    setText('modalCsEff',       fmt0(res.costEffectiveThreshold));
    setText('modalWtpLabel',    `@ £${customWtp.toLocaleString('en-GB')}/QALY`);
    setText('modalWtpDisplay',  '£' + customWtp.toLocaleString('en-GB'));

    let status;
    if (res.incCost < 0 && res.incQaly > 0)        status = '🌟 Dominant';
    else if (!isFinite(res.icer) || res.incQaly<=0) status = 'Non-calculable';
    else if (res.icer <= customWtp)                 status = '✅ Cost-Effective';
    else                                            status = '⚠️ Above Threshold';
    setText('modalStatus', status);

    const modal = document.getElementById('thresholdModal');
    if (modal) modal.style.setProperty('display','flex','important');
};

window.closeThresholdModal = function () {
    const modal = document.getElementById('thresholdModal');
    if (modal) modal.style.setProperty('display','none','important');
};

/* ─── CSV Export ─── */
window.exportDataCsv = function () {
    const inputs = getInputs();
    const model  = new PLPMarkovModel(inputs);
    const res    = model.run();

    const rows = [
        ['Parameter', 'Value'],
        ['WTP Threshold (£/QALY)',      inputs.wtp],
        ['VR Therapy Cost (£/patient)', inputs.vrCost],
        ['One-off Setup Cost (£/patient)', inputs.costOneOff],
        ['Total VR Cost (£/patient)',   inputs.vrCost + inputs.costOneOff],
        ['VR Scenario Efficacy (%)',    inputs.painReduction],
        ['CTMC Mode',                   inputs.useCTMC ? `Yes (t=${inputs.ctmcObsPeriod} months)` : 'No'],
        ['Cohort Size (N)',             inputs.cohortSize],
        [''],
        ['Result', 'Value'],
        ['Incremental Cost (ΔC) [£]',  res.incCost.toFixed(2)],
        ['Incremental QALYs (ΔE)',      res.incQaly.toFixed(6)],
        ['ICER (£/QALY)',               isFinite(res.icer) ? res.icer.toFixed(2) : 'Dominant'],
        ['Net Monetary Benefit (£)',    res.nmb.toFixed(2)],
        ['Cost-Saving Threshold (£)',   res.costSavingThreshold.toFixed(2)],
        ['Cost-Effective Threshold (£)',res.costEffectiveThreshold.toFixed(2)],
        [''],
        ['Health State', 'Utility', 'Monthly Drug Cost (£)'],
        ['Pain Free',    inputs.utilPf,   '0.00'],
        ['Mild PLP',     inputs.utilMild, (inputs.costGabapentin*30.4375).toFixed(2)],
        ['Moderate PLP', inputs.utilMod,  (inputs.costPregabalin*30.4375).toFixed(2)],
        ['Severe PLP',   inputs.utilSev,  ((inputs.costAmitriptyline+inputs.costDuloxetine)*30.4375).toFixed(2)],
        ['Death',        '0.00',          '0.00'],
    ];

    const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href     = encodeURI(csv);
    a.download = 'UCLTouchRehab_PLP_HealthEcon.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

/* ─── Results Tab — live update all named IDs ─── */
function updateResultsTab(res, inputs) {
    if (!res || !inputs) return;
    const set  = (id, val) => setText(id, val);
    const fmtC = v => (v < 0 ? '\u2212\xa3' : '\xa3') + Math.abs(v).toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2});
    const fmtC0= v => (v < 0 ? '\u2212\xa3' : '\xa3') + Math.abs(Math.round(v)).toLocaleString('en-GB');
    const dominant = res.incCost < 0 && res.incQaly > 0;
    const ceOnly   = !dominant && res.nmb > 0;
    const wtp      = inputs.wtp || 25000;

    // KPI cards
    set('sysPrice',     '\xa3' + (inputs.vrCost || 0).toFixed(2) + '/pt');
    set('sysOpex',      '\xa3' + (inputs.costOneOff || 0).toFixed(2) + ' setup');
    set('sysNmb',       fmtC(res.nmb));
    set('sysBeCs',      fmtC(res.costSavingThreshold));
    set('sysBe5yr',     fmtC(res.costSavingThreshold * 5));  // rough 5-yr
    set('sysCapBand',   fmtC(res.costSavingThreshold));

    // Verdict banner
    const banner = document.getElementById('sysVerdictBanner');
    const title  = document.getElementById('sysVerdictTitle');
    const txt    = document.getElementById('sysVerdictText');
    if (banner) {
        if (dominant) {
            banner.style.background = 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))';
            banner.style.borderColor = 'rgba(16,185,129,.35)';
        } else if (ceOnly) {
            banner.style.background = 'linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.04))';
            banner.style.borderColor = 'rgba(245,158,11,.3)';
        } else {
            banner.style.background = 'linear-gradient(135deg,rgba(239,68,68,.12),rgba(239,68,68,.04))';
            banner.style.borderColor = 'rgba(239,68,68,.3)';
        }
    }
    if (title) title.textContent = dominant ? '\ud83c\udf1f Dominant \u2014 Cost-Saving + Health Gain'
                                 : ceOnly   ? '\u2705 Cost-Effective at WTP \xa3' + wtp.toLocaleString('en-GB') + '/QALY'
                                 :            '\u26a0\ufe0f Not Cost-Effective at Current Price';
    if (txt) txt.textContent = dominant
        ? 'At the current price of \xa3' + (inputs.vrCost||0).toFixed(2) + '/pt, UCLTouchRehab saves '
          + fmtC0(Math.abs(res.incCost)) + ' vs usual care per patient. ICER = '
          + fmtC0(Math.abs(res.incCost/res.incQaly)) + '/QALY saved. NMB = ' + fmtC(res.nmb) + '.'
        : 'Incremental cost: ' + fmtC(res.incCost) + '/pt. Incremental QALYs: +' + res.incQaly.toFixed(4)
          + '. ICER: ' + (isFinite(res.icer) ? fmtC0(res.icer)+'/QALY' : 'N/A') + '. NMB: ' + fmtC(res.nmb) + '.';

    // KPI row spans (look for elements inside sysKpiRow)
    const kpiRow = document.getElementById('sysKpiRow');
    if (kpiRow) {
        const cells = kpiRow.querySelectorAll('[data-kpi]');
        cells.forEach(c => {
            const k = c.dataset.kpi;
            if (k === 'dc')   c.textContent = fmtC(res.incCost);
            if (k === 'dq')   c.textContent = '+' + res.incQaly.toFixed(4);
            if (k === 'icer') c.textContent = dominant ? 'Dominant' : isFinite(res.icer) ? fmtC0(res.icer)+'/QALY' : 'N/A';
            if (k === 'nmb')  c.textContent = fmtC(res.nmb);
        });
    }

    // Procurement / approval thresholds
    set('sysCapApproval', dominant ? 'Dominant \u2014 immediate approval recommended' : ceOnly ? 'CE at \xa3'+wtp.toLocaleString('en-GB')+'/QALY' : 'Not CE at WTP');
    set('sysProcurement', fmtC(res.costEffectiveThreshold25 ?? res.costEffectiveThreshold ?? 0));

    // Action note
    const actionNote = document.getElementById('sysActionNote');
    if (actionNote) actionNote.textContent = dominant
        ? 'UCLTouchRehab is strongly dominant at current parameters. Recommend fast-track NHS procurement.'
        : ceOnly ? 'UCLTouchRehab is cost-effective. Consider NICE Early Value Assessment submission.'
        : 'Model currently not cost-effective. Reduce price or increase efficacy assumption.';

    // Update the Results tab charts if they exist
    // resCostChart — bar: VR total cost vs UC total cost
    const resCostCanvas = document.getElementById('resCostChart');
    if (resCostCanvas && typeof Chart !== 'undefined') {
        if (window._resCharts) { try { window._resCharts.cost?.destroy(); } catch(e){} }
        window._resCharts = window._resCharts || {};
        window._resCharts.cost = new Chart(resCostCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Usual Care', 'VR Therapy'],
                datasets: [{
                    label: 'Total Cost per Patient (\xa3)',
                    data:  [res.sc.totalCosts, res.vr.totalCosts],
                    backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks:{color:'#94a3b8'}, grid:{display:false} },
                    y: { ticks:{color:'#94a3b8', callback: v => '\xa3'+Math.round(v).toLocaleString('en-GB')},
                         grid:{color:'rgba(255,255,255,0.05)'} }
                }
            }
        });
    }
    // resQalyChart — bar: VR QALYs vs UC QALYs
    const resQalyCanvas = document.getElementById('resQalyChart');
    if (resQalyCanvas && typeof Chart !== 'undefined') {
        if (window._resCharts?.qaly) { try { window._resCharts.qaly.destroy(); } catch(e){} }
        window._resCharts = window._resCharts || {};
        window._resCharts.qaly = new Chart(resQalyCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Usual Care', 'VR Therapy'],
                datasets: [{
                    label: 'Total QALYs',
                    data:  [res.sc.totalQALYs, res.vr.totalQALYs],
                    backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(56,189,248,0.7)'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks:{color:'#94a3b8'}, grid:{display:false} },
                    y: { ticks:{color:'#94a3b8', callback: v => v.toFixed(3)},
                         grid:{color:'rgba(255,255,255,0.05)'} }
                }
            }
        });
    }
}

/* ─── Adaptation Report Tab — live update key stats ─── */
function updateAdaptationTab(res, inputs) {
    if (!res || !inputs) return;
    const set  = (id, val) => setText(id, val);
    const fmtC = v => (v < 0 ? '\u2212\xa3' : '\xa3') + Math.abs(v).toLocaleString('en-GB', {minimumFractionDigits:2, maximumFractionDigits:2});
    const dominant = res.incCost < 0 && res.incQaly > 0;

    // Update the comparison table body if it exists
    const tbody = document.getElementById('comparisonTableBody');
    if (tbody) {
        const rows = [
            ['Incremental Cost (ΔC)',   fmtC(res.incCost) + '/pt',  'N/A (single-arm)'],
            ['Incremental QALYs (ΔE)', '+' + res.incQaly.toFixed(4), 'N/A'],
            ['ICER',                   dominant ? 'Dominant' : (isFinite(res.icer) ? '\xa3'+Math.round(res.icer).toLocaleString('en-GB')+'/QALY' : 'N/A'), 'N/A'],
            ['Net Monetary Benefit',   fmtC(res.nmb) + ' (WTP \xa3'+( inputs.wtp||25000).toLocaleString('en-GB')+')', 'N/A'],
            ['VR Cost (per patient)',   '\xa3' + (inputs.vrCost||0).toFixed(2), 'N/A'],
            ['Efficacy (pain \u2193)',  (inputs.painReduction||0).toFixed(1) + '%', 'N/A'],
            ['Cost-Saving Ceiling',    fmtC(res.costSavingThreshold) + '/pt', 'N/A'],
        ];
        tbody.innerHTML = rows.map(([label, ucl, groen]) =>
            `<tr>
                <td style="padding:.5rem .8rem;color:#94a3b8;font-size:.78rem;">${label}</td>
                <td style="padding:.5rem .8rem;color:#e2e8f0;font-weight:700;font-size:.78rem;">${ucl}</td>
                <td style="padding:.5rem .8rem;color:#64748b;font-size:.78rem;">${groen}</td>
            </tr>`
        ).join('');
    }
}

/* ─── DOM Helpers ─── */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function colorEl(id, col) { const el = document.getElementById(id); if (el) el.style.color = col; }
function setClass(el, cls) { if (el) el.className = cls; }

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter',system-ui,sans-serif";
    wireAutoRefresh();
    // Sync table mirrors on load
    [['vrCost','mc0'],['costOneOff','mc0b']].forEach(([sid,tid]) => {
        const s = document.getElementById(sid), t = document.getElementById(tid);
        if (s && t) t.value = s.value;
    });
    recalculateAll();
    window.recalculateAll = recalculateAll; // expose for onclick= handlers
});

/* ═══════════════════════════════════════════════════════════════
   MARKOV DIAGRAM EXPORT FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Save the Markov structure SVG as a high-resolution PNG (2× scale).
 * Composites on a dark background (#080f1e) for a clean export.
 */
window.saveMarkovPNG = function () {
    const svg = document.getElementById('markovSVG');
    if (!svg) { alert('Markov diagram not found — please open the Markov Structure tab first.'); return; }

    const btn = document.getElementById('saveMarkovBtn');
    if (btn) { btn.textContent = '⏳ Rendering…'; btn.disabled = true; }

    // Serialise SVG to data URI
    const serialiser = new XMLSerializer();
    let svgStr = serialiser.serializeToString(svg);
    // Ensure XML namespace is present
    if (!svgStr.includes('xmlns=')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url     = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        const scale  = 3;   // 3× resolution for publication quality
        const vb     = svg.viewBox.baseVal;
        const w      = (vb && vb.width > 0) ? vb.width  : 900;
        const h      = (vb && vb.height > 0) ? vb.height : 320;

        const canvas = document.createElement('canvas');
        canvas.width  = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');

        // Dark background matching app theme
        ctx.fillStyle = '#080f1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw SVG at 3× size
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        // Trigger download
        const link = document.createElement('a');
        link.download = 'UCLTouchRehab_Markov_Structure.png';
        link.href     = canvas.toDataURL('image/png');
        link.click();

        if (btn) { btn.textContent = '⬇ Save PNG (High-Res)'; btn.disabled = false; }
    };
    img.onerror = function () {
        URL.revokeObjectURL(url);
        alert('PNG export failed — try the SVG export instead.');
        if (btn) { btn.textContent = '⬇ Save PNG (High-Res)'; btn.disabled = false; }
    };
    img.src = url;
};

/**
 * Save the Markov structure diagram as a vector SVG file.
 */
window.saveMarkovSVG = function () {
    const svg = document.getElementById('markovSVG');
    if (!svg) { alert('Markov diagram not found.'); return; }

    const serialiser = new XMLSerializer();
    let svgStr = serialiser.serializeToString(svg);
    if (!svgStr.includes('xmlns=')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Add XML declaration
    const full = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgStr;
    const blob = new Blob([full], { type: 'image/svg+xml;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'UCLTouchRehab_Markov_Structure.svg';
    a.click();
    URL.revokeObjectURL(a.href);
};


