// Minimal runtime for the explorer: loads the data files, runs the derived
// calculations (dash.calc) and draws each [data-draw] element (dash.draw).
// When the page is built as a single file, the data is inlined as window.RMG_DATA.
window.dash = (() => {
  const FILES = {
    site_daily: { file: 'data/Site_Daily.csv', title: 'Site daily totals', description: 'Daily site kWh (sum of meters and site-level series), meters reporting, payments and data flags, Aug 2020 to Jan 2025.' },
    site_monthly: { file: 'data/Site_Monthly.csv', title: 'Site monthly totals', description: 'Site_Daily aggregated by month, as published in the dataset.' },
    payments: { file: 'data/Payments.csv', title: 'Payment records', description: 'Every PAY, UCU and REV record with pseudonymous agent and customer codes.' },
    tariffs: { file: 'data/Tariffs.csv', title: 'Stated tariffs', description: 'Energy tariffs reported by the site operator, with approximate dates.' },
    capex: { file: 'data/CAPEX.csv', title: 'Build cost (CAPEX)', description: 'Actual build cost by category from the operator\'s cost breakdown, plus the 2019 pre-construction estimate.' },
    opex: { file: 'data/OPEX.csv', title: 'Operating cost lines (OPEX)', description: 'Company-account maintenance and materials lines (2022–24), one 2023 operating figure and two one-off 2022 repair costs.' },
    meter_links: { file: 'data/Meter_Customer_Link.csv', title: 'Customer-meter links', description: 'Each meter linked to a customer at the export date, and whether it has any daily readings.' },
    customers: { file: 'data/Customers.csv', title: 'Customer accounts', description: 'Customer file snapshot: class, year created and number of linked meters.' },
    meter_monthly: { file: 'data/meter_monthly.json', json: true, title: 'Meter readings by month', description: 'Meter_Daily aggregated to one row per meter per month (built by scripts/build_meter_monthly.py).' },
    fx: { file: 'data/fx_rates.csv', title: 'Approximate NGN/USD rates (not part of the dataset)', description: 'Rounded annual average official naira-dollar rates, used to convert payments and costs to USD. Replace with official rates if you have them.' },
  };
  const calcs = {};
  const draws = {};
  const state = {};
  const blank = (rows) => rows.map((r) => { for (const k of Object.keys(r)) if (r[k] === '') r[k] = null; return r; });

  function parse(id, text) {
    if (FILES[id].json) { const j = JSON.parse(text); return Array.isArray(j) ? j : j.rows; }
    return blank(d3.csvParse(text));
  }

  async function load(id) {
    try {
      const inline = window.RMG_DATA && window.RMG_DATA[id];
      const text = inline !== undefined ? inline : await (await fetch(FILES[id].file)).text();
      state[id] = { status: 'ok', data: parse(id, text) };
    } catch (e) {
      console.error('Could not load', id, e);
      state[id] = { status: 'error', data: [], message: String(e) };
    }
  }

  function data(id) {
    if (state[id]) return state[id];
    const c = calcs[id];
    if (!c) return FILES[id] ? { status: 'loading', data: [] } : { status: 'missing', data: [] };
    const ins = c.inputs.map(data);
    if (ins.some((x) => x.status === 'error')) return { status: 'error', data: null };
    if (ins.some((x) => x.status !== 'ok')) return { status: 'loading', data: null };
    try {
      state[id] = { status: 'ok', data: c.fn(...ins.map((x) => x.data)) };
    } catch (e) {
      console.error('Calculation failed:', id, e);
      state[id] = { status: 'error', data: null, message: String(e) };
    }
    return state[id];
  }

  function runDraw(name) {
    for (const el of document.querySelectorAll(`[data-draw="${name}"]`)) {
      try { draws[name](el); } catch (e) { console.error('Drawing failed:', name, e); }
    }
  }
  function draw(name, fn) {
    if (fn) draws[name] = fn;
    else if (draws[name]) runDraw(name);
  }
  const drawAll = () => { for (const n of Object.keys(draws)) runDraw(n); };

  function renderMethod() {
    const box = document.getElementById('method-body');
    if (!box) return;
    const h = (tag, text, cls) => { const e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; };
    const files = h('ul');
    for (const [id, f] of Object.entries(FILES)) {
      const li = h('li');
      const a = h('a', f.title); a.href = f.file;
      li.append(a, ` (${id}): ${f.description}`);
      files.append(li);
    }
    const calcList = h('div');
    for (const [id, c] of Object.entries(calcs)) {
      const d = h('details');
      d.append(h('summary', `${c.title} (${id})`));
      d.append(h('p', `${c.description} Inputs: ${c.inputs.join(', ')}.`, 'rmg-muted'));
      d.append(h('pre', c.fn.toString(), 'rmg-code'));
      calcList.append(d);
    }
    box.replaceChildren(h('h3', 'Data files'), files, h('h3', 'Calculations'), h('p', 'Every derived figure on the page comes from one of these functions, run in your browser on the files above.', 'rmg-muted'), calcList);
  }

  // A visible notice at the top of the page when data files fail to load.
  function showLoadError(failed) {
    const box = document.createElement('div');
    box.className = 'rmg-loaderr';
    box.setAttribute('role', 'alert');
    const names = failed.map((id) => FILES[id].file).join(', ');
    box.textContent = location.protocol === 'file:'
      ? `The data didn't load (${names}). This copy was opened from disk without data/data.js next to it. Keep the data folder beside index.html, or open dist/rmg01-explorer.html, which has the data built in.`
      : `The data didn't load (${names}). Reload the page; if it keeps happening, check that the data folder was published with the site.`;
    const root = document.querySelector('.rmg');
    if (root) root.prepend(box);
  }

  async function start() {
    renderMethod();
    drawAll();
    await Promise.all(Object.keys(FILES).map(load));
    const failed = Object.keys(FILES).filter((id) => state[id].status === 'error');
    if (failed.length) showLoadError(failed);
    drawAll();
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(drawAll, 150); });
  }

  return { calc: (id, o) => { calcs[id] = o; }, data, draw, start, colors: ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'] };
})();
