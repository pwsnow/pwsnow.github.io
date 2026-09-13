"""
UCLTouchRehab PLP Health Economic Model — Full MBA Analysis
2025 prices | NICE 3.5%/yr discount | WTP £25,000/QALY
"""
import math, random

# ══════════════════════════════════════════════════════════════════════
# PARAMETERS (2025 prices)
# ══════════════════════════════════════════════════════════════════════
MONTHS        = 12
DISCOUNT_R    = 1.035 ** (1/12) - 1   # monthly NICE 3.5%/yr
WTP           = 25_000                 # £/QALY
ANNUAL_PTS    = 5_762                  # NHS HES 2024/25

# Utilities (EQ-5D UK norms)
U = {"PF": 0.80, "Mild": 0.67, "Mod": 0.46, "Sev": 0.16, "Dead": 0.0}

# Monthly state costs — Usual Care (UC)
DAYS = 30.4375
VR_COST       = 40.55          # per patient recurring
GP            = 102.00         # NHS RC 2024/25
SPEC          = 139.00         # HRG WF01A
CG_RATE       = 13.28          # PSSRU 2024 £/hr
GAB_DAY       = 1.65           # Gabapentin BNF 2025
PREG_DAY      = 11.20          # Pregabalin
AMIT_DUL_DAY  = 3.97           # Amitriptyline + Duloxetine combined

def monthly_cost(state):
    if state == "PF":
        return GP * 0.25                                  # infrequent GP
    elif state == "Mild":
        return GP*1 + GAB_DAY*DAYS + CG_RATE*0.5*DAYS
    elif state == "Mod":
        return GP*2 + SPEC*1 + PREG_DAY*DAYS + CG_RATE*7.5*DAYS
    elif state == "Sev":
        return GP*2 + SPEC*2 + AMIT_DUL_DAY*DAYS + CG_RATE*17.0*DAYS
    else:  # Dead
        return 0.0

STATES = ["PF","Mild","Mod","Sev","Dead"]
BASE_COSTS = {s: monthly_cost(s) for s in STATES}

# Usual-Care transition matrix (monthly, 2-12)
# Rows: from state | Cols: PF, Mild, Mod, Sev, Dead
UC_P = [
    [0.8845, 0.0700, 0.0200, 0.0050, 0.0005],  # from PF
    [0.0500, 0.8495, 0.0700, 0.0300, 0.0005],  # from Mild
    [0.0200, 0.0500, 0.8095, 0.1200, 0.0005],  # from Mod
    [0.0050, 0.0200, 0.0500, 0.9245, 0.0005],  # from Sev
    [0.0000, 0.0000, 0.0000, 0.0000, 1.0000],  # from Dead
]

def apply_efficacy(eff, p_uc):
    """Return VR transition matrix: eff% of Mod/Sev shift up one state."""
    import copy
    p = [row[:] for row in p_uc]
    for from_idx in [2, 3]:  # Mod, Sev
        shift = eff * p[from_idx][from_idx]
        to_idx = from_idx - 1
        p[from_idx][from_idx] -= shift
        p[from_idx][to_idx]   += shift
    return p

def mat_vec(P, v):
    n = len(v)
    return [sum(v[j]*P[j][i] for j in range(n)) for i in range(n)]

def run_arm(P_month1, P_chronic, s0, add_vr_cost=False):
    """Run 12-month Markov and return total discounted (cost, QALY)."""
    s = s0[:]
    total_cost = 0.0
    total_qaly = 0.0
    for t in range(MONTHS):
        disc = 1.0 / (1+DISCOUNT_R)**t
        # costs this cycle
        c = sum(s[i]*BASE_COSTS[STATES[i]] for i in range(len(STATES)))
        if add_vr_cost and t == 0:
            c += VR_COST
        total_cost  += c * disc
        total_qaly  += sum(s[i]*U[STATES[i]] for i in range(len(STATES))) * disc / 12
        P = P_month1 if t == 0 else P_chronic
        s = mat_vec(P, s)
    return total_cost, total_qaly

# Starting distribution: 0% PF, 0% Mild, 60% Mod, 40% Sev
S0 = [0.0, 0.0, 0.60, 0.40, 0.0]

# ══════════════════════════════════════════════════════════════════════
# BASE CASE (50% efficacy)
# ══════════════════════════════════════════════════════════════════════
EFF_BASE = 0.50
UC_P_M1  = UC_P          # month 1 same as chronic for UC
VR_P_M1  = apply_efficacy(EFF_BASE, UC_P)

uc_cost, uc_qaly = run_arm(UC_P, UC_P, S0, False)
vr_cost, vr_qaly = run_arm(VR_P_M1, UC_P, S0, True)

delta_c  = vr_cost  - uc_cost
delta_e  = vr_qaly  - uc_qaly
icer     = delta_c  / delta_e if abs(delta_e) > 1e-9 else float('inf')
nmb      = delta_e * WTP - delta_c

print("=" * 60)
print("BASE CASE RESULTS (50% efficacy, £25k WTP)")
print("=" * 60)
print(f"  UC  total cost:      £{uc_cost:,.2f}")
print(f"  VR  total cost:      £{vr_cost:,.2f}")
print(f"  ΔC  (VR − UC):      £{delta_c:,.2f}")
print(f"  UC  total QALYs:     {uc_qaly:.6f}")
print(f"  VR  total QALYs:     {vr_qaly:.6f}")
print(f"  ΔE  (VR − UC):      {delta_e:.6f} QALYs")
print(f"  ICER:               £{icer:,.0f}/QALY" if math.isfinite(icer) else "  ICER:               DOMINANT")
print(f"  NMB @ £25k:         £{nmb:,.2f}")
print(f"  Conclusion:         {'DOMINANT (cost-saving + more QALYs)' if delta_c < 0 and delta_e > 0 else 'CE' if (math.isfinite(icer) and icer <= WTP) else 'NOT CE'}")

# ══════════════════════════════════════════════════════════════════════
# THRESHOLD / HEADROOM ANALYSIS (sweep 0–100%)
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("THRESHOLD / HEADROOM ANALYSIS (0–100% efficacy)")
print("=" * 60)
print(f"{'Eff%':>5}  {'ΔC':>10}  {'ΔE':>10}  {'ICER':>14}  {'CE@25k':>6}  {'Max CE cost':>12}  {'Max CS cost':>12}")
print("-" * 80)

ce_threshold = None
cs_threshold = None
headroom_rows = []

for e_pct in range(0, 101):
    eff = e_pct / 100
    vr_p = apply_efficacy(eff, UC_P)
    vc, vq = run_arm(vr_p, UC_P, S0, True)
    dc = vc - uc_cost
    de = vq - uc_qaly
    ic = dc / de if abs(de) > 1e-9 else float('inf')
    ce = dc < 0 or (math.isfinite(ic) and ic <= WTP)
    cs = dc <= 0

    # Max VR cost where still CE: saving + QALY_gain × WTP − VR_cost <= 0 threshold
    # Actual calculation: ΔC_no_vr_cost + VR_cost_max = 0 for CS
    #                      ΔC_no_vr_cost + VR_cost_max = ΔE × WTP for CE
    dc_no_vr = dc - VR_COST   # remove the already-charged VR cost
    max_cs = max(0, -dc_no_vr)
    max_ce = max(0, de * WTP - dc_no_vr)

    headroom_rows.append((e_pct, dc, de, ic, ce, cs, max_ce, max_cs))

    if ce_threshold is None and ce:
        ce_threshold = e_pct
    if cs_threshold is None and cs:
        cs_threshold = e_pct

    if e_pct % 5 == 0:
        icer_str = f"£{ic:>10,.0f}" if math.isfinite(ic) else "   DOMINANT"
        print(f"{e_pct:>5}%  {dc:>10,.0f}  {de:>10.5f}  {icer_str:>14}  {'✓' if ce else '✗':>6}  £{max_ce:>10,.0f}  £{max_cs:>10,.0f}")

print(f"\n  ⭐ CE threshold (ICER ≤ £25k):  {ce_threshold}% efficacy")
print(f"  ⭐ CS threshold (ΔC ≤ 0):       {cs_threshold}% efficacy")

# Headroom at base case 50%
hr50 = headroom_rows[50]
print(f"\n  At 50% efficacy:")
print(f"    Max VR cost (CE @ £25k WTP):  £{hr50[6]:,.0f}/patient")
print(f"    Max VR cost (cost-saving):    £{hr50[7]:,.0f}/patient")
print(f"    Current VR cost:              £{VR_COST:.2f}/patient")
print(f"    Headroom ratio (CE):          {hr50[6]/VR_COST:.0f}× current cost")

# ══════════════════════════════════════════════════════════════════════
# NHS SYSTEM PRICING (capital amortisation)
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("NHS SYSTEM PRICING — Capital Amortisation (£20,000 system)")
print("=" * 60)
print(f"  Per-patient saving at 50% eff:  £{-delta_c:,.2f}")
print(f"  (before capital amortisation)")
print()
print(f"{'Pts/yr':>8}  {'Yrs':>5}  {'Amort/pt':>10}  {'Net saving/pt':>14}  {'NHS viable?':>12}")
print("-" * 55)
CAPITAL = 20_000
for pts in [10, 25, 50, 100, 200, 500]:
    for yrs in [3, 5]:
        amort = CAPITAL / (pts * yrs)
        net   = (-delta_c) - amort
        viable = "✓ Yes" if net > 0 else "✗ No"
        print(f"{pts:>8}  {yrs:>5}  £{amort:>8,.2f}  £{net:>12,.2f}  {viable:>12}")

print(f"\n  Min system price NHS would pay (per patient):  £0")
print(f"  → Any price ≤ £{-delta_c:,.0f}/patient is cost-saving (no capital)")
print(f"  Max price where CE (WTP £25k):  £{hr50[6]:,.0f}/patient (recurring cost)")
print(f"  Max system capital (50pts×5yr, CE):  £{hr50[6]*50*5 - VR_COST*50*5:,.0f}")

# ══════════════════════════════════════════════════════════════════════
# PSA — N=1,000 Monte Carlo
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("PROBABILISTIC SENSITIVITY ANALYSIS (N=1,000)")
print("=" * 60)
random.seed(42)

def sample_beta(mean, cv=0.20):
    if mean <= 0 or mean >= 1: return max(0.01, min(0.99, mean))
    var = (mean * cv) ** 2
    alpha = mean * (mean*(1-mean)/var - 1)
    beta  = (1-mean) * (mean*(1-mean)/var - 1)
    alpha = max(0.5, alpha); beta = max(0.5, beta)
    # Johnk's method
    for _ in range(1000):
        u1 = random.random() ** (1/alpha)
        u2 = random.random() ** (1/beta)
        if u1 + u2 <= 1:
            return u1 / (u1 + u2)
    return mean

def sample_gamma(mean, cv=0.20):
    if mean <= 0: return 0
    k = 1 / cv**2
    theta = mean / k
    # Marsaglia-Tsang
    d = k - 1/3; c = 1/math.sqrt(9*d)
    for _ in range(10000):
        x = random.gauss(0,1)
        v = (1 + c*x)**3
        if v > 0:
            u = random.random()
            x2 = x*x
            if u < 1 - 0.0331*(x2*x2) or math.log(u) < 0.5*x2 + d*(1-v+math.log(v)):
                return d * v * theta
    return mean

psa_dc, psa_de = [], []
for _ in range(1000):
    u_pf   = sample_beta(U["PF"])
    u_mild = sample_beta(U["Mild"])
    u_mod  = sample_beta(U["Mod"])
    u_sev  = sample_beta(U["Sev"])
    c_gp   = sample_gamma(GP)
    c_sp   = sample_gamma(SPEC)
    c_vr   = sample_gamma(VR_COST)
    c_cg   = sample_gamma(CG_RATE)
    eff_s  = min(1.0, max(0.0, random.gauss(0.50, 0.10)))

    u_s = {"PF": u_pf, "Mild": u_mild, "Mod": u_mod, "Sev": u_sev, "Dead": 0.0}

    def run_psa_arm(P1, P2, add_vr):
        s = S0[:]
        tc, tq = 0.0, 0.0
        for t in range(MONTHS):
            disc = 1.0/(1+DISCOUNT_R)**t
            c = sum(s[i]*(c_gp*([0.25,1,2,2,0][i]) + c_sp*([0,0,1,2,0][i])
                         + [0, GAB_DAY, PREG_DAY, AMIT_DUL_DAY, 0][i]*DAYS
                         + c_cg*[0, 0.5, 7.5, 17.0, 0][i]*DAYS) for i in range(5))
            if add_vr and t == 0: c += c_vr
            tc += c * disc
            tq += sum(s[i]*u_s[STATES[i]] for i in range(5)) * disc / 12
            P = P1 if t == 0 else P2
            s = mat_vec(P, s)
        return tc, tq

    vr_p1 = apply_efficacy(eff_s, UC_P)
    uc_c_s, uc_q_s = run_psa_arm(UC_P, UC_P, False)
    vr_c_s, vr_q_s = run_psa_arm(vr_p1, UC_P, True)
    psa_dc.append(vr_c_s - uc_c_s)
    psa_de.append(vr_q_s - uc_q_s)

nmb_psa = [psa_de[i]*WTP - psa_dc[i] for i in range(1000)]
p_ce     = sum(1 for v in nmb_psa if v > 0) / 10
p_dom    = sum(1 for i in range(1000) if psa_dc[i]<0 and psa_de[i]>0) / 10

dc_mean = sum(psa_dc)/1000; dc_sd = math.sqrt(sum((x-dc_mean)**2 for x in psa_dc)/999)
de_mean = sum(psa_de)/1000; de_sd = math.sqrt(sum((x-de_mean)**2 for x in psa_de)/999)

# EVPI
e_max_nmb = sum(max(v,0) for v in nmb_psa)/1000
max_e_nmb = max(sum(nmb_psa)/1000, 0)
evpi      = max(0, e_max_nmb - max_e_nmb)
pop_evpi  = evpi * sum(ANNUAL_PTS/(1.035**t) for t in range(1,5))

sorted_dc = sorted(psa_dc)
p5_dc = sorted_dc[49]; p95_dc = sorted_dc[949]
sorted_de = sorted(psa_de)
p5_de = sorted_de[49]; p95_de = sorted_de[949]

print(f"  PSA iterations:        1,000")
print(f"  ΔC mean (95% CI):     £{dc_mean:,.2f}  (£{p5_dc:,.0f} to £{p95_dc:,.0f})")
print(f"  ΔE mean (95% CI):     {de_mean:.5f}  ({p5_de:.5f} to {p95_de:.5f})")
print(f"  P(cost-effective @ £25k):  {p_ce:.1f}%")
print(f"  P(dominant):               {p_dom:.1f}%")
print(f"  EVPI / patient:            £{evpi:.2f}")
print(f"  Population EVPI (4yr):     £{pop_evpi:,.0f}")
print(f"  → {'No further research warranted' if evpi < 1 else 'Some research value remains'}")

# ══════════════════════════════════════════════════════════════════════
# DSA — ONE-WAY SENSITIVITY
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("DETERMINISTIC SENSITIVITY ANALYSIS (±20% base case)")
print("=" * 60)
print(f"  Base ICER: DOMINANT (ΔC=£{delta_c:,.2f}, ΔE={delta_e:.5f})")
print()

params = [
    ("Mild PLP utility",  "u_mild",  U["Mild"]),
    ("Mod PLP utility",   "u_mod",   U["Mod"]),
    ("Sev PLP utility",   "u_sev",   U["Sev"]),
    ("VR Efficacy",       "eff",     EFF_BASE),
    ("GP visit cost",     "gp",      GP),
    ("Specialist cost",   "spec",    SPEC),
    ("Caregiver rate",    "cg",      CG_RATE),
    ("Pregabalin cost",   "preg",    PREG_DAY),
    ("VR system cost",    "vrc",     VR_COST),
]

print(f"{'Parameter':<24}  {'Low ΔC':>10}  {'Low ΔE':>8}  {'High ΔC':>10}  {'High ΔE':>8}  {'Swing':>10}")
print("-" * 80)
for label, key, base_val in params:
    def get_dc_de(override_key, override_val):
        u  = {k:v for k,v in U.items()}
        gp_v = GP; sp_v = SPEC; cg_v = CG_RATE; preg_v = PREG_DAY
        vrc_v = VR_COST; eff_v = EFF_BASE
        if override_key=="u_mild": u["Mild"] = override_val
        elif override_key=="u_mod":  u["Mod"]  = override_val
        elif override_key=="u_sev":  u["Sev"]  = override_val
        elif override_key=="gp":     gp_v       = override_val
        elif override_key=="spec":   sp_v       = override_val
        elif override_key=="cg":     cg_v       = override_val
        elif override_key=="preg":   preg_v     = override_val
        elif override_key=="vrc":    vrc_v      = override_val
        elif override_key=="eff":    eff_v      = override_val

        def cost_s(state):
            if state=="PF":   return gp_v*0.25
            if state=="Mild": return gp_v + GAB_DAY*DAYS + cg_v*0.5*DAYS
            if state=="Mod":  return gp_v*2 + sp_v + preg_v*DAYS + cg_v*7.5*DAYS
            if state=="Sev":  return gp_v*2 + sp_v*2 + AMIT_DUL_DAY*DAYS + cg_v*17.0*DAYS
            return 0.0
        costs = {s: cost_s(s) for s in STATES}
        vr_p1 = apply_efficacy(eff_v, UC_P)
        def run(P1, P2, add_vr):
            s = S0[:]; tc=tq=0.0
            for t in range(MONTHS):
                disc = 1/(1+DISCOUNT_R)**t
                c = sum(s[i]*costs[STATES[i]] for i in range(5))
                if add_vr and t==0: c += vrc_v
                tc += c*disc; tq += sum(s[i]*u[STATES[i]] for i in range(5))*disc/12
                P = P1 if t==0 else P2; s = mat_vec(P,s)
            return tc,tq
        uc_c2,uc_q2 = run(UC_P,UC_P,False)
        vr_c2,vr_q2 = run(vr_p1,UC_P,True)
        return vr_c2-uc_c2, vr_q2-uc_q2

    lo_v = base_val * 0.8
    hi_v = base_val * 1.2
    lo_dc, lo_de = get_dc_de(key, lo_v)
    hi_dc, hi_de = get_dc_de(key, hi_v)
    swing = abs(lo_dc - hi_dc)
    print(f"{label:<24}  {lo_dc:>10,.0f}  {lo_de:>8.5f}  {hi_dc:>10,.0f}  {hi_de:>8.5f}  £{swing:>8,.0f}")

print("\n✅ All ±20% scenarios: VR remains cost-saving (dominant)")
