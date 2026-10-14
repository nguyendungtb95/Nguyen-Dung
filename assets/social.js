'use strict';
/* =========================================================
   Truyền thông Social: traffic các kênh (Fanpage, TikTok,
   YouTube), lịch nội dung & bài đăng.
   Dữ liệu: state.social = {
     stats:  { 'YYYY-MM-DD': { fb: { views, engagement, messages, clicks, followers } } },
     posts:  [ { id, channel, title, format, pillar, stage, date, time, owner, products, content, link,
                 views, likes, comments, shares, saves, messages } ],
     targets:{ fb: 7, tt: 14, yt: 2 }   // số bài / tuần
   }
   ========================================================= */

const SOC_CH = [
  { id: 'fb', name: 'Fanpage Facebook', short: 'Fanpage', color: '#3b6fd8', sales: 'Facebook' },
  { id: 'tt', name: 'TikTok', short: 'TikTok', color: '#14b8a6', sales: 'TikTok Shop' },
  { id: 'yt', name: 'YouTube', short: 'YouTube', color: '#ef4444', sales: '' },
];
const SOC_METRICS = [
  ['views', 'Lượt xem / tiếp cận'], ['engagement', 'Tương tác (thích + bình luận + chia sẻ)'],
  ['messages', 'Tin nhắn / inbox'], ['clicks', 'Click link / lượt ghé shop'], ['followers', 'Tổng follower (cuối ngày)'],
];
const POST_STAGES = [
  { key: 'idea', label: 'Ý tưởng', color: '#64748b' }, { key: 'production', label: 'Đang sản xuất', color: '#7c3aed' },
  { key: 'review', label: 'Chờ duyệt', color: '#2563eb' }, { key: 'scheduled', label: 'Đã lên lịch', color: '#d97706' },
  { key: 'posted', label: 'Đã đăng', color: '#16a34a' },
];
const POST_FORMATS = ['Video ngắn / Reels', 'Livestream', 'Bài ảnh / Album', 'Story', 'Video dài', 'Bài viết'];
const POST_PILLARS = ['Giới thiệu sản phẩm', 'Phối đồ / Lookbook', 'Review / Feedback khách', 'Hậu trường', 'Khuyến mãi', 'Trend / Giải trí', 'Kiến thức / Mẹo'];
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

Object.assign(ui, { socTab: 'overview', socPeriod: '30d', socMetric: 'views', socMonth: todayStr().slice(0, 7), socFilterCh: 'all', socFilterStage: 'all' });

const socCh = id => SOC_CH.find(c => c.id === id) || SOC_CH[0];
const postStage = k => POST_STAGES.find(s => s.key === k) || POST_STAGES[0];
const postBadge = k => { const s = postStage(k); return `<span class="badge" style="--c:${s.color}">${s.label}</span>`; };
const postEng = p => (+p.likes || 0) + (+p.comments || 0) + (+p.shares || 0) + (+p.saves || 0);
const isLate = p => p.stage !== 'posted' && p.date && p.date < todayStr();
const n0 = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
const shortNum = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n0(n);
const mondayOf = day => { const d = parseDay(day); return ymd(addDays(d, -((d.getDay() + 6) % 7))); };

function soc() {
  if (!state.social || typeof state.social !== 'object') state.social = {};
  const s = state.social;
  s.stats = s.stats || {}; s.posts = s.posts || []; s.targets = s.targets || { fb: 7, tt: 14, yt: 2 };
  if (isDemoData() && !s.posts.length && !s.seeded) { s.seeded = true; seedSocial(s); save(); }   // đặt cờ trước: seedSocial gọi setStat → soc()
  return s;
}
const getStat = (day, ch, k) => +(((soc().stats[day] || {})[ch] || {})[k]) || 0;
function setStat(day, ch, k, v) {
  const st = soc().stats;
  if (v > 0) (((st[day] = st[day] || {})[ch] = st[day][ch] || {})[k] = v);
  else if (st[day] && st[day][ch]) {
    delete st[day][ch][k];
    if (!Object.keys(st[day][ch]).length) delete st[day][ch];
    if (!Object.keys(st[day]).length) delete st[day];
  }
}

function seedSocial(s) {
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a, pick = a => a[rnd(0, a.length - 1)];
  const now = new Date();
  const base = { fb: 18400, tt: 9600, yt: 1200 };
  for (let off = 59; off >= 0; off--) {
    const day = ymd(addDays(now, -off));
    SOC_CH.forEach(c => {
      base[c.id] += c.id === 'tt' ? rnd(10, 90) : c.id === 'fb' ? rnd(5, 40) : rnd(0, 8);
      const views = c.id === 'tt' ? rnd(4000, 30000) : c.id === 'fb' ? rnd(2500, 12000) : rnd(150, 1500);
      setStat(day, c.id, 'views', views); setStat(day, c.id, 'engagement', Math.round(views * rnd(3, 8) / 100));
      setStat(day, c.id, 'messages', c.id === 'fb' ? rnd(8, 40) : c.id === 'tt' ? rnd(2, 15) : rnd(0, 2));
      setStat(day, c.id, 'clicks', Math.round(views * rnd(5, 15) / 1000)); setStat(day, c.id, 'followers', base[c.id]);
    });
  }
  const ideas = ['Phối 3 outfit với 1 váy ngủ lụa', 'Unbox đơn hàng cho khách', 'Hậu trường chụp lookbook', 'Review thật từ khách quen', 'Livestream sale tối thứ 6',
    'Mẹo chọn size đồ ngủ', 'Trend biến hình 5 giây', 'Giới thiệu BST Thu Đông', 'So sánh lụa satin vs lụa băng', 'Flash sale cuối tuần'];
  let id = 1;
  for (let off = -21; off <= 14; off++) {
    SOC_CH.forEach(c => {
      if (Math.random() > (c.id === 'tt' ? .75 : c.id === 'fb' ? .55 : .12)) return;
      const date = ymd(addDays(now, off)), posted = off < 0 || (off === 0 && Math.random() < .5);
      const stage = posted ? 'posted' : off <= 2 ? pick(['scheduled', 'review']) : pick(['idea', 'production', 'scheduled']);
      const views = posted ? (c.id === 'tt' ? rnd(1500, 60000) : c.id === 'fb' ? rnd(800, 15000) : rnd(200, 4000)) : 0;
      s.posts.push({
        id: 'BV' + pad(id++, 4), channel: c.id, title: pick(ideas), format: c.id === 'tt' ? pick(['Video ngắn / Reels', 'Livestream']) : c.id === 'yt' ? pick(['Video dài', 'Video ngắn / Reels']) : pick(POST_FORMATS.slice(0, 4)),
        pillar: pick(POST_PILLARS), stage, date: stage === 'idea' && Math.random() < .4 ? '' : date, time: pick(['11:30', '19:00', '20:30', '21:00']), owner: pick(['Lan', 'Marketing', 'Chủ shop']),
        products: '', content: '', link: '', views, likes: Math.round(views * rnd(2, 6) / 100), comments: Math.round(views * rnd(2, 8) / 1000),
        shares: Math.round(views * rnd(1, 5) / 1000), saves: Math.round(views * rnd(1, 6) / 1000), messages: posted ? rnd(0, 12) : 0,
      });
    });
  }
}

/* ---------- Tính toán ---------- */
function latestFollowers(ch, until) {
  const days = Object.keys(soc().stats).filter(d => d <= until && getStat(d, ch, 'followers')).sort();
  return days.length ? { day: days[days.length - 1], v: getStat(days[days.length - 1], ch, 'followers') } : null;
}
function channelSummary(r) {
  const s = soc(), days = Object.keys(s.stats).filter(d => inRange(d, r));
  return SOC_CH.map(c => {
    const sum = k => days.reduce((a, d) => a + getStat(d, c.id, k), 0);
    const posts = s.posts.filter(p => p.channel === c.id && p.stage === 'posted' && p.date && inRange(p.date, r));
    const postViews = posts.reduce((a, p) => a + (+p.views || 0), 0), postEngage = posts.reduce((a, p) => a + postEng(p), 0);
    const views = sum('views'), engagement = sum('engagement');
    const cur = latestFollowers(c.id, r.end), before = latestFollowers(c.id, ymd(addDays(parseDay(r.start), -1)));
    const firstIn = days.filter(d => getStat(d, c.id, 'followers')).sort()[0];
    const startF = before ? before.v : firstIn ? getStat(firstIn, c.id, 'followers') : null;
    const orders = c.sales ? state.orders.filter(o => isRevenue(o) && o.channel === c.sales && inRange(dayOf(o.createdAt), r)) : [];
    const v = views || postViews, e = engagement || postEngage;
    return {
      c, views: v, viewsFromPosts: !views && postViews > 0, engagement: e, messages: sum('messages') || posts.reduce((a, p) => a + (+p.messages || 0), 0),
      clicks: sum('clicks'), followers: cur ? cur.v : null, growth: cur && startF != null ? cur.v - startF : null,
      posts: posts.length, avgViews: posts.length ? postViews / posts.length : 0, er: v ? e / v : null,
      orders: orders.length, revenue: orders.reduce((a, o) => a + orderTotal(o), 0),
    };
  });
}
function socAlerts() {
  const s = soc(), today = todayStr(), wk = mondayOf(today), wkEnd = ymd(addDays(parseDay(wk), 6)), out = [];
  s.posts.filter(isLate).sort((a, b) => a.date.localeCompare(b.date)).forEach(p => out.push(['bad', `Trễ lịch từ ${fmtDay(p.date)} – còn ở bước “${postStage(p.stage).label}”`, p]));
  s.posts.filter(p => p.stage === 'review').forEach(p => out.push(['info', 'Đang chờ duyệt nội dung', p]));
  s.posts.filter(p => p.stage === 'posted' && p.date && daysBetween(p.date, today) >= 1 && daysBetween(p.date, today) <= 7 && !p.views).forEach(p => out.push(['warn', 'Đã đăng nhưng chưa cập nhật kết quả (lượt xem, tương tác)', p]));
  SOC_CH.forEach(c => {
    const planned = s.posts.filter(p => p.channel === c.id && p.date >= wk && p.date <= wkEnd && p.stage !== 'idea').length, t = +s.targets[c.id] || 0;
    if (t && planned < t) out.push(['warn', `${c.short}: tuần này mới lên lịch ${planned}/${t} bài theo chỉ tiêu`, null]);
  });
  return out;
}

/* ---------- Giao diện ---------- */
function renderSocial(el) {
  soc();
  const tabs = [['overview', 'Tổng quan traffic'], ['calendar', 'Lịch nội dung'], ['posts', 'Danh sách bài đăng'], ['input', 'Nhập số liệu ngày']];
  el.innerHTML = `
    <div class="toolbar"><div class="seg">${tabs.map(([k, l]) => `<button class="${ui.socTab === k ? 'on' : ''}" data-action="setSocTab" data-t="${k}">${l}</button>`).join('')}</div>
      <span class="grow"></span><button class="btn primary" data-action="newPost">+ Bài đăng mới</button></div>
    <div id="soc-body" class="view"></div>`;
  ({ overview: socOverview, calendar: socCalendar, posts: socPosts, input: socInput })[ui.socTab]($('#soc-body'));
}

function socOverview(el) {
  const r = periodRange(ui.socPeriod), sum = channelSummary(r), s = soc();
  const top = s.posts.filter(p => p.stage === 'posted' && p.date && inRange(p.date, r)).sort((a, b) => (+b.views || 0) - (+a.views || 0)).slice(0, 6);
  const inR = s.posts.filter(p => p.date && inRange(p.date, r) && p.stage === 'posted');
  const mix = (key, list) => { const m = {}; inR.forEach(p => m[p[key]] = (m[p[key]] || 0) + 1); return list.map(k => [k, m[k] || 0]).filter(x => x[1]).sort((a, b) => b[1] - a[1]); };
  const bars = pairs => { const mx = Math.max(1, ...pairs.map(p => p[1])); return pairs.map(([l, v]) => `<div class="hbar"><div class="hbar-l"><span>${esc(l)}</span><b>${v} bài</b></div><div class="hbar-t"><i style="width:${v / mx * 100}%"></i></div></div>`).join('') || '<p class="empty">Chưa có bài đã đăng trong kỳ</p>'; };
  const alerts = socAlerts();
  const hasStats = Object.keys(s.stats).some(d => inRange(d, r));
  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.socPeriod, 'setSocPeriod')}</div>
    ${!hasStats ? `<div class="spx-hint"><div><b>Chưa có số liệu traffic trong kỳ.</b> Vào tab <b>Nhập số liệu ngày</b> để điền lượt xem, tương tác, tin nhắn, follower từ Meta Business Suite / TikTok Studio / YouTube Studio. Trong lúc chưa có, app tạm cộng từ kết quả các bài đăng.</div>
      <button class="btn primary sm" data-action="setSocTab" data-t="input">Nhập số liệu</button></div>` : ''}
    <div class="soc-cards">${sum.map(x => `
      <div class="card soc-card" style="--c:${x.c.color}">
        <div class="card-h"><h3><span class="dot-c" style="--c:${x.c.color}"></span>${x.c.name}</h3><span class="muted small">${x.posts} bài đã đăng</span></div>
        <div class="soc-big"><b>${x.followers != null ? shortNum(x.followers) : '—'}</b><span>follower ${x.growth != null ? `<span class="delta ${x.growth >= 0 ? 'up' : 'down'}">${x.growth >= 0 ? '+' : ''}${n0(x.growth)}</span> trong kỳ` : ''}</span></div>
        <div class="mini-kpis three">
          <div><span>Lượt xem${x.viewsFromPosts ? ' (bài)' : ''}</span><b>${shortNum(x.views)}</b></div>
          <div><span>Tương tác</span><b>${shortNum(x.engagement)}</b></div>
          <div><span>Tỷ lệ tương tác</span><b>${x.er != null ? pct(x.er) : '—'}</b></div>
          <div><span>Tin nhắn</span><b>${n0(x.messages)}</b></div>
          <div><span>TB xem / bài</span><b>${x.avgViews ? shortNum(x.avgViews) : '—'}</b></div>
          <div><span>${x.c.sales ? 'Đơn ' + esc(x.c.sales) : 'Click link'}</span><b>${x.c.sales ? n0(x.orders) : n0(x.clicks)}</b></div>
        </div></div>`).join('')}</div>
    <div class="grid-2">
      <div class="card span-2"><div class="card-h"><h3>Lượt xem theo ngày</h3><span class="muted small">Số liệu kênh nhập theo ngày</span></div><div class="chart-box"><canvas id="ch-soc"></canvas></div></div>
      <div class="card span-2 flush"><div class="card-h" style="padding:14px 16px 0"><h3>So sánh kênh</h3><span class="muted small">Tỷ lệ chuyển đổi = đơn của kênh bán / tin nhắn</span></div>
        <div class="table-wrap"><table class="tbl static"><thead><tr><th>Kênh</th><th class="num">Follower</th><th class="num">Tăng</th><th class="num">Lượt xem</th><th class="num">Tương tác</th><th class="num">Tỷ lệ TT</th><th class="num">Tin nhắn</th><th class="num">Đơn hàng</th><th class="num">Tin nhắn → đơn</th><th class="num">Doanh thu kênh</th></tr></thead><tbody>
        ${sum.map(x => `<tr><td><span class="dot-c" style="--c:${x.c.color}"></span><b>${x.c.name}</b></td><td class="num">${x.followers != null ? n0(x.followers) : '—'}</td><td class="num">${x.growth != null ? (x.growth >= 0 ? '+' : '') + n0(x.growth) : '—'}</td>
          <td class="num">${n0(x.views)}</td><td class="num">${n0(x.engagement)}</td><td class="num">${x.er != null ? pct(x.er) : '—'}</td><td class="num">${n0(x.messages)}</td>
          <td class="num">${x.c.sales ? n0(x.orders) : '—'}</td><td class="num">${x.c.sales && x.messages ? pct(x.orders / x.messages) : '—'}</td><td class="num">${x.c.sales ? money(x.revenue) : '—'}</td></tr>`).join('')}
        </tbody></table></div></div>
      <div class="card"><h3>Top bài đăng trong kỳ</h3><ul class="list">${top.map(p => `<li class="clickable" data-action="editPost" data-id="${p.id}"><span><span class="dot-c" style="--c:${socCh(p.channel).color}"></span>${esc(p.title)}<div class="meta">${socCh(p.channel).short} · ${esc(p.format)} · ${fmtDay(p.date)}</div></span><span class="num"><b>${shortNum(+p.views || 0)}</b> <span class="meta">xem · ${shortNum(postEng(p))} TT</span></span></li>`).join('') || '<li class="empty">Chưa có bài đã đăng có kết quả</li>'}</ul></div>
      <div class="card"><h3>Cảnh báo & việc cần làm</h3><ul class="list">${alerts.slice(0, 8).map(([lv, msg, p]) => `<li class="${p ? 'clickable ' : ''}alert-${lv}" ${p ? `data-action="editPost" data-id="${p.id}"` : 'data-action="setSocTab" data-t="calendar"'}><span>${p ? `<b>${esc(p.title)}</b>` : ''}<div class="meta">${msg}</div></span></li>`).join('') || '<li class="empty">Mọi thứ đang đúng kế hoạch</li>'}</ul></div>
      <div class="card"><h3>Chủ đề nội dung đã đăng</h3>${bars(mix('pillar', POST_PILLARS))}</div>
      <div class="card"><h3>Định dạng đã đăng</h3>${bars(mix('format', POST_FORMATS))}</div>
    </div>`;
  const canvas = $('#ch-soc');
  if (!noChart(canvas)) {
    const cr = chartRange(r), ds = []; for (let d = parseDay(cr.start), e = parseDay(cr.end); d <= e; d = addDays(d, 1)) ds.push(ymd(d));
    const muted = cssVar('--muted');
    charts.push(new Chart(canvas, {
      type: 'line',
      data: { labels: ds.map(x => x.slice(8) + '/' + x.slice(5, 7)), datasets: SOC_CH.map(c => ({ label: c.name, data: ds.map(d => getStat(d, c.id, 'views')), borderColor: c.color, backgroundColor: c.color, borderWidth: 2, pointRadius: 0, tension: .3 })) },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { color: muted, boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${n0(c.raw)} lượt xem` } } },
        scales: { x: { grid: { display: false }, ticks: { color: muted, maxRotation: 0, autoSkipPadding: 8 } }, y: { ticks: { color: muted, callback: v => shortNum(v) }, grid: { color: cssVar('--line') } } },
      },
    }));
  }
}

function socCalendar(el) {
  const s = soc(), [y, m] = ui.socMonth.split('-').map(Number), first = new Date(y, m - 1, 1), today = todayStr();
  const start = addDays(first, -((first.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, i) => ymd(addDays(start, i)));
  const monthLabel = first.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const wk = mondayOf(today), wkEnd = ymd(addDays(parseDay(wk), 6));
  const visible = p => ui.socFilterCh === 'all' || p.channel === ui.socFilterCh;
  const byDay = {}; s.posts.filter(p => p.date && visible(p)).forEach(p => (byDay[p.date] = byDay[p.date] || []).push(p));
  const undated = s.posts.filter(p => !p.date && visible(p));
  el.innerHTML = `
    <div class="soc-cards">${SOC_CH.map(c => {
      const wp = s.posts.filter(p => p.channel === c.id && p.date >= wk && p.date <= wkEnd);
      const planned = wp.filter(p => p.stage !== 'idea').length, posted = wp.filter(p => p.stage === 'posted').length, t = +s.targets[c.id] || 0;
      return `<div class="card soc-target" style="--c:${c.color}"><div class="card-h"><h3><span class="dot-c" style="--c:${c.color}"></span>${c.name} · tuần này</h3><button class="btn ghost sm" data-action="editTargets">Chỉ tiêu</button></div>
        <div class="soc-big"><b>${posted}/${t || '—'}</b><span>bài đã đăng · ${planned} bài đã lên lịch</span></div>
        <div class="hbar-t"><i style="width:${t ? Math.min(100, posted / t * 100) : 0}%;background:${c.color}"></i></div></div>`;
    }).join('')}</div>
    <div class="toolbar">
      <div class="daynav"><button class="btn sm" data-action="socMonth" data-d="-1" aria-label="Tháng trước">‹</button><b class="cal-month">${monthLabel}</b><button class="btn sm" data-action="socMonth" data-d="1" aria-label="Tháng sau">›</button>
        <button class="btn sm ghost" data-action="socMonth" data-d="0">Tháng này</button></div>
      <span class="grow"></span>
      <div class="seg">${[['all', 'Tất cả kênh'], ...SOC_CH.map(c => [c.id, c.short])].map(([k, l]) => `<button class="${ui.socFilterCh === k ? 'on' : ''}" data-action="socFilterCh" data-c="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="card flush"><div class="cal">
      ${WEEKDAYS.map(w => `<div class="cal-h">${w}</div>`).join('')}
      ${cells.map(d => `<div class="cal-d ${d.slice(0, 7) !== ui.socMonth ? 'out' : ''} ${d === today ? 'today' : ''}" data-action="newPost" data-date="${d}" title="Bấm để lên bài ngày ${fmtDay(d)}">
        <span class="cal-n">${+d.slice(8)}</span>
        ${(byDay[d] || []).sort((a, b) => String(a.time).localeCompare(String(b.time))).map(p => `<div class="pchip st-${p.stage} ${isLate(p) ? 'late' : ''}" style="--c:${socCh(p.channel).color}" data-action="editPost" data-id="${p.id}" title="${esc(socCh(p.channel).short + ' · ' + postStage(p.stage).label + ' · ' + p.title)}">${p.time ? `<i>${esc(p.time)}</i> ` : ''}${esc(p.title)}</div>`).join('')}
      </div>`).join('')}
    </div></div>
    <p class="muted small">Màu theo kênh · viền nét đứt = chưa đăng · gạch đỏ = trễ lịch. Bấm vào ô ngày để lên bài, bấm vào bài để sửa.</p>
    <div class="card"><h3>Kho ý tưởng chưa có ngày (${undated.length})</h3><ul class="list">${undated.map(p => `<li class="clickable" data-action="editPost" data-id="${p.id}"><span><span class="dot-c" style="--c:${socCh(p.channel).color}"></span>${esc(p.title)}<div class="meta">${socCh(p.channel).short} · ${esc(p.format)} · ${esc(p.pillar)}</div></span>${postBadge(p.stage)}</li>`).join('') || '<li class="empty">Chưa có ý tưởng nào chưa xếp lịch</li>'}</ul></div>`;
}

function socPosts(el) {
  const s = soc();
  const counts = Object.fromEntries(POST_STAGES.map(x => [x.key, 0]));
  s.posts.filter(p => ui.socFilterCh === 'all' || p.channel === ui.socFilterCh).forEach(p => counts[p.stage]++);
  let list = s.posts.filter(p => (ui.socFilterCh === 'all' || p.channel === ui.socFilterCh) && (ui.socFilterStage === 'all' || p.stage === ui.socFilterStage));
  list.sort((a, b) => (b.date || '9999').localeCompare(a.date || '9999'));
  const nextStage = p => { const i = POST_STAGES.findIndex(x => x.key === p.stage); return i >= 0 && i < POST_STAGES.length - 1 ? POST_STAGES[i + 1] : null; };
  el.innerHTML = `
    <div class="flow">${POST_STAGES.map(x => `<button class="flow-step ${ui.socFilterStage === x.key ? 'on' : ''}" style="--c:${x.color}" data-action="socFilterStage" data-s="${x.key}"><b>${counts[x.key]}</b><span>${x.label}</span></button>`).join('<span class="flow-arrow">→</span>')}</div>
    <div class="toolbar"><div class="seg">${[['all', 'Tất cả kênh'], ...SOC_CH.map(c => [c.id, c.short])].map(([k, l]) => `<button class="${ui.socFilterCh === k ? 'on' : ''}" data-action="socFilterCh" data-c="${k}">${l}</button>`).join('')}</div>
      ${ui.socFilterStage !== 'all' ? `<button class="btn ghost sm" data-action="socFilterStage" data-s="${ui.socFilterStage}">Bỏ lọc: ${postStage(ui.socFilterStage).label} ×</button>` : ''}</div>
    <div class="card flush"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Ngày đăng</th><th>Kênh</th><th>Nội dung</th><th>Định dạng · Chủ đề</th><th>Trạng thái</th><th class="num">Lượt xem</th><th class="num">Tương tác</th><th class="num">Tin nhắn</th><th></th></tr></thead><tbody>
      ${list.map(p => { const nx = nextStage(p); return `<tr data-action="editPost" data-id="${p.id}">
        <td class="${isLate(p) ? 'delta down' : ''}">${p.date ? fmtDay(p.date) : '<span class="muted">Chưa xếp lịch</span>'}${p.time ? `<div class="muted small">${esc(p.time)}</div>` : ''}</td>
        <td><span class="dot-c" style="--c:${socCh(p.channel).color}"></span>${socCh(p.channel).short}</td>
        <td class="prod-name"><b>${esc(p.title)}</b>${p.owner ? `<div class="muted small">${esc(p.owner)}</div>` : ''}</td>
        <td>${esc(p.format)}<div class="muted small">${esc(p.pillar)}</div></td><td>${postBadge(p.stage)}</td>
        <td class="num">${p.stage === 'posted' ? n0(p.views) : '—'}</td><td class="num">${p.stage === 'posted' ? n0(postEng(p)) : '—'}</td><td class="num">${p.stage === 'posted' ? n0(p.messages) : '—'}</td>
        <td>${nx ? `<button class="btn sm" data-action="advancePost" data-id="${p.id}">→ ${nx.label}</button>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">Chưa có bài đăng – bấm “+ Bài đăng mới”</td></tr>'}
    </tbody></table></div></div>`;
}

function socInput(el) {
  const r = periodRange(ui.socPeriod), today = todayStr();
  const days = []; for (let d = parseDay(r.end), s = parseDay(r.start); d >= s && days.length < 370; d = addDays(d, -1)) days.push(ymd(d));
  const metric = ui.socMetric;
  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.socPeriod, 'setSocPeriod')}</div>
    <div class="toolbar"><span class="muted">Chỉ số đang nhập:</span>
      <div class="seg">${SOC_METRICS.map(([k, l]) => `<button class="${metric === k ? 'on' : ''}" data-action="setSocMetric" data-m="${k}">${l}</button>`).join('')}</div></div>
    <div class="card flush"><div class="card-h" style="padding:14px 16px 0"><h3>${SOC_METRICS.find(x => x[0] === metric)[1]}</h3><span class="muted small">Gõ số rồi nhấn Enter để xuống ngày tiếp theo – tự lưu</span></div>
      <div class="table-wrap"><table class="tbl static ads-grid"><thead><tr><th>Ngày</th>${SOC_CH.map(c => `<th class="num"><span class="dot-c" style="--c:${c.color}"></span>${c.name}</th>`).join('')}<th class="num">Tổng</th></tr></thead>
      <tbody id="soc-rows">${days.map(d => `<tr class="${d === today ? 'is-today' : ''}"><td><b>${fmtDay(d).slice(0, 5)}</b> <span class="muted small">${parseDay(d).toLocaleDateString('vi-VN', { weekday: 'short' })}</span></td>
        ${SOC_CH.map(c => `<td class="num"><input class="ad-input soc-input" inputmode="numeric" data-day="${d}" data-ch="${c.id}" value="${getStat(d, c.id, metric) ? n0(getStat(d, c.id, metric)) : ''}" placeholder="0" aria-label="${c.name} ${fmtDay(d)}"></td>`).join('')}
        <td class="num" data-c="tot">${metric === 'followers' ? '—' : n0(SOC_CH.reduce((a, c) => a + getStat(d, c.id, metric), 0)) || '—'}</td></tr>`).join('')}</tbody></table></div></div>
    <details class="card help"><summary><b>Lấy số liệu ở đâu?</b></summary><ul>
      <li><b>Fanpage:</b> Meta Business Suite → <i>Thông tin chi tiết (Insights)</i> → chọn ngày: Lượt tiếp cận / lượt xem, Lượt tương tác, Tin nhắn mới, Lượt theo dõi.</li>
      <li><b>TikTok:</b> TikTok Studio (hoặc ứng dụng → <i>Công cụ cho nhà sáng tạo → Phân tích</i>): Lượt xem video, Lượt thích + bình luận + chia sẻ, Follower.</li>
      <li><b>YouTube:</b> YouTube Studio → <i>Số liệu phân tích</i> → Nâng cao, theo ngày: Lượt xem, Người đăng ký.</li>
      <li>“Tổng follower” chỉ cần nhập ngày nào bạn xem được (VD mỗi thứ Hai); app tự tính mức tăng giữa các lần nhập.</li></ul></details>`;
  const rows = $('#soc-rows');
  rows.addEventListener('focusin', e => { if (e.target.matches('.soc-input')) e.target.select(); });
  rows.addEventListener('change', e => {
    if (!e.target.matches('.soc-input')) return;
    const { day, ch } = e.target.dataset, v = Math.max(0, Math.round(parseMoney(e.target.value)));
    setStat(day, ch, metric, v); save(); e.target.value = v ? n0(v) : '';
    if (metric !== 'followers') e.target.closest('tr').querySelector('[data-c=tot]').textContent = n0(SOC_CH.reduce((a, c) => a + getStat(day, c.id, metric), 0)) || '—';
  });
  rows.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('.soc-input')) return;
    e.preventDefault(); e.target.dispatchEvent(new Event('change', { bubbles: true }));
    const next = e.target.closest('tr').nextElementSibling?.querySelector(`.soc-input[data-ch="${e.target.dataset.ch}"]`);
    if (next) next.focus(); else e.target.blur();
  });
}

/* ---------- Bài đăng ---------- */
function postModal(id, date) {
  const s = soc();
  const p = s.posts.find(x => x.id === id) || { channel: ui.socFilterCh !== 'all' ? ui.socFilterCh : 'fb', title: '', format: POST_FORMATS[0], pillar: POST_PILLARS[0], stage: date ? 'scheduled' : 'idea', date: date || '', time: '20:00', owner: '', products: '', content: '', link: '', views: 0, likes: 0, comments: 0, shares: 0, saves: 0, messages: 0 };
  const num = (k, l) => `<label>${l}<input name="${k}" inputmode="numeric" value="${p[k] ? n0(p[k]) : ''}" placeholder="0"></label>`;
  openModal(id ? 'Bài đăng ' + id : 'Bài đăng mới', `
    <form class="form" id="f-post">
      <label class="full">Tiêu đề / ý tưởng<input name="title" required value="${esc(p.title)}" placeholder="VD: Phối 3 outfit với váy ngủ lụa"></label>
      <label>Kênh<select name="channel">${SOC_CH.map(c => `<option value="${c.id}" ${p.channel === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></label>
      <label>Trạng thái<select name="stage">${POST_STAGES.map(x => `<option value="${x.key}" ${p.stage === x.key ? 'selected' : ''}>${x.label}</option>`).join('')}</select></label>
      <label>Định dạng<select name="format">${opts(POST_FORMATS, p.format)}</select></label>
      <label>Chủ đề nội dung<select name="pillar">${opts(POST_PILLARS, p.pillar)}</select></label>
      <label>Ngày đăng<input name="date" type="date" value="${esc(p.date)}"></label>
      <label>Giờ đăng<input name="time" type="time" value="${esc(p.time)}"></label>
      <label>Người phụ trách<input name="owner" value="${esc(p.owner)}"></label>
      <label>Sản phẩm / SKU nhắc tới<input name="products" value="${esc(p.products)}" placeholder="VD: DA1260, Bộ sơ mi lụa"></label>
      <label class="full">Kịch bản / caption<textarea name="content" rows="4">${esc(p.content)}</textarea></label>
      <label class="full">Link bài đã đăng<input name="link" type="url" value="${esc(p.link)}" placeholder="https://…"></label>
      <div class="section-t">Kết quả sau khi đăng</div>
      ${num('views', 'Lượt xem')}${num('likes', 'Lượt thích')}${num('comments', 'Bình luận')}${num('shares', 'Chia sẻ')}${num('saves', 'Lưu')}${num('messages', 'Tin nhắn / inbox')}
      <div class="form-actions">
        ${id ? `<button type="button" class="btn ghost danger" data-action="deletePost" data-id="${id}" style="margin-right:auto">Xóa</button>
          <button type="button" class="btn ghost" data-action="postToTask" data-id="${id}">Tạo việc trong Workflow</button>
          <select id="dup-ch" aria-label="Nhân bản sang kênh"><option value="">Nhân bản sang…</option>${SOC_CH.filter(c => c.id !== p.channel).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>` : ''}
        ${p.link ? `<a class="btn ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Mở bài ↗</a>` : ''}
        <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    const f = $('#f-post', body);
    $('#dup-ch', body)?.addEventListener('change', e => {
      if (!e.target.value) return;
      const copy = { ...p, id: nextId('BV', s.posts), channel: e.target.value, stage: p.stage === 'posted' ? 'scheduled' : p.stage, link: '', views: 0, likes: 0, comments: 0, shares: 0, saves: 0, messages: 0 };
      s.posts.push(copy); save(); toast('Đã nhân bản sang ' + socCh(copy.channel).name); rerender(); postModal(copy.id);
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      ['views', 'likes', 'comments', 'shares', 'saves', 'messages'].forEach(k => d[k] = Math.round(parseMoney(d[k])));
      Object.keys(d).forEach(k => typeof d[k] === 'string' && (d[k] = d[k].trim()));
      if (d.stage === 'posted' && !d.date) d.date = todayStr();
      if (id) Object.assign(p, d); else s.posts.push({ id: nextId('BV', s.posts), ...d });
      save(); closeModal(); toast('Đã lưu bài đăng'); rerender();
    });
  });
}

/* ---------- Đăng ký trang & hành động ---------- */
VIEWS.social = { title: 'Truyền thông Social', render: renderSocial };
Object.assign(ACTIONS, {
  setSocTab: d => { ui.socTab = d.t; rerender(); },
  setSocPeriod: d => { ui.socPeriod = d.p; rerender(); },
  setSocMetric: d => { ui.socMetric = d.m; rerender(); },
  socFilterCh: d => { ui.socFilterCh = d.c; rerender(); },
  socFilterStage: d => { ui.socFilterStage = ui.socFilterStage === d.s ? 'all' : d.s; rerender(); },
  socMonth: d => {
    if (d.d === '0') ui.socMonth = todayStr().slice(0, 7);
    else { const [y, m] = ui.socMonth.split('-').map(Number); ui.socMonth = ymd(new Date(y, m - 1 + +d.d, 1)).slice(0, 7); }
    rerender();
  },
  newPost: d => postModal(null, d.date || ''),
  editPost: d => postModal(d.id),
  advancePost: d => {
    const p = soc().posts.find(x => x.id === d.id); if (!p) return;
    const i = POST_STAGES.findIndex(x => x.key === p.stage);
    if (i < POST_STAGES.length - 1) p.stage = POST_STAGES[i + 1].key;
    if (p.stage === 'posted' && !p.date) p.date = todayStr();
    save(); toast(`${p.title} → ${postStage(p.stage).label}`); rerender();
    if (p.stage === 'posted') postModal(p.id);   // nhắc nhập link & kết quả
  },
  deletePost: d => { if (!confirm('Xóa bài đăng này?')) return; soc().posts = soc().posts.filter(p => p.id !== d.id); save(); closeModal(); rerender(); },
  postToTask: d => {
    const p = soc().posts.find(x => x.id === d.id); if (!p) return;
    state.tasks.push({ id: nextId('CV', state.tasks), title: `${socCh(p.channel).short}: ${p.title}`, desc: `${p.format} · ${p.pillar}${p.date ? ' · đăng ' + fmtDay(p.date) : ''}`,
      assignee: p.owner || 'Marketing', due: p.date && p.date >= todayStr() ? p.date : todayStr(), priority: 'medium', status: 'todo', orderId: '', createdAt: new Date().toISOString() });
    save(); toast('Đã tạo việc trong Workflow');
  },
  editTargets: () => {
    const s = soc();
    openModal('Chỉ tiêu số bài mỗi tuần', `<form class="form" id="f-tg">${SOC_CH.map(c => `<label>${c.name}<input name="${c.id}" type="number" min="0" value="${+s.targets[c.id] || 0}"></label>`).join('')}
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div></form>`, body => {
      $('#f-tg', body).addEventListener('submit', e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); SOC_CH.forEach(c => s.targets[c.id] = Math.max(0, +d[c.id] || 0)); save(); closeModal(); rerender(); });
    });
  },
});
