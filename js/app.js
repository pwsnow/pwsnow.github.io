// app.js

document.addEventListener('DOMContentLoaded', () => {

    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Inter', sans-serif";

    let currentCurrency = 'GBP';
    const rate_eur_to_gbp = 0.854;
    let societalChartInstance = null;

    function formatCurrency(value) {
        if (currentCurrency === 'GBP') {
            return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
        }
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
    }

    let lastActiveDashboard = 'adv';

    const globalInputIds = [
        'cpspRiskGlobal', 'opioidReductionGlobal',
        'utilPfGlobal', 'utilNonOpGlobal', 'utilOpioidGlobal', 'utilCpspGlobal',
        'costGPGlobal', 'costSpecialistGlobal', 'costChronicCareGlobal', 'costCaregiverGlobal',
        'informalCareCPSPGlobal', 'informalCareOpioidGlobal', 'informalCareNonOpioidGlobal',
        'vrCostGlobal', 'popAgeGlobal', 'pctMaleGlobal', 'wtpGlobal',
        'drugCostOpioidStableGlobal', 'drugCostOpioidDecreaseGlobal', 'drugCostParacetamolGlobal',
        'travelCostKmGlobal', 'travelDistanceGlobal', 'parkingCostGlobal',
        
        'transPfNonOp_m1Global', 'transPfNonOp_m2Global', 'transPfNonOp_m3Global', 'transPfNonOp_m4_12Global',
        'transNonOpPF_m1Global', 'transNonOpPF_m2Global', 'transNonOpPF_m3Global', 'transNonOpPF_m4_12Global',
        'transNonOpOp_m1Global', 'transNonOpOp_m2Global', 'transNonOpOp_m3Global', 'transNonOpOp_m4_12Global',
        'transOpioidPF_m1Global', 'transOpioidPF_m2Global', 'transOpioidPF_m3Global', 'transOpioidPF_m4_12Global',
        'transOpioidNonOp_m1Global', 'transOpioidNonOp_m2Global', 'transOpioidNonOp_m3Global', 'transOpioidNonOp_m4_12Global',
        
        'transNonOpCpsp_m1Global', 'transNonOpCpsp_m2Global', 'transNonOpCpsp_m3Global', 'transNonOpCpsp_m4_12Global',
        'transOpioidCpsp_m1Global', 'transOpioidCpsp_m2Global', 'transOpioidCpsp_m3Global', 'transOpioidCpsp_m4_12Global',
        'transCpspPF_m1Global', 'transCpspPF_m2Global', 'transCpspPF_m3Global', 'transCpspPF_m4_12Global',
        
        'deathRisk_m1Global', 'deathRisk_m2Global', 'deathRisk_m3Global', 'deathRisk_m4_12Global',
        
        'gpPF_m1Global', 'gpPF_m2Global', 'gpPF_m3Global', 'gpPF_m4_12Global',
        'gpNonOp_m1Global', 'gpNonOp_m2Global', 'gpNonOp_m3Global', 'gpNonOp_m4_12Global',
        'gpOp_m1Global', 'gpOp_m2Global', 'gpOp_m3Global', 'gpOp_m4_12Global',
        'gpCpsp_m1Global', 'gpCpsp_m2Global', 'gpCpsp_m3Global', 'gpCpspGlobal',
        
        'specNonOp_m1Global', 'specNonOp_m2Global', 'specNonOp_m3Global', 'specNonOp_m4_12Global',
        'specOp_m1Global', 'specOp_m2Global', 'specOp_m3Global', 'specOp_m4_12Global',
        'specCpsp_m1Global', 'specCpsp_m2Global', 'specCpsp_m3Global', 'specCpspGlobal'
    ];

    function parseGlobalVal(id, fallback = 0) {
        const el = document.getElementById(id);
        return el && el.value !== "" ? parseFloat(el.value) : fallback;
    }

    function setupDashboard(prefix) {
        const id = (base) => {
            if (prefix === 'plp') {
                if (base === 'opioidReduction') return 'painReductionPlp';
                if (base === 'opioidReductionNum') return 'painReductionNumPlp';
                if (base === 'cpspRisk') return 'plpRiskPlp';
                if (base === 'cpspRiskNum') return 'plpRiskNumPlp';
            }
            return base + (prefix === 'adv' ? 'Adv' : (prefix === 'plp' ? 'Plp' : ''));
        };
        
        const elements = {
            wtp: document.getElementById(id('wtp')),
            vrCost: document.getElementById(id('vrCost')),
            vrCostNum: document.getElementById(id('vrCostNum')),
            opioidReduction: document.getElementById(id('opioidReduction')),
            opioidReductionNum: document.getElementById(id('opioidReductionNum')),
            cpspRisk: document.getElementById(id('cpspRisk')),
            cpspRiskNum: document.getElementById(id('cpspRiskNum')),
            
            statusIndicator: document.getElementById(id('costEffectiveStatus')),
            resetBtn: document.getElementById(id('resetBtn')),
            
            kpiIncCost: document.getElementById(id('kpiIncCost')),
            kpiIncQaly: document.getElementById(id('kpiIncQaly')),
            kpiIcer: document.getElementById(id('kpiIcer')),
            kpiNmb: document.getElementById(id('kpiNmb')),
            summaryAnalysis: document.getElementById(id('summaryAnalysis')),
            
            btnEur: document.getElementById(id('btnEur')),
            btnGbp: document.getElementById(id('btnGbp')),
            
            wtpLabel: document.querySelector(`label[for="${id('wtp')}"]`),
            vrCostLabel: document.querySelector(`label[for="${id('vrCost')}"]`)
        };



        let cePlaneChartInstance = null;
        let tornadoChartInstance = null;
        let headroomChartInstance = null;



        function formatNumber(value, decimals=4) {
            return parseFloat(value).toFixed(decimals);
        }

        function getInputValues() {
            let params = {
                wtp: parseFloat(elements.wtp.value),
                vrCost: parseFloat(elements.vrCost.value),
                opioidReduction: parseFloat(elements.opioidReduction.value),
                cpspRisk: parseFloat(elements.cpspRisk.value),
                currency: currentCurrency
            };
            
            if (prefix === 'adv' || prefix === 'plp') {
                const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
                const patientsPerSys = parseFloat(document.getElementById('patientsPerSystem' + cap).value) || 1;
                params.oneOffCost = (parseFloat(document.getElementById('oneOffCost' + cap).value) || 0) / patientsPerSys;
                params.sessionCost = parseFloat(document.getElementById('sessionCost' + cap).value) || 0;
                params.numSessions = parseFloat(document.getElementById('numSessions' + cap).value) || 1;
                
                params.utilPainFree = parseFloat(document.getElementById('utilPf' + cap).value);
                params.utilNonOpioid = parseFloat(document.getElementById('utilNonOp' + cap).value);
                params.utilOpioid = parseFloat(document.getElementById('utilOpioid' + cap).value);
                params.utilCPSP = parseFloat(document.getElementById('utilCpsp' + cap).value);
                
                params.costNonOpioid = parseFloat(document.getElementById('costNonOp' + cap).value);
                params.costOpioid = parseFloat(document.getElementById('costOpioid' + cap).value);
                params.costCPSP = parseFloat(document.getElementById('costCpsp' + cap).value);
            }
            
            return params;
        }

        function updateLabelOutputs() {
            // Handled explicitly in listeners now
        }

        function initCharts(results) {
            const cePlaneCtx = document.getElementById(id('cePlaneChart')).getContext('2d');
            const tornadoCtx = document.getElementById(id('tornadoChart')).getContext('2d');
            const headroomCtx = document.getElementById(id('headroomChart')).getContext('2d');

            cePlaneChartInstance = new Chart(cePlaneCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Base Case', data: [{ x: results.incQaly, y: results.incCost }], backgroundColor: results.nmb >= 0 ? '#10b981' : '#ef4444', pointStyle: 'rectRot', pointRadius: 10,  order: 1 },
                        { label: 'Probabilistic Iterations (N=200)', data: results.psa.map(d => ({x:d.x, y:d.y})), backgroundColor: 'rgba(56, 189, 248, 0.5)', pointRadius: 4, order: 2 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { title: { display: true, text: 'Incremental QALYs (ΔE)' } }, y: { title: { display: true, text: `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]` } } } }
            });

            tornadoChartInstance = new Chart(tornadoCtx, {
                type: 'bar',
                data: { labels: results.tornado.data.map(d => d.label), datasets: [ { label: 'Low Impact Bound (ICER)', data: results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseICER), backgroundColor: '#f59e0b' }, { label: 'High Impact Bound (ICER)', data: results.tornado.data.map(d => d.highImpactValue - results.tornado.baseICER), backgroundColor: '#38bdf8' } ] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + formatCurrency(c.raw + results.tornado.baseICER) + '/QALY'; } } } }, scales: { x: { title: { display: true, text: 'ICER in cost per QALY' } } } }
            });

            headroomChartInstance = new Chart(headroomCtx, {
                type: 'line',
                data: {
                    labels: results.headroom.map(d => d.effectiveness + '%'),
                    datasets: [
                        { label: 'Cost-saving', data: results.headroom.map(d => d.costSavingMax), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.4)', fill: true, tension: 0.1 },
                        { label: 'Cost-effective', data: results.headroom.map(d => d.costEffectiveMax), borderColor: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.4)', fill: '-1', tension: 0.1 },
                        { label: 'Not cost-effective', data: results.headroom.map(d => Math.max(200, d.costEffectiveMax + 100)), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', fill: '-1', tension: 0.1, pointRadius: 0 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { title: { display: true, text: 'Effect of VR therapy: % reduction in patients going home with opioids' } }, y: { max: 150, title: { display: true, text: `Cost of VR therapy per patient (${currentCurrency==='EUR'?'€':'£'})` }, min: 0 } } }
            });
        }

        function updateCharts(results) {
            if (!cePlaneChartInstance) { initCharts(results); return; }

            cePlaneChartInstance.data.datasets[0].data = [{ x: results.incQaly, y: results.incCost }];
            cePlaneChartInstance.data.datasets[0].backgroundColor = results.nmb >= 0 ? '#10b981' : '#ef4444';
            cePlaneChartInstance.data.datasets[1].data = results.psa.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.options.scales.y.title.text = `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]`;
            cePlaneChartInstance.update();

            tornadoChartInstance.data.datasets[0].data = results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseICER);
            tornadoChartInstance.data.datasets[1].data = results.tornado.data.map(d => d.highImpactValue - results.tornado.baseICER);
            tornadoChartInstance.update();

            headroomChartInstance.data.labels = results.headroom.map(d => d.effectiveness + '%');
            headroomChartInstance.data.datasets[0].data = results.headroom.map(d => d.costSavingMax);
            headroomChartInstance.data.datasets[1].data = results.headroom.map(d => d.costEffectiveMax);
            headroomChartInstance.data.datasets[2].data = results.headroom.map(d => Math.max(200, d.costEffectiveMax + 100));
            headroomChartInstance.options.scales.y.title.text = `Cost of VR therapy per patient (${currentCurrency==='EUR'?'€':'£'})`;
            headroomChartInstance.update();
        }

        function runModel() {
            const params = getInputValues();
            updateLabelOutputs();

            const model = new MarkovModel(params);
            model.baseParams.currency = currentCurrency;
            
            const results = model.run();
            results.tornado = model.runSensitivityAnalysis();
            results.headroom = model.runHeadroomAnalysis();
            results.psa = model.runProbabilisticSensitivityAnalysis(200); 

            elements.kpiIncCost.textContent = formatCurrency(results.incCost);
            elements.kpiIncCost.style.color = results.incCost > 0 ? 'var(--danger)' : 'var(--success)';
            elements.kpiIncQaly.textContent = formatNumber(results.incQaly);
            elements.kpiIncQaly.style.color = results.incQaly > 0 ? 'var(--success)' : 'var(--danger)';
            elements.kpiNmb.textContent = formatCurrency(results.nmb);
            elements.kpiNmb.style.color = results.nmb >= 0 ? 'var(--success)' : 'var(--danger)';

            if (results.incQaly > 0 && results.incCost <= 0) {
                elements.kpiIcer.textContent = "Dominant";
                elements.kpiIcer.style.color = "var(--success)";
            } else if (results.incQaly < 0 && results.incCost >= 0) {
                elements.kpiIcer.textContent = "Dominated";
                elements.kpiIcer.style.color = "var(--danger)";
            } else {
                elements.kpiIcer.textContent = formatCurrency(results.icer) + '/QALY';
                elements.kpiIcer.style.color = results.icer <= params.wtp ? 'var(--warning)' : 'var(--danger)';
            }

            if (results.nmb >= 0) {
                elements.statusIndicator.textContent = "Cost-Effective";
                elements.statusIndicator.className = "status-indicator status-effective";
            } else {
                elements.statusIndicator.textContent = "Not Cost-Effective";
                elements.statusIndicator.className = "status-indicator status-ineffective";
            }

            let summaryHtml = `<p>At a WTP threshold of <span class="highlight-text">${formatCurrency(params.wtp)}/QALY</span>, VR therapy is <strong>${results.nmb >= 0 ? 'Cost-Effective' : 'NOT Cost-Effective'}</strong>.</p>`;
            elements.summaryAnalysis.innerHTML = `<h2>Analysis Summary</h2>${summaryHtml}`;

            updateCharts(results);
            if (prefix === 'adv' && typeof updateSocietalForecast === 'function') {
                updateSocietalForecast(); if (typeof updateHtaAnalysis === 'function') updateHtaAnalysis();
            }
        }

        function setCurrency(targetCurrency) {
            if (currentCurrency === targetCurrency) return;
            currentCurrency = targetCurrency;

            if (targetCurrency === 'GBP') {
                elements.btnGbp.style.background = 'var(--accent-primary)';
                elements.btnGbp.style.color = '#fff';
                elements.btnEur.style.background = 'transparent';
                elements.btnEur.style.color = 'var(--text-secondary)';
                elements.wtpLabel.textContent = 'Willingness to Pay (WTP) per QALY (£)';
                elements.vrCostLabel.textContent = 'VR Therapy Cost per Patient (£)';
                
                elements.wtp.value = Math.round(parseFloat(elements.wtp.value) * rate_eur_to_gbp);
                elements.vrCost.value = (parseFloat(elements.vrCost.value) * rate_eur_to_gbp).toFixed(2);
            } else {
                /*... handled natively by HTML ...*/;
                elements.btnEur.style.color = '#fff';
                elements.btnGbp.style.background = 'transparent';
                elements.btnGbp.style.color = 'var(--text-secondary)';
                elements.wtpLabel.textContent = 'Willingness to Pay (WTP) per QALY (€)';
                elements.vrCostLabel.textContent = 'VR Therapy Cost per Patient (€)';
                
                elements.wtp.value = Math.round(parseFloat(elements.wtp.value) / rate_eur_to_gbp);
                elements.vrCost.value = (parseFloat(elements.vrCost.value) / rate_eur_to_gbp).toFixed(2);
            }
            runModel();
        if (prefix === "vr") window.updateDashboardVr = runModel;
        else if (prefix === "adv") window.updateDashboardAdv = runModel;
        else if (prefix === "plp") window.updateDashboardPlp = runModel;
        }

        elements.btnEur.addEventListener('click', () => setCurrency('EUR'));
        elements.btnGbp.addEventListener('click', () => setCurrency('GBP'));
        
        let presetE = document.getElementById(id('presetCostEffective'));
        let presetS = document.getElementById(id('presetCostSaving'));
        if (presetE) presetE.addEventListener('click', () => { elements.opioidReduction.value = 2.5; runModel(); });
        if (presetS) presetS.addEventListener('click', () => { elements.opioidReduction.value = 6.5; runModel(); });

        let listeners = [elements.wtp, elements.vrCost, elements.opioidReduction, elements.cpspRisk];
        if (prefix === 'adv' || prefix === 'plp') {
            const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            listeners = listeners.concat([
                document.getElementById('oneOffCost' + cap), 
                document.getElementById('sessionCost' + cap), 
                document.getElementById('numSessions' + cap),
                document.getElementById('patientsPerSystem' + cap),
                document.getElementById('utilPf' + cap), 
                document.getElementById('utilNonOp' + cap),
                document.getElementById('utilOpioid' + cap), 
                document.getElementById('utilCpsp' + cap),
                document.getElementById('costNonOp' + cap), 
                document.getElementById('costOpioid' + cap),
                document.getElementById('costCpsp' + cap)
            ]);
        }
        listeners.forEach((el) => { if (el) el.addEventListener('input', runModel) });
        // Set initial nums
        elements.vrCostNum.value = elements.vrCost.value;
        elements.opioidReductionNum.value = elements.opioidReduction.value;
        elements.cpspRiskNum.value = elements.cpspRisk.value;

        elements.resetBtn.addEventListener('click', () => {
            elements.wtp.value = currentCurrency === 'EUR' ? Math.round(20000 / rate_eur_to_gbp) : 20000;
            elements.vrCost.value = currentCurrency === 'EUR' ? (40.55 / rate_eur_to_gbp).toFixed(2) : 40.55;
            elements.opioidReduction.value = 2.8;
            elements.cpspRisk.value = 15;
            runModel();
        if (prefix === "vr") window.updateDashboardVr = runModel;
        else if (prefix === "adv") window.updateDashboardAdv = runModel;
        else if (prefix === "plp") window.updateDashboardPlp = runModel;
        });

        runModel();
        if (prefix === "vr") window.updateDashboardVr = runModel;
        else if (prefix === "adv") window.updateDashboardAdv = runModel;
        else if (prefix === "plp") window.updateDashboardPlp = runModel;
    }

    // Initialize all three dashboards uniquely
    setupDashboard('vr');
    setupDashboard('adv');
    setupDashboard('plp');

    // Tab Switching Logic
    const btnTabVr = document.getElementById('btnTabVr');
    const btnTabAdv = document.getElementById('btnTabAdv');
    const btnTabTable = document.getElementById('btnTabTable');
    
    const tabVr = document.getElementById('tab-vr');
    const tabAdv = document.getElementById('tab-adv');
    const tabTable = document.getElementById('tab-table');

    const btnTabSocietal = document.getElementById('btnTabSocietal');
    const tabSocietal = document.getElementById('tab-societal');
    const btnTabPlp = document.getElementById('btnTabPlp');
    const tabPlp = document.getElementById('tab-plp');
    const btnTabHta = document.getElementById('btnTabHta');
    const tabHta = document.getElementById('tab-hta');
    const btnTabEquations = document.getElementById('btnTabEquations');
    const tabEquations = document.getElementById('tab-equations');

    function switchTab(activeBtn, activeTab) {
        [btnTabVr, btnTabAdv, btnTabPlp, btnTabHta, btnTabEquations, btnTabTable, btnTabSocietal].forEach(b => b.classList.remove('active'));
        [tabVr, tabAdv, tabPlp, tabHta, tabEquations, tabTable, tabSocietal].forEach(t => t.classList.remove('active'));
        
        activeBtn.classList.add('active');
        activeTab.classList.add('active');
        
        if (activeBtn === btnTabSocietal) {
            updateSocietalForecast(); if (typeof updateHtaAnalysis === 'function') updateHtaAnalysis();
        } else if (activeBtn === btnTabHta) {
            updateHtaAnalysis();
        }
    }

    btnTabVr.addEventListener('click', () => switchTab(btnTabVr, tabVr));
    btnTabAdv.addEventListener('click', () => { lastActiveDashboard = 'adv'; switchTab(btnTabAdv, tabAdv); });
    btnTabPlp.addEventListener('click', () => { lastActiveDashboard = 'plp'; switchTab(btnTabPlp, tabPlp); });
    btnTabHta.addEventListener('click', () => switchTab(btnTabHta, tabHta));
    btnTabEquations.addEventListener('click', () => switchTab(btnTabEquations, tabEquations));
    btnTabTable.addEventListener('click', () => switchTab(btnTabTable, tabTable));
    btnTabSocietal.addEventListener('click', () => switchTab(btnTabSocietal, tabSocietal));

    // Threshold Solver Logic
    const modal = document.getElementById('thresholdsModal');
    const closeModalBtn = document.getElementById('closeModal');
    const modalCeVal = document.getElementById('modalCeThreshold');
    const modalCsVal = document.getElementById('modalCsThreshold');
    const modalCeTitle = document.getElementById('modalCeTitle');
    const applyCeBtn = document.getElementById('btnApplyCeThreshold');
    const applyCsBtn = document.getElementById('btnApplyCsThreshold');
    const modalNote = document.getElementById('modalContextNote');

    let solverActivePrefix = 'vr';
    let solvedCeValue = 2.8;
    let solvedCsValue = 6.5;

    function solveThresholds(prefix) {
        solverActivePrefix = prefix;
        const id_prefix = prefix === 'adv' ? 'Adv' : (prefix === 'plp' ? 'Plp' : '');
        const isPlp = prefix === 'plp';
        
        // Obtain the active input controls on this dashboard page
        const solverInputs = {
            wtp: parseFloat(document.getElementById('wtp' + id_prefix).value),
            vrCost: parseFloat(document.getElementById('vrCost' + id_prefix).value),
            cpspRisk: parseFloat(document.getElementById(isPlp ? 'plpRiskPlp' : ('cpspRisk' + id_prefix)).value),
            currency: currentCurrency
        };

        // Extract global Table 1 settings baseline
        let g = {
            utilPainFree: parseGlobalVal('utilPfGlobal', 1.0),
            utilNonOpioid: parseGlobalVal('utilNonOpGlobal', 0.93),
            utilOpioid: parseGlobalVal('utilOpioidGlobal', 0.61),
            utilCPSP: parseGlobalVal('utilCpspGlobal', 0.59),
            costGP: parseGlobalVal('costGPGlobal', 32.04),
            costSpecialist: parseGlobalVal('costSpecialistGlobal', 225.00),
            costChronicCare: parseGlobalVal('costChronicCareGlobal', 119.51),
            costCaregiver: parseGlobalVal('costCaregiverGlobal', 19.51),
            informalCareCPSP: parseGlobalVal('informalCareCPSPGlobal', 20),
            informalCareOpioid: parseGlobalVal('informalCareOpioidGlobal', 20),
            informalCareNonOpioid: parseGlobalVal('informalCareNonOpioidGlobal', 8),
            popAge: parseGlobalVal('popAgeGlobal', 65),
            pctMale: parseGlobalVal('pctMaleGlobal', 0.50),
            drugCostOpioidStable: parseGlobalVal('drugCostOpioidStableGlobal', 0.35),
            drugCostOpioidDecrease: parseGlobalVal('drugCostOpioidDecreaseGlobal', 0.24),
            drugCostParacetamol: parseGlobalVal('drugCostParacetamolGlobal', 0.03),
            travelCostKm: parseGlobalVal('travelCostKmGlobal', 0.26),
            travelDistance: parseGlobalVal('travelDistanceGlobal', 7.1),
            parkingCost: parseGlobalVal('parkingCostGlobal', 3.92),
            transPfNonOp_m1: parseGlobalVal('transPfNonOp_m1Global', 0.1176),
            transPfNonOp_m2: parseGlobalVal('transPfNonOp_m2Global', 0.0000),
            transPfNonOp_m3: parseGlobalVal('transPfNonOp_m3Global', 0.0000),
            transPfNonOp_m4_12: parseGlobalVal('transPfNonOp_m4_12Global', 0.0000),
            transNonOpPF_m1: parseGlobalVal('transNonOpPF_m1Global', 0.0000),
            transNonOpPF_m2: parseGlobalVal('transNonOpPF_m2Global', 1.0000),
            transNonOpPF_m3: parseGlobalVal('transNonOpPF_m3Global', 0.7297),
            transNonOpPF_m4_12: parseGlobalVal('transNonOpPF_m4_12Global', 0.0000),
            transNonOpOp_m1: parseGlobalVal('transNonOpOp_m1Global', 0.1299),
            transNonOpOp_m2: parseGlobalVal('transNonOpOp_m2Global', 0.0000),
            transNonOpOp_m3: parseGlobalVal('transNonOpOp_m3Global', 0.0000),
            transNonOpOp_m4_12: parseGlobalVal('transNonOpOp_m4_12Global', 0.0000),
            transOpioidPF_m1: parseGlobalVal('transOpioidPF_m1Global', 0.0000),
            transOpioidPF_m2: parseGlobalVal('transOpioidPF_m2Global', 0.4841),
            transOpioidPF_m3: parseGlobalVal('transOpioidPF_m3Global', 0.0000),
            transOpioidPF_m4_12: parseGlobalVal('transOpioidPF_m4_12Global', 0.0000),
            transOpioidNonOp_m1: parseGlobalVal('transOpioidNonOp_m1Global', 0.0000),
            transOpioidNonOp_m2: parseGlobalVal('transOpioidNonOp_m2Global', 0.2937),
            transOpioidNonOp_m3: parseGlobalVal('transOpioidNonOp_m3Global', 0.4643),
            transOpioidNonOp_m4_12: parseGlobalVal('transOpioidNonOp_m4_12Global', 0.0000),
            transNonOpCpsp_m1: parseGlobalVal('transNonOpCpsp_m1Global', 0.0000),
            transNonOpCpsp_m2: parseGlobalVal('transNonOpCpsp_m2Global', 0.0000),
            transNonOpCpsp_m3: parseGlobalVal('transNonOpCpsp_m3Global', 0.0000),
            transNonOpCpsp_m4_12: parseGlobalVal('transNonOpCpsp_m4_12Global', 1.0000),
            transOpioidCpsp_m1: parseGlobalVal('transOpioidCpsp_m1Global', 0.0000),
            transOpioidCpsp_m2: parseGlobalVal('transOpioidCpsp_m2Global', 0.0000),
            transOpioidCpsp_m3: parseGlobalVal('transOpioidCpsp_m3Global', 0.0000),
            transOpioidCpsp_m4_12: parseGlobalVal('transOpioidCpsp_m4_12Global', 1.0000),
            transCpspPF_m1: parseGlobalVal('transCpspPF_m1Global', 0.0000),
            transCpspPF_m2: parseGlobalVal('transCpspPF_m2Global', 0.0000),
            transCpspPF_m3: parseGlobalVal('transCpspPF_m3Global', 0.0000),
            transCpspPF_m4_12: parseGlobalVal('transCpspPF_m4_12Global', 0.0286),
            deathRisk_m1: parseGlobalVal('deathRisk_m1Global', 0.0005),
            deathRisk_m2: parseGlobalVal('deathRisk_m2Global', 0.0005),
            deathRisk_m3: parseGlobalVal('deathRisk_m3Global', 0.0005),
            deathRisk_m4_12: parseGlobalVal('deathRisk_m4_12Global', 0.0005),
            gpPF_m1: parseGlobalVal('gpPF_m1Global', 0.03),
            gpPF_m2: parseGlobalVal('gpPF_m2Global', 0.01),
            gpPF_m3: parseGlobalVal('gpPF_m3Global', 0.02),
            gpPF_m4_12: parseGlobalVal('gpPF_m4_12Global', 0.01),
            gpNonOp_m1: parseGlobalVal('gpNonOp_m1Global', 0.11),
            gpNonOp_m2: parseGlobalVal('gpNonOp_m2Global', 0.14),
            gpNonOp_m3: parseGlobalVal('gpNonOp_m3Global', 0.30),
            gpNonOp_m4_12: parseGlobalVal('gpNonOp_m4_12Global', 0.00),
            gpOp_m1: parseGlobalVal('gpOp_m1Global', 0.23),
            gpOp_m2: parseGlobalVal('gpOp_m2Global', 0.50),
            gpOp_m3: parseGlobalVal('gpOp_m3Global', 0.60),
            gpOp_m4_12: parseGlobalVal('gpOp_m4_12Global', 0.00),
            gpCpsp_m1: parseGlobalVal('gpCpsp_m1Global', 0.00),
            gpCpsp_m2: parseGlobalVal('gpCpsp_m2Global', 0.00),
            gpCpsp_m3: parseGlobalVal('gpCpsp_m3Global', 0.00),
            gpCpsp: parseGlobalVal('gpCpspGlobal', 0.61),
            specNonOp_m1: parseGlobalVal('specNonOp_m1Global', 0.10),
            specNonOp_m2: parseGlobalVal('specNonOp_m2Global', 0.10),
            specNonOp_m3: parseGlobalVal('specNonOp_m3Global', 0.10),
            specNonOp_m4_12: parseGlobalVal('specNonOp_m4_12Global', 0.00),
            specOp_m1: parseGlobalVal('specOp_m1Global', 0.20),
            specOp_m2: parseGlobalVal('specOp_m2Global', 0.20),
            specOp_m3: parseGlobalVal('specOp_m3Global', 0.20),
            specOp_m4_12: parseGlobalVal('specOp_m4_12Global', 0.00),
            specCpsp_m1: parseGlobalVal('specCpsp_m1Global', 0.00),
            specCpsp_m2: parseGlobalVal('specCpsp_m2Global', 0.00),
            specCpsp_m3: parseGlobalVal('specCpsp_m3Global', 0.00),
            specCpsp: parseGlobalVal('specCpspGlobal', 0.30)
        };

        if (prefix === 'adv' || prefix === 'plp') {
            const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
            g.utilPainFree = parseGlobalVal('utilPf' + cap, g.utilPainFree);
            g.utilNonOpioid = parseGlobalVal('utilNonOp' + cap, g.utilNonOpioid);
            g.utilOpioid = parseGlobalVal('utilOpioid' + cap, g.utilOpioid);
            g.utilCPSP = parseGlobalVal('utilCpsp' + cap, g.utilCPSP);
            g.costGP = parseGlobalVal('costGP' + cap, g.costGP);
            g.costSpecialist = parseGlobalVal('costSpecialist' + cap, g.costSpecialist);
            g.costChronicCare = parseGlobalVal('costChronicCare' + cap, g.costChronicCare);
            g.costCaregiver = parseGlobalVal('costCaregiver' + cap, g.costCaregiver);
            g.informalCareCPSP = parseGlobalVal('informalCareCPSP' + cap, g.informalCareCPSP);
            g.informalCareOpioid = parseGlobalVal('informalCareOpioid' + cap, g.informalCareOpioid);
            g.informalCareNonOpioid = parseGlobalVal('informalCareNonOpioid' + cap, g.informalCareNonOpioid);
            g.popAge = parseGlobalVal('popAge' + cap, g.popAge);
            g.pctMale = parseGlobalVal('pctMale' + cap, g.pctMale);
            
            g.oneOffCost = parseGlobalVal('oneOffCost' + cap, 0);
            g.sessionCost = parseGlobalVal('sessionCost' + cap, 0);
            g.numSessions = parseGlobalVal('numSessions' + cap, 1);
            
            const rCost = parseGlobalVal('roboticsCost' + cap, 0);
            solverInputs.vrCost += rCost;
        }

        let ceEfficacy = -1;
        let csEfficacy = -1;

        // Bisection search/Linear scan from 0% to 100% in steps of 0.05%
        for (let eff = 0; eff <= 100; eff += 0.05) {
            let modelParams = {
                ...g,
                wtp: solverInputs.wtp,
                vrCost: solverInputs.vrCost,
                opioidReduction: eff,
                cpspRisk: solverInputs.cpspRisk,
                currency: currentCurrency
            };
            
            const tempModel = new MarkovModel(modelParams);
            tempModel.baseParams.currency = currentCurrency;
            const res = tempModel.run();

            if (ceEfficacy === -1 && res.nmb >= 0) {
                ceEfficacy = eff;
            }
            if (csEfficacy === -1 && res.incCost <= 0) {
                csEfficacy = eff;
            }
        }

        solvedCeValue = ceEfficacy;
        solvedCsValue = csEfficacy;

        // Render values in modal
        const symb = currentCurrency === 'GBP' ? '£' : '€';
        modalCeTitle.textContent = `Cost-Effective (at ${symb}${solverInputs.wtp.toLocaleString()})`;
        modalCeVal.textContent = ceEfficacy !== -1 ? `${ceEfficacy.toFixed(2)}%` : 'Not Achievable';
        modalCsVal.textContent = csEfficacy !== -1 ? `${csEfficacy.toFixed(2)}%` : 'Not Achievable';
        
        applyCeBtn.style.display = ceEfficacy !== -1 ? 'block' : 'none';
        applyCsBtn.style.display = csEfficacy !== -1 ? 'block' : 'none';

        // Solve for payback years at 100% efficacy if not achievable in 1-year
        let longTermNote = '';
        if (ceEfficacy === -1) {
            let solvedCeYears = -1;
            for (let y = 1; y <= 20; y++) {
                let tempParams = { 
                    ...g, 
                    wtp: solverInputs.wtp, 
                    vrCost: solverInputs.vrCost, 
                    opioidReduction: 100, 
                    cpspRisk: solverInputs.cpspRisk, 
                    currency: currentCurrency, 
                    cycles: y * 12 
                };
                const tempModel = new MarkovModel(tempParams);
                const tempRes = tempModel.run();
                if (tempRes.nmb >= 0) {
                    solvedCeYears = y;
                    break;
                }
            }
            if (solvedCeYears !== -1) {
                longTermNote = `<br><span style="color:var(--accent-primary);">At 100% efficacy, cost-effectiveness is projected to be achieved in <strong>${solvedCeYears} years</strong>.</span>`;
            } else {
                longTermNote = `<br><span style="color:#ef4444;">Even at 100% efficacy, this setup remains not cost-effective over a 20-year horizon.</span>`;
            }
        }

        modalNote.innerHTML = `Active Parameters: VR Cost = ${symb}${solverInputs.vrCost.toFixed(2)}, CPSP Risk = ${solverInputs.cpspRisk}%${longTermNote}`;
        modal.style.display = 'flex';
    }

    document.getElementById('btnCalcThresholds').addEventListener('click', () => solveThresholds('vr'));
    document.getElementById('btnCalcThresholdsAdv').addEventListener('click', () => solveThresholds('adv'));
    document.getElementById('btnCalcThresholdsPlp').addEventListener('click', () => solveThresholds('plp'));

    closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    function applyEfficacy(val) {
        const id_prefix = solverActivePrefix === 'adv' ? 'Adv' : (solverActivePrefix === 'plp' ? 'Plp' : '');
        const isPlp = solverActivePrefix === 'plp';
        const slider = document.getElementById(isPlp ? 'painReductionPlp' : ('opioidReduction' + id_prefix));
        const number = document.getElementById(isPlp ? 'painReductionNumPlp' : ('opioidReductionNum' + id_prefix));
        if (slider) slider.value = val;
        if (number) number.value = val;
        
        if (solverActivePrefix === 'vr') {
            if (typeof window.updateDashboardVr === 'function') window.updateDashboardVr();
        } else if (solverActivePrefix === 'plp') {
            if (typeof window.updateDashboardPlp === 'function') window.updateDashboardPlp();
        } else {
            if (typeof window.updateDashboardAdv === 'function') window.updateDashboardAdv();
        }
        modal.style.display = 'none';
    }

    applyCeBtn.addEventListener('click', () => applyEfficacy(solvedCeValue));
    applyCsBtn.addEventListener('click', () => applyEfficacy(solvedCsValue));

    // NHS threshold shortcut button
    const btnNhsWtp = document.getElementById('btnNhsWtpAdv');
    if (btnNhsWtp) {
        btnNhsWtp.addEventListener('click', () => {
            const wtpInput = document.getElementById('wtpAdv');
            if (wtpInput) {
                const targetGbp = 25000;
                if (currentCurrency === 'GBP') {
                    wtpInput.value = targetGbp;
                } else {
                    wtpInput.value = Math.round(targetGbp / rate_eur_to_gbp);
                }
                wtpInput.dispatchEvent(new Event('input'));
            }
        });
    }
    const btnNhsWtpPlp = document.getElementById('btnNhsWtpPlp');
    if (btnNhsWtpPlp) {
        btnNhsWtpPlp.addEventListener('click', () => {
            const wtpInput = document.getElementById('wtpPlp');
            if (wtpInput) {
                const targetGbp = 25000;
                if (currentCurrency === 'GBP') {
                    wtpInput.value = targetGbp;
                } else {
                    wtpInput.value = Math.round(targetGbp / rate_eur_to_gbp);
                }
                wtpInput.dispatchEvent(new Event('input'));
            }
        });
    }

    // Societal Tab Slider Sync
    const societalSliders = [
        { slider: 'cohortSizeSocietal', num: 'cohortSizeSocietalNum' },
        { slider: 'weeklyEarningsSocietal', num: 'weeklyEarningsSocietalNum' },
        { slider: 'employmentRateSocietal', num: 'employmentRateSocietalNum' },
        { slider: 'horizonSocietal', num: 'horizonSocietalNum' }
    ];

    societalSliders.forEach(pair => {
        const sliderEl = document.getElementById(pair.slider);
        const numEl = document.getElementById(pair.num);
        if (sliderEl && numEl) {
            sliderEl.addEventListener('input', (e) => { numEl.value = e.target.value; updateSocietalForecast(); if (typeof updateHtaAnalysis === 'function') updateHtaAnalysis(); });
            numEl.addEventListener('input', (e) => { sliderEl.value = e.target.value; updateSocietalForecast(); if (typeof updateHtaAnalysis === 'function') updateHtaAnalysis(); });
        }
    });



    function updateSocietalForecast() {
        const suffix = lastActiveDashboard === 'plp' ? 'Plp' : 'Adv';
        const isPlp = lastActiveDashboard === 'plp';

        // Read active tab parameter states as the base for analysis
        const wtpInput = document.getElementById('wtp' + suffix);
        const wtp = wtpInput ? parseFloat(wtpInput.value) : 20000;
        const vrCostInput = document.getElementById('vrCost' + suffix);
        let vrCost = vrCostInput ? parseFloat(vrCostInput.value) : 40.55;
        const opioidReductionInput = document.getElementById(isPlp ? 'painReductionPlp' : 'opioidReductionAdv');
        const opioidReduction = opioidReductionInput ? parseFloat(opioidReductionInput.value) : 2.8;
        const cpspRiskInput = document.getElementById(isPlp ? 'plpRiskPlp' : 'cpspRiskAdv');
        const cpspRisk = cpspRiskInput ? parseFloat(cpspRiskInput.value) : 15;

        // Fetch societal input modifiers
        const cohortSize = parseFloat(document.getElementById('cohortSizeSocietalNum').value) || 10000;
        const weeklyEarnings = parseFloat(document.getElementById('weeklyEarningsSocietalNum').value) || 650;
        const employmentRate = (parseFloat(document.getElementById('employmentRateSocietalNum').value) || 60) / 100;
        const horizonYears = parseFloat(document.getElementById('horizonSocietalNum').value) || 5;

        // Fetch global baseline values
        let g = {
            utilPainFree: parseGlobalVal('utilPfGlobal', 1.0),
            utilNonOpioid: parseGlobalVal('utilNonOpGlobal', 0.93),
            utilOpioid: parseGlobalVal('utilOpioidGlobal', 0.61),
            utilCPSP: parseGlobalVal('utilCpspGlobal', 0.59),
            costGP: parseGlobalVal('costGPGlobal', 32.04),
            costSpecialist: parseGlobalVal('costSpecialistGlobal', 225.00),
            costChronicCare: parseGlobalVal('costChronicCareGlobal', 119.51),
            costCaregiver: parseGlobalVal('costCaregiverGlobal', 19.51),
            informalCareCPSP: parseGlobalVal('informalCareCPSPGlobal', 20),
            informalCareOpioid: parseGlobalVal('informalCareOpioidGlobal', 20),
            informalCareNonOpioid: parseGlobalVal('informalCareNonOpioidGlobal', 8),
            popAge: parseGlobalVal('popAgeGlobal', 65),
            pctMale: parseGlobalVal('pctMaleGlobal', 0.50),
            drugCostOpioidStable: parseGlobalVal('drugCostOpioidStableGlobal', 0.35),
            drugCostOpioidDecrease: parseGlobalVal('drugCostOpioidDecreaseGlobal', 0.24),
            drugCostParacetamol: parseGlobalVal('drugCostParacetamolGlobal', 0.03),
            travelCostKm: parseGlobalVal('travelCostKmGlobal', 0.26),
            travelDistance: parseGlobalVal('travelDistanceGlobal', 7.1),
            parkingCost: parseGlobalVal('parkingCostGlobal', 3.92),
            transPfNonOp_m1: parseGlobalVal('transPfNonOp_m1Global', 0.1176),
            transPfNonOp_m2: parseGlobalVal('transPfNonOp_m2Global', 0.0000),
            transPfNonOp_m3: parseGlobalVal('transPfNonOp_m3Global', 0.0000),
            transPfNonOp_m4_12: parseGlobalVal('transPfNonOp_m4_12Global', 0.0000),
            transNonOpPF_m1: parseGlobalVal('transNonOpPF_m1Global', 0.0000),
            transNonOpPF_m2: parseGlobalVal('transNonOpPF_m2Global', 1.0000),
            transNonOpPF_m3: parseGlobalVal('transNonOpPF_m3Global', 0.7297),
            transNonOpPF_m4_12: parseGlobalVal('transNonOpPF_m4_12Global', 0.0000),
            transNonOpOp_m1: parseGlobalVal('transNonOpOp_m1Global', 0.1299),
            transNonOpOp_m2: parseGlobalVal('transNonOpOp_m2Global', 0.0000),
            transNonOpOp_m3: parseGlobalVal('transNonOpOp_m3Global', 0.0000),
            transNonOpOp_m4_12: parseGlobalVal('transNonOpOp_m4_12Global', 0.0000),
            transOpioidPF_m1: parseGlobalVal('transOpioidPF_m1Global', 0.0000),
            transOpioidPF_m2: parseGlobalVal('transOpioidPF_m2Global', 0.4841),
            transOpioidPF_m3: parseGlobalVal('transOpioidPF_m3Global', 0.0000),
            transOpioidPF_m4_12: parseGlobalVal('transOpioidPF_m4_12Global', 0.0000),
            transOpioidNonOp_m1: parseGlobalVal('transOpioidNonOp_m1Global', 0.0000),
            transOpioidNonOp_m2: parseGlobalVal('transOpioidNonOp_m2Global', 0.2937),
            transOpioidNonOp_m3: parseGlobalVal('transOpioidNonOp_m3Global', 0.4643),
            transOpioidNonOp_m4_12: parseGlobalVal('transOpioidNonOp_m4_12Global', 0.0000),
            transNonOpCpsp_m1: parseGlobalVal('transNonOpCpsp_m1Global', 0.0000),
            transNonOpCpsp_m2: parseGlobalVal('transNonOpCpsp_m2Global', 0.0000),
            transNonOpCpsp_m3: parseGlobalVal('transNonOpCpsp_m3Global', 0.0000),
            transNonOpCpsp_m4_12: parseGlobalVal('transNonOpCpsp_m4_12Global', 1.0000),
            transOpioidCpsp_m1: parseGlobalVal('transOpioidCpsp_m1Global', 0.0000),
            transOpioidCpsp_m2: parseGlobalVal('transOpioidCpsp_m2Global', 0.0000),
            transOpioidCpsp_m3: parseGlobalVal('transOpioidCpsp_m3Global', 0.0000),
            transOpioidCpsp_m4_12: parseGlobalVal('transOpioidCpsp_m4_12Global', 1.0000),
            transCpspPF_m1: parseGlobalVal('transCpspPF_m1Global', 0.0000),
            transCpspPF_m2: parseGlobalVal('transCpspPF_m2Global', 0.0000),
            transCpspPF_m3: parseGlobalVal('transCpspPF_m3Global', 0.0000),
            transCpspPF_m4_12: parseGlobalVal('transCpspPF_m4_12Global', 0.0286),
            deathRisk_m1: parseGlobalVal('deathRisk_m1Global', 0.0005),
            deathRisk_m2: parseGlobalVal('deathRisk_m2Global', 0.0005),
            deathRisk_m3: parseGlobalVal('deathRisk_m3Global', 0.0005),
            deathRisk_m4_12: parseGlobalVal('deathRisk_m4_12Global', 0.0005),
            gpPF_m1: parseGlobalVal('gpPF_m1Global', 0.03),
            gpPF_m2: parseGlobalVal('gpPF_m2Global', 0.01),
            gpPF_m3: parseGlobalVal('gpPF_m3Global', 0.02),
            gpPF_m4_12: parseGlobalVal('gpPF_m4_12Global', 0.01),
            gpNonOp_m1: parseGlobalVal('gpNonOp_m1Global', 0.11),
            gpNonOp_m2: parseGlobalVal('gpNonOp_m2Global', 0.14),
            gpNonOp_m3: parseGlobalVal('gpNonOp_m3Global', 0.30),
            gpNonOp_m4_12: parseGlobalVal('gpNonOp_m4_12Global', 0.00),
            gpOp_m1: parseGlobalVal('gpOp_m1Global', 0.23),
            gpOp_m2: parseGlobalVal('gpOp_m2Global', 0.50),
            gpOp_m3: parseGlobalVal('gpOp_m3Global', 0.60),
            gpOp_m4_12: parseGlobalVal('gpOp_m4_12Global', 0.00),
            gpCpsp_m1: parseGlobalVal('gpCpsp_m1Global', 0.00),
            gpCpsp_m2: parseGlobalVal('gpCpsp_m2Global', 0.00),
            gpCpsp_m3: parseGlobalVal('gpCpsp_m3Global', 0.00),
            gpCpsp: parseGlobalVal('gpCpspGlobal', 0.61),
            specNonOp_m1: parseGlobalVal('specNonOp_m1Global', 0.10),
            specNonOp_m2: parseGlobalVal('specNonOp_m2Global', 0.10),
            specNonOp_m3: parseGlobalVal('specNonOp_m3Global', 0.10),
            specNonOp_m4_12: parseGlobalVal('specNonOp_m4_12Global', 0.00),
            specOp_m1: parseGlobalVal('specOp_m1Global', 0.20),
            specOp_m2: parseGlobalVal('specOp_m2Global', 0.20),
            specOp_m3: parseGlobalVal('specOp_m3Global', 0.20),
            specOp_m4_12: parseGlobalVal('specOp_m4_12Global', 0.00),
            specCpsp_m1: parseGlobalVal('specCpsp_m1Global', 0.00),
            specCpsp_m2: parseGlobalVal('specCpsp_m2Global', 0.00),
            specCpsp_m3: parseGlobalVal('specCpsp_m3Global', 0.00),
            specCpsp: parseGlobalVal('specCpspGlobal', 0.30)
        };

        // Apply overrides from Sandbox sidebar
        g.utilPainFree = parseGlobalVal('utilPf' + suffix, g.utilPainFree);
        g.utilNonOpioid = parseGlobalVal('utilNonOp' + suffix, g.utilNonOpioid);
        g.utilOpioid = parseGlobalVal('utilOpioid' + suffix, g.utilOpioid);
        g.utilCPSP = parseGlobalVal('utilCpsp' + suffix, g.utilCPSP);
        g.costGP = parseGlobalVal('costGP' + suffix, g.costGP);
        g.costSpecialist = parseGlobalVal('costSpecialist' + suffix, g.costSpecialist);
        g.costChronicCare = parseGlobalVal('costChronicCare' + suffix, g.costChronicCare);
        g.costCaregiver = parseGlobalVal('costCaregiver' + suffix, g.costCaregiver);
        g.informalCareCPSP = parseGlobalVal('informalCareCPSP' + suffix, g.informalCareCPSP);
        g.informalCareOpioid = parseGlobalVal('informalCareOpioid' + suffix, g.informalCareOpioid);
        g.informalCareNonOpioid = parseGlobalVal('informalCareNonOpioid' + suffix, g.informalCareNonOpioid);
        g.popAge = parseGlobalVal('popAge' + suffix, g.popAge);
        g.pctMale = parseGlobalVal('pctMale' + suffix, g.pctMale);
        g.oneOffCost = parseGlobalVal('oneOffCost' + suffix, 0);
        g.sessionCost = parseGlobalVal('sessionCost' + suffix, 0);
        g.numSessions = parseGlobalVal('numSessions' + suffix, 1);

        const rCost = parseGlobalVal('roboticsCost' + suffix, 0);
        vrCost += rCost;

        // Perform multi-year projection loops
        const yearsSavings = [];
        const yearsProductivity = [];
        const labels = [];

        let cumulativeHealthSavings = 0;
        let cumulativeProdSavings = 0;

        let annualHealthSavings = 0;
        let annualProdSavings = 0;
        let annualQalyGained = 0;

        let annualCpspPrevented = 0;
        let annualGpAvoided = 0;
        let annualSpecAvoided = 0;
        let annualOpioidMonthsSaved = 0;
        
        let annualAbsenteeismSaved = 0;
        let annualCaregiverHoursSaved = 0;
        
        // Sim variables
        let modelParams = {
            ...g,
            wtp: wtp,
            vrCost: vrCost,
            opioidReduction: opioidReduction,
            cpspRisk: cpspRisk,
            currency: currentCurrency
        };

        // 1. Run Year 1 (12 cycles) to populate annual metrics
        const m1Yr = new MarkovModel({ ...modelParams, cycles: 12 });
        const r1Yr = m1Yr.run();

        // Calculate medical reductions
        const scHist = r1Yr.sc.cohortHistory;
        const vrHist = r1Yr.vr.cohortHistory;
        
        // Sum GP visits
        let scGp = 0, vrGp = 0, scSpec = 0, vrSpec = 0, scOpMonths = 0, vrOpMonths = 0;
        let scCaregiverHrs = 0, vrCaregiverHrs = 0;

        for (let i = 0; i < 12; i++) {
            // SC GP visits
            scGp += scHist[i][0] * (i===0?g.gpPF_m1:(i===1?g.gpPF_m2:(i===2?g.gpPF_m3:g.gpPF_m4_12))) +
                    scHist[i][1] * (i===0?g.gpNonOp_m1:(i===1?g.gpNonOp_m2:(i===2?g.gpNonOp_m3:g.gpNonOp_m4_12))) +
                    scHist[i][2] * (i===0?g.gpOp_m1:(i===1?g.gpOp_m2:(i===2?g.gpOp_m3:g.gpOp_m4_12))) +
                    scHist[i][3] * (i===0?g.gpCpsp_m1:(i===1?g.gpCpsp_m2:(i===2?g.gpCpsp_m3:g.gpCpsp)));

            // VR GP visits
            vrGp += vrHist[i][0] * (i===0?g.gpPF_m1:(i===1?g.gpPF_m2:(i===2?g.gpPF_m3:g.gpPF_m4_12))) +
                    vrHist[i][1] * (i===0?g.gpNonOp_m1:(i===1?g.gpNonOp_m2:(i===2?g.gpNonOp_m3:g.gpNonOp_m4_12))) +
                    vrHist[i][2] * (i===0?g.gpOp_m1:(i===1?g.gpOp_m2:(i===2?g.gpOp_m3:g.gpOp_m4_12))) +
                    vrHist[i][3] * (i===0?g.gpCpsp_m1:(i===1?g.gpCpsp_m2:(i===2?g.gpCpsp_m3:g.gpCpsp)));

            // SC specialist
            scSpec += scHist[i][1] * (i===0?g.specNonOp_m1:(i===1?g.specNonOp_m2:(i===2?g.specNonOp_m3:g.specNonOp_m4_12))) +
                      scHist[i][2] * (i===0?g.specOp_m1:(i===1?g.specOp_m2:(i===2?g.specOp_m3:g.specOp_m4_12))) +
                      scHist[i][3] * (i===0?g.specCpsp_m1:(i===1?g.specCpsp_m2:(i===2?g.specCpsp_m3:g.specCpsp)));

            // VR specialist
            vrSpec += vrHist[i][1] * (i===0?g.specNonOp_m1:(i===1?g.specNonOp_m2:(i===2?g.specNonOp_m3:g.specNonOp_m4_12))) +
                      vrHist[i][2] * (i===0?g.specOp_m1:(i===1?g.specOp_m2:(i===2?g.specOp_m3:g.specOp_m4_12))) +
                      vrHist[i][3] * (i===0?g.specCpsp_m1:(i===1?g.specCpsp_m2:(i===2?g.specCpsp_m3:g.specCpsp)));

            scOpMonths += scHist[i][2];
            vrOpMonths += vrHist[i][2];

            // Caregiver hours
            scCaregiverHrs += scHist[i][1]*g.informalCareNonOpioid + scHist[i][2]*g.informalCareOpioid + scHist[i][3]*g.informalCareCPSP;
            vrCaregiverHrs += vrHist[i][1]*g.informalCareNonOpioid + vrHist[i][2]*g.informalCareOpioid + vrHist[i][3]*g.informalCareCPSP;
        }

        annualGpAvoided = Math.round((scGp - vrGp) * cohortSize);
        annualSpecAvoided = Math.round((scSpec - vrSpec) * cohortSize);
        annualOpioidMonthsSaved = Math.round((scOpMonths - vrOpMonths) * cohortSize);
        annualCpspPrevented = Math.round((scHist[11][3] - vrHist[11][3]) * cohortSize);

        // Productivity model:
        let productivityLossSC = 0, productivityLossVR = 0;
        for (let i = 0; i < 12; i++) {
            productivityLossSC += scHist[i][1] * 0.20 + scHist[i][2] * 0.50 + scHist[i][3] * 0.80;
            productivityLossVR += vrHist[i][1] * 0.20 + vrHist[i][2] * 0.50 + vrHist[i][3] * 0.80;
        }
        
        annualAbsenteeismSaved = Math.round((productivityLossSC - productivityLossVR) * 4.33 * cohortSize * employmentRate);
        annualProdSavings = annualAbsenteeismSaved * weeklyEarnings;

        // Caregiver respite
        annualCaregiverHoursSaved = Math.round((scCaregiverHrs - vrCaregiverHrs) * cohortSize);
        
        // Direct healthcare savings
        annualHealthSavings = (r1Yr.sc.totalCosts - r1Yr.vr.totalCosts) * cohortSize;
        annualQalyGained = r1Yr.incQaly * cohortSize * 0.5231;

        // 2. Perform year-by-year projections for charts
        let rateVal = currentCurrency === 'GBP' ? 0.854 : 1.0;
        for (let y = 1; y <= horizonYears; y++) {
            const tempM = new MarkovModel({ ...modelParams, cycles: y * 12 });
            const tempR = tempM.run();
            
            // Health system savings
            let totalH = (tempR.sc.totalCosts - tempR.vr.totalCosts) * cohortSize;
            yearsSavings.push(totalH);

            // Add productivity savings
            let scProd = 0, vrProd = 0;
            let tempScH = tempR.sc.cohortHistory;
            let tempVrH = tempR.vr.cohortHistory;
            for (let i = 0; i < y * 12; i++) {
                let hIdx = Math.min(i, tempScH.length - 1);
                scProd += tempScH[hIdx][1] * 0.20 + tempScH[hIdx][2] * 0.50 + tempScH[hIdx][3] * 0.80;
                vrProd += tempVrH[hIdx][1] * 0.20 + tempVrH[hIdx][2] * 0.50 + tempVrH[hIdx][3] * 0.80;
            }
            let totalProd = (scProd - vrProd) * 4.33 * cohortSize * employmentRate * weeklyEarnings;
            yearsProductivity.push(totalH + totalProd);

            labels.push(`Year ${y}`);
        }

        // Final Horizon values
        cumulativeHealthSavings = yearsSavings[horizonYears - 1];
        cumulativeProdSavings = yearsProductivity[horizonYears - 1] - cumulativeHealthSavings;
        let totalNetSocietalVal = cumulativeHealthSavings + cumulativeProdSavings + (annualQalyGained * horizonYears * wtp);

        // Update KPIs
        const symb = currentCurrency === 'GBP' ? '£' : '€';
        document.getElementById('kpiSocHealthSavings').textContent = `${symb}${Math.round(cumulativeHealthSavings).toLocaleString()}`;
        document.getElementById('kpiSocProdSavings').textContent = `${symb}${Math.round(cumulativeProdSavings).toLocaleString()}`;
        document.getElementById('kpiSocNetValue').textContent = `${symb}${Math.round(totalNetSocietalVal).toLocaleString()}`;
        document.getElementById('kpiSocQalyGained').textContent = (annualQalyGained * horizonYears).toFixed(2);

        // Update table indicators
        document.getElementById('socCpspPrevented').textContent = `${annualCpspPrevented.toLocaleString()} cases`;
        document.getElementById('socGpAvoided').textContent = `${annualGpAvoided.toLocaleString()} visits`;
        document.getElementById('socSpecAvoided').textContent = `${annualSpecAvoided.toLocaleString()} visits`;
        document.getElementById('socOpioidMonthsSaved').textContent = `${annualOpioidMonthsSaved.toLocaleString()} months`;
        
        document.getElementById('socAbsenteeismSaved').textContent = `${annualAbsenteeismSaved.toLocaleString()} weeks`;
        document.getElementById('socCaregiverHoursSaved').textContent = `${annualCaregiverHoursSaved.toLocaleString()} hours`;
        document.getElementById('socCaregiverCostSaved').textContent = `${symb}${Math.round(annualCaregiverHoursSaved * g.costCaregiver * rateVal).toLocaleString()}`;
        
        let perPatSavingsVal = (totalNetSocietalVal / cohortSize);
        document.getElementById('socPerPatientSavings').textContent = `${symb}${Math.round(perPatSavingsVal).toLocaleString()}`;

        // Toggle badge state
        const badge = document.getElementById('societalRoiStatus');
        if (cumulativeHealthSavings >= 0) {
            badge.textContent = 'HEALTHCARE PAYBACK';
            badge.style.color = '#10b981';
            badge.style.borderColor = '#10b981';
            badge.style.background = 'rgba(16,185,129,0.1)';
        } else if (totalNetSocietalVal >= 0) {
            badge.textContent = 'SOCIETAL PAYBACK';
            badge.style.color = '#a855f7';
            badge.style.borderColor = '#a855f7';
            badge.style.background = 'rgba(168,85,247,0.1)';
        } else {
            badge.textContent = 'NET DEFICIT';
            badge.style.color = '#ef4444';
            badge.style.borderColor = '#ef4444';
            badge.style.background = 'rgba(239,68,68,0.1)';
        }

        // Render ROI timeline chart
        const ctx = document.getElementById('societalRoiChart').getContext('2d');
        if (societalChartInstance) {
            societalChartInstance.destroy();
        }

        societalChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Healthcare Payer Savings',
                        data: yearsSavings,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    },
                    {
                        label: 'Full Societal Economic Benefit',
                        data: yearsProductivity,
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#cbd5e1',
                            font: { size: 10 }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#cbd5e1' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#cbd5e1',
                            callback: (v) => {
                                if (Math.abs(v) >= 1e6) return symb + (v / 1e6).toFixed(1) + 'M';
                                if (Math.abs(v) >= 1e3) return symb + (v / 1e3).toFixed(0) + 'k';
                                return symb + v;
                            }
                        }
                    }
                }
            }
        });
    }

    // Link and Synchronize range sliders and number input elements across dashboards
    function linkSliderAndNum(sliderId, numId, runCb) {
        const slider = document.getElementById(sliderId);
        const num = document.getElementById(numId);
        if (slider && num) {
            slider.addEventListener('input', (e) => {
                num.value = e.target.value;
                if (typeof runCb === 'function') runCb();
            });
            num.addEventListener('input', (e) => {
                slider.value = e.target.value;
                if (typeof runCb === 'function') runCb();
            });
        }
    }

    // Bind sync links
    // 1. VR Model Tab
    linkSliderAndNum('vrCost', 'vrCostNum', window.updateDashboardVr || (() => {}));
    linkSliderAndNum('opioidReduction', 'opioidReductionNum', window.updateDashboardVr || (() => {}));
    linkSliderAndNum('cpspRisk', 'cpspRiskNum', window.updateDashboardVr || (() => {}));

    // 2. Sandbox Tab
    linkSliderAndNum('vrCostAdv', 'vrCostNumAdv', window.updateDashboardAdv || (() => {}));
    linkSliderAndNum('opioidReductionAdv', 'opioidReductionNumAdv', window.updateDashboardAdv || (() => {}));
    linkSliderAndNum('cpspRiskAdv', 'cpspRiskNumAdv', window.updateDashboardAdv || (() => {}));

    // 3. PLP Tab
    linkSliderAndNum('vrCostPlp', 'vrCostNumPlp', window.updateDashboardPlp || (() => {}));
    linkSliderAndNum('painReductionPlp', 'painReductionNumPlp', window.updateDashboardPlp || (() => {}));
    linkSliderAndNum('plpRiskPlp', 'plpRiskNumPlp', window.updateDashboardPlp || (() => {}));

    // Bind event update triggers from advanced inputs to sync with societal tab
    const advancedElIds = ['wtpAdv', 'vrCostAdv', 'opioidReductionAdv', 'cpspRiskAdv', 'wtpPlp', 'vrCostPlp', 'painReductionPlp', 'plpRiskPlp'];
    advancedElIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => { if (tabSocietal.classList.contains('active')) updateSocietalForecast(); if (typeof updateHtaAnalysis === 'function') updateHtaAnalysis(); });
    });


    // NICE & UK HTA Pathways Assessment Engine
    function updateHtaAnalysis() {
        const prefix = lastActiveDashboard === 'plp' ? 'plp' : 'adv';
        const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        const isPlp = prefix === 'plp';

        // Fetch inputs from the last active dashboard
        const wtp = parseFloat(document.getElementById('wtp' + cap).value) || 20000;
        const vrCost = parseFloat(document.getElementById('vrCost' + cap).value) || 40.55;
        const efficacy = parseFloat(document.getElementById(isPlp ? 'painReductionPlp' : 'opioidReductionAdv').value) || 2.8;
        const baseRisk = parseFloat(document.getElementById(isPlp ? 'plpRiskPlp' : 'cpspRiskAdv').value) || 15;

        // Perform Markov simulation using current dashboard settings
        let g = {
            utilPainFree: parseGlobalVal('utilPf' + cap, 1.0),
            utilNonOpioid: parseGlobalVal('utilNonOp' + cap, 0.93),
            utilOpioid: parseGlobalVal('utilOpioid' + cap, 0.61),
            utilCPSP: parseGlobalVal('utilCpsp' + cap, 0.59),
            costGP: parseGlobalVal('costGP' + cap, 32.04),
            costSpecialist: parseGlobalVal('costSpecialist' + cap, 225.00),
            costChronicCare: parseGlobalVal('costChronicCare' + cap, 119.51),
            costCaregiver: parseGlobalVal('costCaregiver' + cap, 19.51),
            informalCareCPSP: parseGlobalVal('informalCareCPSP' + cap, 20),
            informalCareOpioid: parseGlobalVal('informalCareOpioid' + cap, 20),
            informalCareNonOpioid: parseGlobalVal('informalCareNonOpioid' + cap, 8),
            popAge: parseGlobalVal('popAge' + cap, 65),
            pctMale: parseGlobalVal('pctMale' + cap, 0.50),
            oneOffCost: parseGlobalVal('oneOffCost' + cap, 0),
            sessionCost: parseGlobalVal('sessionCost' + cap, 0),
            numSessions: parseGlobalVal('numSessions' + cap, 1),
            wtp: wtp,
            vrCost: vrCost,
            opioidReduction: efficacy,
            cpspRisk: baseRisk,
            currency: currentCurrency
        };
        
        const rCost = parseGlobalVal('roboticsCost' + cap, 0);
        g.vrCost += rCost;

        const m = new MarkovModel(g);
        m.baseParams.currency = currentCurrency;
        const res = m.run();

        // 1. NICE Health Technology Evaluation (HTE) Pathways
        const standardWtpGbp = 20000;
        let standardWtp = standardWtpGbp;
        if (currentCurrency !== 'GBP') {
            standardWtp = Math.round(standardWtpGbp / rate_eur_to_gbp);
        }

        let hteStatus = '';
        let hteColor = '';
        let barPct = 0;

        if (res.incQaly <= 0) {
            hteStatus = 'NOT COST-EFFECTIVE: Clinically dominated (negative health benefit). Standard care preferred.';
            hteColor = '#ef4444';
            barPct = 0;
        } else {
            const currentIcer = res.incCost / res.incQaly;
            if (currentIcer <= standardWtp) {
                hteStatus = `COST-EFFECTIVE: ICER is ${formatCurrency(currentIcer)}/QALY. Well below NICE standard threshold (${formatCurrency(standardWtp)}/QALY). Approved.`;
                hteColor = '#10b981';
                barPct = Math.min(100, Math.max(10, Math.round((standardWtp / currentIcer) * 50)));
            } else if (currentIcer <= standardWtp * 1.5) {
                hteStatus = `MARGINAL: ICER is ${formatCurrency(currentIcer)}/QALY. Exceeds primary £20k threshold but fits NHS highly specialized technology exceptions (up to £30k/QALY).`;
                hteColor = '#eab308';
                barPct = 65;
            } else {
                hteStatus = `NOT RECOMMENDED: ICER is ${formatCurrency(currentIcer)}/QALY. Significantly exceeds £30k/QALY upper HTA threshold. Requires discount or higher efficacy.`;
                hteColor = '#ef4444';
                barPct = 90;
            }
        }

        const hteEl = document.getElementById('htaHteResult');
        hteEl.textContent = hteStatus;
        hteEl.style.color = hteColor;
        document.getElementById('htaThresholdBar').style.backgroundColor = hteColor;
        document.getElementById('htaThresholdBar').style.width = barPct + '%';

        // 2. NICE Evidence Standards Framework (ESF) for Digital Health
        let esfStatus = '';
        let esfColor = '';
        if (efficacy < 1.0) {
            esfStatus = 'Tier C Evidentiary Match. Current trial-efficacy is insufficient (< 1%). Randomized Controlled Trials (RCTs) or comparative studies required.';
            esfColor = '#ef4444';
        } else if (efficacy < 5.0) {
            esfStatus = 'Tier C Evidentiary Match. Meets minimum trial efficacy bounds. Requires formal real-world evidence (RWE) registries to support NICE standard recommendation.';
            esfColor = '#eab308';
        } else {
            esfStatus = 'Tier C Evidentiary Match. High clinical efficacy (> 5%). Meets evidentiary standards for standard NHS commissioning pathways.';
            esfColor = '#10b981';
        }
        const esfEl = document.getElementById('htaEsfResult');
        esfEl.textContent = esfStatus;
        esfEl.style.color = esfColor;

        // 3. NICE Early Value Assessment (EVA)
        let evaStatus = '';
        let evaColor = '';
        if (res.nmb >= 0 && efficacy >= 2.0) {
            evaStatus = 'Strong candidate for EVA. High probability of standard commissioning. Eligible for early access program funding.';
            evaColor = '#10b981';
        } else if (res.nmb < 0 && efficacy > 1.0) {
            evaStatus = 'Moderate candidate. Promising clinical signal but economically unachievable. Access requires evidence generation under NICE conditional guidance.';
            evaColor = '#eab308';
        } else {
            evaStatus = 'Ineligible for Early Access. Insufficient efficacy to justify early NHS adoption funding.';
            evaColor = '#ef4444';
        }
        const evaEl = document.getElementById('htaEvaResult');
        evaEl.textContent = evaStatus;
        evaEl.style.color = evaColor;

        // 4. MHRA Software as a Medical Device (SaMD)
        const samdUse = document.getElementById('htaSamdDeviceClass').value;
        let samdStatus = '';
        let samdColor = '';
        if (samdUse === 'critical') {
            samdStatus = 'Class III (High Risk). Software impacts critical clinical outcomes. Requires MHRA Notified Body certification and UKCA mark audited clinical files.';
            samdColor = '#ef4444';
        } else if (samdUse === 'treatment') {
            samdStatus = 'Class IIa/IIb (Medium Risk). Software directly treats pain states. Requires Notified Body audit of Software Life Cycle (EN 62304) and ISO 13485 QMS.';
            samdColor = '#eab308';
        } else {
            samdStatus = 'Class I (Low Risk). Software provides monitoring or journaling. Eligible for UKCA self-declaration pathway.';
            samdColor = '#10b981';
        }
        const mhraEl = document.getElementById('htaMhraResult');
        mhraEl.textContent = samdStatus;
        mhraEl.style.color = samdColor;

        // 5. NHS Digital Technology Assessment Criteria (DTAC)
        const dtacSafety = document.getElementById('dtacSafety').checked;
        const dtacCyber = document.getElementById('dtacCyber').checked;
        const dtacGdpr = document.getElementById('dtacGdpr').checked;
        const dtacInterop = document.getElementById('dtacInterop').checked;

        let dtacStatus = '';
        let dtacColor = '';
        let dtacCount = (dtacSafety?1:0) + (dtacCyber?1:0) + (dtacGdpr?1:0) + (dtacInterop?1:0);

        if (dtacCount === 4) {
            dtacStatus = 'DTAC Approved. Meets clinical safety (DCB0129), data protection (GDPR), cyber security (Essentials+), and interoperability standards.';
            dtacColor = '#10b981';
        } else if (dtacSafety && dtacCyber && dtacGdpr) {
            dtacStatus = 'DTAC Conditional. Missing interoperability standards. Restricts NHS system integrations.';
            dtacColor = '#eab308';
        } else {
            dtacStatus = 'DTAC Blocked. Fails to meet core pre-requisites (Clinical Safety, Cybersecurity, or GDPR). Restricts deployment inside the NHS.';
            dtacColor = '#ef4444';
        }
        const dtacEl = document.getElementById('htaDtacResult');
        dtacEl.textContent = dtacStatus;
        dtacEl.style.color = dtacColor;

        // 6. Clinical Guideline NG211 Compliance
        const rehabContext = document.getElementById('htaClinicalContext').value;
        let ngResult = '';
        let ngColor = '';
        if (rehabContext === 'neuro' && isPlp) {
            ngResult = 'Complies with Section 1.5 of NG211. Active neuropathic pain management using digital modalities to prevent pain chronification.';
            ngColor = '#10b981';
        } else if (rehabContext === 'ortho' && !isPlp) {
            ngResult = 'Complies with Section 1.2 of NG211. Early active mobilization post major orthopaedic surgeries to decrease opioid dependency.';
            ngColor = '#10b981';
        } else {
            ngResult = 'Partial Match. Clinical modality matches rehabilitation context, but requires explicit protocol configuration for clinical team alignment.';
            ngColor = '#eab308';
        }
        const ngEl = document.getElementById('htaNg211Result');
        ngEl.textContent = ngResult;
        ngEl.style.color = ngColor;

        // 7. Overall Market Access Summary
        const badge = document.getElementById('htaOverallStatus');
        let reportHtml = '';
        const curSym = currentCurrency === 'GBP' ? '£' : '€';

        if (res.nmb >= 0 && dtacCount === 4 && samdUse !== 'critical') {
            badge.textContent = 'READY FOR AUDIT';
            badge.style.color = '#10b981';
            badge.style.borderColor = '#10b981';
            badge.style.background = 'rgba(16,185,129,0.1)';
            
            reportHtml = `<p>The current system configuration meets the NICE cost-effectiveness criteria at a threshold of <strong>${formatCurrency(wtp)}/QALY</strong> with an incremental Net Benefit of <strong>${formatCurrency(res.nmb)}</strong> per patient. Fulfilling NHS DTAC and mapping to NG211 rehabilitation criteria positions the technology for standard regional commissioning under the NICE Health Technology Evaluation pathway.</p>`;
        } else if (res.nmb >= 0) {
            badge.textContent = 'CONDITIONAL ECONOMIC FIT';
            badge.style.color = '#eab308';
            badge.style.borderColor = '#eab308';
            badge.style.background = 'rgba(234,179,8,0.1)';
            
            reportHtml = `<p>While the economic evaluation proves cost-effective (NMB = <strong>${formatCurrency(res.nmb)}</strong>), the regulatory pathway requires addressing outstanding compliance gaps (NHS DTAC audit failures or MHRA Software classification audits). Review ISO 13485 QMS alignment and ensure interoperability standard mappings before regional NHS procurement submission.</p>`;
        } else {
            badge.textContent = 'NOT COMMISSIONABLE';
            badge.style.color = '#ef4444';
            badge.style.borderColor = '#ef4444';
            badge.style.background = 'rgba(239,68,68,0.1)';
            
            reportHtml = `<p>The digital health intervention is currently <strong>not commissionable</strong> because it exceeds standard cost-effectiveness bounds (Net Monetary Benefit is negative: <strong>${formatCurrency(res.nmb)}</strong>). To secure regional NHS funding, increase clinical efficacy (currently <strong>${efficacy}%</strong>) or seek standard care acquisition discount strategies to lower the acquisition cost of <strong>${formatCurrency(vrCost)}</strong>.</p>`;
        }

        document.getElementById('htaSummaryReport').innerHTML = reportHtml;
    }

    // Bind triggers to re-run HTA reports
    const htaTriggerIds = ['htaClinicalContext', 'htaSamdDeviceClass', 'dtacSafety', 'dtacCyber', 'dtacGdpr', 'dtacInterop'];
    htaTriggerIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateHtaAnalysis);
    });



    // Capital System Budget Solver Engine
    let solvedMaxCeBudgetPerPatient = 0;
    let solvedMaxCsBudgetPerPatient = 0;

    function solveCapitalBudget() {
        const prefix = 'plp';
        const cap = 'Plp';
        const wtp = parseFloat(document.getElementById('wtpPlp').value) || 20000;
        const vrCost = parseFloat(document.getElementById('vrCostPlp').value) || 40.55;
        const efficacy = parseFloat(document.getElementById('painReductionPlp').value) || 2.8;
        const baseRisk = parseFloat(document.getElementById('plpRiskPlp').value) || 15;

        // Base case parameters excluding capital cost
        let g = {
            utilPainFree: parseGlobalVal('utilPfPlp', 1.0),
            utilNonOpioid: parseGlobalVal('utilNonOpPlp', 0.93),
            utilOpioid: parseGlobalVal('utilOpioidPlp', 0.61),
            utilCPSP: parseGlobalVal('utilCpspPlp', 0.59),
            costGP: parseGlobalVal('costGPPlp', 32.04),
            costSpecialist: parseGlobalVal('costSpecialistPlp', 225.00),
            costChronicCare: parseGlobalVal('costChronicCarePlp', 119.51),
            costCaregiver: parseGlobalVal('costCaregiverPlp', 19.51),
            informalCareCPSP: parseGlobalVal('informalCareCPSPPlp', 20),
            informalCareOpioid: parseGlobalVal('informalCareOpioidPlp', 20),
            informalCareNonOpioid: parseGlobalVal('informalCareNonOpioidPlp', 8),
            popAge: parseGlobalVal('popAgePlp', 65),
            pctMale: parseGlobalVal('pctMalePlp', 0.50),
            oneOffCost: 0, // Force 0 to find the headroom
            sessionCost: parseGlobalVal('sessionCostPlp', 0),
            numSessions: parseGlobalVal('numSessionsPlp', 1),
            wtp: wtp,
            vrCost: vrCost,
            opioidReduction: efficacy,
            cpspRisk: baseRisk,
            currency: currentCurrency
        };

        const m = new MarkovModel(g);
        const res = m.run();

        // Sync current patients per system from PLP panel to the modal input first
        const currentPatients = parseFloat(document.getElementById('patientsPerSystemPlp').value) || 100;
        document.getElementById('budgetPatientsPerSystem').value = currentPatients;

        // Calculate budgets
        solvedMaxCeBudgetPerPatient = Math.max(0, res.nmb);
        solvedMaxCsBudgetPerPatient = Math.max(0, -res.incCost);

        updateBudgetModalValues();

        document.getElementById('systemBudgetModal').style.display = 'flex';
    }

    function updateBudgetModalValues() {
        const patients = parseFloat(document.getElementById('budgetPatientsPerSystem').value) || 100;
        const maxCeSystem = solvedMaxCeBudgetPerPatient * patients;
        const maxCsSystem = solvedMaxCsBudgetPerPatient * patients;

        const solvedMaxCombinedBudgetPerPatient = Math.min(solvedMaxCeBudgetPerPatient, solvedMaxCsBudgetPerPatient);
        const maxCombinedSystem = solvedMaxCombinedBudgetPerPatient * patients;

        document.getElementById('budgetCeRange').textContent = formatCurrency(maxCeSystem);
        document.getElementById('budgetCePerPatient').textContent = `Up to ${formatCurrency(solvedMaxCeBudgetPerPatient)} / patient`;
        
        document.getElementById('budgetCsRange').textContent = formatCurrency(maxCsSystem);
        document.getElementById('budgetCsPerPatient').textContent = `Up to ${formatCurrency(solvedMaxCsBudgetPerPatient)} / patient`;

        document.getElementById('budgetCombinedRange').textContent = formatCurrency(maxCombinedSystem);
        document.getElementById('budgetCombinedPerPatient').textContent = `Up to ${formatCurrency(solvedMaxCombinedBudgetPerPatient)} / patient`;
    }

    // Modal listeners
    const btnCalcSystemBudgetPlp = document.getElementById('btnCalcSystemBudgetPlp');
    if (btnCalcSystemBudgetPlp) {
        btnCalcSystemBudgetPlp.addEventListener('click', solveCapitalBudget);
    }

    const closeBudgetModalBtn = document.getElementById('closeBudgetModalBtn');
    if (closeBudgetModalBtn) {
        closeBudgetModalBtn.addEventListener('click', () => {
            document.getElementById('systemBudgetModal').style.display = 'none';
        });
    }

    const budgetPatientsInput = document.getElementById('budgetPatientsPerSystem');
    if (budgetPatientsInput) {
        budgetPatientsInput.addEventListener('input', updateBudgetModalValues);
    }

    window.solveCapitalBudget = solveCapitalBudget;
    window.updateBudgetModalValues = updateBudgetModalValues;

    const btnApplyBudgetLimit = document.getElementById('btnApplyBudgetLimit');
    if (btnApplyBudgetLimit) {
        btnApplyBudgetLimit.addEventListener('click', () => {
            const oneOffInput = document.getElementById('oneOffCostPlp');
            const patientsInput = document.getElementById('patientsPerSystemPlp');
            const patients = parseFloat(document.getElementById('budgetPatientsPerSystem').value) || 100;
            const solvedMaxCombinedBudgetPerPatient = Math.min(solvedMaxCeBudgetPerPatient, solvedMaxCsBudgetPerPatient);
            const maxCombinedSystem = solvedMaxCombinedBudgetPerPatient * patients;
            
            // Set patients per system to match solver modal count
            if (patientsInput) {
                patientsInput.value = patients;
            }
            
            if (oneOffInput) {
                oneOffInput.value = maxCombinedSystem.toFixed(2);
                oneOffInput.dispatchEvent(new Event('input'));
            }
            document.getElementById('systemBudgetModal').style.display = 'none';
        });
    }



    // Academic LaTeX math rendering engine using KaTeX
    function renderMathFormulas() {
        if (typeof katex !== 'undefined') {
            document.querySelectorAll('.latex-math').forEach(el => {
                try {
                    katex.render(el.textContent, el, { throwOnError: false, displayMode: false });
                } catch(e) {
                    console.log("KaTeX inline error: " + e);
                }
            });
            document.querySelectorAll('.latex-math-block').forEach(el => {
                try {
                    katex.render(el.textContent, el, { throwOnError: false, displayMode: true });
                } catch(e) {
                    console.log("KaTeX block error: " + e);
                }
            });
        }
    }

    // Auto-trigger rendering on equations tab click
    btnTabEquations.addEventListener('click', renderMathFormulas);


    // CSV Export Handler
    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const symb = currentCurrency === 'GBP' ? '£' : '€';
            
            // Gather Table 1 inputs
            const tableParams = {};
            globalInputIds.forEach(id => {
                const el = document.getElementById(id);
                tableParams[id] = el ? el.value : '';
            });

            // Gather active dashboard settings
            const wtpVal = document.getElementById('wtpAdv') ? document.getElementById('wtpAdv').value : 20000;
            const vrCostVal = document.getElementById('vrCostAdv') ? document.getElementById('vrCostAdv').value : 40.55;
            const opioidReductionVal = document.getElementById('opioidReductionAdv') ? document.getElementById('opioidReductionAdv').value : 2.8;
            const cpspRiskVal = document.getElementById('cpspRiskAdv') ? document.getElementById('cpspRiskAdv').value : 15;
            
            // Gather societal settings
            const cohortSizeVal = document.getElementById('cohortSizeSocietalNum') ? document.getElementById('cohortSizeSocietalNum').value : 10000;
            const weeklyEarningsVal = document.getElementById('weeklyEarningsSocietalNum') ? document.getElementById('weeklyEarningsSocietalNum').value : 650;
            const employmentRateVal = document.getElementById('employmentRateSocietalNum') ? document.getElementById('employmentRateSocietalNum').value : 60;
            const horizonVal = document.getElementById('horizonSocietalNum') ? document.getElementById('horizonSocietalNum').value : 5;

            // Gather active KPI values from the DOM
            const kpiIncCost = document.getElementById('kpiIncCostAdv') ? document.getElementById('kpiIncCostAdv').textContent : '';
            const kpiIncQaly = document.getElementById('kpiIncQalyAdv') ? document.getElementById('kpiIncQalyAdv').textContent : '';
            const kpiIcer = document.getElementById('kpiIcerAdv') ? document.getElementById('kpiIcerAdv').textContent : '';
            const kpiNmb = document.getElementById('kpiNmbAdv') ? document.getElementById('kpiNmbAdv').textContent : '';

            // Gather societal KPIs from DOM
            const socHealthSavings = document.getElementById('kpiSocHealthSavings') ? document.getElementById('kpiSocHealthSavings').textContent : '';
            const socProdSavings = document.getElementById('kpiSocProdSavings') ? document.getElementById('kpiSocProdSavings').textContent : '';
            const socNetVal = document.getElementById('kpiSocNetValue') ? document.getElementById('kpiSocNetValue').textContent : '';
            const socQaly = document.getElementById('kpiSocQalyGained') ? document.getElementById('kpiSocQalyGained').textContent : '';

            let csvLines = [
                '"Category","Parameter ID / Metric","Parameter / Metric Name","Value","Units"',
                `"Configuration","currency","Active Currency","${currentCurrency}",""`,
                `"Configuration","wtpAdv","Sandbox Willingness to Pay","${wtpVal}","${symb}"`,
                `"Configuration","vrCostAdv","Sandbox VR Cost","${vrCostVal}","${symb}"`,
                `"Configuration","opioidReductionAdv","Sandbox Opioid Efficacy","${opioidReductionVal}","%"`,
                `"Configuration","cpspRiskAdv","Sandbox CPSP Risk","${cpspRiskVal}","%"`,
                
                `"Societal Inputs","cohortSize","Cohort Size","${cohortSizeVal}","Patients"`,
                `"Societal Inputs","weeklyEarnings","Avg Weekly Earnings","${weeklyEarningsVal}","${symb}"`,
                `"Societal Inputs","employmentRate","Employment Rate","${employmentRateVal}","%"`,
                `"Societal Inputs","horizon","Forecast Horizon","${horizonVal}","Years"`,

                `"Sandbox Result","incCost","Incremental Cost","${kpiIncCost.replace(/,/g, '')}","${symb}"`,
                `"Sandbox Result","incQaly","Incremental QALYs","${kpiIncQaly}","QALYs"`,
                `"Sandbox Result","icer","ICER","${kpiIcer.replace(/,/g, '')}","${symb}/QALY"`,
                `"Sandbox Result","nmb","Net Monetary Benefit","${kpiNmb.replace(/,/g, '')}","${symb}"`,

                `"Societal Results","socHealthSavings","Cumulative Health Savings","${socHealthSavings.replace(/,/g, '')}","${symb}"`,
                `"Societal Results","socProdSavings","Cumulative Productivity Savings","${socProdSavings.replace(/,/g, '')}","${symb}"`,
                `"Societal Results","socNetVal","Total Net Societal Value","${socNetVal.replace(/,/g, '')}","${symb}"`,
                `"Societal Results","socQaly","Cohort QALYs Gained","${socQaly}","QALYs"`,
                '',
                '"Table 1 Parameters Grid","","","",""'
            ];

            for (const [key, val] of Object.entries(tableParams)) {
                csvLines.push(`"Table 1 Parameter","${key}","${key}","${val}",""`);
            }

            const csv = csvLines.join('\r\n');

            // Create download anchor
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `vr-health-econ-export-${currentCurrency}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

});