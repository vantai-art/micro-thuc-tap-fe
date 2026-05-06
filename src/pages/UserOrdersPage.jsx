// src/pages/UserOrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useSocket } from '../contexts/SocketContext' // THÊM IMPORT SOCKET

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN')
const fmtDate = (d) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
    catch { return d }
}

const STATUS = {
    PAYMENT_EXPECTED: { label: 'Chờ thanh toán', color: '#b8860b', bg: '#fffbf0', dot: '#d4a853' },
    PAID: { label: 'Đã thanh toán', color: '#1a6b3a', bg: '#f0f8f4', dot: '#2ecc71' },
    SHIPPING: { label: 'Đang giao hàng', color: '#1a3a6b', bg: '#f0f4ff', dot: '#3498db' },
    DELIVERED: { label: 'Đã giao thành công', color: '#2d6b1a', bg: '#f0f8e8', dot: '#27ae60' },
    CANCELLED: { label: 'Đã hủy', color: '#6b1a1a', bg: '#fff0f0', dot: '#e74c3c' },
    PROCESSING: { label: 'Đang xử lý', color: '#e67e22', bg: '#fff8f0', dot: '#f39c12' },
}

const FILTERS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PAYMENT_EXPECTED', label: 'Chờ TT' },
    { id: 'PAID', label: 'Đã TT' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'DELIVERED', label: 'Đã giao' },
    { id: 'CANCELLED', label: 'Đã hủy' },
]

export default function UserOrdersPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user, axiosInstance, showToast } = useApp()
    const { socket, isConnected } = useSocket() // THÊM SOCKET HOOK
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('ALL')
    const [payingId, setPayingId] = useState(null)
    const [vnpayNotif, setVnpayNotif] = useState(null) // Thông báo kết quả VNPay
    const [lastUpdate, setLastUpdate] = useState(Date.now())
    const [notification, setNotification] = useState(null)

    // Hiển thị thông báo real-time
    const showRealTimeNotif = (message, type = 'info') => {
        setNotification({ message, type, id: Date.now() })
        setTimeout(() => setNotification(null), 4000)
    }

    const loadOrders = useCallback(async () => {
        if (!user) { navigate('/auth'); return }
        setLoading(true); setError(null)
        try {
            const res = await axiosInstance.get(`/order/user/${user.id}`)
            const data = res.data
            const ordersList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
            setOrders(ordersList)
        } catch (err) {
            if (err.response?.status === 404) setOrders([])
            else setError('Không thể tải đơn hàng. Vui lòng thử lại.')
        } finally { setLoading(false) }
    }, [user, navigate, axiosInstance])

    // Load orders lần đầu
    useEffect(() => { loadOrders() }, [loadOrders])

    // ─── XỬ LÝ CALLBACK TỪ VNPAY ───────────────────────────────
    useEffect(() => {
        const vnpayResult = searchParams.get('vnpay')
        const txnRef = searchParams.get('txnRef')
        const code = searchParams.get('code')
        const errParam = searchParams.get('error')

        if (vnpayResult === 'success') {
            setVnpayNotif({
                type: 'success',
                message: `✅ Thanh toán VNPay thành công! Mã giao dịch: ${txnRef || 'N/A'}`,
            })
            // Reload orders để cập nhật trạng thái PAID
            setTimeout(() => loadOrders(), 800)
            sessionStorage.removeItem('vnpay_pending_orderId')
        } else if (vnpayResult === 'failed') {
            setVnpayNotif({
                type: 'error',
                message: code === '24'
                    ? '⚠️ Bạn đã hủy giao dịch VNPay. Đơn hàng vẫn chờ thanh toán.'
                    : `❌ Thanh toán VNPay thất bại (mã: ${code}). Vui lòng thử lại.`,
            })
        } else if (errParam) {
            setVnpayNotif({
                type: 'error',
                message: '❌ Có lỗi khi xử lý thanh toán. Vui lòng thử lại.',
            })
        }

        // Tự ẩn sau 6 giây
        if (vnpayResult || errParam) {
            setTimeout(() => setVnpayNotif(null), 6000)
        }
    }, []) // chỉ chạy 1 lần khi mount

    // ─── REAL-TIME ORDER UPDATE FROM SOCKET ───
    useEffect(() => {
        if (!socket || !user) return

        // Lắng nghe cập nhật đơn hàng từ staff
        const handleOrderStatusUpdate = (data) => {
            console.log('📡 Real-time order update:', data)

            if (data.orderId) {
                setOrders(prevOrders => {
                    const updated = prevOrders.map(order => {
                        if (order.id === data.orderId || order.id === Number(data.orderId)) {
                            const oldStatus = order.status
                            const newStatus = data.status

                            // Hiển thị thông báo khi trạng thái thay đổi
                            if (oldStatus !== newStatus) {
                                const statusInfo = STATUS[newStatus] || { label: newStatus }
                                showRealTimeNotif(
                                    `🔄 Đơn hàng #${order.id} đã chuyển sang trạng thái: ${statusInfo.label}`,
                                    'info'
                                )
                            }

                            return {
                                ...order,
                                status: data.status,
                                updatedAt: new Date().toISOString()
                            }
                        }
                        return order
                    })

                    // Kiểm tra xem có đơn mới không
                    if (!updated.some(o => o.id === data.orderId) && data.order) {
                        showRealTimeNotif(`🆕 Đơn hàng mới #${data.order.id} đã được tạo!`, 'success')
                        return [data.order, ...updated]
                    }

                    return updated
                })
                setLastUpdate(Date.now())
            }
        }

        // Lắng nghe đơn hàng mới được tạo (khi user tự đặt hoặc staff tạo giúp)
        const handleNewOrder = (orderData) => {
            console.log('🆕 New order received:', orderData)
            if (orderData.userId === user.id || orderData.customerId === user.id) {
                setOrders(prev => {
                    // Tránh duplicate
                    if (prev.some(o => o.id === orderData.id)) return prev
                    return [orderData, ...prev]
                })
                showRealTimeNotif(`🎉 Đơn hàng #${orderData.id} đã được tạo thành công!`, 'success')
                setLastUpdate(Date.now())
            }
        }

        // Lắng nghe thanh toán thành công
        const handlePaymentSuccess = (data) => {
            if (data.orderId && data.userId === user.id) {
                setOrders(prev => prev.map(order =>
                    order.id === data.orderId
                        ? { ...order, status: 'PAID', paymentStatus: 'PAID' }
                        : order
                ))
                showRealTimeNotif(`💰 Đơn hàng #${data.orderId} đã được thanh toán!`, 'success')
            }
        }

        socket.on('order-status-update', handleOrderStatusUpdate)
        socket.on('new-order-created', handleNewOrder)
        socket.on('payment-success', handlePaymentSuccess)

        return () => {
            socket.off('order-status-update', handleOrderStatusUpdate)
            socket.off('new-order-created', handleNewOrder)
            socket.off('payment-success', handlePaymentSuccess)
        }
    }, [socket, user, showRealTimeNotif])

    const handlePayVNPay = async (order) => {
        setPayingId(order.id)
        try {
            const res = await axiosInstance.post('/api/payments/vnpay/create', {
                orderId: order.id,
                userId: user.id,
                amount: Number(order.total),
            })
            const paymentUrl = res.data?.data?.paymentUrl
                || res.data?.paymentUrl
                || res.data?.data?.url
                || res.data?.url

            if (paymentUrl) {
                // Lưu orderId để xử lý sau khi thanh toán xong
                sessionStorage.setItem('vnpay_pending_orderId', String(order.id))
                sessionStorage.setItem('vnpay_return_page', 'my-orders')
                window.location.href = paymentUrl
            } else {
                showRealTimeNotif('❌ Không nhận được URL thanh toán', 'error')
            }
        } catch (err) {
            showRealTimeNotif('❌ Lỗi: ' + (err.response?.data?.message || err.message), 'error')
        } finally { setPayingId(null) }
    }

    // Polling fallback khi socket không kết nối (tự động reload mỗi 30 giây)
    useEffect(() => {
        if (!isConnected) {
            const interval = setInterval(() => {
                loadOrders()
                if (orders.length > 0) {
                    showRealTimeNotif('🔄 Đã cập nhật đơn hàng', 'info')
                }
            }, 30000)
            return () => clearInterval(interval)
        }
    }, [isConnected, loadOrders])

    const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)
    const countOf = (id) => id === 'ALL' ? orders.length : orders.filter(o => o.status === id).length

    return (
        <div style={S.page}>
            <style>{FONTS + TOAST_STYLES}</style>

            {/* Real-time status indicator */}
            <div style={S.rtStatus}>
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isConnected ? '#2ecc71' : '#e74c3c',
                    boxShadow: isConnected ? '0 0 8px #2ecc71' : 'none',
                    animation: isConnected ? 'pulse 2s infinite' : 'none',
                }} />
                <span style={{ fontSize: 11, color: isConnected ? '#2ecc71' : '#e74c3c' }}>
                    {isConnected ? 'Real-time đang hoạt động' : 'Đang kết nối lại...'}
                </span>
                {!isConnected && (
                    <button onClick={loadOrders} style={S.retryBtn}>
                        <RefreshCw size={12} /> Thử lại
                    </button>
                )}
            </div>

            {/* Real-time notification */}
            {notification && (
                <div style={{
                    ...S.notification,
                    borderLeftColor: notification.type === 'success' ? '#2ecc71' :
                        notification.type === 'error' ? '#e74c3c' : '#f39c12',
                }}>
                    <span>{notification.message}</span>
                </div>
            )}

            {/* VNPay callback notification */}
            {vnpayNotif && (
                <div style={{
                    position: 'fixed',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 200,
                    background: vnpayNotif.type === 'success' ? '#f0fdf4' : '#fff5f5',
                    border: `1.5px solid ${vnpayNotif.type === 'success' ? '#4ade80' : '#f87171'}`,
                    borderRadius: 12,
                    padding: '14px 24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: vnpayNotif.type === 'success' ? '#166534' : '#991b1b',
                    maxWidth: 480,
                    textAlign: 'center',
                    animation: 'slideInRight 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <span>{vnpayNotif.message}</span>
                    <button onClick={() => setVnpayNotif(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'inherit', opacity: 0.6, marginLeft: 8 }}>×</button>
                </div>
            )}

            <div style={S.container}>

                {/* ── HEADER ── */}
                <div style={S.header}>
                    <div>
                        <button onClick={() => navigate('/')} style={S.backBtn}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Về trang chủ
                        </button>
                        <h1 style={S.pageTitle}>Đơn hàng của tôi</h1>
                        <div style={S.titleUnderline} />
                        <p style={S.subtitle}>
                            Xin chào, <span style={{ color: '#b8860b', fontWeight: 700 }}>{user?.userName}</span>
                            {' '}· {orders.length} đơn hàng
                            {lastUpdate > 0 && (
                                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>
                                    (cập nhật {new Date(lastUpdate).toLocaleTimeString()})
                                </span>
                            )}
                        </p>
                    </div>
                    <button onClick={loadOrders} disabled={loading} style={S.refreshBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }}>
                            <polyline points="23 4 23 10 17 10" />
                            <polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Làm mới
                    </button>
                </div>

                {/* ── FILTER TABS ── */}
                <div style={S.filterRow}>
                    {FILTERS.map(tab => {
                        const count = countOf(tab.id)
                        const active = filter === tab.id
                        return (
                            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
                                ...S.filterBtn,
                                background: active ? '#1a1a1a' : '#fff',
                                color: active ? '#fff' : '#555',
                                border: `1.5px solid ${active ? '#1a1a1a' : '#e8e0d0'}`,
                            }}>
                                {tab.label}
                                <span style={{
                                    marginLeft: 6, fontSize: 11, fontWeight: 700,
                                    background: active ? 'rgba(255,255,255,0.2)' : '#f0ebe0',
                                    color: active ? '#fff' : '#888',
                                    borderRadius: 99, padding: '1px 7px',
                                }}>{count}</span>
                            </button>
                        )
                    })}
                </div>

                {/* ── LOADING ── */}
                {loading && (
                    <div style={S.centered}>
                        <div style={S.spinner} />
                        <p style={{ color: '#aaa', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Đang tải đơn hàng...</p>
                    </div>
                )}

                {/* ── ERROR ── */}
                {!loading && error && (
                    <div style={S.errorBox}>
                        <p style={{ color: '#c0392b', margin: '0 0 16px', fontFamily: "'DM Sans', sans-serif" }}>{error}</p>
                        <button onClick={loadOrders} style={{ ...S.filterBtn, background: '#fff5f5', color: '#c0392b', border: '1px solid #fcc' }}>Thử lại</button>
                    </div>
                )}

                {/* ── EMPTY ── */}
                {!loading && !error && filtered.length === 0 && (
                    <div style={S.emptyBox}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>📦</div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px', fontFamily: "'Playfair Display', Georgia, serif" }}>
                            {filter === 'ALL' ? 'Chưa có đơn hàng nào' : 'Không có đơn ở trạng thái này'}
                        </h3>
                        <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 24px', fontFamily: "'DM Sans', sans-serif" }}>
                            {filter === 'ALL' ? 'Hãy khám phá cửa hàng và đặt món bạn yêu thích!' : 'Thử chọn bộ lọc khác'}
                        </p>
                        {filter === 'ALL' && (
                            <button onClick={() => navigate('/shop')} style={S.btnPrimary}>Đến Cửa Hàng →</button>
                        )}
                    </div>
                )}

                {/* ── ORDER LIST ── */}
                {!loading && !error && filtered.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[...filtered].sort((a, b) => b.id - a.id).map(order => {
                            const si = STATUS[order.status] || { label: order.status, color: '#555', bg: '#f8f8f8', dot: '#999' }
                            const isPaying = payingId === order.id
                            return (
                                <div key={order.id} style={S.orderCard}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'}
                                >
                                    {/* Hiệu ứng blink khi vừa cập nhật */}
                                    {order.updatedAt && new Date(order.updatedAt).getTime() > Date.now() - 5000 && (
                                        <div style={S.updateFlash} />
                                    )}

                                    {/* Top bar */}
                                    <div style={S.orderTop}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={S.orderNumBadge}>
                                                <span style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.1em', fontFamily: "'DM Sans', sans-serif" }}>
                                                    ĐƠN HÀNG
                                                </span>
                                                <span style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}>
                                                    #{order.id}
                                                </span>
                                            </div>
                                            <div style={{ width: 1, height: 36, background: '#e8e0d0' }} />
                                            <div>
                                                <div style={{ fontSize: 12, color: '#aaa', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>
                                                    {fmtDate(order.orderedDate)}
                                                </div>
                                                <div style={{ fontSize: 13, color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
                                                    {order.user?.userName || user?.userName || 'Khách'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status badge với animation khi vừa đổi */}
                                        <div style={{
                                            ...S.statusBadge,
                                            background: si.bg,
                                            color: si.color,
                                            border: `1px solid ${si.dot}40`,
                                            animation: order.updatedAt && new Date(order.updatedAt).getTime() > Date.now() - 3000
                                                ? 'statusPulse 0.5s ease' : 'none',
                                        }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: si.dot, display: 'inline-block', flexShrink: 0 }} />
                                            {si.label}
                                        </div>
                                    </div>

                                    {/* Items row */}
                                    {order.items && order.items.length > 0 && (
                                        <div style={{ padding: '14px 24px', borderBottom: '1px solid #f5f0e8', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {order.items.map((item, idx) => (
                                                <span key={idx} style={S.itemChip}>
                                                    {item.product?.productName || item.product?.name || 'Sản phẩm'}
                                                    <span style={{ color: '#bbb', marginLeft: 4 }}>×{item.quantity}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={S.orderFooter}>
                                        <div style={{ display: 'flex', gap: 32 }}>
                                            <div>
                                                <div style={S.metaLabel}>Tổng tiền</div>
                                                <div style={{ fontWeight: 900, fontSize: 20, color: '#1a1a1a', fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.02em' }}>
                                                    {fmt(order.total)}đ
                                                </div>
                                            </div>
                                            {order.items && (
                                                <div>
                                                    <div style={S.metaLabel}>Số món</div>
                                                    <div style={{ fontWeight: 700, fontSize: 18, color: '#555', fontFamily: "'DM Sans', sans-serif" }}>
                                                        {order.items.length}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            {order.status === 'PAYMENT_EXPECTED' && (
                                                <button
                                                    onClick={() => handlePayVNPay(order)}
                                                    disabled={!!payingId}
                                                    style={{
                                                        background: isPaying ? '#c8d4e8' : '#1a3a6b',
                                                        color: '#fff', border: 'none', borderRadius: 10,
                                                        padding: '10px 20px', fontSize: 13, fontWeight: 700,
                                                        cursor: isPaying ? 'not-allowed' : 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { if (!payingId) e.currentTarget.style.background = '#142d55' }}
                                                    onMouseLeave={e => { if (!payingId) e.currentTarget.style.background = '#1a3a6b' }}
                                                >
                                                    {isPaying ? (
                                                        <><Spinner color="#fff" /> Đang xử lý...</>
                                                    ) : (
                                                        <>
                                                            <span style={{ background: '#fff', borderRadius: 3, padding: '1px 5px', fontSize: 10, fontWeight: 900 }}>
                                                                <span style={{ color: '#1a3a6b' }}>VN</span><span style={{ color: '#e30019' }}>PAY</span>
                                                            </span>
                                                            Thanh toán ngay
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {order.status === 'SHIPPING' && (
                                                <div style={{
                                                    background: '#f0f4ff', borderRadius: 10, padding: '10px 16px',
                                                    fontSize: 12, color: '#3498db', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                }}>
                                                    <span>🚚</span> Đang giao đến bạn
                                                </div>
                                            )}
                                            {order.status === 'DELIVERED' && (
                                                <div style={{
                                                    background: '#f0f8e8', borderRadius: 10, padding: '10px 16px',
                                                    fontSize: 12, color: '#27ae60', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                }}>
                                                    <span>✅</span> Cảm ơn bạn đã mua hàng
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

function Spinner({ color = '#b8860b' }) {
    return <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${color}30`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

function RefreshCw({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    )
}

// ── STYLES ────────────────────────────────────────────────────────
const S = {
    page: {
        minHeight: '100vh',
        background: '#faf7f2',
        paddingTop: 88,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: 'relative',
    },
    rtStatus: {
        position: 'fixed',
        top: 80,
        right: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#fff',
        padding: '6px 12px',
        borderRadius: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e8e0d0',
        zIndex: 100,
        fontSize: 11,
    },
    retryBtn: {
        background: 'none',
        border: 'none',
        color: '#3498db',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 10,
    },
    notification: {
        position: 'fixed',
        top: 130,
        right: 20,
        background: '#fff',
        borderLeft: '4px solid',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 101,
        fontSize: 13,
        fontWeight: 500,
        color: '#333',
        animation: 'slideInRight 0.3s ease',
    },
    container: {
        maxWidth: 860,
        margin: '0 auto',
        padding: '40px 24px 60px',
    },
    header: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 36,
        flexWrap: 'wrap',
        gap: 16,
    },
    backBtn: {
        background: 'none', border: 'none', color: '#aaa', fontSize: 13,
        cursor: 'pointer', padding: 0, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 6,
        fontFamily: "'DM Sans', sans-serif", transition: 'color 0.2s',
    },
    pageTitle: {
        fontSize: 34, fontWeight: 900, color: '#1a1a1a',
        margin: '0 0 10px', letterSpacing: '-0.03em',
        fontFamily: "'Playfair Display', Georgia, serif",
    },
    titleUnderline: {
        width: 40, height: 3, background: '#b8860b',
        borderRadius: 2, marginBottom: 10,
    },
    subtitle: {
        color: '#888', fontSize: 14, margin: 0,
        fontFamily: "'DM Sans', sans-serif",
    },
    refreshBtn: {
        background: '#fff', border: '1.5px solid #e8e0d0',
        borderRadius: 10, padding: '10px 16px', color: '#555',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
        alignSelf: 'flex-start', marginTop: 40,
    },
    filterRow: {
        display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap',
    },
    filterBtn: {
        padding: '8px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center',
        fontFamily: "'DM Sans', sans-serif",
    },
    centered: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 16, padding: '80px 0',
    },
    spinner: {
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e8e0d0', borderTopColor: '#b8860b',
        animation: 'spin 0.7s linear infinite',
    },
    errorBox: {
        background: '#fff5f5', border: '1px solid #fcc',
        borderRadius: 14, padding: '28px', textAlign: 'center',
    },
    emptyBox: {
        background: '#fff', border: '1px solid #ede8de',
        borderRadius: 16, padding: '64px 32px', textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    },
    btnPrimary: {
        background: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 10, padding: '12px 28px', fontSize: 14,
        fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    },
    orderCard: {
        background: '#fff', border: '1px solid #ede8de',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s',
        position: 'relative',
    },
    updateFlash: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(46, 204, 113, 0.1)',
        pointerEvents: 'none',
        animation: 'flashOut 1s ease forwards',
    },
    orderTop: {
        padding: '20px 24px',
        borderBottom: '1px solid #f5f0e8',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    },
    orderNumBadge: {
        display: 'flex', flexDirection: 'column',
    },
    statusBadge: {
        display: 'flex', alignItems: 'center', gap: 7,
        borderRadius: 99, padding: '7px 14px',
        fontSize: 12, fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
    },
    itemChip: {
        background: '#f8f4ec', border: '1px solid #ede8de',
        borderRadius: 8, padding: '5px 12px',
        fontSize: 12, color: '#555',
        fontFamily: "'DM Sans', sans-serif",
    },
    orderFooter: {
        padding: '16px 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    },
    metaLabel: {
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: '#bbb', marginBottom: 4, fontFamily: "'DM Sans', sans-serif",
    },
}

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');`

const TOAST_STYLES = `
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
@keyframes slideInRight { from { transform: translateX(100%); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
@keyframes statusPulse { 0% { transform: scale(1); background: rgba(46,204,113,0.3) } 50% { transform: scale(1.02); background: rgba(46,204,113,0.5) } 100% { transform: scale(1); background: transparent } }
@keyframes flashOut { 0% { background: rgba(46,204,113,0.2) } 100% { background: rgba(46,204,113,0) } }
`