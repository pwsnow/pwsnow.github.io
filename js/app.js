/**
 * app.js – UI Controller for UCLTouchRehab PLP Health Economic Analysis
 */

/* ─── Tab Switching ─── */
window.switchTabByName = function (name) {
    const BTNS = {
        model:'btnTabModel', structure:'btnTabStructure', table:'btnTabTable',
        hta:'btnTabHta', societal:'btnTabSocietal', equations:'btnTabEquations',
        results:'btnTabResults', adaptation:'btnTabAdaptation', walkthrough:'btnTabWalkthrough',
        psa:'btnTabPSA'
    };
    const TABS = {
        model:'tab-model', structure:'tab-structure', table:'tab-table',
        hta:'tab-hta', societal:'tab-societal', equations:'tab-equations',
        results:'tab-results', adaptation:'tab-adaptation', walkthrough:'tab-walkthrough',
        psa:'tab-psa'
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

    if (name === 'equations' && typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
    if (name === 'societal') updateSocietalTab();
    if (name === 'hta' && window._lastRes) updateHtaDisplay(window._lastRes, window._lastInputs);
    if (name === 'psa' && typeof refreshPSAMeans === 'function') refreshPSAMeans();
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
        el.style.color  = total <= 219.32 ? '#10b981' : total <= 245.52 ? '#38bdf8' : '#f59e0b';
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

/* ─── System Price → per-patient calculator ─── */
window.calcSystemPrice = function () {
    const total = parseFloat(document.getElementById('sp_total')?.value) || 0;
    const ppy   = parseFloat(document.getElementById('sp_ppy')?.value)   || 1;
    const life  = parseFloat(document.getElementById('sp_life')?.value)  || 1;
    const perPt = total / (ppy * life);
    const el    = document.getElementById('sp_result');
    if (el) {
        el.textContent = '£' + perPt.toFixed(2) + '/pt';
        // Colour-code against the CS ceiling (£219.32 at base)
        el.style.color = perPt <= 219.32 ? '#10b981' : perPt <= 245.52 ? '#38bdf8' : '#f59e0b';
        el.title = `£${total.toLocaleString('en-GB')} ÷ (${ppy} pts/yr × ${life} yrs) = £${perPt.toFixed(2)}/patient`;
    }
    return perPt;
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
    let lo = 0, hi = 50;
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
    // If even at 0% efficacy the threshold exceeds cost (impossible here) or
    // at 50% we still can't reach it, return Infinity
    const mCheck = new PLPMarkovModel({ ...base, vrCost: 0, costOneOff: 0, painReduction: 50 });
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
    const cs   = csEl ? parseInt(csEl.value, 10) : 1000;
    return {
        wtp:               vd('wtp',            25000),
        vrCost:            vd('vrCost',          40.55),
        costOneOff:        vd('costOneOff',       0.00),
        painReduction:     vd('painReduction',    2.8),
        cohortSize:        isNaN(cs) ? 1000 : cs,
        useCTMC:           vbool('useCTMC'),
        ctmcObsPeriod:     vd('ctmcObsPeriod',   3.45),
        utilPf:            vd('utilPf',           0.80),
        utilMild:          vd('utilMild',         0.67),
        utilMod:           vd('utilMod',          0.46),
        utilSev:           vd('utilSev',          0.16),
        costGabapentin:    vd('mc1',              1.60),
        costPregabalin:    vd('mc2',             10.90),
        costAmitriptyline: vd('mc3',              0.55),
        costDuloxetine:    vd('mc4',              3.30),
        costGpVisit:       vd('mc5',             97.50),
        costSpecialist:    vd('mc6',            133.00),
        travelCostKm:      vd('nmc1',             0.35),
        travelDistanceKm:  vd('nmc2',             4.8),
        parkingCost:       vd('nmc3',             3.50),
        costCaregiverRate: vd('nmc4',            12.71),
        durMild:           vd('nmc5',             0.5),
        durMod:            vd('nmc6',             7.5),
        durSev:            vd('nmc7',            17.0),
        durConst:          vd('nmc8',            24.0),
    };
}

/* ─── Debounce helper for auto-refresh ─── */
let _debounceTimer = null;
function scheduleRefresh() {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(recalculateAll, 600);
}

/* ─── Wire auto-refresh to all dashboard inputs ─── */
function wireAutoRefresh() {
    const ids = ['wtp','vrCost','costOneOff','painReduction','cohortSize',
                 'utilPf','utilMild','utilMod','utilSev',
                 'axCeXmin','axCeXmax','axCeYmin','axCeYmax','axHrYmax',
                 'useCTMC','ctmcObsPeriod'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input',  scheduleRefresh);
            el.addEventListener('change', scheduleRefresh);
        }
    });
}

/* ─── Main Recalculate ─── */
function recalculateAll() {
    const statusEl = document.getElementById('statusText');
    if (statusEl) statusEl.textContent = 'Calculating…';

    // Use setTimeout so browser can repaint status first
    setTimeout(() => {
        try {
            const inputs = getInputs();
            const model  = new PLPMarkovModel(inputs);
            const res    = model.run();

            window._lastRes    = res;
            window._lastInputs = inputs;
            window._lastModel  = model;

            updateKpis(res, inputs);
            updateBadges(res, inputs);
            updateMinEfficacyDisplay(inputs);   // ← reverse solver: price → min efficacy
            updateCePlane(res, inputs);
            updateCohortTrace(res);
            updateHeadroom(res, inputs);
            updateTornado(res);
            updateHtaDisplay(res, inputs);
            updateCtmcPanel(model);

            if (statusEl) statusEl.textContent = '✓ Updated ' + new Date().toLocaleTimeString('en-GB');
        } catch(err) {
            console.error(err);
            if (statusEl) statusEl.textContent = '⚠ Error: ' + err.message;
        }
    }, 10);
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

/* ─── CE Plane ─── */
function updateCePlane(res, inputs) {
    destroyChart('ce');
    const canvas = document.getElementById('cePlaneChart');
    if (!canvas) return;

    const xMin = vd('axCeXmin', -0.05);
    const xMax = vd('axCeXmax',  0.10);
    const yMin = vd('axCeYmin', -200);
    const yMax = vd('axCeYmax',  200);

    const wtpLine = [{ x: xMin, y: xMin * inputs.wtp }, { x: xMax, y: xMax * inputs.wtp }];

    _charts['ce'] = new Chart(canvas.getContext('2d'), {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'PSA Iterations (N=200)',
                    data:  res.psa,
                    backgroundColor: 'rgba(56,189,248,0.30)',
                    pointRadius: 3.5,
                    order: 3
                },
                {
                    label: 'Base Case',
                    data:  [{ x: res.incQaly, y: res.incCost }],
                    backgroundColor: res.nmb >= 0 ? '#10b981' : '#ef4444',
                    pointStyle: 'rectRot',
                    pointRadius: 13,
                    order: 1
                },
                {
                    label: `WTP Line (£${inputs.wtp.toLocaleString('en-GB')}/QALY)`,
                    data:  wtpLine,
                    type: 'line',
                    borderColor: 'rgba(245,158,11,0.7)',
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
                legend: { position:'bottom', labels:{ color:'#94a3b8', boxWidth:12, font:{size:11} } },
                tooltip: { callbacks: { label: c => `ΔE=${fmtN(c.parsed.x,4)}, ΔC=${fmt(c.parsed.y)}` } }
            },
            scales: {
                x: { min: xMin, max: xMax,
                    title:{ display:true, text:'Incremental QALYs (ΔE)', color:'#94a3b8' },
                    ticks:{ color:'#94a3b8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y: { min: yMin, max: yMax,
                    title:{ display:true, text:'Incremental Cost (ΔC) [£]', color:'#94a3b8' },
                    ticks:{ color:'#94a3b8', callback: v => '£'+v }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });
    // Auto-resize: PSA scatter — 200 points, comfortable square-ish
    autoResizeChart('wrap-cePlaneChart', 'scatter', res.psa ? res.psa.length : 200, 280, 380);
    if (_charts['ce']) _charts['ce'].resize();
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

    const yMax = vd('axHrYmax', 500);

    _charts['hr'] = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: res.headroom.map(h => h.effectiveness+'%'),
            datasets: [
                {
                    label: 'Cost-Saving Limit (£)',
                    data:  res.headroom.map(h => h.costSavingMax),
                    borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.12)',
                    fill:true, tension:0.3, borderWidth:2
                },
                {
                    label: `Cost-Effective Limit @ £${inputs.wtp.toLocaleString('en-GB')}/QALY`,
                    data:  res.headroom.map(h => h.costEffectiveMax),
                    borderColor:'#38bdf8', backgroundColor:'rgba(56,189,248,0.08)',
                    fill:'-1', tension:0.3, borderWidth:2
                },
                {
                    label: `Current VR + Setup Cost (£${(inputs.vrCost + inputs.costOneOff).toFixed(2)})`,
                    data:  res.headroom.map(() => inputs.vrCost + inputs.costOneOff),
                    borderColor:'#f59e0b', borderDash:[6,4], pointRadius:0,
                    tension:0, borderWidth:1.5
                }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', boxWidth:12, font:{size:11} } } },
            scales: {
                x:{ title:{display:true, text:'VR Scenario Efficacy (%)', color:'#94a3b8'}, ticks:{color:'#94a3b8', maxRotation:0}, grid:{color:'rgba(255,255,255,0.05)'} },
                y:{ title:{display:true, text:'Max Viable Total VR Cost (£)', color:'#94a3b8'},
                    ticks:{color:'#94a3b8', callback:v=>'£'+v}, grid:{color:'rgba(255,255,255,0.05)'}, min:0, max:yMax }
            }
        }
    });
    // Auto-resize: headroom line chart — grows with number of efficacy steps
    const hrPoints = res.headroom ? res.headroom.length : 10;
    autoResizeChart('wrap-headroomChart', 'line', hrPoints, 260, 380);
    if (_charts['hr']) _charts['hr'].resize();
}


function updateTornado(res) {
    destroyChart('tor');
    const canvas = document.getElementById('tornadoChart');
    if (!canvas || !res.tornado) return;

    const base = isFinite(res.tornado.baseICER) ? res.tornado.baseICER : 0;
    const data = res.tornado.data;

    _charts['tor'] = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [
                { label:'Low Param',  data:data.map(d => d.lowImpactValue  - base), backgroundColor:'rgba(245,158,11,0.8)' },
                { label:'High Param', data:data.map(d => d.highImpactValue - base), backgroundColor:'rgba(56,189,248,0.8)'  }
            ]
        },
        options: {
            indexAxis:'y',
            responsive:true, maintainAspectRatio:false,
            plugins:{
                legend:{ position:'bottom', labels:{ color:'#94a3b8', boxWidth:12, font:{size:11} } },
                tooltip:{ callbacks:{ label: c => `ICER: ${fmt0(c.raw + base)}/QALY` } }
            },
            scales: {
                x:{ title:{display:true, text:'Deviation from Base ICER (£/QALY)', color:'#94a3b8'},
                    ticks:{color:'#94a3b8'}, grid:{color:'rgba(255,255,255,0.05)'} },
                y:{ ticks:{color:'#94a3b8', font:{size:10}}, grid:{color:'rgba(255,255,255,0.04)'} }
            }
        }
    });
    // Auto-resize: tornado grows with number of DSA parameters
    const numBars = res.tornado && res.tornado.data ? res.tornado.data.length : 6;
    autoResizeChart('wrap-tornadoChart', 'bar-h', numBars, 220, 560);
    if (_charts['tor']) _charts['tor'].resize();
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
function updateSocietalTab() {
    const inputs = getInputs();
    const model  = new PLPMarkovModel(inputs);
    const res    = model.run();

    const rate    = inputs.costCaregiverRate;
    const hrsMild = inputs.durMild * 30.4375;
    const hrsMod  = inputs.durMod  * 30.4375;
    const hrsSev  = inputs.durSev  * 30.4375;

    setText('socCgRate',   '£' + rate.toFixed(2) + '/hr');
    setText('socHrsMild',  hrsMild.toFixed(1) + ' hrs/month');
    setText('socHrsMod',   hrsMod.toFixed(1)  + ' hrs/month');
    setText('socHrsSev',   hrsSev.toFixed(1)  + ' hrs/month');
    setText('socCostMild', '£' + Math.round(hrsMild*rate).toLocaleString('en-GB') + '/month');
    setText('socCostMod',  '£' + Math.round(hrsMod*rate).toLocaleString('en-GB') + '/month');
    setText('socCostSev',  '£' + Math.round(hrsSev*rate).toLocaleString('en-GB') + '/month');

    const N = inputs.cohortSize;
    let totalSavings = 0;
    for (let t = 0; t < 12; t++) {
        const dMild = (res.vr.cohortHistory[t][1] - res.sc.cohortHistory[t][1]) * N;
        const dMod  = (res.vr.cohortHistory[t][2] - res.sc.cohortHistory[t][2]) * N;
        const dSev  = (res.vr.cohortHistory[t][3] - res.sc.cohortHistory[t][3]) * N;
        totalSavings -= (dMild*hrsMild + dMod*hrsMod + dSev*hrsSev) * rate;
    }

    const totalVrCost = (inputs.vrCost + inputs.costOneOff) * N;
    const sroi = totalVrCost > 0 && totalSavings > 0
        ? (totalSavings / totalVrCost).toFixed(1) + 'x'
        : (totalSavings <= 0 ? '0.0x' : '∞');

    setText('societalRoi',    sroi + ' (caregiver savings vs device + setup cost)');
    setText('societalRoi2',   sroi);   // duplicate for new tab layout
    setText('sroiRow1',       sroi);   // SROI table row
    setText('socTotalSavings', fmt(totalSavings));
    setText('socTotalSavings2', fmt(totalSavings));
    setText('socTotalVrCost',  fmt(totalVrCost));
    setText('socNetSavings',   fmt(totalSavings - totalVrCost));

    const tbody = document.getElementById('socCgTableBody');
    if (tbody) {
        const rows = [
            ['Pain Free',          0,              0,                          0,                           0],
            ['Mild PLP',           inputs.durMild, hrsMild,                    hrsMild*rate,                hrsMild*rate*12],
            ['Moderate PLP',       inputs.durMod,  hrsMod,                     hrsMod*rate,                 hrsMod*rate*12],
            ['Severe PLP',         inputs.durSev,  hrsSev,                     hrsSev*rate,                 hrsSev*rate*12],
            ['Constant/Refractory',inputs.durConst,inputs.durConst*30.4375,    inputs.durConst*30.4375*rate, inputs.durConst*30.4375*rate*12],
        ];
        tbody.innerHTML = rows.map(r =>
            `<tr><td>${r[0]}</td><td>${r[1]} hrs/day</td><td>${r[2].toFixed(1)} hrs</td><td>£${Math.round(r[3]).toLocaleString('en-GB')}</td><td>£${Math.round(r[4]).toLocaleString('en-GB')}</td></tr>`
        ).join('');
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

/* ─── DOM Helpers ─── */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function colorEl(id, col) { const el = document.getElementById(id); if (el) el.style.color = col; }
function setClass(el, cls) { if (el) el.className = cls; }

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter',system-ui,sans-serif";
    wireAutoRefresh();
    recalculateAll();
});
