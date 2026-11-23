export const section = `<section class="chart-section" id="dumbbell" aria-labelledby="dumbbell-title">
      <div class="container">
        <h2 id="dumbbell-title">Have the grids of host countries become cleaner since 2018?</h2>
        <p class="chart-lede">Compare grid carbon intensity in 2018 and 2025 by macroarea, or choose a region to explore its host countries.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-dumbbell">
            <p class="chart-placeholder">Loading chart… <a href="data/07_dumbbell_grid_intensity.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 7. Change in grid carbon intensity between 2018 and 2025, in gCO<sub>2</sub>e/kWh.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> Ember and Epoch AI. Regional values cover only host countries in the Epoch sample. Rest of the world has no operating sites in this sample. Regional intensity is weighted by each host country’s electricity generation in the year shown.</p>
        <p class="prose">Portugal recorded the largest absolute drop among these countries, from 359 to 128 gCO₂e/kWh. Finland had the largest relative drop, about 70%.</p>
      </div>
    </section>`;
import {figure,key,textAt,bottomAxis} from "./figure.js";

import {regionalView} from "./regional-view.js";

export async function render(root) {
  const {rows,svg,legend} = await figure(root,"dumbbell","07_dumbbell_grid_intensity.csv",410);
  key(legend,"2018 · open circle","white");
  key(legend,"2025 · filled circle","var(--green)");
  await regionalView("dumbbell", rows, svg, legend, 35, (rows,height) => {
  const x = d3.scaleLinear([0,d3.max(rows,d=>Math.max(d.intensity_start,d.intensity_end))],[140,774]).nice();
  rows.forEach((d,i)=>{
    const y = 18+i*35;
    textAt(svg,125,y+5,d.label,"end");
    const group = svg.append("g");
    group.append("title").text(`${d.label}: ${d.intensity_start.toFixed(1)} → ${d.intensity_end.toFixed(1)} gCO₂e/kWh (${d.change_pct.toFixed(1)}%)`);
    group.append("line").attr("class","connector").attr("x1",x(d.intensity_start)).attr("x2",x(d.intensity_end)).attr("y1",y).attr("y2",y);
    group.append("circle").attr("cx",x(d.intensity_start)).attr("cy",y).attr("r",7)
      .attr("stroke","var(--ink)").attr("stroke-width",1.8).attr("fill","white");
    group.append("circle").attr("cx",x(d.intensity_end)).attr("cy",y).attr("r",4.8).attr("fill","var(--green)");
  });
  bottomAxis(svg,x,height-55,"Grid carbon intensity (gCO₂e/kWh)");
  });
}
