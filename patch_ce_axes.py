with open('index.html', 'r') as f:
    html = f.read()

# For the basic tab (tab-vr)
axis_controls_vr = """
            <details class="advanced-settings" style="margin-top:0.5rem; border:none;">
                <summary>CE Plane Axis Ranges</summary>
                <div class="advanced-grid">
                    <div class="input-group"><label>X Min (QALY)</label><input type="number" id="ceXMin" value="-2" step="0.5"></div>
                    <div class="input-group"><label>X Max (QALY)</label><input type="number" id="ceXMax" value="10" step="0.5"></div>
                    <div class="input-group"><label>Y Min (Cost)</label><input type="number" id="ceYMin" value="-100000" step="10000"></div>
                    <div class="input-group"><label>Y Max (Cost)</label><input type="number" id="ceYMax" value="100000" step="10000"></div>
                </div>
            </details>
            <div class="action-card">
"""

html = html.replace('<div class="action-card">', axis_controls_vr, 1)

# For the advanced tab (tab-adv)
axis_controls_adv = """
                <details class="advanced-settings">
                    <summary>CE Plane Axis Ranges</summary>
                    <div class="advanced-grid" style="grid-template-columns: 1fr 1fr; display:grid;">
                        <div class="input-group"><label>X Min (QALY)</label><input type="number" id="ceXMinAdv" value="-2" step="0.5"></div>
                        <div class="input-group"><label>X Max (QALY)</label><input type="number" id="ceXMaxAdv" value="10" step="0.5"></div>
                        <div class="input-group"><label>Y Min (Cost)</label><input type="number" id="ceYMinAdv" value="-100000" step="10000"></div>
                        <div class="input-group"><label>Y Max (Cost)</label><input type="number" id="ceYMaxAdv" value="100000" step="10000"></div>
                    </div>
                </details>
            </div>
"""

# Replace the last action-card in the file, which belongs to tab-adv
pieces = html.rsplit('            <div class="action-card">', 1)
html = pieces[0] + axis_controls_adv + pieces[1]  if len(pieces) > 1 else html

with open('index.html', 'w') as f:
    f.write(html)


with open('js/app.js', 'r') as f:
    appjs = f.read()

getinputs = """                cpspRisk: parseFloat(elements.cpspRisk.value),
                currency: currentCurrency,
                ceXMin: parseFloat(document.getElementById(id('ceXMin')).value),
                ceXMax: parseFloat(document.getElementById(id('ceXMax')).value),
                ceYMin: parseFloat(document.getElementById(id('ceYMin')).value),
                ceYMax: parseFloat(document.getElementById(id('ceYMax')).value)
            };"""

appjs = appjs.replace("cpspRisk: parseFloat(elements.cpspRisk.value),\n                currency: currentCurrency\n            };", getinputs)

listeners_block = """let listeners = [elements.wtp, elements.vrCost, elements.opioidReduction, elements.cpspRisk, 
                         document.getElementById(id('ceXMin')), document.getElementById(id('ceXMax')), 
                         document.getElementById(id('ceYMin')), document.getElementById(id('ceYMax'))];"""

appjs = appjs.replace("let listeners = [elements.wtp, elements.vrCost, elements.opioidReduction, elements.cpspRisk];", listeners_block)


updatecharts = """            cePlaneChartInstance.data.datasets[0].data = [{ x: results.incQaly, y: results.incCost }];
            cePlaneChartInstance.data.datasets[0].backgroundColor = results.nmb >= 0 ? '#10b981' : '#ef4444';
            cePlaneChartInstance.data.datasets[1].data = results.psa.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.options.scales.x.min = params.ceXMin;
            cePlaneChartInstance.options.scales.x.max = params.ceXMax;
            cePlaneChartInstance.options.scales.y.min = params.ceYMin;
            cePlaneChartInstance.options.scales.y.max = params.ceYMax;
            cePlaneChartInstance.options.scales.y.title.text = `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]`;
            cePlaneChartInstance.update();"""

appjs = appjs.replace("""            cePlaneChartInstance.data.datasets[0].data = [{ x: results.incQaly, y: results.incCost }];
            cePlaneChartInstance.data.datasets[0].backgroundColor = results.nmb >= 0 ? '#10b981' : '#ef4444';
            cePlaneChartInstance.data.datasets[1].data = results.psa.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.options.scales.y.title.text = `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]`;
            cePlaneChartInstance.update();""", updatecharts)

initcharts = """options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { min: params.ceXMin, max: params.ceXMax, title: { display: true, text: 'Incremental QALYs (ΔE)' } }, y: { min: params.ceYMin, max: params.ceYMax, title: { display: true, text: `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]` } } } }"""

appjs = appjs.replace("options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { title: { display: true, text: 'Incremental QALYs (ΔE)' } }, y: { title: { display: true, text: `Incremental Costs (ΔC) [${currentCurrency==='EUR'?'€':'£'}]` } } } }", initcharts)

with open('js/app.js', 'w') as f:
    f.write(appjs)
print("done")
