import { figure } from "./figure.js";

export const section = `<section class="chart-section" id="sankey" aria-labelledby="sankey-title">
  <div class="container">
    <h2 id="sankey-title">Does clean power growth keep pace with AI data center demand in host countries?</h2>
    <p class="chart-lede">Choose a country to see how much estimated AI data center demand could be matched by average annual clean electricity growth. Ribbon widths show <strong>TWh per year</strong> and rescale for each country.</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-sankey">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 7.</strong> Potential coverage of estimated AI data center demand by average annual clean electricity growth (2018–2025).</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Ember &amp; Epoch AI, 2018–2025</span>
            <span aria-hidden="true">·</span>
            <a href="data/07_dumbbell_ai_vs_clean.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            The comparison covers the ten countries with operating capacity in the Epoch AI sample. Estimated annual demand assumes continuous full-load operation (MW × 8,760 hours ÷ 1,000,000). Clean generation includes renewables and nuclear. Its average annual change is the difference between 2018 and 2025 divided by seven. For each country, the diagram matches positive clean growth to AI demand up to the smaller of the two values, then shows any remaining growth or demand gap. A decline in clean generation leaves no growth available to match demand and is reported separately. The ribbons represent a hypothetical annual balance. Actual supply depends on grid dispatch, contracts and when electricity is generated and consumed.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">5.2%</p>
      <p class="takeaway-text">of Malaysia's 2025 electricity generation equals the full-load demand of its operating AI data centers—more than five times its annual clean power growth (+1.0%/yr): <strong>in fast-growing hubs, AI load can outpace clean grid additions</strong>.</p>
    </div>
    <div class="chart-text">
      <p><strong>Where AI demand outstrips clean additions.</strong> In Malaysia (1,250.7 MW across 4 sites), continuous AI demand reaches 11.0 TWh/yr—<strong>5.2% of national generation</strong>—while clean power grew by just 2.1 TWh/yr (+1.0%/yr) between 2018 and 2025, while power-sector emissions rose by 19.9 MtCO₂e. In the United States (12,640.3 MW across 60 sites), estimated AI load represents 2.45% of 2025 generation (110.7 TWh/yr) against +1.27%/yr in clean additions (+57.6 TWh/yr), absorbing a substantial share of new low-carbon supply even as overall US power emissions declined.</p>
      <p><strong>Where clean expansion leads—and why scale matters.</strong> Countries such as Finland (+4.2%/yr clean growth vs. 0.8% AI load), Portugal (+3.3% vs. 0.6%), Australia (+3.2% vs. 0.1%), and China (+3.0% vs. 0.1%) have added clean generation far faster than their current AI footprint. Yet China's case also underscores a crucial caveat: because total electricity demand expanded dramatically between 2018 and 2025, absolute power emissions still rose by 991.1 MtCO₂e <strong>despite falling carbon intensity</strong>.</p>
    </div>
  </div>
</section>`;

export async function render(root) {
  const width = 800;
  const height = 290;
  const { rows, svg, legend } = await figure(root, "sankey", "07_dumbbell_ai_vs_clean.csv", height, width);
  const countries = rows.filter(row => row.dc_mw > 0);
  const format = d3.format(",.3~f");

  const control = legend.append("label").attr("class", "sankey-control");
  control.append("span").text("Country");
  const select = control.append("select");
  select.selectAll("option").data(countries).join("option")
    .attr("value", row => row.country)
    .text(row => row.country);

  const summary = d3.select(legend.node().parentNode)
    .insert("p", ".plot-scroll")
    .attr("class", "sankey-summary")
    .attr("aria-live", "polite");
  const description = svg.append("desc").attr("id", "sankey-description");
  svg.attr("aria-describedby", "sankey-description");
  const plot = svg.append("g");

  const left = 250;
  const right = 535;
  const nodeWidth = 12;
  const linkPath = d3.linkHorizontal();

  function draw(row) {
    const demand = row.ai_demand_twh_100pct;
    const change = row.clean_annual_avg_growth_twh;
    const growth = Math.max(0, change);
    const matched = Math.min(growth, demand);
    const gap = demand - matched;
    const remaining = growth - matched;
    const scale = d3.scaleLinear([0, Math.max(demand, growth)], [0, 190]);

    const top = 55;
    const separation = 34;
    const gapTop = top + scale(growth) + (growth > 0 ? separation : 0);
    const remainingTop = top + scale(demand) + separation;
    const nodes = [
      { label: "Clean growth", value: growth, x: left, y: top, type: "clean" },
      { label: "Demand gap", value: gap, x: left, y: gapTop, type: "gap" },
      { label: "Estimated AI demand", value: demand, x: right, y: top, type: "demand" },
      { label: "Remaining clean growth", value: remaining, x: right, y: remainingTop, type: "clean" }
    ].filter(node => node.value > 0);

    const links = [
      { value: matched, sourceY: top, targetY: top, type: "clean" },
      { value: gap, sourceY: gapTop, targetY: top + scale(matched), type: "gap" },
      { value: remaining, sourceY: top + scale(matched), targetY: remainingTop, type: "clean" }
    ].filter(link => link.value > 0);

    plot.selectAll("path").data(links).join("path")
      .attr("class", link => `sankey-link sankey-${link.type}`)
      .attr("stroke-width", link => scale(link.value))
      .attr("d", link => {
        const offset = scale(link.value) / 2;
        return linkPath({
          source: [left + nodeWidth, link.sourceY + offset],
          target: [right, link.targetY + offset]
        });
      });

    plot.selectAll("rect").data(nodes).join("rect")
      .attr("class", node => `sankey-node sankey-${node.type}`)
      .attr("x", node => node.x).attr("y", node => node.y)
      .attr("width", nodeWidth).attr("height", node => scale(node.value));

    const labels = plot.selectAll("text").data(nodes).join("text")
      .attr("x", node => node.x === left ? left - 12 : right + nodeWidth + 12)
      .attr("y", (node, index) => {
        const previous = nodes[index - 1];
        const center = node.y + scale(node.value) / 2;
        return previous?.x === node.x
          ? Math.max(center, previous.y + scale(previous.value) / 2 + 38)
          : center;
      })
      .attr("text-anchor", node => node.x === left ? "end" : "start")
      .text(node => node.label);
    labels.append("tspan")
      .attr("x", node => node.x === left ? left - 12 : right + nodeWidth + 12)
      .attr("dy", "1.25em")
      .text(node => `${format(node.value)} TWh/yr`);

    const balance = gap > 0
      ? `${format(gap)} TWh/yr remains unmatched.`
      : `${format(remaining)} TWh/yr of clean growth remains after matching demand.`;
    const decline = change < 0 ? ` Clean generation fell by ${format(-change)} TWh/yr on average.` : "";
    const detail = `${row.country}: clean growth could match ${format(matched)} of ${format(demand)} TWh/yr of estimated AI demand at full load. ${balance}${decline}`;
    summary.text(detail);
    description.text(detail);
  }

  select.property("value", "Malaysia")
    .on("change", event => draw(countries.find(row => row.country === event.target.value)));
  draw(countries.find(row => row.country === select.property("value")));
}
