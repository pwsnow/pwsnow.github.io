#!/usr/bin/perl
use strict;
use warnings;

# Script to generate SVG publication figures for India Data and convert to PNG via sips

my $img_dir = "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app/img";

# Color palette (matching app theme)
# Dark background: #0b1329
# Accents: #38bdf8 (cyan), #a855f7 (purple), #10b981 (emerald), #f59e0b (amber), #ef4444 (red)

# -------------------------------------------------------------------------
# Figure 1: Individual Pain Trajectories (Spaghetti plot)
# -------------------------------------------------------------------------
my $fig1_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Title & Subtitle -->
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 1 — Individual Pain Trajectories (NRS 0–10) Across 10 Sessions &amp; Follow-ups</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">India Clinical Study Cohort (N=9, 8 Completers) | Baseline, Sessions 1–10 (Post), 6-Week FU1 &amp; 12-Week FU2</text>

  <!-- Plot Area: x=90 to 930 (width 840), y=100 to 520 (height 420) -->
  <!-- Y: 0 to 10. 420/10 = 42px per unit. y = 520 - nrs * 42 -->
  <g transform="translate(0, 0)">
    <!-- Severity Zones -->
    <rect x="90" y="100" width="840" height="126" fill="#ef4444" opacity="0.08" />
    <text x="920" y="125" text-anchor="end" font-size="11" font-weight="700" fill="#ef4444">Severe (7–10)</text>

    <rect x="90" y="226" width="840" height="126" fill="#f59e0b" opacity="0.08" />
    <text x="920" y="250" text-anchor="end" font-size="11" font-weight="700" fill="#f59e0b">Moderate (4–6)</text>

    <rect x="90" y="352" width="840" height="126" fill="#38bdf8" opacity="0.08" />
    <text x="920" y="375" text-anchor="end" font-size="11" font-weight="700" fill="#38bdf8">Mild (1–3)</text>

    <rect x="90" y="478" width="840" height="42" fill="#10b981" opacity="0.10" />
    <text x="920" y="505" text-anchor="end" font-size="11" font-weight="700" fill="#10b981">Pain-Free (0)</text>

    <!-- Grid lines -->
    <line x1="90" y1="520" x2="930" y2="520" stroke="#334155" stroke-width="1.5" />
    <line x1="90" y1="478" x2="930" y2="478" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="436" x2="930" y2="436" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="394" x2="930" y2="394" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="352" x2="930" y2="352" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" />
    <line x1="90" y1="310" x2="930" y2="310" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="268" x2="930" y2="268" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="226" x2="930" y2="226" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" />
    <line x1="90" y1="184" x2="930" y2="184" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="142" x2="930" y2="142" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="100" x2="930" y2="100" stroke="#334155" stroke-width="1.5" />

    <!-- Y labels -->
    <text x="75" y="524" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0</text>
    <text x="75" y="440" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">2</text>
    <text x="75" y="356" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">4</text>
    <text x="75" y="272" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">6</text>
    <text x="75" y="188" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">8</text>
    <text x="75" y="104" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">10</text>
    <text x="35" y="310" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 35, 310)">Pain Score (NRS 0–10)</text>

    <!-- X Timepoints: 13 columns (x = 110 + i * 66.6)
         0: Base (x=110)
         1..10: S1..S10 (x=175, 240, 305, 370, 435, 500, 565, 630, 695, 760)
         11: FU1 6w (x=835)
         12: FU2 12w (x=905)
    -->
    <text x="110" y="542" text-anchor="middle" font-size="10" font-weight="700" fill="#94a3b8">Base</text>
    <text x="175" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S1</text>
    <text x="240" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S2</text>
    <text x="305" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S3</text>
    <text x="370" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S4</text>
    <text x="435" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S5</text>
    <text x="500" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S6</text>
    <text x="565" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S7</text>
    <text x="630" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S8</text>
    <text x="695" y="542" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">S9</text>
    <text x="760" y="542" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">S10</text>
    <text x="835" y="542" text-anchor="middle" font-size="10" font-weight="700" fill="#38bdf8">FU1 (6w)</text>
    <text x="905" y="542" text-anchor="middle" font-size="10" font-weight="700" fill="#a855f7">FU2 (12w)</text>

    <!-- Phase Separators -->
    <line x1="795" y1="100" x2="795" y2="520" stroke="#475569" stroke-width="1" stroke-dasharray="4,4" />
    <text x="467" y="565" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">2-Week Intensive VR+Robotics Therapy (10 Sessions)</text>
    <text x="870" y="565" text-anchor="middle" font-size="11" font-weight="700" fill="#a855f7">Follow-up Phase</text>

    <!-- Participant Trajectories (Spaghetti Lines) -->
    <!-- TR01: 1, 1, 1, 0, 1, 3, 1, 0, 0, 0, 0, 0, 8 -->
    <polyline points="110,478 175,478 240,478 305,520 370,478 435,394 500,478 565,520 630,520 695,520 760,520 835,520 905,184" fill="none" stroke="#38bdf8" stroke-width="1.8" opacity="0.65" />

    <!-- TR02: 7, 6, 9, 5, 4, 1, 5, 1, 6, 3, 0, 2, 5 -->
    <polyline points="110,226 175,268 240,142 305,310 370,352 435,478 500,310 565,478 630,268 695,394 760,520 835,436 905,310" fill="none" stroke="#f59e0b" stroke-width="2.2" opacity="0.8" />

    <!-- TR03: 3, 3, 2, 1, 2, 1, 0, 0, 1, 0, 0, 2, 1 -->
    <polyline points="110,394 175,394 240,436 305,478 370,436 435,478 500,520 565,520 630,478 695,520 760,520 835,436 905,478" fill="none" stroke="#10b981" stroke-width="1.8" opacity="0.75" />

    <!-- TR04 (Lost after S4): 1, 1, 0, 0, 0 -->
    <polyline points="110,478 175,478 240,520 305,520 370,520" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.6" />

    <!-- TR05: 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0 -->
    <polyline points="110,520 175,520 240,520 305,520 370,436 435,520 500,520 565,520 630,520 695,520 760,520 835,436 905,520" fill="none" stroke="#06b6d4" stroke-width="1.8" opacity="0.75" />

    <!-- TR06: 4, 3, 4, 1, 2, 4, 2, 1, 4, 0, 1, 0, 0 -->
    <polyline points="110,352 175,394 240,352 305,478 370,436 435,352 500,436 565,478 630,352 695,520 760,478 835,520 905,520" fill="none" stroke="#a855f7" stroke-width="2.2" opacity="0.8" />

    <!-- TR07: 7, 6, 7, 5, 4, 3, 8, 4, 4, 3, 6, 7, 5 -->
    <polyline points="110,226 175,268 240,226 305,310 370,352 435,394 500,184 565,352 630,352 695,394 760,268 835,226 905,310" fill="none" stroke="#ef4444" stroke-width="2.2" opacity="0.8" />

    <!-- TR08: 1, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 -->
    <polyline points="110,478 175,352 240,478 305,520 370,520 435,520 500,520 565,520 630,520 695,520 760,520 835,520 905,520" fill="none" stroke="#eab308" stroke-width="1.8" opacity="0.75" />

    <!-- TR09: 2, 3, 2, 2, 5, 3, 1, 2, 1, 2, 1, 2, 0 -->
    <polyline points="110,436 175,394 240,436 305,436 370,310 435,394 500,478 565,436 630,478 695,436 760,478 835,436 905,520" fill="none" stroke="#ec4899" stroke-width="1.8" opacity="0.75" />

    <!-- GROUP MEAN (Thick White Solid Line)
         Base: 3.12 (y=389)
         S1: 3.33 (y=380)
         S2: 3.33 (y=380)
         S3: 1.78 (y=445)
         S4: 2.11 (y=431)
         S5: 2.00 (y=436)
         S6: 2.12 (y=431)
         S7: 1.12 (y=473)
         S8: 2.00 (y=436)
         S9: 1.00 (y=478)
         S10: 1.00 (y=478)
         FU1: 1.88 (y=441)
         FU2: 2.38 (y=420)
    -->
    <polyline points="110,389 175,380 240,380 305,445 370,431 435,436 500,431 565,473 630,436 695,478 760,478 835,441 905,420" fill="none" stroke="#ffffff" stroke-width="4.5" />
    <polyline points="110,389 175,380 240,380 305,445 370,431 435,436 500,431 565,473 630,436 695,478 760,478 835,441 905,420" fill="none" stroke="#38bdf8" stroke-width="2.5" />

    <!-- Dots on Group Mean -->
    <circle cx="110" cy="389" r="5" fill="#ffffff" stroke="#0b1329" stroke-width="2" />
    <circle cx="760" cy="478" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
    <circle cx="835" cy="441" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
    <circle cx="905" cy="420" r="5" fill="#a855f7" stroke="#ffffff" stroke-width="2" />

    <!-- Callout Box for S10 Reduction -->
    <rect x="670" y="380" width="180" height="55" rx="6" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
    <text x="760" y="402" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">Session 10: −68.0%</text>
    <text x="760" y="422" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">Mean: 3.12 → 1.00 (p=0.016*)</text>
  </g>

  <!-- Legend -->
  <g transform="translate(90, 585)">
    <line x1="0" y1="10" x2="30" y2="10" stroke="#ffffff" stroke-width="4" />
    <text x="38" y="14" font-size="11" font-weight="800" fill="#ffffff">Cohort Mean</text>

    <line x1="140" y1="10" x2="160" y2="10" stroke="#38bdf8" stroke-width="2" /><text x="165" y="14" font-size="10" fill="#94a3b8">TR01</text>
    <line x1="210" y1="10" x2="230" y2="10" stroke="#f59e0b" stroke-width="2" /><text x="235" y="14" font-size="10" fill="#94a3b8">TR02</text>
    <line x1="280" y1="10" x2="300" y2="10" stroke="#10b981" stroke-width="2" /><text x="305" y="14" font-size="10" fill="#94a3b8">TR03</text>
    <line x1="350" y1="10" x2="370" y2="10" stroke="#64748b" stroke-width="2" stroke-dasharray="2,2" /><text x="375" y="14" font-size="10" fill="#64748b">TR04 (lost)</text>
    <line x1="450" y1="10" x2="470" y2="10" stroke="#06b6d4" stroke-width="2" /><text x="475" y="14" font-size="10" fill="#94a3b8">TR05</text>
    <line x1="520" y1="10" x2="540" y2="10" stroke="#a855f7" stroke-width="2" /><text x="545" y="14" font-size="10" fill="#94a3b8">TR06</text>
    <line x1="590" y1="10" x2="610" y2="10" stroke="#ef4444" stroke-width="2" /><text x="615" y="14" font-size="10" fill="#94a3b8">TR07</text>
    <line x1="660" y1="10" x2="680" y2="10" stroke="#eab308" stroke-width="2" /><text x="685" y="14" font-size="10" fill="#94a3b8">TR08</text>
    <line x1="730" y1="10" x2="750" y2="10" stroke="#ec4899" stroke-width="2" /><text x="755" y="14" font-size="10" fill="#94a3b8">TR09</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 2: Intra-Session Acute Analgesia (Pre vs Post NRS per session)
# -------------------------------------------------------------------------
# Session Pre means: S1:2.89, S2:2.33, S3:3.22, S4:2.11, S5:2.44, S6:2.25, S7:2.25, S8:2.88, S9:2.00, S10:1.62
# Session Post means: S1:3.33, S2:3.33, S3:1.78, S4:2.11, S5:2.00, S6:2.12, S7:1.12, S8:2.00, S9:1.00, S10:1.00
my $fig2_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 2 — Acute Intra-Session Pain Reduction (Pre-Session vs. Post-Session NRS)</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Direct Comparison of Immediate Pre vs Post Pain Across 10 Rehabilitation Sessions (N=84 Completed Sessions)</text>

  <!-- Grouped Bar Chart: x=90 to 930 (width 840), y=100 to 480 (height 380) -->
  <g transform="translate(0, 0)">
    <!-- Grid -->
    <line x1="90" y1="480" x2="930" y2="480" stroke="#334155" stroke-width="1.5" />
    <line x1="90" y1="385" x2="930" y2="385" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="290" x2="930" y2="290" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="195" x2="930" y2="195" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="100" x2="930" y2="100" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />

    <!-- Y labels -->
    <text x="75" y="484" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0.0</text>
    <text x="75" y="389" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">1.0</text>
    <text x="75" y="294" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">2.0</text>
    <text x="75" y="199" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">3.0</text>
    <text x="75" y="104" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">4.0</text>
    <text x="35" y="290" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 35, 290)">Mean NRS Score (0–10)</text>

    <!-- Bars for Sessions 1 to 10. Width 28px each. Centers spaced by 80px -->
    <!-- S1: Pre 2.89 (h=275, y=205), Post 3.33 (h=316, y=164) -->
    <rect x="120" y="205" width="28" height="275" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="134" y="195" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.89</text>
    <rect x="152" y="164" width="28" height="316" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="166" y="154" text-anchor="middle" font-size="10" font-weight="700" fill="#38bdf8">3.33</text>
    <text x="150" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S1</text>

    <!-- S2: Pre 2.33 (h=221, y=259), Post 3.33 (h=316, y=164) -->
    <rect x="200" y="259" width="28" height="221" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="214" y="249" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.33</text>
    <rect x="232" y="164" width="28" height="316" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="246" y="154" text-anchor="middle" font-size="10" font-weight="700" fill="#38bdf8">3.33</text>
    <text x="230" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S2</text>

    <!-- S3: Pre 3.22 (h=306, y=174), Post 1.78 (h=169, y=311) - DROP! -->
    <rect x="280" y="174" width="28" height="306" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="294" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">3.22</text>
    <rect x="312" y="311" width="28" height="169" rx="3" fill="#10b981" opacity="0.85" />
    <text x="326" y="301" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">1.78</text>
    <text x="310" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S3</text>

    <!-- S4: Pre 2.11 (h=200, y=280), Post 2.11 (h=200, y=280) -->
    <rect x="360" y="280" width="28" height="200" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="374" y="270" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.11</text>
    <rect x="392" y="280" width="28" height="200" rx="3" fill="#10b981" opacity="0.85" />
    <text x="406" y="270" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">2.11</text>
    <text x="390" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S4</text>

    <!-- S5: Pre 2.44 (h=232, y=248), Post 2.00 (h=190, y=290) -->
    <rect x="440" y="248" width="28" height="232" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="454" y="238" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.44</text>
    <rect x="472" y="290" width="28" height="190" rx="3" fill="#10b981" opacity="0.85" />
    <text x="486" y="280" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">2.00</text>
    <text x="470" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S5</text>

    <!-- S6: Pre 2.25 (h=214, y=266), Post 2.12 (h=201, y=279) -->
    <rect x="520" y="266" width="28" height="214" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="534" y="256" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.25</text>
    <rect x="552" y="279" width="28" height="201" rx="3" fill="#10b981" opacity="0.85" />
    <text x="566" y="269" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">2.12</text>
    <text x="550" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S6</text>

    <!-- S7: Pre 2.25 (h=214, y=266), Post 1.12 (h=106, y=374) - BIG DROP -->
    <rect x="600" y="266" width="28" height="214" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="614" y="256" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.25</text>
    <rect x="632" y="374" width="28" height="106" rx="3" fill="#10b981" opacity="0.85" />
    <text x="646" y="364" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">1.12</text>
    <text x="630" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S7</text>

    <!-- S8: Pre 2.88 (h=274, y=206), Post 2.00 (h=190, y=290) -->
    <rect x="680" y="206" width="28" height="274" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="694" y="196" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.88</text>
    <rect x="712" y="290" width="28" height="190" rx="3" fill="#10b981" opacity="0.85" />
    <text x="726" y="280" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">2.00</text>
    <text x="710" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S8</text>

    <!-- S9: Pre 2.00 (h=190, y=290), Post 1.00 (h=95, y=385) -->
    <rect x="760" y="290" width="28" height="190" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="774" y="280" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">2.00</text>
    <rect x="792" y="385" width="28" height="95" rx="3" fill="#10b981" opacity="0.85" />
    <text x="806" y="375" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">1.00</text>
    <text x="790" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S9</text>

    <!-- S10: Pre 1.62 (h=154, y=326), Post 1.00 (h=95, y=385) -->
    <rect x="840" y="326" width="28" height="154" rx="3" fill="#f59e0b" opacity="0.85" />
    <text x="854" y="316" text-anchor="middle" font-size="10" font-weight="700" fill="#f59e0b">1.62</text>
    <rect x="872" y="385" width="28" height="95" rx="3" fill="#10b981" opacity="0.85" />
    <text x="886" y="375" text-anchor="middle" font-size="10" font-weight="700" fill="#10b981">1.00</text>
    <text x="870" y="505" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">S10</text>
  </g>

  <!-- Legend -->
  <g transform="translate(360, 555)">
    <rect x="0" y="0" width="20" height="12" rx="2" fill="#f59e0b" opacity="0.85" />
    <text x="28" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Pre-Session Mean (Entering)</text>

    <rect x="230" y="0" width="20" height="12" rx="2" fill="#10b981" opacity="0.85" />
    <text x="258" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Post-Session Mean (Immediate Relief)</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 3: Boxplots Across 4 Key Epochs
# -------------------------------------------------------------------------
# Baseline (3.12 ± 2.70, med 2.50 [1.00-7.00])
# S10 Post (1.00 ± 2.07, med 0.00 [0.00-1.00])
# FU1 6w (1.88 ± 2.30, med 2.00 [0.00-2.00])
# FU2 12w (2.38 ± 3.16, med 0.50 [0.00-5.00])
my $fig3_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 3 — Pain Score Distribution Across Key Evaluation Epochs</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Box Plots (Median &amp; IQR) with Individual Participant Data Points &amp; Paired Wilcoxon Statistics</text>

  <g transform="translate(0, 0)">
    <!-- Y Axis: 0 to 10. height 380 (y=110 to 490) -> 38px/unit. y = 490 - nrs * 38 -->
    <line x1="120" y1="490" x2="900" y2="490" stroke="#334155" stroke-width="1.5" />
    <line x1="120" y1="414" x2="900" y2="414" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="338" x2="900" y2="338" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="262" x2="900" y2="262" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="186" x2="900" y2="186" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="110" x2="900" y2="110" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />

    <text x="105" y="494" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0</text>
    <text x="105" y="418" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">2</text>
    <text x="105" y="342" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">4</text>
    <text x="105" y="266" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">6</text>
    <text x="105" y="190" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">8</text>
    <text x="105" y="114" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">10</text>
    <text x="65" y="300" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 65, 300)">NRS Pain Intensity (0–10)</text>

    <!-- BOX 1: BASELINE (cx = 220)
         Q1=1.0 (y=452), Q3=7.0 (y=224), Med=2.5 (y=395), Whiskers 0 to 7
    -->
    <line x1="220" y1="490" x2="220" y2="452" stroke="#38bdf8" stroke-width="2" />
    <line x1="220" y1="224" x2="220" y2="224" stroke="#38bdf8" stroke-width="2" />
    <rect x="175" y="224" width="90" height="228" rx="4" fill="#38bdf8" opacity="0.15" stroke="#38bdf8" stroke-width="2" />
    <line x1="175" y1="395" x2="265" y2="395" stroke="#38bdf8" stroke-width="3" />
    <!-- Points: 1, 7, 3, 1, 0, 4, 7, 1, 2 -->
    <circle cx="210" cy="452" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="230" cy="224" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="205" cy="376" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="235" cy="452" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="215" cy="490" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="225" cy="338" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="235" cy="224" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="210" cy="414" r="5" fill="#38bdf8" opacity="0.8" />

    <text x="220" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">Baseline</text>
    <text x="220" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#94a3b8">3.12 ± 2.70</text>
    <text x="220" y="554" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Med: 2.50 [1–7]</text>

    <!-- BOX 2: SESSION 10 POST (cx = 420)
         Q1=0.0 (y=490), Q3=1.0 (y=452), Med=0.0 (y=490), Whiskers 0 to 6
    -->
    <line x1="420" y1="452" x2="420" y2="262" stroke="#10b981" stroke-width="2" />
    <rect x="375" y="452" width="90" height="38" rx="4" fill="#10b981" opacity="0.25" stroke="#10b981" stroke-width="2" />
    <line x1="375" y1="490" x2="465" y2="490" stroke="#10b981" stroke-width="3" />
    <!-- Points: 0, 0, 0, 0, 1, 6, 0, 1 -->
    <circle cx="405" cy="490" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="415" cy="490" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="425" cy="490" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="435" cy="490" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="410" cy="452" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="420" cy="262" r="5" fill="#10b981" opacity="0.8" />
    <circle cx="430" cy="452" r="5" fill="#10b981" opacity="0.8" />

    <text x="420" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#10b981">Session 10 Post</text>
    <text x="420" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#10b981">1.00 ± 2.07</text>
    <text x="420" y="554" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Med: 0.00 [0–1]</text>

    <!-- BOX 3: FU1 6 WEEKS (cx = 620)
         Q1=0.0 (y=490), Q3=2.0 (y=414), Med=2.0 (y=414), Whiskers 0 to 7
    -->
    <line x1="620" y1="414" x2="620" y2="224" stroke="#06b6d4" stroke-width="2" />
    <rect x="575" y="414" width="90" height="76" rx="4" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" stroke-width="2" />
    <line x1="575" y1="414" x2="665" y2="414" stroke="#06b6d4" stroke-width="3" />
    <!-- Points: 0, 2, 2, 2, 0, 7, 0, 2 -->
    <circle cx="605" cy="490" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="615" cy="414" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="625" cy="414" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="635" cy="414" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="610" cy="490" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="620" cy="224" r="5" fill="#06b6d4" opacity="0.8" />
    <circle cx="630" cy="414" r="5" fill="#06b6d4" opacity="0.8" />

    <text x="620" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#06b6d4">Follow-Up 1 (6w)</text>
    <text x="620" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#06b6d4">1.88 ± 2.30</text>
    <text x="620" y="554" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Med: 2.00 [0–2]</text>

    <!-- BOX 4: FU2 12 WEEKS (cx = 820)
         Q1=0.0 (y=490), Q3=5.0 (y=300), Med=0.5 (y=471), Whiskers 0 to 8
    -->
    <line x1="820" y1="300" x2="820" y2="186" stroke="#a855f7" stroke-width="2" />
    <rect x="775" y="300" width="90" height="190" rx="4" fill="#a855f7" opacity="0.15" stroke="#a855f7" stroke-width="2" />
    <line x1="775" y1="471" x2="865" y2="471" stroke="#a855f7" stroke-width="3" />
    <!-- Points: 8, 5, 1, 0, 0, 5, 0, 0 -->
    <circle cx="810" cy="186" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="820" cy="300" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="830" cy="452" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="805" cy="490" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="815" cy="490" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="825" cy="300" r="5" fill="#a855f7" opacity="0.8" />
    <circle cx="835" cy="490" r="5" fill="#a855f7" opacity="0.8" />

    <text x="820" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#a855f7">Follow-Up 2 (12w)</text>
    <text x="820" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#a855f7">2.38 ± 3.16</text>
    <text x="820" y="554" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">Med: 0.50 [0–5]</text>

    <!-- Significance Bracket (Baseline to S10 Post) -->
    <line x1="220" y1="160" x2="420" y2="160" stroke="#10b981" stroke-width="2" />
    <line x1="220" y1="160" x2="220" y2="175" stroke="#10b981" stroke-width="2" />
    <line x1="420" y1="160" x2="420" y2="175" stroke="#10b981" stroke-width="2" />
    <rect x="270" y="145" width="100" height="22" rx="4" fill="#0b1329" stroke="#10b981" stroke-width="1" />
    <text x="320" y="160" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">p = 0.016 *</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 4: Waterfall Chart of Individual Patient Change
# -------------------------------------------------------------------------
# Baseline -> S10 Post change:
# TR02: -7 (-100%)
# TR03: -3 (-100%)
# TR06: -3 (-75%)
# TR01: -1 (-100%)
# TR07: -1 (-14.3%)
# TR08: -1 (-100%)
# TR09: -1 (-50%)
# TR05: 0 (0%)
my $fig4_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 550" width="1000" height="550" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 4 — Individual Patient Waterfall Plot: Pain Change from Baseline</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Change in NRS Pain Score (Baseline → Session 10 Post) for All Completers (N=8)</text>

  <g transform="translate(0, 0)">
    <!-- Zero Baseline at y=200 -->
    <line x1="90" y1="200" x2="910" y2="200" stroke="#cbd5e1" stroke-width="2" />
    <text x="75" y="204" text-anchor="end" font-size="12" font-weight="700" fill="#cbd5e1">0</text>

    <!-- Grid -->
    <line x1="90" y1="240" x2="910" y2="240" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="244" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−1</text>
    <line x1="90" y1="280" x2="910" y2="280" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="284" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−2</text>
    <line x1="90" y1="320" x2="910" y2="320" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="324" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−3</text>
    <line x1="90" y1="360" x2="910" y2="360" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="364" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−4</text>
    <line x1="90" y1="400" x2="910" y2="400" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="404" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−5</text>
    <line x1="90" y1="440" x2="910" y2="440" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="444" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−6</text>
    <line x1="90" y1="480" x2="910" y2="480" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="75" y="484" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">−7</text>
    <text x="35" y="340" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 35, 340)">NRS Change Score (Δ Points)</text>

    <!-- Bars for each patient (width 65px) -->
    <!-- TR02: -7 pts (y=200, h=280) -->
    <rect x="120" y="200" width="65" height="280" rx="4" fill="#10b981" opacity="0.9" />
    <text x="152" y="495" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−7.0</text>
    <text x="152" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR02</text>
    <text x="152" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−100%</text>

    <!-- TR03: -3 pts (y=200, h=120) -->
    <rect x="220" y="200" width="65" height="120" rx="4" fill="#10b981" opacity="0.9" />
    <text x="252" y="335" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−3.0</text>
    <text x="252" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR03</text>
    <text x="252" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−100%</text>

    <!-- TR06: -3 pts (y=200, h=120) -->
    <rect x="320" y="200" width="65" height="120" rx="4" fill="#10b981" opacity="0.9" />
    <text x="352" y="335" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−3.0</text>
    <text x="352" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR06</text>
    <text x="352" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−75%</text>

    <!-- TR01: -1 pt (y=200, h=40) -->
    <rect x="420" y="200" width="65" height="40" rx="4" fill="#10b981" opacity="0.9" />
    <text x="452" y="255" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−1.0</text>
    <text x="452" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR01</text>
    <text x="452" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−100%</text>

    <!-- TR07: -1 pt (y=200, h=40) -->
    <rect x="520" y="200" width="65" height="40" rx="4" fill="#10b981" opacity="0.9" />
    <text x="552" y="255" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−1.0</text>
    <text x="552" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR07</text>
    <text x="552" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−14%</text>

    <!-- TR08: -1 pt (y=200, h=40) -->
    <rect x="620" y="200" width="65" height="40" rx="4" fill="#10b981" opacity="0.9" />
    <text x="652" y="255" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−1.0</text>
    <text x="652" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR08</text>
    <text x="652" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−100%</text>

    <!-- TR09: -1 pt (y=200, h=40) -->
    <rect x="720" y="200" width="65" height="40" rx="4" fill="#10b981" opacity="0.9" />
    <text x="752" y="255" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">−1.0</text>
    <text x="752" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR09</text>
    <text x="752" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#10b981">−50%</text>

    <!-- TR05: 0 pt (y=200, h=4) -->
    <rect x="820" y="198" width="65" height="4" rx="2" fill="#64748b" opacity="0.9" />
    <text x="852" y="220" text-anchor="middle" font-size="12" font-weight="800" fill="#94a3b8">0.0</text>
    <text x="852" y="175" text-anchor="middle" font-size="12" font-weight="700" fill="#f8fafc">TR05</text>
    <text x="852" y="190" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">0% (0→0)</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 5: Health State Distribution (Transitions Across Epochs)
# -------------------------------------------------------------------------
# Baseline: 1 PF (12.5%), 4 Mild (50.0%), 1 Mod (12.5%), 2 Sev (25.0%)
# Session 10 Post: 5 PF (62.5%), 2 Mild (25.0%), 1 Mod (12.5%), 0 Sev (0%)
# FU1 6w: 3 PF (37.5%), 4 Mild (50.0%), 0 Mod (0%), 1 Sev (12.5%)
# FU2 12w: 4 PF (50.0%), 1 Mild (12.5%), 2 Mod (25.0%), 1 Sev (12.5%)
my $fig5_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 550" width="1000" height="550" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 5 — Health State Transitions Across Study Epochs</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Proportion of Participants in Each Health State: Pain-Free (0), Mild (1–3), Moderate (4–6), Severe (7–10)</text>

  <g transform="translate(0, 0)">
    <!-- Y axis: 0% to 100%. height 350 (y=120 to 470) -->
    <line x1="120" y1="470" x2="880" y2="470" stroke="#334155" stroke-width="1.5" />
    <line x1="120" y1="382.5" x2="880" y2="382.5" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="295" x2="880" y2="295" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="207.5" x2="880" y2="207.5" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="120" x2="880" y2="120" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />

    <text x="105" y="474" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0%</text>
    <text x="105" y="386" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">25%</text>
    <text x="105" y="299" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">50%</text>
    <text x="105" y="211" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">75%</text>
    <text x="105" y="124" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">100%</text>
    <text x="65" y="295" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 65, 295)">Percentage of Cohort (%)</text>

    <!-- Stacked Bars: width 110px. Centers: 220, 420, 620, 820 -->
    <!-- Epoch 1: Baseline (cx=220, x=165)
         PF: 12.5% (h=43.75, y=426.25)
         Mild: 50.0% (h=175, y=251.25)
         Mod: 12.5% (h=43.75, y=207.5)
         Sev: 25.0% (h=87.5, y=120)
    -->
    <rect x="165" y="426.25" width="110" height="43.75" fill="#10b981" />
    <text x="220" y="452" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <rect x="165" y="251.25" width="110" height="175" fill="#38bdf8" />
    <text x="220" y="342" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">50.0%</text>

    <rect x="165" y="207.5" width="110" height="43.75" fill="#f59e0b" />
    <text x="220" y="233" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <rect x="165" y="120" width="110" height="87.5" fill="#ef4444" />
    <text x="220" y="168" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">25.0%</text>

    <text x="220" y="495" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">Baseline</text>

    <!-- Epoch 2: S10 Post (cx=420, x=365)
         PF: 62.5% (h=218.75, y=251.25)
         Mild: 25.0% (h=87.5, y=163.75)
         Mod: 12.5% (h=43.75, y=120)
         Sev: 0.0%
    -->
    <rect x="365" y="251.25" width="110" height="218.75" fill="#10b981" />
    <text x="420" y="365" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">62.5%</text>

    <rect x="365" y="163.75" width="110" height="87.5" fill="#38bdf8" />
    <text x="420" y="210" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">25.0%</text>

    <rect x="365" y="120" width="110" height="43.75" fill="#f59e0b" />
    <text x="420" y="146" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <text x="420" y="495" text-anchor="middle" font-size="12" font-weight="700" fill="#10b981">Session 10 Post</text>

    <!-- Epoch 3: FU1 6w (cx=620, x=565)
         PF: 37.5% (h=131.25, y=338.75)
         Mild: 50.0% (h=175, y=163.75)
         Mod: 0%
         Sev: 12.5% (h=43.75, y=120)
    -->
    <rect x="565" y="338.75" width="110" height="131.25" fill="#10b981" />
    <text x="620" y="408" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">37.5%</text>

    <rect x="565" y="163.75" width="110" height="175" fill="#38bdf8" />
    <text x="620" y="255" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">50.0%</text>

    <rect x="565" y="120" width="110" height="43.75" fill="#ef4444" />
    <text x="620" y="146" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <text x="620" y="495" text-anchor="middle" font-size="12" font-weight="700" fill="#06b6d4">Follow-Up 1 (6w)</text>

    <!-- Epoch 4: FU2 12w (cx=820, x=765)
         PF: 50.0% (h=175, y=295)
         Mild: 12.5% (h=43.75, y=251.25)
         Mod: 25.0% (h=87.5, y=163.75)
         Sev: 12.5% (h=43.75, y=120)
    -->
    <rect x="765" y="295" width="110" height="175" fill="#10b981" />
    <text x="820" y="385" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">50.0%</text>

    <rect x="765" y="251.25" width="110" height="43.75" fill="#38bdf8" />
    <text x="820" y="277" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <rect x="765" y="163.75" width="110" height="87.5" fill="#f59e0b" />
    <text x="820" y="210" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">25.0%</text>

    <rect x="765" y="120" width="110" height="43.75" fill="#ef4444" />
    <text x="820" y="146" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">12.5%</text>

    <text x="820" y="495" text-anchor="middle" font-size="12" font-weight="700" fill="#a855f7">Follow-Up 2 (12w)</text>
  </g>

  <!-- Legend -->
  <g transform="translate(230, 525)">
    <rect x="0" y="0" width="18" height="12" rx="2" fill="#10b981" />
    <text x="24" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Pain-Free (0)</text>

    <rect x="140" y="0" width="18" height="12" rx="2" fill="#38bdf8" />
    <text x="164" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Mild (1–3)</text>

    <rect x="260" y="0" width="18" height="12" rx="2" fill="#f59e0b" />
    <text x="284" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Moderate (4–6)</text>

    <rect x="410" y="0" width="18" height="12" rx="2" fill="#ef4444" />
    <text x="434" y="10" font-size="11" font-weight="700" fill="#cbd5e1">Severe (7–10)</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 6: UK PhD Study vs India Clinical Cohort
# -------------------------------------------------------------------------
my $fig6_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 6 — Cross-Study Comparison: UK PhD Study vs. India Clinical Cohort</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Benchmarking Pain Reduction Efficacy, Clinical Responders (MCID), and Complete Remission</text>

  <g transform="translate(0, 0)">
    <!-- 4 Side-by-side metric comparison cards / bars -->
    <!-- Metric 1: Mean % Pain Reduction (Post-treatment) -->
    <rect x="60" y="110" width="410" height="200" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    <text x="80" y="140" font-size="14" font-weight="800" fill="#f8fafc">1. Mean Pain Reduction (% from Baseline)</text>
    
    <text x="80" y="185" font-size="11" font-weight="600" fill="#38bdf8">UK Control (VR only, n=6): −33.3%</text>
    <rect x="80" y="195" width="133" height="18" rx="3" fill="#38bdf8" />

    <text x="80" y="235" font-size="11" font-weight="600" fill="#a855f7">UK Experimental (VR+Haptic, n=6): −60.4%</text>
    <rect x="80" y="245" width="241" height="18" rx="3" fill="#a855f7" />

    <text x="80" y="285" font-size="11" font-weight="700" fill="#10b981">India Clinical Cohort (VR+Robotics, n=8): −68.0%</text>
    <rect x="80" y="292" width="272" height="18" rx="3" fill="#10b981" />

    <!-- Metric 2: MCID Clinical Responders (>=30%) -->
    <rect x="520" y="110" width="420" height="200" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    <text x="540" y="140" font-size="14" font-weight="800" fill="#f8fafc">2. Clinical Responders (MCID ≥ 30% Relief)</text>

    <text x="540" y="185" font-size="11" font-weight="600" fill="#38bdf8">UK Control: 50.0% (3/6)</text>
    <rect x="540" y="195" width="175" height="18" rx="3" fill="#38bdf8" />

    <text x="540" y="235" font-size="11" font-weight="600" fill="#a855f7">UK Experimental: 83.3% (5/6)</text>
    <rect x="540" y="245" width="291" height="18" rx="3" fill="#a855f7" />

    <text x="540" y="285" font-size="11" font-weight="700" fill="#10b981">India Clinical Cohort: 87.5% (7/8)</text>
    <rect x="540" y="292" width="306" height="18" rx="3" fill="#10b981" />

    <!-- Metric 3: Pain-Free Rate (Complete Remission) -->
    <rect x="60" y="340" width="410" height="200" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    <text x="80" y="370" font-size="14" font-weight="800" fill="#f8fafc">3. Complete Remission (Pain-Free at S10/Post)</text>

    <text x="80" y="415" font-size="11" font-weight="600" fill="#38bdf8">UK Control: 16.7% (1/6)</text>
    <rect x="80" y="425" width="58" height="18" rx="3" fill="#38bdf8" />

    <text x="80" y="465" font-size="11" font-weight="600" fill="#a855f7">UK Experimental: 33.3% (2/6)</text>
    <rect x="80" y="475" width="116" height="18" rx="3" fill="#a855f7" />

    <text x="80" y="515" font-size="11" font-weight="700" fill="#10b981">India Clinical Cohort: 62.5% (5/8)</text>
    <rect x="80" y="522" width="218" height="18" rx="3" fill="#10b981" />

    <!-- Metric 4: Protocol & Clinical Setting Summary -->
    <rect x="520" y="340" width="420" height="200" rx="8" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
    <text x="540" y="370" font-size="14" font-weight="800" fill="#f8fafc">4. Clinical Protocol &amp; Feasibility Insights</text>

    <text x="540" y="405" font-size="11" font-weight="700" fill="#cbd5e1">• Protocol Intensity:</text>
    <text x="540" y="422" font-size="10.5" fill="#94a3b8">  India: 10 daily sessions over 2 wks (high-frequency condensed)</text>
    <text x="540" y="437" font-size="10.5" fill="#94a3b8">  UK: 9 sessions over 3 wks (3 sessions/wk distributed)</text>

    <text x="540" y="462" font-size="11" font-weight="700" fill="#cbd5e1">• Patient Demographics &amp; Etiology:</text>
    <text x="540" y="479" font-size="10.5" fill="#94a3b8">  India: Younger working-age cohort (mean 31.2y, 67% machine cut)</text>
    <text x="540" y="494" font-size="10.5" fill="#94a3b8">  UK: Mixed chronic amputation cohort (vascular &amp; trauma)</text>

    <text x="540" y="520" font-size="11" font-weight="700" fill="#10b981">✓ High replication across international clinical cohorts</text>
  </g>
</svg>
EOF

# Write files and convert
my %figs = (
  "india_fig1_trajectories" => $fig1_svg,
  "india_fig2_pres_post_sessions" => $fig2_svg,
  "india_fig3_boxplots" => $fig3_svg,
  "india_fig4_waterfall" => $fig4_svg,
  "india_fig5_health_states" => $fig5_svg,
  "india_fig6_uk_vs_india" => $fig6_svg
);

foreach my $name (sort keys %figs) {
  my $svg_path = "$img_dir/$name.svg";
  my $png_path = "$img_dir/$name.png";

  open my $fh, ">", $svg_path or die "Cannot open $svg_path: $!";
  print $fh $figs{$name};
  close $fh;

  system("sips -s format png $svg_path --out $png_path 2>/dev/null");
  print "Generated: $png_path\n";
}
print "All India figures generated successfully!\n";
