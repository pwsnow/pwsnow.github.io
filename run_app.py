with open('js/app.js', 'r') as f:
    app_js = f.read()

new_app_js = """// app.js

document.addEventListener('DOMContentLoaded', () => {

    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Inter', sans-serif";

    function setupDashboard(prefix) {
        const id = (base) => base + (prefix === 'adv' ? 'Adv' : '');
        
        const elements = {
            wtp: document.getElementById(id('wtp')),
            vrCost: document.getElementById(id('vrCost')),
            vrCostValue: document.getElementById(id('vrCostValue')),
            opioidReduction: document.getElementById(id('opioidReduction')),
            opioidReductionValue: document.getElementById(id('opioidReductionValue')),
            cpspRisk: document.getElementById(id('cpspRisk')),
            cpspRiskValue: document.getElementById(id('cpspRiskValue')),
            
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

        let currentCurrency = 'EUR';
        const rate_eur_to_gbp = 0.854;

        let cePlaneChartInstance = null;
        let tornadoChartInstance = null;
        let headroomChartInstance = null;

        function formatCurrency(value) {
            if (currentCurrency === 'GBP') {
                return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
            }
            return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
        }

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
            
            if (prefix === 'adv') {
                params.roboticsCost = parseFloat(document.getElementById('roboticsCostAdv').value);
                params.roboticsReduction = parseFloat(document.getElementById('roboticsReductionAdv').value);
                
                params.utilPainFree = parseFloat(document.getElementById('utilPfAdv').value);
                params.utilNonOpioid = parseFloat(document.getElementById('utilNonOpAdv').value);
                params.utilOpioid = parseFloat(document.getElementById('utilOpioidAdv').value);
                params.utilCPSP = parseFloat(document.getElementById('utilCpspAdv').value);
                
                params.costNonOpioid = parseFloat(document.getElementById('costNonOpAdv').value);
                params.costOpioid = parseFloat(document.getElementById('costOpioidAdv').value);
                params.costCPSP = parseFloat(document.getElementById('costCpspAdv').value);
            }
            
            return params;
        }

        function updateLabelOutputs() {
            elements.vrCostValue.textContent = formatCurrency(elements.vrCost.value);
            elements.opioidReductionValue.textContent = `${elements.opioidReduction.value}%`;
            elements.cpspRiskValue.textContent = `${elements.cpspRisk.value}%`;
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
                data: { labels: results.tornado.data.map(d => d.label), datasets: [ { label: 'Low Impact Bound (NMB)', data: results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseNMB), backgroundColor: '#f59e0b' }, { label: 'High Impact Bound (NMB)', data: results.tornado.data.map(d => d.highImpactValue - results.tornado.baseNMB), backgroundColor: '#38bdf8' } ] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + formatCurrency(c.raw + results.tornado.baseNMB); } } } }, scales: { x: { title: { display: true, text: 'Change in Net Monetary Benefit vs Base Case' } } } }
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

            tornadoChartInstance.data.datasets[0].data = results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseNMB);
            tornadoChartInstance.data.datasets[1].data = results.tornado.data.map(d => d.highImpactValue - results.tornado.baseNMB);
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
                elements.btnEur.style.background = 'var(--accent-primary)';
                elements.btnEur.style.color = '#fff';
                elements.btnGbp.style.background = 'transparent';
                elements.btnGbp.style.color = 'var(--text-secondary)';
                elements.wtpLabel.textContent = 'Willingness to Pay (WTP) per QALY (€)';
                elements.vrCostLabel.textContent = 'VR Therapy Cost per Patient (€)';
                
                elements.wtp.value = Math.round(parseFloat(elements.wtp.value) / rate_eur_to_gbp);
                elements.vrCost.value = (parseFloat(elements.vrCost.value) / rate_eur_to_gbp).toFixed(2);
            }
            runModel();
        }

        elements.btnEur.addEventListener('click', () => setCurrency('EUR'));
        elements.btnGbp.addEventListener('click', () => setCurrency('GBP'));
        
        let presetE = document.getElementById(id('presetCostEffective'));
        let presetS = document.getElementById(id('presetCostSaving'));
        if (presetE) presetE.addEventListener('click', () => { elements.opioidReduction.value = 2.5; runModel(); });
        if (presetS) presetS.addEventListener('click', () => { elements.opioidReduction.value = 6.5; runModel(); });

        let listeners = [elements.wtp, elements.vrCost, elements.opioidReduction, elements.cpspRisk];
        if (prefix === 'adv') {
            listeners = listeners.concat([
                document.getElementById('roboticsCostAdv'), document.getElementById('roboticsReductionAdv'),
                document.getElementById('utilPfAdv'), document.getElementById('utilNonOpAdv'),
                document.getElementById('utilOpioidAdv'), document.getElementById('utilCpspAdv'),
                document.getElementById('costNonOpAdv'), document.getElementById('costOpioidAdv'),
                document.getElementById('costCpspAdv')
            ]);
        }
        listeners.forEach((el) => { if (el) el.addEventListener('input', runModel) });

        elements.resetBtn.addEventListener('click', () => {
            elements.wtp.value = currentCurrency === 'GBP' ? Math.round(20000 * rate_eur_to_gbp) : 20000;
            elements.vrCost.value = currentCurrency === 'GBP' ? (47.48 * rate_eur_to_gbp).toFixed(2) : 47.48;
            elements.opioidReduction.value = 2.8;
            elements.cpspRisk.value = 15;
            runModel();
        });

        runModel();
    }

    // Initialize both dashboards uniquely
    setupDashboard('vr');
    setupDashboard('adv');

    // Tab Switching Logic
    const btnTabVr = document.getElementById('btnTabVr');
    const btnTabAdv = document.getElementById('btnTabAdv');
    const tabVr = document.getElementById('tab-vr');
    const tabAdv = document.getElementById('tab-adv');

    btnTabVr.addEventListener('click', () => {
        btnTabVr.classList.add('active');
        btnTabAdv.classList.remove('active');
        tabVr.classList.add('active');
        tabAdv.classList.remove('active');
    });

    btnTabAdv.addEventListener('click', () => {
        btnTabAdv.classList.add('active');
        btnTabVr.classList.remove('active');
        tabAdv.classList.add('active');
        tabVr.classList.remove('active');
    });

});
"""

with open('js/app.js', 'w') as f:
    f.write(new_app_js)

print("Updated app.js")
