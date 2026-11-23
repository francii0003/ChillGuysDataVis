export const section = `<section class="chart-section" id="stacked" aria-labelledby="stacked-title">
      <div class="container">
        <h2 id="stacked-title">What powers the grids of the countries that host AI data centers?</h2>
        <p class="chart-lede">Share of electricity from fossil fuels, renewables and nuclear in 2025. Choose a region to explore its host countries.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-stacked">
            <p class="chart-placeholder">Loading chart… <a href="data/05_stacked_generation_mix.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 5. Electricity generation mix of host-country grids, 2025, in percent.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> Ember and Epoch AI. Regional values cover only host countries in the Epoch sample. Rest of the world has no operating sites in this sample. Regional shares divide reported source generation by total host-country generation. Ember lists no nuclear entry for Malaysia or Indonesia. <a href="data/detail/05_generation_sources.csv">Source breakdown (CSV)</a>.</p>
        <p class="prose">Gas supplied about 40% of US electricity in 2025, compared with 17% from nuclear and 16% from coal.</p>
      </div>
    </section>`;
import {figure,key,textAt,bottomAxis} from "./figure.js";

import {regionalView} from "./regional-view.js";

export async function render(root) {
  const {rows,svg,legend} = await figure(root,"stacked","05_stacked_generation_mix.csv",405);
  const detail = await d3.csv("data/detail/05_generation_sources.csv",d3.autoType);
  const countriesByArea = d3.group(rows,d=>d.macroarea);
  const colors = {Fossil:"#705447",Renewables:"#007c58",Nuclear:"#5276a1"};
  Object.entries(colors).forEach(([label,color])=>key(legend,label,color));
  await regionalView("stacked", rows, svg, legend, 33, (rows,height) => {
  const x = d3.scaleLinear([0,100],[135,780]);
  Array.from(d3.group(rows,d=>d.label)).forEach(([country,values],i)=>{
    const y = 12+i*33;
    textAt(svg,126,y+16,country,"end");
    const total = d3.sum(values,d=>d.share_pct);
    let cumulative = 0;
    for (const d of values.sort((a,b)=>a.category_order-b.category_order)) {
      if (!Number.isFinite(d.share_pct)) continue;
      const start = x(cumulative/total*100);
      cumulative += d.share_pct;
      svg.append("rect").attr("x",start).attr("y",y).attr("width",x(cumulative/total*100)-start)
        .attr("height",22).attr("fill",colors[d.category]).append("title")
        .text(() => {
          const members = countriesByArea.has(country)
            ? new Set(countriesByArea.get(country).map(row => row.country))
            : new Set([country]);
          const components = detail.filter(row => members.has(row.country) && row.category === d.category);
          const lines = d3.groups(components,row => row.source).map(([source,parts]) => {
            const reported = parts.filter(row => Number.isFinite(row.generation_twh));
            return source + ": " + (reported.length ? d3.sum(reported,row=>row.generation_twh).toFixed(2) + " TWh reported" : "no entry");
          });
          return [country + " · " + d.category + ": " + d.share_pct.toFixed(2) + "%", ...lines].join("\n");
        });
    }
  });
  bottomAxis(svg,x,height-55,"Share of national electricity generation",d=>d+"%");
  });
}
