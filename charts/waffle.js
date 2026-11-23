export const section = `<section class="chart-section" id="waffle" aria-labelledby="waffle-title">
      <div class="container">
        <h2 id="waffle-title">How is data center electricity use split across the world?</h2>
        <p class="chart-lede">One hundred squares represent all the electricity consumed by data centers worldwide in 2024. Each square is about 1% of the total, roughly 4.2 TWh.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-waffle">
            <p>Regional values are available in the <a href="data/01_waffle_dc_electricity_by_area_2024.csv">source CSV</a>.</p>
          </div>
          <figcaption>Figure 1. Share of world data center electricity consumption in 2024, by area.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> IEA, Energy and AI (Regional Data, total electricity consumption, 2024). The figure covers all data centers, not only AI, and includes cooling and facility overhead. IEA regions overlap, so Rest of Asia Pacific is Asia Pacific minus China, and Rest of the world is the remainder.</p>
        <p class="prose">Together, the United States and China accounted for 285 TWh, about 69% of global data center electricity use in 2024.</p>
      </div>
    </section>`;

export async function render(sectionRoot) {
  const frame = sectionRoot.querySelector("#chart-waffle");
  const rows = await d3.csv("data/01_waffle_dc_electricity_by_area_2024.csv", d3.autoType);
  rows.sort((a, b) => a.order - b.order);
  if (!rows.every(row => Number.isInteger(row.squares) && row.squares >= 0)
      || d3.sum(rows, row => row.squares) !== 100) {
    throw new Error("Expected 100 squares in the regional allocation.");
  }

  const category = row => `cat-${row.order}`;
  const cells = rows.flatMap(row => Array(row.squares).fill(row));
  const svg = d3.create("svg")
    .attr("class", "waffle-grid")
    .attr("width", 210).attr("height", 210)
    .attr("viewBox", "0 0 198 198")
    .attr("role", "img")
    .attr("aria-label", "Regional shares of data center electricity use. Values are listed in the adjacent table.");

  svg.selectAll("rect").data(cells).join("rect")
    .attr("class", category)
    .attr("x", (_, i) => (i % 10) * 20)
    .attr("y", (_, i) => Math.floor(i / 10) * 20)
    .attr("width", 18).attr("height", 18).attr("rx", 2)
    .append("title").text(row => `${row.area}: ${row.share_pct.toFixed(1)}%`);

  const table = d3.create("table");
  table.append("caption").text(`World total · ${d3.sum(rows, row => row.twh_2024)} TWh`);
  table.append("thead").append("tr").selectAll("th")
    .data(["Area", "TWh", "Share"]).join("th").attr("scope", "col").text(label => label);

  const entries = table.append("tbody").selectAll("tr").data(rows).join("tr");
  const labels = entries.append("th").attr("scope", "row");
  const buttons = labels.append("button").attr("type", "button")
    .attr("aria-pressed", "false").attr("aria-controls", "waffle-cells");
  buttons.append("span").attr("aria-hidden", "true")
    .attr("class", row => `waffle-key waffle-key-${row.order}`);
  buttons.append("span").text(row => row.area);
  entries.append("td").text(row => row.twh_2024);
  entries.append("td").text(row => row.share_pct.toFixed(1) + "%");

  const marks = svg.attr("id", "waffle-cells").selectAll("rect");
  let selected = null;
  let hovered = null;

  function highlight() {
    const active = hovered ?? selected;
    marks.classed("waffle-muted", row => active !== null && row.area !== active);
    buttons.attr("aria-pressed", row => row.area === selected);
    entries.classed("waffle-active", row => row.area === active);
  }

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
  legend.append("p").text("Select an area to highlight its squares. Select it again to show all areas.");
  frame.replaceChildren(svg.node(), legend.node());
}
