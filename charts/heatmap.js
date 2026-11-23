export const section = `<section class="chart-section" id="heatmap" aria-labelledby="heatmap-title">
      <div class="container">
        <h2 id="heatmap-title">How clean is the electricity where AI data centers are built?</h2>
        <p class="chart-lede">Grid carbon intensity by macroarea and year. Choose a region to see its host countries.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-heatmap">
            <p class="chart-placeholder">Loading chart… <a href="data/04_heatmap_grid_intensity.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 4. Carbon intensity of electricity generation by area and year, 2015&ndash;2025.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> Ember and Epoch AI. Regional values cover only host countries in the Epoch sample. Rest of the world has no operating sites in this sample. Regional intensity is weighted by each host country’s electricity generation in the year shown.</p>
        <p class="prose">In 2025 the US grid averaged 384 gCO₂e/kWh, compared with 606 in Malaysia and 528 in China. These three countries host about 98% of the operating power in this sample.</p>
      </div>
    </section>`;
import {figure, key, textAt} from "./figure.js";

import {regionalView} from "./regional-view.js";

export async function render(root) {
  const {rows,svg,legend} = await figure(root,"heatmap","04_heatmap_grid_intensity.csv",380);
  const thresholds = [100,200,300,400,500,600,700];
  const bin = d3.scaleThreshold(thresholds,d3.range(8));
  legend.append("strong").text("gCO₂e/kWh");
  for (let i=0; i<8; i++) {
    key(legend,i===7 ? "700+" : `${i*100}–<${(i+1)*100}`,`var(--seq-${i})`);
  }
  await regionalView("heatmap", rows, svg, legend, 34, (rows,height) => {
  const countries = [...new Set(rows.map(d=>d.label))];
  const years = [...new Set(rows.map(d=>d.year))].sort(d3.ascending);
  const x = d3.scaleBand(years,[145,790]).padding(.035);
  const y = d3.scaleBand(countries,[32,height-10]).padding(.05);
  years.forEach(year=>textAt(svg,x(year)+x.bandwidth()/2,20,year,"middle"));
  countries.forEach(country=>textAt(svg,136,y(country)+y.bandwidth()/2+5,country,"end"));
  svg.selectAll("rect").data(rows).join("rect").attr("x",d=>x(d.year)).attr("y",d=>y(d.label))
    .attr("width",x.bandwidth()).attr("height",y.bandwidth()).attr("class",d=>"q"+bin(d.intensity_gco2_kwh))
    .append("title").text(d=>`${d.label}, ${d.year}: ${d.intensity_gco2_kwh.toFixed(1)} gCO₂e/kWh; ${d.mw_share_pct.toFixed(2)}% of sampled site power.`);
  });
}
