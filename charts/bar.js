export const section = `<section class="chart-section" id="bar" aria-labelledby="bar-title">
  <div class="container">
    <h2 id="bar-title">How much new electricity will data centers need by 2030?</h2>
    <p class="chart-lede">The increase in yearly consumption between 2024 and 2030 in the IEA Base Case, for the same areas as Figure 1.</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-bar">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 2.</strong> Increase in data center electricity consumption from 2024 to 2030 (Base Case), in TWh.</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> IEA, 2024-2030</span>
            <span aria-hidden="true">·</span>
            <a href="data/02_bar_dc_electricity_increase_2030.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            IEA, Energy and AI (Regional Data).<br>The Base Case is a scenario, not a forecast, and the IEA table is rounded to whole TWh. <br>Areas follow the same definitions as Figure 1.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">+530 TWh</p>
      <p class="takeaway-text">of added annual data center electricity demand worldwide between 2024 and 2030 in the IEA Base Case: <strong> more than doubling global consumption in just six years</strong>.</p>
    </div>
    <div class="chart-text">
      <p>What stands out most is the pace of that jump: in just six years, the new electricity added each year by data centers is projected to exceed the entire 416 TWh consumed worldwide in 2024. The United States (+243 TWh) and China (+175 TWh) alone account for 418 TWh of that growth, or nearly four fifths of the global increase.</p>
      <p>Rest of Asia Pacific adds 53 TWh, Europe adds 45 TWh, and the rest of the world adds 14 TWh. Even combined, every other region grows by less than a third of the United States and China together.</p>
      <p>It is no coincidence that the sharpest surges sit right where the biggest cloud and AI operators are concentrated. <a href="#grouped">Figure 3</a> looks closer at who owns AI computing capacity and who uses it.</p>
    </div>
  </div>
</section>`;

const AREA_SLUG = {
  "United States": "us",
  "China": "cn",
  "Europe": "eu",
  "Rest of Asia Pacific": "apac",
  "Rest of the world": "row"
};
const slug = row => AREA_SLUG[row.area] ?? "other";

export async function render(sectionRoot) {
  const frame = sectionRoot.querySelector("#chart-bar");
  const rows = await d3.csv("data/02_bar_dc_electricity_increase_2030.csv", d3.autoType);
  rows.sort((a, b) => a.order - b.order);

  const fmtTwh = d3.format(",.0f");
  const fmtShare = d3.format(".1f");

  const vbWidth = 620;
  const vbHeight = 250;
  const margin = { top: 14, right: 56, bottom: 42, left: 152 };
  const plotW = vbWidth - margin.left - margin.right;
  const plotH = vbHeight - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain([0, d3.max(rows, d => d.increase_twh)])
    .nice()
    .range([0, plotW]);

  const y = d3.scaleBand()
    .domain(rows.map(d => d.area))
    .range([0, plotH])
    .paddingInner(0.28)
    .paddingOuter(0.12);

  const svg = d3.create("svg")
    .attr("id", "bar-cells")
    .attr("class", "bar-grid")
    .attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`)
    .attr("role", "img")
    .attr("aria-label", "Increase in annual data center electricity consumption from 2024 to 2030 by area.");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const ticks = x.ticks(5);
  g.append("g")
    .attr("class", "bar-gridlines")
    .selectAll("line")
    .data(ticks)
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", plotH);

  const xAxis = g.append("g")
    .attr("class", "bar-axis")
    .attr("transform", `translate(0,${plotH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(4));

  xAxis.append("text")
    .attr("class", "bar-axis-title")
    .attr("x", plotW / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .text("Increase in annual consumption (TWh)");

  const rowGroups = g.selectAll(".bar-row")
    .data(rows)
    .join("g")
    .attr("class", d => `bar-row bar-row-${slug(d)}`)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-pressed", "false")
    .attr("transform", d => `translate(0,${y(d.area)})`);

  rowGroups.append("text")
    .attr("class", "bar-label")
    .attr("x", -10)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d.area);

  const bars = rowGroups.append("rect")
    .attr("class", d => `bar-rect waffle-${slug(d)}`)
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d.increase_twh))
    .attr("rx", 2);

  rowGroups.append("text")
    .attr("class", "bar-value")
    .attr("x", d => x(d.increase_twh) + 7)
    .attr("y", y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text(d => `+${fmtTwh(d.increase_twh)}`);

  const tip = svg.append("g").attr("class", "bar-tip").attr("aria-hidden", "true");
  const tipBox = tip.append("rect").attr("rx", 3);
  const tipText = tip.append("text");

  function showTip(event, row) {
    const lines = [
      row.area,
      `${fmtTwh(row.twh_2024)} TWh (2024) → ${fmtTwh(row.twh_2030_base)} TWh (2030) (+${fmtShare(row.increase_pct)}%)`,
      `+${fmtTwh(row.increase_twh)} TWh (${fmtShare(row.share_of_total_increase_pct)}% of total growth)`
    ];

    tipText.selectAll("tspan").remove();
    lines.forEach((line, i) => {
      tipText.append("tspan")
        .attr("class", i === 0 ? "bar-tip-title" : null)
        .attr("x", 8)
        .attr("y", 14 + i * 12)
        .text(line);
    });

    const box = tipText.node().getBBox();
    const w = box.width + 16;
    const h = box.height + 10;
    tipBox.attr("width", w).attr("height", h);

    const [px, py] = d3.pointer(event, svg.node());
    let xPos = px + 10;
    let yPos = py - h - 8;
    if (xPos + w > vbWidth - 4) xPos = px - w - 10;
    if (xPos < 4) xPos = 4;
    if (yPos < 4) yPos = py + 12;

    tip.attr("transform", `translate(${xPos},${yPos})`).classed("is-on", true);
  }

  const hideTip = () => tip.classed("is-on", false);

  let selected = null;
  let hovered = null;

  function highlight() {
    const active = hovered ?? selected;
    bars.classed("waffle-muted", d => active !== null && d.area !== active);
    rowGroups.attr("aria-pressed", d => d.area === selected);
    rowGroups.classed("is-active", d => active !== null && d.area === active);
  }

  rowGroups
    .on("pointerenter", (event, row) => {
      if (event.pointerType === "touch") return;
      hovered = row.area;
      highlight();
      showTip(event, row);
    })
    .on("pointermove", (event, row) => {
      if (event.pointerType !== "touch") showTip(event, row);
    })
    .on("pointerleave", () => {
      hovered = null;
      highlight();
      hideTip();
    })
    .on("click", (event, row) => {
      selected = selected === row.area ? null : row.area;
      highlight();
      if (selected) {
        showTip(event, row);
      } else if (!hovered) {
        hideTip();
      }
    })
    .on("keydown", (event, row) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selected = selected === row.area ? null : row.area;
        highlight();
      } else if (event.key === "Escape") {
        selected = hovered = null;
        highlight();
        hideTip();
      }
    });

  frame.replaceChildren(svg.node());
}