import re

with open('index.html', 'r') as f:
    html = f.read()

# Extract main dashboard block
dashboard_start = html.find('<main class="dashboard">')
dashboard_end = html.find('</main>', dashboard_start) + len('</main>')

original_dashboard = html[dashboard_start:dashboard_end]

tabs_nav = """
    <nav class="tab-nav">
        <button class="tab-btn active" id="btnTabVr">VR Model (Paper)</button>
        <button class="tab-btn" id="btnTabAdv">VR + Robotics Sandbox</button>
    </nav>
"""

vr_dashboard = original_dashboard.replace('<main class="dashboard">', '<main class="dashboard tab-content active" id="tab-vr">')

# Create the advanced dashboard by cloning
adv_dashboard = vr_dashboard.replace('tab-vr', 'tab-adv')
adv_dashboard = adv_dashboard.replace('active', '', 1)

# Replace all relevant IDs with Adv
ids_to_adv = ['wtp', 'vrCost', 'vrCostValue', 'opioidReduction', 'opioidReductionValue', 'cpspRisk', 'cpspRiskValue', 'presetCostEffective', 'presetCostSaving', 'costEffectiveStatus', 'resetBtn', 'summaryAnalysis', 'kpiIncCost', 'kpiIncQaly', 'kpiIcer', 'kpiNmb', 'headroomChart', 'tornadoChart', 'cePlaneChart', 'btnEur', 'btnGbp', 'downloadHeadroomBtn', 'downloadTornadoBtn', 'downloadCeBtn']

for id_str in ids_to_adv:
    adv_dashboard = adv_dashboard.replace(f'id="{id_str}"', f'id="{id_str}Adv"')
    adv_dashboard = adv_dashboard.replace(f'for="{id_str}"', f'for="{id_str}Adv"')
    # Fix the value spans that depend on IDs
    if 'Value' in id_str:
        pass # Handle manually if needed

# Insert Advanced Specific Settings in the Advanced Dashboard's Sidebar
adv_settings_html = """
            <div class="action-card" style="margin-top:0.5rem; padding-top:0.5rem; border:none;">
                <details class="advanced-settings">
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
                </details>

                <details class="advanced-settings">
                    <summary>Underlying Model Configuration</summary>
                    <div class="advanced-grid" style="grid-template-columns: 1fr 1fr; display:grid;">
                        <div class="input-group"><label>Util: PF</label><input type="number" id="utilPfAdv" value="1.0" step="0.05"></div>
                        <div class="input-group"><label>Util: NonOp</label><input type="number" id="utilNonOpAdv" value="0.85" step="0.05"></div>
                        <div class="input-group"><label>Util: Opioid</label><input type="number" id="utilOpioidAdv" value="0.70" step="0.05"></div>
                        <div class="input-group"><label>Util: CPSP</label><input type="number" id="utilCpspAdv" value="0.50" step="0.05"></div>
                        <div class="input-group"><label>Cost: NonOp (€)</label><input type="number" id="costNonOpAdv" value="50" step="10"></div>
                        <div class="input-group"><label>Cost: Opioid (€)</label><input type="number" id="costOpioidAdv" value="150" step="10"></div>
                        <div class="input-group"><label>Cost: CPSP (€)</label><input type="number" id="costCpspAdv" value="400" step="10"></div>
                    </div>
                </details>
            </div>
"""

adv_dashboard = adv_dashboard.replace('<div class="action-card">', adv_settings_html + '\n            <div class="action-card">')

new_html = html[:dashboard_start] + tabs_nav + vr_dashboard + "\n" + adv_dashboard + html[dashboard_end:]

with open('index.html', 'w') as f:
    f.write(new_html)

print("Updated index.html to support DOM Tabs")
