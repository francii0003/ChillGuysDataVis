// Common figure layout. Each chart module owns its data mapping and marks.
export async function figure(root, name, filename, height, width = 800) {
  const url = "data/" + filename;
  const rows = await d3.csv(url, d3.autoType);
  if (rows[0] && Object.hasOwn(rows[0], "order")) rows.sort((a,b) => a.order - b.order);
  const frame = d3.select(root).select("#chart-" + name).classed("d3-figure", true);
  frame.selectAll("*").remove();
  const legend = frame.append("div").attr("class", "figure-legend");
  const scroll = frame.append("div").attr("class", "plot-scroll").attr("tabindex", 0)
    .attr("role","region").attr("aria-label","Scrollable chart");
  const svg = scroll.append("svg").attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role","img").attr("aria-labelledby", name + "-title");
  d3.select(root).select(".chart-note").append("a").attr("href",url)
    .text(" Download data (CSV).");
  return {rows, svg, legend};
}

export function key(legend, label, color) {
  const item = legend.append("span").attr("class","legend-item");
  item.append("i").style("background-color",color);
  item.append("span").text(label);
}

export function textAt(svg, x, y, value, anchor = "start") {
  return svg.append("text").attr("x",x).attr("y",y).attr("text-anchor",anchor).text(value);
}

export function bottomAxis(svg, scale, y, unit, format) {
  const axis = d3.axisBottom(scale).ticks(6).tickSizeOuter(0);
  if (format) axis.tickFormat(format);
  svg.append("g").attr("class","axis").attr("transform",`translate(0,${y})`).call(axis);
  textAt(svg, d3.mean(scale.range()), y + 42, unit, "middle");
}

// Keep the details visible while a mark is pinned, including when the plot scrolls.
export function inspectMarks(svg, legend, hint) {
  const detail = d3.select(legend.node().parentNode)
    .insert("p", ".plot-scroll")
    .attr("class", "figure-inspection")
    .attr("aria-live", "polite");
  svg.attr("role", "group");
  let render = () => {};

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") render();
  });

  return (marks, describe) => {
    const values = marks.data();
    let pinned = null;
    let preview = null;

    function update() {
      const active = preview ?? pinned;
      marks.classed("inspection-muted", (_, index) => active !== null && index !== active)
        .attr("aria-pressed", (_, index) => index === pinned);
      detail.text(active === null ? hint : describe(values[active]));
    }

    function toggle(index) {
      pinned = pinned === index ? null : index;
      preview = null;
      update();
    }

    function clearPreview() {
      preview = null;
      update();
    }

    const indices = new Map(marks.nodes().map((node, index) => [node, index]));
    marks.classed("inspection-mark", true)
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", describe)
      .on("pointerenter", function (event) {
        if (event.pointerType === "touch") return;
        preview = indices.get(this);
        update();
      })
      .on("pointerleave", clearPreview)
      .on("focus", function () {
        preview = indices.get(this);
        update();
      })
      .on("blur", clearPreview)
      .on("click", function () { toggle(indices.get(this)); })
      .on("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) toggle(indices.get(this));
      });

    render = () => {
      pinned = null;
      clearPreview();
    };
    update();
  };
}
