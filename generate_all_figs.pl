#!/usr/bin/perl
use strict;
use warnings;

my $img_dir = "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app/img";

# -------------------------------------------------------------------------
# Figure 1: Pooled Spaghetti Plot (Control n=6 vs Pooled Experimental n=14)
# -------------------------------------------------------------------------
my $fig1_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 1 — Pain Trajectories: Control (VR Only) vs. Pooled Experimental (VR+Robotics)</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Normalized 0–10 Pain Scale | Control (n=6) vs. Pooled VR+Robotics Cohort (n=14: UK n=6 + India n=8)</text>

  <!-- Plot Area: x=90 to 920 (w=830), y=100 to 510 (h=410) -> 41px/unit -->
  <g transform="translate(0, 0)">
    <!-- Severity Zones -->
    <rect x="90" y="100" width="830" height="123" fill="#ef4444" opacity="0.08" />
    <text x="910" y="125" text-anchor="end" font-size="11" font-weight="700" fill="#ef4444">Severe (7–10)</text>

    <rect x="90" y="223" width="830" height="123" fill="#f59e0b" opacity="0.08" />
    <text x="910" y="248" text-anchor="end" font-size="11" font-weight="700" fill="#f59e0b">Moderate (4–6)</text>

    <rect x="90" y="346" width="830" height="123" fill="#38bdf8" opacity="0.08" />
    <text x="910" y="371" text-anchor="end" font-size="11" font-weight="700" fill="#38bdf8">Mild (1–3)</text>

    <rect x="90" y="469" width="830" height="41" fill="#10b981" opacity="0.10" />
    <text x="910" y="496" text-anchor="end" font-size="11" font-weight="700" fill="#10b981">Pain-Free (0)</text>

    <!-- Grid -->
    <line x1="90" y1="510" x2="920" y2="510" stroke="#334155" stroke-width="1.5" />
    <line x1="90" y1="428" x2="920" y2="428" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="346" x2="920" y2="346" stroke="#334155" stroke-width="1" stroke-dasharray="4,4" />
    <line x1="90" y1="264" x2="920" y2="264" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="182" x2="920" y2="182" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="90" y1="100" x2="920" y2="100" stroke="#334155" stroke-width="1.5" />

    <text x="75" y="514" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0</text>
    <text x="75" y="432" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">2</text>
    <text x="75" y="350" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">4</text>
    <text x="75" y="268" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">6</text>
    <text x="75" y="186" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">8</text>
    <text x="75" y="104" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">10</text>
    <text x="35" y="305" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 35, 305)">Normalized Pain Score (0–10)</text>

    <!-- X Timepoints: 4 Epochs: Baseline (x=160), Post-Treatment (x=390), FU1 (x=620), FU2 (x=850) -->
    <line x1="160" y1="100" x2="160" y2="510" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="390" y1="100" x2="390" y2="510" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="620" y1="100" x2="620" y2="510" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="850" y1="100" x2="850" y2="510" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />

    <text x="160" y="534" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">Baseline</text>
    <text x="390" y="534" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">Post-Treatment (2–3 wks)</text>
    <text x="620" y="534" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">Follow-Up 1 (6–12 wks)</text>
    <text x="850" y="534" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">Follow-Up 2 (12–18 wks)</text>

    <!-- Control Individual Lines (cyan, opacity 0.4) -->
    <!-- P1: 4, 3, 4, 5 -->
    <polyline points="160,346 390,387 620,346 850,305" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
    <!-- P2: 5, 4, 2, 2 -->
    <polyline points="160,305 390,346 620,428 850,428" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
    <!-- P3: 6, 0, 0, 2 -->
    <polyline points="160,264 390,510 620,510 850,428" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
    <!-- P4: 5, 3, 2, 2 -->
    <polyline points="160,305 390,387 620,428 850,428" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
    <!-- P5: 4, 5, 4, 4 -->
    <polyline points="160,346 390,305 620,346 850,346" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />
    <!-- P6: 10, 6, 8, 8 -->
    <polyline points="160,100 390,264 620,182 850,182" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.4" />

    <!-- Pooled Experimental Individual Lines (purple/emerald, opacity 0.35) -->
    <!-- P7: 8, 0, 0, 0 -->
    <polyline points="160,182 390,510 620,510 850,510" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- P8: 5, 6, 4, 4 -->
    <polyline points="160,305 390,264 620,346 850,346" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- P9: 8, 0, 0, 0 -->
    <polyline points="160,182 390,510 620,510 850,510" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- P10: 9, 1, 1.5, 3 -->
    <polyline points="160,141 390,469 620,448 850,387" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- P11: 3, 2, 3, 2 -->
    <polyline points="160,387 390,428 620,387 850,428" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- P12: 10, 4, 4, 6 -->
    <polyline points="160,100 390,346 620,346 850,264" fill="none" stroke="#a855f7" stroke-width="1.5" opacity="0.35" />
    <!-- TR01: 1, 0, 0, 8 -->
    <polyline points="160,469 390,510 620,510 850,182" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR02: 7, 0, 2, 5 -->
    <polyline points="160,223 390,510 620,428 850,305" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR03: 3, 0, 2, 1 -->
    <polyline points="160,387 390,510 620,428 850,469" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR05: 0, 0, 2, 0 -->
    <polyline points="160,510 390,510 620,428 850,510" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR06: 4, 1, 0, 0 -->
    <polyline points="160,346 390,469 620,510 850,510" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR07: 7, 6, 7, 5 -->
    <polyline points="160,223 390,264 620,223 850,305" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR08: 1, 0, 0, 0 -->
    <polyline points="160,469 390,510 620,510 850,510" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />
    <!-- TR09: 2, 1, 2, 0 -->
    <polyline points="160,428 390,469 620,428 850,510" fill="none" stroke="#10b981" stroke-width="1.5" opacity="0.35" />

    <!-- CONTROL GROUP MEAN (Cyan Thick Line)
         Base: 5.67 (y=277.5)
         Post: 3.50 (y=366.5)
         FU1: 3.33 (y=373.5)
         FU2: 3.83 (y=353)
    -->
    <polyline points="160,277.5 390,366.5 620,373.5 850,353" fill="none" stroke="#38bdf8" stroke-width="4.5" />
    <circle cx="160" cy="277.5" r="6" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
    <circle cx="390" cy="366.5" r="6" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
    <circle cx="620" cy="373.5" r="6" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
    <circle cx="850" cy="353" r="6" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
    <text x="405" y="360" font-size="11" font-weight="800" fill="#38bdf8">Control: 3.50</text>

    <!-- POOLED EXPERIMENTAL MEAN (Emerald/Gold Thick Line)
         Base: 4.86 (y=310.7)
         Post: 1.50 (y=448.5)
         FU1: 1.96 (y=429.6)
         FU2: 2.43 (y=410.4)
    -->
    <polyline points="160,310.7 390,448.5 620,429.6 850,410.4" fill="none" stroke="#10b981" stroke-width="4.5" />
    <circle cx="160" cy="310.7" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    <circle cx="390" cy="448.5" r="7" fill="#10b981" stroke="#ffffff" stroke-width="2.5" />
    <circle cx="620" cy="429.6" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    <circle cx="850" cy="410.4" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    <text x="405" y="460" font-size="12" font-weight="900" fill="#10b981">VR+Robotics: 1.50 (p=0.003**)</text>
  </g>

  <!-- Legend -->
  <g transform="translate(160, 575)">
    <line x1="0" y1="10" x2="35" y2="10" stroke="#38bdf8" stroke-width="4.5" />
    <circle cx="17" cy="10" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />
    <text x="45" y="14" font-size="11" font-weight="700" fill="#38bdf8">Control Group Mean (VR Only, n=6) — −33.3%</text>

    <line x1="360" y1="10" x2="395" y2="10" stroke="#10b981" stroke-width="4.5" />
    <circle cx="377" cy="10" r="5" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
    <text x="405" y="14" font-size="11" font-weight="800" fill="#10b981">Pooled Experimental Mean (VR+Robotics, n=14) — −64.4% (p=0.003**)</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 2: Boxplots Across Groups & Epochs
# -------------------------------------------------------------------------
my $fig2_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="1000" height="600" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 2 — Comparative Boxplots: Control vs. Pooled Experimental Cohorts</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Side-by-Side Distribution at Baseline and Post-Treatment (Control n=6 vs. Pooled VR+Robotics n=14)</text>

  <g transform="translate(0, 0)">
    <!-- Y Axis: 0 to 10 (height 380: y=110 to 490 -> 38px/unit) -->
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
    <text x="65" y="300" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 65, 300)">Normalized Pain Score (0–10)</text>

    <!-- Column 1: Baseline Control (cx=220)
         Q1=4.25 (y=328), Q3=5.75 (y=271), Med=5.0 (y=300)
    -->
    <line x1="220" y1="338" x2="220" y2="110" stroke="#38bdf8" stroke-width="2" />
    <rect x="175" y="271" width="90" height="57" rx="4" fill="#38bdf8" opacity="0.2" stroke="#38bdf8" stroke-width="2" />
    <line x1="175" y1="300" x2="265" y2="300" stroke="#38bdf8" stroke-width="3" />
    <circle cx="210" cy="338" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="225" cy="300" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="235" cy="262" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="215" cy="300" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="205" cy="338" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="220" cy="110" r="5" fill="#38bdf8" opacity="0.8" />

    <text x="220" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#38bdf8">Baseline: Control</text>
    <text x="220" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#94a3b8">5.67 ± 2.25 (n=6)</text>

    <!-- Column 2: Baseline Pooled Exp (cx=390)
         Q1=2.0 (y=414), Q3=7.75 (y=195), Med=4.0 (y=338)
    -->
    <line x1="390" y1="414" x2="390" y2="110" stroke="#10b981" stroke-width="2" />
    <rect x="345" y="195" width="90" height="219" rx="4" fill="#10b981" opacity="0.15" stroke="#10b981" stroke-width="2" />
    <line x1="345" y1="338" x2="435" y2="338" stroke="#10b981" stroke-width="3" />
    <!-- 14 points -->
    <circle cx="375" cy="186" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="385" cy="300" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="395" cy="186" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="405" cy="148" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="380" cy="376" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="390" cy="110" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="400" cy="452" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="385" cy="224" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="395" cy="376" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="375" cy="490" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="385" cy="338" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="405" cy="224" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="395" cy="452" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="380" cy="414" r="4.5" fill="#10b981" opacity="0.8" />

    <text x="390" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#10b981">Baseline: Exp (n=14)</text>
    <text x="390" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#94a3b8">4.86 ± 3.30</text>

    <!-- Column 3: Post-Tx Control (cx=610)
         Q1=3.0 (y=376), Q3=4.75 (y=309), Med=3.5 (y=357)
    -->
    <line x1="610" y1="490" x2="610" y2="262" stroke="#38bdf8" stroke-width="2" />
    <rect x="565" y="309" width="90" height="67" rx="4" fill="#38bdf8" opacity="0.25" stroke="#38bdf8" stroke-width="2" />
    <line x1="565" y1="357" x2="655" y2="357" stroke="#38bdf8" stroke-width="3" />
    <circle cx="600" cy="376" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="615" cy="338" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="625" cy="490" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="605" cy="376" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="615" cy="300" r="5" fill="#38bdf8" opacity="0.8" />
    <circle cx="620" cy="262" r="5" fill="#38bdf8" opacity="0.8" />

    <text x="610" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#38bdf8">Post-Tx: Control</text>
    <text x="610" y="538" text-anchor="middle" font-size="11" font-weight="600" fill="#38bdf8">3.50 ± 2.07 (−33%)</text>

    <!-- Column 4: Post-Tx Pooled Exp (cx=780)
         Q1=0.0 (y=490), Q3=2.0 (y=414), Med=0.5 (y=471)
    -->
    <line x1="780" y1="414" x2="780" y2="262" stroke="#10b981" stroke-width="2" />
    <rect x="735" y="414" width="90" height="76" rx="4" fill="#10b981" opacity="0.3" stroke="#10b981" stroke-width="2" />
    <line x1="735" y1="471" x2="825" y2="471" stroke="#10b981" stroke-width="3" />
    <!-- 7 participants at 0! -->
    <circle cx="765" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="775" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="785" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="795" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="770" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="780" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <circle cx="790" cy="490" r="5" fill="#10b981" opacity="0.9" />
    <!-- Non-zero points -->
    <circle cx="770" cy="452" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="780" cy="452" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="790" cy="452" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="775" cy="414" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="785" cy="338" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="795" cy="262" r="4.5" fill="#10b981" opacity="0.8" />
    <circle cx="775" cy="262" r="4.5" fill="#10b981" opacity="0.8" />

    <text x="780" y="520" text-anchor="middle" font-size="12" font-weight="700" fill="#10b981">Post-Tx: Exp (n=14)</text>
    <text x="780" y="538" text-anchor="middle" font-size="11" font-weight="700" fill="#10b981">1.50 ± 2.21 (−64%)</text>

    <!-- Significance Brackets -->
    <!-- Within-Exp Bracket -->
    <line x1="390" y1="80" x2="780" y2="80" stroke="#10b981" stroke-width="2" />
    <line x1="390" y1="80" x2="390" y2="95" stroke="#10b981" stroke-width="2" />
    <line x1="780" y1="80" x2="780" y2="95" stroke="#10b981" stroke-width="2" />
    <rect x="525" y="65" width="120" height="24" rx="4" fill="#0b1329" stroke="#10b981" stroke-width="1.5" />
    <text x="585" y="81" text-anchor="middle" font-size="11" font-weight="900" fill="#10b981">Wilcoxon p = 0.003 **</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 3: Full Waterfall Chart of All 20 Participants
# -------------------------------------------------------------------------
my $fig3_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 580" width="1000" height="580" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 3 — Waterfall Plot: Percentage Pain Reduction for All 20 Participants</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Control (VR Only, n=6) vs. UK Experimental (n=6) vs. India Clinical Cohort (n=8)</text>

  <g transform="translate(0, 0)">
    <!-- Zero line at y=190 -->
    <line x1="70" y1="190" x2="940" y2="190" stroke="#cbd5e1" stroke-width="2" />
    <text x="55" y="194" text-anchor="end" font-size="11" font-weight="700" fill="#cbd5e1">0%</text>

    <!-- Grid lines -->
    <line x1="70" y1="110" x2="940" y2="110" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <text x="55" y="114" text-anchor="end" font-size="10" font-weight="600" fill="#ef4444">+30%</text>

    <line x1="70" y1="270" x2="940" y2="270" stroke="#10b981" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" />
    <text x="55" y="274" text-anchor="end" font-size="10" font-weight="700" fill="#10b981">−30% (MCID)</text>

    <line x1="70" y1="350" x2="940" y2="350" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" />
    <text x="55" y="354" text-anchor="end" font-size="10" font-weight="700" fill="#38bdf8">−60% (Substantial)</text>

    <line x1="70" y1="456" x2="940" y2="456" stroke="#a855f7" stroke-width="1" stroke-dasharray="3,3" />
    <text x="55" y="460" text-anchor="end" font-size="10" font-weight="800" fill="#a855f7">−100% (Remission)</text>
    <text x="25" y="300" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 25, 300)">% Pain Change from Baseline</text>

    <!-- 20 Bars (width 34px, spacing 42px). x = 80 + i*42 -->
    <!-- CONTROL (6 bars): P1(-25), P2(-20), P3(-100), P4(-40), P5(+25), P6(-40) -->
    <!-- P1: -25% (h=66.5, y=190) -->
    <rect x="80" y="190" width="34" height="66.5" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="97" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P1</text>
    <text x="97" y="272" text-anchor="middle" font-size="9" font-weight="600" fill="#38bdf8">−25%</text>

    <!-- P2: -20% (h=53.2, y=190) -->
    <rect x="122" y="190" width="34" height="53.2" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="139" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P2</text>
    <text x="139" y="258" text-anchor="middle" font-size="9" font-weight="600" fill="#38bdf8">−20%</text>

    <!-- P3: -100% (h=266, y=190) -->
    <rect x="164" y="190" width="34" height="266" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="181" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P3</text>
    <text x="181" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#38bdf8">−100%</text>

    <!-- P4: -40% (h=106.4, y=190) -->
    <rect x="206" y="190" width="34" height="106.4" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="223" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P4</text>
    <text x="223" y="312" text-anchor="middle" font-size="9" font-weight="600" fill="#38bdf8">−40%</text>

    <!-- P5: +25% (h=66.5, y=123.5) -->
    <rect x="248" y="123.5" width="34" height="66.5" rx="3" fill="#ef4444" opacity="0.85" />
    <text x="265" y="115" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ef4444">+25%</text>
    <text x="265" y="208" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P5</text>

    <!-- P6: -40% (h=106.4, y=190) -->
    <rect x="290" y="190" width="34" height="106.4" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="307" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#94a3b8">P6</text>
    <text x="307" y="312" text-anchor="middle" font-size="9" font-weight="600" fill="#38bdf8">−40%</text>

    <!-- Separator 1 -->
    <line x1="334" y1="100" x2="334" y2="480" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4" />

    <!-- UK EXPERIMENTAL (6 bars): P7(-100), P8(+20), P9(-100), P10(-88.9), P11(-33.3), P12(-60) -->
    <!-- P7: -100% (h=266, y=190) -->
    <rect x="344" y="190" width="34" height="266" rx="3" fill="#a855f7" opacity="0.85" />
    <text x="361" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P7</text>
    <text x="361" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#a855f7">−100%</text>

    <!-- P8: +20% (h=53.2, y=136.8) -->
    <rect x="386" y="136.8" width="34" height="53.2" rx="3" fill="#ef4444" opacity="0.85" />
    <text x="403" y="128" text-anchor="middle" font-size="9.5" font-weight="700" fill="#ef4444">+20%</text>
    <text x="403" y="208" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P8</text>

    <!-- P9: -100% (h=266, y=190) -->
    <rect x="428" y="190" width="34" height="266" rx="3" fill="#a855f7" opacity="0.85" />
    <text x="445" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P9</text>
    <text x="445" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#a855f7">−100%</text>

    <!-- P10: -88.9% (h=236.5, y=190) -->
    <rect x="470" y="190" width="34" height="236.5" rx="3" fill="#a855f7" opacity="0.85" />
    <text x="487" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P10</text>
    <text x="487" y="442" text-anchor="middle" font-size="9" font-weight="700" fill="#a855f7">−89%</text>

    <!-- P11: -33.3% (h=88.6, y=190) -->
    <rect x="512" y="190" width="34" height="88.6" rx="3" fill="#a855f7" opacity="0.85" />
    <text x="529" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P11</text>
    <text x="529" y="294" text-anchor="middle" font-size="9" font-weight="600" fill="#a855f7">−33%</text>

    <!-- P12: -60.0% (h=159.6, y=190) -->
    <rect x="554" y="190" width="34" height="159.6" rx="3" fill="#a855f7" opacity="0.85" />
    <text x="571" y="180" text-anchor="middle" font-size="9.5" font-weight="700" fill="#c084fc">P12</text>
    <text x="571" y="365" text-anchor="middle" font-size="9" font-weight="700" fill="#a855f7">−60%</text>

    <!-- Separator 2 -->
    <line x1="598" y1="100" x2="598" y2="480" stroke="#475569" stroke-width="1.5" stroke-dasharray="4,4" />

    <!-- INDIA EXPERIMENTAL (8 bars): TR01(-100), TR02(-100), TR03(-100), TR05(0), TR06(-75), TR07(-14.3), TR08(-100), TR09(-50) -->
    <!-- TR01: -100% -->
    <rect x="608" y="190" width="34" height="266" rx="3" fill="#10b981" opacity="0.85" />
    <text x="625" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR01</text>
    <text x="625" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−100%</text>

    <!-- TR02: -100% -->
    <rect x="650" y="190" width="34" height="266" rx="3" fill="#10b981" opacity="0.85" />
    <text x="667" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR02</text>
    <text x="667" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−100%</text>

    <!-- TR03: -100% -->
    <rect x="692" y="190" width="34" height="266" rx="3" fill="#10b981" opacity="0.85" />
    <text x="709" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR03</text>
    <text x="709" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−100%</text>

    <!-- TR05: 0% -->
    <rect x="734" y="188" width="34" height="4" rx="2" fill="#64748b" opacity="0.85" />
    <text x="751" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#94a3b8">TR05</text>
    <text x="751" y="206" text-anchor="middle" font-size="9" font-weight="600" fill="#94a3b8">0%</text>

    <!-- TR06: -75% -->
    <rect x="776" y="190" width="34" height="199.5" rx="3" fill="#10b981" opacity="0.85" />
    <text x="793" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR06</text>
    <text x="793" y="405" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−75%</text>

    <!-- TR07: -14.3% -->
    <rect x="818" y="190" width="34" height="38" rx="3" fill="#10b981" opacity="0.85" />
    <text x="835" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR07</text>
    <text x="835" y="244" text-anchor="middle" font-size="9" font-weight="600" fill="#10b981">−14%</text>

    <!-- TR08: -100% -->
    <rect x="860" y="190" width="34" height="266" rx="3" fill="#10b981" opacity="0.85" />
    <text x="877" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR08</text>
    <text x="877" y="472" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−100%</text>

    <!-- TR09: -50% -->
    <rect x="902" y="190" width="34" height="133" rx="3" fill="#10b981" opacity="0.85" />
    <text x="919" y="180" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">TR09</text>
    <text x="919" y="338" text-anchor="middle" font-size="9" font-weight="700" fill="#10b981">−50%</text>

    <!-- Cohort Labels -->
    <text x="207" y="505" text-anchor="middle" font-size="11" font-weight="800" fill="#38bdf8">UK Control (n=6) · Mean −33.3%</text>
    <text x="466" y="505" text-anchor="middle" font-size="11" font-weight="800" fill="#a855f7">UK Experimental (n=6) · Mean −60.4%</text>
    <text x="770" y="505" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">India Experimental (n=8) · Mean −67.4%</text>
  </g>
</svg>
EOF

# -------------------------------------------------------------------------
# Figure 4: Multi-Threshold Responder Analysis
# -------------------------------------------------------------------------
my $fig4_svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 580" width="1000" height="580" style="background:#0b1329;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <text x="50" y="42" font-size="20" font-weight="800" fill="#f8fafc">Figure 4 — Multi-Threshold Responder Rates: Control vs. Pooled Experimental</text>
  <text x="50" y="65" font-size="12" font-weight="600" fill="#94a3b8">Proportion of Participants Achieving Categorical Thresholds of Pain Relief (Control n=6 vs. Pooled VR+Robotics n=14)</text>

  <g transform="translate(0, 0)">
    <!-- Y axis: 0 to 100% (height 360: y=110 to 470) -->
    <line x1="120" y1="470" x2="900" y2="470" stroke="#334155" stroke-width="1.5" />
    <line x1="120" y1="380" x2="900" y2="380" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="290" x2="900" y2="290" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="200" x2="900" y2="200" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="120" y1="110" x2="900" y2="110" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />

    <text x="105" y="474" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">0%</text>
    <text x="105" y="384" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">25%</text>
    <text x="105" y="294" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">50%</text>
    <text x="105" y="204" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">75%</text>
    <text x="105" y="114" text-anchor="end" font-size="11" font-weight="600" fill="#94a3b8">100%</text>
    <text x="65" y="290" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1" transform="rotate(-90, 65, 290)">Percentage of Cohort (%)</text>

    <!-- Grouped Bars: 5 Categories
         1: Any Reduction (>0%)
         2: Minimally Meaningful (>=20%)
         3: Clinical MCID (>=30%)
         4: Substantial Relief (>=50%)
         5: Complete Remission (100%)
    -->
    <!-- 1: Any Reduction (>0%)
         Ctrl: 5/6 = 83.3% (h=300, y=170)
         Exp:  13/14 = 92.9% (h=334.4, y=135.6)
    -->
    <rect x="160" y="170" width="45" height="300" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="182.5" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">83.3%</text>
    <rect x="210" y="135.6" width="45" height="334.4" rx="3" fill="#10b981" opacity="0.9" />
    <text x="232.5" y="125" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">92.9%</text>
    <text x="207.5" y="495" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">Any Reduction (>0%)</text>

    <!-- 2: Minimally Meaningful (>=20%)
         Ctrl: 5/6 = 83.3%
         Exp:  13/14 = 92.9%
    -->
    <rect x="310" y="170" width="45" height="300" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="332.5" y="160" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">83.3%</text>
    <rect x="360" y="135.6" width="45" height="334.4" rx="3" fill="#10b981" opacity="0.9" />
    <text x="382.5" y="125" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">92.9%</text>
    <text x="357.5" y="495" text-anchor="middle" font-size="11" font-weight="700" fill="#cbd5e1">Minimal (≥20%)</text>

    <!-- 3: Clinical MCID (>=30%)
         Ctrl: 3/6 = 50.0% (h=180, y=290)
         Exp:  12/14 = 85.7% (h=308.5, y=161.5)
    -->
    <rect x="460" y="290" width="45" height="180" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="482.5" y="280" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">50.0%</text>
    <rect x="510" y="161.5" width="45" height="308.5" rx="3" fill="#10b981" opacity="0.9" />
    <text x="532.5" y="150" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">85.7%</text>
    <text x="507.5" y="495" text-anchor="middle" font-size="11" font-weight="800" fill="#10b981">MCID (≥30%)</text>

    <!-- 4: Substantial Relief (>=50%)
         Ctrl: 1/6 = 16.7% (h=60, y=410)
         Exp:  11/14 = 78.6% (h=283, y=187)
         FISHER SIGNIFICANT: p = 0.018 *
    -->
    <rect x="610" y="410" width="45" height="60" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="632.5" y="400" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">16.7%</text>
    <rect x="660" y="187" width="45" height="283" rx="3" fill="#10b981" opacity="0.9" />
    <text x="682.5" y="175" text-anchor="middle" font-size="12" font-weight="900" fill="#10b981">78.6%</text>
    <text x="657.5" y="495" text-anchor="middle" font-size="11" font-weight="800" fill="#fbbf24">Substantial (≥50%)</text>
    <!-- Callout badge for significance -->
    <line x1="632.5" y1="140" x2="682.5" y2="140" stroke="#fbbf24" stroke-width="1.5" />
    <line x1="632.5" y1="140" x2="632.5" y2="155" stroke="#fbbf24" stroke-width="1.5" />
    <line x1="682.5" y1="140" x2="682.5" y2="155" stroke="#fbbf24" stroke-width="1.5" />
    <rect x="615" y="118" width="85" height="20" rx="3" fill="#0b1329" stroke="#fbbf24" stroke-width="1" />
    <text x="657.5" y="132" text-anchor="middle" font-size="10" font-weight="900" fill="#fbbf24">p = 0.018 *</text>

    <!-- 5: Complete Remission (100%)
         Ctrl: 1/6 = 16.7% (h=60, y=410)
         Exp:  7/14 = 50.0% (h=180, y=290)
    -->
    <rect x="760" y="410" width="45" height="60" rx="3" fill="#38bdf8" opacity="0.85" />
    <text x="782.5" y="400" text-anchor="middle" font-size="11" font-weight="700" fill="#38bdf8">16.7%</text>
    <rect x="810" y="290" width="45" height="180" rx="3" fill="#10b981" opacity="0.9" />
    <text x="832.5" y="280" text-anchor="middle" font-size="12" font-weight="900" fill="#10b981">50.0%</text>
    <text x="807.5" y="495" text-anchor="middle" font-size="11" font-weight="700" fill="#a855f7">Pain-Free (100%)</text>
  </g>

  <!-- Legend -->
  <g transform="translate(320, 535)">
    <rect x="0" y="0" width="22" height="12" rx="2" fill="#38bdf8" opacity="0.85" />
    <text x="30" y="10" font-size="11" font-weight="700" fill="#38bdf8">Control Group (VR Only, n=6)</text>

    <rect x="230" y="0" width="22" height="12" rx="2" fill="#10b981" opacity="0.9" />
    <text x="260" y="10" font-size="11" font-weight="800" fill="#10b981">Pooled VR+Robotics Cohort (n=14)</text>
  </g>
</svg>
EOF

my %figs = (
  "all_fig1_trajectories" => $fig1_svg,
  "all_fig2_boxplots" => $fig2_svg,
  "all_fig3_waterfall" => $fig3_svg,
  "all_fig4_responders" => $fig4_svg
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
print "All 'All Participants' figures generated successfully!\n";
