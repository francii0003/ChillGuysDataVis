import { figure } from "./figure.js";

const CSV_FILE = "07_sankey_us_2023_lbnl_ember.csv";

export const section = `<section class="chart-section" id="sankey" aria-labelledby="sankey-title">
  <div class="container">
    <h2 id="sankey-title">From the US grid to AI servers: tracing 2023 data center electricity</h2>
    <p class="chart-lede">Starting from the full <strong>2023 US power grid (4,000 TWh)</strong>, we see how it splits into <strong>clean and fossil power</strong> and what share goes to <strong>data centers (176 TWh, 4.4%)</strong>. Then zoom into how data center electricity is divided across <strong>AI servers, conventional servers, storage/network, and infrastructure</strong>, and between <strong>hyperscale &amp; colocation</strong> (massive cloud campuses and multi-tenant data centers built for high scale) and <strong>internal &amp; enterprise</strong> (on-premise or company-owned server rooms and facilities).</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-sankey">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 7.</strong> Interactive 2023 US electricity flow.</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Ember &amp; LBNL 2024 US Data Center Report (2023 baseline)</span>
            <span aria-hidden="true">·</span>
            <a href="data/${CSV_FILE}" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            Data center figures (176 TWh in 2023, 4.4% of US electricity, hardware/cooling splits, and facility tiers) come from LBNL's <em>2024 United States Data Center Energy Usage Report</em>; 2023 clean-vs.-fossil mix shares (40.7% vs. 59.3%) reflect Ember's US power data. <br>The macro view uses a 4,000 TWh implied baseline (176 TWh ÷ 0.044) with grid-average mix applied to data center load (since facility-level PPAs are not uniformly disclosed). <br>Expanding the 176 TWh node smoothly transitions to a dedicated scale for internal data center flows.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">4.4%</p>
      <p class="takeaway-text">of all US electricity in 2023 (<strong>176.0 TWh</strong>) powered data centers (drawing roughly <strong>71.6 TWh</strong> from clean sources and <strong>104.4 TWh</strong> from fossil fuels at grid-average mix), with <strong>79%</strong> already concentrated in <strong>hyperscale &amp; colocation</strong> (large cloud campuses and shared third-party facilities) rather than <strong>internal &amp; enterprise</strong> (in-house corporate server rooms).</p>
    </div>
    <div class="chart-text">
      <p>As seen in Figures <a href="#heatmap">4</a> and <a href="#stacked">5</a>, fossil fuels still power a large share of the global electricity engine, and the United States is no exception, with <strong>59.3%</strong> (<strong>2,372 TWh</strong>) coming from fossil and other sources against <strong>40.7%</strong> (<strong>1,628 TWh</strong>) from clean power in 2023. Within that system, <strong>4.4%</strong> (<strong>176.0 TWh</strong>) going to data centers is already a significant share for a single sector, especially because its impact clusters on specific regional grids rather than spreading evenly across the country.</p>
      <p>Once you zoom into those <strong>176.0 TWh</strong>, the heavy concentration in <strong>hyperscale &amp; colocation</strong> (<strong>139.0 TWh</strong>, or <strong>79%</strong>, large cloud campuses and multi-tenant facilities) stands out as a major driver of local grid and infrastructure pressure compared with <strong>internal &amp; enterprise</strong> (<strong>37.0 TWh</strong>, or <strong>21%</strong>, company-owned or on-premise server rooms). Across the data center stack itself, load is fairly balanced across four pieces: <strong>AI specialized servers</strong> (<strong>42.0 TWh</strong>, hardware tailored for model training and inference), <strong>conventional servers</strong> (<strong>58.0 TWh</strong>, standard general-purpose compute), <strong>storage &amp; network</strong> (<strong>23.2 TWh</strong>, data persistence and internal/external interconnects), and <strong>infrastructure</strong> (<strong>52.8 TWh</strong>, cooling, power delivery, and <Expansion term="PUE">Power Usage Effectiveness overhead that reflects non-computing facility energy.</p>
    </div>
  </div>
</section>`;

export async function render(root) {
  const width = 880;
  const height = 390;
  const { rows, svg, legend } = await figure(root, "sankey", CSV_FILE, height, width);

  const data = rows.map(d => ({
    ...d,
    value: Number(d.value),
    pct_of_stage: Number(d.pct_of_stage)
  }));
  if (!data.length) return;

  const format = d3.format(",.1f");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reducedMotion ? 0 : 550;
  const ease = d3.easeCubicInOut;

  let viewMode = "macro"; // "macro" | "dc"

  const navBtn = legend.append("button")
    .attr("type", "button")
    .attr("class", "sankey-nav-btn")
    .on("click", () => {
      viewMode = viewMode === "macro" ? "dc" : "macro";
      draw();
    });

  const swatchesWrap = legend.append("span").attr("class", "sankey-swatches");

  const summary = d3.select(legend.node().parentNode)
    .insert("p", ".plot-scroll")
    .attr("class", "sankey-summary")
    .attr("aria-live", "polite");

  const description = svg.append("desc").attr("id", "sankey-description");
  svg.attr("aria-describedby", "sankey-description");

  const headersLayer = svg.append("g").attr("class", "sankey-headers");
  const linksLayer = svg.append("g").attr("class", "sankey-links");
  const nodesLayer = svg.append("g").attr("class", "sankey-nodes");
  const pillsLayer = svg.append("g").attr("class", "sankey-pills");

  const linkPath = d3.linkHorizontal();

  const s1 = data.filter(d => d.stage === "1_mix");
  const s2 = data.filter(d => d.stage === "2_sector");
  const s3 = data.filter(d => d.stage === "3_component");
  const s4 = data.filter(d => d.stage === "4_facility");

  const totalGrid = d3.sum(s1, d => d.value);
  const totalDc = d3.sum(s3, d => d.value);

  const macroSwatches = [
    { label: "US Electricity 2023 (4,000 TWh)", cls: "sankey-total" },
    { label: "Clean Power", cls: "sankey-clean" },
    { label: "Fossil & Other", cls: "sankey-fossil" },
    { label: "Data Center Electricity", cls: "sankey-ai" },
    { label: "Other US Electricity Uses", cls: "sankey-other" }
  ];

  const dcSwatches = [
    { label: "Data Center", cls: "sankey-total" },
    { label: "AI Specialized Servers", cls: "sankey-ai" },
    { label: "Conventional Servers", cls: "sankey-conv" },
    { label: "Storage & Network", cls: "sankey-net" },
    { label: "Infrastructure", cls: "sankey-infra" }
  ];

  function updateLegend() {
    if (viewMode === "macro") {
      navBtn
        .attr("aria-expanded", "false")
        .html(`Expand 176 TWh <span aria-hidden="true">→</span>`);
    } else {
      navBtn
        .attr("aria-expanded", "true")
        .html(`<span aria-hidden="true">←</span> Back to US Grid`);
    }

    const activeSwatches = viewMode === "macro" ? macroSwatches : dcSwatches;
    const items = swatchesWrap.selectAll(".legend-item")
      .data(activeSwatches, d => d.label);

    items.exit().remove();

    const enter = items.enter()
      .append("span")
      .attr("class", "legend-item");
    enter.append("i").attr("class", d => `sankey-swatch ${d.cls}`);
    enter.append("span").text(d => d.label);
  }

  function buildMacroScene() {
    const colX = [175, 430, 680];
    const nodeWidth = 14;
    const topPad = 48;
    const gridHeight = 270;
    const scale = d3.scaleLinear([0, totalGrid], [0, gridHeight]);

    const headers = [
      { key: "c1", x: colX[0] + nodeWidth / 2, text: "1. US Electricity (2023)" },
      { key: "c2", x: colX[1] + nodeWidth / 2, text: "2. Generation Mix" },
      { key: "c3", x: colX[2] + nodeWidth / 2, text: "3. Sector Allocation" }
    ];

    const nTotal = {
      name: "US Electricity 2023",
      value: totalGrid,
      pctLabel: "100%",
      x: colX[0],
      y: topPad + 16,
      w: nodeWidth,
      h: scale(totalGrid),
      type: "total",
      labelPos: "left",
      outOffset: 0
    };

    const mixGap = 24;
    let c1 = topPad + 4;
    const col1Nodes = s1.map(d => {
      const h = scale(d.value);
      const node = {
        name: d.target,
        shortName: d.target.replace(" (Renewables + Nuclear)", ""),
        value: d.value,
        pctLabel: `${d.pct_of_stage}%`,
        x: colX[1],
        y: c1,
        w: nodeWidth,
        h,
        type: d.type,
        labelPos: "top",
        inOffset: 0,
        outOffset: 0
      };
      c1 += h + mixGap;
      return node;
    });
    const col1Map = new Map(col1Nodes.map(n => [n.name, n]));

    const dcVal = d3.sum(s2.filter(d => d.target === "Data Center Electricity"), d => d.value);
    const otherVal = d3.sum(s2.filter(d => d.target === "Other US Electricity Uses"), d => d.value);

    const nDc = {
      name: "Data Center Electricity",
      shortName: "Data Centers",
      value: dcVal,
      pctLabel: "4.4% US",
      x: colX[2],
      y: topPad + 4,
      w: nodeWidth,
      h: Math.max(16, scale(dcVal)),
      type: "ai",
      labelPos: "top",
      isDrillTrigger: true,
      pillId: "dc-drill-pill",
      pillText: "Expand 176 TWh →",
      pillDir: "right",
      inOffset: 0
    };

    const nOther = {
      name: "Other US Electricity Uses",
      shortName: "Other US Electricity",
      value: otherVal,
      pctLabel: "95.6% US",
      x: colX[2],
      y: nDc.y + nDc.h + 26,
      w: nodeWidth,
      h: scale(otherVal),
      type: "other",
      labelPos: "bottom",
      inOffset: 0
    };
    const col2Map = new Map([
      [nDc.name, nDc],
      [nOther.name, nOther]
    ]);

    const links1 = s1.map(d => {
      const dst = col1Map.get(d.target);
      const th = scale(d.value);
      const l = {
        id: `${nTotal.name}->${dst.name}`,
        sourceName: nTotal.name,
        targetName: dst.name,
        value: d.value,
        shareText: `${d.pct_of_stage}% of US electricity`,
        type: d.type,
        x0: nTotal.x + nodeWidth,
        y0: nTotal.y + nTotal.outOffset + th / 2,
        x1: dst.x,
        y1: dst.y + th / 2,
        width: th
      };
      nTotal.outOffset += th;
      return l;
    });

    const links2 = s2.map(d => {
      const src = col1Map.get(d.source);
      const dst = col2Map.get(d.target);
      const thSrc = scale(d.value);
      const thDst = dst.name === "Data Center Electricity" ? (d.value / dcVal) * dst.h : scale(d.value);
      const l = {
        id: `${src.name}->${dst.name}`,
        sourceName: src.name,
        targetName: dst.name,
        value: d.value,
        shareText: `${((d.value / totalGrid) * 100).toFixed(2)}% of total US electricity`,
        type: d.type,
        x0: src.x + nodeWidth,
        y0: src.y + src.outOffset + thSrc / 2,
        x1: dst.x,
        y1: dst.y + dst.inOffset + thDst / 2,
        width: Math.max(2, (thSrc + thDst) / 2)
      };
      src.outOffset += thSrc;
      dst.inOffset += thDst;
      return l;
    });

    return {
      headers,
      nodes: [nTotal, ...col1Nodes, nDc, nOther],
      links: [...links1, ...links2],
      summaryText: "Click 'Expand 176 TWh →' to see the second part of the chart.",
      onDrill: () => {
        viewMode = "dc";
        draw();
      }
    };
  }

  function buildDcScene() {
    const colX = [195, 445, 680];
    const nodeWidth = 14;
    const topPad = 48;
    const zoomHeight = 270;
    const scale = d3.scaleLinear([0, totalDc], [0, zoomHeight]);

    const headers = [
      { key: "c1", x: colX[0] + nodeWidth / 2, text: "3. Data Center Total" },
      { key: "c2", x: colX[1] + nodeWidth / 2, text: "4. Hardware & Cooling" },
      { key: "c3", x: colX[2] + nodeWidth / 2, text: "5. Facility Tier" }
    ];

    const nDcRoot = {
      name: "Data Center Electricity",
      shortName: "Data Center Total",
      value: totalDc,
      pctLabel: "4.4% US",
      x: colX[0],
      y: topPad + 16,
      w: nodeWidth,
      h: scale(totalDc),
      type: "ai",
      labelPos: "top",
      isDrillTrigger: true,
      pillId: "dc-drill-pill",
      pillText: "← Back to US Grid",
      pillDir: "left",
      outOffset: 0
    };

    const compGap = 16;
    let c1 = topPad + 2;
    const col1Nodes = s3.map(d => {
      const h = Math.max(6, scale(d.value));
      const node = {
        name: d.target,
        shortName: d.target.replace(" (Cooling & PUE)", ""),
        value: d.value,
        pctLabel: `${((d.value / totalDc) * 100).toFixed(0)}%`,
        x: colX[1],
        y: c1,
        w: nodeWidth,
        h,
        type: d.type,
        labelPos: "top",
        outOffset: 0
      };
      c1 += h + compGap;
      return node;
    });
    const col1Map = new Map(col1Nodes.map(n => [n.name, n]));

    const facOrder = ["Hyperscale & Colocation", "Internal & Enterprise"];
    const facGap = 28;
    let c2 = topPad + 14;
    const col2Nodes = facOrder.map(name => {
      const val = d3.sum(s4.filter(d => d.target === name), d => d.value);
      const h = Math.max(8, scale(val));
      const node = {
        name,
        value: val,
        pctLabel: `${((val / totalDc) * 100).toFixed(0)}% DC`,
        x: colX[2],
        y: c2,
        w: nodeWidth,
        h,
        type: "total",
        labelPos: "right",
        inOffset: 0
      };
      c2 += h + facGap;
      return node;
    });
    const col2Map = new Map(col2Nodes.map(n => [n.name, n]));

    const links1 = s3.map(d => {
      const dst = col1Map.get(d.target);
      const th = scale(d.value);
      const l = {
        id: `${nDcRoot.name}->${dst.name}`,
        sourceName: nDcRoot.name,
        targetName: dst.name,
        value: d.value,
        shareText: `${((d.value / totalDc) * 100).toFixed(1)}% of data center electricity`,
        type: d.type,
        x0: nDcRoot.x + nodeWidth,
        y0: nDcRoot.y + nDcRoot.outOffset + th / 2,
        x1: dst.x,
        y1: dst.y + th / 2,
        width: Math.max(2, th)
      };
      nDcRoot.outOffset += th;
      return l;
    });

    const links2 = s4.map(d => {
      const src = col1Map.get(d.source);
      const dst = col2Map.get(d.target);
      const th = scale(d.value);
      const l = {
        id: `${src.name}->${dst.name}`,
        sourceName: src.name,
        targetName: dst.name,
        value: d.value,
        shareText: `${((d.value / totalDc) * 100).toFixed(1)}% of data center electricity`,
        type: d.type,
        x0: src.x + nodeWidth,
        y0: src.y + src.outOffset + th / 2,
        x1: dst.x,
        y1: dst.y + dst.inOffset + th / 2,
        width: Math.max(2, th)
      };
      src.outOffset += th;
      dst.inOffset += th;
      return l;
    });

    return {
      headers,
      nodes: [nDcRoot, ...col1Nodes, ...col2Nodes],
      links: [...links1, ...links2],
      summaryText: "Click '← Back to US Grid' to see the first part of the chart.",
      onDrill: () => {
        viewMode = "macro";
        draw();
      }
    };
  }

  function labelCoords(d) {
    if (d.labelPos === "left") {
      return { x: d.x - 12, y: d.y + d.h / 2 - 6, anchor: "end", dySub: "1.25em", mainText: d.name, subText: `${format(d.value)} TWh (${d.pctLabel})` };
    }
    if (d.labelPos === "right") {
      return { x: d.x + d.w + 12, y: d.y + d.h / 2 - 6, anchor: "start", dySub: "1.25em", mainText: d.name, subText: `${format(d.value)} TWh (${d.pctLabel})` };
    }
    if (d.labelPos === "bottom") {
      return { x: d.x + d.w / 2, y: d.y + d.h + 15, anchor: "middle", dySub: null, mainText: `${d.name} · ${format(d.value)} TWh (${d.pctLabel})`, subText: "" };
    }
    return { x: d.x + d.w / 2, y: d.y - 6, anchor: "middle", dySub: null, mainText: `${d.shortName || d.name} · ${format(d.value)} TWh (${d.pctLabel})`, subText: "" };
  }

  function pillCoords(n) {
    const pillW = n.pillDir === "right" ? 132 : 122;
    const pillH = 24;
    const px = n.pillDir === "right" ? n.x + n.w + 12 : n.x - pillW - 12;
    const py = n.y + n.h / 2 - pillH / 2;
    return { px, py, pillW, pillH };
  }

  function draw() {
    updateLegend();
    const scene = viewMode === "macro" ? buildMacroScene() : buildDcScene();
    const { headers, nodes, links, summaryText, onDrill } = scene;

    summary.text(summaryText);
    description.text(summaryText);

    const headerSel = headersLayer.selectAll(".sankey-col-title")
      .data(headers, d => d.key);

    headerSel.exit()
      .transition().duration(duration * 0.6).ease(ease)
      .style("opacity", 0)
      .remove();

    const headerEnter = headerSel.enter()
      .append("text")
      .attr("class", "sankey-col-title")
      .attr("x", d => d.x)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .text(d => d.text);

    headerSel.merge(headerEnter)
      .text(d => d.text)
      .transition().duration(duration).ease(ease)
      .attr("x", d => d.x)
      .style("opacity", 1);

    const linkSel = linksLayer.selectAll("path")
      .data(links, d => d.id);

    linkSel.exit()
      .transition().duration(duration * 0.65).ease(ease)
      .style("opacity", 0)
      .remove();

    const linkEnter = linkSel.enter()
      .append("path")
      .attr("class", d => `sankey-link sankey-${d.type}`)
      .attr("d", d => linkPath({ source: [d.x0, d.y0], target: [d.x1, d.y1] }))
      .attr("stroke-width", 1)
      .style("opacity", 0);

    const allLinks = linkSel.merge(linkEnter);

    allLinks
      .attr("class", d => `sankey-link sankey-${d.type}`)
      .on("mouseenter", function (_, d) {
        allLinks.classed("is-dimmed", l => l !== d);
        d3.select(this).classed("is-active", true);
        summary.text(`${d.sourceName} → ${d.targetName}: ${format(d.value)} TWh (${d.shareText}).`);
      })
      .on("mouseleave", function () {
        allLinks.classed("is-dimmed", false).classed("is-active", false);
        summary.text(summaryText);
      })
      .transition().duration(duration).ease(ease)
      .attr("stroke-width", d => d.width)
      .attr("d", d => linkPath({ source: [d.x0, d.y0], target: [d.x1, d.y1] }))
      .style("opacity", null);

    const nodeSel = nodesLayer.selectAll("g.sankey-node-group")
      .data(nodes, d => d.name);

    nodeSel.exit()
      .transition().duration(duration * 0.65).ease(ease)
      .style("opacity", 0)
      .remove();

    const nodeEnter = nodeSel.enter()
      .append("g")
      .attr("class", d => `sankey-node-group${d.isDrillTrigger ? " is-drill-trigger" : ""}`)
      .style("opacity", 0);

    nodeEnter.append("rect")
      .attr("class", d => `sankey-node sankey-${d.type}`)
      .attr("x", d => d.x)
      .attr("y", d => d.y + d.h / 2)
      .attr("width", d => d.w)
      .attr("height", 2)
      .attr("rx", 2);

    const enterText = nodeEnter.append("text")
      .attr("class", d => (d.labelPos === "left" || d.labelPos === "right") ? "" : "sankey-mid-label")
      .attr("x", d => labelCoords(d).x)
      .attr("y", d => labelCoords(d).y)
      .attr("text-anchor", d => labelCoords(d).anchor);

    enterText.text(d => labelCoords(d).mainText);
    enterText.append("tspan")
      .attr("class", "sankey-sub-label value-label")
      .attr("x", d => labelCoords(d).x)
      .attr("dy", "1.25em")
      .text(d => labelCoords(d).subText);

    const allNodes = nodeSel.merge(nodeEnter);

    allNodes
      .attr("class", d => `sankey-node-group${d.isDrillTrigger ? " is-drill-trigger" : ""}`)
      .attr("tabindex", 0)
      .attr("role", d => d.isDrillTrigger ? "button" : null)
      .attr("aria-label", d => d.isDrillTrigger ? `${d.name}, ${format(d.value)} TWh. Activate to toggle view.` : null)
      .on("mouseenter focus", (_, d) => {
        allLinks.classed("is-dimmed", l => l.sourceName !== d.name && l.targetName !== d.name);
        const hint = d.isDrillTrigger
          ? (viewMode === "macro" ? " — Click 'Expand 176 TWh →' to see the second part of the chart." : " — Click '← Back to US Grid' to see the first part of the chart.")
          : "";
        summary.text(`${d.name}: ${format(d.value)} TWh (${d.pctLabel})${hint}`);
      })
      .on("mouseleave blur", () => {
        allLinks.classed("is-dimmed", false);
        summary.text(summaryText);
      })
      .on("click keydown", (event, d) => {
        if (!d.isDrillTrigger) return;
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onDrill();
      });

    allNodes.transition().duration(duration).ease(ease)
      .style("opacity", 1);

    allNodes.select("rect")
      .attr("class", d => `sankey-node sankey-${d.type}`)
      .transition().duration(duration).ease(ease)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.w)
      .attr("height", d => d.h);

    allNodes.select("text")
      .attr("class", d => (d.labelPos === "left" || d.labelPos === "right") ? "" : "sankey-mid-label")
      .text(d => labelCoords(d).mainText)
      .transition().duration(duration).ease(ease)
      .attr("x", d => labelCoords(d).x)
      .attr("y", d => labelCoords(d).y)
      .attr("text-anchor", d => labelCoords(d).anchor);

    allNodes.select("tspan.sankey-sub-label")
      .text(d => labelCoords(d).subText)
      .attr("x", d => labelCoords(d).x);

    const pillData = nodes.filter(n => n.pillText);
    const pillSel = pillsLayer.selectAll("g.sankey-svg-pill")
      .data(pillData, d => d.pillId);

    pillSel.exit()
      .transition().duration(duration * 0.6).ease(ease)
      .style("opacity", 0)
      .remove();

    const pillEnter = pillSel.enter()
      .append("g")
      .attr("class", "sankey-svg-pill")
      .attr("transform", d => {
        const { px, py } = pillCoords(d);
        return `translate(${px}, ${py})`;
      })
      .style("opacity", 0);

    pillEnter.append("rect")
      .attr("rx", 12);

    pillEnter.append("text")
      .attr("text-anchor", "middle");

    const allPills = pillSel.merge(pillEnter);

    allPills
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", d => d.pillText)
      .on("click keydown", event => {
        if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onDrill();
      });

    allPills.each(function (d) {
      const { pillW, pillH } = pillCoords(d);
      const g = d3.select(this);
      g.select("rect").attr("width", pillW).attr("height", pillH);
      g.select("text").attr("x", pillW / 2).attr("y", pillH / 2 + 4).text(d.pillText);
    });

    allPills.transition().duration(duration).ease(ease)
      .style("opacity", 1)
      .attr("transform", d => {
        const { px, py } = pillCoords(d);
        return `translate(${px}, ${py})`;
      });
  }

  draw();
}