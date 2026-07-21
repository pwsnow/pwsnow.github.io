/**
 * PLPMarkovModel – UCLTouchRehab VR Therapy for Upper-Limb Phantom Limb Pain
 * 1-Year monthly Markov cohort, 5 health states:
 *   0 = Pain Free, 1 = Mild PLP, 2 = Moderate PLP, 3 = Severe PLP, 4 = Death
 *
 * Transition matrices sourced directly from the user-provided parameter table.
 * Optionally uses CTMC-derived monthly matrix (via ctmc.js) for Month 2+.
 * Death probability 0.0005/month is subtracted from each living-state diagonal.
 */

class PLPMarkovModel {
    constructor(params = {}) {
        this.p = this._defaults(params);
        // Pre-compute CTMC matrix if enabled
        if (this.p.useCTMC) this._computeCTMC();
    }

    _defaults(p) {
        return {
            // --- Model controls ---
            wtp:           p.wtp           !== undefined ? p.wtp           : 25000,   // £/QALY (NICE April 2026: £25k–£35k)
            vrCost:        p.vrCost        !== undefined ? p.vrCost        : 40.55,   // recurring session cost £/patient
            costOneOff:    p.costOneOff    !== undefined ? p.costOneOff    : 0.00,    // one-off setup/programme cost £/patient
            painReduction: p.painReduction !== undefined ? p.painReduction : 2.8,     // % efficacy (headroom parameter)
            cohortSize:    p.cohortSize    !== undefined ? p.cohortSize    : 1000,
            cycles:        p.cycles        !== undefined ? p.cycles        : 12,

            // --- CTMC toggle ---
            useCTMC:        p.useCTMC       !== undefined ? p.useCTMC       : false,
            ctmcObsPeriod:  p.ctmcObsPeriod !== undefined ? p.ctmcObsPeriod : 3.45,   // weeks 1-15 = 3.45 months

            // --- Utilities ---
            utilPf:   p.utilPf   !== undefined ? p.utilPf   : 0.80,
            utilMild: p.utilMild !== undefined ? p.utilMild : 0.67,
            utilMod:  p.utilMod  !== undefined ? p.utilMod  : 0.46,
            utilSev:  p.utilSev  !== undefined ? p.utilSev  : 0.16,

            // --- Medical costs (£/day) ---
            costGabapentin:    p.costGabapentin    !== undefined ? p.costGabapentin    : 1.60,
            costPregabalin:    p.costPregabalin    !== undefined ? p.costPregabalin    : 10.90,
            costAmitriptyline: p.costAmitriptyline !== undefined ? p.costAmitriptyline : 0.55,
            costDuloxetine:    p.costDuloxetine    !== undefined ? p.costDuloxetine    : 3.30,
            costGpVisit:       p.costGpVisit       !== undefined ? p.costGpVisit       : 97.50,
            costSpecialist:    p.costSpecialist    !== undefined ? p.costSpecialist    : 133.00,

            // --- Non-medical costs ---
            travelCostKm:      p.travelCostKm      !== undefined ? p.travelCostKm      : 0.35,
            travelDistanceKm:  p.travelDistanceKm  !== undefined ? p.travelDistanceKm  : 4.8,
            parkingCost:       p.parkingCost        !== undefined ? p.parkingCost       : 3.50,
            costCaregiverRate: p.costCaregiverRate !== undefined ? p.costCaregiverRate : 12.71,

            // --- Daily pain durations (hrs/day) ---
            durMild:  p.durMild  !== undefined ? p.durMild  : 0.5,
            durMod:   p.durMod   !== undefined ? p.durMod   : 7.5,
            durSev:   p.durSev   !== undefined ? p.durSev   : 17.0,
            durConst: p.durConst !== undefined ? p.durConst : 24.0,
        };
    }

    /**
     * CTMC: derive monthly matrix from the observed Month 2+ matrix over
     * ctmcObsPeriod months (default 3.45 = 15 weeks).
     * Stores result in this.ctmcMonthly, this.ctmcGenerator, this.ctmcValidation.
     */
    _computeCTMC() {
        if (typeof CTMCMath === 'undefined') return;

        const d = 0.0005;
        // Observed Month 2+ matrix (full 5×5 including death column)
        const P_obs = [
            [0.8892 - d, 0.1108,  0.0000,    0.0000,    d],
            [0.0000,     0.9200 - d, 0.0800,  0.0000,    d],
            [0.0000,     0.0626,  0.8748 - d, 0.0626,    d],
            [0.0000,     0.0000,  0.0000,   1.0000 - d,  d],
            [0.0000,     0.0000,  0.0000,    0.0000,   1.0000],
        ];

        try {
            const t      = this.p.ctmcObsPeriod;
            // computeGenerator now returns { Q, Q_raw, numClamped, maxClamp }
            const result = CTMCMath.computeGenerator(P_obs, t);
            const Pm     = CTMCMath.monthlyMatrix(result.Q, 1);

            this.ctmcGenerator      = result.Q;
            this.ctmcGeneratorRaw   = result.Q_raw;
            this.ctmcNumClamped     = result.numClamped;
            this.ctmcMaxClamp       = result.maxClamp;
            this.ctmcMonthly        = Pm;
            this.ctmcObsMatrix      = P_obs;
            this.ctmcValidation     = CTMCMath.validateGenerator(result.Q);
            this.ctmcPmValidation   = CTMCMath.validateStochastic(Pm);
            // Reconstruction: exp(Q × t) should reproduce P_obs
            this.ctmcReconstruction = CTMCMath.monthlyMatrix(result.Q, t);
        } catch (e) {
            console.warn('CTMC computation failed:', e.message);
            this.ctmcMonthly    = null;
            this.ctmcValidation = { valid: false, issues: ['Computation failed: ' + e.message] };
        }
    }

    /**
     * 18-row transition matrix from the parameter table.
     * Rows/cols: [PF, Mild, Mod, Sev, Death]
     * The 0.0005 death probability is embedded in each living-state row.
     * If useCTMC is enabled, Month 2+ uses the CTMC-derived monthly matrix.
     */
    _matrix(cycle) {
        const d = 0.0005;
        if (cycle === 0) {
            // ---- Month 1 (acute post-amputation — observed directly over 1 month) ----
            return [
             // PF          Mild       Mod            Sev    Death
              [1.0000-d,  0.0000,    0.0000,         0.0000, d],  // Pain Free
              [0.0000,    1.0000-d,  0.0000,         0.0000, d],  // Mild PLP
              [0.1667,    0.3333,    0.5000-d,       0.0000, d],  // Moderate PLP
              [0.4000,    0.2000,    0.4000-d,       0.0000, d],  // Severe PLP
              [0.0000,    0.0000,    0.0000,         0.0000, 1.0000], // Death
            ];
        }

        // Month 2–12: use CTMC-derived matrix if available and enabled
        if (this.p.useCTMC && this.ctmcMonthly) {
            return this.ctmcMonthly;
        }

        // ---- Month 2–12 manual (from parameter table) ----
        return [
         // PF           Mild       Mod             Sev       Death
          [0.8892-d,     0.1108,    0.0000,         0.0000,   d],  // Pain Free
          [0.0000,       0.9200-d,  0.0800,         0.0000,   d],  // Mild PLP
          [0.0000,       0.0626,    0.8748-d,       0.0626,   d],  // Moderate PLP
          [0.0000,       0.0000,    0.0000,         1.0000-d, d],  // Severe PLP
          [0.0000,       0.0000,    0.0000,         0.0000,   1.0000], // Death
        ];
    }

    /** GP visits per patient per month by health state */
    _gpVisits(cycle) {
        if (cycle === 0)                   return [0.00, 0.50, 1.00, 1.00, 0.00];
        if (cycle === 1 || cycle === 2)    return [0.00, 0.25, 0.50, 0.50, 0.00];
        return                                    [0.00, 0.00, 0.111, 0.222, 0.00]; // Month 4–12
    }

    /**
     * Simulate one arm (isVR = true → UCLTouchRehab; false → Usual Care).
     *
     * Starting distribution: 60% Moderate PLP, 40% Severe PLP (typical amputee cohort).
     * VR headroom scenario: painReduction % of Mod+Sev patients shift one level up at t=0.
     *   (Note: this is a sensitivity/headroom parameter — transition probabilities are from the data.)
     *
     * Costs at t=0 (one-off): vrCost (therapy) + costOneOff (setup/programme), VR arm only.
     */
    simulateArm(isVR) {
        const { vrCost, costOneOff, painReduction,
                utilPf, utilMild, utilMod, utilSev,
                costGpVisit, costSpecialist,
                costGabapentin, costPregabalin, costAmitriptyline, costDuloxetine,
                travelCostKm, travelDistanceKm, parkingCost, costCaregiverRate,
                durMild, durMod, durSev, cycles } = this.p;

        const utils = [utilPf, utilMild, utilMod, utilSev, 0.00];

        // Monthly caregiver hours (daily hrs × 30.4375 days/month)
        const hrsMild = durMild * 30.4375;
        const hrsMod  = durMod  * 30.4375;
        const hrsSev  = durSev  * 30.4375;

        // Travel + parking cost per healthcare visit (return trip)
        const travelPerVisit = (travelDistanceKm * 2 * travelCostKm) + parkingCost;

        // Full unit costs including travel
        const gpUnit   = costGpVisit   + travelPerVisit;
        const specUnit = costSpecialist + travelPerVisit;

        // Monthly drug costs (cost/day × 30.4375 days)
        const drugMild = costGabapentin  * 30.4375;
        const drugMod  = costPregabalin  * 30.4375;
        const drugSev  = (costAmitriptyline + costDuloxetine) * 30.4375;

        // Starting cohort (proportions summing to 1)
        let s = [0.00, 0.00, 0.60, 0.40, 0.00];

        // Apply VR headroom scenario at baseline
        if (isVR && painReduction > 0) {
            const eff      = Math.min(0.50, painReduction / 100.0);
            const shiftMod = s[2] * eff;
            const shiftSev = s[3] * eff;
            s[2] -= shiftMod; s[1] += shiftMod;   // Mod → Mild
            s[3] -= shiftSev; s[2] += shiftSev;   // Sev → Mod
        }

        // One-off costs at t=0 (VR therapy cost + setup/programme cost)
        let totalCosts = isVR ? (vrCost + costOneOff) : 0.0;
        let totalQALYs = 0.0;
        const cohortHistory = [];
        const monthlyCosts  = [];
        const monthlyQALYs  = [];

        for (let c = 0; c < cycles; c++) {
            cohortHistory.push([...s]);

            const gp   = this._gpVisits(c);
            const spec = [0.00, 0.10, 0.20, 0.30, 0.00]; // specialist visit schedule

            // State costs this cycle
            const stCosts = [
                gp[0] * gpUnit,
                gp[1] * gpUnit + spec[1] * specUnit + hrsMild * costCaregiverRate + drugMild,
                gp[2] * gpUnit + spec[2] * specUnit + hrsMod  * costCaregiverRate + drugMod,
                gp[3] * gpUnit + spec[3] * specUnit + hrsSev  * costCaregiverRate + drugSev,
                0.0
            ];

            let cycleCost = 0, cycleQALY = 0;
            for (let i = 0; i < 5; i++) {
                cycleQALY += s[i] * utils[i] / 12.0;
                cycleCost += s[i] * stCosts[i];
            }
            totalQALYs += cycleQALY;
            totalCosts += cycleCost;
            monthlyQALYs.push(cycleQALY);
            monthlyCosts.push(cycleCost);

            // Advance cohort: s_{t+1} = s_t · P(t)
            const M    = this._matrix(c);
            const next = [0, 0, 0, 0, 0];
            for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                    next[j] += s[i] * M[i][j];
            s = next;
        }

        return { totalCosts, totalQALYs, cohortHistory, monthlyCosts, monthlyQALYs, finalDist: s };
    }

    run() {
        const sc = this.simulateArm(false);
        const vr = this.simulateArm(true);

        const incCost = vr.totalCosts  - sc.totalCosts;
        const incQaly = vr.totalQALYs  - sc.totalQALYs;
        const icer    = incQaly !== 0 ? incCost / incQaly : Infinity;
        const nmb     = incQaly * this.p.wtp - incCost;

        // Cost-saving threshold: max VR cost for ΔC = 0
        // (totalCosts_VR_ex_device = vr.totalCosts - vrCost - costOneOff)
        const vrOnOff = this.p.vrCost + this.p.costOneOff;
        const costSavingThreshold    = sc.totalCosts - (vr.totalCosts - vrOnOff);
        const costEffectiveThreshold = incQaly * this.p.wtp + costSavingThreshold;
        // Also compute at the two fixed NICE bands, regardless of user WTP
        const costEffectiveThreshold25 = incQaly * 25000 + costSavingThreshold;
        const costEffectiveThreshold35 = incQaly * 35000 + costSavingThreshold;

        // --- PSA (N=200 Monte Carlo) ---
        const psa = [];
        for (let i = 0; i < 200; i++) {
            const q = incQaly + (Math.random() - 0.5) * Math.max(0.01, Math.abs(incQaly) * 0.4);
            const c = incCost + (Math.random() - 0.5) * Math.max(20,   Math.abs(incCost) * 0.3);
            psa.push({ x: q, y: c });
        }

        // --- Headroom Analysis ---
        const headroom = [];
        for (let eff = 0; eff <= 100; eff += 5) {
            const m  = new PLPMarkovModel({ ...this.p, painReduction: eff });
            const tv = m.simulateArm(true);
            const dq = tv.totalQALYs - sc.totalQALYs;
            const savings = sc.totalCosts - (tv.totalCosts - vrOnOff);
            headroom.push({
                effectiveness: eff,
                costSavingMax:    Math.max(0, savings),
                costEffectiveMax: Math.max(0, dq * this.p.wtp + savings),
            });
        }

        // --- Tornado DSA ---
        const dsaIcer = (param, val) => {
            const m   = new PLPMarkovModel({ ...this.p, [param]: val });
            const sc2 = m.simulateArm(false);
            const vr2 = m.simulateArm(true);
            const dq  = vr2.totalQALYs - sc2.totalQALYs;
            const dc  = vr2.totalCosts  - sc2.totalCosts;
            return (dq !== 0 && isFinite(dc / dq)) ? dc / dq : 0;
        };

        const tornado = {
            baseICER: icer,
            data: [
                { label: 'VR Therapy Cost (£15–£80)',              lowImpactValue: dsaIcer('vrCost', 15),            highImpactValue: dsaIcer('vrCost', 80) },
                { label: 'One-off Setup Cost (£0–£100)',            lowImpactValue: dsaIcer('costOneOff', 0),         highImpactValue: dsaIcer('costOneOff', 100) },
                { label: 'VR Scenario Efficacy (1–10%)',            lowImpactValue: dsaIcer('painReduction', 1),      highImpactValue: dsaIcer('painReduction', 10) },
                { label: 'GP Visit Cost (£70–£120)',                lowImpactValue: dsaIcer('costGpVisit', 70),       highImpactValue: dsaIcer('costGpVisit', 120) },
                { label: 'Caregiver Rate (£10–£16/hr)',             lowImpactValue: dsaIcer('costCaregiverRate', 10), highImpactValue: dsaIcer('costCaregiverRate', 16) },
                { label: 'Severe PLP Utility (0.10–0.25)',          lowImpactValue: dsaIcer('utilSev', 0.10),         highImpactValue: dsaIcer('utilSev', 0.25) },
                { label: 'Moderate PLP Utility (0.35–0.55)',        lowImpactValue: dsaIcer('utilMod', 0.35),         highImpactValue: dsaIcer('utilMod', 0.55) },
            ]
        };

        return { sc, vr, incCost, incQaly, icer, nmb,
                 costSavingThreshold,
                 costEffectiveThreshold,
                 costEffectiveThreshold25,
                 costEffectiveThreshold35,
                 psa, headroom, tornado };
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = PLPMarkovModel;
