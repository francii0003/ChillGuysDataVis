import { figure } from "./figure.js";

export const section = `<section class="chart-section" id="packing" aria-labelledby="packing-title">
  <div class="container">
    <h2 id="packing-title">How is AI computing capacity spread across countries, owners and sites?</h2>
    <p class="chart-lede">XXX</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-packing">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 6.</strong> Operating AI data centers by macroarea, owner and site (area = megawatts).</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Epoch AI, 2025</span>
            <span aria-hidden="true">·</span>
            <a href="data/06_circle_packing_hierarchy.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            Epoch AI, Frontier Data Centers, operating sites only. Gray, dashed circles indicate an unknown owner; these sites still count toward operating power.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">83.6%</p>
      <p class="takeaway-text">of operating AI data center capacity in the sample is located in the United States (12,640 MW across 60 of the 76 sites): <strong>a handful of tech giants hold a near-monopoly on global compute</strong>.</p>
    </div>
    <div class="chart-text">
      <p><strong>A concentrated market across borders.</strong> Just as <a href="#heatmap">Figure 4</a> showed how unevenly clean electricity is distributed, Figure 6 highlights how tightly AI infrastructure is controlled by a small group of dominant operators. Six companies: Google (21.0% of total MW), Meta (15.4%), Amazon (12.4%), Microsoft (10.0%), SpaceXAI (8.6%), and Oracle (5.9%), account for nearly three-quarters (73.4%) of all operating capacity in the sample.</p>
      <p><strong>Global reach, local footprints.</strong> While the United States hosts 60 of the 76 facilities, major operators also extend into Europe and Asia Pacific, such as Google in the United Kingdom, Oracle in Indonesia, CoreWeave in Norway, and ByteDance in both China and Malaysia.</p>
    </div>
  </div>
</section>`;

export async function render(root) {
  const { rows, svg, legend } = await figure(root, "packing", "06_circle_packing_hierarchy.csv", 600, 600);
  const siteNode = site => ({
    ...site,
    name: site.site,
    ownerUnknown: !site.owner || site.owner === "Unknown"
  });

  const tree = d3.hierarchy({
    name: "All macroareas",
    children: d3.groups(rows, row => row.macroarea).map(([name, sites]) => {
      const owners = d3.groups(sites, site => site.owner || "Unknown");
      return {
        name,
        children: owners.map(([owner, ownerSites]) => ({
          name: owner === "Unknown" ? "Owner unknown" : owner,
          ownerUnknown: owner === "Unknown",
          children: ownerSites.map(siteNode)
        }))
      };
    })
  }).sum(node => node.mw ?? 0)
    .sort((a, b) => b.value - a.value || a.data.name.localeCompare(b.data.name));

  d3.pack().size([600, 600]).padding(4)(tree);

  const format = d3.format(",.1f");
  const pctFormat = d3.format(".1f");
  const ownerUnknown = node => node.data.ownerUnknown || node.parent?.data.ownerUnknown;
  const describe = node => {
    const share = tree.value > 0 ? ` (${pctFormat((node.value / tree.value) * 100)}%)` : "";
    const power = `${node.data.name} · ${format(node.value)} MW${share}`;
    return !node.children && ownerUnknown(node) ? `${power} · Owner unknown` : power;
  };

  const regionClasses = {
    "United States": "pack-us",
    China: "pack-cn",
    Europe: "pack-eu",
    "Rest of Asia Pacific": "pack-apac",
    "Rest of the world": "pack-row"
  };

  const regionColors = {
    "United States": "var(--area-us, #1F3A8A)",
    China: "var(--area-cn, #DE2910)",
    Europe: "var(--area-eu, #FFCC00)",
    "Rest of Asia Pacific": "var(--area-apac, #3AA6D8)",
    "Rest of the world": "var(--area-row, #B4B9BE)"
  };

  function regionName(node) {
    const region = node.ancestors().find(item => item.depth === 1);
    return region?.data.name ?? null;
  }

  function regionClass(node) {
    return regionClasses[regionName(node)];
  }

  function regionColor(node) {
    if (ownerUnknown(node)) return "var(--area-row, #B4B9BE)";
    return regionColors[regionName(node)] || "var(--green, #007C58)";
  }

  // Only Back and Overview buttons + breadcrumb path (without root) + hint
  const navBar = legend.append("div").attr("class", "pack-nav-bar");
  const navigation = navBar.append("div").attr("class", "pack-navigation");
  const back = navigation.append("button").attr("type", "button").attr("class", "pack-link")
    .text("← Back").on("click", () => goBack());
  const overview = navigation.append("button").attr("type", "button").attr("class", "pack-link")
    .text("Overview").on("click", () => show(tree, true));
  const path = navBar.append("nav").attr("class", "pack-path").attr("aria-label", "Circle packing location");

  legend.append("span")
    .attr("class", "pack-hint")
    .text("Click a circle to zoom in · Hover to inspect · Esc to go back");

  const frame = d3.select(legend.node().parentNode);
  const layout = frame.append("div").attr("class", "pack-layout");
  layout.node().append(svg.node().parentNode);

  const panel = layout.append("aside").attr("class", "pack-side-panel").attr("aria-live", "polite");
  const summary = panel.append("div").attr("class", "pack-side-header");
  const children = panel.append("ul").attr("class", "pack-children");

  const directory = frame.append("details").attr("class", "pack-directory");
  directory.append("summary").text(`All ${rows.length} data centers`);
  directory.append("ul").selectAll("li")
    .data(tree.leaves().sort((a, b) => a.data.name.localeCompare(b.data.name)))
    .join("li").append("button").attr("type", "button").attr("class", "pack-link")
    .text(node => `${node.data.name} · ${node.data.country}`)
    .on("click", (_, node) => {
      directory.property("open", false);
      show(node.parent);
      marks.selectAll("circle").filter(item => item === node).node()?.focus();
    });

  svg.attr("role", "group").style("outline", "none");
  const marks = svg.append("g");
  const labels = svg.append("g").attr("aria-hidden", "true");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let focus = tree;

  function goBack() {
    if (focus.parent) show(focus.parent, true);
  }

  function viewBox(node) {
    if (node === tree) {
      const topChildren = node.children ?? [];
      if (topChildren.length) {
        const minX = d3.min(topChildren, d => d.x - d.r) - 6;
        const maxX = d3.max(topChildren, d => d.x + d.r) + 6;
        const minY = d3.min(topChildren, d => d.y - d.r) - 6;
        const maxY = d3.max(topChildren, d => d.y + d.r) + 6;
        const size = Math.max(maxX - minX, maxY - minY);
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
      }
    }
    const diameter = node.r * 2.12;
    return `${node.x - diameter / 2} ${node.y - diameter / 2} ${diameter} ${diameter}`;
  }

  function updateHeader(node) {
    summary
      .text(describe(node))
      .style("border-left-color", node === tree ? "var(--green)" : regionColor(node));
  }

  function show(node, moveFocus = false) {
    const previous = focus;
    focus = node;
    const next = node.children ?? [];
    updateHeader(node);
    back.property("disabled", !node.parent);
    overview.property("disabled", node === tree);

    const trailNodes = node.ancestors().reverse().filter(item => item !== tree);
    const trail = path.selectAll("button").data(trailNodes).join("button")
      .attr("type", "button").attr("class", "pack-link")
      .attr("aria-current", item => item === node ? "location" : null)
      .text(item => item.data.name)
      .on("click", (_, item) => show(item, true));

    children.selectAll("li").remove();
    next.forEach(item => {
      const li = children.append("li");
      li.append("span")
        .attr("class", "pack-child-dot")
        .style("background", regionColor(item))
        .attr("aria-hidden", "true");

      if (item.children) {
        li.append("button")
          .attr("type", "button")
          .attr("class", "pack-link")
          .text(describe(item))
          .on("click", () => show(item, true));
      } else {
        li.append("span").text(describe(item));
      }
    });

    if (previous !== node && !reduceMotion.matches) {
      svg.interrupt().transition().duration(350).attr("viewBox", viewBox(node));
    } else {
      svg.interrupt().attr("viewBox", viewBox(node));
    }

    const circles = marks.selectAll("circle").data(next).join("circle")
      .attr("class", "pack-node")
      .classed("pack-unknown", ownerUnknown)
      .attr("data-region", regionClass)
      .attr("cx", item => item.x).attr("cy", item => item.y).attr("r", item => item.r)
      .attr("role", item => item.children ? "button" : "img")
      .attr("tabindex", 0).attr("aria-label", describe)
      .on("pointerenter focus", (_, item) => updateHeader(item))
      .on("pointerleave blur", () => updateHeader(focus))
      .on("click", null)
      .on("keydown", null);

    circles.filter(item => item.children)
      .on("click", (_, item) => show(item, true))
      .on("keydown", (event, item) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) show(item, true);
      });

    const maxScale = Math.max(0.18, node.r / 215);
    const text = labels.selectAll("text").data(next).join("text")
      .attr("class", "pack-label")
      .classed("pack-label--light", item => !ownerUnknown(item) && (regionClass(item) === "pack-us" || regionClass(item) === "pack-cn"))
      .attr("text-anchor", "middle");

    text.each(function (item) {
      const words = item.data.name.split(/\s+/).filter(Boolean);
      const lines = words.length > 1 ? words : [item.data.name];
      const textEl = d3.select(this);

      textEl.selectAll("tspan").data(lines).join("tspan")
        .attr("x", 0)
        .attr("y", (_, index) => `${0.35 + (index - (lines.length - 1) / 2) * 1.05}em`)
        .text(line => line);

      const bbox = this.getBBox();
      const textW = Math.max(1, bbox.width);
      const textH = Math.max(1, bbox.height);
      const innerDiameter = Math.max(4, item.r * 1.62);
      const fitW = innerDiameter / textW;
      const fitH = innerDiameter / textH;
      const scale = Math.max(0.015, Math.min(maxScale, fitW, fitH));

      textEl
        .attr("transform", `translate(${item.x},${item.y}) scale(${scale})`)
        .attr("visibility", "visible");
    });

    if (moveFocus && trailNodes.length) {
      trail.filter(item => item === node).node()?.focus();
    }
  }

  frame.on("keydown", event => {
    if (event.key === "Escape" && focus.parent) {
      event.preventDefault();
      goBack();
    }
  });

  show(tree);
}