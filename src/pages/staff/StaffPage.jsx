// src/pages/staff/StaffPage.jsx — Coffee Blend POS v2
// Layout: sidebar trái (bàn + giỏ hàng) | phải (menu sản phẩm)
// Kết nối API: /tables, /products, /order/table, /bills
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../contexts/AppContext'
import {
    ShoppingCart, Search, LogOut, X, Settings,
    Loader2, RefreshCw, Receipt, Coffee, Grid3X3, List,
    AlertCircle, Package, Plus,
} from 'lucide-react'

import { PAY_METHODS } from '../../constants/payMethods'
import PaymentModal from '../staff/PaymentModal'
import TableCard from '../staff/TableCard'
import ProdCard from '../staff/ProdCard'
import CartItem from '../staff/CartItem'

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

export default function StaffPage() {
    const navigate = useNavigate()
    const {
        staffUser: user, logout,
        products: ctxProducts,
        cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal,
        axiosInstance,
    } = useAppContext()

    const staffName = user?.userDetails?.fullName || user?.userName || 'Nhân viên'

    // ── State ──────────────────────────────────────────────────────
    const [products, setProducts] = useState([])
    const [tables, setTables] = useState([])
    const [selectedTable, setSelectedTable] = useState(null)
    const [customerName, setCustomerName] = useState('')
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('Tất cả')
    const [viewMode, setViewMode] = useState('grid')
    const [loadingTables, setLoadingTables] = useState(false)
    const [creatingOrder, setCreatingOrder] = useState(false)
    const [pendingOrder, setPendingOrder] = useState(null)
    const [toast, setToast] = useState(null)
    const [time, setTime] = useState(fmtTime())
    const [showBills, setShowBills] = useState(false)
    const [bills, setBills] = useState([])
    const [loadingBills, setLoadingBills] = useState(false)

    // ── Helpers ────────────────────────────────────────────────────
    const notify = (msg, type = 'success') => {
        setToast({ msg, type, id: Date.now() })
        setTimeout(() => setToast(null), 2500)
    }

    // ── Clock ──────────────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setTime(fmtTime()), 30000)
        return () => clearInterval(t)
    }, [])

    // ── API calls ──────────────────────────────────────────────────
    const fetchTables = useCallback(async () => {
        setLoadingTables(true)
        try {
            const res = await axiosInstance.get('/tables')
            const d = res.data?.data || res.data
            setTables(Array.isArray(d) ? d : [])
        } catch (e) {
            if (e.response?.status === 401) { logout('ROLE_STAFF'); navigate('/staff/login') }
        } finally { setLoadingTables(false) }
    }, [axiosInstance, logout, navigate])

    const fetchBills = useCallback(async () => {
        setLoadingBills(true)
        try {
            const res = await axiosInstance.get('/bills')
            const d = res.data?.data || res.data
            const list = Array.isArray(d) ? d : []
            list.sort((a, b) => new Date(b.issuedAt || b.createdAt) - new Date(a.issuedAt || a.createdAt))
            setBills(list)
        } catch (e) { console.error(e) }
        finally { setLoadingBills(false) }
    }, [axiosInstance])

    useEffect(() => {
        setProducts(ctxProducts || [])
        fetchTables()
    }, [ctxProducts, fetchTables])

    // ── Handlers ───────────────────────────────────────────────────
    const handleAddToCart = p => { addToCart(p); notify(`✓ Đã thêm: ${p.name}`) }
    const handleUpdateQty = (id, qty) => { if (qty <= 0) removeFromCart(id); else updateQuantity(id, qty) }

    const handleCreateOrder = async () => {
        if (!selectedTable) { notify('Chưa chọn bàn!', 'error'); return }
        if (cart.length === 0) { notify('Giỏ hàng trống!', 'error'); return }
        setCreatingOrder(true)
        try {
            const res = await axiosInstance.post('/order/table', {
                tableId: selectedTable.id,
                customerName: customerName.trim() || 'Khách lẻ',
                items: cart.map(i => ({ productId: i.id, productName: i.name, price: i.price, quantity: i.quantity })),
            })
            const order = res.data?.data || res.data
            if (!order?.id) throw new Error('Server không trả về ID đơn hàng')

            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, status: 'OCCUPIED' } : t))
            setPendingOrder({
                orderId: order.id,
                tableId: selectedTable.id,
                tableNumber: selectedTable.number,
                tableCapacity: selectedTable.capacity,
                customerName: customerName || 'Khách lẻ',
                items: [...cart],
                total: cartTotal,
            })
        } catch (e) {
            notify('Lỗi tạo đơn: ' + (e.response?.data?.message || e.message), 'error')
            fetchTables()
        } finally { setCreatingOrder(false) }
    }

    const handlePaySuccess = () => {
        clearCart(); setSelectedTable(null); setCustomerName('')
        setPendingOrder(null); fetchTables()
        notify('🎉 Thanh toán thành công!')
    }

    const handleCancelPay = async () => {
        if (!window.confirm('Hủy đơn này?')) return
        try {
            if (pendingOrder?.orderId) await axiosInstance.delete(`/order/${pendingOrder.orderId}`).catch(() => { })
            if (pendingOrder?.tableId) await axiosInstance.put(`/tables/${pendingOrder.tableId}`, {
                number: pendingOrder.tableNumber, capacity: pendingOrder.tableCapacity, status: 'FREE',
            }).catch(() => { })
        } catch (e) { console.error(e) }
        setPendingOrder(null); clearCart(); setSelectedTable(null); setCustomerName(''); fetchTables()
    }

    // ── Derived ────────────────────────────────────────────────────
    const categories = ['Tất cả', ...new Set(products.map(p => p.category?.name).filter(Boolean))]
    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) &&
        (category === 'Tất cả' || p.category?.name === category)
    )
    const freeTables = tables.filter(t => t.status === 'FREE').length
    const occupiedTables = tables.filter(t => t.status !== 'FREE').length
    const canOrder = cart.length > 0 && selectedTable

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg) } }
                @keyframes slideIn { from { transform:translateX(40px);opacity:0 } to { transform:translateX(0);opacity:1 } }
                @keyframes fadeIn  { from { opacity:0;transform:translateY(-6px) } to { opacity:1;transform:translateY(0) } }
                ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:2px }
                input::placeholder { color:#333 } * { box-sizing:border-box }
                .cat-btn:hover { opacity:0.85 }
            `}</style>

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999, background: toast.type === 'error' ? '#1a0505' : '#051a10', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#10b981'}`, borderLeft: `4px solid ${toast.type === 'error' ? '#ef4444' : '#10b981'}`, borderRadius: 10, padding: '11px 16px', color: '#f0ede6', fontSize: 13, fontWeight: 600, maxWidth: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'slideIn 0.2s ease' }}>
                    {toast.msg}
                </div>
            )}

            {/* ── LEFT SIDEBAR ── */}
            <div style={{ width: 340, background: '#111', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100vh' }}>

                {/* Staff header */}
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Coffee size={20} color="#fff" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#f0ede6', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staffName}</div>
                            <div style={{ color: '#555', fontSize: 11 }}>Nhân viên · {time}</div>
                        </div>
                        <button onClick={() => { setShowBills(true); fetchBills() }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                            <Receipt size={13} /> HĐ
                        </button>
                        <button onClick={() => navigate('/staff/settings')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, title: 'Cài đặt' }}>
                            <Settings size={13} />
                        </button>
                        <button onClick={() => { if (window.confirm('Đăng xuất?')) { logout('ROLE_STAFF'); navigate('/staff/login') } }} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                            <LogOut size={13} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                        {[
                            { label: 'Trống', value: freeTables, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                            { label: 'Bận', value: occupiedTables, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
                            { label: 'Giỏ hàng', value: cart.length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
                        ].map(s => (
                            <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                                <div style={{ color: s.color, fontWeight: 800, fontSize: 18 }}>{s.value}</div>
                                <div style={{ color: s.color, fontSize: 10, opacity: 0.7 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sơ đồ bàn */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ color: '#888', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Sơ đồ bàn</span>
                        <button onClick={fetchTables} disabled={loadingTables} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0ea5e9', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                            <RefreshCw size={12} style={{ animation: loadingTables ? 'spin 1s linear infinite' : 'none' }} />
                            {loadingTables ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                    {tables.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                            {tables.map(t => <TableCard key={t.id} table={t} selected={selectedTable} onSelect={setSelectedTable} />)}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#444', fontSize: 12, padding: '12px 0' }}>Không có bàn nào</div>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        {[['#10b981', 'Trống'], ['#f59e0b', 'Đã chọn'], ['#ef4444', 'Bận']].map(([c, l]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#555' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{l}
                            </div>
                        ))}
                    </div>

                    {selectedTable && (
                        <div style={{ marginTop: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 12px', animation: 'fadeIn 0.2s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>📍 Bàn {selectedTable.number} đã chọn</span>
                                <button onClick={() => { setSelectedTable(null); setCustomerName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}><X size={14} /></button>
                            </div>
                            <input
                                placeholder="Tên khách (tùy chọn)..."
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 10px', color: '#f0ede6', fontSize: 13, outline: 'none' }}
                            />
                        </div>
                    )}
                </div>

                {/* Cart */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <ShoppingCart size={15} color="#f59e0b" />
                        <span style={{ color: '#f0ede6', fontWeight: 700, fontSize: 13 }}>Đơn hàng</span>
                        {cart.length > 0 && <span style={{ background: '#f59e0b', color: '#000', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>{cart.length}</span>}
                        {cart.length > 0 && <button onClick={clearCart} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 11 }}>Xóa tất cả</button>}
                    </div>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#333' }}>
                            <ShoppingCart size={36} style={{ margin: '0 auto 10px' }} />
                            <div style={{ fontSize: 13, color: '#444' }}>Chưa có món</div>
                            <div style={{ fontSize: 11, marginTop: 4, color: '#333' }}>Chọn bàn rồi thêm món vào</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {cart.map(item => <CartItem key={item.id} item={item} onUpdate={handleUpdateQty} onRemove={removeFromCart} />)}
                        </div>
                    )}
                </div>

                {/* Summary + Order button */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', flexShrink: 0 }}>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 12, marginBottom: 4 }}>
                            <span>Số lượng:</span>
                            <span>{cart.reduce((s, i) => s + i.quantity, 0)} phần</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#f0ede6', fontWeight: 700 }}>Tổng cộng</span>
                            <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 22 }}>{fmt(cartTotal)}</span>
                        </div>
                    </div>

                    {!canOrder && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={13} color="#555" />
                            <span style={{ color: '#555', fontSize: 12 }}>
                                {!selectedTable && cart.length === 0 ? 'Chọn bàn & thêm món' : !selectedTable ? 'Chưa chọn bàn' : 'Giỏ hàng trống'}
                            </span>
                        </div>
                    )}

                    <button
                        onClick={handleCreateOrder}
                        disabled={!canOrder || creatingOrder}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                            background: canOrder ? 'linear-gradient(135deg,#f59e0b,#d97706)' : '#1a1a1a',
                            color: canOrder ? '#000' : '#333',
                            fontWeight: 800, fontSize: 15, cursor: canOrder ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: canOrder ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
                            transition: 'all 0.2s', fontFamily: "'DM Sans',system-ui",
                        }}
                    >
                        {creatingOrder
                            ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tạo...</>
                            : <>⚡ Tạo đơn & Thanh toán</>}
                    </button>
                </div>
            </div>

            {/* ── RIGHT: Products ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* Top bar */}
                <div style={{ background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={15} color="#444" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm món..."
                            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 12px 9px 36px', color: '#f0ede6', fontSize: 13, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3 }}>
                        {[['grid', Grid3X3], ['list', List]].map(([m, Icon]) => (
                            <button key={m} onClick={() => setViewMode(m)} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', background: viewMode === m ? '#f59e0b' : 'transparent', color: viewMode === m ? '#000' : '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                <Icon size={13} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category tabs */}
                <div style={{ background: '#0f0f0f', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 20px', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
                    {categories.map(c => (
                        <button key={c} className="cat-btn" onClick={() => setCategory(c)} style={{
                            padding: '5px 14px', borderRadius: 20,
                            border: `1px solid ${category === c ? '#f59e0b' : 'rgba(255,255,255,0.07)'}`,
                            background: category === c ? 'rgba(245,158,11,0.12)' : 'transparent',
                            color: category === c ? '#f59e0b' : '#555',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                        }}>{c}</button>
                    ))}
                </div>

                {/* Product grid / list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333' }}>
                            <Package size={48} style={{ margin: '0 auto 12px' }} />
                            <div style={{ color: '#444', fontSize: 14 }}>Không tìm thấy sản phẩm</div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
                            {filtered.map(p => <ProdCard key={p.id} product={p} onAdd={handleAddToCart} viewMode="grid" />)}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.map(p => <ProdCard key={p.id} product={p} onAdd={handleAddToCart} viewMode="list" />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {pendingOrder && (
                <PaymentModal
                    order={pendingOrder}
                    onClose={handleCancelPay}
                    onSuccess={handlePaySuccess}
                    axiosInstance={axiosInstance}
                    staffName={staffName}
                />
            )}

            {/* Bills Modal */}
            {showBills && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
                    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ color: '#f0ede6', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Receipt size={18} color="#f59e0b" /> Lịch sử hóa đơn
                            </div>
                            <button onClick={() => setShowBills(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                            {loadingBills ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Loader2 size={28} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                                    <div style={{ color: '#888' }}>Đang tải...</div>
                                </div>
                            ) : bills.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
                                    <Receipt size={48} style={{ margin: '0 auto 12px' }} />
                                    <div>Chưa có hóa đơn</div>
                                </div>
                            ) : bills.map(b => {
                                const cfg = PAY_METHODS[b.paymentMethod] || PAY_METHODS.CASH
                                const Icon = cfg.icon
                                return (
                                    <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#f0ede6', fontWeight: 700, fontSize: 14 }}>#{b.id}</div>
                                            <div style={{ color: '#555', fontSize: 11, marginTop: 3 }}>{new Date(b.issuedAt || b.createdAt).toLocaleString('vi-VN')}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
                                                <Icon size={12} /> {cfg.label}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16 }}>{fmt(b.totalAmount)}</div>
                                            <div style={{ marginTop: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: b.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: b.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b' }}>
                                                {b.paymentStatus === 'PAID' ? '✓ Đã TT' : 'Chờ TT'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}