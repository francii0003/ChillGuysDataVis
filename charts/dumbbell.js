import { figure, bottomAxis } from "./figure.js";

export const section = `<section class="chart-section" id="dumbbell" aria-labelledby="dumbbell-title">
  <div class="container">
    <h2 id="dumbbell-title">Does clean power growth keep pace with AI data center demand in host countries?</h2>
    <p class="chart-lede">Estimated annual electricity demand of operating AI data centers vs. average annual growth in clean electricity generation (2018–2025), shown as a share of each country's 2025 total generation.</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-dumbbell">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 7.</strong> Estimated annual AI data center demand vs. average annual clean power growth (2018-2025)</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Ember &amp; Epoch AI, 2018–2025</span>
            <span aria-hidden="true">·</span>
            <a href="data/07_dumbbell_ai_vs_clean.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            <strong>Methodology &amp; caveats.</strong> Covers the 10 host countries with active operating AI data center capacity (&gt; 0 MW) in the Epoch AI sample (excluding Sweden and the United Arab Emirates, which report 0.0 MW operating). Annual AI electricity demand assumes continuous 24/7 operation at nameplate operating capacity (<code>MW × 8,760 hours / 1,000,000</code> in TWh); the side panel also reports a 75% average utilization sensitivity. Clean electricity growth uses Ember's <em>Clean</em> aggregate (renewables plus nuclear), taking the net TWh change between 2018 and 2025 divided by 7 years, expressed as a percentage of each country's 2025 total electricity generation. A negative gap indicates that estimated AI demand exceeds average annual clean power additions, leaving less clean surplus to displace existing fossil generation—though overall grid emissions still depend on total national demand growth (e.g., China added 316.2 TWh/yr of clean power yet total power-sector emissions rose by 991.1 MtCO₂e as overall electricity demand surged).
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">5.2%</p>
      <p class="takeaway-text">of Malaysia's 2025 electricity generation equals the full-load demand of its operating AI data centers—more than five times its annual clean power growth (+1.0%/yr): <strong>in fast-growing hubs, AI load can outpace clean grid additions</strong>.</p>
    </div>
    <div class="chart-text">
      <p><strong>Where AI demand outstrips clean additions.</strong> In Malaysia (1,250.7 MW across 4 sites), continuous AI demand reaches 11.0 TWh/yr—5.2% of national generation—while clean power grew by just 2.1 TWh/yr (+1.0%/yr) between 2018 and 2025, pushing power-sector emissions up by 19.9 MtCO₂e. In the United States (12,640.3 MW across 60 sites), estimated AI load represents 2.45% of 2025 generation (110.7 TWh/yr) against +1.27%/yr in clean additions (+57.6 TWh/yr), absorbing a substantial share of new low-carbon supply even as overall US power emissions declined.</p>
      <p><strong>Where clean expansion leads—and why scale matters.</strong> Countries such as Finland (+4.2%/yr clean growth vs. 0.8% AI load), Portugal (+3.3% vs. 0.6%), Australia (+3.2% vs. 0.1%), and China (+3.0% vs. 0.1%) have added clean generation far faster than their current AI footprint. Yet China's case also underscores a crucial caveat: because total electricity demand expanded dramatically between 2018 and 2025, absolute power emissions still rose by 991.1 MtCO₂e despite falling carbon intensity.</p>
    </div>
  </div>
</section>`;

export async function render(root) {
  const { rows, svg, legend } = await figure(root, "dumbbell", "07_dumbbell_ai_vs_clean.csv", 410);

  const data = rows
    .filter(d => Number.isFinite(d.dc_mw) && d.dc_mw > 0)
    .sort((a, b) => a.clean_vs_ai_gap_pct_points - b.clean_vs_ai_gap_pct_points);

  // Legend items + hint
  const legendItems = [
    { label: "AI data center demand (100% load)", cls: "dumbbell-key-ai" },
    { label: "Avg. annual clean power growth (2018–2025)", cls: "dumbbell-key-clean" },
    { label: "Clean growth > AI demand", cls: "dumbbell-key-surplus" },
    { label: "AI demand > clean growth", cls: "dumbbell-key-deficit" }
  ];

  legendItems.forEach(item => {
    const span = legend.append("span").attr("class", "legend-item");
    span.append("i").attr("class", item.cls);
    span.append("span").text(item.label);
  });

  legend.append("span")
    .attr("class", "dumbbell-hint")
    .text("Hover or click a country for full metrics · Esc to reset");

  svg.style("outline", "none");

  const chartFrame = d3.select(root).select("#chart-dumbbell");
  chartFrame.selectAll(".dumbbell-side-panel").remove();

  const layout = chartFrame.append("div").attr("class", "dumbbell-layout");
  layout.node().append(svg.node().parentNode);

  const panel = layout.append("aside").attr("class", "dumbbell-side-panel").attr("aria-live", "polite");
  const panelHeader = panel.append("div").attr("class", "dumbbell-side-header");
  const panelList = panel.append("ul").attr("class", "dumbbell-side-list");

  const margin = { top: 18, right: 28, bottom: 52, left: 132 };
  const rowHeight = 32;
  const height = margin.top + data.length * rowHeight + margin.bottom;
  const width = 760;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const allVals = data.flatMap(d => [d.ai_demand_pct_gen_2025, d.clean_annual_growth_pct_gen_2025, 0]);
  const minVal = Math.min(-1.5, Math.floor(d3.min(allVals) * 10) / 10);
  const maxVal = Math.ceil(d3.max(allVals) * 10) / 10 + 0.3;

  const x = d3.scaleLinear([minVal, maxVal], [margin.left, width - margin.right]);
  const y = index => margin.top + index * rowHeight + rowHeight / 2;

  // Vertical gridlines
  const gridGroup = svg.append("g").attr("class", "dumbbell-gridlines");
  gridGroup.selectAll("line")
    .data(x.ticks(7))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top - 6)
    .attr("y2", height - margin.bottom + 4);

  // Zero reference line
  svg.append("line")
    .attr("class", "dumbbell-zero")
    .attr("x1", x(0))
    .attr("x2", x(0))
    .attr("y1", margin.top - 6)
    .attr("y2", height - margin.bottom + 4);

  const rowGroups = svg.selectAll("g.dumbbell-row")
    .data(data)
    .join("g")
    .attr("class", "dumbbell-row")
    .attr("data-country", d => d.country)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-pressed", "false")
    .style("outline", "none");

  // Invisible hit area for easier hover/click
  rowGroups.append("rect")
    .attr("class", "dumbbell-hit")
    .attr("x", 4)
    .attr("y", (_, i) => margin.top + i * rowHeight + 2)
    .attr("width", width - 8)
    .attr("height", rowHeight - 4)
    .attr("rx", 4);

  // Country labels
  rowGroups.append("text")
    .attr("class", "dumbbell-label")
    .attr("x", margin.left - 10)
    .attr("y", (_, i) => y(i) + 4)
    .attr("text-anchor", "end")
    .text(d => d.country);

  // Connecting segment between AI demand and Clean growth
  rowGroups.append("line")
    .attr("class", d => d.clean_vs_ai_gap_pct_points >= 0
      ? "dumbbell-line dumbbell-line--surplus"
      : "dumbbell-line dumbbell-line--deficit")
    .attr("x1", d => x(d.ai_demand_pct_gen_2025))
    .attr("x2", d => x(d.clean_annual_growth_pct_gen_2025))
    .attr("y1", (_, i) => y(i))
    .attr("y2", (_, i) => y(i));

  // Dot 1: AI data center demand
  rowGroups.append("circle")
    .attr("class", "dumbbell-dot-ai")
    .attr("cx", d => x(d.ai_demand_pct_gen_2025))
    .attr("cy", (_, i) => y(i))
    .attr("r", 5.5);

  // Dot 2: Clean annual growth
  rowGroups.append("circle")
    .attr("class", d => d.clean_vs_ai_gap_pct_points >= 0
      ? "dumbbell-dot-clean dumbbell-dot-clean--surplus"
      : "dumbbell-dot-clean dumbbell-dot-clean--deficit")
    .attr("cx", d => x(d.clean_annual_growth_pct_gen_2025))
    .attr("cy", (_, i) => y(i))
    .attr("r", 5.5);

  // Gap badge at right end of dumbbell
  rowGroups.append("text")
    .attr("class", d => d.clean_vs_ai_gap_pct_points >= 0
      ? "dumbbell-gap dumbbell-gap--surplus"
      : "dumbbell-gap dumbbell-gap--deficit")
    .attr("x", d => Math.max(x(d.ai_demand_pct_gen_2025), x(d.clean_annual_growth_pct_gen_2025)) + 9)
    .attr("y", (_, i) => y(i) + 3.5)
    .text(d => {
      const sign = d.clean_vs_ai_gap_pct_points >= 0 ? "+" : "";
      return `${sign}${d.clean_vs_ai_gap_pct_points.toFixed(1)} pp`;
    });

  const axisGroup = svg.append("g").attr("class", "dumbbell-axis");
  bottomAxis(axisGroup, x, height - margin.bottom + 8, "Share of 2025 national electricity generation (%)", v => `${v}%`);

  const fmt1 = d3.format(",.1f");
  const fmt2 = d3.format(",.2f");
  const signFmt1 = d3.format("+.1f");
  const signFmt2 = d3.format("+.2f");

  function setDefaultPanel() {
    panelHeader
      .text("Country comparison")
      .style("border-left-color", "var(--green)");
    panelList.selectAll("li").remove();
    panelList.append("li")
      .attr("class", "dumbbell-side-empty")
      .text("Hover or click any country row to inspect operating data center power, estimated TWh load, clean generation growth, and 2018–2025 grid emissions.");
  }

  function updatePanel(d) {
    if (!d) {
      setDefaultPanel();
      return;
    }

    const isSurplus = d.clean_vs_ai_gap_pct_points >= 0;
    panelHeader
      .text(`${d.country} (${d.dc_count} ${d.dc_count === 1 ? "site" : "sites"} · ${fmt1(d.dc_mw)} MW)`)
      .style("border-left-color", isSurplus ? "var(--green)" : "#C97A4B");

    panelList.selectAll("li").remove();

    const items = [
      {
        dot: "var(--ink)",
        text: `AI demand (100% load): ${fmt2(d.ai_demand_twh_100pct)} TWh/yr (${fmt2(d.ai_demand_pct_gen_2025)}% of 2025 grid; ${fmt2(d.ai_demand_twh_75pct)} TWh at 75% load)`
      },
      {
        dot: isSurplus ? "var(--green)" : "#C97A4B",
        text: `Clean growth (2018–2025 avg): ${signFmt2(d.clean_annual_avg_growth_twh)} TWh/yr (${signFmt2(d.clean_annual_growth_pct_gen_2025)}%/yr; ${signFmt1(d.clean_delta_2018_2025_twh)} TWh total)`
      },
      {
        dot: isSurplus ? "var(--green)" : "#C97A4B",
        text: `Net balance: ${signFmt2(d.clean_vs_ai_gap_pct_points)} percentage points (${isSurplus ? "clean additions exceed AI load" : "AI load exceeds annual clean additions"})`
      },
      {
        dot: "var(--muted)",
        text: `Power emissions (2018 → 2025): ${fmt1(d.emissions_2018_mtco2e)} → ${fmt1(d.emissions_2025_mtco2e)} MtCO₂e (${signFmt1(d.emissions_delta_2018_2025_mtco2e)} MtCO₂e)`
      },
      {
        dot: "var(--muted)",
        text: `Grid intensity (2018 → 2025): ${fmt1(d.intensity_2018_gco2e_kwh)} → ${fmt1(d.intensity_2025_gco2e_kwh)} gCO₂e/kWh (${signFmt1(d.intensity_delta_2018_2025)})`
      }
    ];

    items.forEach(item => {
      const li = panelList.append("li");
      li.append("span")
        .attr("class", "dumbbell-side-dot")
        .style("background", item.dot)
        .attr("aria-hidden", "true");
      li.append("span").text(item.text);
    });
  }

  let selectedCountry = null;
  let hoveredCountry = null;

  function syncState() {
    const active = hoveredCountry || selectedCountry;
    rowGroups.each(function (d) {
      const el = d3.select(this);
      const isSelected = active !== null && d.country === active;
      const isDimmed = active !== null && d.country !== active;
      el.classed("is-selected", isSelected)
        .classed("is-dimmed", isDimmed)
        .attr("aria-pressed", selectedCountry !== null && d.country === selectedCountry);
    });
    const activeRow = active ? data.find(d => d.country === active) : null;
    updatePanel(activeRow);
  }

  rowGroups
    .on("pointerenter", (event, d) => {
      if (event.pointerType === "touch") return;
      hoveredCountry = d.country;
      syncState();
    })
    .on("pointerleave", () => {
      hoveredCountry = null;
      syncState();
    })
    .on("click", (_, d) => {
      selectedCountry = selectedCountry === d.country ? null : d.country;
      syncState();
    })
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectedCountry = selectedCountry === d.country ? null : d.country;
        syncState();
      } else if (event.key === "Escape") {
        selectedCountry = null;
        hoveredCountry = null;
        syncState();
      }
    });

  svg.on("keydown", event => {
    if (event.key === "Escape") {
      selectedCountry = null;
      hoveredCountry = null;
      syncState();
    }
  });

  setDefaultPanel();
}