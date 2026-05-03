// src/utils/printReceipt.js
// Bill nhân viên: in QR để khách quét thanh toán (MOMO/VNPAY/PAYOS)
// Hoặc in bill đã thanh toán (CASH)
import { PAY_METHODS } from '../constants/payMethods'

const BANK = 'TPBANK'
const ACC = '0328778198'
const NAME = 'COFFEE BLEND'

/**
 * Tạo URL QR VietQR theo ngân hàng
 */
function buildVietQR(amount, orderId) {
  const addInfo = encodeURIComponent(`Don ${orderId}`)
  return `https://img.vietqr.io/image/${BANK}-${ACC}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(NAME)}`
}

/**
 * Tạo URL QR MoMo
 */
function buildMomoQR(amount, orderId) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(`2|99|${ACC}|||0|0|${amount}|Don ${orderId}`)}`
}

/**
 * @param {object} params
 * @param {object} params.order        — { orderId, tableNumber, customerName, items[], total }
 * @param {string} params.method       — 'CASH' | 'VNPAY' | 'MOMO' | 'PAYOS'
 * @param {string} params.staffName
 * @param {string} params.txId
 * @param {number} [params.received]
 * @param {number|null} [params.change]
 * @param {boolean} [params.pendingPayment] — true = in QR để khách quét (chưa thanh toán)
 */
export function printReceipt({ order, method, staffName, txId, received, change, pendingPayment = false }) {
  const methodCfg = PAY_METHODS[method] || PAY_METHODS.CASH
  const isPending = pendingPayment && method !== 'CASH'

  // ── Danh sách món
  const itemsHTML = order.items.map((it, i) => `
        <tr>
            <td style="text-align:center;padding:7px 4px">${i + 1}</td>
            <td style="padding:7px 6px;font-weight:600">${it.name}</td>
            <td style="text-align:center;padding:7px 4px">${it.quantity}</td>
            <td style="text-align:right;padding:7px 6px">${it.price?.toLocaleString('vi-VN')}đ</td>
            <td style="text-align:right;padding:7px 6px;font-weight:700;color:#d97706">${(it.quantity * it.price)?.toLocaleString('vi-VN')}đ</td>
        </tr>`).join('')

  // ── QR Block — hiện khi isPending (để khách quét) hoặc khi VNPAY đã xong
  let qrBlockHTML = ''
  if (method === 'VNPAY' || method === 'PAYOS') {
    const qrSrc = buildVietQR(order.total, order.orderId)
    qrBlockHTML = `
        <div class="qr-wrap">
            <div class="qr-badge">${isPending ? '📱 QUÉT ĐỂ THANH TOÁN' : '✅ ĐÃ THANH TOÁN QUA VNPAY'}</div>
            <div class="qr-body">
                <div class="qr-left">
                    <img src="${qrSrc}" alt="QR" class="qr-img"
                         onerror="this.src='https://placehold.co/200x200/fff3cd/d97706?text=QR+Error'" />
                    <div class="qr-scan-hint">📲 Mở app ngân hàng → Quét QR</div>
                </div>
                <div class="qr-right">
                    <div class="qr-amount">${order.total?.toLocaleString('vi-VN')}đ</div>
                    <div class="qr-row"><span>🏦 Ngân hàng</span><b>${BANK}</b></div>
                    <div class="qr-row"><span>💳 Số TK</span><b>${ACC}</b></div>
                    <div class="qr-row"><span>👤 Tên</span><b>${NAME}</b></div>
                    <div class="qr-content-box">
                        Nội dung CK:<br>
                        <b style="font-size:16px;color:#d97706">Don ${order.orderId}</b>
                    </div>
                    ${isPending ? `<div class="qr-note-pending">⚠️ Vui lòng ghi đúng nội dung chuyển khoản để nhân viên xác nhận</div>` : ''}
                </div>
            </div>
        </div>`
  } else if (method === 'MOMO') {
    const qrSrc = buildMomoQR(order.total, order.orderId)
    qrBlockHTML = `
        <div class="qr-wrap momo">
            <div class="qr-badge">${isPending ? '💜 QUÉT MOMO ĐỂ THANH TOÁN' : '✅ ĐÃ THANH TOÁN QUA MOMO'}</div>
            <div class="qr-body">
                <div class="qr-left">
                    <img src="${qrSrc}" alt="QR MoMo" class="qr-img"
                         onerror="this.src='https://placehold.co/200x200/f0e6f6/a21caf?text=QR+Error'" />
                    <div class="qr-scan-hint">📲 Mở app MoMo → Quét QR</div>
                </div>
                <div class="qr-right">
                    <div class="qr-amount" style="color:#a21caf">${order.total?.toLocaleString('vi-VN')}đ</div>
                    <div class="qr-content-box" style="border-color:#e879f9">
                        Mã đơn:<br>
                        <b style="font-size:16px;color:#a21caf">Don ${order.orderId}</b>
                    </div>
                    ${isPending ? `<div class="qr-note-pending" style="border-color:#e879f9;color:#a21caf">⚠️ Quét xong báo nhân viên xác nhận</div>` : ''}
                </div>
            </div>
        </div>`
  }

  // ── Phần thanh toán phía dưới
  let payDetailHTML = ''
  if (method === 'CASH') {
    payDetailHTML = `
            <div class="pay-row"><span>Tiền nhận:</span><span>${(received || 0).toLocaleString('vi-VN')}đ</span></div>
            <div class="pay-row"><span>Tiền thối:</span><span class="change">${(change || 0).toLocaleString('vi-VN')}đ</span></div>`
  } else if (!isPending) {
    payDetailHTML = `<div class="pay-row"><span>Mã GD:</span><span><code>${txId}</code></span></div>`
  }

  const statusBadge = isPending
    ? `<div class="status pending">⏳ CHỜ THANH TOÁN</div>`
    : `<div class="status paid">✓ ĐÃ THANH TOÁN</div>`

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>${isPending ? 'Bill QR' : 'Hóa đơn'} #${order.orderId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 780px; margin: 0 auto; padding: 28px 24px; color: #1a1a1a; background: #fff }

  /* Header */
  .header { text-align: center; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 3px solid #d97706 }
  .logo   { font-size: 28px; font-weight: 900; color: #d97706; letter-spacing: -0.5px }
  .subtitle { font-size: 13px; color: #888; margin-top: 4px; letter-spacing: 2px; text-transform: uppercase }

  /* Status badge */
  .status       { display: inline-block; padding: 5px 16px; border-radius: 99px; font-size: 12px; font-weight: 800; letter-spacing: 1px; margin: 10px 0 }
  .status.paid  { background: #ecfdf5; color: #059669; border: 1.5px solid #6ee7b7 }
  .status.pending { background: #fff7ed; color: #c2410c; border: 1.5px solid #fed7aa }

  /* Info box */
  .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin-bottom: 20px }
  .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px dashed #e5e7eb }
  .info-row:last-child { border-bottom: none }
  .info-row span:first-child { color: #6b7280 }
  .info-row span:last-child  { font-weight: 600; color: #1a1a1a }

  /* Table */
  table   { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px }
  thead th { background: #d97706; color: #fff; padding: 10px 6px; font-weight: 700 }
  tbody tr:nth-child(even) { background: #fafaf8 }
  tbody td { border-bottom: 1px solid #f3f4f6 }

  /* Total */
  .total-box { display: flex; justify-content: space-between; align-items: center; background: #fff7ed; border: 2px solid #fde68a; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px }
  .total-label { font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px }
  .total-amount { font-size: 28px; font-weight: 900; color: #d97706 }

  /* QR Block */
  .qr-wrap  { border: 2.5px dashed #d97706; border-radius: 14px; padding: 20px; margin-bottom: 20px; background: #fffbeb }
  .qr-wrap.momo { border-color: #e879f9; background: #fdf4ff }
  .qr-badge { font-size: 13px; font-weight: 800; color: #d97706; text-align: center; margin-bottom: 16px; letter-spacing: 0.5px }
  .qr-wrap.momo .qr-badge { color: #a21caf }
  .qr-body  { display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap }
  .qr-left  { text-align: center; flex-shrink: 0 }
  .qr-img   { width: 200px; height: 200px; border-radius: 12px; border: 3px solid #d97706; object-fit: contain; background: #fff; display: block }
  .qr-wrap.momo .qr-img { border-color: #e879f9 }
  .qr-scan-hint { font-size: 11px; color: #9ca3af; margin-top: 8px }
  .qr-right { flex: 1; min-width: 160px }
  .qr-amount { font-size: 30px; font-weight: 900; color: #d97706; margin-bottom: 12px }
  .qr-row   { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed #fde68a; color: #6b7280 }
  .qr-row b { color: #1a1a1a }
  .qr-content-box { margin-top: 10px; background: #fff; border: 1.5px solid #fde68a; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #6b7280; line-height: 1.8 }
  .qr-note-pending { margin-top: 10px; padding: 8px 10px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; font-size: 11px; color: #c2410c; line-height: 1.5 }

  /* Payment info */
  .pay-box  { background: #ecfdf5; border: 2px solid #6ee7b7; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px }
  .pay-title { font-size: 13px; font-weight: 700; color: #059669; margin-bottom: 10px }
  .pay-row  { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; border-bottom: 1px dashed #a7f3d0 }
  .pay-row:last-child { border-bottom: none }
  .pay-row span:first-child { color: #374151 }
  .change   { font-size: 20px; font-weight: 800; color: #059669 }
  code      { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px }

  /* Footer */
  .footer { text-align: center; border-top: 2px dashed #e5e7eb; padding-top: 16px; color: #9ca3af; font-size: 12px }
  .footer-brand { font-size: 16px; font-weight: 700; color: #d97706; margin-bottom: 4px }

  /* Buttons */
  .btns { text-align: center; margin-top: 24px; display: flex; gap: 10px; justify-content: center }
  .btn  { padding: 10px 28px; font-size: 14px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer }
  .btn-print  { background: #d97706; color: #fff }
  .btn-close  { background: #6b7280; color: #fff }

  @media print {
    .btns { display: none }
    body  { padding: 0 }
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">☕ COFFEE BLEND</div>
  <div class="subtitle">${isPending ? 'Bill Thanh Toán' : 'Hóa Đơn'}</div>
  ${statusBadge}
</div>

<div class="info-box">
  <div class="info-row"><span>Mã đơn</span>    <span>#${order.orderId}</span></div>
  <div class="info-row"><span>Thời gian</span>  <span>${new Date().toLocaleString('vi-VN')}</span></div>
  <div class="info-row"><span>Bàn</span>        <span>Bàn ${order.tableNumber}</span></div>
  <div class="info-row"><span>Khách hàng</span> <span>${order.customerName}</span></div>
  <div class="info-row"><span>Nhân viên</span>  <span>${staffName}</span></div>
  <div class="info-row"><span>Phương thức</span><span>${methodCfg?.label || method}</span></div>
</div>

<table>
  <thead><tr>
    <th style="width:40px;text-align:center">STT</th>
    <th style="text-align:left">Tên món</th>
    <th style="width:50px;text-align:center">SL</th>
    <th style="width:110px;text-align:right">Đơn giá</th>
    <th style="width:120px;text-align:right">Thành tiền</th>
  </tr></thead>
  <tbody>${itemsHTML}</tbody>
</table>

<div class="total-box">
  <div class="total-label">Tổng cộng</div>
  <div class="total-amount">${order.total?.toLocaleString('vi-VN')}đ</div>
</div>

${qrBlockHTML}

${!isPending ? `
<div class="pay-box">
  <div class="pay-title">✓ Thông tin thanh toán</div>
  ${payDetailHTML}
</div>` : ''}

<div class="footer">
  <div class="footer-brand">Cảm ơn quý khách! ☕</div>
  <div>Coffee Blend · Hotline: 1900 xxxx · Hẹn gặp lại!</div>
</div>

<div class="btns">
  <button class="btn btn-print" onclick="window.print()">🖨️ In hóa đơn</button>
  <button class="btn btn-close" onclick="window.close()">✕ Đóng</button>
</div>

</body></html>`

  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close() }
}