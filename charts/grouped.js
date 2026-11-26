export const section = `<section class="chart-section" id="grouped" aria-labelledby="grouped-title">
  <div class="container">
    <h2 id="grouped-title">Who owns AI computing capacity, and who uses it?</h2>
    <p class="chart-lede">For each company, the power of the data centers it owns is shown next to the power of the data centers where it is listed as a user. <br>Unlike the annual electricity totals (TWh) in Figures 1 and 2, <strong>megawatts (MW) measure instant electrical power capacity</strong>: how large each facility's grid draw is at full operation.</p>    <figure class="figure">
      <div class="chart-frame" id="chart-grouped">
        <p class="chart-placeholder">Loading chart…</p>
      </div>
      <figcaption class="figure-caption">
        <p class="figure-title"><strong>Figure 3.</strong> Operating power of AI data centers by owner and by user, in megawatts.</p>
        <details class="chart-data-details">
          <summary class="chart-data-summary">
            <span><strong>Data:</strong> Epoch AI</span>
            <span aria-hidden="true">·</span>
            <a href="data/03_grouped_bar_owner_vs_user.csv" download>Download CSV</a>
            <span aria-hidden="true">·</span>
            <a href="data/detail/03_site_roles.csv" download>Site roles CSV</a>
            <span aria-hidden="true">·</span>
            <span class="notes-toggle">Notes <span class="plus-icon" aria-hidden="true">+</span></span>
          </summary>
          <p class="chart-note">
            Epoch AI, Frontier Data Centers, operating sites only. <br>When a site has several users, its power is split equally among them. <br>Smaller companies are grouped under Other companies, and Google includes Google DeepMind. <br>The dataset is a selection of large sites, not a census.
          </p>
        </details>
      </figcaption>
    </figure>
    <div class="takeaway">
      <p class="takeaway-figure">70%</p>
      <p class="takeaway-text">of identified operating data center power is owned by just four US tech companies (<strong>Google, Meta, Amazon, and Microsoft</strong>) illustrating how tightly AI infrastructure is concentrated.</p>
    </div>
    <div class="chart-text">
      <p>Nine of the ten major companies listed are based in the United States, underscoring how heavily frontier AI infrastructure is concentrated there, with ByteDance (464 MW) standing out as the main Chinese operator. </p>
      <p>Comparing ownership and usage also reveals two distinct models: hyperscalers such as Google (3,179 MW), Meta (2,335 MW), Amazon (1,870 MW), and Microsoft (1,519 MW) <strong>both own and operate massive physical capacity</strong>. For context, <a href="https://www.energy.gov/ne/articles/infographic-how-much-power-does-nuclear-reactor-produce">the U.S. Department of Energy</a> notes that 1,000 MW (1 GW) is roughly the output of a large nuclear reactor, enough to power nearly a million homes.</p>
      <p>By contrast, frontier AI labs like OpenAI (1,558 MW as a user) and Anthropic (1,212 MW) <strong>own zero operating capacity here</strong>, relying instead on cloud giants and specialized infrastructure providers such as Oracle (896 MW) and CoreWeave (679 MW).</p>
      <p>Readers interested in exploring individual facilities in detail can jump to <a href="#packing">Figure 6</a>. Next, however, <a href="#heatmap">Figure 4</a> turns to a critical environmental question: how clean is the electricity powering the grids where these data centers are built?</p>
    </div>
  </div>
</section>`;

const ROLE_SLUG = {
  Owner: "owner",
  User: "user"
};

const COMPANY_COUNTRY = {
  Google: "us",
  Meta: "us",
  Amazon: "us",
  Microsoft: "us",
  SpaceXAI: "us",
  Oracle: "us",
  CoreWeave: "us",
  ByteDance: "cn",
  OpenAI: "us",
  Anthropic: "us"
};

function appendFlag(parent, country, x, y) {
  if (!country) return;
  const g = parent.append("g")
    .attr("class", `company-flag flag-${country}`)
    .attr("transform", `translate(${x},${y})`)
    .attr("aria-hidden", "true");

  if (country === "us") {
    g.append("rect").attr("width", 13).attr("height", 9).attr("rx", 1.2).attr("fill", "#FFFFFF");
    [0, 2, 4, 6, 8].forEach(sy => {
      g.append("rect").attr("x", 0).attr("y", sy).attr("width", 13).attr("height", 1).attr("fill", "#DE2910");
    });
    g.append("rect").attr("x", 0).attr("y", 0).attr("width", 6).attr("height", 5).attr("fill", "#1F3A8A");
    g.append("rect").attr("width", 13).attr("height", 9).attr("rx", 1.2)
      .attr("fill", "none").attr("stroke", "rgba(37, 40, 42, 0.35)").attr("stroke-width", 0.5);
  } else if (country === "cn") {
    g.append("rect").attr("width", 13).attr("height", 9).attr("rx", 1.2).attr("fill", "#DE2910");
    g.append("circle").attr("cx", 3.2).attr("cy", 3).attr("r", 1.3).attr("fill", "#FFCC00");
    g.append("circle").attr("cx", 5.5).attr("cy", 1.8).attr("r", 0.5).attr("fill", "#FFCC00");
    g.append("circle").attr("cx", 6.3).attr("cy", 3).attr("r", 0.5).attr("fill", "#FFCC00");
    g.append("circle").attr("cx", 5.5).attr("cy", 4.3).attr("r", 0.5).attr("fill", "#FFCC00");
    g.append("rect").attr("width", 13).attr("height", 9).attr("rx", 1.2)
      .attr("fill", "none").attr("stroke", "rgba(37, 40, 42, 0.35)").attr("stroke-width", 0.5);
  }
}

export async function render(sectionRoot) {
  const frame = sectionRoot.querySelector("#chart-grouped");
  const rows = await d3.csv("data/03_grouped_bar_owner_vs_user.csv", d3.autoType);

  const roles = ["Owner", "User"];
  const fmtMw = d3.format(",.0f");
  const fmtShare = d3.format(".1f");

  const companies = Array.from(
    d3.group(rows, row => row.company),
    ([company, values]) => ({
      company,
      country: COMPANY_COUNTRY[company] ?? null,
      byRole: Object.fromEntries(values.map(v => [v.role, v]))
    })
  ).sort((a, b) => {
    if (a.company === "Other companies") return 1;
    if (b.company === "Other companies") return -1;
    const ownerDiff = (b.byRole.Owner?.mw ?? 0) - (a.byRole.Owner?.mw ?? 0);
    if (ownerDiff !== 0) return ownerDiff;
    return (b.byRole.User?.mw ?? 0) - (a.byRole.User?.mw ?? 0);
  });

  const companyNames = new Set(companies.map(c => c.company));

  const margin = { top: 10, right: 56, bottom: 38, left: 134 };
  const plotW = 640 - margin.left - margin.right;
  const rowStep = 34;
  const plotH = companies.length * rowStep;
  const vbWidth = 640;
  const vbHeight = plotH + margin.top + margin.bottom;

  const maxMw = d3.max(rows, row => row.mw) || 1;
  const x = d3.scaleLinear()
    .domain([0, maxMw])
    .nice()
    .range([0, plotW]);

  const yCompany = d3.scaleBand()
    .domain(companies.map(c => c.company))
    .range([0, plotH])
    .paddingInner(0.24)
    .paddingOuter(0.08);

  const yRole = d3.scaleBand()
    .domain(roles)
    .range([0, yCompany.bandwidth()])
    .padding(0.18);

  const wrap = d3.create("div").attr("class", "grouped-wrap");

  const legend = wrap.append("div").attr("class", "grouped-legend");
  const roleButtons = legend.selectAll("button")
    .data(roles)
    .join("button")
    .attr("type", "button")
    .attr("class", role => `grouped-key grouped-key-${ROLE_SLUG[role]}`)
    .attr("aria-pressed", "false");

  roleButtons.append("span")
    .attr("class", "grouped-swatch")
    .attr("aria-hidden", "true");
  roleButtons.append("span").text(role => role);

  legend.append("span")
    .attr("class", "grouped-hint")
    .text("Hover for breakdown · Click a row or role to focus");

  const svg = wrap.append("svg")
    .attr("id", "grouped-cells")
    .attr("class", "grouped-grid")
    .attr("viewBox", `0 0 ${vbWidth} ${vbHeight}`)
    .attr("role", "img")
    .attr("aria-label", "Operating power of AI data centers in MW by company for Owner and User roles.");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const ticks = x.ticks(5);
  g.append("g")
    .attr("class", "grouped-gridlines")
    .selectAll("line")
    .data(ticks)
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", plotH);

  const xAxis = g.append("g")
    .attr("class", "grouped-axis")
    .attr("transform", `translate(0,${plotH})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(4));

  xAxis.append("text")
    .attr("class", "grouped-axis-title")
    .attr("x", plotW / 2)
    .attr("y", 29)
    .attr("text-anchor", "middle")
    .text("Operating power (MW)");

  const companyGroups = g.selectAll(".grouped-row")
    .data(companies)
    .join("g")
    .attr("class", d => `grouped-row grouped-row-${d.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-pressed", "false")
    .attr("transform", d => `translate(0,${yCompany(d.company)})`);

  companyGroups.append("rect")
    .attr("class", "grouped-hit")
    .attr("x", -margin.left)
    .attr("y", -2)
    .attr("width", vbWidth)
    .attr("height", yCompany.bandwidth() + 4);

  companyGroups.each(function (d) {
    const rowGroup = d3.select(this);
    const cy = yCompany.bandwidth() / 2;
    const hasFlag = Boolean(d.country);

    rowGroup.append("text")
      .attr("class", "grouped-label")
      .attr("x", hasFlag ? -26 : -9)
      .attr("y", cy)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .text(d.company);

    if (hasFlag) {
      appendFlag(rowGroup, d.country, -22, cy - 4.5);
    }
  });

  const bars = companyGroups.selectAll(".grouped-bar-group")
    .data(d => roles.map(role => ({
      company: d.company,
      role,
      data: d.byRole[role] ?? { mw: 0, n_sites: 0, share_of_operating_mw_pct: 0 }
    })))
    .join("g")
    .attr("class", d => `grouped-bar-group grouped-role-${ROLE_SLUG[d.role]}`);

  bars.append("rect")
    .attr("class", d => `grouped-rect grouped-fill-${ROLE_SLUG[d.role]}`)
    .attr("x", 0)
    .attr("y", d => yRole(d.role))
    .attr("height", yRole.bandwidth())
    .attr("width", d => Math.max(0, x(d.data.mw)))
    .attr("rx", 1.5);

  bars.append("text")
    .attr("class", "grouped-value")
    .attr("x", d => x(d.data.mw) + 5)
    .attr("y", d => yRole(d.role) + yRole.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text(d => d.data.mw > 0 ? fmtMw(d.data.mw) : "0");

  const tip = svg.append("g").attr("class", "grouped-tip").attr("aria-hidden", "true");
  const tipBox = tip.append("rect").attr("rx", 3);
  const tipText = tip.append("text");

  function showTip(event, compObj) {
    const owner = compObj.byRole.Owner;
    const user = compObj.byRole.User;
    const ownerMw = owner ? `${fmtMw(owner.mw)} MW (${owner.n_sites} sites)` : "0 MW";
    const userMw = user ? `${fmtMw(user.mw)} MW (${user.n_sites} sites)` : "0 MW";
    const countryLabel = compObj.country === "us" ? " · US" : compObj.country === "cn" ? " · China" : "";

    const lines = [
      `${compObj.company}${countryLabel}`,
      `Owner: ${ownerMw}`,
      `User:  ${userMw}`
    ];

    tipText.selectAll("tspan").remove();
    lines.forEach((line, i) => {
      tipText.append("tspan")
        .attr("class", i === 0 ? "grouped-tip-title" : null)
        .attr("x", 8)
        .attr("y", 14 + i * 12)
        .text(line);
    });

    const box = tipText.node().getBBox();
    const w = box.width + 16;
    const h = box.height + 10;
    tipBox.attr("width", w).attr("height", h);

    const [px, py] = d3.pointer(event, svg.node());
    let xPos = px + 10;
    let yPos = py - h - 8;
    if (xPos + w > vbWidth - 4) xPos = px - w - 10;
    if (xPos < 4) xPos = 4;
    if (yPos < 4) yPos = py + 12;

    tip.attr("transform", `translate(${xPos},${yPos})`).classed("is-on", true);
  }

  const hideTip = () => tip.classed("is-on", false);

  let selected = null;
  let hovered = null;

  function highlight() {
    const active = hovered ?? selected;
    const isCompanyActive = active !== null && companyNames.has(active);
    const isRoleActive = active !== null && roles.includes(active);

    companyGroups
      .classed("grouped-muted", d => isCompanyActive && d.company !== active)
      .classed("is-active", d => isCompanyActive && d.company === active)
      .attr("aria-pressed", d => d.company === selected);

    bars.classed("grouped-muted", d => isRoleActive && d.role !== active);

    roleButtons.attr("aria-pressed", role => role === selected);
  }

  companyGroups
    .on("pointerenter", (event, compObj) => {
      if (event.pointerType === "touch") return;
      hovered = compObj.company;
      highlight();
      showTip(event, compObj);
    })
    .on("pointermove", (event, compObj) => {
      if (event.pointerType !== "touch") showTip(event, compObj);
    })
    .on("pointerleave", () => {
      hovered = null;
      highlight();
      hideTip();
    })
    .on("click", (event, compObj) => {
      selected = selected === compObj.company ? null : compObj.company;
      highlight();
      if (selected) showTip(event, compObj);
      else if (!hovered) hideTip();
    })
    .on("keydown", (event, compObj) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selected = selected === compObj.company ? null : compObj.company;
        highlight();
      } else if (event.key === "Escape") {
        selected = hovered = null;
        highlight();
        hideTip();
      }
    });

  roleButtons.on("click", (_, role) => {
    selected = selected === role ? null : role;
    hovered = null;
    highlight();
  });

  frame.replaceChildren(wrap.node());
}