export const section = `<section class="chart-section" id="packing" aria-labelledby="packing-title">
      <div class="container">
        <h2 id="packing-title">How is AI computing capacity spread across countries, owners and sites?</h2>
        <p class="chart-lede">Choose a macroarea to explore its countries, owners and sites. Each site circle has an area proportional to its operating power.</p>
        <figure class="figure">
          <div class="chart-frame" id="chart-packing">
            <p class="chart-placeholder">Loading chart… <a href="data/06_circle_packing_hierarchy.csv">Download data (CSV)</a>.</p>
          </div>
          <figcaption>Figure 6. Operating AI data centers by country, owner and site (area = megawatts).</figcaption>
        </figure>
        <p class="chart-note"><strong>Data.</strong> Epoch AI, Frontier Data Centers, operating sites only. Sites without a known owner are grouped as &ldquo;Unknown&rdquo;.</p>
        <p class="prose">The 76 operating sites are grouped by host country and owner. Choose a macroarea to inspect its smaller sites; hover over a site for its name and operating power.</p>
      </div>
    </section>`;
import {figure} from "./figure.js";

export async function render(root) {
  const {rows,svg,legend} = await figure(root,"packing","06_circle_packing_hierarchy.csv",600,600);
  const totals = await d3.csv("data/detail/06_macroareas.csv", d3.autoType);
  const select = legend.append("label").text("Macroarea").append("select");
  select.selectAll("option").data(["All macroareas",...totals.map(d=>d.macroarea)]).join("option").text(d=>d);
  function draw() {
    const area = select.property("value");
    const overview = area === "All macroareas";
    const sites = overview ? rows : rows.filter(d=>d.macroarea===area);
    const tree = d3.hierarchy({
      children:overview ? totals.filter(d=>d.operating_sites>0).map(d=>({name:d.macroarea,mw:d.operating_mw})) : d3.groups(sites,d=>d.country,d=>d.owner).map(([name,owners])=>({
        name, children:owners.map(([name,children])=>({name,children}))
      }))
    }).sum(d=>d.mw || 0).sort((a,b)=>b.value-a.value);
    d3.pack().size([600,600]).padding(3)(tree);
    svg.selectAll("*").remove();
    if (!sites.length) { svg.attr("viewBox","0 0 600 65").append("text").attr("x",12).attr("y",32).text("No operating sites in the Epoch sample."); return; }
    svg.attr("viewBox","0 0 600 600");
    const nodes = svg.selectAll("g").data(tree.descendants().slice(1)).join("g")
      .attr("transform",d=>`translate(${d.x},${d.y})`);
    nodes.append("circle").attr("r",d=>d.r)
      .attr("class",d=>overview ? "cat-" + (totals.findIndex(r=>r.macroarea===d.data.name)+1) : ["","pack-country","pack-owner","pack-site"][d.depth])
      .append("title").text(d=>overview || d.children ? `${d.data.name}: ${d3.format(",.1f")(d.value)} MW`
        : `${d.data.site} · ${d.data.owner} · ${d.data.country}: ${d.data.mw} MW`);
    if (overview) nodes.on("click",(_,d)=>{select.property("value",d.data.name);draw();}).style("cursor","pointer");
    // Label sites only when their names fit inside the circle.
    nodes.filter(d=>!d.children && d.r>16).append("text").attr("text-anchor","middle")
      .attr("dy",".35em").attr("class","pack-label").text(d=>overview ? d.data.name : d.data.site)
      .each(function(d){ if(this.getComputedTextLength()>d.r*1.8) this.remove(); });
  }
  select.on("change",draw);
  draw();
}
