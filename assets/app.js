'use strict';
/* =========================================================
   Fashion Store Manager – single-page app, dữ liệu lưu trong
   localStorage của trình duyệt (xuất/nhập JSON để sao lưu).
   ========================================================= */

/* ---------- Hằng số ---------- */
const STORE_KEY = 'fsm-data-v1';
const STATUSES = [
  { key: 'new',       label: 'Mới',         color: '#64748b' },
  { key: 'confirmed', label: 'Đã xác nhận', color: '#2563eb' },
  { key: 'packing',   label: 'Đóng gói',    color: '#7c3aed' },
  { key: 'shipping',  label: 'Đang giao',   color: '#d97706' },
  { key: 'delivered', label: 'Đã giao',     color: '#16a34a' },
  { key: 'returned',  label: 'Hoàn trả',    color: '#dc2626' },
  { key: 'cancelled', label: 'Đã hủy',      color: '#9ca3af' },
];
const FLOW = ['new', 'confirmed', 'packing', 'shipping', 'delivered'];
const TASK_COLS = [
  { key: 'todo', label: 'Cần làm' }, { key: 'doing', label: 'Đang làm' },
  { key: 'review', label: 'Chờ duyệt' }, { key: 'done', label: 'Hoàn thành' },
];
const PRIO = { high: 'Gấp', medium: 'Vừa', low: 'Thấp' };
const CHANNELS = ['Website', 'Facebook', 'Instagram', 'Shopee', 'TikTok Shop', 'Tại cửa hàng'];
const CARRIERS = ['GHN', 'GHTK', 'Viettel Post', 'J&T Express', 'Ninja Van', 'SPX Express', 'beDelivery', 'Xanh SM', 'Tự giao'];
const AFFILIATE_CAT = 'Hoa hồng Affiliate / KOC';
const EXPENSE_CATS = ['Nhập hàng', 'Quảng cáo', AFFILIATE_CAT, 'Phí sàn TMĐT', 'Vận chuyển', 'Mặt bằng', 'Lương nhân viên', 'Bao bì', 'Thuế', 'Khác'];
const INCOME_CATS = ['Bán sỉ', 'Thanh lý', 'Thu khác'];
const CARE_TYPES = ['Gọi điện', 'Nhắn tin', 'Tư vấn', 'Gửi ưu đãi', 'Xin feedback', 'Xử lý khiếu nại'];
const SIZES = ['S', 'M', 'L', 'XL', 'Free'];
const PRODUCTS = [
  ['Áo thun basic', 189000], ['Áo sơ mi linen', 359000], ['Quần jeans slim', 459000],
  ['Váy hoa midi', 429000], ['Chân váy xếp ly', 299000], ['Áo khoác blazer', 689000],
  ['Quần short kaki', 249000], ['Đầm suông công sở', 519000], ['Áo len cổ lọ', 389000], ['Túi tote canvas', 159000],
];
const WF_TEMPLATES = [
  { name: 'Ra mắt BST mới', tasks: ['Chốt mẫu & số lượng với xưởng', 'Kiểm hàng, gắn tag size', 'Chụp ảnh lookbook', 'Viết mô tả & đăng sản phẩm lên web', 'Lên bài quảng cáo Facebook/TikTok'] },
  { name: 'Nhập hàng định kỳ', tasks: ['Kiểm tồn kho, lập danh sách cần nhập', 'Đặt hàng nhà cung cấp', 'Nhận & kiểm hàng', 'Cập nhật tồn kho và giá vốn'] },
  { name: 'Xử lý đổi trả', tasks: ['Xác nhận yêu cầu đổi trả với khách', 'Nhận hàng hoàn & kiểm tra', 'Hoàn tiền / gửi hàng đổi', 'Ghi lý do vào hồ sơ khách'] },
  { name: 'Chăm sóc KH cuối tuần', tasks: ['Lọc khách VIP chưa mua 30 ngày', 'Gửi ưu đãi riêng', 'Gọi xin feedback đơn gần nhất'] },
];
const PERIODS = [['today', 'Hôm nay'], ['yesterday', 'Hôm qua'], ['7d', '7 ngày'], ['30d', '30 ngày'], ['month', 'Tháng này'], ['lastmonth', 'Tháng trước'], ['custom', 'Tùy chọn…']];
const MKT_STAGES = [
  { key: 'idea',       label: 'Ý tưởng',           color: '#64748b' },
  { key: 'production', label: 'Sản xuất nội dung', color: '#7c3aed' },
  { key: 'review',     label: 'Chờ duyệt',         color: '#2563eb' },
  { key: 'running',    label: 'Đang chạy',         color: '#d97706' },
  { key: 'done',       label: 'Kết thúc',          color: '#16a34a' },
  { key: 'paused',     label: 'Tạm dừng',          color: '#9ca3af' },
];
const MKT_FLOW = ['idea', 'production', 'review', 'running', 'done'];
const MKT_FORMATS = ['Quảng cáo trả phí', 'Livestream', 'KOL / KOC', 'Nội dung tự nhiên', 'Khuyến mãi / Voucher', 'Email / Zalo'];
const MKT_OBJECTIVES = ['Doanh số', 'Nhận diện thương hiệu', 'Thu hút khách mới', 'Giữ chân khách hàng', 'Xả tồn kho'];
const MKT_CHECKLIST = ['Xác định mục tiêu & KPI', 'Chuẩn bị nội dung (ảnh / video / caption)', 'Duyệt nội dung & ngân sách', 'Thiết lập chạy (target, lịch đăng)', 'Theo dõi & tối ưu hằng ngày', 'Đánh giá kết quả & rút kinh nghiệm'];

/* ---------- Tiện ích ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n, w = 2) => String(n).padStart(w, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => ymd(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseDay = s => new Date(s + 'T00:00:00');
const dayOf = iso => ymd(new Date(iso));
const fmtDay = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';
const fmtDT = iso => new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const money = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' ₫';
const shortMoney = n => {
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e9) return s + (a / 1e9).toFixed(1) + ' tỷ';
  if (a >= 1e6) return s + (a / 1e6).toFixed(1) + ' tr';
  if (a >= 1e3) return s + Math.round(a / 1e3) + 'k';
  return s + a;
};
const pct = x => (x * 100).toFixed(1).replace('.', ',') + '%';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const opts = (list, sel) => list.map(v => `<option ${v === sel ? 'selected' : ''}>${esc(v)}</option>`).join('');
const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 864e5);

function nextId(prefix, list, width = 4) {
  // Chỉ xét mã cùng tiền tố (đơn nhập từ sàn giữ nguyên mã sàn, không ảnh hưởng số thứ tự)
  const re = new RegExp('^' + prefix + '(\\d+)$');
  const max = list.reduce((m, x) => { const r = re.exec(String(x.id)); return r ? Math.max(m, +r[1]) : m; }, 0);
  return prefix + pad(max + 1, width);
}
// adjust = phụ thu (VD tiền COD SPX cao hơn giá trong danh sách hàng) – cộng vào đơn, không phải sản phẩm
const orderTotal = o => o.items.reduce((s, i) => s + i.qty * i.price, 0) + (+o.shippingFee || 0) + (+o.adjust || 0) - (+o.discount || 0);
/* Thuế (hộ kinh doanh): sales = % trên doanh thu (1% GTGT + 0,5% TNCN), feeVat = % thuế sàn tính trên phí sàn,
   salesChannels = [] nghĩa là áp dụng mọi kênh. Thuế quảng cáo đặt theo từng tài khoản Ads (accTax). */
// feeVat = 0: phí trong file đơn hàng Shopee ĐÃ gồm thuế (kiểm tra 9/2026: phí cố định = 15% × 1,1; phí dịch vụ = 5% × 1,1 + 3.000)
const TAX_DEFAULT = { sales: 1.5, feeVat: 0, salesChannels: [] };
const taxes = () => ({ ...TAX_DEFAULT, ...(state.taxes || {}) });
const ADS_TAX_DEFAULT = { Facebook: 10, Instagram: 10, 'TikTok Shop': 8, Shopee: 8 };
const accTaxPct = a => a && a.taxRate != null && a.taxRate !== '' ? +a.taxRate : (ADS_TAX_DEFAULT[a?.channel] || 0);
const orderFeeBase = o => o.status === 'cancelled' ? 0 : (+o.platformFee || 0);
const orderFeeTax = o => orderFeeBase(o) * taxes().feeVat / 100;
const orderFee = o => orderFeeBase(o) + orderFeeTax(o);   // phí sàn gồm thuế
/* Hóa đơn phí sàn hằng tháng (Shopee/TikTok gửi mỗi shop 1 hóa đơn): phí cố định / dịch vụ / giao dịch đã có theo
   từng đơn → chỉ để đối chiếu; PiShip & phí khác CHỈ có trên hóa đơn → cộng vào chi phí, chia đều cho các ngày trong tháng */
const invLabel = inv => inv.shop ? `${inv.platform} · ${inv.shop}` : inv.platform;
// Cộng VAT theo từng dòng rồi làm tròn từng dòng – giống cách sàn lập hóa đơn
const withVat = (inv, keys) => keys.reduce((s, k) => { const v = +inv[k] || 0; return s + v + Math.round(v * (+inv.vat || 0) / 100); }, 0);
const invoiceExtra = inv => withVat(inv, ['piship', 'other']);
const monthDays = ym => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
function invoiceExtraIn(r, label) {
  let s = 0;
  (state.platformInvoices || []).forEach(inv => {
    if (!inv.month || (label && invLabel(inv) !== label)) return;
    const n = monthDays(inv.month), per = invoiceExtra(inv) / n;
    for (let d = 1; d <= n; d++) if (inRange(`${inv.month}-${pad(d)}`, r)) s += per;
  });
  return s;
}
const salesTaxApplies = o => { const ch = taxes().salesChannels; return !ch.length || ch.includes(o.channel); };
const orderSalesTax = o => isRevenue(o) && salesTaxApplies(o) ? orderTotal(o) * taxes().sales / 100 : 0;
// Phí vận chuyển shop tự trả cho hãng (VD: SPX – gồm phí hoàn hàng, phí COD, bảo hiểm); đơn hủy trước khi gửi không tốn phí
const orderShip = o => o.status === 'cancelled' ? 0 : (+o.shipCost || 0);
const SPX_PAYERS = ['Người gửi trả phí', 'Người nhận trả'];
// Tài khoản quảng cáo: { id, name, channel, shop } – channel/shop trùng với kênh bán để tính ROAS theo kênh
const accLabel = a => a.shop ? `${a.channel} · ${a.shop}` : a.channel;
// Chi phí Ads mặc định GỒM thuế quảng cáo của tài khoản (withTax = false → số chưa thuế như trên trình quản lý QC)
const adSpendDay = (day, accFilter, withTax = true) => Object.entries((state.adSpend || {})[day] || {}).reduce((s, [acc, v]) => {
  if (accFilter && !accFilter(acc)) return s;
  const mul = withTax ? 1 + accTaxPct((state.adAccounts || []).find(a => a.id === acc)) / 100 : 1;
  return s + (+v || 0) * mul;
}, 0);
function adSpendIn(r, accFilter, withTax = true) {
  let s = 0;
  for (const day of Object.keys(state.adSpend || {})) if (inRange(day, r)) s += adSpendDay(day, accFilter, withTax);
  return s;
}
// Chi phí QC của các tài khoản thuộc 1 kênh (VD "Shopee" gồm mọi shop, "Shopee · Shop chính" chỉ shop đó)
const adSpendFor = (r, label, exact = false) => {
  const ids = new Set(state.adAccounts.filter(a => accLabel(a) === label || (!exact && a.channel === label)).map(a => a.id));
  return ids.size ? adSpendIn(r, id => ids.has(id)) : 0;
};
const normPhone = p => { const d = String(p || '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, ''); return d.length === 9 ? '0' + d : d; };
// Kênh kèm tên gian hàng (VD: "Shopee · Shop phụ") khi bán trên nhiều shop cùng sàn
const channelLabel = o => o.shop ? `${o.channel} · ${o.shop}` : o.channel;
// Dữ liệu mẫu: cờ demo, hoặc dữ liệu mẫu tạo từ bản cũ (trước khi có cờ)
const isDemoData = () => state.demo || state.campaigns.some(c => c.id === 'CD001' && c.name === 'Flash sale 10.10');
// Giá vốn: tra theo SKU, nếu không có SKU thì theo tên sản phẩm
const itemKey = i => i.sku ? 'sku:' + String(i.sku).trim().toUpperCase() : 'name:' + String(i.name || '').normalize('NFC').trim().toLowerCase();
const itemCost = i => i.cost != null ? +i.cost : (+(state.costs || {})[itemKey(i)] || 0);
const orderCogs = o => isRevenue(o) ? o.items.reduce((s, i) => s + i.qty * itemCost(i), 0) : 0;
// Đã nhập giá vốn → tính lãi theo giá vốn hàng bán, tiền "Nhập hàng" chỉ là dòng tiền mua hàng dự trữ
const costMode = () => Object.values(state.costs || {}).some(v => +v > 0);
const isOpex = t => t.type === 'expense' && !(costMode() && t.category === 'Nhập hàng');
const statusOf = k => STATUSES.find(s => s.key === k) || STATUSES[0];
const badge = k => { const s = statusOf(k); return `<span class="badge" style="--c:${s.color}">${s.label}</span>`; };
const custById = id => state.customers.find(c => c.id === id);
const orderById = id => state.orders.find(o => o.id === id);
const isRevenue = o => o.status !== 'cancelled' && o.status !== 'returned';
const nextStatus = o => { const i = FLOW.indexOf(o.status); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null; };

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Lưu trữ ---------- */
let state = load();
function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* trình duyệt chặn lưu trữ */ }
  if (raw) {
    try { const d = JSON.parse(raw); if (d && Array.isArray(d.orders)) return normalize(d); }
    catch (e) {
      // KHÔNG ghi đè dữ liệu cũ: giữ một bản sao dự phòng để khôi phục được
      console.error('Lỗi đọc dữ liệu', e);
      try { localStorage.setItem(STORE_KEY + '-du-phong-' + Date.now(), raw); } catch (_) { }
      setTimeout(() => alert('Không đọc được dữ liệu đã lưu. Một bản sao dự phòng đã được giữ lại trong trình duyệt – đừng xóa dữ liệu, hãy báo lại để được hỗ trợ khôi phục.'), 300);
    }
  }
  const d = seed();
  if (!raw) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) { } }
  return d;
}
// Bản cũ ghi phần chênh COD (SPX) thành 1 "sản phẩm" → chuyển sang phụ thu của đơn
function migrateOrders(orders) {
  // Hằng đặt trong hàm: load() chạy trước các khai báo const ở cấp file
  const PSEUDO_ITEM = 'Chênh lệch COD so với danh sách hàng';
  orders.forEach(o => {
    const extra = (o.items || []).filter(i => i.name === PSEUDO_ITEM);
    if (!extra.length) return;
    o.adjust = (+o.adjust || 0) + extra.reduce((s, i) => s + i.qty * i.price, 0);
    o.items = o.items.filter(i => i.name !== PSEUDO_ITEM);
  });
  return orders;
}
function normalize(d) {
  return {
    orders: migrateOrders(d.orders || []), customers: d.customers || [], tasks: d.tasks || [],
    transactions: d.transactions || [], careLogs: d.careLogs || [], campaigns: d.campaigns || [],
    // Chi phí quảng cáo theo ngày: adSpend[YYYY-MM-DD][mã tài khoản QC] = số tiền
    adAccounts: Array.isArray(d.adAccounts) ? d.adAccounts : [], adSpend: d.adSpend && typeof d.adSpend === 'object' ? d.adSpend : {},
    costs: d.costs && typeof d.costs === 'object' ? d.costs : {},
    // Truyền thông Social (social.js): traffic kênh, bài đăng, chỉ tiêu
    social: d.social && typeof d.social === 'object' ? d.social : null,
    // Phòng ban – vị trí – đầu việc định kỳ (workflow-org.js)
    org: d.org && typeof d.org === 'object' ? d.org : null,
    // Cài đặt thuế (hộ kinh doanh) – xem TAX_DEFAULT
    taxes: d.taxes && typeof d.taxes === 'object' ? d.taxes : null,
    // Hóa đơn phí sàn hằng tháng (PiShip, đối soát) – xem invoiceExtraIn
    platformInvoices: Array.isArray(d.platformInvoices) ? d.platformInvoices : [],
    demo: !!d.demo,
  };
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast('Không lưu được vào trình duyệt – hãy xuất file sao lưu.'); }
}

/* ---------- Dữ liệu mẫu ---------- */
function seed() {
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = a => a[rnd(0, a.length - 1)];
  const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
  const dem = ['Thị', 'Văn', 'Ngọc', 'Minh', 'Thu', 'Gia', 'Bảo', 'Thanh'];
  const ten = ['Anh', 'Linh', 'Hương', 'Trang', 'Mai', 'Hà', 'Nam', 'Huy', 'Vy', 'Thảo', 'Lan', 'Quân', 'Tú', 'Ngân', 'Phương'];
  const places = ['Q.1, TP.HCM', 'Q.3, TP.HCM', 'Q.7, TP.HCM', 'Thủ Đức, TP.HCM', 'Cầu Giấy, Hà Nội', 'Đống Đa, Hà Nội', 'Hải Châu, Đà Nẵng', 'Ninh Kiều, Cần Thơ'];
  const now = new Date();
  const at = (dayOffset, h, m) => { const d = addDays(now, -dayOffset); d.setHours(h, m, 0, 0); return d > now ? new Date(now - rnd(5, 60) * 6e4) : d; };

  const customers = [];
  for (let i = 1; i <= 70; i++) {
    const off = i <= 3 ? 0 : rnd(1, 75);
    customers.push({
      id: 'KH' + pad(i, 3), name: `${pick(ho)} ${pick(dem)} ${pick(ten)}`, phone: '09' + rnd(10000000, 99999999),
      email: '', address: pick(places), source: pick(CHANNELS), note: '', createdAt: at(off, rnd(8, 21), rnd(0, 59)).toISOString(),
    });
  }

  const orders = [];
  const seedStatus = age => {
    const r = Math.random();
    if (age === 0) return r < .6 ? 'new' : 'confirmed';
    if (age === 1) return r < .35 ? 'confirmed' : r < .75 ? 'packing' : 'shipping';
    if (age <= 3) return r < .6 ? 'shipping' : 'delivered';
    return r < .86 ? 'delivered' : r < .94 ? 'returned' : 'cancelled';
  };
  for (let i = 1; i <= 170; i++) {
    const age = i > 160 ? rnd(0, 1) : rnd(0, 59);
    const created = at(age, rnd(8, 22), rnd(0, 59));
    const c = pick(customers);
    if (new Date(c.createdAt) > created) c.createdAt = new Date(created - 36e5).toISOString();
    const items = Array.from({ length: rnd(1, 3) }, () => { const p = pick(PRODUCTS); return { name: p[0], size: pick(SIZES.slice(0, 4)), qty: rnd(1, 2), price: p[1] }; });
    const status = seedStatus(age);
    const path = status === 'returned' ? [...FLOW, 'returned'] : status === 'cancelled' ? ['new', 'cancelled'] : FLOW.slice(0, FLOW.indexOf(status) + 1);
    let t = created.getTime();
    const history = path.map((s, k) => {
      if (k > 0) t = Math.min(t + rnd(3, 20) * 36e5, now.getTime());
      return { status: s, at: new Date(t).toISOString(), note: k === 0 ? 'Tạo đơn hàng' : '' };
    });
    const carrier = pick(CARRIERS.slice(0, 5));
    orders.push({
      id: 'DH' + pad(i, 4), customerId: c.id, items, shippingFee: pick([0, 25000, 30000]), discount: pick([0, 0, 0, 20000, 50000]),
      channel: pick(CHANNELS), carrier, trackingCode: path.includes('shipping') ? carrier.slice(0, 3).toUpperCase().replace(/\W/g, '') + rnd(100000000, 999999999) : '',
      status, note: '', createdAt: created.toISOString(), history,
    });
  }

  const transactions = [];
  let tid = 1;
  const tx = (type, category, amount, off, note) => transactions.push({ id: 'GD' + pad(tid++, 4), type, category, amount, date: ymd(addDays(now, -off)), note });
  for (let off = 0; off < 60; off++) {
    tx('expense', 'Quảng cáo', rnd(2, 5) * 100000, off, 'Facebook/TikTok Ads');
    if (off % 7 === 2) tx('expense', 'Nhập hàng', rnd(30, 55) * 100000, off, 'Nhập hàng từ xưởng');
    if (off % 5 === 0) tx('expense', 'Vận chuyển', rnd(4, 8) * 100000, off, 'Đối soát phí ship');
    if (off % 10 === 3) tx('expense', 'Bao bì', rnd(5, 10) * 100000, off, 'Túi, hộp, thiệp cảm ơn');
  }
  [12, 42].forEach(off => {
    tx('expense', 'Mặt bằng', 7000000, off, 'Tiền thuê kho/showroom');
    tx('expense', 'Lương nhân viên', 10000000, off - 3, 'Lương 2 nhân viên');
  });
  tx('income', 'Bán sỉ', 6500000, 6, 'Đơn sỉ shop đối tác');
  tx('income', 'Bán sỉ', 4200000, 37, 'Đơn sỉ shop đối tác');

  const today = todayStr();
  const tasks = [
    ['Chụp ảnh BST Thu Đông', 'Hẹn studio 9h sáng, chuẩn bị 20 outfit', 'Marketing', 2, 'high', 'doing'],
    ['Trả lời inbox Facebook tồn đọng', '', 'CSKH', 0, 'high', 'todo'],
    ['Đối soát COD với GHN', 'Kiểm tra tiền thu hộ tuần trước', 'Kế toán', -1, 'medium', 'todo'],
    ['Lên lịch livestream TikTok', 'Khung 20h–21h thứ 6', 'Marketing', 3, 'medium', 'todo'],
    ['Duyệt mẫu váy midi mới', '', 'Chủ shop', 1, 'medium', 'review'],
    ['Cập nhật bảng size lên website', '', 'Marketing', -3, 'low', 'done'],
    ['Kiểm kê tồn kho cuối tháng', '', 'Kho', 6, 'low', 'todo'],
  ].map((t, i) => ({ id: 'CV' + pad(i + 1, 4), title: t[0], desc: t[1], assignee: t[2], due: ymd(addDays(now, t[3])), priority: t[4], status: t[5], orderId: '', createdAt: now.toISOString() }));
  let cvn = tasks.length;
  orders.filter(o => o.status === 'confirmed' || o.status === 'packing').forEach(o => {
    tasks.push({ id: 'CV' + pad(++cvn, 4), title: `Đóng gói & bàn giao vận chuyển ${o.id}`, desc: '', assignee: 'Kho', due: today, priority: 'high', status: o.status === 'packing' ? 'doing' : 'todo', orderId: o.id, createdAt: o.createdAt });
  });

  const careLogs = [];
  for (let i = 1; i <= 14; i++) {
    const c = pick(customers);
    careLogs.push({ id: 'CS' + pad(i, 4), customerId: c.id, date: ymd(addDays(now, -rnd(0, 20))), type: pick(CARE_TYPES), note: pick(['Khách hài lòng chất vải', 'Hỏi thêm size M', 'Gửi mã giảm 10%', 'Đã giải quyết đổi size', 'Hẹn ghé showroom']) });
  }
  const costs = Object.fromEntries(PRODUCTS.map(([n, p]) => [itemKey({ name: n }), Math.round(p * rnd(38, 48) / 100 / 1000) * 1000]));
  const d = { orders, customers, tasks, transactions, careLogs, campaigns: [], costs, demo: true };
  seedMarketing(d);
  return d;
}

// Tạo chiến dịch mẫu, gắn chi phí quảng cáo và đơn hàng hiện có vào chiến dịch tương ứng
function seedMarketing(d) {
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const now = new Date(), day = off => ymd(addDays(now, off));
  const defs = [
    ['Flash sale 10.10', 'Facebook', 'Quảng cáo trả phí', 'done', -55, -35, 9000000, 'Marketing', 'Doanh số'],
    ['Google Search – đầm công sở', 'Website', 'Quảng cáo trả phí', 'paused', -40, -10, 6000000, 'Marketing', 'Doanh số'],
    ['Lookbook Thu Đông', 'Instagram', 'Quảng cáo trả phí', 'running', -28, 12, 6000000, 'Marketing', 'Nhận diện thương hiệu'],
    ['Livestream tối thứ 6', 'TikTok Shop', 'Livestream', 'running', -28, 20, 5000000, 'Lan', 'Doanh số'],
    ['Voucher Shopee 15%', 'Shopee', 'Khuyến mãi / Voucher', 'running', -21, 7, 4000000, 'Marketing', 'Xả tồn kho'],
    ['Retarget khách đã xem sản phẩm', 'Facebook', 'Quảng cáo trả phí', 'running', -14, 16, 3000000, 'Marketing', 'Doanh số'],
    ['KOC review áo len', 'TikTok Shop', 'KOL / KOC', 'review', 3, 24, 7000000, 'Marketing', 'Thu hút khách mới'],
    ['Email ưu đãi khách VIP', 'Website', 'Email / Zalo', 'production', 7, 14, 1000000, 'CSKH', 'Giữ chân khách hàng'],
    ['BST Tết 2027', 'Facebook', 'Quảng cáo trả phí', 'idea', 45, 90, 20000000, 'Chủ shop', 'Doanh số'],
  ];
  const doneCount = { idea: 0, production: 1, review: 3, running: 5, paused: 5, done: 6 };
  const base = d.campaigns.length;
  const created = defs.map((x, i) => {
    const [name, channel, format, stage, s, e, budget, owner, objective] = x;
    const path = MKT_FLOW.slice(0, MKT_FLOW.indexOf(stage === 'paused' ? 'running' : stage) + 1).concat(stage === 'paused' ? ['paused'] : []);
    return {
      id: 'CD' + pad(base + i + 1, 3), name, channel, format, objective, stage, start: day(s), end: day(e), budget, owner,
      reach: 0, clicks: 0, leads: 0, note: '',
      result: stage === 'done' ? 'Khung giờ 20h–22h ra đơn tốt nhất; nhóm 25–34 tuổi có ROAS cao, nên tăng ngân sách cho nhóm này.' : '',
      checklist: MKT_CHECKLIST.map((text, k) => ({ text, done: k < doneCount[stage] })),
      history: path.map((st, k) => ({ stage: st, at: addDays(now, Math.min(s, 0) - (path.length - k) * 2).toISOString(), note: k === 0 ? 'Tạo chiến dịch' : '' })),
    };
  });
  d.campaigns.push(...created);
  const live = created.filter(c => ['running', 'paused', 'done'].includes(c.stage));
  const today = todayStr();
  d.transactions.filter(t => t.type === 'expense' && t.category === 'Quảng cáo' && !t.campaignId).forEach(t => {
    const act = live.filter(c => t.date >= c.start && t.date <= c.end && t.date <= today);
    if (act.length) { const c = act[rnd(0, act.length - 1)]; t.campaignId = c.id; t.note = 'Ads: ' + c.name; }
  });
  d.orders.forEach(o => {
    if (o.campaignId) return;
    const k = dayOf(o.createdAt), c = live.find(c => c.channel === o.channel && k >= c.start && k <= c.end);
    if (c && Math.random() < .5) o.campaignId = c.id;
  });
  live.forEach(c => {
    const spend = d.transactions.filter(t => t.campaignId === c.id).reduce((s, t) => s + +t.amount, 0);
    c.reach = Math.round(spend / rnd(25, 45));                // CPM ~25–45k ₫
    c.clicks = Math.round(c.reach * rnd(12, 30) / 1000);      // CTR 1,2–3%
    c.leads = Math.round(c.clicks * rnd(6, 14) / 100);
  });
}

/* ---------- Tính toán ---------- */
function periodRange(p) {
  const now = new Date(), end = todayStr();
  if (p === 'today') return { start: end, end };
  if (p === 'yesterday') { const y = ymd(addDays(now, -1)); return { start: y, end: y }; }
  if (p === '7d') return { start: ymd(addDays(now, -6)), end };
  if (p === 'month') return { start: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), end };
  if (p === 'lastmonth') return { start: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)), end: ymd(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (p === 'custom') return { ...ui.customRange };
  if (p === 'all') return { start: '2000-01-01', end };
  return { start: ymd(addDays(now, -29)), end };
}
function prevRange(r) {
  const n = daysBetween(r.start, r.end) + 1, s = parseDay(r.start);
  return { start: ymd(addDays(s, -n)), end: ymd(addDays(s, -1)) };
}
// Biểu đồ theo ngày: khoảng ngắn hơn 7 ngày (hôm nay, hôm qua…) thì vẽ 7 ngày kết thúc ở ngày cuối
const chartRange = r => daysBetween(r.start, r.end) < 6 ? { start: ymd(addDays(parseDay(r.end), -6)), end: r.end } : r;
const inRange = (day, r) => day >= r.start && day <= r.end;

function metrics(r) {
  const orders = state.orders.filter(o => inRange(dayOf(o.createdAt), r));
  const valid = orders.filter(isRevenue);
  const orderRevenue = valid.reduce((s, o) => s + orderTotal(o), 0);
  const tx = state.transactions.filter(t => inRange(t.date, r));
  const otherIncome = tx.filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0);
  const platformFees = orders.reduce((s, o) => s + orderFee(o), 0);
  const shipCosts = orders.reduce((s, o) => s + orderShip(o), 0);
  const cogs = valid.reduce((s, o) => s + orderCogs(o), 0);
  const missingCostRevenue = valid.reduce((s, o) => s + o.items.filter(i => !itemCost(i)).reduce((a, i) => a + i.qty * i.price, 0), 0);
  const opex = tx.filter(isOpex).reduce((s, t) => s + +t.amount, 0);
  const purchases = tx.filter(t => t.type === 'expense' && t.category === 'Nhập hàng').reduce((s, t) => s + +t.amount, 0);
  const adSpend = adSpendIn(r), adTax = adSpend - adSpendIn(r, null, false);
  const feeTax = orders.reduce((s, o) => s + orderFeeTax(o), 0);
  const salesTax = valid.reduce((s, o) => s + orderSalesTax(o), 0);
  const affiliate = tx.filter(t => t.type === 'expense' && t.category === AFFILIATE_CAT).reduce((s, t) => s + +t.amount, 0);
  const invoiceFees = invoiceExtraIn(r);
  const expense = opex + adSpend + platformFees + invoiceFees + shipCosts + cogs + salesTax;
  const revenue = orderRevenue + otherIncome;
  return {
    orders, valid, tx, orderRevenue, otherIncome, revenue, expense, platformFees, invoiceFees, shipCosts, cogs, opex, adSpend, purchases, missingCostRevenue,
    adTax, feeTax, salesTax, affiliate, taxTotal: adTax + feeTax + salesTax,
    grossProfit: orderRevenue - cogs - platformFees - invoiceFees - shipCosts - salesTax, profit: revenue - expense,
    newCustomers: state.customers.filter(c => inRange(dayOf(c.createdAt), r)).length,
    badRate: orders.length ? orders.filter(o => !isRevenue(o)).length / orders.length : 0,
    aov: valid.length ? orderRevenue / valid.length : 0,
  };
}
function dailySeries(r) {
  const days = [];
  for (let d = parseDay(r.start), e = parseDay(r.end); d <= e; d = addDays(d, 1)) days.push(ymd(d));
  const rev = Object.fromEntries(days.map(x => [x, 0])), exp = { ...rev };
  state.orders.forEach(o => {
    const k = dayOf(o.createdAt); if (!(k in rev)) return;
    if (isRevenue(o)) rev[k] += orderTotal(o);
    exp[k] += orderFee(o) + orderShip(o) + orderCogs(o) + orderSalesTax(o);
  });
  state.transactions.forEach(t => {
    if (!(t.date in rev)) return;
    if (t.type === 'income') rev[t.date] += +t.amount; else if (isOpex(t)) exp[t.date] += +t.amount;
  });
  days.forEach(d => { exp[d] += adSpendDay(d) + invoiceExtraIn({ start: d, end: d }); });
  return { days, rev: days.map(x => rev[x]), exp: days.map(x => exp[x]) };
}
function customerStats() {
  const m = {};
  state.customers.forEach(c => m[c.id] = { count: 0, spent: 0, lastOrder: '', lastCare: '' });
  state.orders.forEach(o => {
    const s = m[o.customerId]; if (!s) return;
    if (isRevenue(o)) { s.count++; s.spent += orderTotal(o); }
    const d = dayOf(o.createdAt); if (d > s.lastOrder) s.lastOrder = d;
  });
  state.careLogs.forEach(l => { const s = m[l.customerId]; if (s && l.date > s.lastCare) s.lastCare = l.date; });
  return m;
}
function tierOf(s) {
  if (s.spent >= 3e6) return ['VIP', 'tier-vip'];
  if (s.spent >= 1e6) return ['Thân thiết', 'tier-loyal'];
  if (s.count > 0) return ['Đã mua', ''];
  return ['Tiềm năng', ''];
}

/* ---------- Biểu đồ ---------- */
let charts = [];
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function destroyCharts() { charts.forEach(c => c.destroy()); charts = []; }
function noChart(canvas) {
  if (window.Chart) return false;
  canvas.parentElement.innerHTML = '<p class="empty">Không tải được thư viện biểu đồ (kiểm tra kết nối mạng).</p>';
  return true;
}
function dailyChart(canvas, s) {
  if (noChart(canvas)) return;
  const muted = cssVar('--muted'), line = cssVar('--line');
  charts.push(new Chart(canvas, {
    data: {
      labels: s.days.map(d => d.slice(8) + '/' + d.slice(5, 7)),
      datasets: [
        { type: 'bar', label: 'Doanh thu', data: s.rev, backgroundColor: cssVar('--c-rev'), borderRadius: 4, order: 2 },
        { type: 'bar', label: 'Chi phí', data: s.exp, backgroundColor: cssVar('--c-exp'), borderRadius: 4, order: 2 },
        { type: 'line', label: 'Lợi nhuận', data: s.rev.map((v, i) => v - s.exp[i]), borderColor: cssVar('--c-profit'), backgroundColor: cssVar('--c-profit'), borderWidth: 2, pointRadius: 0, tension: .3, order: 1 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { color: muted, boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${money(c.raw)}` } } },
      scales: { x: { grid: { display: false }, ticks: { color: muted, maxRotation: 0, autoSkipPadding: 8 } }, y: { ticks: { color: muted, callback: v => shortMoney(v) }, grid: { color: line } } },
    },
  }));
}
function statusChart(canvas, orders) {
  if (noChart(canvas)) return;
  const data = STATUSES.map(s => orders.filter(o => o.status === s.key).length);
  charts.push(new Chart(canvas, {
    type: 'doughnut',
    data: { labels: STATUSES.map(s => s.label), datasets: [{ data, backgroundColor: STATUSES.map(s => s.color), borderColor: cssVar('--panel'), borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'right', labels: { color: cssVar('--muted'), boxWidth: 10 } } } },
  }));
}
function hbars(pairs, cls = '') {
  if (!pairs.length) return '<p class="empty">Chưa có dữ liệu</p>';
  const max = Math.max(...pairs.map(p => p[1])) || 1;
  return pairs.map(([l, v]) => `<div class="hbar"><div class="hbar-l"><span>${esc(l)}</span><b>${money(v)}</b></div><div class="hbar-t ${cls}"><i style="width:${(v / max * 100).toFixed(1)}%"></i></div></div>`).join('');
}
const sumBy = (list, keyFn, valFn) => {
  const m = {}; list.forEach(x => { const k = keyFn(x); m[k] = (m[k] || 0) + valFn(x); });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
};

/* ---------- Router ---------- */
const ui = { period: '30d', finPeriod: '30d', orderStatus: 'all', orderChannel: 'all', orderQ: '', custQ: '', custTier: 'all', custDay: todayStr(), finType: 'all', mktPeriod: '30d', mktStage: 'all', prodPeriod: 'all', prodQ: '', prodMissing: false,
  // Khoảng ngày tự chọn (dùng chung mọi trang) & kỳ so sánh ở Tổng quan
  customRange: { start: ymd(addDays(new Date(), -6)), end: todayStr() },
  compareMode: 'prev', compareRange: { start: ymd(addDays(new Date(), -13)), end: ymd(addDays(new Date(), -7)) }, compareTouched: false };
// Đổi ngày trong ô chọn khoảng ngày → cập nhật & vẽ lại (ngày bắt đầu luôn ≤ ngày kết thúc)
document.addEventListener('change', e => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || !el.dataset.range || !el.value) return;
  const key = el.dataset.range, r = ui[key];
  r[el.dataset.k] = el.value;
  if (r.start > r.end) { if (el.dataset.k === 'start') r.end = r.start; else r.start = r.end; }
  if (key === 'compareRange') ui.compareTouched = true;
  rerender();
});
const VIEWS = {
  dashboard: { title: 'Tổng quan', render: renderDashboard },
  orders: { title: 'Đơn hàng & Tracking', render: renderOrders },
  products: { title: 'Sản phẩm & giá vốn', render: renderProducts },
  workflow: { title: 'Workflow công việc', render: renderWorkflow },
  marketing: { title: 'Marketing & hiệu quả kênh', render: renderMarketing },
  finance: { title: 'Thu – Chi', render: renderFinance },
  customers: { title: 'Khách hàng hằng ngày', render: renderCustomers },
  settings: { title: 'Dữ liệu & sao lưu', render: renderSettings },
};
function route() {
  const key = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
  $$('.nav a').forEach(a => a.classList.toggle('active', a.dataset.view === key));
  $('#page-title').textContent = VIEWS[key].title;
  destroyCharts();
  VIEWS[key].render($('#view'));
}
const rerender = route;

/* ---------- View: Tổng quan ---------- */
// Ô chọn khoảng ngày: ui[key] = { start, end } (key: customRange hoặc compareRange)
const rangeInputs = key => `<span class="range-pick">
  <input type="date" data-range="${key}" data-k="start" value="${ui[key].start}" max="${todayStr()}" aria-label="Từ ngày">
  <span class="muted">→</span>
  <input type="date" data-range="${key}" data-k="end" value="${ui[key].end}" max="${todayStr()}" aria-label="Đến ngày"></span>`;
const periodSeg = (cur, action, list = PERIODS) => {
  const r = cur === 'all' ? null : periodRange(cur);
  return `<div class="seg">${list.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-action="${action}" data-p="${k}">${l}</button>`).join('')}</div>
    ${cur === 'custom' ? rangeInputs('customRange') : r ? `<span class="muted">${r.start === r.end ? fmtDay(r.start) : fmtDay(r.start) + ' – ' + fmtDay(r.end)}</span>` : ''}`;
};
const rangeLabel = r => r.start === r.end ? fmtDay(r.start) : `${fmtDay(r.start)} – ${fmtDay(r.end)}`;
const kpi = (label, value, sub = '') => `<div class="kpi"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
function costWarning(m) {
  if (!m.missingCostRevenue || !m.orderRevenue) return '';
  return `<br><a href="#products" class="delta down">⚠ ${pct(m.missingCostRevenue / m.orderRevenue)} doanh thu chưa có giá vốn</a>`;
}
function deltaText(cur, prev, lowerIsBetter = false, label = 'kỳ trước') {
  if (!prev) return `<span class="muted">Chưa có số liệu ${label} để so sánh</span>`;
  const d = (cur - prev) / Math.abs(prev), good = lowerIsBetter ? d <= 0 : d >= 0;
  return `<span class="delta ${good ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d * 100).toFixed(0)}%</span> so với ${label}`;
}

function renderDashboard(el) {
  const r = periodRange(ui.period), m = metrics(r);
  // Kỳ so sánh: liền trước (cùng số ngày) hoặc khoảng ngày tự chọn
  const cr = ui.compareMode === 'custom' ? { ...ui.compareRange } : prevRange(r), p = metrics(cr);
  const cmpLabel = ui.compareMode === 'custom' ? rangeLabel(cr) : 'kỳ trước';
  const delta = (a, b, lower = false) => deltaText(a, b, lower, cmpLabel);
  const today = todayStr();
  const pending = FLOW.slice(0, 4).map(k => [k, state.orders.filter(o => o.status === k).length]);
  const dueTasks = state.tasks.filter(t => t.status !== 'done' && t.due && t.due <= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  const top = sumBy(m.valid.flatMap(o => o.items), i => i.name, i => i.qty * i.price).slice(0, 5);
  const byChannel = sumBy(m.valid, channelLabel, orderTotal);

  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.period, 'setPeriod')}</div>
    <div class="toolbar compare-bar"><span class="muted">So sánh với</span>
      <select id="cmp-mode"><option value="prev" ${ui.compareMode !== 'custom' ? 'selected' : ''}>Kỳ liền trước (${rangeLabel(prevRange(r))})</option>
        <option value="custom" ${ui.compareMode === 'custom' ? 'selected' : ''}>Khoảng ngày tự chọn…</option></select>
      ${ui.compareMode === 'custom' ? rangeInputs('compareRange') : ''}</div>
    <div class="kpis">
      ${kpi('Doanh thu', money(m.revenue), delta(m.revenue, p.revenue))}
      ${kpi('Chi phí', money(m.expense), delta(m.expense, p.expense, true))}
      ${kpi('Lợi nhuận', money(m.profit), 'Biên lợi nhuận ' + pct(m.revenue ? m.profit / m.revenue : 0) + costWarning(m))}
      ${kpi('Đơn hàng', m.orders.length, delta(m.orders.length, p.orders.length) + '<br>Giá trị TB ' + money(m.aov))}
      ${kpi('Khách hàng mới', m.newCustomers, delta(m.newCustomers, p.newCustomers))}
      ${kpi('Tỷ lệ hủy / hoàn', pct(m.badRate), delta(m.badRate, p.badRate, true))}
    </div>
    <div class="grid-2">
      <div class="card span-2"><div class="card-h"><h3>Doanh thu & chi phí theo ngày</h3><span class="muted small">${chartRange(r) !== r ? '7 ngày đến ' + fmtDay(r.end) : ''}</span></div>
        <div class="chart-box"><canvas id="ch-daily"></canvas></div></div>
      <div class="card"><h3>Trạng thái đơn trong kỳ</h3><div class="chart-box sm"><canvas id="ch-status"></canvas></div></div>
      <div class="card"><h3>Doanh thu theo kênh bán</h3>${hbars(byChannel)}</div>
      <div class="card"><h3>Sản phẩm bán chạy</h3>${hbars(top)}</div>
      <div class="card"><h3>Cần xử lý ngay</h3>
        <ul class="list">${pending.map(([k, n]) => `<li><span>${badge(k)}</span><a class="clickable" href="#orders" data-action="filterStatus" data-s="${k}">${n} đơn</a></li>`).join('')}</ul>
        ${typeof orgTodaySummary === 'function' ? orgTodaySummary() : ''}
        <h3 style="margin:16px 0 6px">Việc đến hạn / quá hạn</h3>
        <ul class="list">${dueTasks.map(t => `<li class="clickable" data-action="editTask" data-id="${t.id}"><span>${esc(t.title)}</span><span class="meta ${t.due < today ? 'delta down' : ''}">${fmtDay(t.due)}</span></li>`).join('') || '<li class="empty">Không có việc đến hạn</li>'}</ul>
      </div>
    </div>`;
  dailyChart($('#ch-daily'), dailySeries(chartRange(r)));
  $('#cmp-mode').addEventListener('change', e => {
    ui.compareMode = e.target.value;
    if (ui.compareMode === 'custom' && !ui.compareTouched) { ui.compareRange = prevRange(r); }
    rerender();
  });
  statusChart($('#ch-status'), m.orders);
}

/* ---------- View: Đơn hàng & Tracking ---------- */
function renderOrders(el) {
  const counts = Object.fromEntries(STATUSES.map(s => [s.key, 0]));
  state.orders.forEach(o => counts[o.status]++);
  const step = s => `<button class="flow-step ${ui.orderStatus === s.key ? 'on' : ''}" style="--c:${s.color}" data-action="filterStatus" data-s="${s.key}"><b>${counts[s.key]}</b><span>${s.label}</span></button>`;
  el.innerHTML = `
    <div class="flow">
      ${FLOW.map(k => step(statusOf(k))).join('<span class="flow-arrow">→</span>')}
      <span class="flow-sep"></span>${step(statusOf('returned'))}${step(statusOf('cancelled'))}
    </div>
    <div class="toolbar">
      <input id="order-q" type="search" placeholder="Tra cứu: mã đơn, tên, SĐT hoặc mã vận đơn…" value="${esc(ui.orderQ)}">
      <select id="order-ch"><option value="all">Tất cả kênh</option>${[...CHANNELS, ...new Set(state.orders.filter(o => o.shop).map(channelLabel))].sort((a, b) => a.localeCompare(b, 'vi'))
        .map(c => `<option ${ui.orderChannel === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      ${ui.orderStatus !== 'all' ? `<button class="btn ghost" data-action="filterStatus" data-s="all">Bỏ lọc: ${statusOf(ui.orderStatus).label} ×</button>` : ''}
      <label class="btn" title="Chọn file Excel xuất từ Kênh Người Bán Shopee → Quản Lý Đơn Hàng → Xuất">Nhập đơn Shopee (Excel)<input type="file" id="shopee-file" accept=".xlsx" hidden></label>
      <label class="btn" title="Chọn file báo cáo vận đơn tải từ trang quản lý SPX Express">Nhập báo cáo SPX (Excel)<input type="file" id="spx-file" accept=".xlsx" hidden></label>
    </div>
    <div class="card flush"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Ngày tạo</th><th>Kênh</th><th class="num">Tổng tiền</th><th>Vận chuyển</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody id="order-rows"></tbody></table></div></div>
    <p class="muted small" id="order-count"></p>`;
  $('#order-q').addEventListener('input', e => { ui.orderQ = e.target.value; fillOrderRows(); });
  $('#order-ch').addEventListener('change', e => { ui.orderChannel = e.target.value; fillOrderRows(); });
  $('#shopee-file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importShopeeFile(f); });
  $('#spx-file').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importSpxFile(f); });
  fillOrderRows();
}
function fillOrderRows() {
  const q = ui.orderQ.trim().toLowerCase();
  let list = state.orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (ui.orderStatus !== 'all') list = list.filter(o => o.status === ui.orderStatus);
  // Chọn "Shopee" = mọi shop Shopee; chọn "Shopee · Shop phụ" = riêng shop đó
  if (ui.orderChannel !== 'all') list = list.filter(o => o.channel === ui.orderChannel || channelLabel(o) === ui.orderChannel);
  if (q) list = list.filter(o => { const c = custById(o.customerId) || {}; return [o.id, c.name, c.phone, o.trackingCode].some(v => String(v || '').toLowerCase().includes(q)); });
  const shown = list.slice(0, 200);
  $('#order-rows').innerHTML = shown.map(o => {
    const c = custById(o.customerId) || { name: '(đã xóa)' }, nx = nextStatus(o);
    return `<tr data-action="viewOrder" data-id="${o.id}">
      <td><b>${o.id}</b></td><td>${esc(c.name)}<div class="muted small">${esc(c.phone || '')}</div></td>
      <td>${fmtDT(o.createdAt)}</td><td>${esc(o.channel)}${o.shop ? `<div class="muted small">${esc(o.shop)}</div>` : ''}</td><td class="num">${money(orderTotal(o))}</td>
      <td>${esc(o.carrier || '')}<div class="muted small">${esc(o.trackingCode || '—')}</div></td>
      <td>${badge(o.status)}</td>
      <td>${nx ? `<button class="btn sm" data-action="advanceOrder" data-id="${o.id}">→ ${statusOf(nx).label}</button>` : ''}</td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">Không tìm thấy đơn hàng</td></tr>';
  $('#order-count').textContent = `${list.length} đơn${list.length > shown.length ? ' (hiển thị 200 đơn mới nhất)' : ''}`;
}

function setOrderStatus(o, status, note = '') {
  o.status = status;
  o.history.push({ status, at: new Date().toISOString(), note });
  // Đồng bộ với Workflow: xác nhận đơn → tạo việc đóng gói; giao đi / kết thúc → hoàn thành việc
  const linked = state.tasks.filter(t => t.orderId === o.id);
  if (status === 'confirmed' && !linked.length) {
    state.tasks.push({ id: nextId('CV', state.tasks), title: `Đóng gói & bàn giao vận chuyển ${o.id}`, desc: '', assignee: 'Kho', due: todayStr(), priority: 'high', status: 'todo', orderId: o.id, createdAt: new Date().toISOString() });
  }
  if (status === 'packing') linked.filter(t => t.status === 'todo').forEach(t => t.status = 'doing');
  if (['shipping', 'delivered', 'cancelled', 'returned'].includes(status)) linked.forEach(t => t.status = 'done');
  save();
}

function advanceOrder(id, fromModal) {
  const o = orderById(id), nx = o && nextStatus(o);
  if (!nx) return;
  if (nx === 'shipping' && !o.trackingCode) { trackingModal(o, true); return; }
  setOrderStatus(o, nx);
  toast(`${o.id} → ${statusOf(nx).label}`);
  rerender();
  if (fromModal) viewOrder(id);
}

function trackingModal(o, thenShip) {
  openModal(`Mã vận đơn – ${o.id}`, `
    <form class="form" id="f-track">
      <label>Đơn vị vận chuyển<select name="carrier">${opts(CARRIERS.includes(o.carrier) || !o.carrier ? CARRIERS : [o.carrier, ...CARRIERS], o.carrier)}</select></label>
      <label>Mã vận đơn<input name="code" value="${esc(o.trackingCode)}" placeholder="VD: GHN123456789" ${thenShip ? 'required' : ''}></label>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="viewOrder" data-id="${o.id}">Quay lại</button>
      <button class="btn primary">${thenShip ? 'Lưu & chuyển sang Đang giao' : 'Lưu'}</button></div>
    </form>`, body => {
    $('#f-track', body).addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      o.carrier = fd.get('carrier'); o.trackingCode = fd.get('code').trim();
      if (thenShip) setOrderStatus(o, 'shipping', `${o.carrier}: ${o.trackingCode}`); else save();
      toast('Đã cập nhật vận đơn'); rerender(); viewOrder(o.id);
    });
  });
}

function viewOrder(id) {
  const o = orderById(id); if (!o) return;
  const c = custById(o.customerId) || { name: '(đã xóa)' };
  const reached = new Set(o.history.map(h => h.status));
  const timeOf = k => { const h = [...o.history].reverse().find(x => x.status === k); return h ? fmtDT(h.at) : ''; };
  const nx = nextStatus(o), closed = ['delivered', 'cancelled', 'returned'].includes(o.status);
  const sub = o.items.reduce((s, i) => s + i.qty * i.price, 0);
  openModal(`Đơn hàng ${o.id}`, `
    <div class="stepper">${FLOW.map((k, i) => `<div class="step ${reached.has(k) ? 'done' : ''} ${o.status === k ? 'current' : ''}"><div class="dot">${reached.has(k) ? '✓' : i + 1}</div>${statusOf(k).label}<time>${timeOf(k)}</time></div>`).join('')}</div>
    ${o.status === 'cancelled' || o.status === 'returned' ? `<p>${badge(o.status)} <span class="muted small">${timeOf(o.status)}</span></p>` : ''}
    <div class="info-grid">
      <div><span>Khách hàng</span><a class="clickable" data-action="viewCustomer" data-id="${c.id || ''}">${esc(c.name)}</a> · ${esc(c.phone || '')}</div>
      <div><span>Giao đến</span>${o.ship ? `${esc(o.ship.name)} · ${esc(o.ship.phone)}<br>${esc(joinAddress(o.ship) || '—')}` : esc(c.address || '—')}</div>
      <div><span>Kênh bán · Chiến dịch</span>${esc(channelLabel(o))} ·${campById(o.campaignId) ? `<a class="clickable" data-action="viewCampaign" data-id="${o.campaignId}">${esc(campById(o.campaignId).name)}</a>` : 'Tự nhiên'}</div>
      <div><span>Vận chuyển</span>${esc(o.carrier || '—')} · <b>${esc(o.trackingCode || 'chưa có mã')}</b></div>
      ${o.platform ? `<div><span>Mã đơn ${esc(o.platform)}</span><b>${esc(o.platformOrderId)}</b></div><div><span>Thanh toán · Hình thức giao</span>${esc(o.payment || '—')} · ${esc(o.shippingMethod || '—')}</div>` : ''}
      ${o.spx ? `<div><span>SPX · COD</span>${o.spx.cod ? 'Thu COD ' + money(o.spx.codAmount) : 'Không thu COD (đã chuyển khoản)'}</div>
        <div><span>SPX · Phí ship · Đồng kiểm</span>${esc(o.spx.payer || '')} · ${o.spx.weight ? o.spx.weight + ' kg · ' : ''}Cho xem hàng: ${esc(o.spx.coCheck || '—')}</div>` : ''}
      ${o.note ? `<div style="grid-column:1/-1"><span>Ghi chú</span>${esc(o.note)}</div>` : ''}
    </div>
    ${o.carrier === 'SPX Express' && !o.trackingCode && !closed ? `<div class="spx-hint">
      <div><b>Tạo vận đơn trên SPX:</b> bấm “Sao chép thông tin SPX” rồi dán đối chiếu khi tạo đơn. Ở ô <b>Mã khách hàng</b> trên SPX, điền <b class="mono">${o.id}</b>
      để khi nhập báo cáo SPX, app tự gắn mã vận đơn, cập nhật trạng thái giao và phí ship cho đơn này.</div>
      <button class="btn primary sm" data-action="copySpx" data-id="${o.id}">Sao chép thông tin SPX</button></div>` : ''}
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Sản phẩm</th><th>Size</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>
      ${o.items.map(i => `<tr><td>${esc(i.name)}${i.sku ? ` <span class="chip">${esc(i.sku)}</span>` : ''}</td><td>${esc(i.size)}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.qty * i.price)}</td></tr>`).join('')}
      <tr><td colspan="4">Tạm tính · Phí ship · Giảm giá</td><td class="num">${money(sub)} + ${money(o.shippingFee)} − ${money(o.discount)}</td></tr>
      ${o.adjust ? `<tr><td colspan="4">Phụ thu <span class="muted small">(tiền COD cao hơn giá trong danh sách hàng SPX)</span></td><td class="num">+${money(o.adjust)}</td></tr>` : ''}
      <tr><td colspan="4"><b>Tổng cộng</b></td><td class="num"><b>${money(orderTotal(o))}</b></td></tr>
      ${orderFeeBase(o) ? `<tr><td colspan="4">Phí sàn ${esc(o.platform || '')} (cố định + dịch vụ + thanh toán)</td><td class="num">−${money(orderFeeBase(o))}</td></tr>
      ${orderFeeTax(o) ? `<tr><td colspan="4">Thuế trên phí sàn (${taxes().feeVat}%)</td><td class="num">−${money(orderFeeTax(o))}</td></tr>` : ''}
      <tr><td colspan="4"><b>Thực nhận từ sàn</b> <span class="muted small">(chưa trừ thuế bán hàng)</span></td><td class="num"><b>${money(orderTotal(o) - orderFee(o))}</b></td></tr>` : ''}
      ${orderShip(o) ? `<tr><td colspan="4">Phí vận chuyển shop trả${o.spx?.estimated ? ' <span class="muted small">(ước tính – cập nhật khi nhập báo cáo SPX)</span>' : ''}</td><td class="num">−${money(orderShip(o))}</td></tr>` : ''}
      ${orderSalesTax(o) ? `<tr><td colspan="4">Thuế bán hàng (${String(taxes().sales).replace('.', ',')}% doanh thu${o.platform ? ' – sàn khấu trừ thay' : ' – tự kê khai'})</td><td class="num">−${money(orderSalesTax(o))}</td></tr>` : ''}
      ${isRevenue(o) && (orderCogs(o) || orderShip(o) || orderFee(o) || orderSalesTax(o)) ? (() => {
        const net = orderTotal(o) - orderFee(o) - orderShip(o) - orderCogs(o) - orderSalesTax(o);
        return `${orderCogs(o) ? `<tr><td colspan="4">Giá vốn hàng${o.items.some(i => !itemCost(i)) ? ' <span class="delta down">(thiếu giá vốn một số SP)</span>' : ''}</td><td class="num">−${money(orderCogs(o))}</td></tr>` : ''}
        <tr><td colspan="4"><b>Lãi của đơn</b> <span class="muted small">(sau ${[orderCogs(o) && 'giá vốn', orderFee(o) && 'phí sàn', orderShip(o) && 'phí ship', orderSalesTax(o) && 'thuế'].filter(Boolean).join(', ')}; chưa trừ quảng cáo)</span></td><td class="num"><b>${money(net)}</b> · ${pct(net / (orderTotal(o) || 1))}</td></tr>`;
      })() : ''}
    </tbody></table></div>
    <div class="detail-sec"><h4>Lịch sử tracking</h4>
      <ul class="timeline">${[...o.history].reverse().map(h => `<li style="--c:${statusOf(h.status).color}"><b>${statusOf(h.status).label}</b><time>${fmtDT(h.at)}</time>${h.note ? `<p>${esc(h.note)}</p>` : ''}</li>`).join('')}</ul>
    </div>
    <div class="row-actions">
      ${nx ? `<button class="btn primary" data-action="advanceOrderModal" data-id="${o.id}">Chuyển sang: ${statusOf(nx).label}</button>` : ''}
      <button class="btn" data-action="editTracking" data-id="${o.id}">Cập nhật mã vận đơn</button>
      ${o.carrier === 'SPX Express' && (o.trackingCode || closed) ? `<button class="btn" data-action="copySpx" data-id="${o.id}">Sao chép thông tin SPX</button>` : ''}
      ${o.carrier === 'SPX Express' && o.trackingCode ? `<a class="btn" href="https://spx.vn/track?${encodeURIComponent(o.trackingCode)}" target="_blank" rel="noopener">Tra cứu SPX ↗</a>` : ''}
      ${!closed ? `<button class="btn danger" data-action="cancelOrder" data-id="${o.id}">Hủy đơn</button>` : ''}
      ${o.status === 'shipping' || o.status === 'delivered' ? `<button class="btn danger" data-action="returnOrder" data-id="${o.id}">Ghi nhận hoàn trả</button>` : ''}
      <span class="grow" style="flex:1"></span>
      <button class="btn ghost danger" data-action="deleteOrder" data-id="${o.id}">Xóa đơn</button>
    </div>`);
}

function itemRow(it = {}) {
  return `<div class="item-row">
    <input name="iname" list="product-list" placeholder="Tên sản phẩm" value="${esc(it.name || '')}">
    <select name="isize">${opts(SIZES, it.size || 'M')}</select>
    <input name="iqty" type="number" min="1" value="${it.qty || 1}" aria-label="Số lượng">
    <input name="iprice" type="number" min="0" step="1000" value="${it.price ?? ''}" placeholder="Đơn giá">
    <button type="button" class="icon-btn" data-remove-row aria-label="Xóa dòng">×</button></div>`;
}
// Địa chỉ theo đúng các ô của SPX: Tỉnh/thành · Quận, huyện (cũ)/Phường, xã (mới) · Phường, xã (cũ) · Địa chỉ chi tiết
const joinAddress = a => [a.street, a.ward, a.district, a.province].map(s => (s || '').trim()).filter(Boolean).join(', ');
function newOrder(prefCustomerId) {
  const custs = state.customers.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  // Gợi ý sản phẩm từ các đơn đã bán (tên + giá gần nhất), kèm danh mục mẫu
  const lastPrice = new Map();
  state.orders.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(o => o.items.forEach(i => i.price && lastPrice.set(i.name, i.price)));
  if (isDemoData()) PRODUCTS.forEach(([n, p]) => lastPrice.has(n) || lastPrice.set(n, p));
  const defChannel = state.demo ? 'Website' : 'Facebook', defCarrier = state.demo ? 'GHN' : 'SPX Express';
  openModal('Tạo đơn hàng mới', `
    <form class="form" id="f-order">
      <label class="full">Khách hàng<select name="customerId">
        <option value="__new">+ Khách hàng mới</option>
        ${custs.map(c => `<option value="${c.id}" ${c.id === prefCustomerId ? 'selected' : ''}>${esc(c.name)} – ${esc(c.phone)}</option>`).join('')}
      </select></label>
      <div class="section-t">Người nhận</div>
      <label>Tên người nhận<input name="rname" required></label>
      <label>Số điện thoại<input name="rphone" type="tel" inputmode="tel" required></label>
      <label>Tỉnh, thành<input name="province" placeholder="VD: Hà Nội"></label>
      <label>Quận, huyện (cũ) / Phường, xã (mới)<input name="district"></label>
      <label>Phường, xã (cũ)<input name="ward" placeholder="Bỏ trống nếu dùng địa chỉ mới"></label>
      <label>Địa chỉ chi tiết<input name="street" placeholder="Số nhà, ngõ, đường…"></label>
      <div class="section-t">Sản phẩm <span class="muted small">(ghi rõ màu, VD: “Bộ sơ mi lụa – màu Trắng”)</span></div>
      <div class="full" id="items">${itemRow()}</div>
      <div class="full"><button type="button" class="btn sm" id="add-item">+ Thêm sản phẩm</button></div>
      <label>Kênh bán<select name="channel">${opts(CHANNELS, defChannel)}</select></label>
      <label>Đơn vị vận chuyển<select name="carrier">${opts(CARRIERS, defCarrier)}</select></label>
      ${state.campaigns.length ? `<label class="full">Đến từ chiến dịch marketing<select name="campaignId"><option value="">— Không / khách tự nhiên —</option>${campaignOptions('')}</select></label>` : ''}
      <label>Phí ship thu của khách (₫)<input name="shippingFee" type="number" min="0" step="1000" value="${state.demo ? 30000 : 0}"></label>
      <label>Giảm giá (₫)<input name="discount" type="number" min="0" step="1000" value="0"></label>
      <div class="total-line"><span>Tổng tiền khách trả</span><b id="o-total">0 ₫</b></div>
      <div class="full form" id="spx-box" style="padding:0">
        <div class="section-t">Thông tin vận đơn SPX</div>
        <label>Thu COD<select name="cod"><option value="1">Có – thu hộ tiền hàng</option><option value="0">Không – khách đã chuyển khoản</option></select></label>
        <label>Số tiền COD (₫)<input name="codAmount" type="number" min="0" step="1000"></label>
        <label>Người trả phí ship<select name="payer">${opts(SPX_PAYERS, SPX_PAYERS[0])}</select></label>
        <label>Phí ship shop trả – ước tính (₫)<input name="shipCost" type="number" min="0" step="100" value="22000"></label>
        <label>Tổng khối lượng (kg)<input name="weight" type="number" min="0" step="0.1" value="0.4"></label>
        <label>Cho xem hàng / Đồng kiểm<select name="coCheck"><option>Có</option><option>Không</option></select></label>
        <label class="full">Hướng dẫn giao hàng<input name="instruction" placeholder="VD: Gọi trước khi giao, giao giờ hành chính…"></label>
      </div>
      <label class="full">Ghi chú nội bộ<textarea name="note"></textarea></label>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Tạo đơn</button></div>
    </form>
    <datalist id="product-list">${[...lastPrice.keys()].slice(-80).map(n => `<option value="${esc(n)}">`).join('')}</datalist>`, body => {
    const f = $('#f-order', body);
    let codTouched = false;
    const total = () => {
      const fd = new FormData(f), q = fd.getAll('iqty'), p = fd.getAll('iprice');
      return q.reduce((s, x, i) => s + (+x || 0) * (+p[i] || 0), 0) + (+fd.get('shippingFee') || 0) - (+fd.get('discount') || 0);
    };
    const calc = () => {
      const t = total();
      $('#o-total', body).textContent = money(t);
      if (!codTouched) f.codAmount.value = f.cod.value === '1' ? t : 0;
    };
    const fillCustomer = () => {
      const c = custById(f.customerId.value) || {};
      f.rname.value = c.name || ''; f.rphone.value = c.phone || '';
      f.province.value = c.province || ''; f.district.value = c.district || ''; f.ward.value = c.ward || '';
      f.street.value = c.street || (c.province ? '' : c.address || '');
    };
    const toggleSpx = () => { $('#spx-box', body).style.display = f.carrier.value === 'SPX Express' ? '' : 'none'; };
    fillCustomer(); toggleSpx(); calc();
    f.customerId.addEventListener('change', fillCustomer);
    f.carrier.addEventListener('change', toggleSpx);
    f.cod.addEventListener('change', () => { codTouched = false; calc(); });
    f.codAmount.addEventListener('input', () => { codTouched = true; });
    $('#add-item', body).addEventListener('click', () => { $('#items', body).insertAdjacentHTML('beforeend', itemRow()); });
    $('#items', body).addEventListener('click', e => {
      if (e.target.matches('[data-remove-row]') && $$('.item-row', body).length > 1) { e.target.closest('.item-row').remove(); calc(); }
    });
    f.addEventListener('input', e => {
      if (e.target.name === 'iname') {
        const price = e.target.closest('.item-row').querySelector('[name=iprice]');
        if (lastPrice.has(e.target.value) && !price.value) price.value = lastPrice.get(e.target.value);
      }
      if (e.target.name !== 'codAmount') calc();
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(f), g = k => String(fd.get(k) || '').trim();
      const names = fd.getAll('iname'), sizes = fd.getAll('isize'), qtys = fd.getAll('iqty'), prices = fd.getAll('iprice');
      const items = names.map((n, i) => ({ name: n.trim(), size: sizes[i], qty: Math.max(1, +qtys[i] || 1), price: +prices[i] || 0 })).filter(i => i.name);
      if (!items.length) { toast('Thêm ít nhất 1 sản phẩm'); return; }
      const addr = { province: g('province'), district: g('district'), ward: g('ward'), street: g('street') };
      let cid = fd.get('customerId');
      if (cid === '__new') {
        const phone = normPhone(g('rphone')), dup = phone && state.customers.find(c => normPhone(c.phone) === phone);
        if (dup) cid = dup.id;   // SĐT đã có → dùng lại khách cũ, không tạo trùng
        else {
          const c = { id: nextId('KH', state.customers, 3), name: g('rname'), phone: g('rphone'), email: '', ...addr, address: joinAddress(addr), source: fd.get('channel'), note: '', createdAt: new Date().toISOString() };
          state.customers.push(c); cid = c.id;
        }
      }
      const c = custById(cid);
      if (c && !c.province && addr.province) Object.assign(c, addr, { address: joinAddress(addr) });   // lưu địa chỉ cho lần sau
      const now = new Date().toISOString(), id = nextId('DH', state.orders), isSpx = fd.get('carrier') === 'SPX Express';
      state.orders.push({
        id, customerId: cid, items, shippingFee: +fd.get('shippingFee') || 0, discount: +fd.get('discount') || 0, channel: fd.get('channel'),
        campaignId: fd.get('campaignId') || '', carrier: fd.get('carrier'), trackingCode: '', status: 'new', note: g('note'), createdAt: now,
        history: [{ status: 'new', at: now, note: 'Tạo đơn hàng' }],
        ship: { name: g('rname'), phone: g('rphone'), ...addr },
        shipCost: isSpx && fd.get('payer') === SPX_PAYERS[0] ? +fd.get('shipCost') || 0 : 0,
        spx: isSpx ? { cod: fd.get('cod') === '1', codAmount: fd.get('cod') === '1' ? +fd.get('codAmount') || 0 : 0, payer: fd.get('payer'), weight: +fd.get('weight') || 0, coCheck: fd.get('coCheck'), instruction: g('instruction'), estimated: true } : null,
      });
      save(); closeModal(); toast('Đã tạo đơn ' + id); rerender();
      viewOrder(id);
    });
  });
}

// Văn bản để dán / đối chiếu khi tạo vận đơn trên SPX. Ô “Mã khách hàng” = mã đơn của app để liên kết khi nhập báo cáo SPX
function spxText(o) {
  const c = custById(o.customerId) || {}, s = o.ship || { name: c.name, phone: c.phone, province: c.province, district: c.district, ward: c.ward, street: c.street || c.address };
  const p = o.spx || {}, n = o.items.reduce((a, i) => a + i.qty, 0) || 1, w = (p.weight || 0.4 * n) / n;
  return [
    `Mã khách hàng: ${o.id}`,
    `Tên người nhận: ${s.name || ''}`, `Số điện thoại: ${s.phone || ''}`,
    `Tỉnh, thành: ${s.province || ''}`, `Quận, huyện (cũ) / Phường, xã (mới): ${s.district || ''}`, `Phường, xã (cũ): ${s.ward || ''}`, `Địa chỉ chi tiết: ${s.street || ''}`,
    'Tên sản phẩm, số lượng, giá tiền:',
    ...o.items.map(i => `${i.name}${i.size && i.size !== '—' && !/size/i.test(i.name) ? ' - size ' + i.size : ''},${w.toFixed(3)}kg,${i.price},${i.qty}`),
    `Thu COD: ${p.cod === false ? 'Không' : 'Có'}${p.cod === false ? '' : ' – ' + (p.codAmount ?? orderTotal(o))}`,
    `Giá trị đơn hàng: ${orderTotal(o)}`, `Tổng khối lượng: ${(p.weight || 0.4 * n).toFixed(1)} kg`,
    `Phương thức thanh toán: ${p.payer || SPX_PAYERS[0]}`, `Cho xem hàng/Đồng kiểm: ${p.coCheck || 'Có'}`,
    p.instruction ? `Hướng dẫn giao hàng: ${p.instruction}` : '',
  ].filter(Boolean).join('\n');
}
async function copySpx(id) {
  const o = orderById(id); if (!o) return;
  const text = spxText(o);
  try { await navigator.clipboard.writeText(text); toast('Đã sao chép – dán sang SPX, nhớ điền Mã khách hàng ' + o.id); }
  catch (e) { openModal('Thông tin tạo vận đơn SPX', `<textarea style="width:100%;min-height:320px">${esc(text)}</textarea>`); }
}

/* ---------- View: Workflow ---------- */
function taskCard(t, colIdx) {
  const today = todayStr(), late = t.status !== 'done' && t.due && t.due < today;
  const prev = TASK_COLS[colIdx - 1], next = TASK_COLS[colIdx + 1];
  return `<div class="task" draggable="true" data-id="${t.id}" data-action="editTask">
    <div class="task-top"><span class="prio p-${t.priority}">${PRIO[t.priority] || ''}</span>${t.orderId ? `<span class="chip">${esc(t.orderId)}</span>` : ''}${campById(t.campaignId) ? `<span class="chip">MKT · ${esc(campById(t.campaignId).name)}</span>` : ''}</div>
    <div class="task-t">${esc(t.title)}</div>${t.desc ? `<div class="task-d">${esc(t.desc)}</div>` : ''}
    <div class="task-m"><span>${esc(t.assignee || 'Chưa giao')}</span><span class="${late ? 'late' : ''}">${late ? 'Quá hạn ' : ''}${fmtDay(t.due)}</span></div>
    <div class="task-mv">${prev ? `<button data-action="moveTask" data-id="${t.id}" data-to="${prev.key}" title="Chuyển về ${prev.label}">←</button>` : ''}${next ? `<button data-action="moveTask" data-id="${t.id}" data-to="${next.key}" title="Chuyển sang ${next.label}">→</button>` : ''}</div>
  </div>`;
}
function renderWorkflow(el) {
  const rank = { high: 0, medium: 1, low: 2 };
  el.innerHTML = `
    <div class="toolbar"><button class="btn primary" data-action="newTask">+ Thêm công việc</button>
      <div class="tpl"><span class="muted">Tạo nhanh theo quy trình:</span>${WF_TEMPLATES.map((t, i) => `<button class="btn ghost sm" data-action="applyTemplate" data-i="${i}">${t.name}</button>`).join('')}</div></div>
    <div class="board">${TASK_COLS.map((col, ci) => {
      const tasks = state.tasks.filter(t => t.status === col.key).sort((a, b) => (rank[a.priority] - rank[b.priority]) || String(a.due).localeCompare(String(b.due)));
      return `<div class="kcol" data-col="${col.key}"><div class="kcol-h"><span>${col.label}</span><b>${tasks.length}</b></div>
        <div class="kcol-b">${tasks.map(t => taskCard(t, ci)).join('') || '<p class="empty">Kéo thả công việc vào đây</p>'}</div></div>`;
    }).join('')}</div>
    <p class="muted small">Mẹo: khi một đơn hàng được xác nhận, hệ thống tự tạo việc “Đóng gói & bàn giao vận chuyển” và tự hoàn thành khi đơn được giao đi.</p>`;
}
function moveTask(id, to) {
  const t = state.tasks.find(x => x.id === id);
  if (!t || t.status === to) return;
  t.status = to; save(); rerender();
}
function taskModal(id) {
  const t = state.tasks.find(x => x.id === id) || { title: '', desc: '', assignee: '', due: todayStr(), priority: 'medium', status: 'todo', orderId: '' };
  const openOrders = state.orders.filter(o => !['delivered', 'cancelled', 'returned'].includes(o.status) || o.id === t.orderId);
  openModal(id ? 'Sửa công việc' : 'Công việc mới', `
    <form class="form" id="f-task">
      <label class="full">Tiêu đề<input name="title" required value="${esc(t.title)}"></label>
      <label class="full">Mô tả<textarea name="desc">${esc(t.desc)}</textarea></label>
      <label>Người phụ trách<input name="assignee" value="${esc(t.assignee)}" placeholder="VD: Kho, Marketing, Lan…"></label>
      <label>Hạn chót<input name="due" type="date" value="${esc(t.due)}"></label>
      <label>Độ ưu tiên<select name="priority">${Object.entries(PRIO).map(([k, l]) => `<option value="${k}" ${t.priority === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label>Trạng thái<select name="status">${TASK_COLS.map(c => `<option value="${c.key}" ${t.status === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}</select></label>
      <label class="full">Gắn với đơn hàng<select name="orderId"><option value="">— Không —</option>${openOrders.map(o => `<option ${o.id === t.orderId ? 'selected' : ''}>${o.id}</option>`).join('')}</select></label>
      <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="deleteTask" data-id="${id}" style="margin-right:auto">Xóa</button>` : ''}
        <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-task', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      d.title = d.title.trim();
      if (id) Object.assign(t, d);
      else state.tasks.push({ id: nextId('CV', state.tasks), ...d, createdAt: new Date().toISOString() });
      save(); closeModal(); toast('Đã lưu công việc'); rerender();
    });
  });
}
function applyTemplate(i) {
  const tpl = WF_TEMPLATES[i]; if (!tpl) return;
  const now = new Date();
  tpl.tasks.forEach((title, k) => state.tasks.push({ id: nextId('CV', state.tasks), title, desc: `Quy trình: ${tpl.name}`, assignee: '', due: ymd(addDays(now, k)), priority: k === 0 ? 'high' : 'medium', status: 'todo', orderId: '', createdAt: now.toISOString() }));
  save(); toast(`Đã tạo ${tpl.tasks.length} việc cho “${tpl.name}”`); rerender();
}

/* ---------- View: Thu – Chi ---------- */
function renderFinance(el) {
  const r = periodRange(ui.finPeriod), m = metrics(r);
  const expCats = sumBy(m.tx.filter(isOpex), t => t.category, t => +t.amount);
  [['Giá vốn hàng bán', m.cogs], ['Phí sàn TMĐT', m.platformFees - m.feeTax + m.invoiceFees], ['Vận chuyển', m.shipCosts], ['Quảng cáo', m.adSpend - m.adTax],
    ['Thuế', m.taxTotal]].forEach(([k, v]) => {
    if (!v) return;
    const row = expCats.find(c => c[0] === k);
    if (row) row[1] += v; else expCats.push([k, v]);
  });
  expCats.sort((a, b) => b[1] - a[1]);
  // Lợi nhuận theo kênh bán: doanh thu − giá vốn − phí sàn − chi phí chiến dịch của kênh
  // Mỗi kênh một dòng; kênh bán trên nhiều shop (VD Shopee) tách thành từng shop
  const chKeys = [...new Set([...CHANNELS, ...m.orders.map(channelLabel), ...state.adAccounts.map(accLabel), ...state.platformInvoices.map(invLabel)])];
  const byCh = chKeys.map(ch => {
    const os = m.orders.filter(o => channelLabel(o) === ch);
    const rev = os.filter(isRevenue).reduce((s, o) => s + orderTotal(o), 0);
    const fee = os.reduce((s, o) => s + orderFee(o) + orderShip(o) + orderSalesTax(o), 0) + invoiceExtraIn(r, ch);
    const cogs = os.reduce((s, o) => s + orderCogs(o), 0);
    const ids = new Set(state.campaigns.filter(c => c.channel === ch).map(c => c.id));
    const mkt = m.tx.filter(t => t.type === 'expense' && ids.has(t.campaignId)).reduce((s, t) => s + +t.amount, 0) + adSpendFor(r, ch, true);
    return { ch, n: os.filter(isRevenue).length, rev, cogs, fee, mkt, net: rev - cogs - fee - mkt };
  }).filter(x => x.rev || x.fee || x.mkt);
  const step = (label, v, sign = '', strong = false) => `<li><span>${strong ? `<b>${label}</b>` : label}</span>${strong ? `<b>${sign}${money(v)}</b>` : `<span>${sign}${money(v)}</span>`}</li>`;
  let tx =m.tx.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if (ui.finType !== 'all') tx = tx.filter(t => t.type === ui.finType);
  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.finPeriod, 'setFinPeriod')}<span class="grow"></span>
      <button class="btn ghost" data-action="taxSettings">Cài đặt thuế</button>
      <button class="btn" data-action="newTx" data-type="income">+ Ghi khoản thu</button>
      <button class="btn primary" data-action="newTx" data-type="expense">+ Ghi chi phí</button></div>
    <div class="kpis">
      ${kpi('Doanh thu', money(m.revenue), `${m.valid.length} đơn hợp lệ${m.otherIncome ? ' · thu khác ' + money(m.otherIncome) : ''}`)}
      ${kpi('Lãi gộp', money(m.grossProfit), `Sau giá vốn, phí sàn, ship & thuế bán hàng · biên ${pct(m.orderRevenue ? m.grossProfit / m.orderRevenue : 0)}`)}
      ${kpi('Chi phí vận hành', money(m.opex + m.adSpend), m.adSpend ? `gồm ${money(m.adSpend)} quảng cáo Ads (đã có thuế)` : 'Quảng cáo, mặt bằng, lương…')}
      ${kpi('Tổng thuế', money(m.taxTotal), `Bán hàng ${shortMoney(m.salesTax)} · phí sàn ${shortMoney(m.feeTax)} · QC ${shortMoney(m.adTax)}`)}
      ${kpi('Lãi ròng', money(m.profit), 'Biên ' + pct(m.revenue ? m.profit / m.revenue : 0) + costWarning(m))}
    </div>
    <div class="grid-2">
      <div class="card span-2"><h3>Doanh thu & chi phí theo ngày</h3><div class="chart-box"><canvas id="ch-fin"></canvas></div></div>
      <div class="card"><h3>Báo cáo lãi lỗ</h3><ul class="list">
        ${step('Doanh thu bán hàng', m.orderRevenue)}${m.otherIncome ? step('Thu khác', m.otherIncome, '+') : ''}
        ${step('Giá vốn hàng bán', m.cogs, '−')}
        ${m.platformFees ? step('Phí sàn TMĐT (theo từng đơn, đã gồm VAT)', m.platformFees - m.feeTax, '−') : ''}${m.feeTax ? step(`Thuế trên phí sàn (${taxes().feeVat}%)`, m.feeTax, '−') : ''}
        ${m.invoiceFees ? step('Phí sàn theo hóa đơn tháng (PiShip, phí khác)', m.invoiceFees, '−') : ''}
        ${m.shipCosts ? step('Phí vận chuyển shop trả', m.shipCosts, '−') : ''}
        ${m.salesTax ? step(`Thuế bán hàng (${String(taxes().sales).replace('.', ',')}% doanh thu)`, m.salesTax, '−') : ''}
        ${step('Lãi gộp', m.grossProfit + m.otherIncome, '', true)}
        ${m.adSpend ? step('Quảng cáo Ads (Shopee, TikTok, Facebook…)', m.adSpend - m.adTax, '−') : ''}${m.adTax ? step('Thuế quảng cáo', m.adTax, '−') : ''}
        ${m.affiliate ? step('Hoa hồng Affiliate / KOC', m.affiliate, '−') : ''}
        ${step('Chi phí vận hành khác', m.opex - m.affiliate, '−')}
        ${step('Lãi ròng', m.profit, '', true)}
      </ul>
      <p class="muted small">${costMode()
        ? `Tiền nhập hàng trong kỳ: <b>${money(m.purchases)}</b> – là tiền mua hàng dự trữ, được tính dần vào giá vốn khi bán nên không trừ thêm vào lãi.`
        : 'Chưa nhập giá vốn: tiền “Nhập hàng” đang được tính thẳng vào chi phí. Nhập giá vốn ở mục <a href="#products">Sản phẩm</a> để tính lãi chính xác theo từng đơn.'}</p></div>
      <div class="card"><h3>Chi phí theo hạng mục</h3>${hbars(expCats, 'exp')}
        <ul class="list" style="margin-top:8px">
          <li><span>Quảng cáo / doanh thu</span><b>${pct(m.revenue ? (expCats.find(c => c[0] === 'Quảng cáo')?.[1] || 0) / m.revenue : 0)}</b></li>
          <li><span>Lãi ròng TB mỗi đơn</span><b>${money(m.valid.length ? m.profit / m.valid.length : 0)}</b></li>
          <li><span>Lãi ròng TB mỗi ngày</span><b>${money(m.profit / (daysBetween(r.start, r.end) + 1))}</b></li>
        </ul></div>
      <div class="card span-2 flush"><div class="card-h" style="padding:14px 16px 0"><h3>Lợi nhuận theo kênh bán</h3><span class="muted small">Chưa trừ chi phí chung (mặt bằng, lương…)</span></div>
        <div class="table-wrap"><table class="tbl static"><thead><tr><th>Kênh</th><th class="num">Đơn</th><th class="num">Doanh thu</th><th class="num">Giá vốn</th><th class="num">Phí sàn, ship & thuế</th><th class="num">Chi marketing</th><th class="num">Còn lại</th><th class="num">% còn lại</th></tr></thead><tbody>
          ${byCh.map(x => `<tr><td><b>${esc(x.ch)}</b></td><td class="num">${x.n}</td><td class="num">${money(x.rev)}</td><td class="num">${x.cogs ? '−' + money(x.cogs) : '—'}</td><td class="num">${x.fee ? '−' + money(x.fee) : '—'}</td><td class="num">${x.mkt ? '−' + money(x.mkt) : '—'}</td><td class="num"><b>${money(x.net)}</b></td><td class="num">${x.rev ? pct(x.net / x.rev) : '—'}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">Chưa có dữ liệu</td></tr>'}
        </tbody></table></div></div>
      ${invoiceCardHtml()}
    </div>
    <div class="card flush">
      <div class="card-h" style="padding:14px 16px 0"><h3>Sổ thu – chi</h3>
        <select id="fin-type"><option value="all">Tất cả</option><option value="income" ${ui.finType === 'income' ? 'selected' : ''}>Khoản thu</option><option value="expense" ${ui.finType === 'expense' ? 'selected' : ''}>Chi phí</option></select></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>Ngày</th><th>Loại</th><th>Hạng mục</th><th>Ghi chú</th><th class="num">Số tiền</th><th></th></tr></thead><tbody>
        ${tx.map(t => `<tr data-action="editTx" data-id="${t.id}"><td>${fmtDay(t.date)}</td><td>${t.type === 'income' ? '<span class="badge" style="--c:#16a34a">Thu</span>' : '<span class="badge" style="--c:#dc2626">Chi</span>'}</td>
          <td>${esc(t.category)}</td><td class="muted">${esc(t.note)}</td><td class="num">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</td>
          <td><button class="btn ghost sm danger" data-action="deleteTx" data-id="${t.id}">Xóa</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Chưa có giao dịch trong kỳ</td></tr>'}
      </tbody></table></div></div>`;
  $('#fin-type').addEventListener('change', e => { ui.finType = e.target.value; rerender(); });
  dailyChart($('#ch-fin'), dailySeries(chartRange(r)));
}
/* ---------- Hóa đơn phí sàn hằng tháng ---------- */
// Phí theo đơn mà app đã ghi nhận cho 1 shop, tính theo THÁNG HOÀN THÀNH đơn (giống cách sàn lập hóa đơn)
function invoiceAppFees(inv) {
  return state.orders.filter(o => o.platform === inv.platform && (o.shop || '') === (inv.shop || '')).reduce((s, o) => {
    const h = [...(o.history || [])].reverse().find(x => x.status === 'delivered' || x.status === 'returned');
    return h && dayOf(h.at).slice(0, 7) === inv.month ? s + orderFeeBase(o) : s;
  }, 0);
}
const invoicePerOrder = inv => withVat(inv, ['fixed', 'service', 'transaction']);
const invoiceTotal = inv => invoicePerOrder(inv) + invoiceExtra(inv);
function invoiceCardHtml() {
  const list = state.platformInvoices.slice().sort((a, b) => b.month.localeCompare(a.month) || invLabel(a).localeCompare(invLabel(b)));
  return `<div class="card span-2 flush"><div class="card-h" style="padding:14px 16px 0"><div><h3>Hóa đơn phí sàn hằng tháng</h3>
      <span class="muted small">PiShip & phí chỉ có trên hóa đơn được cộng vào chi phí của đúng shop, chia đều theo ngày trong tháng</span></div>
      <button class="btn sm primary" data-action="newInvoice">+ Nhập hóa đơn</button></div>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Tháng</th><th>Sàn · Shop</th><th>Số HĐ</th><th class="num">Phí theo đơn trên HĐ<div class="muted small">gồm VAT</div></th><th class="num">App ghi nhận<div class="muted small">đơn hoàn thành trong tháng</div></th><th class="num">Chênh lệch</th><th class="num">PiShip + khác<div class="muted small">đã cộng chi phí</div></th><th class="num">Tổng thanh toán</th></tr></thead><tbody>
    ${list.map(inv => {
      const hd = invoicePerOrder(inv), app = invoiceAppFees(inv), diff = hd - app, rel = hd ? Math.abs(diff) / hd : 0;
      return `<tr data-action="editInvoice" data-id="${inv.id}"><td><b>${inv.month.slice(5)}/${inv.month.slice(0, 4)}</b></td><td>${esc(invLabel(inv))}</td><td class="muted">${esc(inv.invoiceNo || '—')}</td>
        <td class="num">${money(hd)}</td><td class="num">${app ? money(app) : '<span class="muted">—</span>'}</td>
        <td class="num ${rel > .1 ? 'delta down' : ''}">${app ? (diff >= 0 ? '+' : '−') + money(Math.abs(diff)) + `<div class="muted small">${pct(rel)}</div>` : '—'}</td>
        <td class="num"><b>${money(invoiceExtra(inv))}</b></td><td class="num">${money(invoiceTotal(inv))}</td></tr>`;
    }).join('') || '<tr><td colspan="8" class="empty">Chưa nhập hóa đơn – mỗi tháng sàn gửi mỗi shop 1 hóa đơn GTGT về phí (Kênh Người Bán → Tài chính → Hóa đơn)</td></tr>'}
    </tbody></table></div>
    <p class="muted small" style="padding:0 16px 12px">Chênh lệch nhỏ (vài %) là bình thường: hóa đơn tính theo tháng <b>hoàn thành</b> đơn, gồm cả đơn đặt cuối tháng trước; app chỉ có các đơn bạn đã nhập. Chênh trên 10% được tô đỏ – nên kiểm tra phí mới hoặc file đơn còn thiếu.</p></div>`;
}
function invoiceModal(id) {
  const inv = state.platformInvoices.find(x => x.id === id) || (() => {
    const d = addDays(new Date(new Date().getFullYear(), new Date().getMonth(), 1), -1);
    return { platform: 'Shopee', shop: '', month: ymd(d).slice(0, 7), invoiceNo: '', vat: 8, fixed: 0, service: 0, transaction: 0, piship: 0, other: 0, otherNote: '' };
  })();
  const shops = [...new Set(state.orders.filter(o => o.shop).map(o => o.shop))];
  const num = (k, l, hint = '') => `<label>${l}${hint ? ` <span class="muted small">${hint}</span>` : ''}<input name="${k}" inputmode="numeric" value="${inv[k] ? new Intl.NumberFormat('vi-VN').format(inv[k]) : ''}" placeholder="0"></label>`;
  openModal(id ? 'Sửa hóa đơn phí sàn' : 'Nhập hóa đơn phí sàn', `
    <form class="form" id="f-inv">
      <label>Sàn<select name="platform">${opts(['Shopee', 'TikTok Shop'], inv.platform)}</select></label>
      <label>Shop (gian hàng)<input name="shop" list="inv-shops" value="${esc(inv.shop)}" placeholder="VD: Shop chính"><datalist id="inv-shops">${shops.map(s => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <label>Tháng phí<input name="month" type="month" required value="${esc(inv.month)}"></label>
      <label>Số hóa đơn<input name="invoiceNo" value="${esc(inv.invoiceNo)}" placeholder="VD: 8343384"></label>
      <div class="section-t">Cột “Thành tiền” trên hóa đơn (chưa VAT)</div>
      ${num('fixed', 'Phí hoa hồng cố định', '(đối chiếu)')}${num('service', 'Phí dịch vụ', '(đối chiếu)')}${num('transaction', 'Phí xử lý giao dịch', '(đối chiếu)')}
      ${num('piship', 'Phí dịch vụ PiShip', '(cộng vào chi phí)')}${num('other', 'Phí khác chỉ có trên hóa đơn', '(cộng vào chi phí)')}
      <label>Ghi chú phí khác<input name="otherNote" value="${esc(inv.otherNote)}"></label>
      <label>Thuế suất GTGT (%)<input name="vat" type="number" min="0" max="20" step="0.5" value="${inv.vat}"></label>
      <div class="total-line full"><span>Tổng thanh toán (gồm VAT)</span><b id="inv-total">—</b></div>
      <p class="muted small full" id="inv-check"></p>
      <div class="form-actions">${id ? `<button type="button" class="btn ghost danger" data-action="deleteInvoice" data-id="${id}" style="margin-right:auto">Xóa</button>` : ''}
        <button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    const f = $('#f-inv', body);
    const read = () => {
      const d = Object.fromEntries(new FormData(f));
      ['fixed', 'service', 'transaction', 'piship', 'other'].forEach(k => d[k] = Math.round(parseMoney(d[k])));
      d.vat = +d.vat || 0; d.shop = d.shop.trim(); d.invoiceNo = d.invoiceNo.trim(); d.otherNote = d.otherNote.trim();
      return d;
    };
    const calc = () => {
      const d = read(), app = d.month ? invoiceAppFees(d) : 0, hd = invoicePerOrder(d);
      $('#inv-total', body).textContent = money(invoiceTotal(d));
      $('#inv-check', body).innerHTML = `PiShip + phí khác cộng vào chi phí: <b>${money(invoiceExtra(d))}</b>. ` +
        (app ? `Phí theo đơn trên HĐ ${money(hd)} · app ghi nhận ${money(app)} (đơn hoàn thành trong tháng) → chênh ${pct(hd ? Math.abs(hd - app) / hd : 0)}.` : 'Chưa có đơn hoàn thành của shop này trong tháng để đối chiếu.');
    };
    f.addEventListener('input', calc); calc();
    f.addEventListener('submit', e => {
      e.preventDefault();
      const d = read();
      const dup = state.platformInvoices.find(x => x.id !== id && x.platform === d.platform && (x.shop || '') === d.shop && x.month === d.month);
      if (dup && !confirm(`Đã có hóa đơn ${d.platform} · ${d.shop || '—'} tháng ${d.month}. Vẫn lưu thêm?`)) return;
      if (id) Object.assign(inv, d); else state.platformInvoices.push({ id: nextId('HD', state.platformInvoices, 3), ...d });
      save(); closeModal(); toast('Đã lưu hóa đơn phí sàn'); rerender();
    });
  });
}
function taxModal() {
  if (typeof ensureAdAccounts === 'function') ensureAdAccounts();
  const t = taxes(), all = !t.salesChannels.length;
  openModal('Cài đặt thuế (hộ kinh doanh)', `
    <form class="form" id="f-tax">
      <div class="section-t">Thuế trên doanh thu bán hàng</div>
      <label>Tỷ lệ (% doanh thu)<input name="sales" type="number" min="0" max="100" step="0.1" value="${t.sales}"></label>
      <p class="muted small" style="align-self:end">Hàng hóa: 1% GTGT + 0,5% TNCN = 1,5%. Sàn TMĐT khấu trừ thay; đơn tự bán (Facebook, SPX…) tự kê khai.</p>
      <div class="full"><span class="muted small">Áp dụng cho kênh:</span>
        <div class="tax-ch">${CHANNELS.map(c => `<label class="inline-check"><input type="checkbox" name="ch" value="${esc(c)}" ${all || t.salesChannels.includes(c) ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div></div>
      <div class="section-t">Thuế trên phí sàn (Shopee, TikTok Shop…)</div>
      <label>Tỷ lệ (% trên phí cố định + dịch vụ + thanh toán)<input name="feeVat" type="number" min="0" max="100" step="0.1" value="${t.feeVat}"></label>
      <p class="muted small" style="align-self:end">Để <b>0</b> khi nhập file đơn hàng Shopee: phí trong file <b>đã gồm thuế</b> (đã đối chiếu dữ liệu tháng 9). Chỉ nhập % khi bạn tự ghi phí <b>chưa thuế</b>.</p>
      <div class="section-t">Thuế cộng thêm trên chi phí quảng cáo</div>
      ${(state.adAccounts || []).map(a => `<label>${esc(a.name)} (%)<input name="ad_${a.id}" type="number" min="0" max="100" step="0.1" value="${accTaxPct(a)}"></label>`).join('') || '<p class="muted small full">Chưa có tài khoản quảng cáo – mở trang Chi phí quảng cáo để tạo.</p>'}
      <p class="muted small full">Số nhập ở trang Chi phí quảng cáo là số <b>chưa thuế</b> (như trên trình quản lý quảng cáo); app tự cộng thuế khi tính chi phí và lãi.</p>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-tax', body).addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target), chs = fd.getAll('ch');
      state.taxes = { sales: Math.max(0, +fd.get('sales') || 0), feeVat: Math.max(0, +fd.get('feeVat') || 0), salesChannels: chs.length === CHANNELS.length ? [] : chs };
      (state.adAccounts || []).forEach(a => { const v = fd.get('ad_' + a.id); if (v != null) a.taxRate = Math.max(0, +v || 0); });
      save(); closeModal(); toast('Đã lưu cài đặt thuế'); rerender();
    });
  });
}
function txModal(type, id) {
  const t = state.transactions.find(x => x.id === id) || { type, category: type === 'income' ? INCOME_CATS[0] : EXPENSE_CATS[0], amount: '', date: todayStr(), note: '' };
  const cats = t.type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  openModal(`${id ? 'Sửa' : 'Ghi'} ${t.type === 'income' ? 'khoản thu' : 'chi phí'}`, `
    <form class="form" id="f-tx">
      <label>Hạng mục<select name="category">${opts(cats, t.category)}</select></label>
      <label>Số tiền (₫)<input name="amount" type="number" min="0" step="1000" required value="${esc(t.amount)}"></label>
      <label>Ngày<input name="date" type="date" required value="${esc(t.date)}"></label>
      <label>Ghi chú<input name="note" value="${esc(t.note)}"></label>
      ${t.type === 'expense' ? `<label class="full">Thuộc chiến dịch marketing<select name="campaignId"><option value="">— Không —</option>${campaignOptions(t.campaignId, true)}</select></label>` : ''}
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-tx', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target)); d.amount = +d.amount || 0; d.note = d.note.trim();      if (id) Object.assign(t, d); else state.transactions.push({ id: nextId('GD', state.transactions), type: t.type, ...d });
      save(); closeModal(); toast('Đã lưu'); rerender();
    });
  });
}

/* ---------- View: Khách hàng ---------- */
function renderCustomers(el) {
  const day = ui.custDay, today = todayStr(), stats = customerStats();
  const newOnDay = state.customers.filter(c => dayOf(c.createdAt) === day);
  const ordersOnDay = state.orders.filter(o => dayOf(o.createdAt) === day);
  const buyers = [...new Set(ordersOnDay.map(o => o.customerId))];
  const careOnDay = state.careLogs.filter(l => l.date === day);
  // Cần chăm sóc: đã mua nhưng >21 ngày không có tương tác; hoặc đơn vừa giao 2 ngày qua chưa xin feedback
  const lastTouch = id => [stats[id].lastOrder, stats[id].lastCare].sort().pop() || '';
  const dormant = state.customers.filter(c => stats[c.id].count > 0 && lastTouch(c.id) && daysBetween(lastTouch(c.id), today) > 21)
    .sort((a, b) => stats[b.id].spent - stats[a.id].spent).slice(0, 8);
  const feedback = state.orders.filter(o => o.status === 'delivered').map(o => ({ o, at: dayOf(o.history[o.history.length - 1].at) }))
    .filter(x => daysBetween(x.at, today) <= 2 && !state.careLogs.some(l => l.customerId === x.o.customerId && l.date >= x.at)).slice(0, 8);
  const custLine = (c, meta) => `<li class="clickable" data-action="viewCustomer" data-id="${c.id}"><span>${esc(c.name)}<div class="meta">${meta}</div></span><button class="btn sm" data-action="logCare" data-id="${c.id}">Ghi chăm sóc</button></li>`;

  el.innerHTML = `
    <div class="toolbar">
      <div class="daynav"><button class="btn sm" data-action="custDay" data-d="-1" aria-label="Ngày trước">‹</button>
        <input type="date" id="cust-day" value="${day}" max="${today}"><button class="btn sm" data-action="custDay" data-d="1" aria-label="Ngày sau" ${day >= today ? 'disabled' : ''}>›</button>
        ${day !== today ? '<button class="btn sm ghost" data-action="custDay" data-d="0">Hôm nay</button>' : ''}</div>
      <span class="grow"></span><button class="btn primary" data-action="newCustomer">+ Thêm khách hàng</button></div>
    <div class="kpis">
      ${kpi('Khách mới', newOnDay.length, fmtDay(day))}
      ${kpi('Khách đặt hàng', buyers.length, `${ordersOnDay.length} đơn · ${money(ordersOnDay.filter(isRevenue).reduce((s, o) => s + orderTotal(o), 0))}`)}
      ${kpi('Lượt chăm sóc', careOnDay.length, 'Gọi, nhắn tin, tư vấn…')}
      ${kpi('Tổng khách hàng', state.customers.length, `${state.customers.filter(c => tierOf(stats[c.id])[0] === 'VIP').length} khách VIP`)}
    </div>
    <div class="grid-2">
      <div class="card"><h3>Khách mới & khách mua trong ngày</h3><ul class="list">
        ${newOnDay.map(c => custLine(c, `Mới · ${esc(c.source)} · ${esc(c.phone)}`)).join('')}
        ${buyers.filter(id => !newOnDay.some(c => c.id === id)).map(id => custById(id)).filter(Boolean).map(c => custLine(c, `Đặt hàng · ${tierOf(stats[c.id])[0]}`)).join('')}
        ${!newOnDay.length && !buyers.length ? '<li class="empty">Chưa có khách trong ngày này</li>' : ''}</ul></div>
      <div class="card"><h3>Nhật ký chăm sóc trong ngày</h3><ul class="list">
        ${careOnDay.map(l => { const c = custById(l.customerId) || { name: '(đã xóa)' }; return `<li class="clickable" data-action="viewCustomer" data-id="${l.customerId}"><span>${esc(c.name)}<div class="meta">${esc(l.type)} · ${esc(l.note)}</div></span></li>`; }).join('') || '<li class="empty">Chưa có lượt chăm sóc</li>'}</ul></div>
      <div class="card"><h3>Đơn vừa giao – xin feedback</h3><ul class="list">
        ${feedback.map(x => { const c = custById(x.o.customerId); return c ? custLine(c, `${x.o.id} giao ${fmtDay(x.at)}`) : ''; }).join('') || '<li class="empty">Không có</li>'}</ul></div>
      <div class="card"><h3>Lâu chưa tương tác (&gt; 21 ngày)</h3><ul class="list">
        ${dormant.map(c => custLine(c, `${tierOf(stats[c.id])[0]} · đã chi ${money(stats[c.id].spent)} · lần cuối ${fmtDay(lastTouch(c.id))}`)).join('') || '<li class="empty">Không có</li>'}</ul></div>
    </div>
    <div class="toolbar">
      <input id="cust-q" type="search" placeholder="Tìm tên, SĐT, địa chỉ…" value="${esc(ui.custQ)}">
      <select id="cust-tier">${['all', 'VIP', 'Thân thiết', 'Đã mua', 'Tiềm năng'].map(t => `<option value="${t}" ${ui.custTier === t ? 'selected' : ''}>${t === 'all' ? 'Tất cả hạng' : t}</option>`).join('')}</select>
    </div>
    <div class="card flush"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Mã</th><th>Khách hàng</th><th>Nguồn</th><th>Hạng</th><th class="num">Số đơn</th><th class="num">Tổng chi tiêu</th><th>Mua gần nhất</th><th></th></tr></thead>
      <tbody id="cust-rows"></tbody></table></div></div>`;
  $('#cust-day').addEventListener('change', e => { if (e.target.value) { ui.custDay = e.target.value; rerender(); } });
  $('#cust-q').addEventListener('input', e => { ui.custQ = e.target.value; fillCustRows(stats); });
  $('#cust-tier').addEventListener('change', e => { ui.custTier = e.target.value; fillCustRows(stats); });
  fillCustRows(stats);
}
function fillCustRows(stats) {
  const q = ui.custQ.trim().toLowerCase();
  let list = state.customers.slice().sort((a, b) => stats[b.id].spent - stats[a.id].spent);
  if (q) list = list.filter(c => [c.name, c.phone, c.address, c.email].some(v => String(v || '').toLowerCase().includes(q)));
  if (ui.custTier !== 'all') list = list.filter(c => tierOf(stats[c.id])[0] === ui.custTier);
  $('#cust-rows').innerHTML = list.map(c => {
    const s = stats[c.id], [tier, cls] = tierOf(s);
    return `<tr data-action="viewCustomer" data-id="${c.id}"><td>${c.id}</td><td><b>${esc(c.name)}</b><div class="muted small">${esc(c.phone)}</div></td>
      <td>${esc(c.source)}</td><td><span class="chip ${cls}">${tier}</span></td><td class="num">${s.count}</td><td class="num">${money(s.spent)}</td>
      <td>${fmtDay(s.lastOrder)}</td><td><button class="btn sm" data-action="logCare" data-id="${c.id}">Ghi chăm sóc</button></td></tr>`;
  }).join('') || '<tr><td colspan="8" class="empty">Không tìm thấy khách hàng</td></tr>';
}

function viewCustomer(id) {
  const c = custById(id); if (!c) return;
  const s = customerStats()[id], [tier, cls] = tierOf(s);
  const orders = state.orders.filter(o => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const logs = state.careLogs.filter(l => l.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
  openModal(c.name, `
    <div class="info-grid">
      <div><span>Mã · Hạng</span>${c.id} · <span class="chip ${cls}">${tier}</span></div>
      <div><span>Điện thoại</span>${esc(c.phone || '—')}</div>
      <div><span>Email</span>${esc(c.email || '—')}</div>
      <div><span>Địa chỉ</span>${esc(c.address || '—')}</div>
      <div><span>Nguồn</span>${esc(c.source)} · từ ${fmtDay(dayOf(c.createdAt))}</div>
      <div><span>Tổng chi tiêu</span><b>${money(s.spent)}</b> · ${s.count} đơn</div>
      ${c.note ? `<div style="grid-column:1/-1"><span>Ghi chú</span>${esc(c.note)}</div>` : ''}
    </div>
    <div class="detail-sec"><h4>Ghi nhận chăm sóc</h4>
      <form class="inline-form" id="f-care">
        <select name="type">${opts(CARE_TYPES)}</select><input name="date" type="date" value="${todayStr()}">
        <input name="note" placeholder="Nội dung (VD: tư vấn size, gửi mã giảm giá…)" style="flex:3"><button class="btn primary">Lưu</button>
      </form>
      <ul class="timeline" style="margin-top:12px">${logs.map(l => `<li><b>${esc(l.type)}</b><time>${fmtDay(l.date)}</time>${l.note ? `<p>${esc(l.note)}</p>` : ''}</li>`).join('') || '<li class="muted">Chưa có lịch sử chăm sóc</li>'}</ul>
    </div>
    <div class="detail-sec"><h4>Đơn hàng (${orders.length})</h4><ul class="list">
      ${orders.map(o => `<li class="clickable" data-action="viewOrder" data-id="${o.id}"><span><b>${o.id}</b> <span class="meta">${fmtDT(o.createdAt)}</span></span><span>${badge(o.status)} ${money(orderTotal(o))}</span></li>`).join('') || '<li class="empty">Chưa có đơn</li>'}
    </ul></div>
    <div class="row-actions">
      <button class="btn primary" data-action="newOrderFor" data-id="${c.id}">+ Tạo đơn cho khách này</button>
      <button class="btn" data-action="editCustomer" data-id="${c.id}">Sửa thông tin</button>
      <span style="flex:1"></span><button class="btn ghost danger" data-action="deleteCustomer" data-id="${c.id}">Xóa khách</button>
    </div>`, body => {
    $('#f-care', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      state.careLogs.push({ id: nextId('CS', state.careLogs), customerId: id, date: d.date || todayStr(), type: d.type, note: d.note.trim() });
      save(); toast('Đã ghi nhận chăm sóc'); rerender(); viewCustomer(id);
    });
  });
}
function customerModal(id) {
  const c = custById(id) || { name: '', phone: '', email: '', address: '', source: 'Facebook', note: '' };
  openModal(id ? 'Sửa khách hàng' : 'Thêm khách hàng', `
    <form class="form" id="f-cust">
      <label>Họ tên<input name="name" required value="${esc(c.name)}"></label>
      <label>Số điện thoại<input name="phone" type="tel" value="${esc(c.phone)}"></label>
      <label>Email<input name="email" type="email" value="${esc(c.email)}"></label>
      <label>Nguồn khách<select name="source">${opts(CHANNELS, c.source)}</select></label>
      <label class="full">Địa chỉ<input name="address" value="${esc(c.address)}"></label>
      <label class="full">Ghi chú (sở thích, size thường mặc…)<textarea name="note">${esc(c.note)}</textarea></label>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-cust', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      Object.keys(d).forEach(k => d[k] = d[k].trim());
      if (id) { Object.assign(c, d); save(); rerender(); viewCustomer(id); }
      else { const nc = { id: nextId('KH', state.customers, 3), ...d, createdAt: new Date().toISOString() }; state.customers.push(nc); save(); closeModal(); rerender(); }
      toast('Đã lưu khách hàng');
    });
  });
}

/* ---------- View: Sản phẩm & giá vốn ---------- */
const PROD_PERIODS = [...PERIODS, ['all', 'Tất cả']];
function productStats(r) {
  const map = new Map();
  state.orders.forEach(o => {
    const counted = isRevenue(o) && (!r || inRange(dayOf(o.createdAt), r));
    o.items.forEach(i => {
      const k = itemKey(i);
      let p = map.get(k);
      if (!p) { p = { key: k, sku: i.sku || '', name: i.name, variants: new Set(), qty: 0, revenue: 0 }; map.set(k, p); }
      if (i.size && i.size !== '—') p.variants.add(i.size);
      if (counted) { p.qty += i.qty; p.revenue += i.qty * i.price; }
    });
  });
  Object.keys(state.costs).forEach(k => {
    if (!map.has(k)) map.set(k, { key: k, sku: k.startsWith('sku:') ? k.slice(4) : '', name: k.startsWith('name:') ? k.slice(5) : '', variants: new Set(), qty: 0, revenue: 0 });
  });
  return [...map.values()].map(p => ({ ...p, cost: +state.costs[p.key] || 0 }));
}
function prodKpis(list) {
  const rev = list.reduce((s, p) => s + p.revenue, 0), cogs = list.reduce((s, p) => s + p.qty * p.cost, 0);
  const missing = list.filter(p => !p.cost && p.qty), missRev = missing.reduce((s, p) => s + p.revenue, 0);
  return `${kpi('Doanh thu sản phẩm', money(rev), `${list.filter(p => p.qty).length} mã đã bán`)}
    ${kpi('Giá vốn hàng bán', money(cogs))}
    ${kpi('Lãi gộp (trước phí sàn)', money(rev - cogs), 'Biên ' + pct(rev ? (rev - cogs) / rev : 0))}
    ${kpi('Chưa có giá vốn', `${missing.length} mã`, missing.length ? `<span class="delta down">${pct(rev ? missRev / rev : 0)} doanh thu đang tính giá vốn = 0</span>` : '<span class="delta up">Đã đủ giá vốn</span>')}`;
}
function prodRowCells(qty, rev, cost) {
  const avg = qty ? rev / qty : 0, unit = avg - cost;
  return {
    unit: cost ? money(unit) : '—', margin: cost && avg ? pct(unit / avg) : '—', total: cost ? money(rev - qty * cost) : '—',
    cls: cost && avg && unit / avg < .3 ? 'delta down' : '',
  };
}
function renderProducts(el) {
  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.prodPeriod, 'setProdPeriod', PROD_PERIODS)}
      <span class="grow"></span>
      <button class="btn" data-action="copySkuList" title="Sao chép danh sách để dán vào Excel, điền giá vốn rồi dán ngược lại">Sao chép danh sách SKU</button>
      <button class="btn primary" data-action="pasteCosts">Dán giá vốn từ Excel</button></div>
    <div class="kpis" id="prod-kpis"></div>
    <div class="toolbar"><input id="prod-q" type="search" placeholder="Tìm SKU hoặc tên sản phẩm…" value="${esc(ui.prodQ)}">
      <label class="inline-check"><input type="checkbox" id="prod-missing" ${ui.prodMissing ? 'checked' : ''}> Chỉ hiện mã chưa có giá vốn</label></div>
    <div class="card flush"><div class="table-wrap"><table class="tbl static"><thead><tr><th>SKU</th><th>Sản phẩm</th><th class="num">Đã bán</th><th class="num">Doanh thu</th><th class="num">Giá bán TB</th><th class="num">Giá vốn / sp</th><th class="num">Lãi / sp</th><th class="num">Biên lãi</th><th class="num">Tổng lãi gộp</th></tr></thead>
      <tbody id="prod-rows"></tbody></table></div></div>
    <p class="muted small">Giá vốn = tiền hàng cho 1 sản phẩm (giá nhập hoặc chi phí may + vận chuyển về kho). Gõ giá vốn rồi nhấn Enter để sang dòng tiếp theo – tự lưu.
      Lãi ở đây chưa trừ phí sàn, quảng cáo và chi phí chung; xem lãi ròng ở mục <a href="#finance">Thu – Chi</a>. Đổi giá vốn sẽ tính lại cho cả đơn cũ. Biên lãi dưới 30% được tô đỏ.</p>`;
  $('#prod-q').addEventListener('input', e => { ui.prodQ = e.target.value; fillProdRows(); });
  $('#prod-missing').addEventListener('change', e => { ui.prodMissing = e.target.checked; fillProdRows(); });
  const rows = $('#prod-rows');
  rows.addEventListener('change', e => {
    if (!e.target.matches('.cost-input')) return;
    const key = e.target.dataset.key, v = Math.max(0, Math.round(+e.target.value || 0));
    if (v) state.costs[key] = v; else delete state.costs[key];
    save();
    const tr = e.target.closest('tr'), c = prodRowCells(+tr.dataset.qty, +tr.dataset.rev, v);
    tr.querySelector('[data-c=unit]').textContent = c.unit;
    const mg = tr.querySelector('[data-c=margin]'); mg.textContent = c.margin; mg.className = 'num ' + c.cls;
    tr.querySelector('[data-c=total]').textContent = c.total;
    $('#prod-kpis').innerHTML = prodKpis(productStats(ui.prodPeriod === 'all' ? null : periodRange(ui.prodPeriod)));
  });
  rows.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('.cost-input')) return;
    e.preventDefault();
    const inputs = $$('.cost-input', rows), next = inputs[inputs.indexOf(e.target) + 1];
    e.target.dispatchEvent(new Event('change', { bubbles: true }));
    if (next) { next.focus(); next.select(); } else e.target.blur();
  });
  fillProdRows();
}
function fillProdRows() {
  const all = productStats(ui.prodPeriod === 'all' ? null : periodRange(ui.prodPeriod));
  $('#prod-kpis').innerHTML = prodKpis(all);
  const q = ui.prodQ.trim().toLowerCase();
  let list = all.filter(p => p.qty || p.cost);
  if (q) list = list.filter(p => (p.sku + ' ' + p.name + ' ' + [...p.variants].join(' ')).toLowerCase().includes(q));
  if (ui.prodMissing) list = list.filter(p => !p.cost);
  list.sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name, 'vi'));
  $('#prod-rows').innerHTML = list.slice(0, 500).map(p => {
    const c = prodRowCells(p.qty, p.revenue, p.cost);
    const variants = [...p.variants].slice(0, 6).join(', ') + (p.variants.size > 6 ? '…' : '');
    return `<tr data-qty="${p.qty}" data-rev="${p.revenue}"><td>${p.sku ? `<b>${esc(p.sku)}</b>` : '<span class="muted">—</span>'}</td>
      <td class="prod-name"><span title="${esc(p.name)}">${esc(p.name)}</span>${variants ? `<div class="muted small">${esc(variants)}</div>` : ''}</td>
      <td class="num">${p.qty}</td><td class="num">${money(p.revenue)}</td><td class="num">${p.qty ? money(p.revenue / p.qty) : '—'}</td>
      <td class="num"><input class="cost-input" type="number" min="0" step="1000" inputmode="numeric" data-key="${esc(p.key)}" value="${p.cost || ''}" placeholder="Nhập giá vốn" aria-label="Giá vốn ${esc(p.sku || p.name)}"></td>
      <td class="num" data-c="unit">${c.unit}</td><td class="num ${c.cls}" data-c="margin">${c.margin}</td><td class="num" data-c="total">${c.total}</td></tr>`;
  }).join('') || `<tr><td colspan="9" class="empty">${state.orders.length ? 'Không có sản phẩm phù hợp' : 'Chưa có đơn hàng – hãy tạo đơn hoặc nhập đơn Shopee trước'}</td></tr>`;
}

function parseCostNumber(s) {
  s = String(s || '').replace(/[₫đ\s]/gi, '');
  if (/^\d+[.,]\d{1,2}$/.test(s)) return Math.round(parseFloat(s.replace(',', '.')));
  const n = parseInt(s.replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? null : n;
}
function pasteCostsModal() {
  openModal('Dán giá vốn từ Excel', `
    <p class="muted">Trong Excel, chọn 2 cột <b>SKU</b> (hoặc tên sản phẩm) và <b>Giá vốn</b>, nhấn Ctrl+C rồi dán vào ô dưới.
      Mẹo: bấm “Sao chép danh sách SKU” ở trang Sản phẩm, dán vào Excel, điền cột giá vốn rồi dán lại đây.</p>
    <textarea id="cost-paste" style="width:100%;min-height:200px;font-family:ui-monospace,monospace" placeholder="DA1134K&#9;95000&#10;DA199DTN&#9;48000&#10;Áo thun basic&#9;75000"></textarea>
    <p class="muted small" id="cost-preview"></p>
    <div class="row-actions"><span style="flex:1"></span><button class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary" id="cost-apply">Cập nhật giá vốn</button></div>`, body => {
    const stats = productStats(null);
    const bySku = new Map(stats.filter(p => p.sku).map(p => [p.sku.toUpperCase(), p.key]));
    const byName = new Map(stats.map(p => [p.name.normalize('NFC').trim().toLowerCase(), p.key]));
    const parse = () => $('#cost-paste', body).value.split(/\r?\n/).map(line => {
      // Giữ ô trống: giá vốn luôn là cột CUỐI; cột cuối trống thì bỏ qua dòng (không lấy nhầm cột giá bán)
      let parts = /\t|;/.test(line) ? line.split(/\t|;/).map(s => s.trim()) : [];
      if (!parts.length) { const m = /^(.*\S)\s+(\S+)$/.exec(line.trim()); parts = m ? [m[1], m[2]] : []; }
      const token0 = parts.find(Boolean);
      if (parts.length < 2 || !token0 || !parts[parts.length - 1]) return null;
      const cost = parseCostNumber(parts[parts.length - 1]);
      if (cost == null) return null;   // dòng tiêu đề
      const token = token0.normalize('NFC'), up = token.toUpperCase(), low = token.toLowerCase();
      const key = bySku.get(up) || byName.get(low) || (/\s/.test(token) ? 'name:' + low : 'sku:' + up);
      return { key, cost, known: bySku.has(up) || byName.has(low) };
    }).filter(Boolean);
    const preview = () => { const r = parse(); $('#cost-preview', body).textContent = r.length ? `${r.length} dòng hợp lệ · ${r.filter(x => x.known).length} khớp sản phẩm đã bán · ${r.filter(x => !x.known).length} mã mới` : ''; };
    $('#cost-paste', body).addEventListener('input', preview);
    $('#cost-apply', body).addEventListener('click', () => {
      const r = parse();
      if (!r.length) { toast('Chưa có dòng hợp lệ (cần 2 cột: SKU và giá vốn)'); return; }
      r.forEach(x => { if (x.cost > 0) state.costs[x.key] = x.cost; else delete state.costs[x.key]; });
      save(); closeModal(); toast(`Đã cập nhật giá vốn cho ${r.length} mã`); rerender();
    });
  });
}
async function copySkuList() {
  const list = productStats(null).filter(p => p.qty || p.cost).sort((a, b) => b.revenue - a.revenue);
  const tsv = ['SKU\tTên sản phẩm\tĐã bán\tGiá bán TB\tGiá vốn',
    ...list.map(p => [p.sku || p.name, p.sku ? p.name : '', p.qty, p.qty ? Math.round(p.revenue / p.qty) : '', p.cost || ''].join('\t'))].join('\n');
  try { await navigator.clipboard.writeText(tsv); toast(`Đã sao chép ${list.length} mã – dán vào Excel`); }
  catch (e) { openModal('Danh sách SKU', `<p class="muted">Chọn hết (Ctrl+A), sao chép (Ctrl+C) rồi dán vào Excel.</p><textarea style="width:100%;min-height:260px">${esc(tsv)}</textarea>`); }
}

/* ---------- View: Marketing ---------- */
const mktStage = k => MKT_STAGES.find(s => s.key === k) || MKT_STAGES[0];
const mktBadge = k => { const s = mktStage(k); return `<span class="badge" style="--c:${s.color}">${s.label}</span>`; };
const campById = id => id ? state.campaigns.find(c => c.id === id) : null;
const nextMktStage = c => { if (c.stage === 'paused') return 'running'; const i = MKT_FLOW.indexOf(c.stage); return i >= 0 && i < MKT_FLOW.length - 1 ? MKT_FLOW[i + 1] : null; };
const fmtRoas = x => x == null || !isFinite(x) ? '—' : x.toFixed(1).replace('.', ',') + 'x';
const roasRating = roas => roas == null ? ['Chưa đầu tư', '#9ca3af'] : roas >= 4 ? ['Hiệu quả cao', '#16a34a'] : roas >= 2 ? ['Ổn', '#d97706'] : ['Cần tối ưu', '#dc2626'];
const isMktSpend = t => t.type === 'expense' && (t.category === 'Quảng cáo' || !!t.campaignId);
const num = n => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
function campaignOptions(sel, all = false) {
  const list = state.campaigns.filter(c => all || ['running', 'paused'].includes(c.stage) || c.id === sel);
  return list.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)} (${esc(c.channel)})</option>`).join('');
}

function campStats(c, r) {
  const spend = state.transactions.filter(t => t.campaignId === c.id && (!r || inRange(t.date, r))).reduce((s, t) => s + +t.amount, 0);
  const orders = state.orders.filter(o => o.campaignId === c.id && isRevenue(o) && (!r || inRange(dayOf(o.createdAt), r)));
  const revenue = orders.reduce((s, o) => s + orderTotal(o), 0);
  // Khách mới nhờ chiến dịch: khách có đơn đầu tiên đến từ chiến dịch này
  const firstOrder = {};
  state.orders.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(o => { if (!firstOrder[o.customerId]) firstOrder[o.customerId] = o; });
  const newCust = Object.values(firstOrder).filter(o => o.campaignId === c.id && (!r || inRange(dayOf(o.createdAt), r))).length;
  return {
    spend, orders: orders.length, revenue, newCust, list: orders,
    roas: spend ? revenue / spend : null, cpa: orders.length ? spend / orders.length : null,
    ctr: c.reach ? c.clicks / c.reach : null, cpc: c.clicks ? spend / c.clicks : null, cr: c.clicks ? orders.length / c.clicks : null,
  };
}
function channelStats(r) {
  return CHANNELS.map(ch => {
    const ids = new Set(state.campaigns.filter(c => c.channel === ch).map(c => c.id));
    const campSpend = state.transactions.filter(t => ids.has(t.campaignId) && inRange(t.date, r)).reduce((s, t) => s + +t.amount, 0);
    const ads = adSpendFor(r, ch), spend = campSpend + ads;
    const valid = state.orders.filter(o => isRevenue(o) && inRange(dayOf(o.createdAt), r));
    const chOrders = valid.filter(o => o.channel === ch), attr = valid.filter(o => ids.has(o.campaignId));
    const attrRevenue = attr.reduce((s, o) => s + orderTotal(o), 0), revenue = chOrders.reduce((s, o) => s + orderTotal(o), 0);
    // ROAS kênh = toàn bộ doanh thu kênh / toàn bộ chi quảng cáo của kênh (Ads theo ngày + chiến dịch)
    return {
      ch, spend, ads, orders: chOrders.length, revenue,
      attrOrders: attr.length, attrRevenue, roas: spend ? revenue / spend : null, cpa: chOrders.length && spend ? spend / chOrders.length : null,
      newCust: state.customers.filter(c => c.source === ch && inRange(dayOf(c.createdAt), r)).length,
      running: state.campaigns.filter(c => c.channel === ch && c.stage === 'running').length,
    };
  });
}
function budgetBar(spend, budget) {
  if (!budget) return `<span class="muted small">${money(spend)}</span>`;
  const p = spend / budget;
  return `<div class="budget"><div class="hbar-t ${p > 1 ? 'over' : p > .85 ? 'warn' : ''}"><i style="width:${Math.min(100, p * 100).toFixed(1)}%"></i></div><small>${shortMoney(spend)} / ${shortMoney(budget)} · ${pct(p)}</small></div>`;
}
function mktAlerts() {
  const today = todayStr(), out = [];
  state.campaigns.forEach(c => {
    const s = campStats(c);
    if (c.budget && s.spend > c.budget) out.push(['bad', `Vượt ngân sách: đã chi ${money(s.spend)} / ${money(c.budget)}`, c]);
    else if (c.stage === 'running' && c.budget && s.spend > c.budget * .85) out.push(['warn', `Đã dùng ${pct(s.spend / c.budget)} ngân sách`, c]);
    if (c.stage === 'running' && c.end && c.end < today) out.push(['warn', `Đã qua ngày kết thúc ${fmtDay(c.end)} – cần kết thúc & đánh giá`, c]);
    if (c.stage === 'running' && s.spend >= 1e6 && (s.roas || 0) < 1.5) out.push(['bad', `ROAS chỉ ${fmtRoas(s.roas)} – cân nhắc tạm dừng hoặc đổi nội dung`, c]);
    if (['idea', 'production', 'review'].includes(c.stage) && c.start && c.start <= today) out.push(['warn', `Đã tới ngày bắt đầu ${fmtDay(c.start)} nhưng còn ở bước “${mktStage(c.stage).label}”`, c]);
    else if (c.stage === 'review') out.push(['info', 'Đang chờ duyệt nội dung & ngân sách', c]);
    if (c.stage === 'done' && !c.result) out.push(['info', 'Đã kết thúc nhưng chưa ghi đánh giá / bài học', c]);
  });
  return out;
}
function mktSuggestions(ch) {
  const out = [], invested = ch.filter(x => x.spend > 0).sort((a, b) => b.roas - a.roas);
  if (invested.length) {
    const best = invested[0];
    out.push(`<b>Tăng ngân sách cho ${esc(best.ch)}</b> – ROAS ${fmtRoas(best.roas)}, mỗi đơn tốn ${best.cpa ? money(best.cpa) : '—'}.`);
  }
  invested.filter(x => x.roas < 2 && x !== invested[0]).forEach(x => out.push(`<b>Tối ưu hoặc giảm chi ${esc(x.ch)}</b> – ROAS ${fmtRoas(x.roas)}: thử đổi nội dung, tệp khách hoặc khung giờ.`));
  ch.filter(x => !x.spend && x.revenue > 0 && x.ch !== 'Tại cửa hàng').sort((a, b) => b.revenue - a.revenue).slice(0, 2)
    .forEach(x => out.push(`<b>${esc(x.ch)}</b> đang có ${money(x.revenue)} doanh thu tự nhiên mà chưa đầu tư – thử một chiến dịch nhỏ để đo hiệu quả.`));
  return out;
}

function renderMarketing(el) {
  const r = periodRange(ui.mktPeriod), m = metrics(r);
  const mktTx = state.transactions.filter(t => isMktSpend(t) && inRange(t.date, r));
  const spendAll = mktTx.reduce((s, t) => s + +t.amount, 0) + m.adSpend;
  const attr = m.valid.filter(o => campById(o.campaignId)), attrRev = attr.reduce((s, o) => s + orderTotal(o), 0);
  const ch = channelStats(r), shownCh = ch.filter(x => x.spend || x.revenue || x.running);
  const counts = Object.fromEntries(MKT_STAGES.map(s => [s.key, 0]));
  state.campaigns.forEach(c => counts[c.stage]++);
  const alerts = mktAlerts(), sugg = mktSuggestions(ch);
  const step = s => `<button class="flow-step ${ui.mktStage === s.key ? 'on' : ''}" style="--c:${s.color}" data-action="filterMkt" data-s="${s.key}"><b>${counts[s.key]}</b><span>${s.label}</span></button>`;
  const order = ['running', 'paused', 'review', 'production', 'idea', 'done'];
  const camps = state.campaigns.filter(c => ui.mktStage === 'all' || c.stage === ui.mktStage).sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage) || String(b.start).localeCompare(String(a.start)));

  el.innerHTML = `
    <div class="toolbar">${periodSeg(ui.mktPeriod, 'setMktPeriod')}<span class="grow"></span>
      <button class="btn primary" data-action="newCampaign">+ Chiến dịch mới</button></div>
    <div class="kpis">
      ${kpi('Chi phí quảng cáo', money(spendAll), m.adSpend ? `<a href="#ads">${money(m.adSpend)} Ads theo ngày</a> · ${money(spendAll - m.adSpend)} chiến dịch / khác` : '<a href="#ads">Nhập chi phí Ads theo ngày →</a>')}
      ${kpi('ROAS tổng', fmtRoas(spendAll ? m.orderRevenue / spendAll : null), 'Doanh thu đơn hàng / chi phí quảng cáo')}
      ${kpi('Chi phí / đơn (CPA)', m.valid.length && spendAll ? money(spendAll / m.valid.length) : '—', 'Chi phí quảng cáo để có 1 đơn')}
      ${kpi('Doanh thu từ chiến dịch', money(attrRev), `${attr.length} đơn · ${pct(m.orderRevenue ? attrRev / m.orderRevenue : 0)} tổng doanh thu đơn`)}
      ${kpi('Chi MKT / doanh thu', pct(m.revenue ? spendAll / m.revenue : 0), 'Nên giữ dưới 15–20%')}
      ${kpi('Chiến dịch đang chạy', counts.running, `${counts.review} chờ duyệt · ${counts.production + counts.idea} đang chuẩn bị`)}
    </div>
    <div class="grid-2">
      <div class="card span-2"><div class="card-h"><h3>Hiệu quả theo kênh</h3><span class="muted small">ROAS ≥ 4x: hiệu quả cao · 2–4x: ổn · &lt; 2x: cần tối ưu</span></div>
        <div class="chart-box sm"><canvas id="ch-mkt"></canvas></div>
        <div class="table-wrap" style="margin-top:12px"><table class="tbl static"><thead><tr><th>Kênh</th><th class="num">Chi phí QC</th><th class="num">Tổng DT kênh</th><th class="num">Đơn</th><th class="num">ROAS</th><th class="num">Chi phí / đơn</th><th class="num">DT từ chiến dịch</th><th class="num">Khách mới</th><th>Đánh giá</th></tr></thead><tbody>
          ${shownCh.map(x => { const [lbl, col] = roasRating(x.roas); return `<tr><td><b>${esc(x.ch)}</b>${x.running ? `<div class="muted small">${x.running} CD đang chạy</div>` : ''}</td><td class="num">${money(x.spend)}${x.ads && x.spend > x.ads ? `<div class="muted small">Ads ${shortMoney(x.ads)} + CD ${shortMoney(x.spend - x.ads)}</div>` : ''}</td><td class="num">${money(x.revenue)}</td><td class="num">${x.orders}</td><td class="num"><b>${fmtRoas(x.roas)}</b></td><td class="num">${x.cpa ? money(x.cpa) : '—'}</td><td class="num">${x.attrRevenue ? money(x.attrRevenue) + ` <span class="muted small">(${x.attrOrders} đơn)</span>` : '—'}</td><td class="num">${x.newCust}</td><td><span class="badge" style="--c:${col}">${lbl}</span></td></tr>`; }).join('') || '<tr><td colspan="9" class="empty">Chưa có dữ liệu trong kỳ</td></tr>'}
        </tbody></table></div></div>
      <div class="card"><h3>Cảnh báo triển khai</h3><ul class="list">
        ${alerts.map(([lv, msg, c]) => `<li class="clickable alert-${lv}" data-action="viewCampaign" data-id="${c.id}"><span><b>${esc(c.name)}</b><div class="meta">${msg}</div></span></li>`).join('') || '<li class="empty">Mọi chiến dịch đang ổn</li>'}</ul></div>
      <div class="card"><h3>Gợi ý phân bổ ngân sách</h3><ul class="list sugg">${sugg.map(s => `<li><span>${s}</span></li>`).join('') || '<li class="empty">Cần thêm dữ liệu chi phí để gợi ý</li>'}</ul></div>
    </div>
    <h3>Luồng triển khai chiến dịch</h3>
    <div class="flow">${MKT_FLOW.map(k => step(mktStage(k))).join('<span class="flow-arrow">→</span>')}<span class="flow-sep"></span>${step(mktStage('paused'))}</div>
    ${ui.mktStage !== 'all' ? `<div><button class="btn ghost sm" data-action="filterMkt" data-s="${ui.mktStage}">Bỏ lọc: ${mktStage(ui.mktStage).label} ×</button></div>` : ''}
    <div class="card flush"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Chiến dịch</th><th>Kênh</th><th>Thời gian</th><th>Giai đoạn</th><th>Ngân sách đã dùng</th><th class="num">Đơn</th><th class="num">Doanh thu</th><th class="num">ROAS</th><th></th></tr></thead><tbody>
      ${camps.map(c => { const s = campStats(c), nx = nextMktStage(c); return `<tr data-action="viewCampaign" data-id="${c.id}">
        <td><b>${esc(c.name)}</b><div class="muted small">${esc(c.format)} · ${esc(c.objective)}</div></td><td>${esc(c.channel)}</td>
        <td>${fmtDay(c.start)}<div class="muted small">→ ${fmtDay(c.end)}</div></td><td>${mktBadge(c.stage)}</td><td>${budgetBar(s.spend, c.budget)}</td>
        <td class="num">${s.orders}</td><td class="num">${money(s.revenue)}</td><td class="num"><b>${fmtRoas(s.roas)}</b></td>
        <td>${nx ? `<button class="btn sm" data-action="advanceCamp" data-id="${c.id}">→ ${mktStage(nx).label}</button>` : ''}</td></tr>`; }).join('') || `<tr><td colspan="9" class="empty">${state.campaigns.length ? 'Không có chiến dịch ở giai đoạn này' : 'Chưa có chiến dịch – bấm “+ Chiến dịch mới” để lên kế hoạch, hoặc <a href="#" data-action="seedMkt">tạo chiến dịch mẫu để xem thử</a>'}</td></tr>`}
      </tbody></table></div></div>`;

  const canvas = $('#ch-mkt');
  if (!noChart(canvas)) {
    const muted = cssVar('--muted');
    charts.push(new Chart(canvas, {
      type: 'bar',
      data: {
        labels: shownCh.map(x => x.ch),
        datasets: [
          { label: 'Chi phí MKT', data: shownCh.map(x => x.spend), backgroundColor: cssVar('--c-exp'), borderRadius: 4 },
          { label: 'Doanh thu từ chiến dịch', data: shownCh.map(x => x.attrRevenue), backgroundColor: cssVar('--c-rev'), borderRadius: 4 },
          { label: 'Tổng doanh thu kênh', data: shownCh.map(x => x.revenue), backgroundColor: cssVar('--muted') + '59', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: muted, boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${money(c.raw)}`, footer: items => { const x = shownCh[items[0].dataIndex]; return 'ROAS: ' + fmtRoas(x.roas); } } } },
        scales: { x: { grid: { display: false }, ticks: { color: muted } }, y: { ticks: { color: muted, callback: v => shortMoney(v) }, grid: { color: cssVar('--line') } } },
      },
    }));
  }
}

function setCampStage(c, stage, note = '') {
  c.stage = stage;
  c.history.push({ stage, at: new Date().toISOString(), note });
  save();
}
function advanceCamp(id, fromModal) {
  const c = campById(id), nx = c && nextMktStage(c);
  if (!nx) return;
  if (nx === 'running') {
    const pending = c.checklist.slice(0, 3).filter(x => !x.done).length;
    if (pending && !confirm(`Còn ${pending} bước chuẩn bị chưa xong (mục tiêu, nội dung, duyệt). Vẫn chạy chiến dịch?`)) return;
  }
  setCampStage(c, nx, c.stage === 'paused' ? 'Chạy lại' : '');
  toast(`${c.name} → ${mktStage(nx).label}`);
  rerender();
  if (fromModal || nx === 'done') viewCampaign(id);
}

function viewCampaign(id) {
  const c = campById(id); if (!c) return;
  const s = campStats(c), reached = new Set(c.history.map(h => h.stage)), nx = nextMktStage(c);
  const timeOf = k => { const h = [...c.history].reverse().find(x => x.stage === k); return h ? fmtDT(h.at) : ''; };
  const spendLog = state.transactions.filter(t => t.campaignId === id).sort((a, b) => b.date.localeCompare(a.date));
  const doneN = c.checklist.filter(x => x.done).length;
  const mini = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
  openModal(c.name, `
    <div class="stepper">${MKT_FLOW.map((k, i) => `<div class="step ${reached.has(k) ? 'done' : ''} ${c.stage === k ? 'current' : ''}"><div class="dot">${reached.has(k) ? '✓' : i + 1}</div>${mktStage(k).label}<time>${timeOf(k)}</time></div>`).join('')}</div>
    ${c.stage === 'paused' ? `<p>${mktBadge('paused')} <span class="muted small">${timeOf('paused')}</span></p>` : ''}
    <div class="info-grid">
      <div><span>Kênh · Hình thức</span>${esc(c.channel)} · ${esc(c.format)}</div>
      <div><span>Mục tiêu</span>${esc(c.objective)}</div>
      <div><span>Thời gian</span>${fmtDay(c.start)} → ${fmtDay(c.end)}</div>
      <div><span>Phụ trách</span>${esc(c.owner || '—')}</div>
      <div style="grid-column:1/-1"><span>Ngân sách</span>${budgetBar(s.spend, c.budget)}</div>
      ${c.note ? `<div style="grid-column:1/-1"><span>Ghi chú</span>${esc(c.note)}</div>` : ''}
    </div>
    <div class="mini-kpis">
      ${mini('Chi phí', money(s.spend))}${mini('Đơn hàng', s.orders)}${mini('Doanh thu', money(s.revenue))}${mini('ROAS', fmtRoas(s.roas))}
      ${mini('CPA (chi phí/đơn)', s.cpa ? money(s.cpa) : '—')}${mini('Khách mới', s.newCust)}${mini('Tiếp cận', num(c.reach))}${mini('Click · CTR', `${num(c.clicks)} · ${s.ctr != null ? pct(s.ctr) : '—'}`)}
      ${mini('CPC', s.cpc ? money(s.cpc) : '—')}${mini('Tỷ lệ ra đơn', s.cr != null ? pct(s.cr) : '—')}${mini('Leads / inbox', num(c.leads))}
    </div>
    <div class="detail-sec"><h4>Checklist triển khai (${doneN}/${c.checklist.length})</h4>
      <div id="checklist">${c.checklist.map((x, i) => `<label class="check"><input type="checkbox" data-i="${i}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span></label>`).join('')}</div>
      <button class="btn sm ghost" data-action="campToWorkflow" data-id="${c.id}" style="margin-top:6px">Đẩy các bước chưa xong sang Workflow</button>
    </div>
    <div class="detail-sec"><h4>Đánh giá & bài học</h4>
      <textarea id="camp-result" style="width:100%" placeholder="Điều gì hiệu quả? Điều gì cần thay đổi cho lần sau?">${esc(c.result)}</textarea>
    </div>
    <div class="detail-sec"><h4>Chi tiêu (${spendLog.length})</h4><ul class="list">
      ${spendLog.slice(0, 8).map(t => `<li><span>${fmtDay(t.date)} <span class="meta">${esc(t.note)}</span></span><b>${money(t.amount)}</b></li>`).join('') || '<li class="empty">Chưa ghi chi tiêu</li>'}
      ${spendLog.length > 8 ? `<li class="meta">… và ${spendLog.length - 8} khoản khác (xem ở Thu – Chi)</li>` : ''}</ul></div>
    <div class="detail-sec"><h4>Đơn hàng từ chiến dịch (${s.orders})</h4><ul class="list">
      ${s.list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(o => `<li class="clickable" data-action="viewOrder" data-id="${o.id}"><span><b>${o.id}</b> <span class="meta">${esc((custById(o.customerId) || {}).name || '')} · ${fmtDT(o.createdAt)}</span></span><span>${money(orderTotal(o))}</span></li>`).join('') || '<li class="empty">Chưa có đơn gắn với chiến dịch</li>'}</ul></div>
    <div class="row-actions">
      ${nx ? `<button class="btn primary" data-action="advanceCampModal" data-id="${c.id}">${c.stage === 'paused' ? 'Chạy lại' : 'Chuyển sang: ' + mktStage(nx).label}</button>` : ''}
      ${c.stage === 'running' ? `<button class="btn" data-action="pauseCamp" data-id="${c.id}">Tạm dừng</button>` : ''}
      ${c.stage === 'paused' ? `<button class="btn" data-action="endCamp" data-id="${c.id}">Kết thúc</button>` : ''}
      <button class="btn" data-action="campResult" data-id="${c.id}">Cập nhật chi tiêu & kết quả</button>
      <button class="btn" data-action="editCampaign" data-id="${c.id}">Sửa</button>
      <span style="flex:1"></span><button class="btn ghost danger" data-action="deleteCampaign" data-id="${c.id}">Xóa</button>
    </div>`, body => {
    $('#checklist', body).addEventListener('change', e => {
      const i = +e.target.dataset.i; if (!c.checklist[i]) return;
      c.checklist[i].done = e.target.checked; save();
      $('.detail-sec h4', body).textContent = `Checklist triển khai (${c.checklist.filter(x => x.done).length}/${c.checklist.length})`;
    });
    $('#camp-result', body).addEventListener('change', e => { c.result = e.target.value.trim(); save(); toast('Đã lưu đánh giá'); });
  });
}

function campaignModal(id) {
  const c = campById(id) || { name: '', channel: 'Facebook', format: MKT_FORMATS[0], objective: MKT_OBJECTIVES[0], owner: '', start: todayStr(), end: ymd(addDays(new Date(), 14)), budget: '', note: '' };
  openModal(id ? 'Sửa chiến dịch' : 'Chiến dịch marketing mới', `
    <form class="form" id="f-camp">
      <label class="full">Tên chiến dịch<input name="name" required value="${esc(c.name)}" placeholder="VD: Sale cuối tuần – váy midi"></label>
      <label>Kênh<select name="channel">${opts(CHANNELS, c.channel)}</select></label>
      <label>Hình thức<select name="format">${opts(MKT_FORMATS, c.format)}</select></label>
      <label>Mục tiêu<select name="objective">${opts(MKT_OBJECTIVES, c.objective)}</select></label>
      <label>Người phụ trách<input name="owner" value="${esc(c.owner)}"></label>
      <label>Ngày bắt đầu<input name="start" type="date" required value="${esc(c.start)}"></label>
      <label>Ngày kết thúc<input name="end" type="date" required value="${esc(c.end)}"></label>
      <label>Ngân sách (₫)<input name="budget" type="number" min="0" step="100000" value="${esc(c.budget)}"></label>
      <label class="full">Ghi chú (thông điệp, tệp khách, sản phẩm chủ lực…)<textarea name="note">${esc(c.note)}</textarea></label>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-camp', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      d.name = d.name.trim(); d.owner = d.owner.trim(); d.note = d.note.trim(); d.budget = +d.budget || 0;
      if (d.end < d.start) { toast('Ngày kết thúc phải sau ngày bắt đầu'); return; }
      if (id) { Object.assign(c, d); save(); rerender(); viewCampaign(id); }
      else {
        const nc = { id: nextId('CD', state.campaigns, 3), ...d, stage: 'idea', reach: 0, clicks: 0, leads: 0, result: '', checklist: MKT_CHECKLIST.map(text => ({ text, done: false })), history: [{ stage: 'idea', at: new Date().toISOString(), note: 'Tạo chiến dịch' }] };
        state.campaigns.push(nc); save(); rerender(); viewCampaign(nc.id);
      }
      toast('Đã lưu chiến dịch');
    });
  });
}

function campResultModal(id) {
  const c = campById(id); if (!c) return;
  openModal(`Cập nhật kết quả – ${c.name}`, `
    <form class="form" id="f-cres">
      <div class="section-t">Ghi thêm chi tiêu (tự ghi vào sổ Thu – Chi, hạng mục Quảng cáo)</div>
      <label>Số tiền (₫)<input name="amount" type="number" min="0" step="1000" placeholder="Để trống nếu không có"></label>
      <label>Ngày<input name="date" type="date" value="${todayStr()}"></label>
      <label class="full">Nội dung chi<input name="note" placeholder="VD: Nạp tiền ads, phí KOC, quà tặng livestream…"></label>
      <div class="section-t">Số liệu lũy kế từ nền tảng quảng cáo</div>
      <label>Tiếp cận (người)<input name="reach" type="number" min="0" value="${c.reach || 0}"></label>
      <label>Lượt click<input name="clicks" type="number" min="0" value="${c.clicks || 0}"></label>
      <label>Leads / inbox<input name="leads" type="number" min="0" value="${c.leads || 0}"></label>
      <div class="form-actions"><button type="button" class="btn ghost" data-action="viewCampaign" data-id="${c.id}">Quay lại</button><button class="btn primary">Lưu</button></div>
    </form>`, body => {
    $('#f-cres', body).addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const amount = +d.amount || 0;
      if (amount > 0) state.transactions.push({ id: nextId('GD', state.transactions), type: 'expense', category: 'Quảng cáo', amount, date: d.date || todayStr(), note: d.note.trim() || 'Ads: ' + c.name, campaignId: c.id });
      c.reach = +d.reach || 0; c.clicks = +d.clicks || 0; c.leads = +d.leads || 0;
      save(); toast('Đã cập nhật kết quả'); rerender(); viewCampaign(c.id);
    });
  });
}

function campToWorkflow(id) {
  const c = campById(id); if (!c) return;
  const pending = c.checklist.filter(x => !x.done && !state.tasks.some(t => t.campaignId === c.id && t.title === `${x.text} – ${c.name}`));
  if (!pending.length) { toast('Không còn bước nào cần đẩy sang Workflow'); return; }
  // Chưa tới ngày chạy: rải hạn chót các bước trước ngày bắt đầu; đã chạy: rải từ hôm nay
  const now = new Date(), today = todayStr(), upcoming = c.start > today;
  const dueOf = k => { const d = upcoming ? ymd(addDays(parseDay(c.start), k - pending.length)) : ymd(addDays(now, k)); return d < today ? today : d; };
  pending.forEach((x, k) => state.tasks.push({ id: nextId('CV', state.tasks), title: `${x.text} – ${c.name}`, desc: `Chiến dịch ${c.channel} · ${c.format}`, assignee: c.owner || 'Marketing', due: dueOf(k), priority: k === 0 ? 'high' : 'medium', status: 'todo', orderId: '', campaignId: c.id, createdAt: now.toISOString() }));
  save(); toast(`Đã tạo ${pending.length} việc trong Workflow`);
}

/* ---------- View: Dữ liệu ---------- */
function renderSettings(el) {
  el.innerHTML = `
    <div class="grid-2">
      <div class="card"><h3>Sao lưu & khôi phục</h3>
        <p class="muted">Dữ liệu được lưu ngay trong trình duyệt này. Hãy xuất file sao lưu thường xuyên, và dùng file đó để chuyển dữ liệu sang máy khác.</p>
        <div class="toolbar"><button class="btn primary" data-action="exportData">Xuất file JSON</button>
          <label class="btn">Nhập file JSON<input type="file" id="import-file" accept=".json,application/json" hidden></label></div></div>
      <div class="card"><h3>Thống kê dữ liệu</h3><ul class="list">
        <li><span>Đơn hàng</span><b>${state.orders.length}</b></li><li><span>Khách hàng</span><b>${state.customers.length}</b></li>
        <li><span>Công việc</span><b>${state.tasks.length}</b></li><li><span>Giao dịch thu – chi</span><b>${state.transactions.length}</b></li>
        <li><span>Lượt chăm sóc</span><b>${state.careLogs.length}</b></li><li><span>Chiến dịch marketing</span><b>${state.campaigns.length}</b></li></ul></div>
      <div class="card span-2"><h3>Bắt đầu sử dụng thật</h3>
        <p class="muted">Ứng dụng đang chứa dữ liệu mẫu để bạn xem thử. Khi sẵn sàng, xóa toàn bộ để bắt đầu nhập dữ liệu thật của cửa hàng.</p>
        <div class="toolbar"><button class="btn danger" data-action="clearAll">Xóa toàn bộ dữ liệu</button><button class="btn ghost" data-action="resetDemo">Tạo lại dữ liệu mẫu</button></div></div>
    </div>`;
  $('#import-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (!d || !Array.isArray(d.orders) || !Array.isArray(d.customers)) throw new Error('bad');
        if (!confirm('Thay thế toàn bộ dữ liệu hiện tại bằng file này?')) return;
        state = normalize(d); save(); toast('Đã nhập dữ liệu'); rerender();
      } catch (err) { toast('File không hợp lệ'); }
    };
    reader.readAsText(file);
  });
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `fashion-store-backup-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Modal ---------- */
function openModal(title, html, onMount) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  $('#modal').classList.remove('hidden');
  document.body.classList.add('no-scroll');
  if (onMount) onMount($('#modal-body'));
  const first = $('#modal-body input:not([type=hidden]), #modal-body select');
  if (first && window.matchMedia('(min-width: 761px)').matches) first.focus();
}
function closeModal() { $('#modal').classList.add('hidden'); document.body.classList.remove('no-scroll'); }

/* ---------- Actions (event delegation) ---------- */
const ACTIONS = {
  closeModal,
  newOrder: () => newOrder(),
  newOrderFor: d => newOrder(d.id),
  viewOrder: d => viewOrder(d.id),
  advanceOrder: d => advanceOrder(d.id, false),
  advanceOrderModal: d => advanceOrder(d.id, true),
  editTracking: d => trackingModal(orderById(d.id), false),
  copySpx: d => copySpx(d.id),
  cancelOrder: d => { const o = orderById(d.id); const why = prompt('Lý do hủy đơn?', 'Khách đổi ý'); if (why === null) return; setOrderStatus(o, 'cancelled', why); toast('Đã hủy ' + o.id); rerender(); viewOrder(o.id); },
  returnOrder: d => { const o = orderById(d.id); const why = prompt('Lý do hoàn trả?', 'Không vừa size'); if (why === null) return; setOrderStatus(o, 'returned', why); toast('Đã ghi nhận hoàn trả ' + o.id); rerender(); viewOrder(o.id); },
  deleteOrder: d => { if (!confirm(`Xóa vĩnh viễn đơn ${d.id}?`)) return; state.orders = state.orders.filter(o => o.id !== d.id); save(); closeModal(); rerender(); },
  filterStatus: d => { ui.orderStatus = ui.orderStatus === d.s ? 'all' : d.s; if (location.hash !== '#orders') location.hash = '#orders'; else rerender(); },
  setPeriod: d => { ui.period = d.p; rerender(); },
  setFinPeriod: d => { ui.finPeriod = d.p; rerender(); },
  newTask: () => taskModal(),
  editTask: d => taskModal(d.id),
  moveTask: d => moveTask(d.id, d.to),
  deleteTask: d => { if (!confirm('Xóa công việc này?')) return; state.tasks = state.tasks.filter(t => t.id !== d.id); save(); closeModal(); rerender(); },
  applyTemplate: d => applyTemplate(+d.i),
  newTx: d => txModal(d.type),
  taxSettings: () => taxModal(),
  newInvoice: () => invoiceModal(),
  editInvoice: d => invoiceModal(d.id),
  deleteInvoice: d => { if (!confirm('Xóa hóa đơn này? PiShip / phí khác của nó sẽ không còn tính vào chi phí.')) return; state.platformInvoices = state.platformInvoices.filter(x => x.id !== d.id); save(); closeModal(); rerender(); },
  editTx: d => { const t = state.transactions.find(x => x.id === d.id); if (t) txModal(t.type, t.id); },
  deleteTx: d => { if (!confirm('Xóa giao dịch này?')) return; state.transactions = state.transactions.filter(t => t.id !== d.id); save(); rerender(); },
  newCustomer: () => customerModal(),
  editCustomer: d => customerModal(d.id),
  viewCustomer: d => viewCustomer(d.id),
  logCare: d => viewCustomer(d.id),
  deleteCustomer: d => {
    const n = state.orders.filter(o => o.customerId === d.id).length;
    if (!confirm(n ? `Khách này có ${n} đơn hàng. Vẫn xóa khách (đơn hàng được giữ lại)?` : 'Xóa khách hàng này?')) return;
    state.customers = state.customers.filter(c => c.id !== d.id); state.careLogs = state.careLogs.filter(l => l.customerId !== d.id);
    save(); closeModal(); rerender();
  },
  custDay: d => { ui.custDay = d.d === '0' ? todayStr() : ymd(addDays(parseDay(ui.custDay), +d.d)); if (ui.custDay > todayStr()) ui.custDay = todayStr(); rerender(); },
  setProdPeriod: d => { ui.prodPeriod = d.p; rerender(); },
  pasteCosts: () => pasteCostsModal(),
  copySkuList: () => copySkuList(),
  setMktPeriod: d => { ui.mktPeriod = d.p; rerender(); },
  filterMkt: d => { ui.mktStage = ui.mktStage === d.s ? 'all' : d.s; rerender(); },
  newCampaign: () => campaignModal(),
  editCampaign: d => campaignModal(d.id),
  viewCampaign: d => viewCampaign(d.id),
  advanceCamp: d => advanceCamp(d.id, false),
  advanceCampModal: d => advanceCamp(d.id, true),
  pauseCamp: d => { const c = campById(d.id); const why = prompt('Lý do tạm dừng?', 'ROAS thấp, cần đổi nội dung'); if (why === null) return; setCampStage(c, 'paused', why); rerender(); viewCampaign(c.id); },
  endCamp: d => { const c = campById(d.id); setCampStage(c, 'done', 'Kết thúc sau khi tạm dừng'); rerender(); viewCampaign(c.id); },
  campResult: d => campResultModal(d.id),
  campToWorkflow: d => campToWorkflow(d.id),
  deleteCampaign: d => {
    if (!confirm('Xóa chiến dịch này? Chi phí và đơn hàng vẫn được giữ lại, chỉ bỏ liên kết với chiến dịch.')) return;
    state.campaigns = state.campaigns.filter(c => c.id !== d.id);
    [...state.orders, ...state.transactions, ...state.tasks].forEach(x => { if (x.campaignId === d.id) x.campaignId = ''; });
    save(); closeModal(); rerender();
  },
  seedMkt: () => { seedMarketing(state); save(); toast('Đã tạo chiến dịch mẫu'); rerender(); },
  exportData,
  resetDemo: () => { if (!confirm('Thay toàn bộ dữ liệu bằng dữ liệu mẫu mới?')) return; state = seed(); save(); toast('Đã tạo dữ liệu mẫu'); rerender(); },
  clearAll: () => { if (!confirm('Xóa TOÀN BỘ dữ liệu? Nên xuất file sao lưu trước.')) return; state = normalize({}); save(); toast('Đã xóa dữ liệu'); rerender(); },
};

document.addEventListener('click', e => {
  if (e.target.id === 'modal') { closeModal(); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.action];
  if (!fn) return;
  e.preventDefault(); e.stopPropagation();
  fn(el.dataset, el);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) closeModal(); });

// Kéo thả Kanban
document.addEventListener('dragstart', e => {
  const t = e.target instanceof Element && e.target.closest('.task'); if (!t) return;
  e.dataTransfer.setData('text/plain', t.dataset.id); e.dataTransfer.effectAllowed = 'move'; t.classList.add('dragging');
});
document.addEventListener('dragend', () => { $$('.dragging').forEach(x => x.classList.remove('dragging')); $$('.kcol.over').forEach(x => x.classList.remove('over')); });
document.addEventListener('dragover', e => {
  const c = e.target instanceof Element && e.target.closest('.kcol'); if (!c) return;
  e.preventDefault(); $$('.kcol.over').forEach(x => x !== c && x.classList.remove('over')); c.classList.add('over');
});
document.addEventListener('drop', e => {
  const c = e.target instanceof Element && e.target.closest('.kcol'); if (!c) return;
  e.preventDefault(); moveTask(e.dataTransfer.getData('text/plain'), c.dataset.col);
});

window.addEventListener('hashchange', () => { closeModal(); route(); });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', route);
$('#today-label').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
// Chờ các file JS khác (nhập Shopee/SPX, Quảng cáo…) đăng ký xong trang rồi mới vẽ
document.addEventListener('DOMContentLoaded', route);
