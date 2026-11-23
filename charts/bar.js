export const section = `<section class="chart-section" id="bar" aria-labelledby="bar-title">
      <div class="container">
        <h2 id="bar-title">How much new electricity will data centers need by 2030?</h2>
        <p class="chart-lede">The increase in yearly consumption between 2024 and 2030 in the IEA Base Case, for the same areas as Figure 1.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-bar">
            <p class="chart-placeholder">Loading chart… <a href="data/02_bar_dc_electricity_increase_2030.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 2. Increase in data center electricity consumption from 2024 to 2030 (Base Case), in TWh.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> IEA, Energy and AI (Regional Data). The Base Case is a scenario, not a forecast, and the IEA table is rounded to whole TWh.</p>
        <p class="prose">In the Base Case, the United States and China together add 418 TWh of annual demand by 2030, roughly equal to the worldwide total in 2024.</p>
      </div>
    </section>`;
import {figure, textAt, bottomAxis} from "./figure.js";

export async function render(root) {
  const {rows, svg} = await figure(root,"bar","02_bar_dc_electricity_increase_2030.csv",300);
  // Keep the same area colours as the waffle, even when the ranking changes.
  const areas = ["United States","China","Europe","Rest of Asia Pacific","Rest of the world"];
  const x = d3.scaleLinear([0,d3.max(rows,d=>d.increase_twh)],[155,720]).nice();
  rows.forEach((d,i) => {
    const y = 12 + i * 45;
    textAt(svg,145,y+17,d.area,"end");
    svg.append("rect").attr("class","cat-" + (areas.indexOf(d.area)+1))
      .attr("x",x(0)).attr("y",y).attr("height",24).attr("width",x(d.increase_twh)-x(0))
      .append("title").text(`${d.area}: ${d.twh_2024} → ${d.twh_2030_base} TWh per year`);
    textAt(svg,x(d.increase_twh)+6,y+17,"+" + d.increase_twh);
  });
  bottomAxis(svg,x,237,"Increase in annual consumption (TWh)");
}
