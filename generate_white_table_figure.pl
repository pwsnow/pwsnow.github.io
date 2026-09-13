#!/usr/bin/perl
use strict;
use warnings;
use utf8;
binmode(STDOUT, ":utf8");

my @dest_dirs = (
    "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app-lite/img",
    "/Users/petersnow/.gemini/antigravity/scratch/plp-touchrehab-health-econ-app/img",
    "/Users/petersnow/.gemini/antigravity/brain/916ce631-93cd-4422-a1a1-488020f80ac7"
);

# 11 rows (Base-Case Findings removed): [Dimension, Groenveld, UCLTouchRehab, Significance]
my @rows_data = (
    [
        "Clinical Indication",
        "Postoperative surgical pain (elective abdominal / colorectal surgery)",
        "Phantom Limb Pain (PLP) in upper-limb amputees",
        "Shifts from acute, transient surgical pain to a chronic, lifelong neuropathic condition."
    ],
    [
        "Technology Evaluated",
        "Distraction-based visual VR (SyncVR software on Meta Quest)",
        "Immersive VR + Synchronized Robotic Haptics (UCLTouchRehab)",
        "Adds the active robotic ingredient (sensorimotor feedback), inducing targeted cortical remapping."
    ],
    [
        "Patient Demographics",
        "Predominantly elderly / retired (≥70 yrs); productivity excluded",
        "Working-age adults (~45 yrs); productivity & absenteeism included",
        "Captures massive economic productivity gains via the Friction Cost Method (68-day friction window)."
    ],
    [
        "Payer & Setting",
        "Netherlands healthcare / Dutch DBC tariffs (€, 2023)",
        "UK National Health Service (NHS) / PSSRU & HES (£, 2025/26)",
        "Aligns with NICE Reference Case (PMG36) and UK Integrated Care Board (ICB) commissioning."
    ],
    [
        "Health States",
        "5 states: Pain-Free, Non-Opioid, Opioid, Chronic Pain (CPSP), Death",
        "5 states: Pain-Free, Mild PLP, Moderate PLP, Severe PLP, Death",
        "Categorized by clinically validated NRS / McGill PPI severity levels, directly mapping to NHS care tiers."
    ],
    [
        "Baseline Severity",
        "Broad surgical cohort (many mild/moderate patients)",
        "High severity: 60% Moderate, 40% Severe PLP",
        "Reflects severe neurorehab referral profile; creates higher downstream cost-offset potential."
    ],
    [
        "Model Engine",
        "Static discrete-time Markov model (Microsoft Excel)",
        "Dual Engine: Markov Cohort + Continuous-Time Markov Chain (CTMC)",
        "Uses matrix logarithms to eliminate cycle-length bias per NICE DSU Technical Support Document 14."
    ],
    [
        "Discounting",
        "None (justified by ≤12-month horizon)",
        "3.5% / year on both costs & QALYs (monthly compounding)",
        "Complies with formal NICE methodological standards (Treasury Green Book)."
    ],
    [
        "Primary Economic Perspective",
        "Dutch Societal (healthcare + formal homecare)",
        "Primary: NHS Payer\n(Supplementary: Full Societal)",
        "Meets NICE STA/EVA payer requirements while quantifying caregiver & societal return on investment."
    ],
    [
        "Efficacy Thresholds",
        "• 2.8% opioid reduction → Cost-Effective\n• 6.5% opioid reduction → Cost-Saving",
        "• ~0.5% pain shift → Cost-Effective\n• ~0.6% pain shift → Cost-Saving",
        "Lower thresholds due to the high cost of undertreated severe PLP; observed feasibility trial efficacy (50–72%) easily dominates."
    ],
    [
        "Advanced Extensions",
        "Basic One-Way Sensitivity Analysis (DSA)",
        "• Value of Information (EVPI / EVPPI)\n• Multi-Horizon Projections (up to 25 yrs)\n• Probabilistic Sensitivity Analysis (PSA; 1,000+ runs)",
        "Pinpoints exact clinical trial R&D risks and quantifies decision uncertainty for NICE Early Value Assessment."
    ]
);

sub wrap_text {
    my ($text, $max_len) = @_;
    $text =~ s/[\r\n\x{2028}\x{2029}]+/\n/g;
    my @lines_in = split /\n/, $text;
    my @out;
    for my $para (@lines_in) {
        my @words = split /\s+/, $para;
        my $cur = "";
        for my $w (@words) {
            if (length($cur . " " . $w) > $max_len && length($cur) > 0) {
                push @out, $cur;
                $cur = $w;
            } else {
                $cur = length($cur) ? ($cur . " " . $w) : $w;
            }
        }
        push @out, $cur if length($cur);
    }
    return @out;
}

# Table geometry
my $table_x = 40;
my $col1_w  = 230;
my $col2_w  = 440;
my $col3_w  = 490;
my $col4_w  = 600;
my $table_w = $col1_w + $col2_w + $col3_w + $col4_w; # 1760 px
my $total_w = $table_w + 2 * $table_x;                # 1840 px

my $col1_x = $table_x;
my $col2_x = $col1_x + $col1_w;
my $col3_x = $col2_x + $col2_w;
my $col4_x = $col3_x + $col3_w;

my $header_y = 40;
my $header_h = 52;

my @processed_rows;
for my $r (@rows_data) {
    my @l1 = wrap_text($r->[0], 20);
    my @l2 = wrap_text($r->[1], 38);
    my @l3 = wrap_text($r->[2], 42);
    my @l4 = wrap_text($r->[3], 52);

    my $max_lines = scalar(@l1);
    $max_lines = scalar(@l2) if scalar(@l2) > $max_lines;
    $max_lines = scalar(@l3) if scalar(@l3) > $max_lines;
    $max_lines = scalar(@l4) if scalar(@l4) > $max_lines;

    my $line_h = 22;
    my $pad    = 24;
    my $row_h  = $max_lines * $line_h + $pad;
    $row_h = 60 if $row_h < 60;

    push @processed_rows, {
        h => $row_h,
        l1 => \@l1,
        l2 => \@l2,
        l3 => \@l3,
        l4 => \@l4
    };
}

my $table_total_h = $header_h;
for my $pr (@processed_rows) {
    $table_total_h += $pr->{h};
}
my $total_h = $header_y + $table_total_h + 40;

my $svg = <<"EOF";
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $total_w $total_h" width="$total_w" height="$total_h" style="background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <defs>
    <filter id="subtleShadow" x="-1%" y="-1%" width="102%" height="102%">
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="#000000" flood-opacity="0.05" />
    </filter>
  </defs>

  <!-- Solid Crisp White Background -->
  <rect width="$total_w" height="$total_h" fill="#ffffff" />

  <!-- Outer Border Container -->
  <rect x="$table_x" y="$header_y" width="$table_w" height="$table_total_h" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#subtleShadow)" />

  <!-- ═══════════ TABLE HEADER ROW ═══════════ -->
  <rect x="$table_x" y="$header_y" width="$table_w" height="$header_h" rx="8" fill="#f1f5f9" />
  <rect x="$table_x" y="@{[$header_y + $header_h - 10]}" width="$table_w" height="10" fill="#f1f5f9" />
  <line x1="$table_x" y1="@{[$header_y + $header_h]}" x2="@{[$table_x + $table_w]}" y2="@{[$header_y + $header_h]}" stroke="#cbd5e1" stroke-width="1.5" />

  <!-- Column Header Labels -->
  <text x="@{[$col1_x + 18]}" y="@{[$header_y + 32]}" font-size="14" font-weight="900" fill="#0f172a" letter-spacing="-0.01em;">Dimension</text>
  <text x="@{[$col2_x + 18]}" y="@{[$header_y + 32]}" font-size="14" font-weight="900" fill="#0369a1" letter-spacing="-0.01em;">Groenveld et al. (2025)</text>
  <text x="@{[$col3_x + 18]}" y="@{[$header_y + 32]}" font-size="14" font-weight="900" fill="#047857" letter-spacing="-0.01em;">UCLTouchRehab Model (This Study)</text>
  <text x="@{[$col4_x + 18]}" y="@{[$header_y + 32]}" font-size="14" font-weight="900" fill="#334155" letter-spacing="-0.01em;">Methodological &amp; Strategic Significance</text>

  <!-- Vertical Divider Lines in Header -->
  <line x1="$col2_x" y1="$header_y" x2="$col2_x" y2="@{[$header_y + $header_h]}" stroke="#cbd5e1" stroke-width="1" />
  <line x1="$col3_x" y1="$header_y" x2="$col3_x" y2="@{[$header_y + $header_h]}" stroke="#cbd5e1" stroke-width="1" />
  <line x1="$col4_x" y1="$header_y" x2="$col4_x" y2="@{[$header_y + $header_h]}" stroke="#cbd5e1" stroke-width="1" />

  <!-- ═══════════ TABLE ROWS ═══════════ -->
EOF

my $y_row = $header_y + $header_h;
my $row_idx = 0;

for my $pr (@processed_rows) {
    my $rh = $pr->{h};
    my $row_bg = ($row_idx % 2 == 0) ? "#ffffff" : "#f8fafc";
    $row_idx++;

    $svg .= "  <!-- Row $row_idx -->\n";
    $svg .= "  <rect x=\"$table_x\" y=\"$y_row\" width=\"$table_w\" height=\"$rh\" fill=\"$row_bg\" />\n";

    my $start_y = $y_row + 25;

    # Col 1: Dimension (Bold #0f172a)
    for my $i (0 .. $#{ $pr->{l1} }) {
        my $cur_y = $start_y + $i * 22;
        $svg .= "  <text x=\"@{[ $col1_x + 18 ]}\" y=\"$cur_y\" font-size=\"13.5\" font-weight=\"800\" fill=\"#0f172a\">" . escape_xml($pr->{l1}[$i]) . "</text>\n";
    }

    # Col 2: Groenveld (#334155)
    for my $i (0 .. $#{ $pr->{l2} }) {
        my $cur_y = $start_y + $i * 22;
        $svg .= "  <text x=\"@{[ $col2_x + 18 ]}\" y=\"$cur_y\" font-size=\"13\" font-weight=\"500\" fill=\"#334155\">" . escape_xml($pr->{l2}[$i]) . "</text>\n";
    }

    # Col 3: UCLTouchRehab (#0f172a, highlights in #047857)
    for my $i (0 .. $#{ $pr->{l3} }) {
        my $cur_y = $start_y + $i * 22;
        my $line = $pr->{l3}[$i];
        my $weight = ($line =~ /Dual Engine|NICE|Friction Cost/i) ? "800" : "500";
        my $fill   = ($line =~ /~0\.[56]% pain shift/i) ? "#047857" : "#0f172a";
        $svg .= "  <text x=\"@{[ $col3_x + 18 ]}\" y=\"$cur_y\" font-size=\"13\" font-weight=\"$weight\" fill=\"$fill\">" . escape_xml($line) . "</text>\n";
    }

    # Col 4: Significance (#334155)
    for my $i (0 .. $#{ $pr->{l4} }) {
        my $cur_y = $start_y + $i * 22;
        $svg .= "  <text x=\"@{[ $col4_x + 18 ]}\" y=\"$cur_y\" font-size=\"12.8\" font-weight=\"500\" fill=\"#334155\">" . escape_xml($pr->{l4}[$i]) . "</text>\n";
    }

    # Bottom horizontal line
    $svg .= "  <line x1=\"$table_x\" y1=\"@{[ $y_row + $rh ]}\" x2=\"@{[ $table_x + $table_w ]}\" y2=\"@{[ $y_row + $rh ]}\" stroke=\"#e2e8f0\" stroke-width=\"1\" />\n";

    # Vertical column dividers
    $svg .= "  <line x1=\"$col2_x\" y1=\"$y_row\" x2=\"$col2_x\" y2=\"@{[ $y_row + $rh ]}\" stroke=\"#e2e8f0\" stroke-width=\"1\" />\n";
    $svg .= "  <line x1=\"$col3_x\" y1=\"$y_row\" x2=\"$col3_x\" y2=\"@{[ $y_row + $rh ]}\" stroke=\"#e2e8f0\" stroke-width=\"1\" />\n";
    $svg .= "  <line x1=\"$col4_x\" y1=\"$y_row\" x2=\"$col4_x\" y2=\"@{[ $y_row + $rh ]}\" stroke=\"#e2e8f0\" stroke-width=\"1\" />\n";

    $y_row += $rh;
}

$svg .= "</svg>\n";

sub escape_xml {
    my ($str) = @_;
    $str =~ s/&/&amp;/g;
    $str =~ s/</&lt;/g;
    $str =~ s/>/&gt;/g;
    return $str;
}

foreach my $dir (@dest_dirs) {
    my $svg_path = "$dir/table_groenveld_comparison_white.svg";
    my $png_path = "$dir/table_groenveld_comparison_white.png";

    open my $fh, ">:encoding(UTF-8)", $svg_path or die "Cannot write to $svg_path: $!";
    print $fh $svg;
    close $fh;
    print "Written white SVG table: $svg_path\n";

    system("sips -s format png $svg_path --out $png_path 2>/dev/null");
    print "Generated white PNG table: $png_path\n";
}

print "Updated table figure (without Base-Case Findings) generated successfully!\n";
