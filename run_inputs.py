import re

with open('index.html', 'r') as f:
    html = f.read()

# VR Cost Replacement
old_vrcost_1 = """                <div class="slider-container">
                    <input type="range" id="vrCost" min="0" max="200" value="47.48" step="0.01">
                    <span id="vrCostValue">€47.48</span>
                </div>"""
new_vrcost_1 = """                <div class="slider-container">
                    <input type="number" id="vrCostNum" min="0" max="100000" value="47.48" step="0.01" class="sync-input">
                    <input type="range" id="vrCost" min="0" max="100000" value="47.48" step="0.01">
                </div>"""
html = html.replace(old_vrcost_1, new_vrcost_1)

old_vrcost_2 = """                <div class="slider-container">
                    <input type="range" id="vrCostAdv" min="0" max="200" value="47.48" step="0.01">
                    <span id="vrCostValueAdv">€47.48</span>
                </div>"""
new_vrcost_2 = """                <div class="slider-container">
                    <input type="number" id="vrCostNumAdv" min="0" max="100000" value="47.48" step="0.01" class="sync-input">
                    <input type="range" id="vrCostAdv" min="0" max="100000" value="47.48" step="0.01">
                </div>"""
html = html.replace(old_vrcost_2, new_vrcost_2)

# Opioid Replacement
old_opioid_1 = """                <div class="slider-container">
                    <input type="range" id="opioidReduction" min="0" max="20" value="2.8" step="0.1">
                    <span id="opioidReductionValue">2.8%</span>
                </div>"""
new_opioid_1 = """                <div class="slider-container">
                    <input type="number" id="opioidReductionNum" min="0" max="100" value="2.8" step="0.1" class="sync-input">
                    <input type="range" id="opioidReduction" min="0" max="100" value="2.8" step="0.1">
                </div>"""
html = html.replace(old_opioid_1, new_opioid_1)

old_opioid_2 = """                <div class="slider-container">
                    <input type="range" id="opioidReductionAdv" min="0" max="20" value="2.8" step="0.1">
                    <span id="opioidReductionValueAdv">2.8%</span>
                </div>"""
new_opioid_2 = """                <div class="slider-container">
                    <input type="number" id="opioidReductionNumAdv" min="0" max="100" value="2.8" step="0.1" class="sync-input">
                    <input type="range" id="opioidReductionAdv" min="0" max="100" value="2.8" step="0.1">
                </div>"""
html = html.replace(old_opioid_2, new_opioid_2)

# CPSP Replacement
old_cpsp_1 = """                <div class="slider-container">
                    <input type="range" id="cpspRisk" min="0" max="100" value="15" step="1">
                    <span id="cpspRiskValue">15%</span>
                </div>"""
new_cpsp_1 = """                <div class="slider-container">
                    <input type="number" id="cpspRiskNum" min="0" max="100" value="15" step="1" class="sync-input">
                    <input type="range" id="cpspRisk" min="0" max="100" value="15" step="1">
                </div>"""
html = html.replace(old_cpsp_1, new_cpsp_1)

old_cpsp_2 = """                <div class="slider-container">
                    <input type="range" id="cpspRiskAdv" min="0" max="100" value="15" step="1">
                    <span id="cpspRiskValueAdv">15%</span>
                </div>"""
new_cpsp_2 = """                <div class="slider-container">
                    <input type="number" id="cpspRiskNumAdv" min="0" max="100" value="15" step="1" class="sync-input">
                    <input type="range" id="cpspRiskAdv" min="0" max="100" value="15" step="1">
                </div>"""
html = html.replace(old_cpsp_2, new_cpsp_2)

with open('index.html', 'w') as f:
    f.write(html)


# APP.JS
with open('js/app.js', 'r') as f:
    appjs = f.read()

# Replace variables in elements {
el_find = """            vrCostValue: document.getElementById(id('vrCostValue')),
            opioidReduction: document.getElementById(id('opioidReduction')),
            opioidReductionValue: document.getElementById(id('opioidReductionValue')),
            cpspRisk: document.getElementById(id('cpspRisk')),
            cpspRiskValue: document.getElementById(id('cpspRiskValue')),"""
el_repl = """            vrCostNum: document.getElementById(id('vrCostNum')),
            opioidReduction: document.getElementById(id('opioidReduction')),
            opioidReductionNum: document.getElementById(id('opioidReductionNum')),
            cpspRisk: document.getElementById(id('cpspRisk')),
            cpspRiskNum: document.getElementById(id('cpspRiskNum')),"""
appjs = appjs.replace(el_find, el_repl)

# Replace updateLabelOutputs
out_find = """        function updateLabelOutputs() {
            elements.vrCostValue.textContent = formatCurrency(elements.vrCost.value);
            elements.opioidReductionValue.textContent = `${elements.opioidReduction.value}%`;
            elements.cpspRiskValue.textContent = `${elements.cpspRisk.value}%`;
        }"""
out_repl = """        function updateLabelOutputs() {
            // Handled explicitly in listeners now
        }"""
appjs = appjs.replace(out_find, out_repl)

# Bind custom sync listeners before the generic runModel assignment
sync_find = """        let listeners = [elements.wtp, elements.vrCost, elements.opioidReduction, elements.cpspRisk,"""
sync_repl = """        
        function syncSliderAndNum(sliderEl, numEl) {
            sliderEl.addEventListener('input', (e) => { numEl.value = e.target.value; runModel(); });
            numEl.addEventListener('input', (e) => { sliderEl.value = e.target.value; runModel(); });
        }
        syncSliderAndNum(elements.vrCost, elements.vrCostNum);
        syncSliderAndNum(elements.opioidReduction, elements.opioidReductionNum);
        syncSliderAndNum(elements.cpspRisk, elements.cpspRiskNum);

        let listeners = [elements.wtp, 
                         document.getElementById(id('ceXMin')), document.getElementById(id('ceXMax')),"""
appjs = appjs.replace(sync_find, sync_repl)

# Remove the individual listeners array map
appjs = appjs.replace("""        listeners.forEach((el) => { if (el) el.addEventListener('input', runModel) });""", 
"""        listeners.forEach((el) => { if (el) el.addEventListener('input', runModel) });
        // Set initial nums
        elements.vrCostNum.value = elements.vrCost.value;
        elements.opioidReductionNum.value = elements.opioidReduction.value;
        elements.cpspRiskNum.value = elements.cpspRisk.value;""")

with open('js/app.js', 'w') as f:
    f.write(appjs)

# STYLES.CSS
with open('styles.css', 'r') as f:
    css = f.read()

css_append = """
.sync-input {
    width: 80px !important;
    padding: 0.25rem 0.5rem !important;
    text-align: center;
    font-size: 0.9rem !important;
}
.slider-container input[type="range"] {
    flex: 1;
}
"""

if '.sync-input' not in css:
    css = css + css_append
    with open('styles.css', 'w') as f:
        f.write(css)

print("updated")
