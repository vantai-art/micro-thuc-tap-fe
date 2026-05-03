// src/components/staff/PaymentModal.jsx
import React, { useState } from 'react'
import { X, Loader2, Printer, QrCode } from 'lucide-react'
import { PAY_METHODS } from '../../constants/payMethods'
import { printReceipt } from '../../utils/printReceipt'
import SlideConfirm from './SlideConfirm'

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'

const BANK = 'TPBANK', ACC = '0328778198', NAME = 'COFFEE BLEND'

function buildQrUrl(method, orderId, total) {
    if (method === 'MOMO') {
        return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`2|99|${ACC}|||0|0|${total}|Don ${orderId}`)}`
    }
    // VNPAY, PAYOS → VietQR
    const addInfo = encodeURIComponent(`Don ${orderId}`)
    return `https://img.vietqr.io/image/${BANK}-${ACC}-compact2.png?amount=${total}&addInfo=${addInfo}&accountName=${encodeURIComponent(NAME)}`
}

const styles = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
    box: { background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
    header: { padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    body: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
    footer: { padding: '12px 20px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
    section: { color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
}

export default function PaymentModal({ order, onClose, onSuccess, axiosInstance, staffName }) {
    const [method, setMethod] = useState('CASH')
    const [received, setReceived] = useState('')
    const [qrUrl, setQrUrl] = useState('')
    const [qrPrinted, setQrPrinted] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [success, setSuccess] = useState(false)
    const [txId] = useState(`TX${Date.now()}`)

    const changeMethod = m => {
        setMethod(m)
        setQrPrinted(false)
        if (m !== 'CASH') {
            setQrUrl(buildQrUrl(m, order.orderId, order.total))
        } else {
            setQrUrl('')
        }
    }

    // In QR bill trước để khách quét
    const handlePrintQR = () => {
        printReceipt({
            order, method, staffName, txId,
            pendingPayment: true,  // ← in dạng "chờ thanh toán" có QR to
        })
        setQrPrinted(true)
    }

    const handleConfirm = async () => {
        if (method === 'CASH' && (!received || parseFloat(received) < order.total)) {
            alert('Nhập đủ số tiền khách đưa!'); return
        }
        if (processing || success) return
        setProcessing(true)
        try {
            // Lưu bill
            await axiosInstance.post('/bills', {
                orderId: order.orderId,
                totalAmount: order.total,
                paymentMethod: method,
                paymentStatus: 'PAID',
                transactionId: txId,
                issuedAt: new Date().toISOString(),
                notes: `Bàn ${order.tableNumber} | NV: ${staffName} | PT: ${PAY_METHODS[method]?.label}`,
            }).catch(e => console.warn('Bill save:', e))

            // Trả bàn về FREE
            await axiosInstance.put(`/tables/${order.tableId}`, {
                number: order.tableNumber,
                capacity: order.tableCapacity,
                status: 'FREE',
            }).catch(e => console.warn('Table free:', e))

            setSuccess(true)

            // In bill ĐÃ thanh toán
            const cashChange = method === 'CASH' ? parseFloat(received) - order.total : null
            printReceipt({
                order, method, staffName, txId,
                received: parseFloat(received),
                change: cashChange,
                pendingPayment: false,  // ← bill xác nhận đã thanh toán
            })

            setTimeout(() => onSuccess(), 1500)
        } catch (e) {
            alert('Lỗi: ' + e.message)
            setProcessing(false)
        }
    }

    const change = received && parseFloat(received) >= order.total
        ? parseFloat(received) - order.total : null

    const isQrMethod = ['MOMO', 'VNPAY', 'PAYOS'].includes(method)

    return (
        <div style={styles.overlay}>
            <div style={styles.box}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <div style={{ color: '#f0ede6', fontWeight: 800, fontSize: 18 }}>Thanh toán</div>
                        <div style={{ color: '#555', fontSize: 12, marginTop: 3 }}>#{order.orderId} · Bàn {order.tableNumber} · {order.customerName}</div>
                    </div>
                    {!success && <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>}
                </div>

                <div style={styles.body}>
                    {/* Tổng tiền */}
                    <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '16px 20px', marginBottom: 18, textAlign: 'center' }}>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>Tổng thanh toán</div>
                        <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: 30 }}>{fmt(order.total)}</div>
                        <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
                            {order.items.length} món · {order.items.reduce((s, i) => s + i.quantity, 0)} phần
                        </div>
                    </div>

                    {/* Chọn phương thức */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={styles.section}>Phương thức thanh toán</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {Object.entries(PAY_METHODS).map(([k, cfg]) => {
                                const Icon = cfg.icon
                                const active = method === k
                                return (
                                    <button key={k} onClick={() => changeMethod(k)} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '11px 14px', borderRadius: 10,
                                        border: `2px solid ${active ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                                        background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                        <Icon size={16} color={active ? cfg.color : '#555'} />
                                        <span style={{ color: active ? cfg.color : '#888', fontWeight: active ? 700 : 500, fontSize: 13 }}>{cfg.label}</span>
                                        {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tiền mặt */}
                    {method === 'CASH' && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={styles.section}>Tiền khách đưa</div>
                            <input
                                type="number" value={received}
                                onChange={e => setReceived(e.target.value)}
                                placeholder="Nhập số tiền..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: '#0a0a0a',
                                    border: `2px solid ${received && parseFloat(received) >= order.total ? '#f59e0b' : '#222'}`,
                                    borderRadius: 10, padding: '11px 14px',
                                    color: '#f0ede6', fontSize: 18, fontWeight: 700, outline: 'none',
                                }}
                            />
                            {/* Gợi ý mệnh giá */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                {[...new Set([
                                    order.total,
                                    Math.ceil(order.total / 50000) * 50000,
                                    Math.ceil(order.total / 100000) * 100000,
                                    500000,
                                ])].filter(v => v >= order.total).slice(0, 4).map(v => (
                                    <button key={v} onClick={() => setReceived(String(v))} style={{
                                        padding: '4px 10px', borderRadius: 8,
                                        border: '1px solid rgba(245,158,11,0.3)',
                                        background: 'rgba(245,158,11,0.08)',
                                        color: '#f59e0b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    }}>{(v / 1000).toFixed(0)}k</button>
                                ))}
                            </div>
                            {change !== null && change >= 0 && (
                                <div style={{ marginTop: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 600 }}>Tiền thối</span>
                                    <span style={{ color: '#10b981', fontSize: 20, fontWeight: 800 }}>{fmt(change)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QR thanh toán */}
                    {isQrMethod && (
                        <div style={{ marginBottom: 16 }}>
                            {/* QR hiển thị trong modal để khách quét tại quầy */}
                            <div style={{ background: '#0a0a0a', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 10 }}>
                                {qrUrl ? (
                                    <>
                                        <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, display: 'inline-block' }}>
                                            <img src={qrUrl} alt="QR"
                                                style={{ width: 200, height: 200, objectFit: 'contain', display: 'block' }}
                                                onError={e => { e.target.src = 'https://placehold.co/200x200/fff/999?text=QR+Error' }} />
                                        </div>
                                        <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>Quét QR để thanh toán {fmt(order.total)}</div>
                                        <div style={{ color: '#444', fontSize: 11, marginTop: 4 }}>
                                            {BANK} · {ACC} · Nội dung: <b style={{ color: '#f59e0b' }}>Don {order.orderId}</b>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '24px 0' }}>
                                        <Loader2 size={28} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                                        <div style={{ color: '#555', fontSize: 13 }}>Đang tạo mã QR...</div>
                                    </div>
                                )}
                            </div>

                            {/* Nút in QR bill để đưa khách */}
                            <button
                                onClick={handlePrintQR}
                                style={{
                                    width: '100%', padding: '10px', borderRadius: 10,
                                    border: `1.5px solid ${qrPrinted ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
                                    background: qrPrinted ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    color: qrPrinted ? '#10b981' : '#f59e0b',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {qrPrinted
                                    ? <><span>✓</span> Đã in bill QR cho khách</>
                                    : <><Printer size={14} /> In bill QR cho khách quét</>
                                }
                            </button>
                            {qrPrinted && (
                                <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 6 }}>
                                    Khách quét xong? Kéo để xác nhận đã nhận tiền
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <div style={{ color: '#444', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
                        {success
                            ? '🎉 Thanh toán hoàn tất!'
                            : method === 'CASH'
                                ? 'Nhập đủ tiền rồi kéo để xác nhận'
                                : 'Khách quét QR xong? Kéo để xác nhận'}
                    </div>
                    <SlideConfirm
                        onConfirm={handleConfirm}
                        disabled={method === 'CASH' && (!received || parseFloat(received) < order.total)}
                        loading={processing && !success}
                        success={success}
                    />
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}