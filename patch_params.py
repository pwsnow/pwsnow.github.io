with open('js/app.js', 'r') as f:
    text = f.read()

text = text.replace("function initCharts(results) {", "function initCharts(results, params) {")
text = text.replace("function updateCharts(results) {", "function updateCharts(results, params) {")
text = text.replace("initCharts(results);", "initCharts(results, params);")
text = text.replace("updateCharts(results);", "updateCharts(results, params);")

with open('js/app.js', 'w') as f:
    f.write(text)

print("Fixed params scope by passing params to init/updateCharts")
