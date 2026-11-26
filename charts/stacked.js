import { figure, key, textAt, bottomAxis } from "./figure.js";
import { regionalView } from "./regional-view.js";

export const section = `<section class="chart-section" id="stacked" aria-labelledby="stacked-title">
  <div class="container">
    <h2 id="stacked-title">What powers the grids of the countries that host AI data centers?</h2>
    <p class="chart-lede">Share of electricity from <strong>fossil fuels, renewables and nuclear</strong> in 2025. Choose a region to explore its countries; larger lists show the 10 countries with the most electricity generation in 2025.</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-stacked">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 5.</strong> Electricity generation mix of host-country grids, 2025, in percent.</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Ember, 2025</span>
            <span aria-hidden="true">·</span>
            <a href="data/05_stacked_generation_mix.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <a href="data/detail/05_generation_sources.csv" download>Source breakdown (CSV)</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            Ember electricity generation data. Regional shares divide reported source generation by total host-country generation.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">57.4%</p>
      <p class="takeaway-text">of electricity across the 94 economies in the 2025 dataset still comes from fossil fuels (17,659 TWh): <strong>even as grids slowly shift toward cleaner energy, coal and gas remain the dominant backbone</strong> of global power generation.</p>
    </div>
    <div class="chart-text">
      <p><strong>Slow movement, heavy fossil inertia.</strong> As <a href="#heatmap">Figure 4</a> shows, carbon intensity has been edging down across many regions, yet more than half of all electricity in 2025 still came from fossil fuels—ahead of <strong>renewables (33.6%) and nuclear (9.0%)</strong>. Where grids remain locked into coal and gas, growing data center demand keeps high-carbon generation running longer.</p>
      <p><strong>Credit where it’s due, and pushback where it’s not.</strong> Grids like Norway (99.0% renewables) and France (68.3% nuclear and 26.6% renewables, leaving just 5.1% fossil) show what a low-carbon power system looks like in practice. At the other extreme, major producers such as Saudi Arabia (95.8% fossil), Iran (94.8%), Indonesia (84.2%), South Africa (82.2%), and India (73.4%) still rely overwhelmingly on fossil generation—underscoring how heavily host location shapes the climate footprint of AI infrastructure.</p>
    </div>
</section>`;

export async function render(root) {
  const { rows, svg, legend } = await figure(root, "stacked", "05_stacked_generation_mix.csv", 405);
  const detail = await d3.csv("data/detail/05_generation_sources.csv", d3.autoType);
  const countriesByArea = d3.group(rows, d => d.macroarea);

  const categoryColors = {
    Fossil: "#8C6239",
    Renewables: "#16A377",
    Nuclear: "#5B8DEF"
  };

  const sourceColors = {
    Coal: "#C97A4B",
    Gas: "#E09F3E",
    "Other fossil": "#B85D57",
    Solar: "#F4B400",
    Wind: "#2A9D8F",
    Hydro: "#1D70B8",
    Bioenergy: "#74A57F",
    "Other renewables": "#52B788",
    Nuclear: "#7B8CDE"
  };

  Object.entries(categoryColors).forEach(([label, color]) => key(legend, label, color));

  legend.append("span")
    .attr("class", "stacked-hint")
    .text("Click a name for mix details · Click a segment for sources · Esc to reset");

  svg.style("outline", "none");

  const chartFrame = d3.select(root).select("#chart-stacked");
  chartFrame.selectAll(".stacked-tip-side").remove();
  d3.select("body").selectAll(".stacked-tip-fixed").remove();

  const tipEl = chartFrame
    .append("aside")
    .attr("class", "stacked-tip-side")
    .attr("aria-live", "polite");

  const tipHeader = tipEl.append("div").attr("class", "stacked-tip-header");
  const tipList = tipEl.append("ul").attr("class", "stacked-tip-list");

  function setEmptyTip() {
    tipHeader
      .text("Selection details")
      .style("border-left-color", "var(--rule)");
    tipList.selectAll("li").remove();
    tipList.append("li")
      .attr("class", "stacked-tip-empty")
      .text("Click a country or region name for its full mix, or click a bar segment for its source breakdown.");
  }

  setEmptyTip();

  let selectedLabel = null;
  let selectedSegment = null;
  let hoveredLabel = null;
  let hoveredSegment = null;

  await regionalView("stacked", rows, svg, legend, 33, (viewRows, height) => {
    selectedLabel = null;
    selectedSegment = null;
    hoveredLabel = null;
    hoveredSegment = null;
    setEmptyTip();

    svg.selectAll("g.stacked-row, g.stacked-axis, rect.stacked-bar, g.stacked-tip").remove();

    const x = d3.scaleLinear([0, 100], [135, 780]);
    const groupedCountries = d3.groups(viewRows, row => row.label);
    const segments = [];

    groupedCountries.forEach(([country, values], index) => {
      const y = 12 + index * 33;

      const labelEl = textAt(svg, 126, y + 16, country, "end")
        .attr("class", "stacked-row-label")
        .attr("data-country", country)
        .attr("tabindex", 0)
        .attr("role", "button")
        .attr("aria-pressed", "false")
        .style("cursor", "pointer")
        .style("outline", "none");

      const reported = values.filter(row => Number.isFinite(row.share_pct));
      const total = d3.sum(reported, row => row.share_pct);
      let cumulative = 0;
      for (const row of reported.sort((a, b) => a.category_order - b.category_order)) {
        const left = total > 0 ? x(cumulative / total * 100) : x(0);
        cumulative += row.share_pct;
        const right = total > 0 ? x(cumulative / total * 100) : left;
        segments.push({ row, country, left, y, width: Math.max(0, right - left) });
      }

      labelEl
        .on("click", () => {
          selectedSegment = null;
          hoveredSegment = null;
          selectedLabel = selectedLabel === country ? null : country;
          syncState();
        })
        .on("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectedSegment = null;
            hoveredSegment = null;
            selectedLabel = selectedLabel === country ? null : country;
            syncState();
          } else if (event.key === "Escape") {
            resetSelection();
          }
        });
    });

    const rowLabels = svg.selectAll(".stacked-row-label");

    const marks = svg.selectAll("rect.stacked-bar")
      .data(segments)
      .join("rect")
      .attr("class", "stacked-bar")
      .attr("x", segment => segment.left)
      .attr("y", segment => segment.y)
      .attr("width", segment => segment.width)
      .attr("height", 22)
      .attr("fill", segment => categoryColors[segment.row.category] || "#666")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-pressed", "false")
      .style("cursor", "pointer")
      .style("outline", "none");

    const axisGroup = svg.append("g").attr("class", "stacked-axis");
    bottomAxis(axisGroup, x, height - 55, "Share of national electricity generation", value => value + "%");

    function getMembers(label) {
      const matching = viewRows.filter(r => r.label === label);
      const sample = matching[0];
      if (sample?.country) return new Set([sample.country]);
      if (countriesByArea.has(label)) {
        return new Set(countriesByArea.get(label).map(part => part.country));
      }
      return new Set([label]);
    }

    function getCategoryTwh(label, category) {
      const members = getMembers(label);
      const parts = detail.filter(part => members.has(part.country) && part.category === category);
      const reported = parts.filter(part => Number.isFinite(part.generation_twh));
      return reported.length ? d3.sum(reported, part => part.generation_twh) : null;
    }

    function renderSideTip(titleText, titleColor, items) {
      tipHeader
        .text(titleText)
        .style("border-left-color", titleColor || "var(--accent)");

      tipList.selectAll("li").remove();

      items.forEach(item => {
        const li = tipList.append("li");
        li.append("span")
          .attr("class", "stacked-tip-dot")
          .style("background", item.color || "#D9D9D6")
          .attr("aria-hidden", "true");
        li.append("span")
          .attr("class", "stacked-tip-item-text")
          .text(item.text);
      });
    }

    function updateTip() {
      const activeSeg = hoveredSegment || selectedSegment;
      const activeLabel = hoveredLabel || selectedLabel;

      if (activeSeg) {
        const label = activeSeg.country;
        const category = activeSeg.row.category;
        const members = getMembers(label);
        const components = detail.filter(part => members.has(part.country) && part.category === category);
        const groupedSources = d3.groups(components, part => part.source);

        const sourceTotals = groupedSources.map(([source, parts]) => {
          const reported = parts.filter(part => Number.isFinite(part.generation_twh));
          return {
            source,
            twh: reported.length ? d3.sum(reported, part => part.generation_twh) : null
          };
        });

        const validTwhSum = d3.sum(sourceTotals.filter(s => Number.isFinite(s.twh)), s => s.twh);
        const catTwh = Number.isFinite(activeSeg.row.generation_twh)
          ? activeSeg.row.generation_twh
          : (validTwhSum > 0 ? validTwhSum : null);

        const totalTwhStr = Number.isFinite(catTwh) ? ` · ${catTwh.toFixed(1)} TWh` : "";
        const title = `${label} · ${category}: ${activeSeg.row.share_pct.toFixed(1)}%${totalTwhStr}`;

        const items = sourceTotals.length
          ? sourceTotals.map(({ source, twh }) => {
              const color = sourceColors[source] || categoryColors[category] || "#D9D9D6";
              if (!Number.isFinite(twh)) {
                return { text: `${source}: no entry`, color };
              }
              const shareWithinCat = validTwhSum > 0
                ? ` (${((twh / validTwhSum) * 100).toFixed(1)}% of ${category.toLowerCase()})`
                : "";
              const shareOfGrid = Number.isFinite(activeSeg.row.share_pct) && validTwhSum > 0
                ? ` · ${(((twh / validTwhSum) * activeSeg.row.share_pct)).toFixed(1)}% of grid`
                : "";
              return {
                text: `${source}: ${twh.toFixed(1)} TWh${shareWithinCat}${shareOfGrid}`,
                color
              };
            })
          : [{ text: "No source breakdown available", color: "#B4B9BE" }];

        renderSideTip(title, categoryColors[category], items);
      } else if (activeLabel) {
        const items = viewRows
          .filter(r => r.label === activeLabel && Number.isFinite(r.share_pct))
          .sort((a, b) => a.category_order - b.category_order)
          .map(item => {
            const twh = getCategoryTwh(activeLabel, item.category);
            const twhPart = Number.isFinite(twh) ? ` (${twh.toFixed(1)} TWh)` : "";
            return {
              text: `${item.category}: ${item.share_pct.toFixed(1)}%${twhPart}`,
              color: categoryColors[item.category] || "#D9D9D6"
            };
          });

        renderSideTip(`${activeLabel} — generation mix`, "var(--accent)", items);
      } else {
        setEmptyTip();
      }
    }

    function syncState() {
      const activeSeg = hoveredSegment || selectedSegment;
      const activeLabel = hoveredLabel || selectedLabel;
      const highlightedCountry = activeLabel || (activeSeg ? activeSeg.country : null);

      rowLabels.each(function () {
        const el = d3.select(this);
        const c = el.attr("data-country");
        const isExact = activeLabel !== null && c === activeLabel;
        const isFromSeg = activeLabel === null && activeSeg !== null && c === activeSeg.country;
        const isDimmed = highlightedCountry !== null && c !== highlightedCountry;

        el.classed("is-selected", isExact || isFromSeg)
          .classed("is-dimmed", isDimmed)
          .attr("aria-pressed", selectedLabel !== null && c === selectedLabel);
      });

      marks
        .classed("is-selected", d => d === activeSeg)
        .classed("is-dimmed", d => {
          if (activeSeg !== null) return d !== activeSeg;
          if (activeLabel !== null) return d.country !== activeLabel;
          return false;
        })
        .attr("aria-pressed", d => d === selectedSegment);

      updateTip();
    }

    function resetSelection() {
      selectedLabel = null;
      selectedSegment = null;
      hoveredLabel = null;
      hoveredSegment = null;
      syncState();
    }

    marks
      .on("pointerenter", (event, seg) => {
        if (event.pointerType === "touch") return;
        hoveredSegment = seg;
        hoveredLabel = null;
        syncState();
      })
      .on("pointerleave", () => {
        hoveredSegment = null;
        syncState();
      })
      .on("click", (event, seg) => {
        selectedLabel = null;
        selectedSegment = selectedSegment === seg ? null : seg;
        syncState();
      })
      .on("keydown", (event, seg) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedLabel = null;
          selectedSegment = selectedSegment === seg ? null : seg;
          syncState();
        } else if (event.key === "Escape") {
          resetSelection();
        }
      });

    svg.on("keydown", event => {
      if (event.key === "Escape") {
        resetSelection();
      }
    });
  });
}