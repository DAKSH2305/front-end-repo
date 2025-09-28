

const API_URL = 'https://68d424b8214be68f8c6887f1.mockapi.io/api/eureka/tech/task/sales';


function parseDateFlexible(d) {
  if (typeof d === 'number') return new Date(d * 1000);
  const ts = Date.parse(d);
  return Number.isNaN(ts) ? new Date(NaN) : new Date(ts);
} 

function ymKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
} 

function formatCurrency(n) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatNumber(n) {
  return n.toLocaleString(undefined);
}

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
} 

function download(filename, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
} 

async function fetchSales() {
  const res = await fetch(API_URL);
  const arr = await res.json();
  return arr
    .map(r => {
      const region = r.region ?? r.reigon ?? 'Unknown';
      const sale_id = r.sale_id ?? r.id ?? '';
      const date = parseDateFlexible(r.date);
      const product = r.product ?? 'Unknown';
      const quantity = Number(r.quantity ?? 0);
      const unit_price = Number(r.unit_price ?? 0);
      const total_price = Number(r.total_price ?? quantity * unit_price);
      return { sale_id, date, region, product, quantity, unit_price, total_price };
    })
    .filter(r => !Number.isNaN(r.date.getTime()));
}
-
function kpis(rows) {
  const revenue = rows.reduce((s, r) => s + r.total_price, 0);
  const orders = rows.length;
  const aov = orders ? revenue / orders : 0;
  return { revenue, orders, aov };
}

function monthlySeries(rows) {
  const map = new Map();
  for (const r of rows) map.set(ymKey(r.date), (map.get(ymKey(r.date)) ?? 0) + r.total_price);
  const labels = Array.from(map.keys()).sort();
  return { labels, values: labels.map(l => map.get(l)) };
} // [web:56]

function regionSplit(rows) {
  const map = new Map();
  for (const r of rows) map.set(r.region, (map.get(r.region) ?? 0) + r.total_price);
  const labels = Array.from(map.keys());
  return { labels, values: labels.map(l => map.get(l)) };
}

function topProducts(rows, by = 'revenue', n = 5) {
  const map = new Map();
  for (const r of rows) {
    const prev = map.get(r.product) ?? { qty: 0, rev: 0 };
    prev.qty += r.quantity;
    prev.rev += r.total_price;
    map.set(r.product, prev);
  }
  let list = Array.from(map, ([product, v]) => ({ product, quantity: v.qty, revenue: v.rev }));
  list.sort((a, b) => by === 'quantity' ? b.quantity - a.quantity : b.revenue - a.revenue);
  return list.slice(0, n);
}


let lineChart, doughnutChart;

function ensureCanvas(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return null;
  if (!container.querySelector('canvas')) {
    container.innerHTML = '';
    const c = document.createElement('canvas');
    container.appendChild(c);
  }
  return container.querySelector('canvas');
}

function renderLine(labels, values) {
  const canvas = ensureCanvas('.panel.chart.line .chart-area');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (lineChart) {
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = values;
    lineChart.update();
  } else {
    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          borderColor: '#7c5cff',
          backgroundColor: 'rgba(124,92,255,0.2)',
          tension: 0.3,
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => formatNumber(v) } } }
      }
    });
  }
} 

function renderRegion(labels, values) {
  const canvas = ensureCanvas('.panel.split .panel.half .chart-area');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (doughnutChart) {
    doughnutChart.data.labels = labels;
    doughnutChart.data.datasets[0].data = values;
    doughnutChart.update();
  } else {
    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Revenue by Region',
          data: values,
          backgroundColor: ['#7c5cff', '#2ed3b7', '#ffb020', '#ff6b6b', '#61dafb', '#a18cd1']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '55%'
      }
    });
  }
} 

function renderKPIs(metrics) {
  const kpiEls = document.querySelectorAll('.kpi .metric');
  if (kpiEls[0]) kpiEls[0].textContent = formatCurrency(metrics.revenue);
  if (kpiEls[1]) kpiEls[1].textContent = formatNumber(metrics.orders);
  if (kpiEls[2]) kpiEls[2].textContent = formatCurrency(metrics.aov);
}

function renderTop(list, by = 'revenue') {
  const container = document.querySelector('.panel.split .panel.half:nth-of-type(2) ol.top-list');
  if (!container) return;
  container.innerHTML = '';
  const max = Math.max(...list.map(i => by === 'quantity' ? i.quantity : i.revenue), 1);
  list.forEach(i => {
    const val = by === 'quantity' ? i.quantity : i.revenue;
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item">
        <span class="name">${i.product}</span>
        <span class="value">${by === 'quantity' ? formatNumber(val) : formatCurrency(val)}</span>
      </div>
      <div class="bar"><span style="width:${Math.round((val / max) * 100)}%"></span></div>
    `;
    container.appendChild(li);
  });
}

function renderTable(rows, limit = 50) {
  const tbody = document.querySelector('.panel.table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.slice(0, limit).forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.date.toISOString().slice(0,10)}</td>
      <td>${r.sale_id}</td>
      <td>${r.region}</td>
      <td>${r.product}</td>
      <td>${r.quantity}</td>
      <td>${formatCurrency(r.total_price)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function applyFilters(allRows) {
  const region = document.getElementById('region')?.value || 'all';
  const product = document.getElementById('product')?.value || 'all';
  const from = document.getElementById('date-from')?.value ? new Date(document.getElementById('date-from').value) : null;
  const to = document.getElementById('date-to')?.value ? new Date(document.getElementById('date-to').value) : null;

  return allRows.filter(r => {
    if (region !== 'all' && r.region !== region) return false;
    if (product !== 'all' && r.product !== product) return false;
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });
}


function exportCSV(rows) {
  const out = rows.map(r => ({
    sale_id: r.sale_id,
    date: r.date.toISOString(),
    region: r.region,
    product: r.product,
    quantity: r.quantity,
    unit_price: r.unit_price,
    total_price: r.total_price
  }));
  download('sales_filtered.csv', toCSV(out), 'text/csv');
} 

function exportXLSX(rows) {
  const out = rows.map(r => ({
    sale_id: r.sale_id,
    date: r.date.toISOString(),
    region: r.region,
    product: r.product,
    quantity: r.quantity,
    unit_price: r.unit_price,
    total_price: r.total_price
  }));
  download('sales_filtered.xlsx', toCSV(out), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}


document.addEventListener('DOMContentLoaded', async () => {
  const allRows = await fetchSales();

  let filtered = applyFilters(allRows);

 
  renderKPIs(kpis(filtered));
  const m = monthlySeries(filtered);
  renderLine(m.labels, m.values);
  const rs = regionSplit(filtered);
  renderRegion(rs.labels, rs.values);
  renderTop(topProducts(filtered, 'revenue', 5), 'revenue');
  renderTable(filtered);

  document.querySelector('.filters .btn.primary')?.addEventListener('click', () => {
    filtered = applyFilters(allRows);
    renderKPIs(kpis(filtered));
    const m2 = monthlySeries(filtered);
    renderLine(m2.labels, m2.values);
    const rs2 = regionSplit(filtered);
    renderRegion(rs2.labels, rs2.values);
    const rankBySel = document.querySelector('.panel.half:nth-of-type(2) .panel-actions select');
    const by = rankBySel && rankBySel.value.toLowerCase().includes('quantity') ? 'quantity' : 'revenue';
    renderTop(topProducts(filtered, by, 5), by);
    renderTable(filtered);
  }); // [web:74]


  document.querySelector('.filters .btn.ghost')?.addEventListener('click', () => {
    const r = document.getElementById('region'); if (r) r.value = 'all';
    const p = document.getElementById('product'); if (p) p.value = 'all';
    const f = document.getElementById('date-from'); if (f) f.value = '';
    const t = document.getElementById('date-to'); if (t) t.value = '';
    filtered = allRows.slice();
    renderKPIs(kpis(filtered));
    const m2 = monthlySeries(filtered);
    renderLine(m2.labels, m2.values);
    const rs2 = regionSplit(filtered);
    renderRegion(rs2.labels, rs2.values);
    const rankBySel = document.querySelector('.panel.half:nth-of-type(2) .panel-actions select');
    const by = rankBySel && rankBySel.value.toLowerCase().includes('quantity') ? 'quantity' : 'revenue';
    renderTop(topProducts(filtered, by, 5), by);
    renderTable(filtered);
  }); 

  document.querySelector('.panel.half:nth-of-type(2) .panel-actions select')
    ?.addEventListener('change', (e) => {
      const by = e.target.value.toLowerCase().includes('quantity') ? 'quantity' : 'revenue';
      renderTop(topProducts(filtered, by, 5), by);
    }); 

  
  const exportBtns = document.querySelectorAll('.filters .export .btn');
  exportBtns.forEach(btn => {
    const txt = btn.textContent?.toLowerCase() || '';
    if (txt.includes('csv')) btn.addEventListener('click', () => exportCSV(filtered));
    if (txt.includes('xlsx')) btn.addEventListener('click', () => exportXLSX(filtered));
  });
});

