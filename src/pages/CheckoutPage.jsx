// src/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')

export default function CheckoutPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { cart, cartTotal, updateQuantity, removeFromCart, clearCart, createOrder, createOrderOnly, user, axiosInstance } = useApp()

    const [loading, setLoading] = useState(false)
    const [vnpayLoading, setVnpayLoading] = useState(false)
    const [done, setDone] = useState(null)
    const [note, setNote] = useState('')
    const [error, setError] = useState('')

    // Xử lý callback từ VNPay redirect về
    useEffect(() => {
        const vnpayResult = searchParams.get('vnpay')
        const txnRef = searchParams.get('txnRef')
        const code = searchParams.get('code')
        const errParam = searchParams.get('error')

        if (vnpayResult === 'success') {
            // ✅ Clear cart SAU KHI VNPay xác nhận thành công
            clearCart()
            setDone({ vnpay: true, transactionRef: txnRef })
        } else if (vnpayResult === 'failed') {
            // ❌ Thanh toán thất bại — KHÔNG clear cart, để user thử lại
            const msg = code === '24'
                ? 'Bạn đã hủy giao dịch VNPay. Đơn hàng vẫn còn, bạn có thể thanh toán lại.'
                : `Thanh toán VNPay thất bại (mã lỗi: ${code}). Vui lòng thử lại.`
            setError(msg)
        } else if (errParam) {
            setError('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.')
        }
    }, []) // chỉ chạy 1 lần khi mount

    const handleOrderCOD = async () => {
        if (cart.length === 0) return
        setError(''); setLoading(true)
        try {
            // createOrder = tạo order + clear cart (COD)
            const order = await createOrder()
            setDone(order)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Đặt hàng thất bại')
        } finally { setLoading(false) }
    }

    const handleVNPay = async () => {
        if (cart.length === 0 || !user?.id) {
            setError('Vui lòng đăng nhập trước khi thanh toán')
            return
        }
        setError(''); setVnpayLoading(true)
        try {
            // ✅ Bước 1: Tạo order KHÔNG clear cart (cart sẽ clear sau khi VNPay thành công)
            const order = await createOrderOnly()

            // Lấy total từ order trả về (ưu tiên) hoặc cartTotal
            const amount = Number(order?.total ?? order?.totalAmount ?? cartTotal)
            if (!amount || amount <= 0) throw new Error('Số tiền không hợp lệ')

            // ✅ Bước 2: Lấy URL thanh toán VNPay từ payment-service
            const res = await axiosInstance.post('/api/payments/vnpay/create', {
                orderId: order.id,
                userId: user.id,
                amount: amount,
            })

            // Lấy paymentUrl từ response (hỗ trợ nhiều cấu trúc)
            const paymentUrl = res.data?.data?.paymentUrl
                || res.data?.paymentUrl
                || res.data?.data?.url
                || res.data?.url

            if (!paymentUrl) throw new Error('Không nhận được URL thanh toán từ server')

            // ✅ Lưu orderId để có thể hiển thị sau khi thanh toán
            sessionStorage.setItem('vnpay_pending_orderId', String(order.id))

            // ✅ Redirect sang VNPay
            window.location.href = paymentUrl
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Không thể tạo thanh toán VNPay')
            setVnpayLoading(false)
        }
    }

    const isProcessing = loading || vnpayLoading

    // ── SUCCESS COD ────────────────────────────────────────────────
    if (done && !done.vnpay) return (
        <div style={S.page}>
            <div style={{ ...S.card, maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '64px 48px' }}>
                <div style={S.successRing}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={S.successLabel}>ĐẶT HÀNG THÀNH CÔNG</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px', letterSpacing: '-0.03em', fontFamily: "'Playfair Display', Georgia, serif" }}>Cảm ơn bạn!</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 32px', fontFamily: "'DM Sans', sans-serif" }}>Đơn hàng đang được chuẩn bị</p>
                <div style={S.receiptBox}>
                    <div style={S.receiptRow}><span>Mã đơn hàng</span><strong style={{ color: '#b8860b' }}>#{done.id}</strong></div>
                    <div style={{ height: 1, background: 'var(--border-color)', margin: '12px 0' }} />
                    <div style={S.receiptRow}><span>Tổng tiền</span><strong>{fmt(done.total)}đ</strong></div>
                    <div style={S.receiptRow}><span>Phương thức</span><span style={{ color: 'var(--text-secondary)' }}>Thanh toán khi nhận hàng</span></div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => navigate('/my-orders')} style={S.btnPrimary}>Xem đơn hàng</button>
                    <button onClick={() => navigate('/shop')} style={S.btnGhost}>Mua tiếp</button>
                </div>
            </div>
            <style>{FONTS + ANIM}</style>
        </div>
    )

    // ── SUCCESS VNPAY ──────────────────────────────────────────────
    if (done && done.vnpay) return (
        <div style={S.page}>
            <div style={{ ...S.card, maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '64px 48px' }}>
                <div style={{ ...S.successRing, background: '#e8f0ff', border: '2px solid #1a3a6b' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ ...S.successLabel, color: '#1a3a6b', borderColor: '#1a3a6b', background: '#e8f0ff' }}>VNPAY XÁC NHẬN</div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: '8px 0 4px', letterSpacing: '-0.03em', fontFamily: "'Playfair Display', Georgia, serif" }}>Thanh toán thành công</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 32px', fontFamily: "'DM Sans', sans-serif" }}>Giao dịch đã được xác nhận qua VNPay</p>
                {done.transactionRef && (
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '14px 20px', marginBottom: 28, fontFamily: "'DM Sans', sans-serif" }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Mã giao dịch</div>
                        <div style={{ fontWeight: 700, color: '#1a3a6b', fontSize: 15, letterSpacing: '0.05em' }}>{done.transactionRef}</div>
                    </div>
                )}
                <button onClick={() => navigate('/my-orders')} style={S.btnPrimary}>Xem đơn hàng →</button>
            </div>
            <style>{FONTS + ANIM}</style>
        </div>
    )

    // ── EMPTY CART ─────────────────────────────────────────────────
    if (cart.length === 0 && !searchParams.get('vnpay')) return (
        <div style={{ ...S.page, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 24 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🛒</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>Giỏ hàng trống</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Hãy thêm sản phẩm trước khi thanh toán</p>
            <button onClick={() => navigate('/shop')} style={S.btnPrimary}>Khám phá cửa hàng →</button>
            <style>{FONTS}</style>
        </div>
    )

    return (
        <div style={S.page}>
            <div style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 24px', width: '100%' }}>

                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <button onClick={() => navigate(-1)} style={S.backBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Quay lại
                    </button>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 16 }}>
                        <h1 style={S.pageTitle}>Thanh Toán</h1>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>{cart.length} sản phẩm</span>
                    </div>
                    <div style={S.titleUnderline} />
                </div>

                {/* Error */}
                {error && (
                    <div style={S.errorBox}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        <span>{error}</span>
                        <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', marginLeft: 'auto', fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                )}

                <div className="co-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>

                    {/* LEFT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={S.card}>
                            <div style={S.cardHeader}>
                                <span style={S.cardTitle}>Sản phẩm đã chọn</span>
                                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#c0392b', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: 0.7 }}>Xóa tất cả</button>
                            </div>
                            {cart.map((item, idx) => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 28px', borderBottom: idx < cart.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-elevated)' }}>
                                        <img src={item.imageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=128&h=128&fit=crop'} alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=128&h=128&fit=crop' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{item.name}</div>
                                        <div style={{ fontSize: 13, color: '#b8860b', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{fmt(item.price)}đ / cái</div>
                                    </div>
                                    <div style={S.qtyControl}>
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={S.qtyBtn}>−</button>
                                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={S.qtyBtn}>+</button>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', minWidth: 90, textAlign: 'right', fontFamily: "'DM Sans', sans-serif" }}>{fmt(item.price * item.quantity)}đ</div>
                                    <button onClick={() => removeFromCart(item.id)} style={S.deleteBtn}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div style={S.card}>
                            <div style={S.cardHeader}>
                                <span style={S.cardTitle}>Ghi chú đơn hàng</span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Tùy chọn</span>
                            </div>
                            <div style={{ padding: '0 28px 24px' }}>
                                <textarea value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="Yêu cầu đặc biệt, dị ứng thực phẩm, hương vị ưa thích..."
                                    style={S.textarea}
                                    onFocus={e => e.currentTarget.style.borderColor = '#b8860b'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div style={{ position: 'sticky', top: 96 }}>
                        <div style={S.card}>
                            <div style={S.cardHeader}><span style={S.cardTitle}>Tóm tắt</span></div>
                            <div style={{ padding: '0 24px 8px' }}>
                                <div style={S.userBadge}>
                                    <div style={S.avatar}>{(user?.userName || 'U')[0].toUpperCase()}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" }}>{user?.userName}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>Thành viên</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 16 }}>
                                    {cart.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span></span>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(item.price * item.quantity)}đ</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ height: 1, background: 'repeating-linear-gradient(90deg, var(--border-color) 0, var(--border-color) 6px, transparent 6px, transparent 12px)', margin: '20px 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
                                    <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Tổng cộng</span>
                                    <span style={{ fontWeight: 900, fontSize: 26, color: 'var(--text-primary)', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}>{fmt(cartTotal)}đ</span>
                                </div>

                                {/* VNPay */}
                                <button onClick={handleVNPay} disabled={isProcessing} style={{
                                    width: '100%', marginBottom: 12,
                                    background: isProcessing ? 'var(--bg-elevated)' : '#1a3a6b',
                                    color: isProcessing ? 'var(--text-muted)' : '#fff',
                                    border: 'none', borderRadius: 12, padding: '16px', fontSize: 14, fontWeight: 700,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                    transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em',
                                }}
                                    onMouseEnter={e => { if (!isProcessing) e.currentTarget.style.background = '#142d55' }}
                                    onMouseLeave={e => { if (!isProcessing) e.currentTarget.style.background = '#1a3a6b' }}
                                >
                                    {vnpayLoading ? (
                                        <><Spinner color="#fff" /> Đang chuyển sang VNPay...</>
                                    ) : (
                                        <>
                                            <span style={{ background: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 900 }}>
                                                <span style={{ color: '#1a3a6b' }}>VN</span><span style={{ color: '#e30019' }}>PAY</span>
                                            </span>
                                            Thanh toán qua VNPay
                                        </>
                                    )}
                                </button>

                                {/* COD */}
                                <button onClick={handleOrderCOD} disabled={isProcessing} style={{
                                    width: '100%', marginBottom: 10,
                                    background: 'transparent',
                                    color: isProcessing ? 'var(--text-muted)' : '#b8860b',
                                    border: `1.5px solid ${isProcessing ? 'var(--border-color)' : '#d4a853'}`,
                                    borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                                }}
                                    onMouseEnter={e => { if (!isProcessing) e.currentTarget.style.background = 'rgba(212,168,83,0.08)' }}
                                    onMouseLeave={e => { if (!isProcessing) e.currentTarget.style.background = 'transparent' }}
                                >
                                    {loading ? <><Spinner color="#b8860b" /> Đang xử lý...</> : '💵  Thanh toán khi nhận hàng'}
                                </button>

                                <button onClick={() => navigate('/shop')} style={{
                                    width: '100%', background: 'transparent', color: 'var(--text-muted)',
                                    border: '1px solid var(--border-color)', borderRadius: 12,
                                    padding: '12px', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    ← Tiếp tục mua sắm
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, color: 'var(--text-muted)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    THANH TOÁN AN TOÀN & BẢO MẬT
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{FONTS + ANIM + `
                .co-grid { display: grid; grid-template-columns: 1fr 360px; gap: 28px; align-items: start; }
                @media (max-width: 768px) { .co-grid { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    )
}

function Spinner({ color = '#fff' }) {
    return <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${color}40`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

const S = {
    page: { minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 88, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column' },
    card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' },
    cardHeader: { padding: '20px 28px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', fontFamily: "'DM Sans', sans-serif" },
    pageTitle: { fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.03em', fontFamily: "'Playfair Display', Georgia, serif" },
    titleUnderline: { marginTop: 12, width: 48, height: 3, background: '#b8860b', borderRadius: 2 },
    backBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif" },
    errorBox: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
    qtyControl: { display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-elevated)', borderRadius: 10, padding: '4px 6px' },
    qtyBtn: { width: 28, height: 28, borderRadius: 7, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    deleteBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', transition: 'color 0.2s' },
    userBadge: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 20 },
    avatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #b8860b, #8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 },
    textarea: { width: '100%', boxSizing: 'border-box', background: 'var(--input-bg)', border: '1.5px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, padding: '12px 14px', resize: 'vertical', minHeight: 96, outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' },
    successRing: { width: 72, height: 72, borderRadius: '50%', background: '#f0f8e8', border: '2px solid #5a9e3a', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    successLabel: { display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#5a9e3a', border: '1px solid #5a9e3a', borderRadius: 99, padding: '4px 14px', marginBottom: 12, fontFamily: "'DM Sans', sans-serif", background: '#f0f8e8' },
    receiptBox: { background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left', fontFamily: "'DM Sans', sans-serif" },
    receiptRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 },
    btnPrimary: { flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' },
    btnGhost: { flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1.5px solid var(--border-color)', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');`
const ANIM = `@keyframes spin { to { transform: rotate(360deg) } }`