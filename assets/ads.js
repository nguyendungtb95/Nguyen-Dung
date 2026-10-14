'use strict';
/* =========================================================
   Chi phí quảng cáo theo ngày (Facebook Ads, TikTok Ads,
   Shopee Ads từng shop…). Dữ liệu: state.adAccounts,
   state.adSpend[YYYY-MM-DD][mã tài khoản] = số tiền.
   Nhập tay trên bảng theo ngày hoặc nhập file báo cáo
   (.csv / .xlsx) xuất từ trình quản lý quảng cáo.
   ========================================================= */

const AD_COLORS = { Facebook: '#3b6fd8', Instagram: '#c13584', 'TikTok Shop': '#14b8a6', Shopee: '#ee4d2d', Website: '#8b5cf6' };
const AD_EXTRA = ['#f59e0b', '#10b981', '#6366f1', '#ef4444', '#0ea5e9'];
ui.adsPeriod = ui.adsPeriod || '30d';

function ensureAdAccounts() {
  if (state.adAccounts.length) return;
  const shops = [...new Set(state.orders.filter(o => o.channel === 'Shopee' && o.shop).map(o => o.shop))];
  state.adAccounts = [
    { id: 'fb', name: 'Facebook Ads', channel: 'Facebook', shop: '' },
    { id: 'tt', name: 'TikTok Ads', channel: 'TikTok Shop', shop: '' },
    ...(shops.length ? shops.map((s, i) => ({ id: 'sp' + (i + 1), name: 'Shopee Ads · ' + s, channel: 'Shopee', shop: s }))
      : [{ id: 'sp1', name: 'Shopee Ads', channel: 'Shopee', shop: '' }]),
  ];
  save();
}
const adColor = (a, i) => {
  const same = state.adAccounts.filter(x => x.channel === a.channel);
  return same.indexOf(a) > 0 ? AD_EXTRA[i % AD_EXTRA.length] : (AD_COLORS[a.channel] || AD_EXTRA[i % AD_EXTRA.length]);
};
// Đơn thuộc tài khoản QC: cùng kênh (và cùng shop nếu tài khoản gắn shop)
const accMatch = (a, o) => a.shop ? channelLabel(o) === accLabel(a) : o.channel === a.channel;
const getAd = (day, acc) => +((state.adSpend[day] || {})[acc]) || 0;
function setAd(day, acc, v) {
  if (v > 0) (state.adSpend[day] = state.adSpend[day] || {})[acc] = v;
  else if (state.adSpend[day]) { delete state.adSpend[day][acc]; if (!Object.keys(state.adSpend[day]).length) delete state.adSpend[day]; }
}
const fmtNum = n => n ? new Intl.NumberFormat('vi-VN').format(Math.round(n)) : '';

// "1.250.000" · "1,250,000" · "1250000.50" · "₫ 1.250.000" → số
function parseMoney(s) {
  if (typeof s === 'number') return s;
  s = String(s || '').replace(/[^\d.,-]/g, '');
  if (!s || s === '-') return 0;
  const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {   // có cả 2 → dấu xuất hiện sau cùng là dấu thập phân
    const dec = lastDot > lastComma ? '.' : ',';
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.');
  } else {
    const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : '';
    if (sep) {
      const parts = s.split(sep);
      // 1 dấu & 1–2 số lẻ phía sau → thập phân; còn lại là phân cách hàng nghìn
      s = parts.length === 2 && parts[1].length <= 2 ? parts.join('.') : parts.join('');
    }
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
// Ngày: 2026-10-13 · 13/10/2026 · 13-10-2026 · số ngày Excel · "2026-10-01 - 2026-10-07" (lấy ngày đầu)
function parseAnyDate(s) {
  s = String(s || '').trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) { const n = +s; if (n > 20000 && n < 80000) { const d = new Date(1899, 11, 30); d.setDate(d.getDate() + Math.floor(n)); return ymd(d); } return null; }
  let m = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = /(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s);
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  const t = Date.parse(s);
  return isNaN(t) ? null : ymd(new Date(t));
}

function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const sample = text.split(/\r?\n/).slice(0, 20).join('\n');
  const delim = [',', ';', '\t'].map(d => [d, sample.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(c => c.normalize('NFC').replace(/\s+/g, ' ').trim()));
}
async function readAdFile(file) {
  if (/\.xlsx$/i.test(file.name)) return readXlsxRows(file);
  if (/\.xls$/i.test(file.name)) throw new Error('File .xls (Excel đời cũ) chưa hỗ trợ – hãy xuất .xlsx hoặc .csv');
  return parseCsv(await file.text());
}

// Tìm dòng tiêu đề + cột ngày + cột chi phí
const AD_DATE_RE = /^(ngày|date|day|thời gian|time|stat time|by day|theo ngày|bắt đầu báo cáo|reporting starts|ngày bắt đầu)/i;
const AD_COST_RE = /(số tiền đã chi tiêu|amount spent|chi phí|chi tiêu|cost|spend|expense)/i;
const AD_COST_NOT = /(mỗi|per |\/|trên mỗi|cpc|cpm|cpa|ctr|ước tính|budget|ngân sách|roas|chuyển đổi|conversion)/i;
function detectAdColumns(rows) {
  const score = (h, re, prefer) => { if (!re.test(h)) return -1; return prefer.findIndex(p => p.test(h)) >= 0 ? 10 - prefer.findIndex(p => p.test(h)) : 1; };
  const datePref = [/^(ngày|day|date)$/i, /^(ngày|day|date)\b/i, /stat time|thời gian/i];
  const costPref = [/số tiền đã chi tiêu|amount spent/i, /^(chi phí|cost|spend)\b/i, /chi phí|cost|spend|chi tiêu/i];
  let best = null;
  rows.slice(0, 40).forEach((r, i) => {
    let d = -1, ds = 0, c = -1, cs = 0;
    r.forEach((h, j) => {
      const sd = score(h, AD_DATE_RE, datePref); if (sd > ds) { ds = sd; d = j; }
      const sc = AD_COST_NOT.test(h) ? -1 : score(h, AD_COST_RE, costPref); if (sc > cs) { cs = sc; c = j; }
    });
    if (c >= 0 && (!best || ds + cs > best.s)) best = { header: i, date: d, cost: c, s: ds + cs };
  });
  if (best) return best;
  const header = rows.slice(0, 10).reduce((bi, r, i, a) => r.filter(Boolean).length > a[bi].filter(Boolean).length ? i : bi, 0);
  return { header, date: -1, cost: -1 };
}

/* ---------- Trang Chi phí quảng cáo ---------- */
function adsData(r) {
  const accs = state.adAccounts;
  const days = [];
  for (let d = parseDay(r.end), s = parseDay(r.start); d >= s && days.length < 370; d = addDays(d, -1)) days.push(ymd(d));
  const valid = state.orders.filter(o => isRevenue(o) && inRange(dayOf(o.createdAt), r));
  const perAcc = accs.map(a => {
    const os = valid.filter(o => accMatch(a, o));
    return { a, spend: adSpendIn(r, id => id === a.id), revenue: os.reduce((s, o) => s + orderTotal(o), 0), orders: os.length };
  });
  const adOrders = valid.filter(o => accs.some(a => accMatch(a, o)));
  const revDay = {};
  adOrders.forEach(o => { const k = dayOf(o.createdAt); revDay[k] = (revDay[k] || 0) + orderTotal(o); });
  return { accs, days, perAcc, adOrders, revDay, total: perAcc.reduce((s, x) => s + x.spend, 0), revenue: adOrders.reduce((s, o) => s + orderTotal(o), 0) };
}
function adsSummaryHtml(d, r) {
  const m = metrics(r);
  return `
    ${kpi('Tổng chi phí Ads', money(d.total), `${d.days.length} ngày · TB ${money(d.total / (d.days.length || 1))}/ngày`)}
    ${kpi('Doanh thu kênh có chạy Ads', money(d.revenue), `${d.adOrders.length} đơn`)}
    ${kpi('ROAS', fmtRoas(d.total ? d.revenue / d.total : null), 'Doanh thu / chi phí Ads')}
    ${kpi('Chi phí Ads / đơn', d.adOrders.length && d.total ? money(d.total / d.adOrders.length) : '—', `Ads / doanh thu: ${d.revenue ? pct(d.total / d.revenue) : '—'}`)}
    ${kpi('Lãi ròng sau Ads', money(m.profit), `Toàn shop · biên ${pct(m.revenue ? m.profit / m.revenue : 0)}`)}`;
}
function adsAccTableHtml(d) {
  return d.perAcc.map((x, i) => {
    const [lbl, col] = roasRating(x.spend ? x.revenue / x.spend : null);
    return `<tr><td><span class="dot-c" style="--c:${adColor(x.a, i)}"></span><b>${esc(x.a.name)}</b><div class="muted small">→ ${esc(accLabel(x.a))}</div></td>
      <td class="num">${money(x.spend)}</td><td class="num">${money(x.revenue)}</td><td class="num">${x.orders}</td>
      <td class="num"><b>${fmtRoas(x.spend ? x.revenue / x.spend : null)}</b></td><td class="num">${x.orders && x.spend ? money(x.spend / x.orders) : '—'}</td>
      <td class="num">${x.revenue ? pct(x.spend / x.revenue) : '—'}</td><td>${x.spend ? `<span class="badge" style="--c:${col}">${lbl}</span>` : '<span class="muted small">Chưa có chi phí</span>'}</td>
      <td><button class="btn ghost sm" data-action="editAdAccount" data-id="${x.a.id}">Sửa</button></td></tr>`;
  }).join('');
}
function adsRowCells(day, d) {
  const tot = d.accs.reduce((s, a) => s + getAd(day, a.id), 0), rev = d.revDay[day] || 0;
  return { tot: tot ? money(tot) : '—', rev: rev ? money(rev) : '—', roas: tot ? fmtRoas(rev / tot) : '—', cls: tot && rev / tot < 2 ? 'delta down' : '' };
}

function renderAds(el) {
  ensureAdAccounts();
  const r = periodRange(ui.adsPeriod), d = adsData(r), today = todayStr();
  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.adsPeriod, 'setAdsPeriod')}<span class="grow"></span>
      <button class="btn" data-action="newAdAccount">+ Tài khoản QC</button>
      <label class="btn primary">Nhập file báo cáo Ads<input type="file" id="ads-file" accept=".csv,.xlsx,text/csv" hidden></label></div>
    <div class="kpis" id="ads-kpis">${adsSummaryHtml(d, r)}</div>
    <div class="grid-2">
      <div class="card span-2"><div class="card-h"><h3>Chi phí Ads theo ngày</h3><span class="muted small">Cột: chi phí từng tài khoản · Đường: doanh thu các kênh có chạy Ads</span></div>
        <div class="chart-box"><canvas id="ch-ads"></canvas></div></div>
      <div class="card span-2 flush"><div class="card-h" style="padding:14px 16px 0"><h3>Hiệu quả theo tài khoản quảng cáo</h3></div>
        <div class="table-wrap"><table class="tbl static"><thead><tr><th>Tài khoản → kênh bán</th><th class="num">Chi phí</th><th class="num">Doanh thu kênh</th><th class="num">Đơn</th><th class="num">ROAS</th><th class="num">Chi phí / đơn</th><th class="num">Ads / DT</th><th>Đánh giá</th><th></th></tr></thead>
        <tbody id="ads-acc">${adsAccTableHtml(d)}</tbody></table></div></div>
    </div>
    <div class="card flush">
      <div class="card-h" style="padding:14px 16px 0"><h3>Nhập chi phí theo ngày</h3><span class="muted small">Gõ số tiền rồi nhấn Enter để xuống ngày tiếp theo – tự lưu</span></div>
      <div class="table-wrap"><table class="tbl static ads-grid"><thead><tr><th>Ngày</th>${d.accs.map((a, i) => `<th class="num"><span class="dot-c" style="--c:${adColor(a, i)}"></span>${esc(a.name)}</th>`).join('')}<th class="num">Tổng Ads</th><th class="num">Doanh thu</th><th class="num">ROAS</th></tr></thead>
      <tbody id="ads-rows">${d.days.map(day => {
        const c = adsRowCells(day, d), wd = parseDay(day).toLocaleDateString('vi-VN', { weekday: 'short' });
        return `<tr data-day="${day}" class="${day === today ? 'is-today' : ''}"><td><b>${fmtDay(day).slice(0, 5)}</b> <span class="muted small">${wd}</span></td>
          ${d.accs.map(a => `<td class="num"><input class="ad-input" inputmode="numeric" data-day="${day}" data-acc="${a.id}" value="${fmtNum(getAd(day, a.id))}" placeholder="0" aria-label="${esc(a.name)} ${fmtDay(day)}"></td>`).join('')}
          <td class="num" data-c="tot">${c.tot}</td><td class="num" data-c="rev">${c.rev}</td><td class="num ${c.cls}" data-c="roas">${c.roas}</td></tr>`;
      }).join('')}</tbody></table></div></div>
    <details class="card help"><summary><b>Cách xuất báo cáo chi phí theo ngày từ từng nền tảng</b></summary>
      <ul>
        <li><b>Facebook Ads Manager:</b> mở Trình quản lý quảng cáo → chọn khoảng ngày → <i>Phân tích (Breakdown) → Theo thời gian → Ngày</i> → <i>Báo cáo → Xuất dữ liệu bảng</i> (.csv hoặc .xlsx). Cần có cột <i>Ngày</i> và <i>Số tiền đã chi tiêu</i>.</li>
        <li><b>TikTok Ads Manager:</b> <i>Báo cáo → Tạo báo cáo tùy chỉnh</i>, thứ nguyên <i>Ngày</i>, chỉ số <i>Chi phí</i> → Xuất.</li>
        <li><b>Shopee Ads:</b> Kênh Người Bán → <i>Marketing → Quảng cáo Shopee</i> → chọn khoảng ngày → <i>Tải dữ liệu</i>. Nếu file chỉ có tổng theo từng quảng cáo (không có cột ngày), app cho phép chia đều cho các ngày trong khoảng bạn chọn. Cách chính xác hơn: xem chi phí từng ngày trên biểu đồ của Quảng cáo Shopee rồi gõ vào bảng trên.</li>
      </ul>
      <p class="muted small">Tên menu có thể khác nhau theo phiên bản. App tự nhận cột ngày & chi phí; nếu đoán sai bạn chọn lại cột trong bước xem trước. File được đọc ngay trên trình duyệt, không gửi đi đâu.</p>
    </details>`;

  // Biểu đồ: cột chồng theo tài khoản + đường doanh thu
  const canvas = $('#ch-ads');
  if (!noChart(canvas)) {
    const asc = d.days.slice().reverse(), muted = cssVar('--muted');
    charts.push(new Chart(canvas, {
      data: {
        labels: asc.map(x => x.slice(8) + '/' + x.slice(5, 7)),
        datasets: [
          ...d.accs.map((a, i) => ({ type: 'bar', label: a.name, data: asc.map(x => getAd(x, a.id)), backgroundColor: adColor(a, i), stack: 'ads', order: 2 })),
          { type: 'line', label: 'Doanh thu kênh có Ads', data: asc.map(x => d.revDay[x] || 0), stack: 'rev', borderColor: cssVar('--c-rev'), backgroundColor: cssVar('--c-rev'), borderWidth: 2, pointRadius: 0, tension: .3, order: 1 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { color: muted, boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${money(c.raw)}` } } },
        scales: { x: { stacked: true, grid: { display: false }, ticks: { color: muted, maxRotation: 0, autoSkipPadding: 8 } }, y: { stacked: true, ticks: { color: muted, callback: v => shortMoney(v) }, grid: { color: cssVar('--line') } } },
      },
    }));
  }

  const rows = $('#ads-rows');
  rows.addEventListener('focusin', e => { if (e.target.matches('.ad-input')) e.target.select(); });
  rows.addEventListener('change', e => {
    if (!e.target.matches('.ad-input')) return;
    const { day, acc } = e.target.dataset, v = Math.max(0, Math.round(parseMoney(e.target.value)));
    setAd(day, acc, v); save();
    e.target.value = fmtNum(v);
    const nd = adsData(r), c = adsRowCells(day, nd), tr = e.target.closest('tr');
    tr.querySelector('[data-c=tot]').textContent = c.tot;
    const ro = tr.querySelector('[data-c=roas]'); ro.textContent = c.roas; ro.className = 'num ' + c.cls;
    $('#ads-kpis').innerHTML = adsSummaryHtml(nd, r);
    $('#ads-acc').innerHTML = adsAccTableHtml(nd);
    const ch = charts[charts.length - 1];
    if (ch && ch.canvas === $('#ch-ads')) {
      const asc = nd.days.slice().reverse();
      nd.accs.forEach((a, i) => { if (ch.data.datasets[i]) ch.data.datasets[i].data = asc.map(x => getAd(x, a.id)); });
      ch.update('none');
    }
  });
  rows.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('.ad-input')) return;
    e.preventDefault();
    e.target.dispatchEvent(new Event('change', { bubbles: true }));
    const next = e.target.closest('tr').nextElementSibling?.querySelector(`.ad-input[data-acc="${e.target.dataset.acc}"]`);
    if (next) next.focus(); else e.target.blur();
  });
  $('#ads-file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) adsImport(f); });
}

/* ---------- Tài khoản quảng cáo ---------- */
function adAccountModal(id) {
  ensureAdAccounts();
  const a = state.adAccounts.find(x => x.id === id) || { name: '', channel: 'Facebook', shop: '' };
  const shops = [...new Set(state.orders.filter(o => o.shop).map(o => o.shop))];
  const hasData = id && Object.values(state.adSpend).some(m => m[id]);
  openModal(id ? 'Sửa tài khoản quảng cáo' : 'Thêm tài khoản quảng cáo', `
    <form class="form" id="f-adacc">
      <label class="full">Tên tài khoản<input name="name" required value="${esc(a.name)}" placeholder="VD: Facebook Ads, Shopee Ads · Shop phụ, TikTok Ads 2…"></label>
      <label>Quảng cáo cho kênh bán<select name="channel">${opts(CHANNELS, a.channel)}</select></label>
      <label>Gian hàng (nếu kênh có nhiều shop)<input name="shop" list="adacc-shops" value="${esc(a.shop)}" placeholder="Để trống = cả kênh">
        <datalist id="adacc-shops">${shops.map(s => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <p class="muted small full">Kênh bán dùng để tính ROAS: doanh thu các đơn của kênh (và shop) đó ÷ chi phí của tài khoản.</p>
      <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="deleteAdAccount" data-id="${id}" style="margin-right:auto">Xóa${hasData ? ' (kèm dữ liệu chi phí)' : ''}</button>` : ''}
        <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-adacc', body).addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      const data = { name: f.name.trim(), channel: f.channel, shop: f.shop.trim() };
      if (id) Object.assign(a, data);
      else state.adAccounts.push({ id: 'ad' + Date.now().toString(36), ...data });
      save(); closeModal(); rerender();
    });
  });
}

/* ---------- Nhập file báo cáo Ads ---------- */
async function adsImport(file) {
  ensureAdAccounts();
  let rows;
  try { rows = (await readAdFile(file)).filter(r => r.some(Boolean)); }
  catch (e) { toast(e.message || 'Không đọc được file'); return; }
  if (rows.length < 2) { toast('File không có dữ liệu'); return; }
  const det = detectAdColumns(rows);
  const header = rows[det.header];
  // Đoán tài khoản theo tên file
  const fn = file.name.toLowerCase();
  const guess = state.adAccounts.find(a => (/face|fb|meta/.test(fn) && a.channel === 'Facebook') || (/tiktok/.test(fn) && a.channel === 'TikTok Shop') || (/shopee/.test(fn) && a.channel === 'Shopee')) || state.adAccounts[0];
  const split = { start: ymd(addDays(new Date(), -6)), end: todayStr() };

  openModal('Nhập chi phí quảng cáo từ file', `
    <p class="muted">File <b>${esc(file.name)}</b> · ${rows.length - det.header - 1} dòng dữ liệu</p>
    <div class="form">
      <label>Tài khoản quảng cáo<select id="ai-acc">${state.adAccounts.map(a => `<option value="${a.id}" ${a === guess ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
      <label>Cách ghi<select id="ai-mode"><option value="replace">Ghi đè các ngày có trong file</option><option value="add">Cộng thêm vào số đã có</option></select></label>
      <label>Cột ngày<select id="ai-date"><option value="-1">— File không có cột ngày: chia đều —</option>${header.map((h, i) => `<option value="${i}" ${i === det.date ? 'selected' : ''}>${esc(h || 'Cột ' + (i + 1))}</option>`).join('')}</select></label>
      <label>Cột chi phí<select id="ai-cost">${header.map((h, i) => `<option value="${i}" ${i === det.cost ? 'selected' : ''}>${esc(h || 'Cột ' + (i + 1))}</option>`).join('')}</select></label>
      <div class="full" id="ai-split" style="display:none"><span class="muted small">Chia đều tổng chi phí cho các ngày:</span>
        <span class="range-pick"><input type="date" id="ai-s" value="${split.start}" max="${todayStr()}"><span class="muted">→</span><input type="date" id="ai-e" value="${split.end}" max="${todayStr()}"></span></div>
    </div>
    <div id="ai-preview" class="detail-sec"></div>
    <div class="row-actions"><span style="flex:1"></span><button class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary" id="ai-do">Nhập</button></div>`, body => {
    const sel = id => $(id, body);
    let result = null;
    const compute = () => {
      const di = +sel('#ai-date').value, ci = +sel('#ai-cost').value;
      sel('#ai-split').style.display = di < 0 ? '' : 'none';
      const byDay = {}; let skipped = 0, total = 0;
      rows.slice(det.header + 1).forEach(r => {
        const label = r.slice(0, 3).join(' ').toLowerCase();
        if (/^(tổng|total|kết quả|results)/.test(label)) { skipped++; return; }   // dòng tổng cộng
        const v = parseMoney(r[ci]);
        if (!v) return;
        if (di < 0) { total += v; return; }
        const day = parseAnyDate(r[di]);
        if (!day) { skipped++; return; }
        byDay[day] = (byDay[day] || 0) + v;
      });
      if (di < 0) {
        const s = sel('#ai-s').value, e = sel('#ai-e').value;
        const n = s && e && e >= s ? daysBetween(s, e) + 1 : 0;
        if (n) for (let k = 0; k < n; k++) byDay[ymd(addDays(parseDay(s), k))] = Math.round(total / n);
      }
      const days = Object.keys(byDay).sort(), sum = Object.values(byDay).reduce((a, b) => a + b, 0);
      result = { byDay, days };
      const one = di >= 0 && days.length === 1 && rows.length - det.header - 1 > 3;
      sel('#ai-preview').innerHTML = days.length ? `
        <div class="mini-kpis"><div><span>Số ngày</span><b>${days.length}</b></div><div><span>Từ – đến</span><b>${fmtDay(days[0]).slice(0, 5)} – ${fmtDay(days[days.length - 1]).slice(0, 5)}</b></div>
          <div><span>Tổng chi phí</span><b>${money(sum)}</b></div><div><span>TB / ngày</span><b>${money(sum / days.length)}</b></div></div>
        ${one ? '<p class="delta down small">⚠ Mọi dòng có cùng 1 ngày – file có thể là báo cáo tổng (không chia theo ngày). Hãy xuất lại với phân tích theo Ngày, hoặc chọn “chia đều”.</p>' : ''}
        ${skipped ? `<p class="muted small">Bỏ qua ${skipped} dòng tổng cộng / không đọc được ngày.</p>` : ''}
        <div class="table-wrap" style="max-height:180px;margin-top:8px"><table class="tbl static"><tbody>${days.slice(-14).reverse().map(x => `<tr><td>${fmtDay(x)}</td><td class="num">${money(byDay[x])}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="delta down">Chưa đọc được chi phí – hãy chọn đúng cột ngày và cột chi phí.</p>';
      sel('#ai-do').disabled = !days.length;
      sel('#ai-do').textContent = days.length ? `Nhập ${days.length} ngày` : 'Nhập';
    };
    ['#ai-date', '#ai-cost', '#ai-s', '#ai-e'].forEach(x => sel(x).addEventListener('change', compute));
    compute();
    sel('#ai-do').addEventListener('click', () => {
      if (!result || !result.days.length) return;
      const acc = sel('#ai-acc').value, add = sel('#ai-mode').value === 'add';
      result.days.forEach(day => setAd(day, acc, Math.round((add ? getAd(day, acc) : 0) + result.byDay[day])));
      save(); closeModal();
      toast(`Đã nhập chi phí ${result.days.length} ngày cho ${state.adAccounts.find(a => a.id === acc).name}`);
      // Chuyển khoảng xem cho thấy dữ liệu vừa nhập
      ui.adsPeriod = 'custom'; ui.customRange = { start: result.days[0], end: result.days[result.days.length - 1] > todayStr() ? todayStr() : result.days[result.days.length - 1] };
      if (location.hash !== '#ads') location.hash = '#ads'; else rerender();
    });
  });
}

/* ---------- Đăng ký trang & hành động ---------- */
VIEWS.ads = { title: 'Chi phí quảng cáo', render: renderAds };
Object.assign(ACTIONS, {
  setAdsPeriod: d => { ui.adsPeriod = d.p; rerender(); },
  newAdAccount: () => adAccountModal(),
  editAdAccount: d => adAccountModal(d.id),
  deleteAdAccount: d => {
    if (!confirm('Xóa tài khoản này và toàn bộ chi phí đã nhập của nó?')) return;
    state.adAccounts = state.adAccounts.filter(a => a.id !== d.id);
    Object.keys(state.adSpend).forEach(day => setAd(day, d.id, 0));
    save(); closeModal(); rerender();
  },
});
