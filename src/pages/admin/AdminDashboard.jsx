// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
    Package, ShoppingBag, Users, DollarSign,
    TrendingUp, TrendingDown, RefreshCw,
    BarChart3, PieChart, Clock, CheckCircle,
    XCircle, Truck, AlertCircle, FolderOpen,
    Calendar, Download, Eye
} from 'lucide-react'
import http from '../../services/api'

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n) => {
    if (!n) return '0'
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
    return String(Math.round(n))
}

const ORDER_STATUS = {
    PAYMENT_EXPECTED: { label: 'Chờ TT', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    PAID: { label: 'Đã TT', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    SHIPPING: { label: 'Đang giao', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    DELIVERED: { label: 'Đã giao', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

// ─── Bar Chart Component ────────────────────────────────────────
function BarChart({ data, valueKey, color, label, formatValue = (v) => v }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1)
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 180, padding: '0 4px' }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                        position: 'relative', width: '100%',
                        height: `${Math.max((d[valueKey] / max) * 150, d[valueKey] > 0 ? 4 : 0)}px`,
                        background: color, borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease',
                        cursor: 'default',
                    }}
                        title={`${d.label}: ${formatValue(d[valueKey])}`}
                    />
                    <span style={{ fontSize: 9, color: '#6b7280', writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 30 }}>
                        {d.label}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ─── Donut chart ────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
    const r = 40, cx = 60, cy = 60
    const circumference = 2 * Math.PI * r
    const total = segments.reduce((s, seg) => s + seg.value, 0)
    let offset = 0

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox="0 0 120 120">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth="18" />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fill="#6b7280" fontSize="11">Trống</text>
            </svg>
        )
    }

    return (
        <svg width={size} height={size} viewBox="0 0 120 120">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="18" />
            {segments.map((seg, i) => {
                const pct = seg.value / total
                const dash = pct * circumference
                const el = (
                    <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none" stroke={seg.color} strokeWidth="18"
                        strokeDasharray={`${dash} ${circumference - dash}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 60 60)"
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    >
                        <title>{seg.label}: {seg.value}</title>
                    </circle>
                )
                offset += dash
                return el
            })}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#f9fafb" fontSize="16" fontWeight="bold">
                {total}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#9ca3af" fontSize="9">
                tổng đơn
            </text>
        </svg>
    )
}

// ─── Stat card ──────────────────────────────────────────────────
function StatCard({ icon, title, value, sub, change, color }) {
    const up = parseFloat(change) >= 0
    return (
        <div style={{
            background: '#1f2937', border: '1px solid #374151',
            borderRadius: 12, padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: 12,
            transition: 'border-color 0.2s',
            cursor: 'default',
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${color}22`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color
                }}>
                    {icon}
                </div>
                {change !== undefined && (
                    <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: up ? '#22c55e' : '#ef4444',
                        display: 'flex', alignItems: 'center', gap: 3
                    }}>
                        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {up ? '+' : ''}{change}%
                    </span>
                )}
            </div>
            <div>
                <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 4 }}>{title}</div>
                <div style={{ color: '#f9fafb', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</div>
                {sub && <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>{sub}</div>}
            </div>
        </div>
    )
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function AdminDashboard() {
    const [data, setData] = useState({
        products: [], orders: [], users: [], payments: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewType, setViewType] = useState('day') // 'day', 'month', 'year'
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [revenueData, setRevenueData] = useState([])

    // ── Fetch tất cả data từ BE ──────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [pRes, oRes, uRes, payRes] = await Promise.allSettled([
                http.get('/products'),
                http.get('/order'),
                http.get('/users'),
                http.get('/api/payments'),
            ])

            const get = (res) => {
                if (res.status !== 'fulfilled') return []
                const d = res.value.data
                if (Array.isArray(d)) return d
                if (Array.isArray(d?.data)) return d.data
                return []
            }

            setData({
                products: get(pRes),
                orders: get(oRes),
                users: get(uRes),
                payments: get(payRes),
            })
        } catch (e) {
            setError(e.message || 'Không thể tải dữ liệu')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    // ── Tính toán doanh thu theo view type ────────────────────
    useEffect(() => {
        const { orders } = data
        const paidOrders = orders.filter(o => ['PAID', 'DELIVERED', 'SHIPPING'].includes(o.status))

        if (viewType === 'day') {
            // Doanh thu theo ngày trong tháng
            const year = selectedDate.getFullYear()
            const month = selectedDate.getMonth()
            const daysInMonth = new Date(year, month + 1, 0).getDate()

            const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const date = new Date(year, month, day)
                const dateStr = date.toISOString().split('T')[0]

                const revenue = paidOrders
                    .filter(o => {
                        const orderDate = (o.orderedDate || o.createdAt || '').toString().split('T')[0]
                        return orderDate === dateStr
                    })
                    .reduce((sum, o) => sum + Number(o.total || 0), 0)

                return {
                    label: `${day}`,
                    value: revenue,
                    fullDate: dateStr
                }
            })

            setRevenueData(dailyRevenue)
        }
        else if (viewType === 'month') {
            // Doanh thu theo tháng trong năm
            const year = selectedDate.getFullYear()
            const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
                const month = i
                const revenue = paidOrders
                    .filter(o => {
                        const orderDate = new Date(o.orderedDate || o.createdAt || 0)
                        return orderDate.getFullYear() === year && orderDate.getMonth() === month
                    })
                    .reduce((sum, o) => sum + Number(o.total || 0), 0)

                return {
                    label: `T${i + 1}`,
                    value: revenue,
                    fullMonth: `${year}-${String(i + 1).padStart(2, '0')}`
                }
            })

            setRevenueData(monthlyRevenue)
        }
        else if (viewType === 'year') {
            // Doanh thu theo năm
            const currentYear = new Date().getFullYear()
            const startYear = currentYear - 5
            const yearlyRevenue = Array.from({ length: 6 }, (_, i) => {
                const year = startYear + i
                const revenue = paidOrders
                    .filter(o => {
                        const orderDate = new Date(o.orderedDate || o.createdAt || 0)
                        return orderDate.getFullYear() === year
                    })
                    .reduce((sum, o) => sum + Number(o.total || 0), 0)

                return {
                    label: `${year}`,
                    value: revenue,
                    fullYear: year
                }
            })

            setRevenueData(yearlyRevenue)
        }
    }, [data.orders, viewType, selectedDate])

    // ── Tính toán thống kê tổng quan ───────────────────────────
    const { products, orders, users, payments } = data

    const customers = users.filter(u => {
        const role = u.role?.roleName || u.role || ''
        return role === 'ROLE_USER' || role === 'USER' || role === ''
    })

    const paidOrders = orders.filter(o => ['PAID', 'DELIVERED', 'SHIPPING'].includes(o.status))
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0)

    // Doanh thu tháng hiện tại
    const currentMonthRevenue = paidOrders
        .filter(o => {
            const orderDate = new Date(o.orderedDate || o.createdAt || 0)
            const now = new Date()
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        })
        .reduce((s, o) => s + Number(o.total || 0), 0)

    // Doanh thu tháng trước
    const lastMonthRevenue = paidOrders
        .filter(o => {
            const orderDate = new Date(o.orderedDate || o.createdAt || 0)
            const now = new Date()
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            return orderDate.getMonth() === lastMonth.getMonth() && orderDate.getFullYear() === lastMonth.getFullYear()
        })
        .reduce((s, o) => s + Number(o.total || 0), 0)

    const monthChange = lastMonthRevenue > 0
        ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(0)
        : currentMonthRevenue > 0 ? 100 : 0

    // ── Trạng thái đơn hàng ───────────────────────────────────
    const statusCounts = Object.entries(ORDER_STATUS).map(([key, cfg]) => ({
        label: cfg.label,
        value: orders.filter(o => o.status === key).length,
        color: cfg.color,
    })).filter(s => s.value > 0)

    // ── Categories từ products ─────────────────────────────────
    const catMap = {}
    products.forEach(p => {
        const cat = (typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác'
        catMap[cat] = (catMap[cat] || 0) + 1
    })
    const categories = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)

    const CAT_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4']

    // ── Recent orders ─────────────────────────────────────────
    const recentTop5 = [...orders]
        .sort((a, b) => new Date(b.orderedDate || b.createdAt || 0) - new Date(a.orderedDate || a.createdAt || 0))
        .slice(0, 5)

    // ── Navigation handlers ───────────────────────────────────
    const handlePrevious = () => {
        const newDate = new Date(selectedDate)
        if (viewType === 'day') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else if (viewType === 'month') {
            newDate.setFullYear(newDate.getFullYear() - 1)
        } else if (viewType === 'year') {
            newDate.setFullYear(newDate.getFullYear() - 1)
        }
        setSelectedDate(newDate)
    }

    const handleNext = () => {
        const newDate = new Date(selectedDate)
        if (viewType === 'day') {
            newDate.setMonth(newDate.getMonth() + 1)
        } else if (viewType === 'month') {
            newDate.setFullYear(newDate.getFullYear() + 1)
        } else if (viewType === 'year') {
            newDate.setFullYear(newDate.getFullYear() + 1)
        }
        setSelectedDate(newDate)
    }

    const getPeriodTitle = () => {
        if (viewType === 'day') {
            return `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
        } else if (viewType === 'month') {
            return `Năm ${selectedDate.getFullYear()}`
        } else {
            return `${selectedDate.getFullYear()} - ${selectedDate.getFullYear() + 5}`
        }
    }

    const totalPeriodRevenue = revenueData.reduce((sum, item) => sum + item.value, 0)

    // ── Loading / Error ───────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 44, height: 44, border: '4px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Đang tải dữ liệu...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )

    if (error) return (
        <div style={{ padding: 24 }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: 20, display: 'flex', gap: 12 }}>
                <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                    <p style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 6 }}>Không thể tải dữ liệu</p>
                    <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>{error}</p>
                    <button onClick={fetchAll} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
                        Thử lại
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ padding: 24, color: '#f9fafb', fontFamily: 'inherit' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 4 }}>Bảng Điều Khiển</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        Dữ liệu thực từ hệ thống • {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={fetchAll} style={{
                        background: '#1f2937', color: '#f9fafb', border: '1px solid #374151',
                        borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <RefreshCw size={14} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard
                    icon={<Package size={20} />}
                    title="Tổng sản phẩm"
                    value={products.length}
                    sub={`${Object.keys(catMap).length} danh mục`}
                    color="#3b82f6"
                />
                <StatCard
                    icon={<ShoppingBag size={20} />}
                    title="Đơn hàng"
                    value={orders.length}
                    sub={`${paidOrders.length} đơn đã thanh toán`}
                    color="#22c55e"
                />
                <StatCard
                    icon={<Users size={20} />}
                    title="Khách hàng"
                    value={customers.length}
                    sub={`${users.length} tổng tài khoản`}
                    color="#8b5cf6"
                />
                <StatCard
                    icon={<DollarSign size={20} />}
                    title="Tổng doanh thu"
                    value={fmt(totalRevenue) + 'đ'}
                    sub={`${paidOrders.length} đơn đã thanh toán`}
                    color="#f59e0b"
                />
                <StatCard
                    icon={<Calendar size={20} />}
                    title="Doanh thu tháng này"
                    value={fmt(currentMonthRevenue) + 'đ'}
                    sub={`So với tháng trước`}
                    change={monthChange}
                    color="#06b6d4"
                />
            </div>

            {/* ── Revenue Chart Section ── */}
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <DollarSign size={20} color="#f59e0b" />
                            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Báo Cáo Doanh Thu</h2>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setViewType('day')}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: viewType === 'day' ? '#f59e0b' : '#374151',
                                    color: viewType === 'day' ? '#fff' : '#9ca3af'
                                }}
                            >
                                Theo Ngày
                            </button>
                            <button
                                onClick={() => setViewType('month')}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: viewType === 'month' ? '#f59e0b' : '#374151',
                                    color: viewType === 'month' ? '#fff' : '#9ca3af'
                                }}
                            >
                                Theo Tháng
                            </button>
                            <button
                                onClick={() => setViewType('year')}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: viewType === 'year' ? '#f59e0b' : '#374151',
                                    color: viewType === 'year' ? '#fff' : '#9ca3af'
                                }}
                            >
                                Theo Năm
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={handlePrevious} style={{
                            background: '#374151', border: 'none', borderRadius: 6,
                            padding: '6px 12px', cursor: 'pointer', color: '#f9fafb'
                        }}>
                            ◀
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
                            {getPeriodTitle()}
                        </span>
                        <button onClick={handleNext} style={{
                            background: '#374151', border: 'none', borderRadius: 6,
                            padding: '6px 12px', cursor: 'pointer', color: '#f9fafb'
                        }}>
                            ▶
                        </button>
                    </div>
                </div>

                <BarChart
                    data={revenueData}
                    valueKey="value"
                    color="#f59e0b"
                    formatValue={(v) => fmt(v) + 'đ'}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #374151' }}>
                    <div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Tổng doanh thu kỳ này: </span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{fmt(totalPeriodRevenue)}đ</span>
                    </div>
                    <div>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>Trung bình: </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>
                            {fmt(revenueData.length > 0 ? totalPeriodRevenue / revenueData.length : 0)}đ
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Bottom row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                {/* Trạng thái đơn hàng */}
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <PieChart size={18} color="#8b5cf6" />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Trạng thái đơn hàng</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <DonutChart segments={statusCounts} size={110} />
                        <div style={{ flex: 1 }}>
                            {Object.entries(ORDER_STATUS).map(([key, cfg]) => {
                                const count = orders.filter(o => o.status === key).length
                                if (count === 0) return null
                                return (
                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{cfg.label}</span>
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Danh mục sản phẩm */}
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <FolderOpen size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Danh mục sản phẩm</span>
                    </div>
                    {categories.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 24 }}>Chưa có sản phẩm</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {categories.map(([name, count], i) => {
                                const pct = products.length > 0 ? (count / products.length) * 100 : 0
                                return (
                                    <div key={name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, color: '#d1d5db' }}>{name}</span>
                                            <span style={{ fontSize: 11, color: '#6b7280' }}>{count} SP ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div style={{ height: 6, background: '#374151', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`,
                                                background: CAT_COLORS[i % CAT_COLORS.length],
                                                borderRadius: 3, transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* 5 đơn hàng gần nhất */}
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Clock size={18} color="#06b6d4" />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Đơn hàng gần nhất</span>
                    </div>
                    {recentTop5.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 24 }}>Chưa có đơn hàng</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {recentTop5.map(o => {
                                const si = ORDER_STATUS[o.status] || { label: o.status, color: '#9ca3af', bg: '#1f2937' }
                                return (
                                    <div key={o.id} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', padding: '8px 10px',
                                        background: '#111827', borderRadius: 8,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>#{o.id}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>{o.user?.userName || 'Khách'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{fmt(Number(o.total || 0))}đ</div>
                                            <span style={{
                                                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                                                background: si.bg, color: si.color, fontWeight: 600
                                            }}>
                                                {si.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}