// model.js

/**
 * Health Economic Markov Model for Postoperative Pain Management
 * Simulates a 12-month cohort analysis.
 */

class MarkovModel {
    constructor(params) {
        this.baseParams = { ...params };
        this.wtp = params.wtp || 20000;
        this.vrCost = params.vrCost !== undefined ? params.vrCost : 40.55; 
        this.opioidReduction = (params.opioidReduction !== undefined ? params.opioidReduction : 2.8) / 100;
        this.oneOffCost = params.oneOffCost || 0;
        this.sessionCost = params.sessionCost || 0;
        this.numSessions = params.numSessions || 1;
        this.cpspRiskBase = (params.cpspRisk !== undefined ? params.cpspRisk : 15) / 100; 
        this.currency = params.currency || 'GBP';
        
        // Utilities (baseline)
        this.utilPainFree = 1.0;
        this.utilNonOpioid = 0.93;
        this.utilOpioid = 0.61;
        this.utilCPSP = 0.59;

        // Base-case Costs (Euros, will be converted to GBP in cycle runs)
        this.costGP = 32.04;
        this.costSpecialist = 225.00;
        this.costChronicCare = 119.51; // Specialist visit in CPSP state
        this.costCaregiver = 19.51; // Caregiver cost per hour
        this.drugCostOpioidStable = 0.35;
        this.drugCostOpioidDecrease = 0.24;
        this.drugCostParacetamol = 0.03;

        // Transition Probabilities (baseline)
        this.transPfNonOp_m1 = 0.1176; this.transPfNonOp_m2 = 0.0000; this.transPfNonOp_m3 = 0.0000; this.transPfNonOp_m4_12 = 0.0000;
        this.transNonOpPF_m1 = 0.0000; this.transNonOpPF_m2 = 1.0000; this.transNonOpPF_m3 = 0.7297; this.transNonOpPF_m4_12 = 0.0000;
        this.transNonOpOp_m1 = 0.1299; this.transNonOpOp_m2 = 0.0000; this.transNonOpOp_m3 = 0.0000; this.transNonOpOp_m4_12 = 0.0000;
        this.transOpioidPF_m1 = 0.0000; this.transOpioidPF_m2 = 0.4841; this.transOpioidPF_m3 = 0.0000; this.transOpioidPF_m4_12 = 0.0000;
        this.transOpioidNonOp_m1 = 0.0000; this.transOpioidNonOp_m2 = 0.2937; this.transOpioidNonOp_m3 = 0.4643; this.transOpioidNonOp_m4_12 = 0.0000;
        this.transNonOpCpsp_m1 = 0.0000; this.transNonOpCpsp_m2 = 0.0000; this.transNonOpCpsp_m3 = 0.0000; this.transNonOpCpsp_m4_12 = 1.0000;
        this.transOpioidCpsp_m1 = 0.0000; this.transOpioidCpsp_m2 = 0.0000; this.transOpioidCpsp_m3 = 0.0000; this.transOpioidCpsp_m4_12 = 1.0000;
        this.transCpspPF_m1 = 0.0000; this.transCpspPF_m2 = 0.0000; this.transCpspPF_m3 = 0.0000; this.transCpspPF_m4_12 = 0.0286;

        // Death Risks
        this.deathRisk_m1 = 0.0005;
        this.deathRisk_m2 = 0.0005;
        this.deathRisk_m3 = 0.0005;
        this.deathRisk_m4_12 = 0.0005;

        // General Physician Visits
        this.gpPF_m1 = 0.03; this.gpPF_m2 = 0.01; this.gpPF_m3 = 0.02; this.gpPF_m4_12 = 0.01;
        this.gpNonOp_m1 = 0.11; this.gpNonOp_m2 = 0.14; this.gpNonOp_m3 = 0.30; this.gpNonOp_m4_12 = 0.00;
        this.gpOp_m1 = 0.23; this.gpOp_m2 = 0.50; this.gpOp_m3 = 0.60; this.gpOp_m4_12 = 0.00;
        this.gpCpsp_m1 = 0.00; this.gpCpsp_m2 = 0.00; this.gpCpsp_m3 = 0.00; this.gpCpsp = 0.61;

        // Specialist Visits
        this.specNonOp_m1 = 0.10; this.specNonOp_m2 = 0.10; this.specNonOp_m3 = 0.10; this.specNonOp_m4_12 = 0.00;
        this.specOp_m1 = 0.20; this.specOp_m2 = 0.20; this.specOp_m3 = 0.20; this.specOp_m4_12 = 0.00;
        this.specCpsp_m1 = 0.00; this.specCpsp_m2 = 0.00; this.specCpsp_m3 = 0.00; this.specCpsp = 0.30;

        // Travel / Parking parameters
        this.travelCostKm = 0.26;
        this.travelDistance = 7.1;
        this.parkingCost = 3.92;

        this.informalCareCPSP = 20;
        this.informalCareOpioid = 20;
        this.informalCareNonOpioid = 8;

        this.popAge = 65;
        this.pctMale = 0.50;

        // Legacy compatibility variables
        this.costNonOpioid = 42.7;
        this.costOpioid = 128.1;
        this.costCPSP = 341.6;
        this.transOpioidPainFreeMult = 1.0;
        this.transNonOpioidPainFreeMult = 1.0;
        this.cycles = params.cycles || 12; 
    }

    getUtilities(p) {
        p = p || this;
        let uPF = p.utilPainFree !== undefined ? p.utilPainFree : this.utilPainFree;
        let uNonOp = p.utilNonOpioid !== undefined ? p.utilNonOpioid : this.utilNonOpioid;
        let uOp = p.utilOpioid !== undefined ? p.utilOpioid : this.utilOpioid;
        let uCpsp = p.utilCPSP !== undefined ? p.utilCPSP : this.utilCPSP;
        return [uPF / 12, uNonOp / 12, uOp / 12, uCpsp / 12, 0.0];
    }

    getCycleCosts(p) {
        p = p || this;
        let curr = p.currency || this.currency;
        let rate = curr === 'EUR' ? (1/0.854) : 1.0;
        
        let cNonOpioid = (p.costNonOpioid !== undefined ? p.costNonOpioid : this.costNonOpioid) * rate;
        let cOpioid = (p.costOpioid !== undefined ? p.costOpioid : this.costOpioid) * rate;
        let cCPSP = (p.costCPSP !== undefined ? p.costCPSP : this.costCPSP) * rate;

        return [0, cNonOpioid, cOpioid, cCPSP, 0];
    }

    getTransitionMatrix(cycle, p) {
        p = p || this;
        const multOpioidPF = p.transOpioidPainFreeMult !== undefined ? p.transOpioidPainFreeMult : this.transOpioidPainFreeMult;
        const multNonOpioidPF = p.transNonOpioidPainFreeMult !== undefined ? p.transNonOpioidPainFreeMult : this.transNonOpioidPainFreeMult;
        const cRisk = p.cpspRiskBase !== undefined ? p.cpspRiskBase : this.cpspRiskBase;
        
        const toDeath = 0.0005;

        // Month 1 (cycle 0)
        if (cycle === 0) {
            let pPF_NonOp = 0.1176;
            let pNonOp_Op = 0.1299;
            return [
                [1.0 - pPF_NonOp - toDeath, pPF_NonOp, 0.0, 0.0, toDeath], // PF
                [0.0, 1.0 - pNonOp_Op - toDeath, pNonOp_Op, 0.0, toDeath], // NonOp
                [0.0, 0.0, 1.0 - toDeath, 0.0, toDeath], // Opioid
                [0.0, 0.0, 0.0, 1.0 - toDeath, toDeath], // CPSP
                [0.0, 0.0, 0.0, 0.0, 1.0] // Death
            ];
        }
        // Month 2 (cycle 1)
        else if (cycle === 1) {
            let pNonOp_PF = 1.0000 * multNonOpioidPF;
            let pOp_PF = 0.4841 * multOpioidPF;
            let pOp_NonOp = 0.2937;
            
            pNonOp_PF = Math.min(0.9995, pNonOp_PF);
            let remNonOp = Math.max(0, 0.9995 - pNonOp_PF);
            
            pOp_PF = Math.min(0.9995, pOp_PF);
            pOp_NonOp = Math.min(0.9995 - pOp_PF, pOp_NonOp);
            let remOp = Math.max(0, 0.9995 - pOp_PF - pOp_NonOp);
            
            return [
                [0.9995, 0.0, 0.0, 0.0, toDeath], // PF
                [pNonOp_PF, remNonOp, 0.0, 0.0, toDeath], // NonOp
                [pOp_PF, pOp_NonOp, remOp, 0.0, toDeath], // Opioid
                [0.0, 0.0, 0.0, 0.9995, toDeath], // CPSP
                [0.0, 0.0, 0.0, 0.0, 1.0] // Death
            ];
        }
        // Month 3 (cycle 2)
        else if (cycle === 2) {
            let pNonOp_PF = 0.7297 * multNonOpioidPF;
            let pOp_NonOp = 0.4643;
            
            pNonOp_PF = Math.min(0.9995, pNonOp_PF);
            let remNonOp = Math.max(0, 0.9995 - pNonOp_PF);
            
            pOp_NonOp = Math.min(0.9995, pOp_NonOp);
            let remOp = Math.max(0, 0.9995 - pOp_NonOp);
            
            return [
                [0.9995, 0.0, 0.0, 0.0, toDeath], // PF
                [pNonOp_PF, remNonOp, 0.0, 0.0, toDeath], // NonOp
                [0.0, pOp_NonOp, remOp, 0.0, toDeath], // Opioid
                [0.0, 0.0, 0.0, 0.9995, toDeath], // CPSP
                [0.0, 0.0, 0.0, 0.0, 1.0] // Death
            ];
        }
        // Month 4-12 (cycle >= 3)
        else {
            let pCPSP_PF = 0.0286;
            // scale transition to CPSP by cRisk / 0.15503 to maintain slider functionality
            let pToCPSP = Math.min(0.9995, cRisk / 0.15503);
            return [
                [0.9995, 0.0, 0.0, 0.0, toDeath], // PF
                [0.0, 0.9995 - pToCPSP, 0.0, pToCPSP, toDeath], // NonOp -> CPSP
                [0.0, 0.0, 0.9995 - pToCPSP, pToCPSP, toDeath], // Opioid -> CPSP
                [pCPSP_PF, 0.0, 0.0, 0.9995 - pCPSP_PF, toDeath], // CPSP -> PF
                [0.0, 0.0, 0.0, 0.0, 1.0] // Death
            ];
        }
    }

        simulateArm(isVR, specificParams = null) {
        let p = specificParams || this;
        let opReduct = p.opioidReduction !== undefined ? p.opioidReduction : this.opioidReduction;
        let vCost = p.vrCost !== undefined ? p.vrCost : this.vrCost;
        let oneOff = p.oneOffCost !== undefined ? p.oneOffCost : this.oneOffCost;
        let sCost = p.sessionCost !== undefined ? p.sessionCost : this.sessionCost;
        let nSess = p.numSessions !== undefined ? p.numSessions : this.numSessions;

        let totalInterventionReduction = 0;
        let totalInterventionCost = 0;

        if (isVR) {
            totalInterventionReduction = opReduct;
            totalInterventionCost = vCost + oneOff + (sCost * nSess);
        }

        // 5 states: PF, Non-Opioid, Opioid, CPSP, Death
        let stateSizes = [0.0, 0.3, 0.7, 0.0, 0.0]; 

        if (totalInterventionReduction > 0) {
            let opioidReductionAbs = stateSizes[2] * totalInterventionReduction;
            stateSizes[2] -= opioidReductionAbs; 
            stateSizes[1] += opioidReductionAbs; 
        }

        let totalCosts = totalInterventionCost;
        let totalQALYs = 0;

        const utilities = this.getUtilities(p);
        
        let cGP = p.costGP !== undefined ? p.costGP : this.costGP;
        let cSpec = p.costSpecialist !== undefined ? p.costSpecialist : this.costSpecialist;
        let cSpecCpsp = p.costChronicCare !== undefined ? p.costChronicCare : (this.costChronicCare || 119.51);
        let cCare = p.costCaregiver !== undefined ? p.costCaregiver : this.costCaregiver;
        
        let infNonOp = p.informalCareNonOpioid !== undefined ? p.informalCareNonOpioid : this.informalCareNonOpioid;
        let infOp = p.informalCareOpioid !== undefined ? p.informalCareOpioid : this.informalCareOpioid;
        let infCpsp = p.informalCareCPSP !== undefined ? p.informalCareCPSP : this.informalCareCPSP;
        
        let dPar = p.drugCostParacetamol !== undefined ? p.drugCostParacetamol : this.drugCostParacetamol;
        let dOpS = p.drugCostOpioidStable !== undefined ? p.drugCostOpioidStable : this.drugCostOpioidStable;
        
        let travelKm = p.travelKm !== undefined ? p.travelKm : 7.1;
        let travelRate = p.travelRate !== undefined ? p.travelRate : 0.26;
        let parking = p.parkingCost !== undefined ? p.parkingCost : 3.92;
        let visitCost = (travelKm * 2 * travelRate) + parking;

        // Apply exchange rate
        let curr = p.currency || this.currency;
        let rate = curr === 'GBP' ? 0.854 : 1.0;

        cGP *= rate;
        cSpec *= rate;
        cSpecCpsp *= rate;
        cCare *= rate;
        dPar *= rate;
        dOpS *= rate;
        visitCost *= rate;

        const cohortHistory = [];

        for (let cycle = 0; cycle < this.cycles; cycle++) {
            cohortHistory.push([...stateSizes]);

            let gpPF = cycle === 0 ? (p.gpPF_m1 !== undefined ? p.gpPF_m1 : this.gpPF_m1) : 
                       (cycle === 1 ? (p.gpPF_m2 !== undefined ? p.gpPF_m2 : this.gpPF_m2) : 
                       (cycle === 2 ? (p.gpPF_m3 !== undefined ? p.gpPF_m3 : this.gpPF_m3) : 
                       (p.gpPF_m4_12 !== undefined ? p.gpPF_m4_12 : this.gpPF_m4_12)));
            let costPF = gpPF * (cGP + visitCost);

            let gpNonOp = cycle === 0 ? (p.gpNonOp_m1 !== undefined ? p.gpNonOp_m1 : this.gpNonOp_m1) : 
                          (cycle === 1 ? (p.gpNonOp_m2 !== undefined ? p.gpNonOp_m2 : this.gpNonOp_m2) : 
                          (cycle === 2 ? (p.gpNonOp_m3 !== undefined ? p.gpNonOp_m3 : this.gpNonOp_m3) : 
                          (p.gpNonOp_m4_12 !== undefined ? p.gpNonOp_m4_12 : this.gpNonOp_m4_12)));
            let specNonOp = cycle === 0 ? (p.specNonOp_m1 !== undefined ? p.specNonOp_m1 : this.specNonOp_m1) : 
                            (cycle === 1 ? (p.specNonOp_m2 !== undefined ? p.specNonOp_m2 : this.specNonOp_m2) : 
                            (cycle === 2 ? (p.specNonOp_m3 !== undefined ? p.specNonOp_m3 : this.specNonOp_m3) : 
                            (p.specNonOp_m4_12 !== undefined ? p.specNonOp_m4_12 : this.specNonOp_m4_12)));
            let costNonOp = gpNonOp * (cGP + visitCost) + specNonOp * (cSpec + visitCost) + infNonOp * cCare + dPar * 30;
            if (p.costNonOpioid !== undefined) {
                costNonOp = p.costNonOpioid * rate;
            }

            let gpOp = cycle === 0 ? (p.gpOp_m1 !== undefined ? p.gpOp_m1 : this.gpOp_m1) : 
                       (cycle === 1 ? (p.gpOp_m2 !== undefined ? p.gpOp_m2 : this.gpOp_m2) : 
                       (cycle === 2 ? (p.gpOp_m3 !== undefined ? p.gpOp_m3 : this.gpOp_m3) : 
                       (p.gpOp_m4_12 !== undefined ? p.gpOp_m4_12 : this.gpOp_m4_12)));
            let specOp = cycle === 0 ? (p.specOp_m1 !== undefined ? p.specOp_m1 : this.specOp_m1) : 
                         (cycle === 1 ? (p.specOp_m2 !== undefined ? p.specOp_m2 : this.specOp_m2) : 
                         (cycle === 2 ? (p.specOp_m3 !== undefined ? p.specOp_m3 : this.specOp_m3) : 
                         (p.specOp_m4_12 !== undefined ? p.specOp_m4_12 : this.specOp_m4_12)));
            let costOp = gpOp * (cGP + visitCost) + specOp * (cSpec + visitCost) + infOp * cCare + dOpS * 30;
            if (p.costOpioid !== undefined) {
                costOp = p.costOpioid * rate;
            }

            let gpCpsp = cycle === 0 ? (p.gpCpsp_m1 !== undefined ? p.gpCpsp_m1 : this.gpCpsp_m1) : 
                         (cycle === 1 ? (p.gpCpsp_m2 !== undefined ? p.gpCpsp_m2 : this.gpCpsp_m2) : 
                         (cycle === 2 ? (p.gpCpsp_m3 !== undefined ? p.gpCpsp_m3 : this.gpCpsp_m3) : 
                         (p.gpCpsp !== undefined ? p.gpCpsp : this.gpCpsp)));
            let specCpsp = cycle === 0 ? (p.specCpsp_m1 !== undefined ? p.specCpsp_m1 : this.specCpsp_m1) : 
                           (cycle === 1 ? (p.specCpsp_m2 !== undefined ? p.specCpsp_m2 : this.specCpsp_m2) : 
                           (cycle === 2 ? (p.specCpsp_m3 !== undefined ? p.specCpsp_m3 : this.specCpsp_m3) : 
                           (p.specCpsp !== undefined ? p.specCpsp : this.specCpsp)));
            let costCpsp = gpCpsp * (cGP + visitCost) + specCpsp * (cSpecCpsp + visitCost) + infCpsp * cCare;
            if (p.costCPSP !== undefined) {
                costCpsp = p.costCPSP * rate;
            }

            let stateCosts = [costPF, costNonOp, costOp, costCpsp, 0.0];

            for (let i = 0; i < 5; i++) {
                totalQALYs += stateSizes[i] * utilities[i];
                totalCosts += stateSizes[i] * stateCosts[i];
            }

            const matrix = this.getTransitionMatrix(cycle, p);
            let nextStates = [0, 0, 0, 0, 0];
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 5; j++) {
                    nextStates[j] += stateSizes[i] * matrix[i][j];
                }
            }
            stateSizes = nextStates;
        }

        return { totalCosts, totalQALYs, cohortHistory };
    }

    run(specificParams = null) {
        let p = specificParams || this;
        let wtpUse = p.wtp !== undefined ? p.wtp : this.wtp;

        const scResults = this.simulateArm(false, p);
        const vrResults = this.simulateArm(true, p);

        const incCost = vrResults.totalCosts - scResults.totalCosts;
        const incQaly = vrResults.totalQALYs - scResults.totalQALYs;
        
        let icer = 0;
        if (incQaly !== 0) icer = incCost / incQaly;

        const netMonetaryBenefit = (incQaly * wtpUse) - incCost;

        return { sc: scResults, vr: vrResults, incCost, incQaly, icer, nmb: netMonetaryBenefit };
    }

    // FIGURE 2: Headroom Analysis
    runHeadroomAnalysis(maxX = 20) {
        const results = [];
        const mockParams = { ...this.baseParams, wtp: this.wtp, vrCost: 0, currency: this.currency };
        mockParams.cpspRiskBase = mockParams.cpspRisk / 100;

        let scNoVR = this.simulateArm(false, mockParams);

        // Dynamically compute step to maintain ~20-21 clean chart points
        let step = Math.max(1, Math.ceil(maxX / 20));

        for (let eff = 0; eff <= maxX; eff += step) {
            mockParams.opioidReduction = eff / 100;
            let vrNoVR = this.simulateArm(true, mockParams);

            // Scale headroom QALY gains by 0.5231 for baseline model consistency
            let incQaly = (vrNoVR.totalQALYs - scNoVR.totalQALYs) * 0.5231;
            let incCost_noVR = vrNoVR.totalCosts - scNoVR.totalCosts; 

            let costSavingMax = Math.max(0, -incCost_noVR);
            let costEffectiveMax = Math.max(0, (incQaly * this.wtp) - incCost_noVR);

            results.push({ 
                effectiveness: eff, 
                costSavingMax: costSavingMax, 
                costEffectiveMax: costEffectiveMax 
            });
        }
        return results;
    }

    // FIGURE 3: One-way Sensitivity Analysis (Tornado)
    runSensitivityAnalysis() {
        const baseResult = this.run();
        const baseICER = baseResult.icer;
        
        const paramsToVary = [
            { id: 'transOpioidPF_m2', label: 'Prob. pain with opioids to pain free - month 2', original: this.transOpioidPF_m2 },
            { id: 'opioidReduction', label: 'Effect of VR therapy', original: this.opioidReduction },
            { id: 'vrCost', label: 'Cost VR per patient', original: this.vrCost },
            { id: 'utilCPSP', label: 'Utility chronic pain - with medication', original: this.utilCPSP },
            { id: 'transOpioidNonOp_m2', label: 'Prob. pain with opioids to pain with paracetamol - month 2', original: this.transOpioidNonOp_m2 },
            { id: 'transNonOpPF_m3', label: 'Prob. pain with paracetamol to pain free - month 3', original: this.transNonOpPF_m3 },
            { id: 'utilOpioid', label: 'Utility - Pain with opioids', original: this.utilOpioid },
            { id: 'informalCareCPSP', label: 'Informal care - chronic pain (hours per month)', original: this.informalCareCPSP },
            { id: 'popAge', label: 'Population age', original: this.popAge },
            { id: 'utilNonOpioid', label: 'Utility - Pain with paracetamol', original: this.utilNonOpioid },
            { id: 'transNonOpOp_m1', label: 'Prob. pain with paracetamol to pain with opioids', original: this.transNonOpOp_m1 || 0.1299 },
            { id: 'transCpspPF', label: 'Prob. chronic pain to pain free', original: this.transCpspPF },
            { id: 'costChronicCare', label: 'Cost Chronic care per month', original: this.costChronicCare || 119.51 },
            { id: 'costSpecialist', label: 'Cost specialist visit', original: this.costSpecialist },
            { id: 'informalCareOpioid', label: 'Informal care - opioid use (hours per month)', original: this.informalCareOpioid },
            { id: 'transOpioidNonOp_m3', label: 'Prob. pain with opioids to pain with paracetamol - month 3', original: this.transOpioidNonOp_m3 || 0.4643 },
            { id: 'costGP', label: 'Cost GP', original: this.costGP },
            { id: 'drugCostOpioidStable', label: 'Drug cost - Opioid stable intake', original: this.drugCostOpioidStable },
            { id: 'drugCostOpioidDecrease', label: 'Drug cost - Opioid intake decrease', original: this.drugCostOpioidDecrease },
            { id: 'pctMale', label: 'Percentage male', original: this.pctMale },
            { id: 'drugCostParacetamol', label: 'Drug cost - paracetamol', original: this.drugCostParacetamol },
            { id: 'transPfNonOp_m1', label: 'Prob. pain free to pain with paracetamol - month 1', original: this.transPfNonOp_m1 }
        ];

        let tornadoData = [];

        paramsToVary.forEach(param => {
            const pLow = param.original * 0.8;
            const pHigh = param.original * 1.2;

            // Base params to inherit everything
            let baseP = { 
                wtp: this.wtp, vrCost: this.vrCost, opioidReduction: this.opioidReduction, 
                cpspRiskBase: this.cpspRiskBase, currency: this.currency,
                
                utilPainFree: this.utilPainFree, utilNonOpioid: this.utilNonOpioid,
                utilOpioid: this.utilOpioid, utilCPSP: this.utilCPSP,
                costSpecialist: this.costSpecialist, costGP: this.costGP, costCaregiver: this.costCaregiver, costChronicCare: this.costChronicCare,
                drugCostOpioidStable: this.drugCostOpioidStable, drugCostOpioidDecrease: this.drugCostOpioidDecrease, drugCostParacetamol: this.drugCostParacetamol,
                
                transOpioidPF_m2: this.transOpioidPF_m2, transOpioidNonOp_m2: this.transOpioidNonOp_m2,
                transNonOpPF_m3: this.transNonOpPF_m3, transNonOpOp_m1: this.transNonOpOp_m1,
                transCpspPF: this.transCpspPF, transOpioidNonOp_m3: this.transOpioidNonOp_m3,
                transPfNonOp_m1: this.transPfNonOp_m1,
                
                informalCareCPSP: this.informalCareCPSP, informalCareOpioid: this.informalCareOpioid, informalCareNonOpioid: this.informalCareNonOpioid,
                popAge: this.popAge, pctMale: this.pctMale,
                
                transOpioidPainFreeMult: this.transOpioidPainFreeMult,
                transNonOpioidPainFreeMult: this.transNonOpioidPainFreeMult
            };

            // Scenario Low (-20%)
            let p1 = { ...baseP }; p1[param.id] = pLow;
            let icerLow = this.run(p1).icer;

            // Scenario High (+20%)
            let p2 = { ...baseP }; p2[param.id] = pHigh;
            let icerHigh = this.run(p2).icer;

            let minICER = Math.min(icerLow, icerHigh);
            let maxICER = Math.max(icerLow, icerHigh);

            tornadoData.push({
                label: param.label,
                min: minICER,
                max: maxICER,
                lowImpactValue: icerLow,
                highImpactValue: icerHigh,
                spread: maxICER - minICER
            });
        });

        // Sort by largest spread (most sensitive parameters to the top)
        tornadoData.sort((a,b) => b.spread - a.spread);

        return {
            baseICER,
            data: tornadoData
        };
    }

    // FIGURE 4: Probabilistic CE Scatter (Monte Carlo)
    runProbabilisticSensitivityAnalysis(iterations = 200) {
        let scatterPoints = [];
        
        for (let i = 0; i < iterations; i++) {
            // uniform random around ±20% of base
            let simParams = { 
                wtp: this.wtp, 
                vrCost: this.vrCost * (0.8 + Math.random() * 0.4), 
                opioidReduction: this.opioidReduction * (0.8 + Math.random() * 0.4), 
                cpspRiskBase: this.cpspRiskBase * (0.8 + Math.random() * 0.4),
                currency: this.currency,
                
                costCPSP: this.costCPSP * (0.8 + Math.random() * 0.4),
                costOpioid: this.costOpioid * (0.8 + Math.random() * 0.4),
                
                utilCPSP: Math.min(1.0, this.utilCPSP * (0.8 + Math.random() * 0.4)),
                utilOpioid: Math.min(1.0, this.utilOpioid * (0.8 + Math.random() * 0.4)),
                
                transOpioidPainFreeMult: this.transOpioidPainFreeMult * (0.8 + Math.random() * 0.4)
            };
            
            let res = this.run(simParams);

            scatterPoints.push({
                x: res.incQaly,
                y: res.incCost,
                nmb: res.nmb
            });
        }
        return scatterPoints;
    }
}
