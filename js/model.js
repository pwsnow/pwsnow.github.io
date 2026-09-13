/**
 * PLPMarkovModel – UCLTouchRehab VR Therapy for Upper-Limb Phantom Limb Pain
 * 1-Year monthly Markov cohort, 5 health states:
 *   0 = Pain Free, 1 = Mild PLP, 2 = Moderate PLP, 3 = Severe PLP, 4 = Death
 *
 * Transition matrices sourced directly from the user-provided parameter table.
 * Optionally uses CTMC-derived monthly matrix (via ctmc.js) for Month 2+.
 * Death probability 0.0005/month is subtracted from each living-state diagonal.
 *
 * P[Sev→Sev] = 0.9707/month — evidence-calibrated:
 *   Nikolajsen & Jensen (2001, Pain); Wettstein et al. (2021, Pain).
 *   30% of Severe PLP patients improve at 12 months → P(stay)=0.70 → 0.70^(1/12)=0.9707.
 *   PSA: Beta(α=29.69, β=0.90), 95% CI [0.890, 0.9995].
 */

/** Canonical evidence-calibrated P[Sev→Sev] monthly retention (August 2026) */
const P_SEV_SEV_CALIBRATED = 0.970714;  // 0.70^(1/12); replaces prior assumption of 0.9995
const P_SEV_MOD_CALIBRATED = 0.028786;  // = 1 - 0.970714 - 0.0005 (death)

/**
 * Default Month 1 transition matrix (from UCLTouchRehab feasibility study n=12).
 * Rows: [PF, Mild, Mod, Sev, Death]; Cols: [PF, Mild, Mod, Sev, Death].
 * These are the DEFAULTS — the Table 1 HTML inputs override them when present.
 */
const DEFAULT_T1 = [
    [1.0000, 0.0000, 0.0000, 0.0000, 0.0005],
    [0.0000, 1.0000, 0.0000, 0.0000, 0.0005],
    [0.1667, 0.3333, 0.5000, 0.0000, 0.0005],
    [0.4000, 0.2000, 0.4000, 0.0000, 0.0005],
    [0.0000, 0.0000, 0.0000, 0.0000, 1.0000],
];

/**
 * Default Month 2+ (chronic steady-state) transition matrix.
 * Evidence-calibrated P[Sev→Sev] = 0.9707 (Nikolajsen & Jensen 2001; Wettstein et al. 2021).
 */
const DEFAULT_T2 = [
    [0.8892, 0.1108, 0.0000, 0.0000, 0.0005],
    [0.0000, 0.9200, 0.0800, 0.0000, 0.0005],
    [0.0000, 0.0626, 0.8748, 0.0626, 0.0005],
    [0.0000, 0.0000, P_SEV_MOD_CALIBRATED, P_SEV_SEV_CALIBRATED, 0.0005],
    [0.0000, 0.0000, 0.0000, 0.0000, 1.0000],
];

class PLPMarkovModel {
    constructor(params = {}) {
        this.p = this._defaults(params);
        // Pre-compute CTMC matrix if enabled
        if (this.p.useCTMC) this._computeCTMC();
    }

    _defaults(p) {
        return {
            // --- Model controls ---
            wtp:           p.wtp           !== undefined ? p.wtp           : 25000,
            vrCost:        p.vrCost        !== undefined ? p.vrCost        : 40.55,   // recurring session cost £/patient (Table 1 mc0)
            costOneOff:    p.costOneOff    !== undefined ? p.costOneOff    : 0.00,
            painReduction: p.painReduction !== undefined ? p.painReduction : 50,      // % efficacy — calibrated from feasibility study
            cohortSize:    p.cohortSize    !== undefined ? p.cohortSize    : 8231,
            cycles:        p.cycles        !== undefined ? p.cycles        : 12,
            discountRate:  p.discountRate  !== undefined ? p.discountRate  : 0.035,

            // --- CTMC toggle ---
            useCTMC:        p.useCTMC       !== undefined ? p.useCTMC       : false,
            ctmcObsPeriod:  p.ctmcObsPeriod !== undefined ? p.ctmcObsPeriod : 3.45,

            // --- Utilities (Table 1 §6) ---
            utilPf:   p.utilPf   !== undefined ? p.utilPf   : 0.80,
            utilMild: p.utilMild !== undefined ? p.utilMild : 0.67,
            utilMod:  p.utilMod  !== undefined ? p.utilMod  : 0.46,
            utilSev:  p.utilSev  !== undefined ? p.utilSev  : 0.16,

            // --- Medical costs £/day (Table 1 §4) ---
            costGabapentin:    p.costGabapentin    !== undefined ? p.costGabapentin    : 1.60,
            costPregabalin:    p.costPregabalin    !== undefined ? p.costPregabalin    : 0.08,
            costAmitriptyline: p.costAmitriptyline !== undefined ? p.costAmitriptyline : 0.55,
            costDuloxetine:    p.costDuloxetine    !== undefined ? p.costDuloxetine    : 3.30,
            costGpVisit:       p.costGpVisit       !== undefined ? p.costGpVisit       : 102.00,
            costSpecialist:    p.costSpecialist    !== undefined ? p.costSpecialist    : 139.00,

            // --- Non-medical costs (Table 1 §5) ---
            travelCostKm:      p.travelCostKm      !== undefined ? p.travelCostKm      : 0.35,
            travelDistanceKm:  p.travelDistanceKm  !== undefined ? p.travelDistanceKm  : 4.8,
            parkingCost:       p.parkingCost        !== undefined ? p.parkingCost       : 3.50,
            costCaregiverRate: p.costCaregiverRate !== undefined ? p.costCaregiverRate : 25.05,  // DHSC MSIF 2025-26

            // --- Daily caregiver durations (hrs/day, Table 1 §5) ---
            durMild:  p.durMild  !== undefined ? p.durMild  : 0.0,
            durMod:   p.durMod   !== undefined ? p.durMod   : 1.0,
            durSev:   p.durSev   !== undefined ? p.durSev   : 2.0,
            durConst: p.durConst !== undefined ? p.durConst : 24.0,

            // --- Transition matrices from Table 1 (§1) ---
            // If getInputs() supplies tMatrix1..4, those override the hardcoded defaults.
            // Each is a 5×5 row-stochastic matrix: [PF, Mild, Mod, Sev, Death]
            tMatrix1: p.tMatrix1 !== undefined ? p.tMatrix1 : null,  // Month 1
            tMatrix2: p.tMatrix2 !== undefined ? p.tMatrix2 : null,  // Month 2
            tMatrix3: p.tMatrix3 !== undefined ? p.tMatrix3 : null,  // Month 3
            tMatrix4: p.tMatrix4 !== undefined ? p.tMatrix4 : (p.tMatrix2 !== undefined ? p.tMatrix2 : null),  // Month 4+

            // --- GP visit schedule from Table 1 (§2) ---
            // Arrays of 5 values [PF, Mild, Mod, Sev, Death] for each time band
            gpM1:     p.gpM1     !== undefined ? p.gpM1     : null,  // Month 1 GP visits/patient/month
            gpM2:     p.gpM2     !== undefined ? p.gpM2     : (p.gpM23 !== undefined ? p.gpM23 : null),  // Month 2
            gpM3:     p.gpM3     !== undefined ? p.gpM3     : (p.gpM23 !== undefined ? p.gpM23 : null),  // Month 3
            gpM4plus: p.gpM4plus !== undefined ? p.gpM4plus : null,  // Month 4+
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
            [0.0000,     0.0000,  P_SEV_MOD_CALIBRATED, P_SEV_SEV_CALIBRATED - d,  d],  // Sev row: calibrated 0.9707
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
        const d = 0.0005;  // background monthly mortality

        if (cycle === 0) {
            // ---- Month 1: use Table 1 inputs if supplied, else default ----
            if (this.p.tMatrix1) {
                // tMatrix1 is already built with death column embedded by getInputs()
                return this.p.tMatrix1;
            }
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

        // ---- Month 2–12: use Table 1 inputs if supplied, else default ----
        if (cycle === 1 && this.p.tMatrix2) return this.p.tMatrix2;
        if (cycle === 2 && this.p.tMatrix3) return this.p.tMatrix3;
        if (cycle >= 3 && this.p.tMatrix4) return this.p.tMatrix4;
        if (this.p.tMatrix2) return this.p.tMatrix2;

        return [
         // PF           Mild       Mod             Sev       Death
          [0.8892-d,     0.1108,    0.0000,         0.0000,   d],  // Pain Free
          [0.0000,       0.9200-d,  0.0800,         0.0000,   d],  // Mild PLP
          [0.0000,       0.0626,    0.8748-d,       0.0626,   d],  // Moderate PLP
          [0.0000,       0.0000,    0.0288,         0.9707-d, d],  // Severe PLP
          [0.0000,       0.0000,    0.0000,         0.0000,   1.0000], // Death
        ];
    }

    /** GP visits per patient per month by health state.
     * Reads from Table 1 inputs if supplied via this.p.gpM1 / gpM2 / gpM3 / gpM4plus.
     * Falls back to evidence-informed modelling assumptions if not supplied.
     */
    _gpVisits(cycle) {
        if (cycle === 0) return this.p.gpM1 || [0.00, 0.50, 1.00, 1.00, 0.00];
        if (cycle === 1) return this.p.gpM2 || this.p.gpM23 || [0.00, 0.25, 0.50, 0.50, 0.00];
        if (cycle === 2) return this.p.gpM3 || this.p.gpM23 || [0.00, 0.25, 0.50, 0.50, 0.00];
        return                 this.p.gpM4plus || [0.00, 0.00, 0.111, 0.222, 0.00];
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
                durMild, durMod, durSev, cycles, discountRate } = this.p;

        // NICE PMG36: monthly discount factor v_t = (1+r)^(-t/12)
        // One-off costs at t=0 are NOT discounted (v_0 = 1) per convention.
        const monthlyDiscFactor = Math.pow(1 + discountRate, 1 / 12) - 1;

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

        // VR efficacy: applied as a relative improvement in monthly transition probabilities.
        // At efficacy eff (0–1), the VR arm uses a blended matrix each cycle:
        //   P_vr(c) = (1-eff)*P_uc(c) + eff*P_ideal(c)
        // P_ideal = "best case" matrix where each state improves one level per month.
        // This follows NICE DSU TSD 2 / Drummond et al. (2015) treatment-effect parameterisation.
        // No baseline distribution shift — efficacy acts through ongoing transition dynamics.
        const vrEff = isVR ? Math.min(1.0, Math.max(0, painReduction / 100.0)) : 0;

        // One-off costs at t=0 (VR therapy cost + setup/programme cost)
        let totalCosts = isVR ? (vrCost + costOneOff) : 0.0;
        let totalQALYs = 0.0;
        const cohortHistory = [];
        const monthlyCosts  = [];
        const monthlyQALYs  = [];

        for (let c = 0; c < cycles; c++) {
            cohortHistory.push([...s]);

            // Build cycle matrix: UC base blended with ideal-recovery matrix by vrEff
            const d = 0.0005;  // background monthly mortality
            const Puc = this._matrix(c);
            let P;
            if (vrEff > 0) {
                // Ideal-recovery matrix: each living state improves one severity level
                // PF→PF, Mild→PF, Mod→Mild, Sev→Mod, Death→Death (minus mortality)
                const Pideal = [
                    [1-d,  0,    0,    0,    d],  // PF stays PF
                    [1-d,  0,    0,    0,    d],  // Mild → PF
                    [0,    1-d,  0,    0,    d],  // Mod → Mild
                    [0,    0,    1-d,  0,    d],  // Sev → Mod
                    [0,    0,    0,    0,    1],  // Death absorbing
                ];
                // Linear blend: P = (1-eff)*P_UC + eff*P_ideal (row-stochastic by construction)
                P = Puc.map((row, i) => row.map((v, j) => (1 - vrEff) * v + vrEff * Pideal[i][j]));
            } else {
                P = Puc;
            }

            // Advance cohort: s_{t+1} = s_t · P
            const sNew = [0, 0, 0, 0, 0];
            for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                    sNew[j] += s[i] * P[i][j];
            s = sNew;
            cohortHistory[cohortHistory.length - 1] = [...sNew]; // overwrite with post-transition state

            const gp   = this._gpVisits(c);
            const spec = [0.00, 0.10, 0.20, 0.30, 0.00]; // specialist visit schedule

            // State costs this cycle — NHS+PSS perspective (NICE PMG36 reference case).
            // Informal caregiver costs are EXCLUDED here; they are a SOCIETAL cost only
            // and are quantified separately in the Societal Impact tab (updateSocietalTab).
            // Including them here would inflate NHS costs by ~94% and is methodologically incorrect
            // for a NICE Technology Appraisal submission.
            //
            // NHS COSTS INCLUDED HERE:
            // 1. GP visits + specialist contacts (PSSRU 2024 unit costs)
            // 2. Pharmacotherapy (BNF 2025 drug costs × days/month)
            // 3. Patient travel (£0.35/km return + parking £3.50 per visit)
            // 4. Mental health comorbidity treatment (NICE NG222 Depression in Adults 2022;
            //    NHS Talking Therapies commissioning guidance 2024/25):
            //    - Moderate PLP: 20% depression prevalence × NICE NG222 stepped care costs
            //      (£900 high-intensity CBT course per PSSRU 2024 + NHS TT 2024/25) ÷ 12 = £15/month
            //    - Severe PLP: 40% depression/anxiety × £1,200 treatment ÷ 12 = £40/month
            //    (Source: NICE NG222 2022; NHS Talking Therapies 2024/25; PSSRU 2024)
            // 5. A&E emergency presentations (NHS National Cost Collection 2022/23;
            //    NHS England, published 27 Nov 2024):
            //    - Severe PLP: 1.5 ED visits/year × £282 Type 1 A&E average unit cost = £35/month
            //    - Moderate PLP: 0.5 ED visits/year × £282 = £12/month
            //    (Source: NHS England National Cost Collection 2022/23;
            //     visit rates from Chronic Pain Coalition 2022 report)
            const mhCostMod  = (0.20 * 900 + 0.15 * 800) / 12;    // £23/month mental health (Moderate)
            const mhCostSev  = (0.40 * 900 + 0.30 * 1200) / 12;   // £60/month mental health (Severe)
            const aeCostMod  = (0.5 * 282) / 12;                   // £12/month A&E (Moderate)
            const aeCostSev  = (1.5 * 282) / 12;                   // £35/month A&E (Severe)
            const stCosts = [
                gp[0] * gpUnit,
                gp[1] * gpUnit + spec[1] * specUnit + drugMild,   // NHS drugs + contacts only
                gp[2] * gpUnit + spec[2] * specUnit + drugMod  + mhCostMod + aeCostMod,  // + mental health + A&E
                gp[3] * gpUnit + spec[3] * specUnit + drugSev  + mhCostSev + aeCostSev,  // + mental health + A&E
                0.0
            ];

            let cycleCost = 0, cycleQALY = 0;
            for (let i = 0; i < 5; i++) {
                cycleQALY += s[i] * utils[i] / 12.0;
                cycleCost += s[i] * stCosts[i];
            }
            // NICE PMG36 discounting: v_{c+1} = 1 / (1 + monthly_rate)^(c+1)
            // Month index c=0 → t=1 (first cycle after t=0 one-offs)
            const vt = 1 / Math.pow(1 + monthlyDiscFactor, c + 1);
            totalQALYs += cycleQALY * vt;
            totalCosts += cycleCost  * vt;
            monthlyQALYs.push(cycleQALY * vt);
            monthlyCosts.push(cycleCost  * vt);

            // (cohort advance is done at cycle start using blended VR/UC matrix P — see above)
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

        // --- PSA: Parametric Monte Carlo (N=1,000 for real-time recalculate) ---
        // Each iteration samples: Utilities→Beta, Costs→Gamma, Efficacy→trunc-Normal
        // Runs full Markov model per sample for genuine uncertainty propagation.
        const psa = [];
        const psaN = 1000;

        // Beta sampler: moment-match mean μ and variance σ²=μ(1-μ)/precision
        const sampleBeta = (mu, cv = 0.20) => {
            const sig2 = Math.pow(mu * cv, 2);
            // Clamp so α,β > 1
            const prec = Math.max(mu * (1 - mu) / sig2 - 1, 2);
            const alpha = mu * prec, beta_ = (1 - mu) * prec;
            // Beta via Johnk's method (simple, works for α,β > 1)
            for (let attempt = 0; attempt < 50; attempt++) {
                const u = Math.random(), v = Math.random();
                const x = Math.pow(u, 1 / alpha), y = Math.pow(v, 1 / beta_);
                if (x + y <= 1) return Math.max(0.01, Math.min(0.999, x / (x + y)));
            }
            return mu; // fallback
        };

        // Gamma sampler via Marsaglia-Tsang
        const sampleGamma = (mean, cv = 0.20) => {
            const k = 1 / (cv * cv);  // shape = 1/CV²
            const theta = mean / k;    // scale
            if (k < 1) {
                // Use Ahrens-Dieter for k<1
                const u = Math.random();
                return sampleGamma(mean * (1 + 1/k), cv) * Math.pow(u, 1/k);
            }
            const d = k - 1/3, c2 = 1 / Math.sqrt(9 * d);
            for (let attempt = 0; attempt < 200; attempt++) {
                let x, v;
                do { x = (Math.random() + Math.random() + Math.random() +
                           Math.random() + Math.random() + Math.random() - 3) / Math.sqrt(3);
                     v = Math.pow(1 + c2 * x, 3);
                } while (v <= 0);
                const u = Math.random();
                if (u < 1 - 0.0331 * Math.pow(x, 4)) return Math.max(1e-6, d * v * theta);
                if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return Math.max(1e-6, d * v * theta);
            }
            return mean;
        };

        // Normal sample (Box-Muller)
        const sampleNorm = (mu, sigma) => {
            const u1 = Math.random(), u2 = Math.random();
            return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        };

        for (let i = 0; i < psaN; i++) {
            const pUtil   = sampleBeta(this.p.utilPf   || 0.80);
            const pMild   = sampleBeta(this.p.utilMild  || 0.67);
            const pMod    = sampleBeta(this.p.utilMod   || 0.46);
            const pSev    = sampleBeta(this.p.utilSev   || 0.16);
            const pCgRate = sampleGamma(Math.max(0.01, this.p.costCaregiverRate || 25.05));
            const pGpCost = sampleGamma(Math.max(0.01, this.p.costGpVisit       || 102.00));
            const pVrCost = sampleGamma(Math.max(0.01, this.p.vrCost            || 40.55));
            const rawEff  = sampleNorm(this.p.painReduction || 50, (this.p.painReduction || 50) * 0.20);
            const pEff    = Math.max(0, Math.min(100, rawEff));

            const pm = new PLPMarkovModel({
                ...this.p,
                utilPf: pUtil, utilMild: pMild, utilMod: pMod, utilSev: pSev,
                costCaregiverRate: pCgRate, costGpVisit: pGpCost,
                vrCost: pVrCost, painReduction: pEff
            });
            const sc2 = pm.simulateArm(false);
            const vr2 = pm.simulateArm(true);
            const q   = vr2.totalQALYs - sc2.totalQALYs;
            const c   = (vr2.totalCosts - sc2.totalCosts);
            if (isFinite(q) && isFinite(c)) psa.push({ x: q, y: c });
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

        // --- Tornado DSA: Univariate ±20% one-way sensitivity analysis ---
        // Each parameter varied independently ±20% of base-case; all others held constant.
        const dsaIcer = (param, val) => {
            const m   = new PLPMarkovModel({ ...this.p, [param]: val });
            const sc2 = m.simulateArm(false);
            const vr2 = m.simulateArm(true);
            const dq  = vr2.totalQALYs - sc2.totalQALYs;
            const dc  = vr2.totalCosts  - sc2.totalCosts;
            return (dq !== 0 && isFinite(dc / dq)) ? dc / dq : 0;
        };

        // Base values and ±20% ranges
        const p = this.p;
        const tornado = {
            baseICER: icer,
            method:   'One-way sensitivity analysis (±20% base-case value, univariate)',
            data: [
                {
                    label:          `Mild PLP Utility (${(p.utilMild*0.8).toFixed(3)}–${(p.utilMild*1.2).toFixed(3)})`,
                    baseValue:      p.utilMild,
                    lowImpactValue: dsaIcer('utilMild',  p.utilMild  * 0.8),
                    highImpactValue:dsaIcer('utilMild',  p.utilMild  * 1.2),
                },
                {
                    label:          `Caregiver Rate £${(p.costCaregiverRate*0.8).toFixed(2)}–£${(p.costCaregiverRate*1.2).toFixed(2)}/hr`,
                    baseValue:      p.costCaregiverRate,
                    lowImpactValue: dsaIcer('costCaregiverRate', p.costCaregiverRate * 0.8),
                    highImpactValue:dsaIcer('costCaregiverRate', p.costCaregiverRate * 1.2),
                },
                {
                    label:          `Severe PLP Utility (${(p.utilSev*0.8).toFixed(3)}–${(p.utilSev*1.2).toFixed(3)})`,
                    baseValue:      p.utilSev,
                    lowImpactValue: dsaIcer('utilSev',   p.utilSev   * 0.8),
                    highImpactValue:dsaIcer('utilSev',   p.utilSev   * 1.2),
                },
                {
                    label:          `Moderate PLP Utility (${(p.utilMod*0.8).toFixed(3)}–${(p.utilMod*1.2).toFixed(3)})`,
                    baseValue:      p.utilMod,
                    lowImpactValue: dsaIcer('utilMod',   p.utilMod   * 0.8),
                    highImpactValue:dsaIcer('utilMod',   p.utilMod   * 1.2),
                },
                {
                    label:          `Pain-Free Utility (${(p.utilPf*0.8).toFixed(3)}–${Math.min(p.utilPf*1.2,0.99).toFixed(3)})`,
                    baseValue:      p.utilPf,
                    lowImpactValue: dsaIcer('utilPf',    p.utilPf    * 0.8),
                    highImpactValue:dsaIcer('utilPf',    Math.min(p.utilPf * 1.2, 0.99)),
                },
                {
                    label:          `GP Visit Cost £${(p.costGpVisit*0.8).toFixed(0)}–£${(p.costGpVisit*1.2).toFixed(0)}`,
                    baseValue:      p.costGpVisit,
                    lowImpactValue: dsaIcer('costGpVisit', p.costGpVisit * 0.8),
                    highImpactValue:dsaIcer('costGpVisit', p.costGpVisit * 1.2),
                },
                {
                    label:          `VR Efficacy ${(p.painReduction*0.8).toFixed(0)}–${(p.painReduction*1.2).toFixed(0)}%`,
                    baseValue:      p.painReduction,
                    lowImpactValue: dsaIcer('painReduction', p.painReduction * 0.8),
                    highImpactValue:dsaIcer('painReduction', Math.min(p.painReduction * 1.2, 60)),
                },
                {
                    label:          `VR Therapy Cost £${(p.vrCost*0.8).toFixed(2)}–£${(p.vrCost*1.2).toFixed(2)}`,
                    baseValue:      p.vrCost,
                    lowImpactValue: dsaIcer('vrCost',    p.vrCost    * 0.8),
                    highImpactValue:dsaIcer('vrCost',    p.vrCost    * 1.2),
                },
            ]
        };

        return { sc, vr, incCost, incQaly, icer, nmb,
                 costSavingThreshold,
                 costEffectiveThreshold,
                 costEffectiveThreshold25,
                 costEffectiveThreshold35,
                 psa, headroom, tornado };
    }

    /**
     * runDeterministic() — lightweight version of run() with no PSA/DSA loops.
     * Returns only the core incremental values: incCost, incQaly, icer, nmb.
     * Used by the CE-plane efficacy sweep to avoid 101 × 10,000 model evaluations.
     */
    runDeterministic() {
        const sc = this.simulateArm(false);
        const vr = this.simulateArm(true);
        const incCost = vr.totalCosts - sc.totalCosts;
        const incQaly = vr.totalQALYs - sc.totalQALYs;
        const icer    = incQaly !== 0 ? incCost / incQaly : Infinity;
        const nmb     = incQaly * this.p.wtp - incCost;
        const vrOnOff = this.p.vrCost + this.p.costOneOff;
        const costSavingThreshold = sc.totalCosts - (vr.totalCosts - vrOnOff);
        return { sc, vr, incCost, incQaly, icer, nmb, costSavingThreshold };
    }
}

/**
 * PLPMarkovModel.runYears(years, discountRate)
 * ─────────────────────────────────────────────
 * Extends the standard 12-cycle model to an arbitrary multi-year horizon.
 * Uses the same monthly cycle structure; after month 12 the GP visit schedule
 * remains at the "months 4-12" stable pattern.
 * 3.5% annual NICE discount rate applied monthly to costs AND QALYs.
 *
 * @param  {number} years        - Time horizon in years (e.g. 5, 10, 15, 25)
 * @param  {number} discountRate - Annual rate (default 0.035 per NICE reference case)
 * @returns {object} Incremental results + yearly traces for chart rendering
 */
PLPMarkovModel.prototype.runYears = function(years, discountRate = 0.035) {
    const nCycles = years * 12;   // monthly cycles
    const monthlyDisc = Math.pow(1 + discountRate, 1/12) - 1; // monthly equivalent

    const p = this.p;

    // Pull all cost/utility parameters
    const { vrCost, costOneOff, painReduction,
            utilPf, utilMild, utilMod, utilSev,
            costGpVisit, costSpecialist,
            costGabapentin, costPregabalin, costAmitriptyline, costDuloxetine,
            travelCostKm, travelDistanceKm, parkingCost, costCaregiverRate,
            durMild, durMod, durSev } = p;

    const utils = [utilPf, utilMild, utilMod, utilSev, 0];
    const tPV   = (travelDistanceKm * 2 * travelCostKm) + parkingCost;
    const gpU   = costGpVisit   + tPV;
    const spU   = costSpecialist + tPV;
    const hMl   = durMild * 30.4375;
    const hMo   = durMod  * 30.4375;
    const hSv   = durSev  * 30.4375;
    const dMl   = costGabapentin  * 30.4375;
    const dMo   = costPregabalin  * 30.4375;
    const dSv   = (costAmitriptyline + costDuloxetine) * 30.4375;
    const spec  = [0, 0.10, 0.20, 0.30, 0];

    // GP visit schedule: cycle 0 → acute month 1; cycles 1-2 → early; cycles ≥3 → stable
    const gpVis = (c) => {
        if (c === 0)         return [0, 0.50, 1.00, 1.00, 0];
        if (c <= 2)          return [0, 0.25, 0.50, 0.50, 0];
        return                      [0, 0.00, 0.111, 0.222, 0];
    };

    const _M = (c) => {
        const d = 0.0005;
        if (c === 0) return [
            [1-d,0,0,0,d],[0,1-d,0,0,d],[0.1667,0.3333,0.5-d,0,d],[0.4,0.2,0.4-d,0,d],[0,0,0,0,1]
        ];
        // Month 2+ stable matrix (CTMC not used here for simplicity)
        return [
            [0.8892-d,0.1108,0,0,d],[0,0.92-d,0.08,0,d],
            [0,0.0626,0.8748-d,0.0626,d],[0,0,0,1-d,d],[0,0,0,0,1]
        ];
    };

    const _simArm = (isVR) => {
        let s = [0, 0, 0.60, 0.40, 0];
        const vrEff = isVR ? Math.min(1.0, Math.max(0, painReduction / 100)) : 0;
        if (false) {  // (old baseline-shift disabled — now uses matrix blending below)
            const eff = vrEff;
            const sm = s[2]*eff, sv = s[3]*eff;
            s[2] -= sm; s[1] += sm;
            s[3] -= sv; s[2] += sv;
        }
        let totC = isVR ? (vrCost + costOneOff) : 0;
        let totQ = 0;
        const annCosts = [], annQALYs = [], annDist = [];
        let yrC = 0, yrQ = 0;

        for (let c = 0; c < nCycles; c++) {
            // ── Advance cohort FIRST (post-transition state, matching simulateArm) ──
            const Puc = _M(c);
            let P2;
            if (vrEff > 0) {
                const d2 = 0.0005;
                const Pideal2 = [
                    [1-d2,0,0,0,d2],[1-d2,0,0,0,d2],[0,1-d2,0,0,d2],[0,0,1-d2,0,d2],[0,0,0,0,1]
                ];
                P2 = Puc.map((row, i) => row.map((v, j) => (1-vrEff)*v + vrEff*Pideal2[i][j]));
            } else {
                P2 = Puc;
            }
            const nxt = [0,0,0,0,0];
            for (let i=0;i<5;i++) for (let j=0;j<5;j++) nxt[j]+=s[i]*P2[i][j];
            s = nxt;

            // ── Discount: c+1 so Month 1 (c=0) is discounted by 1 month (matches simulateArm) ──
            const disc = 1 / Math.pow(1 + monthlyDisc, c + 1);
            const gv   = gpVis(c);
            // Mental health comorbidity (NICE NG222 Depression in Adults 2022;
            //   NHS Talking Therapies commissioning guidance 2024/25)
            // A&E emergency presentations (NHS National Cost Collection 2022/23,
            //   published 27 Nov 2024 by NHS England)
            const mhMo2 = (0.20*900 + 0.15*800) / 12;  // £23/mo Moderate
            const mhSv2 = (0.40*900 + 0.30*1200) / 12; // £60/mo Severe
            const aeMo2 = (0.5*282) / 12;               // £12/mo Moderate
            const aeSv2 = (1.5*282) / 12;               // £35/mo Severe
            const stC  = [
                gv[0]*gpU,
                gv[1]*gpU + spec[1]*spU + dMl,
                gv[2]*gpU + spec[2]*spU + dMo + mhMo2 + aeMo2,
                gv[3]*gpU + spec[3]*spU + dSv + mhSv2 + aeSv2,
                0
            ];
            let cc = 0, cq = 0;
            for (let i = 0; i < 5; i++) {
                cq += s[i] * utils[i] / 12;
                cc += s[i] * stC[i];
            }
            totC += cc * disc;
            totQ += cq * disc;
            yrC  += cc * disc;
            yrQ  += cq * disc;

            // Yearly snapshots
            if ((c + 1) % 12 === 0) {
                annCosts.push(yrC);
                annQALYs.push(yrQ);
                annDist.push([...s]);
                yrC = 0; yrQ = 0;
            }

        }   // end for (let c = 0; c < nCycles; c++)

        return { totC, totQ, annCosts, annQALYs, annDist, finalDist: s };
    };


    const sc = _simArm(false);
    const vr = _simArm(true);

    const dC  = vr.totC - sc.totC;
    const dE  = vr.totQ - sc.totQ;
    const icer = dE !== 0 ? dC / dE : Infinity;
    const nmb  = dE * p.wtp - dC;

    const vrOO = vrCost + costOneOff;
    const cs   = sc.totC - (vr.totC - vrOO);
    const ce25 = dE * 25000 + cs;
    const ce35 = dE * 35000 + cs;

    // Cumulative cost/QALY traces per year
    const cumScC = [], cumVrC = [], cumScQ = [], cumVrQ = [];
    let cscC=0, cvrC=0, cscQ=0, cvrQ=0;
    for (let y=0; y<years; y++) {
        cscC += sc.annCosts[y] || 0; cumScC.push(cscC);
        cvrC += vr.annCosts[y] || 0; cumVrC.push(cvrC);
        cscQ += sc.annQALYs[y] || 0; cumScQ.push(cscQ);
        cvrQ += vr.annQALYs[y] || 0; cumVrQ.push(cvrQ);
    }

    return {
        years, dC, dE, icer, nmb, cs, ce25, ce35,
        scTotC: sc.totC, vrTotC: vr.totC,
        scTotQ: sc.totQ, vrTotQ: vr.totQ,
        scAnnCosts: sc.annCosts, vrAnnCosts: vr.annCosts,
        scAnnQALYs: sc.annQALYs, vrAnnQALYs: vr.annQALYs,
        scFinal: sc.finalDist, vrFinal: vr.finalDist,
        cumScC, cumVrC, cumScQ, cumVrQ,
        scAnnDist: sc.annDist, vrAnnDist: vr.annDist,
    };
};

if (typeof module !== 'undefined' && module.exports) module.exports = PLPMarkovModel;
