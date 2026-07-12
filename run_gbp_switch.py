# 1. Update model.js
with open('js/model.js', 'r') as f:
    text = f.read()

text = text.replace("this.currency = params.currency || 'EUR';", "this.currency = params.currency || 'GBP';")
text = text.replace("this.costNonOpioid = 50;", "this.costNonOpioid = 42.7;")
text = text.replace("this.costOpioid = 150;", "this.costOpioid = 128.1;")
text = text.replace("this.costCPSP = 400;", "this.costCPSP = 341.6;")

cycle_old = """    getCycleCosts(p) {
        p = p || this;
        let curr = p.currency || this.currency;
        let rate = curr === 'GBP' ? 0.854 : 1.0;"""
cycle_new = """    getCycleCosts(p) {
        p = p || this;
        let curr = p.currency || this.currency;
        let rate = curr === 'EUR' ? (1/0.854) : 1.0;"""
text = text.replace(cycle_old, cycle_new)

with open('js/model.js', 'w') as f:
    f.write(text)


# 2. Update app.js
with open('js/app.js', 'r') as f:
    text = f.read()

text = text.replace("let currentCurrency = 'EUR';", "let currentCurrency = 'GBP';")

# Replace setCurrency function:
set_old = """        function setCurrency(targetCurrency) {
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
        }"""
set_new = """        function setCurrency(targetCurrency) {
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
        }"""
text = text.replace(set_old, set_new)

# Replace active classes manually inside app.js loading setup
text = text.replace("""elements.btnEur.style.background = 'var(--accent-primary)'""", "/*... handled natively by HTML ...*/")

# Reset btn changes
reset_old = """        elements.resetBtn.addEventListener('click', () => {
            elements.wtp.value = currentCurrency === 'GBP' ? Math.round(20000 * rate_eur_to_gbp) : 20000;
            elements.vrCost.value = currentCurrency === 'GBP' ? (47.48 * rate_eur_to_gbp).toFixed(2) : 47.48;"""
reset_new = """        elements.resetBtn.addEventListener('click', () => {
            elements.wtp.value = currentCurrency === 'EUR' ? Math.round(20000 / rate_eur_to_gbp) : 20000;
            elements.vrCost.value = currentCurrency === 'EUR' ? (40.55 / rate_eur_to_gbp).toFixed(2) : 40.55;"""
text = text.replace(reset_old, reset_new)

# Tab logic updates
tab_logic_old = """    // Tab Switching Logic
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
    });"""

tab_logic_new = """    // Tab Switching Logic
    const btnTabVr = document.getElementById('btnTabVr');
    const btnTabAdv = document.getElementById('btnTabAdv');
    const btnTabTable = document.getElementById('btnTabTable');
    
    const tabVr = document.getElementById('tab-vr');
    const tabAdv = document.getElementById('tab-adv');
    const tabTable = document.getElementById('tab-table');

    function switchTab(activeBtn, activeTab) {
        [btnTabVr, btnTabAdv, btnTabTable].forEach(b => b.classList.remove('active'));
        [tabVr, tabAdv, tabTable].forEach(t => t.classList.remove('active'));
        
        activeBtn.classList.add('active');
        activeTab.classList.add('active');
    }

    btnTabVr.addEventListener('click', () => switchTab(btnTabVr, tabVr));
    btnTabAdv.addEventListener('click', () => switchTab(btnTabAdv, tabAdv));
    btnTabTable.addEventListener('click', () => switchTab(btnTabTable, tabTable));"""
text = text.replace(tab_logic_old, tab_logic_new)

with open('js/app.js', 'w') as f:
    f.write(text)


print("GBP mechanics installed globally.")
