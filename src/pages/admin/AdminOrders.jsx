// src/pages/admin/AdminOrders.jsx
// ✅ BE endpoints:
//   GET    /order              → List<Order>
//   GET    /order/{id}         → Order (chi tiết có items)
//   PUT    /order/{id}/status  → body: { status }
//   DELETE /order/{id}         → 200 OK

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Eye, Trash2, RefreshCw, ShoppingBag, X, ChevronDown, AlertCircle } from 'lucide-react'
import http, { getOrdersSmart, updateOrderStatus, deleteOrder } from '../../services/api'

const STATUS = {
    PAYMENT_EXPECTED: { label: 'Chờ thanh toán', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    PAID: { label: 'Đã thanh toán', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    SHIPPING: { label: 'Đang giao', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    DELIVERED: { label: 'Đã giao', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}
const STATUS_LIST = Object.keys(STATUS)

const S = {
    wrap: { padding: 24, color: '#f9fafb' },
    card: { background: '#1f2937', border: '1px solid #374151', borderRadius: 12 },
    th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', background: '#111827' },
    td: { padding: '12px 16px', borderTop: '1px solid #374151' },
    input: { background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none' },
}

function Toast({ msg, type }) {
    const c = type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#22c55e'
    return <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#1f2937', border: `1px solid ${c}`, borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 20px', color: '#f9fafb', fontSize: 13, maxWidth: 360 }}>{msg}</div>
}

function StatusBadge({ status }) {
    const s = STATUS[status] || { label: status || '?', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' }
    return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
}

// Mock data for testing when API is not available
const MOCK_ORDERS = [
    {
        id: 1,
        total: 250000,
        status: 'PAYMENT_EXPECTED',
        orderedDate: new Date().toISOString(),
        user: { userName: 'Nguyễn Văn A', id: 1 },
        items: [
            { product: { productName: 'Cà phê đen', price: 25000 }, quantity: 2, price: 25000 },
            { product: { productName: 'Bánh mì', price: 20000 }, quantity: 1, price: 20000 }
        ]
    },
    {
        id: 2,
        total: 180000,
        status: 'PAID',
        orderedDate: new Date(Date.now() - 86400000).toISOString(),
        user: { userName: 'Trần Thị B', id: 2 },
        items: [
            { product: { productName: 'Trà sữa', price: 45000 }, quantity: 2, price: 45000 },
            { product: { productName: 'Kem', price: 30000 }, quantity: 3, price: 30000 }
        ]
    },
    {
        id: 3,
        total: 89000,
        status: 'SHIPPING',
        orderedDate: new Date(Date.now() - 172800000).toISOString(),
        user: { userName: 'Lê Văn C', id: 3 },
        items: [
            { product: { productName: 'Nước ép cam', price: 35000 }, quantity: 1, price: 35000 },
            { product: { productName: 'Sandwich', price: 54000 }, quantity: 1, price: 54000 }
        ]
    }
]

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusF, setStatusF] = useState('all')
    const [detail, setDetail] = useState(null)
    const [toast, setToast] = useState(null)
    const [useMock, setUseMock] = useState(false)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000)
    }

    // ── GET orders with multiple endpoint attempts ──
    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError('')

        // Check if we have admin token
        const adminUser = localStorage.getItem('admin_user')
        if (!adminUser) {
            setError('Vui lòng đăng nhập với tài khoản Admin')
            setLoading(false)
            return
        }

        try {
            // Try smart fetch first
            const res = await getOrdersSmart()
            const list = Array.isArray(res.data) ? res.data : []
            setOrders(list.sort((a, b) => (b.id || 0) - (a.id || 0)))
            setUseMock(false)
            showToast(`Đã tải ${list.length} đơn hàng`, 'success')
        } catch (e) {
            console.error('Fetch orders error:', e)

            // Check if it's a 404 (endpoint not found)
            if (e.response?.status === 404) {
                setError('API endpoint /order không tồn tại. Backend cần implement OrderController.')
                showToast('Backend chưa có API Order. Đang dùng dữ liệu mẫu...', 'info')
                // Use mock data for demo
                setOrders(MOCK_ORDERS)
                setUseMock(true)
            }
            // Check if it's a 401 (unauthorized)
            else if (e.response?.status === 401) {
                setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
                showToast('Vui lòng đăng nhập lại', 'error')
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = '/admin/login'
                }, 2000)
            }
            // Check if it's a 500 (server error)
            else if (e.response?.status === 500) {
                setError('Lỗi server (500). Vui lòng kiểm tra backend log.')
                showToast('Lỗi server, đang dùng dữ liệu mẫu...', 'info')
                setOrders(MOCK_ORDERS)
                setUseMock(true)
            }
            else {
                setError(`Không thể tải đơn hàng: ${e.response?.data?.message || e.message}`)
                showToast('Lỗi kết nối đến server', 'error')
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    // ── GET /order/{id} (detail với items) ──
    const openDetail = async (o) => {
        if (useMock) {
            // Use mock detail
            setDetail(o)
            return
        }

        try {
            const res = await http.get(`/order/${o.id}`)
            setDetail(res.data || o)
        } catch (e) {
            console.error('Detail fetch error:', e)
            setDetail(o) // Fallback to basic order info
            showToast('Không thể tải chi tiết đơn hàng', 'error')
        }
    }

    // ── PUT /order/{id}/status ──
    const updateStatus = async (orderId, newStatus) => {
        if (useMock) {
            // Update mock data
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            if (detail?.id === orderId) setDetail(d => ({ ...d, status: newStatus }))
            showToast(`Đã cập nhật trạng thái (Mock mode)`, 'success')
            return
        }

        try {
            await updateOrderStatus(orderId, newStatus)
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            if (detail?.id === orderId) setDetail(d => ({ ...d, status: newStatus }))
            showToast('Cập nhật trạng thái thành công!')
        } catch (e) {
            showToast('Lỗi: ' + (e.response?.data?.message || e.message), 'error')
        }
    }

    // ── DELETE /order/{id} ──
    const deleteOrder = async (o) => {
        if (!window.confirm(`Xóa đơn hàng #${o.id}?`)) return

        if (useMock) {
            setOrders(prev => prev.filter(x => x.id !== o.id))
            if (detail?.id === o.id) setDetail(null)
            showToast('Đã xóa đơn hàng (Mock mode)!')
            return
        }

        try {
            await deleteOrder(o.id)
            setOrders(prev => prev.filter(x => x.id !== o.id))
            if (detail?.id === o.id) setDetail(null)
            showToast('Đã xóa đơn hàng!')
        } catch (e) {
            showToast('Lỗi xóa: ' + (e.response?.data?.message || e.message), 'error')
        }
    }

    const filtered = orders.filter(o => {
        const q = search.toLowerCase()
        const matchSearch = String(o.id).includes(q) || (o.user?.userName || '').toLowerCase().includes(q)
        const matchStatus = statusF === 'all' || o.status === statusF
        return matchSearch && matchStatus
    })

    // Summary counts
    const counts = {}
    STATUS_LIST.forEach(s => counts[s] = orders.filter(o => o.status === s).length)

    return (
        <div style={S.wrap}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Quản Lý Đơn Hàng</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        {orders.length} đơn hàng tổng cộng
                        {useMock && <span style={{ marginLeft: 8, color: '#f59e0b' }}>(Dữ liệu mẫu)</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={fetchOrders} style={{ background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={13} />Làm mới
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <AlertCircle size={18} color="#ef4444" />
                    <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
                </div>
            )}

            {/* Status summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
                {STATUS_LIST.map(s => {
                    const si = STATUS[s]
                    return (
                        <button key={s} onClick={() => setStatusF(statusF === s ? 'all' : s)} style={{
                            background: statusF === s ? si.bg : '#1f2937',
                            border: `1px solid ${statusF === s ? si.color : '#374151'}`,
                            borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                        }}>
                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{si.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: si.color }}>{counts[s] || 0}</div>
                        </button>
                    )
                })}
            </div>

            {/* Search + filter */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={14} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm mã đơn, tên khách..."
                        style={{ ...S.input, width: '100%', paddingLeft: 34, boxSizing: 'border-box' }}
                    />
                </div>
                <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ ...S.input }}>
                    <option value="all">Tất cả trạng thái</option>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
                </select>
            </div>

            {/* Table */}
            <div style={{ ...S.card, overflow: 'hidden', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #374151', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        <p style={{ color: '#6b7280', fontSize: 13 }}>Đang tải...</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead>
                            <tr>
                                {['Mã đơn', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'Trạng thái', 'Cập nhật status', 'Thao tác'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#6b7280', padding: 40 }}>
                                        <ShoppingBag size={40} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                                        Không có đơn hàng nào
                                    </td>
                                </tr>
                            ) : filtered.map((o, i) => (
                                <tr key={o.id} style={{ background: i % 2 === 1 ? '#111827' : 'transparent' }}>
                                    <td style={{ ...S.td, color: '#f59e0b', fontWeight: 700 }}>#{o.id}</td>
                                    <td style={{ ...S.td, fontSize: 13 }}>{o.user?.userName || 'Khách'}</td>
                                    <td style={{ ...S.td, fontSize: 12, color: '#9ca3af' }}>
                                        {o.orderedDate ? new Date(o.orderedDate).toLocaleString('vi-VN') : '—'}
                                    </td>
                                    <td style={{ ...S.td, color: '#f59e0b', fontWeight: 700 }}>
                                        {Number(o.total || 0).toLocaleString('vi-VN')}đ
                                    </td>
                                    <td style={S.td}><StatusBadge status={o.status} /></td>
                                    <td style={S.td}>
                                        <select
                                            value={o.status || ''}
                                            onChange={e => updateStatus(o.id, e.target.value)}
                                            style={{ background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none', cursor: 'pointer' }}
                                        >
                                            {STATUS_LIST.map(s => (
                                                <option key={s} value={s}>{STATUS[s].label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={S.td}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                onClick={() => openDetail(o)}
                                                style={{ width: 30, height: 30, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={13} />
                                            </button>
                                            <button
                                                onClick={() => deleteOrder(o)}
                                                style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Xóa"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail modal */}
            {detail && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={() => setDetail(null)}>
                    <div style={{ ...S.card, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Đơn Hàng #{detail.id}</h2>
                            <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            {/* Info */}
                            <div style={{ background: '#111827', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                {[
                                    ['Khách hàng', detail.user?.userName || 'Khách'],
                                    ['Ngày đặt', detail.orderedDate ? new Date(detail.orderedDate).toLocaleString('vi-VN') : '—'],
                                    ['Tổng tiền', Number(detail.total || 0).toLocaleString('vi-VN') + 'đ'],
                                    ['Trạng thái', null],
                                ].map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
                                        <span style={{ color: '#6b7280', fontSize: 13 }}>{k}</span>
                                        {v !== null
                                            ? <span style={{ color: '#f9fafb', fontWeight: 600, fontSize: 13 }}>{v}</span>
                                            : <StatusBadge status={detail.status} />
                                        }
                                    </div>
                                ))}
                            </div>

                            {/* Items */}
                            {detail.items && detail.items.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Sản phẩm đặt</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {detail.items.map((item, i) => (
                                            <div key={i} style={{ background: '#111827', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                        {item.product?.productName || item.productName || `Sản phẩm #${item.productId || i}`}
                                                    </div>
                                                    <div style={{ color: '#6b7280', fontSize: 12 }}>x{item.quantity}</div>
                                                </div>
                                                <div style={{ color: '#f59e0b', fontWeight: 700 }}>
                                                    {Number((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Update status */}
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Cập nhật trạng thái</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                                    {STATUS_LIST.map(s => {
                                        const si = STATUS[s]
                                        const active = detail.status === s
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => updateStatus(detail.id, s)}
                                                disabled={active}
                                                style={{
                                                    padding: '9px 12px',
                                                    borderRadius: 8,
                                                    border: `1px solid ${active ? si.color : '#374151'}`,
                                                    background: active ? si.bg : '#111827',
                                                    color: active ? si.color : '#9ca3af',
                                                    cursor: active ? 'not-allowed' : 'pointer',
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {si.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {useMock && (
                                <div style={{ marginTop: 16, padding: 10, background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: 12, color: '#fcd34d' }}>
                                    ⚠️ Đang ở chế độ dữ liệu mẫu. Các thay đổi sẽ không được lưu vào database.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast {...toast} />}
        </div>
    )
}