export const section = `<section class="chart-section" id="grouped" aria-labelledby="grouped-title">
      <div class="container">
        <h2 id="grouped-title">Who owns AI computing capacity, and who uses it?</h2>
        <p class="chart-lede">For each company, the power of the data centers it owns is shown next to the power of the data centers where it is listed as a user.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-grouped">
            <p class="chart-placeholder">Loading chart… <a href="data/03_grouped_bar_owner_vs_user.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 3. Operating power of AI data centers by owner and by user, in megawatts.</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> Epoch AI, Frontier Data Centers, operating sites only. When a site has several users, its power is split equally among them. Epoch&rsquo;s confidence labels (confident, likely, speculative) are kept, and capacity with an unknown owner or user is shown separately. The top five companies are ranked by the larger of owner or user MW. Google includes Google DeepMind. <a href="data/detail/03_site_roles.csv">Site-level assignments (CSV)</a>. The data is a selection of large sites, not a census.</p>
        <p class="prose">Google leads identified owners at 3,179 MW. Anthropic is listed as a user of about 2,522 MW across seven sites. The user is unknown for almost a quarter of the operating power in the sample.</p>
      </div>
    </section>`;
import {figure, key, textAt, bottomAxis} from "./figure.js";

export async function render(root) {
  const {rows,svg,legend} = await figure(root,"grouped","03_grouped_bar_owner_vs_user.csv",400);
  const colors = {Owner:"var(--green)",User:"var(--blue)"};
  Object.entries(colors).forEach(([role,color])=>key(legend,role,color));
  const x = d3.scaleLinear([0,d3.max(rows,d=>d.mw)],[135,720]).nice();
  const fmt = d3.format(",.0f");
  const companies = d3.group(rows, row => row.company);
  const rowHeight = 45;
  const axisY = 12 + companies.size * rowHeight;
  svg.attr("viewBox", `0 0 800 ${axisY + 58}`);

  Array.from(companies).forEach(([company,values],i)=>{
    const y = 12 + i * rowHeight;
    textAt(svg,125,y+18,company,"end");
    for (const d of values) {
      const top = y + (d.role === "User" ? 16 : 0);
      svg.append("rect").attr("x",135).attr("y",top).attr("width",x(d.mw)-135)
        .attr("height",13).attr("fill",colors[d.role]).append("title")
        .text(`${company} · ${d.role}: ${fmt(d.mw)} MW, ${d.n_sites} sites. Confident: ${fmt(d.mw_confident)} MW; likely: ${fmt(d.mw_likely)}; speculative: ${fmt(d.mw_speculative)}; unspecified: ${fmt(d.mw_unspecified)}.`);
      textAt(svg,x(d.mw)+5,top+11,fmt(d.mw));
    }
  });
  bottomAxis(svg,x,axisY,"Operating power (MW)");
}
