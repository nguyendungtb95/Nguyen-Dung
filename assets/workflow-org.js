'use strict';
/* =========================================================
   Workflow theo Phòng ban – Vị trí – Đầu việc định kỳ.
   state.org = {
     workdays: 'mon-sat' | 'all' | 'mon-fri',
     departments: [{ id, name, color }],
     positions:   [{ id, deptId, name, person, kpi }],
     routines:    [{ id, positionId, title, freq: 'daily'|'weekly'|'monthly', weekday 1–7, monthDay 1–31, time, priority, link, note }],
     done:        { 'YYYY-MM-DD': { routineId: ISO thời điểm hoàn thành } }
   }
   ========================================================= */

const WD_LABEL = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const FREQ_LABEL = { daily: 'Hằng ngày', weekly: 'Hằng tuần', monthly: 'Hằng tháng' };
const APP_LINKS = [['', '—'], ['#dashboard', 'Tổng quan'], ['#orders', 'Đơn hàng & Tracking'], ['#products', 'Sản phẩm & giá vốn'], ['#workflow', 'Workflow'],
  ['#social', 'Truyền thông Social'], ['#ads', 'Chi phí quảng cáo'], ['#finance', 'Thu – Chi'], ['#customers', 'Khách hàng'], ['#settings', 'Dữ liệu']];
ui.wfTab = ui.wfTab || 'today';
ui.wfDay = ui.wfDay || todayStr();
ui.wfDept = ui.wfDept || 'all';

// Mô hình gợi ý cho shop thời trang online nhỏ (3–8 người, 1 người có thể kiêm nhiều vị trí)
const ORG_TEMPLATE = [
  { dept: 'Ban điều hành', color: '#b4553b', positions: [
    { name: 'Chủ shop / Quản lý', kpi: 'Doanh thu & lãi ròng tháng đạt kế hoạch · biên lãi ròng ≥ 15% · tồn kho không quá 60 ngày bán', routines: [
      ['Xem Tổng quan: doanh thu, lãi, đơn cần xử lý hôm qua – hôm nay', 'daily', '08:30', 'high', '#dashboard'],
      ['Duyệt nội dung / bài đăng đang chờ duyệt', 'daily', '10:00', 'medium', '#social'],
      ['Xem hiệu quả Ads, quyết định tăng / giảm ngân sách', 'daily', '17:00', 'high', '#ads'],
      ['Họp giao ban tuần: doanh thu, lãi, tồn kho, kế hoạch nội dung & khuyến mãi', 'weekly', '09:00', 'high', '#finance', 1],
      ['Duyệt kế hoạch nhập hàng tuần (mã bán chạy, mã sắp hết)', 'weekly', '15:00', 'medium', '#products', 4],
      ['Chốt báo cáo lãi lỗ tháng trước & đặt mục tiêu tháng này', 'monthly', '09:00', 'high', '#finance', null, 2],
    ] },
  ] },
  { dept: 'Bán hàng & CSKH', color: '#2563eb', positions: [
    { name: 'Nhân viên CSKH online', kpi: 'Phản hồi inbox < 5 phút trong giờ làm · tỷ lệ inbox → đơn ≥ 20% · đánh giá shop ≥ 4,8★', routines: [
      ['Trả lời inbox & bình luận Fanpage, TikTok, chat Shopee (ca sáng)', 'daily', '08:00', 'high', '#social'],
      ['Chốt đơn & tạo đơn trong app (Facebook + SPX), điền Mã khách hàng = mã đơn trên SPX', 'daily', '09:00', 'high', '#orders'],
      ['Gọi xác nhận đơn COD giá trị lớn / khách mới', 'daily', '10:30', 'medium', '#orders'],
      ['Trả lời inbox & bình luận (ca chiều – tối)', 'daily', '14:00', 'high', '#social'],
      ['Xin feedback khách vừa nhận hàng, ghi chăm sóc', 'daily', '16:00', 'medium', '#customers'],
      ['Xử lý yêu cầu đổi trả / khiếu nại', 'daily', '16:30', 'high', '#orders'],
      ['Trả lời đánh giá sản phẩm trên Shopee', 'daily', '17:30', 'low', ''],
      ['Chăm sóc khách VIP & khách lâu chưa mua (gửi ưu đãi riêng)', 'weekly', '15:00', 'medium', '#customers', 5],
    ] },
  ] },
  { dept: 'Kho & Vận hành', color: '#7c3aed', positions: [
    { name: 'Nhân viên kho – đóng gói', kpi: '100% đơn xác nhận trước 15h được bàn giao trong ngày · sai sót đóng gói < 0,5% · hàng hoàn xử lý trong 24h', routines: [
      ['Kiểm đơn mới, in phiếu & đóng gói đơn Shopee / SPX', 'daily', '09:00', 'high', '#orders'],
      ['Bàn giao hàng cho shipper trước giờ lấy hàng', 'daily', '15:00', 'high', ''],
      ['Chuyển trạng thái đơn đã bàn giao, dán mã vận đơn vào app', 'daily', '15:30', 'medium', '#orders'],
      ['Nhận & kiểm hàng hoàn, cập nhật trạng thái hoàn trả', 'daily', '16:30', 'medium', '#orders'],
      ['Đối soát tiền COD SPX / GHN', 'weekly', '10:00', 'high', '#finance', 2],
      ['Kiểm kê tồn các mã bán chạy, báo mã sắp hết hàng', 'weekly', '10:00', 'medium', '#products', 3],
      ['Nhận hàng nhập từ nhà cung cấp, kiểm chất lượng (QC), xếp kho', 'weekly', '14:00', 'medium', '', 4],
    ] },
  ] },
  { dept: 'Marketing', color: '#d97706', positions: [
    { name: 'Content & Media', kpi: 'Đủ chỉ tiêu số bài / tuần từng kênh · tỷ lệ tương tác ≥ 5% · follower tăng đều', routines: [
      ['Nhập số liệu kênh hôm qua (lượt xem, tương tác, tin nhắn)', 'daily', '09:30', 'low', '#social'],
      ['Đăng bài theo lịch & cập nhật link, kết quả bài hôm qua', 'daily', '11:00', 'high', '#social'],
      ['Quay / chụp nội dung theo kịch bản', 'daily', '13:30', 'medium', '#social'],
      ['Báo cáo tuần: top bài, follower, tin nhắn, bài học', 'weekly', '08:30', 'medium', '#social', 1],
      ['Lên lịch nội dung tuần sau, viết kịch bản', 'weekly', '10:00', 'high', '#social', 5],
      ['Livestream bán hàng', 'weekly', '20:00', 'high', '#social', 5],
    ] },
    { name: 'Quảng cáo (Ads)', kpi: 'ROAS ≥ 4x · chi phí Ads ≤ 15% doanh thu · chi phí / đơn giảm dần', routines: [
      ['Nhập chi phí Ads hôm qua (Facebook, TikTok, Shopee)', 'daily', '09:00', 'high', '#ads'],
      ['Kiểm tra ROAS, tắt nhóm quảng cáo kém, tăng ngân sách nhóm tốt', 'daily', '10:00', 'high', '#ads'],
      ['Làm mẫu quảng cáo mới (creative) từ bài đăng hiệu quả nhất tuần', 'weekly', '14:00', 'medium', '#social', 3],
    ] },
  ] },
  { dept: 'Sàn TMĐT', color: '#ee4d2d', positions: [
    { name: 'Vận hành Shopee / TikTok Shop', kpi: 'Tỷ lệ phản hồi chat ≥ 95% · giao trễ < 2% · không bị điểm phạt', routines: [
      ['Xác nhận đơn, kiểm tra đơn sắp trễ hạn giao trên Kênh Người Bán (2 shop)', 'daily', '08:30', 'high', ''],
      ['Cập nhật tồn kho, ẩn mã hết hàng trên sàn', 'daily', '11:30', 'medium', '#products'],
      ['Xuất file đơn Shopee 2 shop & nhập vào app', 'daily', '17:00', 'high', '#orders'],
      ['Kiểm tra chỉ số shop: tỷ lệ phản hồi, giao trễ, điểm phạt', 'weekly', '10:00', 'medium', '', 1],
      ['Tải báo cáo vận đơn SPX & nhập vào app', 'weekly', '16:00', 'medium', '#orders', 1],
      ['Đăng ký chương trình: flash sale, voucher, khuyến mãi của sàn', 'weekly', '14:00', 'medium', '', 2],
      ['Tối ưu tiêu đề, ảnh, giá cho sản phẩm bán chậm', 'weekly', '10:00', 'low', '#products', 4],
    ] },
  ] },
  { dept: 'Kế toán', color: '#16a34a', positions: [
    { name: 'Kế toán (bán thời gian)', kpi: 'Sổ thu chi khớp tiền thực tế · báo cáo lãi lỗ tháng trước ngày 5 · giá vốn luôn cập nhật', routines: [
      ['Ghi các khoản thu chi phát sinh trong ngày', 'daily', '18:00', 'medium', '#finance'],
      ['Đối soát tiền Shopee về tài khoản (2 shop)', 'weekly', '10:00', 'high', '#finance', 5],
      ['Cập nhật giá vốn từ bảng nhập hàng', 'weekly', '14:00', 'medium', '#products', 5],
      ['Sao lưu dữ liệu app (Dữ liệu → Xuất file JSON)', 'weekly', '17:00', 'high', '#settings', 6],
      ['Tính lương, thưởng KPI nhân viên', 'monthly', '10:00', 'high', '#finance', null, 5],
    ] },
  ] },
];

function org() {
  if (!state.org || typeof state.org !== 'object') state.org = {};
  const o = state.org;
  o.workdays = o.workdays || 'mon-sat';
  o.departments = o.departments || []; o.positions = o.positions || []; o.routines = o.routines || []; o.done = o.done || {};
  return o;
}
function applyOrgTemplate() {
  const o = org();
  o.departments = []; o.positions = []; o.routines = [];
  let d = 0, p = 0, r = 0;
  ORG_TEMPLATE.forEach(dt => {
    const dept = { id: 'PB' + pad(++d, 2), name: dt.dept, color: dt.color };
    o.departments.push(dept);
    dt.positions.forEach(ps => {
      const pos = { id: 'VT' + pad(++p, 2), deptId: dept.id, name: ps.name, person: '', kpi: ps.kpi };
      o.positions.push(pos);
      ps.routines.forEach(([title, freq, time, priority, link, weekday, monthDay]) =>
        o.routines.push({ id: 'DV' + pad(++r, 3), positionId: pos.id, title, freq, time, priority, link, weekday: weekday || 1, monthDay: monthDay || 1, note: '' }));
    });
  });
  save();
}

const posById = id => org().positions.find(p => p.id === id);
const deptById = id => org().departments.find(d => d.id === id);
const isoWeekday = day => ((parseDay(day).getDay() + 6) % 7) + 1;   // 1 = Thứ 2 … 7 = Chủ nhật
function isWorkday(day) {
  const w = isoWeekday(day), m = org().workdays;
  return m === 'all' || (m === 'mon-sat' ? w <= 6 : w <= 5);
}
function dueOn(rt, day) {
  if (rt.freq === 'daily') return isWorkday(day);
  if (rt.freq === 'weekly') return isoWeekday(day) === +rt.weekday;
  if (rt.freq === 'monthly') {
    const d = parseDay(day), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === Math.min(+rt.monthDay || 1, last);
  }
  return false;
}
const isDone = (day, id) => !!(org().done[day] || {})[id];
function dueList(day, deptFilter = 'all') {
  return org().routines.filter(rt => dueOn(rt, day) && (deptFilter === 'all' || posById(rt.positionId)?.deptId === deptFilter))
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));
}
// Tỷ lệ hoàn thành của 1 vị trí trong n ngày gần nhất (tính đến hôm nay)
function completion(posId, n = 7) {
  let due = 0, done = 0;
  for (let k = 0; k < n; k++) {
    const day = ymd(addDays(new Date(), -k));
    org().routines.filter(rt => rt.positionId === posId && dueOn(rt, day)).forEach(rt => { due++; if (isDone(day, rt.id)) done++; });
  }
  return due ? done / due : null;
}
const freqText = rt => rt.freq === 'weekly' ? `Hằng tuần · ${WD_LABEL[+rt.weekday]}` : rt.freq === 'monthly' ? `Hằng tháng · ngày ${rt.monthDay}` : 'Hằng ngày';
const personOf = p => p ? (p.person || p.name) : '—';

// Dòng tóm tắt trên trang Tổng quan
function orgTodaySummary() {
  if (!state.org || !org().routines.length) return '';
  const day = todayStr(), list = dueList(day), done = list.filter(rt => isDone(day, rt.id)).length;
  const now = new Date().toTimeString().slice(0, 5), late = list.filter(rt => !isDone(day, rt.id) && rt.time && rt.time < now).length;
  return `<h3 style="margin:16px 0 6px">Đầu việc định kỳ hôm nay</h3>
    <ul class="list"><li class="clickable" data-action="wfOpenToday"><span>${done}/${list.length} việc đã xong${late ? ` · <span class="delta down">${late} việc quá giờ</span>` : ''}</span><span class="meta">Mở checklist →</span></li></ul>`;
}

/* ---------- Giao diện ---------- */
function renderWorkflowOrg(el) {
  const o = org();
  const tabs = [['today', 'Việc hôm nay'], ['board', 'Bảng công việc'], ['org', 'Phòng ban & vị trí'], ['routines', 'Đầu việc định kỳ']];
  el.innerHTML = `<div class="toolbar"><div class="seg">${tabs.map(([k, l]) => `<button class="${ui.wfTab === k ? 'on' : ''}" data-action="wfTab" data-t="${k}">${l}</button>`).join('')}</div></div>
    <div id="wf-body" class="view"></div>`;
  const body = $('#wf-body');
  if (ui.wfTab === 'board') { renderWorkflow(body); return; }
  if (!o.positions.length) {
    body.innerHTML = `<div class="card"><h3>Chưa thiết lập phòng ban & đầu việc</h3>
      <p class="muted">Áp dụng mô hình gợi ý cho shop thời trang online nhỏ: <b>6 phòng ban · 7 vị trí · ${ORG_TEMPLATE.reduce((s, d) => s + d.positions.reduce((a, p) => a + p.routines.length, 0), 0)} đầu việc định kỳ</b>
        (Ban điều hành, Bán hàng & CSKH, Kho & Vận hành, Marketing, Sàn TMĐT, Kế toán). Sau đó bạn gán tên nhân sự, sửa giờ / xóa / thêm việc cho phù hợp. Một người có thể kiêm nhiều vị trí.</p>
      <div class="toolbar"><button class="btn primary" data-action="wfApplyTemplate">Áp dụng mô hình gợi ý</button><button class="btn ghost" data-action="wfNewDept">Tự tạo từ đầu</button></div></div>`;
    return;
  }
  ({ today: wfToday, org: wfOrg, routines: wfRoutines })[ui.wfTab](body);
}

function deptSeg() {
  return `<div class="seg">${[['all', 'Tất cả'], ...org().departments.map(d => [d.id, d.name])].map(([k, l]) => `<button class="${ui.wfDept === k ? 'on' : ''}" data-action="wfDept" data-d="${k}">${esc(l)}</button>`).join('')}</div>`;
}

function wfToday(el) {
  const o = org(), day = ui.wfDay, today = todayStr(), list = dueList(day, ui.wfDept);
  const now = new Date().toTimeString().slice(0, 5);
  const done = list.filter(rt => isDone(day, rt.id)).length;
  const groups = o.positions.filter(p => list.some(rt => rt.positionId === p.id));
  el.innerHTML = `
    <div class="toolbar">
      <div class="daynav"><button class="btn sm" data-action="wfDay" data-d="-1" aria-label="Ngày trước">‹</button>
        <b class="cal-month">${day === today ? 'Hôm nay · ' : ''}${WD_LABEL[isoWeekday(day)]}, ${fmtDay(day)}</b>
        <button class="btn sm" data-action="wfDay" data-d="1" aria-label="Ngày sau">›</button>${day !== today ? '<button class="btn sm ghost" data-action="wfDay" data-d="0">Hôm nay</button>' : ''}</div>
      <span class="grow"></span>${deptSeg()}</div>
    <div class="kpis">
      ${kpi('Hoàn thành', `${done}/${list.length}`, list.length ? pct(done / list.length) : 'Không có việc định kỳ')}
      ${kpi('Còn lại', list.length - done, day === today ? `${list.filter(rt => !isDone(day, rt.id) && rt.time && rt.time < now).length} việc đã quá giờ` : '')}
      ${kpi('Việc ưu tiên cao', list.filter(rt => rt.priority === 'high').length, `${list.filter(rt => rt.priority === 'high' && isDone(day, rt.id)).length} đã xong`)}
      ${kpi('Ngày làm việc', isWorkday(day) ? 'Có' : 'Nghỉ', { 'mon-sat': 'Thứ 2 – Thứ 7', 'mon-fri': 'Thứ 2 – Thứ 6', all: 'Cả tuần' }[o.workdays])}
    </div>
    <div class="wf-groups">${groups.map(p => {
      const d = deptById(p.deptId) || {}, items = list.filter(rt => rt.positionId === p.id), dn = items.filter(rt => isDone(day, rt.id)).length;
      return `<div class="card wf-group" style="--c:${d.color || 'var(--muted)'}">
        <div class="card-h"><div><h3>${esc(p.name)}</h3><span class="muted small">${esc(d.name || '')} · ${esc(personOf(p))}</span></div><b class="wf-pct">${dn}/${items.length}</b></div>
        <div class="hbar-t"><i style="width:${items.length ? dn / items.length * 100 : 0}%;background:var(--c)"></i></div>
        <ul class="wf-check">${items.map(rt => {
          const ok = isDone(day, rt.id), late = !ok && day === today && rt.time && rt.time < now;
          return `<li class="${ok ? 'ok' : ''} ${late ? 'late' : ''}">
            <label><input type="checkbox" data-rt="${rt.id}" ${ok ? 'checked' : ''}><span class="wf-time">${esc(rt.time || '')}</span>
              <span class="wf-t">${esc(rt.title)}${rt.freq !== 'daily' ? ` <span class="chip">${rt.freq === 'weekly' ? 'Tuần' : 'Tháng'}</span>` : ''}${rt.priority === 'high' ? ' <span class="prio p-high">Gấp</span>' : ''}</span></label>
            ${rt.link ? `<a class="btn ghost sm" href="${rt.link}">Mở →</a>` : ''}</li>`;
        }).join('')}</ul></div>`;
    }).join('') || `<div class="card"><p class="empty">${isWorkday(day) ? 'Không có đầu việc định kỳ cho ngày này' : 'Ngày nghỉ – không có việc hằng ngày'}</p></div>`}</div>`;
  el.addEventListener('change', e => {
    if (!e.target.matches('[data-rt]')) return;
    const id = e.target.dataset.rt, m = (o.done[day] = o.done[day] || {});
    if (e.target.checked) m[id] = new Date().toISOString(); else delete m[id];
    if (!Object.keys(m).length) delete o.done[day];
    save(); rerender();
  });
}

function wfOrg(el) {
  const o = org();
  el.innerHTML = `
    <div class="toolbar"><span class="muted">Ngày làm việc:</span>
      <select id="wf-workdays">${[['mon-sat', 'Thứ 2 – Thứ 7'], ['mon-fri', 'Thứ 2 – Thứ 6'], ['all', 'Cả tuần']].map(([k, l]) => `<option value="${k}" ${o.workdays === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <span class="grow"></span><button class="btn" data-action="wfNewDept">+ Phòng ban</button><button class="btn primary" data-action="wfNewPos">+ Vị trí</button></div>
    <div class="wf-org">${o.departments.map(d => {
      const ps = o.positions.filter(p => p.deptId === d.id);
      return `<div class="card wf-dept" style="--c:${d.color}">
        <div class="card-h"><h3>${esc(d.name)}</h3><button class="btn ghost sm" data-action="wfEditDept" data-id="${d.id}">Sửa</button></div>
        ${ps.map(p => {
          const rts = o.routines.filter(r => r.positionId === p.id), c = completion(p.id);
          return `<div class="wf-pos">
            <div class="card-h"><div><b>${esc(p.name)}</b><div class="muted small">${p.person ? '👤 ' + esc(p.person) : '<span class="delta down">Chưa gán người phụ trách</span>'}</div></div>
              <div style="text-align:right"><b class="${c != null && c < .7 ? 'delta down' : ''}">${c != null ? pct(c) : '—'}</b><div class="muted small">hoàn thành 7 ngày</div></div></div>
            ${p.kpi ? `<p class="small"><b>KPI:</b> ${esc(p.kpi)}</p>` : ''}
            <p class="muted small">${rts.filter(r => r.freq === 'daily').length} việc hằng ngày · ${rts.filter(r => r.freq === 'weekly').length} hằng tuần · ${rts.filter(r => r.freq === 'monthly').length} hằng tháng</p>
            <div class="toolbar"><button class="btn sm" data-action="wfEditPos" data-id="${p.id}">Sửa vị trí</button><button class="btn sm ghost" data-action="wfShowRoutines" data-id="${p.id}">Xem đầu việc</button></div></div>`;
        }).join('') || '<p class="empty">Chưa có vị trí</p>'}</div>`;
    }).join('')}</div>
    <div class="toolbar"><button class="btn ghost danger sm" data-action="wfReset">Thiết lập lại theo mô hình gợi ý</button></div>`;
  $('#wf-workdays').addEventListener('change', e => { o.workdays = e.target.value; save(); toast('Đã lưu ngày làm việc'); });
}

function wfRoutines(el) {
  const o = org(), only = ui.wfPos;
  const pos = o.positions.filter(p => (!only || p.id === only) && (ui.wfDept === 'all' || p.deptId === ui.wfDept));
  el.innerHTML = `
    <div class="toolbar">${deptSeg()}<span class="grow"></span>${only ? `<button class="btn ghost sm" data-action="wfShowRoutines" data-id="">Hiện tất cả vị trí ×</button>` : ''}
      <button class="btn primary" data-action="wfNewRoutine">+ Đầu việc</button></div>
    ${pos.map(p => {
      const d = deptById(p.deptId) || {}, rts = o.routines.filter(r => r.positionId === p.id)
        .sort((a, b) => ['daily', 'weekly', 'monthly'].indexOf(a.freq) - ['daily', 'weekly', 'monthly'].indexOf(b.freq) || (+a.weekday - +b.weekday) || String(a.time).localeCompare(String(b.time)));
      return `<div class="card flush wf-dept" style="--c:${d.color || 'var(--muted)'}"><div class="card-h" style="padding:14px 16px 0"><div><h3>${esc(p.name)}</h3><span class="muted small">${esc(d.name || '')} · ${esc(personOf(p))}</span></div>
        <button class="btn sm" data-action="wfNewRoutine" data-pos="${p.id}">+ Thêm việc</button></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Giờ</th><th>Đầu việc</th><th>Tần suất</th><th>Ưu tiên</th><th>Mở trang</th></tr></thead><tbody>
        ${rts.map(r => `<tr data-action="wfEditRoutine" data-id="${r.id}"><td class="mono">${esc(r.time || '')}</td><td class="prod-name">${esc(r.title)}${r.note ? `<div class="muted small">${esc(r.note)}</div>` : ''}</td>
          <td>${freqText(r)}</td><td><span class="prio p-${r.priority}">${PRIO[r.priority] || ''}</span></td><td class="muted small">${esc((APP_LINKS.find(l => l[0] === r.link) || ['', ''])[1])}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Chưa có đầu việc</td></tr>'}
        </tbody></table></div></div>`;
    }).join('')}`;
}

/* ---------- Modal sửa ---------- */
function deptModal(id) {
  const o = org(), d = deptById(id) || { name: '', color: '#64748b' };
  openModal(id ? 'Sửa phòng ban' : 'Phòng ban mới', `<form class="form" id="f-dept">
    <label>Tên phòng ban<input name="name" required value="${esc(d.name)}"></label><label>Màu<input name="color" type="color" value="${esc(d.color)}"></label>
    <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="wfDelDept" data-id="${id}" style="margin-right:auto">Xóa</button>` : ''}
      <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div></form>`, body => {
    $('#f-dept', body).addEventListener('submit', e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      if (id) Object.assign(d, { name: f.name.trim(), color: f.color }); else o.departments.push({ id: nextId('PB', o.departments, 2), name: f.name.trim(), color: f.color });
      save(); closeModal(); rerender();
    });
  });
}
function posModal(id) {
  const o = org(), p = posById(id) || { deptId: o.departments[0]?.id || '', name: '', person: '', kpi: '' };
  if (!o.departments.length) { toast('Tạo phòng ban trước'); deptModal(); return; }
  const people = [...new Set(o.positions.map(x => x.person).filter(Boolean))];
  openModal(id ? 'Sửa vị trí' : 'Vị trí mới', `<form class="form" id="f-pos">
    <label>Thuộc phòng ban<select name="deptId">${o.departments.map(d => `<option value="${d.id}" ${p.deptId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
    <label>Tên vị trí<input name="name" required value="${esc(p.name)}"></label>
    <label class="full">Người phụ trách<input name="person" list="wf-people" value="${esc(p.person)}" placeholder="VD: Lan (một người có thể kiêm nhiều vị trí)">
      <datalist id="wf-people">${people.map(n => `<option value="${esc(n)}">`).join('')}</datalist></label>
    <label class="full">KPI / mục tiêu của vị trí<textarea name="kpi" rows="3">${esc(p.kpi)}</textarea></label>
    <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="wfDelPos" data-id="${id}" style="margin-right:auto">Xóa vị trí</button>` : ''}
      <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div></form>`, body => {
    $('#f-pos', body).addEventListener('submit', e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); Object.keys(f).forEach(k => f[k] = f[k].trim());
      if (id) Object.assign(p, f); else o.positions.push({ id: nextId('VT', o.positions, 2), ...f });
      save(); closeModal(); rerender();
    });
  });
}
function routineModal(id, posId) {
  const o = org(), r = o.routines.find(x => x.id === id) || { positionId: posId || ui.wfPos || o.positions[0]?.id, title: '', freq: 'daily', weekday: 1, monthDay: 1, time: '09:00', priority: 'medium', link: '', note: '' };
  openModal(id ? 'Sửa đầu việc' : 'Đầu việc mới', `<form class="form" id="f-rt">
    <label class="full">Đầu việc<input name="title" required value="${esc(r.title)}"></label>
    <label>Vị trí phụ trách<select name="positionId">${o.positions.map(p => `<option value="${p.id}" ${r.positionId === p.id ? 'selected' : ''}>${esc((deptById(p.deptId) || {}).name || '')} · ${esc(p.name)}</option>`).join('')}</select></label>
    <label>Tần suất<select name="freq">${Object.entries(FREQ_LABEL).map(([k, l]) => `<option value="${k}" ${r.freq === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="rt-weekly">Vào thứ<select name="weekday">${WD_LABEL.slice(1).map((l, i) => `<option value="${i + 1}" ${+r.weekday === i + 1 ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="rt-monthly">Vào ngày (trong tháng)<input name="monthDay" type="number" min="1" max="31" value="${+r.monthDay || 1}"></label>
    <label>Giờ làm<input name="time" type="time" value="${esc(r.time)}"></label>
    <label>Ưu tiên<select name="priority">${Object.entries(PRIO).map(([k, l]) => `<option value="${k}" ${r.priority === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label>Mở trang trong app<select name="link">${APP_LINKS.map(([k, l]) => `<option value="${k}" ${r.link === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="full">Ghi chú / cách làm<textarea name="note" rows="3">${esc(r.note)}</textarea></label>
    <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="wfDelRoutine" data-id="${id}" style="margin-right:auto">Xóa</button>` : ''}
      <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div></form>`, body => {
    const f = $('#f-rt', body);
    const toggle = () => { $('.rt-weekly', body).style.display = f.freq.value === 'weekly' ? '' : 'none'; $('.rt-monthly', body).style.display = f.freq.value === 'monthly' ? '' : 'none'; };
    toggle(); f.freq.addEventListener('change', toggle);
    f.addEventListener('submit', e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f));
      d.title = d.title.trim(); d.note = d.note.trim(); d.weekday = +d.weekday; d.monthDay = Math.min(31, Math.max(1, +d.monthDay || 1));
      if (id) Object.assign(r, d); else o.routines.push({ id: nextId('DV', o.routines, 3), ...d });
      save(); closeModal(); rerender();
    });
  });
}

/* ---------- Đăng ký ---------- */
VIEWS.workflow = { title: 'Workflow công việc', render: renderWorkflowOrg };
Object.assign(ACTIONS, {
  wfTab: d => { ui.wfTab = d.t; rerender(); },
  wfDept: d => { ui.wfDept = d.d; rerender(); },
  wfDay: d => { ui.wfDay = d.d === '0' ? todayStr() : ymd(addDays(parseDay(ui.wfDay), +d.d)); rerender(); },
  wfOpenToday: () => { ui.wfTab = 'today'; ui.wfDay = todayStr(); if (location.hash !== '#workflow') location.hash = '#workflow'; else rerender(); },
  wfApplyTemplate: () => { applyOrgTemplate(); toast('Đã áp dụng mô hình gợi ý – hãy gán người phụ trách cho từng vị trí'); ui.wfTab = 'org'; rerender(); },
  wfReset: () => { if (!confirm('Thay toàn bộ phòng ban, vị trí, đầu việc bằng mô hình gợi ý? (Lịch sử hoàn thành giữ nguyên nhưng có thể không khớp mã việc mới)')) return; applyOrgTemplate(); rerender(); },
  wfNewDept: () => deptModal(), wfEditDept: d => deptModal(d.id),
  wfNewPos: () => posModal(), wfEditPos: d => posModal(d.id),
  wfNewRoutine: d => routineModal(null, d.pos), wfEditRoutine: d => routineModal(d.id),
  wfShowRoutines: d => { ui.wfPos = d.id || ''; ui.wfTab = 'routines'; rerender(); },
  wfDelDept: d => {
    const o = org();
    if (o.positions.some(p => p.deptId === d.id)) { toast('Phòng ban còn vị trí – chuyển hoặc xóa vị trí trước'); return; }
    if (!confirm('Xóa phòng ban?')) return; o.departments = o.departments.filter(x => x.id !== d.id); save(); closeModal(); rerender();
  },
  wfDelPos: d => {
    const o = org(), n = o.routines.filter(r => r.positionId === d.id).length;
    if (!confirm(`Xóa vị trí này${n ? ` cùng ${n} đầu việc` : ''}?`)) return;
    o.positions = o.positions.filter(p => p.id !== d.id); o.routines = o.routines.filter(r => r.positionId !== d.id); save(); closeModal(); rerender();
  },
  wfDelRoutine: d => { if (!confirm('Xóa đầu việc?')) return; org().routines = org().routines.filter(r => r.id !== d.id); save(); closeModal(); rerender(); },
});
