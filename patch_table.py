import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace Base defaults
html = html.replace('(€)', '(£)')
html = html.replace('value="47.48"', 'value="40.55"')
html = html.replace('€47.48', '£40.55')
html = html.replace('rate_eur_to_gbp = 0.854', 'rate_eur_to_gbp = 0.854') # Ignore

# Flip UI button initial states
btn_find = """                <div class="currency-toggle" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0.25rem;">
                    <button class="btn-preset active" id="btnEur" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:var(--accent-primary); color:#fff; font-weight:bold;">EUR (€)</button>
                    <button class="btn-preset" id="btnGbp" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:transparent; color:var(--text-secondary); font-weight:bold;">GBP (£)</button>
                </div>"""
btn_repl = """                <div class="currency-toggle" style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 0.25rem;">
                    <button class="btn-preset" id="btnEur" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:transparent; color:var(--text-secondary); font-weight:bold;">EUR (€)</button>
                    <button class="btn-preset active" id="btnGbp" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:var(--accent-primary); color:#fff; font-weight:bold;">GBP (£)</button>
                </div>"""
html = html.replace(btn_find, btn_repl)
html = html.replace(btn_find.replace('btnEur', 'btnEurAdv').replace('btnGbp', 'btnGbpAdv'), btn_repl.replace('btnEur', 'btnEurAdv').replace('btnGbp', 'btnGbpAdv'))

# Add Table Tab
tab_find = """        <button class="tab-btn" id="btnTabAdv">VR + Robotics Sandbox</button>
    </nav>"""
tab_repl = """        <button class="tab-btn" id="btnTabAdv">VR + Robotics Sandbox</button>
        <button class="tab-btn" id="btnTabTable">Table 1 (Input Parameters)</button>
    </nav>"""
html = html.replace(tab_find, tab_repl)

# Inject Table Main Content
table_html = """
    <!-- WRAPPER 3: TABLE 1 -->
    <main class="dashboard tab-content" id="tab-table" style="display:block; padding: 2rem 5%;">
        <div class="glass-panel" style="width: 100%; max-width: 1000px; margin: 0 auto;">
            <h2 style="margin-bottom: 1rem; color: var(--text-primary); text-align:center;">Table 1. Input Parameters</h2>
            <div style="overflow-x:auto;">
                <table class="param-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                            <th>Distribution</th>
                            <th>Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="section-header"><td colspan="4">Clinical Parameters</td></tr>
                        <tr><td>Initial non-opioid use after discharge</td><td>30%</td><td>Beta</td><td>Model Assumption</td></tr>
                        <tr><td>Initial opioid use after discharge</td><td>70%</td><td>Beta</td><td>Literature</td></tr>
                        <tr><td>CPSP Risk at 1 month (Standard Care)</td><td>15%</td><td>Beta</td><td>Observational Data</td></tr>
                        <tr><td>CPSP Risk at 1 month (VR Therapy)</td><td>Determined by Opioid Reduction</td><td>-</td><td>Derived</td></tr>
                        <tr><td>Opioid reduction efficacy (VR)</td><td>2.8% to 6.5%</td><td>Uniform</td><td>Trial Results</td></tr>
                        
                        <tr class="section-header"><td colspan="4">Utility Values (QALYs)</td></tr>
                        <tr><td>Pain-Free State</td><td>1.0</td><td>Beta</td><td>Assumption</td></tr>
                        <tr><td>Postoperative pain (Non-Opioids)</td><td>0.85</td><td>Beta</td><td>Literature</td></tr>
                        <tr><td>Postoperative pain (Opioids)</td><td>0.70</td><td>Beta</td><td>Literature</td></tr>
                        <tr><td>Chronic Post-Surgical Pain (CPSP)</td><td>0.50</td><td>Beta</td><td>Literature</td></tr>

                        <tr class="section-header"><td colspan="4">Cost Parameters (£)</td></tr>
                        <tr><td>VR Therapy cost per patient</td><td>£40.55</td><td>Deterministic</td><td>Vendor Pricing</td></tr>
                        <tr><td>Monthly cost (Non-Opioids)</td><td>£42.70</td><td>Gamma</td><td>Healthcare Db</td></tr>
                        <tr><td>Monthly cost (Opioids)</td><td>£128.10</td><td>Gamma</td><td>Healthcare Db</td></tr>
                        <tr><td>Monthly cost (CPSP)</td><td>£341.60</td><td>Gamma</td><td>Healthcare Db</td></tr>
                        <tr><td>Willingness-to-pay threshold</td><td>£20,000</td><td>Fixed</td><td>NICE Guidelines</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
"""

html = html.replace('</main>\n\n</body>', '</main>\n' + table_html + '\n</body>')

# Replace the specific active button logic missed above if there were duplicates.
html = re.sub(r'id="btnEur(Adv)?" style=".*?background:var\(--accent-primary\).*?"', 'id="btnEur\\1" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:transparent; color:var(--text-secondary); font-weight:bold;"', html)
html = re.sub(r'id="btnGbp(Adv)?" style=".*?background:transparent.*?"', 'id="btnGbp\\1" style="border:none; border-radius:4px; padding:0.25rem 0.5rem; background:var(--accent-primary); color:#fff; font-weight:bold;"', html)

with open('index.html', 'w') as f:
    f.write(html)


# Patch CSS
with open('styles.css', 'r') as f:
    css = f.read()

css_append = """
/* Table 1 Styles */
.param-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.param-table th {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    border-bottom: 2px solid var(--border-color);
}

.param-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.param-table tr:hover td {
    background: rgba(255, 255, 255, 0.05);
}

.param-table .section-header td {
    background: rgba(56, 189, 248, 0.1);
    color: var(--accent-primary);
    font-weight: 600;
    padding-top: 1.5rem;
    border-bottom: 1px solid rgba(56, 189, 248, 0.3);
}

#tab-table.active {
    display: block !important;
}
"""

if '.param-table' not in css:
    css += css_append
    with open('styles.css', 'w') as f:
        f.write(css)

print("HTML Table layout and Base UI applied.")
