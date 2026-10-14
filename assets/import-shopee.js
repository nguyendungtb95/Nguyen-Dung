'use strict';
/* =========================================================
   Nhập đơn hàng từ file Excel xuất ở Kênh Người Bán Shopee
   (Quản Lý Đơn Hàng → Xuất). File được đọc ngay trong trình
   duyệt, không gửi lên máy chủ nào.
   ========================================================= */

/* ---------- Đọc file .xlsx (zip + XML) không cần thư viện ---------- */
async function readXlsxRows(file) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt quá cũ – hãy dùng Chrome, Edge hoặc Safari bản mới.');
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const dec = new TextDecoder();
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Đây không phải file .xlsx hợp lệ.');
  const entries = {};
  let p = dv.getUint32(eocd + 16, true);
  for (let n = dv.getUint16(eocd + 10, true); n > 0; n--) {
    const nameLen = dv.getUint16(p + 28, true);
    entries[dec.decode(buf.subarray(p + 46, p + 46 + nameLen))] = {
      method: dv.getUint16(p + 10, true), size: dv.getUint32(p + 20, true), offset: dv.getUint32(p + 42, true),
    };
    p += 46 + nameLen + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  const readEntry = async name => {
    const e = entries[name]; if (!e) return null;
    const start = e.offset + 30 + dv.getUint16(e.offset + 26, true) + dv.getUint16(e.offset + 28, true);
    const data = buf.subarray(start, start + e.size);
    if (e.method === 0) return dec.decode(data);
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');

  // Sheet đầu tiên theo workbook.xml
  let sheetPath = Object.keys(entries).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  try {
    const wb = xml(await readEntry('xl/workbook.xml'));
    const first = wb.getElementsByTagName('sheet')[0];
    const rid = first && [...first.attributes].find(a => /(^|:)id$/.test(a.name) && a.name !== 'sheetId')?.value;
    const rels = xml(await readEntry('xl/_rels/workbook.xml.rels'));
    const target = [...rels.getElementsByTagName('Relationship')].find(r => r.getAttribute('Id') === rid)?.getAttribute('Target');
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
  } catch (e) { /* dùng sheet đầu tiên tìm được */ }
  if (!sheetPath || !entries[sheetPath]) throw new Error('Không tìm thấy trang tính trong file.');

  const shared = [];
  const ssText = await readEntry('xl/sharedStrings.xml');
  if (ssText) for (const si of xml(ssText).getElementsByTagName('si')) shared.push([...si.getElementsByTagName('t')].map(t => t.textContent).join(''));

  const colIdx = ref => { let n = 0; for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const rows = [];
  for (const row of xml(await readEntry(sheetPath)).getElementsByTagName('row')) {
    const out = [];
    for (const c of row.getElementsByTagName('c')) {
      const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0]?.textContent ?? '';
      out[colIdx(c.getAttribute('r') || 'A1')] =
        t === 's' ? shared[+v] ?? '' : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map(x => x.textContent).join('') : v;
    }
    // Shopee lưu một số chữ ở dạng dấu tách rời (NFD) → chuẩn hóa về NFC để so khớp
    rows.push(Array.from(out, x => (x ?? '').toString().normalize('NFC').replace(/\s+/g, ' ').trim()));
  }
  return rows;
}

/* ---------- Chuyển dữ liệu Shopee → đơn hàng của app ---------- */
const SHOPEE_COLS = {
  id: 'Mã đơn hàng', date: 'Ngày đặt hàng', status: 'Trạng Thái Đơn Hàng', cancelReason: 'Lý do hủy',
  tracking: 'Mã vận đơn', carrier: 'Đơn Vị Vận Chuyển', shipDate: 'Ngày gửi hàng', deliverDate: 'Thời gian giao hàng',
  returnStatus: 'Trạng thái Trả hàng/Hoàn tiền', product: 'Tên sản phẩm', sku: 'SKU phân loại hàng', skuProduct: 'SKU sản phẩm',
  variant: 'Tên phân loại hàng', price: 'Giá ưu đãi', origPrice: 'Giá gốc', qty: 'Số lượng', returnQty: 'Số lượng sản phẩm được hoàn trả',
  shopVoucher: 'Mã giảm giá của Shop', shopCombo: 'Giảm giá từ Combo của Shop', doneDate: 'Thời gian hoàn thành đơn hàng',
  paidDate: 'Thời gian đơn hàng được thanh toán', payment: 'Phương thức thanh toán',
  feeFixed: 'Phí cố định', feeService: 'Phí Dịch Vụ', feeTx: 'Phí xử lý giao dịch',
  buyer: 'Người Mua', name: 'Tên Người nhận', phone: 'Số điện thoại', province: 'Tỉnh/Thành phố', district: 'TP / Quận / Huyện',
  address: 'Địa chỉ nhận hàng', note: 'Ghi chú',
};
const SHOPEE_REQUIRED = ['id', 'date', 'status', 'product', 'qty'];

function shopeeDate(s) {
  if (!s || s === '-') return null;
  if (/^\d+(\.\d+)?$/.test(s) && +s > 20000) { const d = new Date(1899, 11, 30); d.setTime(d.getTime() + Math.round(+s * 864e5)); return d; }
  const d = new Date(s.replace(' ', 'T') + (s.length <= 16 ? ':00' : ''));
  return isNaN(d) ? null : d;
}
const shopeeNum = s => { const n = parseFloat(String(s || '').replace(/,/g, '')); return isNaN(n) ? 0 : n; };

function shopeeCarrier(s) {
  const rules = [[/SPX/i, 'SPX Express'], [/Giao Hàng Nhanh|GHN/i, 'GHN'], [/Tiết Kiệm|GHTK/i, 'GHTK'], [/Viettel/i, 'Viettel Post'],
    [/J&T/i, 'J&T Express'], [/Ninja/i, 'Ninja Van'], [/beDelivery/i, 'beDelivery'], [/Green SM|Xanh SM/i, 'Xanh SM'],
    [/Ahamove/i, 'Ahamove'], [/Grab/i, 'GrabExpress'], [/Best/i, 'BEST Express']];
  for (const [re, v] of rules) if (re.test(s || '')) return v;
  return s || 'Shopee';
}

function shopeeStatus(text, returnText, returnedQty, totalQty) {
  const s = (text || '').toLowerCase(), r = (returnText || '').toLowerCase();
  if (returnedQty > 0 && /chấp thuận|hoàn tiền|hoàn thành|đã hoàn/.test(r)) return returnedQty >= totalQty ? 'returned' : 'delivered';
  if (s.includes('hủy')) return 'cancelled';
  // "Người mua xác nhận đã nhận được hàng, tuy nhiên ... vẫn có thể gửi yêu cầu Trả hàng" là đơn đã giao
  if (/hoàn thành|đã nhận|đã giao/.test(s)) return 'delivered';
  if (s.includes('trả hàng')) return 'returned';
  if (/đang giao|vận chuyển/.test(s)) return 'shipping';
  if (/chờ lấy hàng|chờ giao|đang xử lý/.test(s)) return 'packing';
  if (s.includes('chờ xác nhận') || s.includes('chưa thanh toán')) return 'new';
  return 'confirmed';
}

function parseShopeeRows(rows) {
  const header = rows[0] || [];
  const norm = s => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const idx = {};
  for (const [k, label] of Object.entries(SHOPEE_COLS)) idx[k] = header.findIndex(h => norm(h) === norm(label));
  const missing = SHOPEE_REQUIRED.filter(k => idx[k] < 0).map(k => SHOPEE_COLS[k]);
  if (missing.length) throw new Error('File thiếu cột: ' + missing.join(', ') + '. Hãy dùng file xuất từ Quản Lý Đơn Hàng → Xuất.');
  const get = (r, k) => idx[k] >= 0 ? (r[idx[k]] || '') : '';

  const groups = new Map();
  rows.slice(1).forEach(r => { const id = get(r, 'id'); if (id) (groups.get(id) || groups.set(id, []).get(id)).push(r); });

  return [...groups.entries()].map(([code, lines]) => {
    const f = lines[0];   // các cột theo đơn (voucher, phí, khách) lặp lại ở mọi dòng → lấy dòng đầu
    const totalQty = lines.reduce((s, r) => s + shopeeNum(get(r, 'qty')), 0);
    const returnedQty = lines.reduce((s, r) => s + shopeeNum(get(r, 'returnQty')), 0);
    const status = shopeeStatus(get(f, 'status'), get(f, 'returnStatus'), returnedQty, totalQty);
    const partialReturn = status === 'delivered' && returnedQty > 0;
    const items = lines.map(r => ({
      name: get(r, 'product'), size: get(r, 'variant') || '—', sku: get(r, 'sku') || get(r, 'skuProduct'),
      qty: Math.max(0, shopeeNum(get(r, 'qty')) - (partialReturn ? shopeeNum(get(r, 'returnQty')) : 0)),
      price: shopeeNum(get(r, 'price')) || shopeeNum(get(r, 'origPrice')),
    })).filter(i => i.qty > 0 || status === 'returned' || status === 'cancelled');

    const created = shopeeDate(get(f, 'date')) || new Date();
    const paid = shopeeDate(get(f, 'paidDate')), shipped = shopeeDate(get(f, 'shipDate'));
    const delivered = shopeeDate(get(f, 'deliverDate')), done = shopeeDate(get(f, 'doneDate'));
    const carrier = shopeeCarrier(get(f, 'carrier')), tracking = get(f, 'tracking');
    const history = [];
    let last = created.getTime();
    const push = (st, d, note = '') => { const t = Math.max(last, (d || new Date(last)).getTime()); last = t; history.push({ status: st, at: new Date(t).toISOString(), note }); };
    push('new', created, 'Đặt hàng trên Shopee');
    if (status === 'cancelled') push('cancelled', paid || created, get(f, 'cancelReason') || 'Hủy trên Shopee');
    else {
      const reach = FLOW.indexOf(status === 'returned' ? 'delivered' : status);
      if (reach >= 1) push('confirmed', paid || created);
      if (reach >= 2) push('packing', paid || created);
      if (reach >= 3) push('shipping', shipped || paid || created, [carrier, tracking].filter(Boolean).join(': '));
      if (reach >= 4) push('delivered', delivered || done || shipped);
      if (status === 'returned') push('returned', done || delivered, 'Trả hàng/Hoàn tiền trên Shopee');
    }

    const phone = get(f, 'phone');
    const notes = [];
    if (partialReturn) notes.push(`Khách trả ${returnedQty}/${totalQty} sản phẩm`);
    if (get(f, 'note')) notes.push('Khách ghi chú: ' + get(f, 'note'));
    return {
      code, status, items, history, carrier, tracking,
      createdAt: created.toISOString(),
      discount: shopeeNum(get(f, 'shopVoucher')) + shopeeNum(get(f, 'shopCombo')),
      platformFee: status === 'cancelled' ? 0 : shopeeNum(get(f, 'feeFixed')) + shopeeNum(get(f, 'feeService')) + shopeeNum(get(f, 'feeTx')),
      payment: get(f, 'payment'), shippingMethod: get(f, 'carrier'), note: notes.join(' · '),
      customer: {
        buyer: get(f, 'buyer'), name: get(f, 'name') || get(f, 'buyer') || 'Khách Shopee',
        phone: phone.includes('*') ? '' : phone,
        address: get(f, 'address') || [get(f, 'district'), get(f, 'province')].filter(Boolean).join(', '),
      },
    };
  });
}

/* ---------- Xem trước & ghi vào dữ liệu ---------- */
async function importShopeeFile(file) {
  let parsed;
  try { parsed = parseShopeeRows(await readXlsxRows(file)); }
  catch (e) { toast(e.message || 'Không đọc được file'); return; }
  if (!parsed.length) { toast('File không có đơn hàng nào'); return; }

  const existing = new Map(state.orders.filter(o => o.platformOrderId).map(o => [o.platformOrderId, o]));
  const knownBuyers = new Set(state.customers.map(c => c.shopeeUser).filter(Boolean));
  const fresh = parsed.filter(p => !existing.has(p.code)), update = parsed.filter(p => existing.has(p.code));
  const newBuyers = new Set(fresh.filter(p => !knownBuyers.has(p.customer.buyer || p.customer.name)).map(p => p.customer.buyer || p.customer.name));
  const valid = parsed.filter(p => p.status !== 'cancelled' && p.status !== 'returned');
  const gross = valid.reduce((s, p) => s + p.items.reduce((a, i) => a + i.qty * i.price, 0) - p.discount, 0);
  const fees = parsed.reduce((s, p) => s + p.platformFee, 0);
  const days = parsed.map(p => dayOf(p.createdAt)).sort();
  const byStatus = STATUSES.map(s => [s, parsed.filter(p => p.status === s.key).length]).filter(x => x[1]);

  openModal('Nhập đơn từ Shopee', `
    <p class="muted">File <b>${esc(file.name)}</b> · đơn đặt từ ${fmtDay(days[0])} đến ${fmtDay(days[days.length - 1])}</p>
    <div class="mini-kpis">
      <div><span>Tổng số đơn</span><b>${parsed.length}</b></div>
      <div><span>Đơn mới</span><b>${fresh.length}</b></div>
      <div><span>Đơn đã có – cập nhật</span><b>${update.length}</b></div>
      <div><span>Khách hàng mới</span><b>${newBuyers.size}</b></div>
      <div><span>Doanh thu (trừ hủy/hoàn)</span><b>${money(gross)}</b></div>
      <div><span>Phí sàn Shopee</span><b>${money(fees)}</b></div>
      <div><span>Thực nhận ước tính</span><b>${money(gross - fees)}</b></div>
      <div><span>Tỷ lệ phí sàn</span><b>${gross ? pct(fees / gross) : '—'}</b></div>
    </div>
    <div class="detail-sec"><h4>Trạng thái</h4><p>${byStatus.map(([s, n]) => `${badge(s.key)} ${n}`).join(' &nbsp; ')}</p></div>
    <p class="muted small">Doanh thu = giá bán sau khuyến mãi của shop − voucher shop. Voucher và trợ giá ship do Shopee tài trợ không trừ vào doanh thu của bạn.
      Phí sàn = phí cố định + phí dịch vụ + phí xử lý giao dịch, được tính tự động vào chi phí. Nhập lại file mới hơn sẽ cập nhật trạng thái đơn đã có, không tạo trùng.</p>
    <div class="row-actions"><span style="flex:1"></span><button class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary" id="do-import">Nhập ${parsed.length} đơn</button></div>`, body => {
    $('#do-import', body).addEventListener('click', () => {
      const custByBuyer = new Map(state.customers.filter(c => c.shopeeUser).map(c => [c.shopeeUser, c]));
      parsed.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(p => {
        const key = p.customer.buyer || p.customer.name;
        let c = custByBuyer.get(key);
        if (!c) {
          c = { id: nextId('KH', state.customers, 3), name: p.customer.name, phone: p.customer.phone, email: '', address: p.customer.address,
            source: 'Shopee', note: p.customer.buyer ? 'Tài khoản Shopee: ' + p.customer.buyer : '', shopeeUser: key, createdAt: p.createdAt };
          state.customers.push(c); custByBuyer.set(key, c);
        }
        const data = {
          customerId: c.id, items: p.items, shippingFee: 0, discount: p.discount, platformFee: p.platformFee, channel: 'Shopee',
          carrier: p.carrier, shippingMethod: p.shippingMethod, trackingCode: p.tracking, payment: p.payment, status: p.status,
          note: p.note, createdAt: p.createdAt, history: p.history, platform: 'Shopee', platformOrderId: p.code,
        };
        const old = existing.get(p.code);
        if (old) Object.assign(old, data, { campaignId: old.campaignId || '', customerId: old.customerId });
        else state.orders.push({ id: p.code, campaignId: '', ...data });
      });
      save(); closeModal();
      toast(`Đã nhập ${fresh.length} đơn mới, cập nhật ${update.length} đơn`);
      ui.orderStatus = 'all'; ui.orderChannel = 'Shopee'; ui.orderQ = '';
      if (location.hash !== '#orders') location.hash = '#orders'; else rerender();
    });
  });
}
