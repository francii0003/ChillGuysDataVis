import { figure } from "./figure.js";
import { regionalView } from "./regional-view.js";

export const section = `<section class="chart-section" id="heatmap" aria-labelledby="heatmap-title">
  <div class="container">
    <h2 id="heatmap-title">How clean is the electricity where AI data centers are built?</h2>
    <p class="chart-lede"><strong>Grid carbon intensity (gCO₂e/kWh)</strong> by macroarea and year: grams of greenhouse gases (CO₂ equivalent) emitted per kilowatt-hour of electricity generated. <strong>The closer to 0, the cleaner the grid.</strong> <br>Choose a region to see its countries; larger lists show the 10 countries with the most electricity generation in 2025.</p>
    <figure class="figure">
      <div class="chart-frame" id="chart-heatmap">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 4.</strong> Carbon intensity of electricity generation by area and year, 2015-2025.</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Ember, 2015-2025</span>
            <span aria-hidden="true">·</span>
            <a href="data/04_heatmap_grid_intensity.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            Ember provides country-by-year electricity records broken down by source and category (including solar, wind, hydro, bioenergy, nuclear, coal, gas, other fossil, demand, and aggregates such as renewables), from which carbon intensity (gCO₂e/kWh) is derived. Regional values are weighted by each country’s electricity generation in the year shown. </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">-14%</p>
      <p class="takeaway-text">weighted average drop in grid carbon intensity across the dataset from 2015 to 2025: <strong>from 534 to 459 gCO₂e/kWh</strong> (weighted by electricity generation; note that 2025 covers 94 major economies rather than all 209 in 2015). Each kilowatt-hour generated is 14% cleaner than a decade ago even as total electricity demand rises.</p>
    </div>
    <div class="chart-text">
      <p><strong>A real step forward, but a long road to zero.</strong> The chart points in a clear direction: almost everywhere the curve trends downward, though at very different speeds. <br>Low-carbon leaders like Norway (28 g), Sweden (35 g), and France (41 g) already sit near zero thanks to hydro, wind, and nuclear. <br>Major economies in transition like <strong>China (down from 670 to 528 g)</strong> and the United States (from 505 to 384 g) started high and are steadily cutting the share of fossil fuels. <br>Meanwhile, fossil-heavy grids, such as Uzbekistan (1,000 g), Kazakhstan (813 g), and South Africa (699 g), remain far higher.</p>
      <p><strong>Progress is real, but the carbon cost per unit of electricity remains substantial.</strong> Until grids move much closer to zero, every kilowatt-hour drawn by data centers, and by the AI workloads running inside them, still carries significant emissions, especially in regions that rely heavily on coal or gas.</p>
      <p><strong>What’s next? From how dirty to how it’s made.</strong> Carbon intensity is falling across most regions, but what is driving the decline? <a href="#stacked">The next chart</a> opens the hood on the global power mix to see how fast solar and wind are gaining ground against coal and gas.</p>
    </div>
  </div>
</section>`;

export async function render(root) {
  const { rows, svg, legend } = await figure(root, "heatmap", "04_heatmap_grid_intensity.csv", 380);
  const thresholds = [100, 200, 300, 400, 500, 600, 700];
  const bin = d3.scaleThreshold(thresholds, d3.range(8));

  const cb = legend.append("span").attr("class", "heatmap-legend-bar");
  cb.append("strong").text("gCO₂e/kWh");
  cb.append("span").attr("class", "heatmap-legend-bound").text("<100");
  cb.append("span").attr("class", "heatmap-legend-grad").attr("aria-hidden", "true");
  cb.append("span").attr("class", "heatmap-legend-bound").text("700+");

  legend.append("span")
    .attr("class", "heatmap-hint")
    .text("Hover a cell for intensity · Click a cell or area name to pin · Esc to reset");

  let selectedDatum = null;
  let hoveredDatum = null;
  let selectedCountry = null;

  await regionalView("heatmap", rows, svg, legend, 34, (viewRows, height) => {
    selectedDatum = null;
    hoveredDatum = null;
    selectedCountry = null;

    // Remove previous heatmap elements when switching macroareas
    svg.selectAll(".heatmap-year-label, .heatmap-row-label, rect.heatmap-cell, .heatmap-tip").remove();

    const countries = [...new Set(viewRows.map(row => row.label))];
    const years = [...new Set(viewRows.map(row => row.year))].sort(d3.ascending);
    const x = d3.scaleBand(years, [145, 790]).padding(0.035);
    const y = d3.scaleBand(countries, [32, height - 10]).padding(0.05);

    svg.selectAll(".heatmap-year-label")
      .data(years)
      .join("text")
      .attr("class", "heatmap-year-label")
      .attr("x", year => x(year) + x.bandwidth() / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .text(year => year);

    const rowLabels = svg.selectAll(".heatmap-row-label")
      .data(countries)
      .join("text")
      .attr("class", "heatmap-row-label")
      .attr("x", 136)
      .attr("y", country => y(country) + y.bandwidth() / 2 + 5)
      .attr("text-anchor", "end")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-pressed", "false")
      .text(country => country);

    const cells = svg.selectAll("rect.heatmap-cell")
      .data(viewRows)
      .join("rect")
      .attr("class", row => "heatmap-cell q" + bin(row.intensity_gco2_kwh))
      .attr("x", row => x(row.year))
      .attr("y", row => y(row.label))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-pressed", "false")
      .attr("aria-label", formatCellLabel);

    const tip = svg.append("g").attr("class", "heatmap-tip").attr("aria-hidden", "true");
    const tipBox = tip.append("rect").attr("rx", 3);
    const tipText = tip.append("text");

    function formatCellLabel(row) {
      const base = `${row.label} · ${row.year}: ${row.intensity_gco2_kwh.toFixed(1)} gCO₂e/kWh`;
      return Number.isFinite(row.mw_share_pct)
        ? `${base} · ${row.mw_share_pct.toFixed(2)}%`
        : base;
    }

    function formatRowDeltaLabel(country) {
      const series = viewRows
        .filter(r => r.label === country && Number.isFinite(r.intensity_gco2_kwh))
        .sort((a, b) => a.year - b.year);

      if (!series.length) return country;
      const first = series[0];
      const last = series[series.length - 1];
      const diff = last.intensity_gco2_kwh - first.intensity_gco2_kwh;
      const pct = first.intensity_gco2_kwh !== 0
        ? (diff / first.intensity_gco2_kwh) * 100
        : 0;
      const sign = diff > 0 ? "+" : "";
      return `${country} (${first.year}–${last.year}): ${first.intensity_gco2_kwh.toFixed(1)} → ${last.intensity_gco2_kwh.toFixed(1)} gCO₂e/kWh (${sign}${diff.toFixed(1)} / ${sign}${pct.toFixed(1)}%)`;
    }

    function renderTipBox(textStr, anchorX, anchorY, fallbackBelowY) {
      tipText.text(textStr);
      const box = tipText.node().getBBox();
      const padX = 10;
      const w = box.width + padX * 2;
      const h = 22;

      tipBox.attr("x", 0).attr("y", 0).attr("width", w).attr("height", h);
      tipText.attr("x", padX).attr("y", h / 2 + 3.5);

      const svgNode = svg.node();
      const vb = svgNode.viewBox?.baseVal;
      const maxW = vb && vb.width ? vb.width : (svgNode.clientWidth || 820);

      let tx = anchorX;
      let ty = anchorY;
      if (tx + w > maxW - 4) tx = maxW - w - 4;
      if (tx < 4) tx = 4;
      if (ty < 4) ty = fallbackBelowY;

      tip.attr("transform", `translate(${tx},${ty})`).classed("is-on", true);
    }

    function placeTipAtCell(row, pointerEvent) {
      if (!row) {
        tip.classed("is-on", false);
        return;
      }
      const label = formatCellLabel(row);
      const svgNode = svg.node();
      let tx;
      let ty;
      if (pointerEvent) {
        const [px, py] = d3.pointer(pointerEvent, svgNode);
        tx = px + 10;
        ty = py - 30;
      } else {
        tx = x(row.year) + x.bandwidth() / 2 - 80;
        ty = y(row.label) - 28;
      }
      renderTipBox(label, tx, ty, y(row.label) + y.bandwidth() + 6);
    }

    function placeTipAtRow(country) {
      const label = formatRowDeltaLabel(country);
      const tx = 145;
      const ty = y(country) - 28;
      renderTipBox(label, tx, ty, y(country) + y.bandwidth() + 6);
    }

    function syncState(pointerEvent = null) {
      const hasCellFocus = hoveredDatum !== null || selectedDatum !== null;

      cells
        .classed("is-dimmed", d => {
          if (hoveredDatum !== null) return d !== hoveredDatum;
          if (selectedDatum !== null) return d !== selectedDatum;
          if (selectedCountry !== null) return d.label !== selectedCountry;
          return false;
        })
        .classed("is-selected", d => d === selectedDatum)
        .classed("is-row-selected", d => !hasCellFocus && selectedCountry !== null && d.label === selectedCountry)
        .attr("aria-pressed", d => d === selectedDatum);

      rowLabels
        .classed("is-selected", c => c === selectedCountry)
        .classed("is-dimmed", c => selectedCountry !== null && c !== selectedCountry)
        .attr("aria-pressed", c => c === selectedCountry);

      if (hoveredDatum) {
        placeTipAtCell(hoveredDatum, pointerEvent);
      } else if (selectedDatum) {
        placeTipAtCell(selectedDatum, null);
      } else if (selectedCountry) {
        placeTipAtRow(selectedCountry);
      } else {
        tip.classed("is-on", false);
      }
    }

    rowLabels
      .on("click", (event, country) => {
        selectedDatum = null;
        hoveredDatum = null;
        selectedCountry = selectedCountry === country ? null : country;
        syncState(null);
      })
      .on("keydown", (event, country) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedDatum = null;
          hoveredDatum = null;
          selectedCountry = selectedCountry === country ? null : country;
          syncState(null);
        } else if (event.key === "Escape") {
          selectedCountry = null;
          selectedDatum = null;
          hoveredDatum = null;
          syncState(null);
        }
      });

    cells
      .on("pointerenter", (event, row) => {
        if (event.pointerType === "touch") return;
        hoveredDatum = row;
        syncState(event);
      })
      .on("pointermove", (event, row) => {
        if (event.pointerType !== "touch") {
          hoveredDatum = row;
          syncState(event);
        }
      })
      .on("pointerleave", () => {
        hoveredDatum = null;
        syncState(null);
      })
      .on("click", (event, row) => {
        selectedCountry = null;
        selectedDatum = selectedDatum === row ? null : row;
        syncState(event);
      })
      .on("keydown", (event, row) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectedCountry = null;
          selectedDatum = selectedDatum === row ? null : row;
          syncState(null);
        } else if (event.key === "Escape") {
          selectedCountry = null;
          selectedDatum = null;
          hoveredDatum = null;
          syncState(null);
        }
      });

    svg.on("keydown", event => {
      if (event.key === "Escape") {
        selectedCountry = null;
        selectedDatum = null;
        hoveredDatum = null;
        syncState(null);
      }
    });
  });
}