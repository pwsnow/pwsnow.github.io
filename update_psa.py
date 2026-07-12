with open('js/app.js', 'r') as f:
    text = f.read()

# Replace runModel part:
model_run = """            const results = model.run();
            results.tornado = model.runSensitivityAnalysis();
            results.headroom = model.runHeadroomAnalysis();
            
            const paramsCE = { ...params, opioidReduction: 2.8 };
            const modelCE = new MarkovModel(paramsCE);
            modelCE.baseParams.currency = currentCurrency;
            results.psa_ce = modelCE.runProbabilisticSensitivityAnalysis(200);
            
            const paramsCS = { ...params, opioidReduction: 6.5 };
            const modelCS = new MarkovModel(paramsCS);
            modelCS.baseParams.currency = currentCurrency;
            results.psa_cs = modelCS.runProbabilisticSensitivityAnalysis(200);"""

text = text.replace("""            const results = model.run();
            results.tornado = model.runSensitivityAnalysis();
            results.headroom = model.runHeadroomAnalysis();
            results.psa = model.runProbabilisticSensitivityAnalysis(200);""", model_run)

# Replace initCharts part:
init_ce = """            cePlaneChartInstance = new Chart(cePlaneCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: '2.8% Opioid Reduction (Cost-Effective Scenario)', data: results.psa_ce.map(d => ({x:d.x, y:d.y})), backgroundColor: 'rgba(56, 189, 248, 0.6)', pointRadius: 4, order: 2 },
                        { label: '6.5% Opioid Reduction (Cost-Saving Scenario)', data: results.psa_cs.map(d => ({x:d.x, y:d.y})), backgroundColor: 'rgba(16, 185, 129, 0.6)', pointRadius: 4, order: 1 }
                    ]
                },"""

text = text.replace("""            cePlaneChartInstance = new Chart(cePlaneCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Base Case', data: [{ x: results.incQaly, y: results.incCost }], backgroundColor: results.nmb >= 0 ? '#10b981' : '#ef4444', pointStyle: 'rectRot', pointRadius: 10,  order: 1 },
                        { label: 'Probabilistic Iterations (N=200)', data: results.psa.map(d => ({x:d.x, y:d.y})), backgroundColor: 'rgba(56, 189, 248, 0.5)', pointRadius: 4, order: 2 }
                    ]
                },""", init_ce)

# Replace updateCharts part:
update_ce = """            cePlaneChartInstance.data.datasets[0].data = results.psa_ce.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.data.datasets[1].data = results.psa_cs.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.options.scales.x.min = params.ceXMin;"""

text = text.replace("""            cePlaneChartInstance.data.datasets[0].data = [{ x: results.incQaly, y: results.incCost }];
            cePlaneChartInstance.data.datasets[0].backgroundColor = results.nmb >= 0 ? '#10b981' : '#ef4444';
            cePlaneChartInstance.data.datasets[1].data = results.psa.map(d => ({ x: d.x, y: d.y }));
            cePlaneChartInstance.options.scales.x.min = params.ceXMin;""", update_ce)

with open('js/app.js', 'w') as f:
    f.write(text)

print("Updated CE Plane PSA mappings")
