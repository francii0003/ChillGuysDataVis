export async function regionalView(name, national, svg, legend, rowHeight, draw) {
  const regional = await d3.csv("data/detail/regional_" + name + ".csv", d3.autoType);
  const areas = [...new Set(regional.map(row => row.macroarea))];
  const label = legend.insert("label", ":first-child").text("View ");
  const select = label.append("select");
  select.append("option").attr("value","").text("All macroareas");
  for (const area of areas) select.append("option").attr("value",area).text(area + " · countries");
  function update() {
    const area = select.property("value");
    const data = area ? national.filter(row => row.macroarea === area) : regional;
    const rows = data.map(row => ({...row, label:area ? row.country : row.macroarea}));
    const height = new Set(rows.map(row=>row.label)).size * rowHeight + 76;
    svg.selectAll("*").remove();
    svg.attr("viewBox", "0 0 800 " + height);
    draw(rows,height);
  }
  select.on("change", update);
  update();
}
