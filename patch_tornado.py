# Patch model.js
with open('js/model.js', 'r') as f:
    model_js = f.read()

model_find = """    runSensitivityAnalysis() {
        const baseResult = this.run();
        const baseNMB = baseResult.nmb;"""
model_repl = """    runSensitivityAnalysis() {
        const baseResult = this.run();
        const baseICER = baseResult.icer;"""
model_js = model_js.replace(model_find, model_repl)

model_find_2 = """            // Scenario Low (-20%)
            let p1 = { ...baseP }; p1[param.id] = pLow;
            let nmbLow = this.run(p1).nmb;

            // Scenario High (+20%)
            let p2 = { ...baseP }; p2[param.id] = pHigh;
            let nmbHigh = this.run(p2).nmb;

            let minNMB = Math.min(nmbLow, nmbHigh);
            let maxNMB = Math.max(nmbLow, nmbHigh);

            tornadoData.push({
                label: param.label,
                min: minNMB,
                max: maxNMB,
                lowImpactValue: nmbLow,
                highImpactValue: nmbHigh,
                spread: maxNMB - minNMB
            });"""
model_repl_2 = """            // Scenario Low (-20%)
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
            });"""
model_js = model_js.replace(model_find_2, model_repl_2)

model_find_3 = """        return {
            baseNMB,
            data: tornadoData
        };"""
model_repl_3 = """        return {
            baseICER,
            data: tornadoData
        };"""
model_js = model_js.replace(model_find_3, model_repl_3)

with open('js/model.js', 'w') as f:
    f.write(model_js)


# Patch app.js
with open('js/app.js', 'r') as f:
    app_js = f.read()

app_find = """            tornadoChartInstance = new Chart(tornadoCtx, {
                type: 'bar',
                data: { labels: results.tornado.data.map(d => d.label), datasets: [ { label: 'Low Impact Bound (NMB)', data: results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseNMB), backgroundColor: '#f59e0b' }, { label: 'High Impact Bound (NMB)', data: results.tornado.data.map(d => d.highImpactValue - results.tornado.baseNMB), backgroundColor: '#38bdf8' } ] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + formatCurrency(c.raw + results.tornado.baseNMB); } } } }, scales: { x: { title: { display: true, text: 'Change in Net Monetary Benefit vs Base Case' } } } }
            });"""
app_repl = """            tornadoChartInstance = new Chart(tornadoCtx, {
                type: 'bar',
                data: { labels: results.tornado.data.map(d => d.label), datasets: [ { label: 'Low Impact Bound (ICER)', data: results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseICER), backgroundColor: '#f59e0b' }, { label: 'High Impact Bound (ICER)', data: results.tornado.data.map(d => d.highImpactValue - results.tornado.baseICER), backgroundColor: '#38bdf8' } ] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: function(c) { return c.dataset.label + ': ' + formatCurrency(c.raw + results.tornado.baseICER) + '/QALY'; } } } }, scales: { x: { title: { display: true, text: 'ICER in cost per QALY' } } } }
            });"""
app_js = app_js.replace(app_find, app_repl)

app_find_2 = """            tornadoChartInstance.data.datasets[0].data = results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseNMB);
            tornadoChartInstance.data.datasets[1].data = results.tornado.data.map(d => d.highImpactValue - results.tornado.baseNMB);"""
app_repl_2 = """            tornadoChartInstance.data.datasets[0].data = results.tornado.data.map(d => d.lowImpactValue - results.tornado.baseICER);
            tornadoChartInstance.data.datasets[1].data = results.tornado.data.map(d => d.highImpactValue - results.tornado.baseICER);"""
app_js = app_js.replace(app_find_2, app_repl_2)

with open('js/app.js', 'w') as f:
    f.write(app_js)

print("Updated tornado analysis to ICER")
