#!/usr/bin/perl
use strict;
use warnings;

my @dest_dirs = (
    "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app/img",
    "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app-lite/img",
    "/Users/petersnow/.gemini/antigravity/brain/916ce631-93cd-4422-a1a1-488020f80ac7"
);

my $svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1020" width="1600" height="1020" style="background:#070d18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1329" />
      <stop offset="50%" stop-color="#070c17" />
      <stop offset="100%" stop-color="#03060d" />
    </linearGradient>

    <!-- Card Backgrounds -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(15,23,42,0.95)" />
      <stop offset="100%" stop-color="rgba(11,18,33,0.98)" />
    </linearGradient>
    <linearGradient id="groenveldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(14,35,65,0.85)" />
      <stop offset="100%" stop-color="rgba(8,20,40,0.95)" />
    </linearGradient>
    <linearGradient id="uclGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(10,45,35,0.85)" />
      <stop offset="100%" stop-color="rgba(8,28,25,0.95)" />
    </linearGradient>

    <!-- Filters -->
    <filter id="cardShadow" x="-2%" y="-6%" width="104%" height="116%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1600" height="1020" fill="url(#bgGrad)" />

  <!-- ═══════════════════ HEADER ═══════════════════ -->
  <g transform="translate(60, 32)">
    <rect x="0" y="0" width="1480" height="92" rx="14" fill="url(#cardBg)" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" filter="url(#cardShadow)" />
    
    <text x="32" y="38" font-size="23" font-weight="900" fill="#ffffff" letter-spacing="-0.02em;">
      Systematic Comparison: Groenveld et al. (2025) vs. UCLTouchRehab Model
    </text>
    <text x="32" y="68" font-size="13.5" font-weight="500" fill="#94a3b8">
      Methodological evolution: Surgical VR Distraction (Netherlands) vs. Chronic Robotic Neurorehabilitation (UK NHS Reference Case)
    </text>

    <!-- Legend Badges in Header -->
    <g transform="translate(970, 27)">
      <rect x="0" y="0" width="225" height="40" rx="8" fill="rgba(56,189,248,0.12)" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="20" cy="20" r="6" fill="#38bdf8" />
      <text x="34" y="25" font-size="12.5" font-weight="800" fill="#38bdf8">Groenveld et al. (2025)</text>
    </g>
    <g transform="translate(1220, 27)">
      <rect x="0" y="0" width="235" height="40" rx="8" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="1.5" />
      <circle cx="20" cy="20" r="6" fill="#10b981" />
      <text x="34" y="25" font-size="12.5" font-weight="900" fill="#34d399">UCLTouchRehab (This Study)</text>
    </g>
  </g>

  <!-- ═══════════════════ COLUMN HEADERS ═══════════════════ -->
  <g transform="translate(60, 140)">
    <text x="20" y="14" font-size="11.5" font-weight="800" fill="#64748b" text-transform="uppercase" letter-spacing="0.1em;">EVALUATION DOMAIN</text>
    <text x="280" y="14" font-size="11.5" font-weight="800" fill="#38bdf8" text-transform="uppercase" letter-spacing="0.1em;">GROENVELD ET AL. (2025) — BENCHMARK</text>
    <text x="805" y="14" font-size="11.5" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.1em;">STRATEGIC ADVANCE</text>
    <text x="965" y="14" font-size="11.5" font-weight="800" fill="#34d399" text-transform="uppercase" letter-spacing="0.1em;">UCLTOUCHREHAB MODEL — THIS DISSERTATION</text>
  </g>

  <!-- ═══════════════════ ROW 1: INDICATION & MECHANISM ═══════════════════ -->
  <g transform="translate(60, 166)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#fbbf24">1. Indication &amp; Mechanism</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Clinical pathology &amp; technology</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">Acute Postoperative Surgical Pain</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• Elective abdominal/colorectal surgery; acute transient pain</text>
      <text x="18" y="66" font-size="12" font-weight="500" fill="#94a3b8">• Distraction-based standalone visual VR (SyncVR software on Meta Quest)</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
      <text x="74" y="21" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">→ Neuroplasticity</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">Chronic Phantom Limb Pain (PLP)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• Upper-limb amputees; permanent, debilitating neuropathic pain</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#a7f3d0">• Immersive VR + Synchronized Closed-Loop Robotic Haptics</text>
    </g>
  </g>

  <!-- ═══════════════════ ROW 2: POPULATION & SOCIETY ═══════════════════ -->
  <g transform="translate(60, 284)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#c084fc">2. Population &amp; Society</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Demographics &amp; economic scope</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">Elderly / Retired Population (≥70 yrs)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• Dutch AOW state pension recipients; predominantly post-employment</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#f87171">• Productivity losses &amp; employment friction costs EXCLUDED</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
      <text x="74" y="21" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">→ Working-Age</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">Working-Age Amputees (~45 yrs)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• UK trauma &amp; surgical amputees (5,762 eligible patients/year)</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#a7f3d0">• FULL societal model: Caregiver hours + Friction Cost productivity</text>
    </g>
  </g>

  <!-- ═══════════════════ ROW 3: PAYER PERSPECTIVE & DISCOUNTING ═══════════════════ -->
  <g transform="translate(60, 402)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#38bdf8">3. Payer &amp; Methodology</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Health tariffs &amp; discounting rules</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">Netherlands Healthcare / DBC Tariffs</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• Dutch ZIN guidance; €20,000/QALY willingness-to-pay threshold</text>
      <text x="18" y="66" font-size="12" font-weight="500" fill="#94a3b8">• NO discounting applied (justified by ≤12-month analytic window)</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
      <text x="74" y="21" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">→ NICE PMG36</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">UK NHS Reference Case (NICE PMG36)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• Primary NHS Payer (£25k/QALY threshold) + Dual Societal Perspective</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#a7f3d0">• NICE 3.5%/yr compounded monthly discounting on costs &amp; QALYs</text>
    </g>
  </g>

  <!-- ═══════════════════ ROW 4: ANALYTICAL ENGINE ═══════════════════ -->
  <g transform="translate(60, 520)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#34d399">4. Analytical Engine</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Markov structure &amp; calculus</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">Static Discrete Markov (Excel Spreadsheet)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• 5 Health states: Pain-Free, Non-Opioid, Opioid, CPSP, Death</text>
      <text x="18" y="66" font-size="12" font-weight="500" fill="#94a3b8">• Discrete 1-month cycle transition matrix; 12-month horizon only</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" />
      <text x="74" y="21" font-size="11.5" font-weight="800" fill="#ffffff" text-anchor="middle">→ Continuous CTMC</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">Dual Engine: Markov + CTMC (NICE TSD 14)</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• Matrix logarithms compute rate generator Q; eliminates cycle-length bias</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#a7f3d0">• Real-time browser simulation + Lifetime Horizon expansion (up to 25 yrs)</text>
    </g>
  </g>

  <!-- ═══════════════════ ROW 5: EFFICACY HURDLES ═══════════════════ -->
  <g transform="translate(60, 638)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#f87171">5. Cost-Saving Hurdle</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Minimum required clinical effect</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">6.5% Opioid Reduction to Save Costs</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• 2.8% reduction required for Cost-Effectiveness (@ €20,000/QALY)</text>
      <text x="18" y="66" font-size="12" font-weight="600" fill="#cbd5e1">• 6.5% opioid cessation required to achieve net cash savings</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" stroke-width="1.2" />
      <text x="74" y="21" font-size="11.5" font-weight="900" fill="#fbbf24" text-anchor="middle">~10× Lower Hurdle</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">~0.6% Pain Shift to Save Costs</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• Just 0.5% shift needed for Cost-Effectiveness (@ £25,000/QALY)</text>
      <text x="18" y="66" font-size="12" font-weight="800" fill="#fbbf24">• Feasibility trial achieved 50–72.7% → Vastly exceeds threshold!</text>
    </g>
  </g>

  <!-- ═══════════════════ ROW 6: ECONOMIC OUTCOME & EVPI ═══════════════════ -->
  <g transform="translate(60, 756)">
    <rect x="0" y="0" width="1480" height="106" rx="10" fill="url(#cardBg)" stroke="rgba(255,255,255,0.08)" stroke-width="1" filter="url(#cardShadow)" />
    
    <!-- Domain Tag -->
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="225" height="30" rx="6" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.4)" stroke-width="1" />
      <text x="12" y="20" font-size="12.5" font-weight="800" fill="#34d399">6. Economic Dominance</text>
      <text x="2" y="52" font-size="11" font-weight="500" fill="#94a3b8">Final conclusion &amp; trial de-risking</text>
    </g>

    <!-- Groenveld Cell -->
    <g transform="translate(265, 14)">
      <rect x="0" y="0" width="520" height="78" rx="8" fill="url(#groenveldGrad)" stroke="rgba(56,189,248,0.35)" stroke-width="1" />
      <text x="18" y="26" font-size="14" font-weight="800" fill="#38bdf8">Threshold Cost-Effectiveness</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#e2e8f0">• Demonstrated early HEA feasibility for VR surgical tools</text>
      <text x="18" y="66" font-size="12" font-weight="500" fill="#94a3b8">• Relied on 1-way deterministic sensitivity; no clinical trial base case</text>
    </g>

    <!-- Transition Pill -->
    <g transform="translate(800, 36)">
      <rect x="0" y="0" width="148" height="34" rx="17" fill="rgba(16,185,129,0.2)" stroke="#10b981" stroke-width="1.2" />
      <text x="74" y="21" font-size="11.5" font-weight="900" fill="#34d399" text-anchor="middle">STRICTLY DOMINANT</text>
    </g>

    <!-- UCLTouchRehab Cell -->
    <g transform="translate(960, 14)">
      <rect x="0" y="0" width="500" height="78" rx="8" fill="url(#uclGrad)" stroke="rgba(16,185,129,0.5)" stroke-width="1.2" />
      <text x="18" y="26" font-size="14" font-weight="900" fill="#34d399">Strict Dominance: −£735.95 Cost | +0.1855 QALYs</text>
      <text x="18" y="47" font-size="12" font-weight="500" fill="#f1f5f9">• Saves £735.95 direct NHS / £3,876 societal per patient vs Usual Care</text>
      <text x="18" y="66" font-size="12" font-weight="700" fill="#c084fc">• Value of Information (EVPI/EVPPI) de-risks future NICE EVA trial spend</text>
    </g>
  </g>

  <!-- ═══════════════════ BOTTOM METRIC BANNER ═══════════════════ -->
  <g transform="translate(60, 878)">
    <rect x="0" y="0" width="1480" height="102" rx="12" fill="url(#cardBg)" stroke="#10b981" stroke-width="1.5" filter="url(#cardShadow)" />

    <!-- Metric 1: Net Direct Saving -->
    <g transform="translate(45, 20)">
      <text x="0" y="16" font-size="11.5" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.05em;">DIRECT NHS NET SAVINGS</text>
      <text x="0" y="50" font-size="27" font-weight="900" fill="#10b981">−£735.95 <span style="font-size:14px;color:#94a3b8;font-weight:600;">/ pt</span></text>
      <text x="0" y="70" font-size="12" font-weight="700" fill="#34d399">Strict Dominance (Cheaper + Better)</text>
    </g>

    <!-- Divider 1 -->
    <line x1="390" y1="20" x2="390" y2="82" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" />

    <!-- Metric 2: Quality of Life Gain -->
    <g transform="translate(435, 20)">
      <text x="0" y="16" font-size="11.5" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.05em;">HEALTH OUTCOME GAIN</text>
      <text x="0" y="50" font-size="27" font-weight="900" fill="#38bdf8">+0.1855 <span style="font-size:14px;color:#94a3b8;font-weight:600;">QALYs</span></text>
      <text x="0" y="70" font-size="12" font-weight="700" fill="#7dd3fc">≈ 67.7 Quality-Adjusted Days Gained</text>
    </g>

    <!-- Divider 2 -->
    <line x1="770" y1="20" x2="770" y2="82" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" />

    <!-- Metric 3: Headroom Ceiling -->
    <g transform="translate(815, 20)">
      <text x="0" y="16" font-size="11.5" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.05em;">MAX PRICING HEADROOM</text>
      <text x="0" y="50" font-size="27" font-weight="900" fill="#fbbf24">£5,414 <span style="font-size:14px;color:#94a3b8;font-weight:600;">@ £25k WTP</span></text>
      <text x="0" y="70" font-size="12" font-weight="700" fill="#fde68a">Massive buffer over £40.55 baseline cost</text>
    </g>

    <!-- Divider 3 -->
    <line x1="1150" y1="20" x2="1150" y2="82" stroke="rgba(255,255,255,0.12)" stroke-width="1.2" />

    <!-- Metric 4: Societal SROI -->
    <g transform="translate(1195, 20)">
      <text x="0" y="16" font-size="11.5" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.05em;">SOCIETAL SROI RATIO</text>
      <text x="0" y="50" font-size="27" font-weight="900" fill="#c084fc">95.6× <span style="font-size:14px;color:#94a3b8;font-weight:600;">Return</span></text>
      <text x="0" y="70" font-size="12" font-weight="700" fill="#d8b4fe">£3,876/pt in avoided caregiver/work burden</text>
    </g>
  </g>
</svg>
EOF

foreach my $dir (@dest_dirs) {
    my $svg_file = "$dir/groenveld_comparison.svg";
    my $png_file = "$dir/groenveld_comparison.png";

    open my $fh, ">", $svg_file or die "Cannot write to $svg_file: $!";
    print $fh $svg;
    close $fh;
    print "Written SVG: $svg_file\n";

    system("sips -s format png $svg_file --out $png_file 2>/dev/null");
    print "Generated PNG: $png_file\n";
}

print "Updated Groenveld comparison figure with crystal-clear high contrast!\n";
