const countryLimit = 10;
const rankingYear = 2025;
let generationRanks;

export async function regionalView(name, national, svg, legend, rowHeight, draw) {
  generationRanks ??= d3.csv("data/04_heatmap_grid_intensity.csv", d3.autoType)
    .then(rows => new Map(rows
      .filter(row => row.year === rankingYear && Number.isFinite(row.generation_twh))
      .map(row => [row.country, row.generation_twh])));
  const [regional, generation] = await Promise.all([
    d3.csv("data/detail/regional_" + name + ".csv", d3.autoType),
    generationRanks
  ]);
  const areas = [...new Set(regional.map(row => row.macroarea))];
  const label = legend.insert("label", ":first-child").text("View ");
  const select = label.append("select");
  select.append("option").attr("value","").text("All macroareas");
  const countriesByArea = d3.group(national, row => row.macroarea, row => row.country);
  for (const area of areas) {
    const count = countriesByArea.get(area)?.size ?? 0;
    const suffix = count > countryLimit ? ` · Top ${countryLimit} countries` : " · countries";
    select.append("option").attr("value", area)
      .text(name === "heatmap" && count === 1 ? area : area + suffix);
  }
  function update() {
    const area = select.property("value");
    const data = area ? topCountries(national, area, generation) : regional;
    const rows = data.map(row => ({...row, label:area ? row.country : row.macroarea}));
    const height = new Set(rows.map(row=>row.label)).size * rowHeight + 76;
    svg.selectAll("*").remove();
    svg.attr("viewBox", "0 0 800 " + height);
    draw(rows,height);
  }
  select.on("change", update);
  update();
}

function topCountries(rows, area, generation) {
  const countries = d3.groups(rows.filter(row => row.macroarea === area), row => row.country);
  if (countries.length <= countryLimit) return countries.flatMap(([, values]) => values);

  const score = country => generation.get(country) ?? -Infinity;
  countries.sort(([a], [b]) => d3.descending(score(a), score(b)) || a.localeCompare(b));
  return countries.slice(0, countryLimit).flatMap(([, values]) => values);
}
