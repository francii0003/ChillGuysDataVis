export const section = `<section class="chart-section" id="waffle" aria-labelledby="waffle-title">
      <div class="container">
        <h2 id="waffle-title">How is data center electricity use split across the world?</h2>
        <p class="chart-lede">One hundred squares represent all the electricity consumed by data centers worldwide in 2024. <strong>Each square</strong> is about <strong>1% of the total, roughly 4.2 TWh</strong>.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-waffle">
            <p class="chart-placeholder">Loading chart…</p>
          </div>
          <figcaption class="figure-caption">
            <p class="figure-title"><strong>Figure 1.</strong> Share of world data center electricity consumption in 2024, by area.</p>
            <details class="chart-data-details">
              <summary class="chart-data-summary">
                <span><strong>Data:</strong> IEA, 2024</span>
                <span aria-hidden="true">·</span>
                <a href="data/01_waffle_dc_electricity_by_area_2024.csv" download>Download CSV</a>
                <span aria-hidden="true">·</span>
                <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
              </summary>
              <p class="chart-note">
                IEA, Energy and AI (Regional Data, total electricity consumption, 2024). <br>The figure covers all data centers, not only AI, and includes cooling and facility overhead. <br>IEA regions overlap, so Rest of Asia Pacific is Asia Pacific minus China, and Rest of the world is the remainder. <br>Squares are rounded to whole numbers, so a count can differ by one from the exact share.
              </p>
            </details>
          </figcaption>
        </figure>
        <div class="takeaway">
          <p class="takeaway-figure">69% <strong class="takeaway-subfigure">285 TWh</strong></p>
          <p class="takeaway-text">The United States and China accounted for 69% of global data center electricity use in 2024. Together they consumed <strong>about 91% of Italy’s entire annual electricity demand</strong> (312.3 TWh, according to <a href="https://www.qualenergia.it/articoli/anno-2024-premia-rinnovabili-ma-target-2030-ancora-lontano/">Terna</a>).</p>
        </div>
        <div class="chart-text">
          <p>Worldwide, data centers used 416 TWh in 2024: roughly a third more than Italy’s total power demand. The IEA figures cover all data center workloads, including AI, as well as cooling and facility overhead.</p>
          <p>Europe follows with 68 TWh (16%) and the rest of Asia Pacific with 48 TWh (about 12%). All other regions combined, across Africa, Latin America, and the Middle East, account for 15 TWh, or just under 4% of the global total.</p>
          <p>And this is only the baseline. In its Base Case, the IEA projects data center electricity use to <strong>more than double by 2030</strong>, rising from 416 to 946 TWh. <a href="#bar">Figure 2</a> shows where that surge is expected to come from.</p>
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
  const frame = sectionRoot.querySelector("#chart-waffle");
  const rows = await d3.csv("data/01_waffle_dc_electricity_by_area_2024.csv", d3.autoType);
  rows.sort((a, b) => a.order - b.order);
  if (!rows.every(row => Number.isInteger(row.squares) && row.squares >= 0)
      || d3.sum(rows, row => row.squares) !== 100) {
    throw new Error("Expected 100 squares in the regional allocation.");
  }

  const fmtTwh = d3.format(",.0f");
  const cells = rows.flatMap(row => Array(row.squares).fill(row));

  const svg = d3.create("svg")
    .attr("id", "waffle-cells")
    .attr("class", "waffle-grid")
    .attr("width", 210).attr("height", 210)
    .attr("viewBox", "0 0 198 198")
    .attr("role", "img")
    .attr("aria-label", "Regional shares of data center electricity use. Values are listed in the adjacent table.");

  const marks = svg.append("g").selectAll("rect").data(cells).join("rect")
    .attr("class", row => `waffle-cell waffle-${slug(row)}`)
    .attr("x", (_, i) => (i % 10) * 20)
    .attr("y", (_, i) => Math.floor(i / 10) * 20)
    .attr("width", 18).attr("height", 18).attr("rx", 2);

  const tip = svg.append("g").attr("class", "waffle-tip").attr("aria-hidden", "true");
  const tipBox = tip.append("rect").attr("rx", 2.5);
  const tipText = tip.append("text");

  function showTip(event, row) {
    const lines = [
      row.area,
      `${fmtTwh(row.twh_2024)} TWh`,
      `${row.share_pct.toFixed(1)}% of the world total`
    ];
    tipText.selectAll("tspan").data(lines).join("tspan")
      .attr("class", (_, i) => (i === 0 ? "waffle-tip-title" : null))
      .attr("x", 6)
      .attr("y", (_, i) => 12 + i * 10)
      .text(line => line);

    const box = tipText.node().getBBox();
    const w = box.x + box.width + 6;
    const h = box.y + box.height + 5;
    tipBox.attr("width", w).attr("height", h);

    const [px, py] = d3.pointer(event, svg.node());
    let x = px + 8;
    let y = py - h - 6;
    if (x + w > 198) x = px - w - 8;
    if (y < 0) y = py + 10;
    tip.attr("transform", `translate(${Math.max(0, x)},${y})`).classed("is-on", true);
  }
  const hideTip = () => tip.classed("is-on", false);

  const table = d3.create("table");
  table.append("caption").text(`World total · ${d3.sum(rows, row => row.twh_2024)} TWh`);
  table.append("thead").append("tr").selectAll("th")
    .data(["Area", "TWh", "Share"]).join("th").attr("scope", "col").text(label => label);

  const entries = table.append("tbody").selectAll("tr").data(rows).join("tr");
  const labels = entries.append("th").attr("scope", "row");
  const buttons = labels.append("button").attr("type", "button")
    .attr("aria-pressed", "false").attr("aria-controls", "waffle-cells");
  buttons.append("span").attr("aria-hidden", "true")
    .attr("class", row => `waffle-key waffle-key-${slug(row)}`);
  buttons.append("span").text(row => row.area);
  entries.append("td").text(row => row.twh_2024);
  entries.append("td").text(row => row.share_pct.toFixed(1) + "%");

  let selected = null;
  let hovered = null;

  function highlight() {
    const active = hovered ?? selected;
    marks.classed("waffle-muted", row => active !== null && row.area !== active);
    buttons.attr("aria-pressed", row => row.area === selected);
    entries.classed("waffle-active", row => row.area === active);
  }

  marks
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
    .on("click", (_, row) => {
      selected = selected === row.area ? null : row.area;
      highlight();
    });

  entries.on("pointerenter", (event, row) => {
    if (event.pointerType === "mouse") {
      hovered = row.area;
      highlight();
    }
  }).on("pointerleave", () => {
    hovered = null;
    highlight();
  });

  buttons.on("click", (_, row) => {
    selected = selected === row.area ? null : row.area;
    hovered = null;
    highlight();
  }).on("keydown", event => {
    if (event.key === "Escape") {
      selected = hovered = null;
      highlight();
    }
  });

  const legend = d3.create("div").attr("class", "waffle-legend");
  legend.node().append(table.node());
  legend.append("p").text("Hover over a square, or select an area in the table, to highlight it. Select it again to show all areas.");
  frame.replaceChildren(svg.node(), legend.node());
}