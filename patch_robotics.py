import re

# Patch index.html
with open('index.html', 'r') as f:
    html = f.read()

find_robot = """                <details class="advanced-settings">
                    <summary>Add Robotics Parameters</summary>
                    <div class="advanced-grid">
                        <div class="input-group">
                            <label for="roboticsCostAdv">Robotics Cost per Patient</label>
                            <input type="number" id="roboticsCostAdv" value="250" step="10">
                        </div>
                        <div class="input-group">
                            <label for="roboticsReductionAdv">Robotics Opioid Reduction (%)</label>
                            <input type="number" id="roboticsReductionAdv" value="1.5" step="0.1">
                        </div>
                    </div>
                </details>"""

repl_robot = """                <details class="advanced-settings">
                    <summary>Advanced Cost Breakdown</summary>
                    <div class="advanced-grid" style="grid-template-columns: 1fr; display:grid;">
                        <div class="input-group"><label>One-off Capital/Setup Cost</label><input type="number" id="oneOffCostAdv" value="0" step="10"></div>
                        <div class="input-group"><label>Per-session Cost</label><input type="number" id="sessionCostAdv" value="0" step="5"></div>
                        <div class="input-group"><label>Number of Sessions</label><input type="number" id="numSessionsAdv" value="1" step="1"></div>
                        <p style="font-size:0.75rem; color:#cbd5e1; margin-top:0.25rem;">(These dynamically add to the VR Therapy Base Cost above)</p>
                    </div>
                </details>"""

html = html.replace(find_robot, repl_robot)

with open('index.html', 'w') as f:
    f.write(html)

# Patch app.js
with open('js/app.js', 'r') as f:
    app_js = f.read()

# Replace inputs gathering
app_js = app_js.replace("params.roboticsCost = parseFloat(document.getElementById('roboticsCostAdv').value);", "params.oneOffCost = parseFloat(document.getElementById('oneOffCostAdv').value);")
app_js = app_js.replace("params.roboticsReduction = parseFloat(document.getElementById('roboticsReductionAdv').value);", "params.sessionCost = parseFloat(document.getElementById('sessionCostAdv').value);\n                params.numSessions = parseFloat(document.getElementById('numSessionsAdv').value);")

# Replace listeners mapping
ls_find = """                document.getElementById('roboticsCostAdv'), document.getElementById('roboticsReductionAdv'),"""
ls_repl = """                document.getElementById('oneOffCostAdv'), document.getElementById('sessionCostAdv'), document.getElementById('numSessionsAdv'),"""
app_js = app_js.replace(ls_find, ls_repl)

with open('js/app.js', 'w') as f:
    f.write(app_js)


# Patch model.js
with open('js/model.js', 'r') as f:
    model_js = f.read()

model_js = model_js.replace("this.roboticsReduction = (params.roboticsReduction || 0) / 100;", "")
model_js = model_js.replace("this.roboticsCost = params.roboticsCost || 0;", "        this.oneOffCost = params.oneOffCost || 0;\n        this.sessionCost = params.sessionCost || 0;\n        this.numSessions = params.numSessions || 1;")

model_sim_find = """        let robReduct = p.roboticsReduction !== undefined ? p.roboticsReduction : this.roboticsReduction;
        let vCost = p.vrCost !== undefined ? p.vrCost : this.vrCost;
        let rCost = p.roboticsCost !== undefined ? p.roboticsCost : this.roboticsCost;

        let totalInterventionReduction = 0;
        let totalInterventionCost = 0;

        if (isVR) {
            totalInterventionReduction = opReduct + robReduct;
            totalInterventionCost = vCost + rCost;
        }"""
        
model_sim_repl = """        let vCost = p.vrCost !== undefined ? p.vrCost : this.vrCost;
        let oneOff = p.oneOffCost !== undefined ? p.oneOffCost : this.oneOffCost;
        let sCost = p.sessionCost !== undefined ? p.sessionCost : this.sessionCost;
        let nSess = p.numSessions !== undefined ? p.numSessions : this.numSessions;

        let totalInterventionReduction = 0;
        let totalInterventionCost = 0;

        if (isVR) {
            totalInterventionReduction = opReduct;
            totalInterventionCost = vCost + oneOff + (sCost * nSess);
        }"""

model_js = model_js.replace(model_sim_find, model_sim_repl)

with open('js/model.js', 'w') as f:
    f.write(model_js)

print("Removed robotics and added session/one-off cost mechanics")
