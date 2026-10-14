'use strict';
/* =========================================================
   Nhập báo cáo vận đơn SPX Express (file tải về từ trang quản
   lý vận đơn SPX). Dùng readXlsxRows / shopeeNum / shopeeDate
   trong import-shopee.js.
   - Vận đơn có “Mã khách hàng” = mã đơn của app, hoặc mã vận đơn
     đã nhập trong app → cập nhật đơn đó (trạng thái, phí ship, mã vận đơn).
   - Vận đơn chưa có → tạo đơn mới (mặc định kênh Facebook).
   ========================================================= */

// Tên cột tiếng Anh (dòng tiêu đề 1) – ổn định hơn bản tiếng Việt
const SPX_COLS = {
  tracking: 'Tracking No.', link: 'Tracking No. link', created: 'Create Time', status: 'Tracking Status',
  pickup: 'Actual Pickup/Drop Off Time', delivered: 'Delivered Time',
  name: 'Receiver Name', phone: 'Receiver Phone Number', province: 'Receiver Province',
  district: 'Receiver District(old)/Ward(new)', ward: 'Receiver Ward(old)', street: 'Receiver Detail Address',
  payer: 'Payment Role', instruction: 'Delivery Instruction', ref: 'Customer Reference No.', items: 'Item List',
  coCheck: 'Allow Co-Check', codFlag: 'COD Collection(Y/N)', cod: 'COD Amount', value: 'Parcel Value',
  weight: 'Parcel Weight', actualWeight: 'Actual Weight', estFee: 'Estimated Shipping Fee', fee: 'Actual Shipping Fee',
  insurance: 'Insurance Fee', codFee: 'COD Service Fee', returnFee: 'Return Shipping Fee', failReason: 'Delivery failed Reason',
};

function spxStatus(s) {
  s = (s || '').toLowerCase();
  if (s.includes('hủy')) return 'cancelled';
  if (/trả hàng|hoàn hàng|chuyển hoàn/.test(s)) return 'returned';
  if (s.includes('đã giao')) return 'delivered';
  if (/chờ lấy|chờ gửi|đã tạo|mới tạo|chờ xử lý/.test(s)) return 'packing';
  return 'shipping';   // đã lấy hàng, đang vận chuyển, đang giao, giao thất bại…
}

// "Tên SP - màu Trắng - size M,0.400kg,450000,1" (mỗi sản phẩm 1 dòng; tên có thể chứa dấu phẩy)
function spxItems(text) {
  return String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split(',');
    if (parts.length < 4) return { name: line, size: '—', qty: 1, price: 0 };
    const qty = Math.max(1, Math.round(shopeeNum(parts.pop()))), price = shopeeNum(parts.pop()); parts.pop();   // bỏ cột khối lượng
    const full = parts.join(',').trim();
    const m = /^(.*?)\s*-\s*size\s+(.+)$/i.exec(full);
    return { name: (m ? m[1] : full).trim(), size: m ? m[2].trim() : '—', qty, price };
  });
}

function parseSpxRows(rows) {
  const norm = s => String(s || '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
  const h = rows.findIndex(r => r.some(c => norm(c) === 'tracking no.' || norm(c) === 'mã vận đơn'));
  if (h < 0) throw new Error('Không thấy cột “Tracking No. / Mã vận đơn”. Hãy dùng file báo cáo tải từ trang quản lý vận đơn SPX.');
  const header = rows[h], idx = {};
  for (const [k, label] of Object.entries(SPX_COLS)) idx[k] = header.findIndex(c => norm(c) === norm(label));
  if (idx.tracking < 0) idx.tracking = header.findIndex(c => norm(c) === 'mã vận đơn');
  // Bỏ dòng tiêu đề tiếng Việt ngay dưới (nếu có)
  const start = norm(rows[h + 1]?.[idx.tracking]) === 'mã vận đơn' ? h + 2 : h + 1;
  const get = (r, k) => idx[k] >= 0 ? (r[idx[k]] || '') : '';
  const skipped = [];
  const list = rows.slice(start).filter(r => /^SPX/i.test(get(r, 'tracking')) || get(r, 'tracking').length > 8).map(r => {
    const tracking = get(r, 'tracking').trim();
    const items = spxItems(get(r, 'items'));
    const itemsTotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const codOn = /^(có|y|yes)$/i.test(get(r, 'codFlag').trim());
    const cod = codOn ? shopeeNum(get(r, 'cod')) : 0, value = shopeeNum(get(r, 'value'));
    // Số tiền khách trả: COD nếu thu hộ, nếu không là giá trị đơn (khách chuyển khoản trước)
    const paid = cod || (itemsTotal ? Math.min(value || itemsTotal, itemsTotal) : 0);
    const status = spxStatus(get(r, 'status'));
    if (!paid && !itemsTotal) { skipped.push({ tracking, reason: (items[0]?.name || 'Không có giá trị bán') }); return null; }
    // Khớp tổng tiền: phần chênh thấp hơn = giảm giá; cao hơn = phụ thu ghi thành 1 dòng
    let discount = Math.max(0, itemsTotal - paid);
    if (paid > itemsTotal) items.push({ name: 'Chênh lệch COD so với danh sách hàng', size: '—', qty: 1, price: paid - itemsTotal });
    const senderPays = !/người nhận/i.test(get(r, 'payer'));
    const fee = shopeeNum(get(r, 'fee')) || shopeeNum(get(r, 'estFee'));
    const shipCost = senderPays ? fee + shopeeNum(get(r, 'insurance')) + shopeeNum(get(r, 'codFee')) + shopeeNum(get(r, 'returnFee')) : 0;
    const created = shopeeDate(get(r, 'created')) || new Date();
    const pickup = shopeeDate(get(r, 'pickup')), deliv = shopeeDate(get(r, 'delivered'));
    const ref = get(r, 'ref').trim();
    return {
      tracking, ref: ref && ref !== '-' ? ref : '', status, items, discount, shipCost, created, pickup, deliv,
      link: get(r, 'link') || 'https://spx.vn/track?' + tracking,
      failReason: get(r, 'failReason'), statusText: get(r, 'status'),
      ship: { name: get(r, 'name'), phone: get(r, 'phone'), province: get(r, 'province'), district: get(r, 'district'), ward: get(r, 'ward'), street: get(r, 'street') },
      spx: {
        cod: codOn, codAmount: cod, payer: senderPays ? SPX_PAYERS[0] : SPX_PAYERS[1], weight: shopeeNum(get(r, 'actualWeight')) || shopeeNum(get(r, 'weight')),
        coCheck: get(r, 'coCheck') || '', instruction: get(r, 'instruction'), estimated: !shopeeNum(get(r, 'fee')),
      },
    };
  }).filter(Boolean);
  return { list, skipped };
}

function spxHistory(p, keepFrom) {
  const out = keepFrom ? keepFrom.slice() : [];
  let last = out.length ? new Date(out[out.length - 1].at).getTime() : p.created.getTime();
  const has = st => out.some(x => x.status === st);
  const push = (st, d, note = '') => { if (has(st)) return; const t = Math.max(last, (d || new Date(last)).getTime()); last = t; out.push({ status: st, at: new Date(t).toISOString(), note }); };
  push('new', p.created, 'Tạo vận đơn SPX');
  if (p.status === 'cancelled') { push('cancelled', p.created, 'Hủy vận đơn SPX'); return out; }
  push('confirmed', p.created); push('packing', p.created);
  if (p.status === 'packing') return out;
  push('shipping', p.pickup || p.created, 'SPX: ' + p.tracking);
  if (p.status === 'delivered' || p.status === 'returned') {
    if (p.status === 'returned') push('returned', p.deliv || p.pickup, [p.statusText, p.failReason].filter(Boolean).join(' – '));
    else push('delivered', p.deliv || p.pickup);
  }
  return out;
}

async function importSpxFile(file) {
  let parsed;
  try { parsed = parseSpxRows(await readXlsxRows(file)); }
  catch (e) { toast(e.message || 'Không đọc được file'); return; }
  const { list, skipped } = parsed;
  if (!list.length) { toast('File không có vận đơn bán hàng nào'); return; }

  const byTracking = new Map(state.orders.filter(o => o.trackingCode).map(o => [o.trackingCode.toUpperCase(), o]));
  const match = p => byTracking.get(p.tracking.toUpperCase()) || (p.ref && orderById(p.ref)) || null;
  const linked = list.filter(match), fresh = list.filter(p => !match(p));
  const valid = list.filter(p => p.status !== 'cancelled' && p.status !== 'returned');
  const revenue = valid.reduce((s, p) => s + p.items.reduce((a, i) => a + i.qty * i.price, 0) - p.discount, 0);
  const shipCost = list.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.shipCost, 0);
  const byStatus = STATUSES.map(s => [s, list.filter(p => p.status === s.key).length]).filter(x => x[1]);
  const days = list.map(p => ymd(p.created)).sort();
  const demo = isDemoData();

  openModal('Nhập báo cáo vận đơn SPX', `
    <p class="muted">File <b>${esc(file.name)}</b> · vận đơn tạo từ ${fmtDay(days[0])} đến ${fmtDay(days[days.length - 1])}</p>
    <div class="form" style="margin-bottom:14px">
      <label>Kênh bán cho vận đơn mới<select id="spx-channel">${opts(CHANNELS, 'Facebook')}</select></label>
      ${demo ? `<label class="inline-check" style="align-self:end;padding-bottom:8px"><input type="checkbox" id="spx-clear" checked> Xóa dữ liệu mẫu trước khi nhập</label>` : ''}
    </div>
    <div class="mini-kpis">
      <div><span>Vận đơn bán hàng</span><b>${list.length}</b></div>
      <div><span>Khớp đơn đã có – cập nhật</span><b>${linked.length}</b></div>
      <div><span>Tạo đơn mới</span><b>${fresh.length}</b></div>
      <div><span>Bỏ qua (không phải đơn bán)</span><b>${skipped.length}</b></div>
      <div><span>Doanh thu (trừ hoàn/hủy)</span><b>${money(revenue)}</b></div>
      <div><span>Phí ship shop trả</span><b>${money(shipCost)}</b></div>
      <div><span>Sau phí ship</span><b>${money(revenue - shipCost)}</b></div>
      <div><span>Phí ship / doanh thu</span><b>${revenue ? pct(shipCost / revenue) : '—'}</b></div>
    </div>
    <div class="detail-sec"><h4>Trạng thái</h4><p>${byStatus.map(([s, n]) => `${badge(s.key)} ${n}`).join(' &nbsp; ')}</p></div>
    ${skipped.length ? `<p class="muted small">Bỏ qua vận đơn không có giá trị bán & không thu COD: ${skipped.map(s => `${esc(s.tracking)} (${esc(s.reason)})`).join(', ')}.</p>` : ''}
    <p class="muted small">Doanh thu = tiền COD (hoặc giá trị đơn nếu khách chuyển khoản trước); phần thấp hơn giá trong danh sách hàng được ghi là giảm giá.
      Phí ship shop trả = phí vận chuyển thực tế + phí hoàn hàng + phí COD + bảo hiểm (đơn “Người nhận trả” không tính).
      Nhập lại file mới hơn sẽ cập nhật đơn đã có, không tạo trùng.</p>
    <div class="row-actions"><span style="flex:1"></span><button class="btn ghost" data-action="closeModal">Hủy</button><button class="btn primary" id="spx-do">Nhập ${list.length} vận đơn</button></div>`, body => {
    $('#spx-do', body).addEventListener('click', () => {
      const channel = $('#spx-channel', body).value;
      if ($('#spx-clear', body)?.checked) state = normalize({});
      const byTrk = new Map(state.orders.filter(o => o.trackingCode).map(o => [o.trackingCode.toUpperCase(), o]));
      const custByPhone = new Map(state.customers.filter(c => c.phone).map(c => [normPhone(c.phone), c]));
      let nNew = 0, nUpd = 0;
      list.slice().sort((a, b) => a.created - b.created).forEach(p => {
        const old = byTrk.get(p.tracking.toUpperCase()) || (p.ref && orderById(p.ref));
        if (old) {
          // Đơn tạo trong app: giữ sản phẩm & giá của app, cập nhật vận chuyển + trạng thái
          const fromSpx = old.source === 'spx';
          Object.assign(old, {
            carrier: 'SPX Express', trackingCode: p.tracking, trackingLink: p.link, shipCost: p.shipCost, status: p.status,
            spx: { ...(old.spx || {}), ...p.spx }, ship: old.ship || p.ship,
            history: fromSpx ? spxHistory(p) : spxHistory(p, old.history.filter(h => h.status !== 'cancelled' || p.status === 'cancelled')),
          });
          if (fromSpx) Object.assign(old, { items: p.items, discount: p.discount });
          nUpd++; return;
        }
        const phone = normPhone(p.ship.phone);
        let c = phone && custByPhone.get(phone);
        if (!c) {
          c = { id: nextId('KH', state.customers, 3), name: p.ship.name || 'Khách SPX', phone: phone || p.ship.phone, email: '',
            province: p.ship.province, district: p.ship.district, ward: p.ship.ward, street: p.ship.street, address: joinAddress(p.ship),
            source: channel, note: '', createdAt: p.created.toISOString() };
          state.customers.push(c); if (phone) custByPhone.set(phone, c);
        } else if (!c.province && p.ship.province) Object.assign(c, { province: p.ship.province, district: p.ship.district, ward: p.ship.ward, street: p.ship.street, address: joinAddress(p.ship) });
        const o = {
          id: nextId('DH', state.orders), customerId: c.id, items: p.items, shippingFee: 0, discount: p.discount, channel, campaignId: '',
          carrier: 'SPX Express', trackingCode: p.tracking, trackingLink: p.link, status: p.status, note: '', createdAt: p.created.toISOString(),
          history: spxHistory(p), ship: p.ship, shipCost: p.shipCost, spx: p.spx, source: 'spx',
        };
        state.orders.push(o); byTrk.set(p.tracking.toUpperCase(), o); nNew++;
      });
      state.demo = false;
      save(); closeModal();
      toast(`SPX: tạo ${nNew} đơn mới, cập nhật ${nUpd} đơn`);
      ui.orderStatus = 'all'; ui.orderChannel = channel; ui.orderQ = '';
      if (location.hash !== '#orders') location.hash = '#orders'; else rerender();
    });
  });
}
