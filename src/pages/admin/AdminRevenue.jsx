// src/pages/admin/AdminRevenue.jsx
// Trang doanh thu — gọi /api/revenue (payment-service)

import React, { useState, useEffect, useCallback } from 'react'
import {
    DollarSign, TrendingUp, Calendar, BarChart3,
    RefreshCw, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import http from '../../services/api'

const fmt = (n) => {
    const num = Number(n) || 0
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + ' tỷ'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' triệu'
    if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K'
    return num.toLocaleString('vi-VN')
}

const fmtFull = (n) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ'

function BarChart({ data, valueKey, colorFn, height = 140 }) {
    const values = data.map(d => Number(d[valueKey]) || 0)
    const max = Math.max(...values, 1)
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height, padding: '0 4px' }}>
            {data.map((d, i) => {
                const v = Number(d[valueKey]) || 0
                const barH = Math.max((v / max) * (height - 20), v > 0 ? 3 : 0)
                const color = colorFn ? colorFn(d, i) : '#f59e0b'
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' }}
                        title={`${d.label}: ${fmtFull(v)}`}>
                        <div style={{
                            width: '100%', height: barH, background: color,
                            borderRadius: '3px 3px 0 0', transition: 'height 0.4s ease',
                            opacity: v === 0 ? 0.25 : 1,
                        }} />
                        <span style={{ fontSize: 9, color: '#6b7280', writingMode: 'horizontal-tb', textAlign: 'center', lineHeight: 1.2 }}>
                            {d.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function StatCard({ icon, title, value, sub, color, accent }) {
    return (
        <div style={{ background: '#1f2937', border: `1px solid ${accent || '#374151'}33`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                    {icon}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{title}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#f9fafb', marginBottom: 4 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>}
        </div>
    )
}

export default function AdminRevenue() {
    const now = new Date()
    const [viewMode, setViewMode] = useState('monthly') // 'daily' | 'monthly' | 'yearly'
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)

    const [summary, setSummary] = useState(null)
    const [chartData, setChartData] = useState([])
    const [periodData, setPeriodData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAll = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const [sumRes, chartRes, periodRes] = await Promise.allSettled([
                http.get('/api/revenue/summary'),
                viewMode === 'daily'
                    ? http.get('/api/revenue/chart/daily', { params: { year, month } })
                    : http.get('/api/revenue/chart/monthly', { params: { year } }),
                viewMode === 'daily'
                    ? http.get('/api/revenue/by-month', { params: { year, month } })
                    : viewMode === 'monthly'
                        ? http.get('/api/revenue/by-year', { params: { year } })
                        : http.get('/api/revenue/summary'),
            ])

            if (sumRes.status === 'fulfilled') {
                setSummary(sumRes.value.data?.data || null)
            }
            if (chartRes.status === 'fulfilled') {
                const raw = chartRes.value.data?.data || []
                setChartData(Array.isArray(raw) ? raw : [])
            }
            if (periodRes.status === 'fulfilled') {
                setPeriodData(periodRes.value.data?.data || null)
            }
        } catch (e) {
            setError('Không thể tải dữ liệu doanh thu: ' + (e.message || ''))
        } finally { setLoading(false) }
    }, [viewMode, year, month])

    useEffect(() => { fetchAll() }, [fetchAll])

    const methodColors = {
        VNPAY: '#3b82f6',
        CASH: '#22c55e',
        CREDIT_CARD: '#8b5cf6',
        BANK_TRANSFER: '#06b6d4',
        E_WALLET: '#ec4899',
    }
    const methodLabels = {
        VNPAY: 'VNPay',
        CASH: 'Tiền mặt',
        CREDIT_CARD: 'Thẻ tín dụng',
        BANK_TRANSFER: 'Chuyển khoản',
        E_WALLET: 'Ví điện tử',
    }

    const byMethod = summary?.revenueByMethod || {}
    const totalByMethod = Object.values(byMethod).reduce((s, v) => s + Number(v), 0)

    const MONTH_NAMES = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

    const periodLabel = viewMode === 'daily'
        ? `${MONTH_NAMES[month]}/${year}`
        : viewMode === 'monthly' ? `Năm ${year}` : 'Toàn thời gian'

    return (
        <div style={{ padding: 24, color: '#f9fafb', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Báo Cáo Doanh Thu</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        Thống kê doanh thu từ các giao dịch thanh toán thành công
                    </p>
                </div>
                <button onClick={fetchAll}
                    style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 16px', color: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
                    <button onClick={fetchAll} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Thử lại</button>
                </div>
            )}

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                <StatCard
                    icon={<DollarSign size={20} />}
                    title="Tổng doanh thu"
                    value={summary ? fmt(summary.totalRevenue) + 'đ' : '—'}
                    sub="Toàn thời gian"
                    color="#f59e0b"
                />
                <StatCard
                    icon={<BarChart3 size={20} />}
                    title="Tổng giao dịch"
                    value={summary?.totalTransactions ?? '—'}
                    sub="Giao dịch thành công"
                    color="#22c55e"
                />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    title="TB mỗi đơn"
                    value={summary ? fmt(summary.averageOrderValue) + 'đ' : '—'}
                    sub="Giá trị trung bình"
                    color="#3b82f6"
                />
                <StatCard
                    icon={<Calendar size={20} />}
                    title={`Doanh thu ${periodLabel}`}
                    value={periodData ? fmt(periodData.totalRevenue) + 'đ' : '—'}
                    sub={periodData ? `${periodData.totalTransactions} giao dịch` : ''}
                    color="#8b5cf6"
                />
            </div>

            {/* Chart controls */}
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart3 size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Biểu đồ doanh thu</span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* View mode tabs */}
                        <div style={{ display: 'flex', background: '#111827', borderRadius: 8, padding: 3 }}>
                            {[['daily', 'Theo ngày'], ['monthly', 'Theo tháng']].map(([mode, label]) => (
                                <button key={mode} onClick={() => setViewMode(mode)}
                                    style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: viewMode === mode ? 700 : 400, background: viewMode === mode ? '#f59e0b' : 'transparent', color: viewMode === mode ? '#111827' : '#9ca3af', transition: 'all .15s' }}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Year nav */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#111827', borderRadius: 8, padding: '4px 8px' }}>
                            <button onClick={() => setYear(y => y - 1)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px' }}>
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', minWidth: 44, textAlign: 'center' }}>{year}</span>
                            <button onClick={() => setYear(y => Math.min(now.getFullYear(), y + 1))} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px' }}>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Month nav (daily only) */}
                        {viewMode === 'daily' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#111827', borderRadius: 8, padding: '4px 8px' }}>
                                <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px' }}>
                                    <ChevronLeft size={14} />
                                </button>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#f9fafb', minWidth: 64, textAlign: 'center' }}>{MONTH_NAMES[month]}</span>
                                <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '2px 4px' }}>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                ) : chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
                        Không có dữ liệu cho kỳ này
                    </div>
                ) : (
                    <>
                        <BarChart
                            data={chartData}
                            valueKey="revenue"
                            height={160}
                            colorFn={(d, i) => {
                                const v = Number(d.revenue) || 0
                                if (v === 0) return '#374151'
                                const max = Math.max(...chartData.map(x => Number(x.revenue) || 0), 1)
                                const ratio = v / max
                                if (ratio > 0.8) return '#f59e0b'
                                if (ratio > 0.5) return '#fbbf24'
                                return '#d97706'
                            }}
                        />
                        {/* Summary below chart */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '10px 0', borderTop: '1px solid #374151' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                Cao nhất: <strong style={{ color: '#f59e0b' }}>{fmtFull(Math.max(...chartData.map(d => Number(d.revenue) || 0)))}</strong>
                            </span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                Tổng kỳ: <strong style={{ color: '#22c55e' }}>{fmtFull(chartData.reduce((s, d) => s + (Number(d.revenue) || 0), 0))}</strong>
                            </span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>
                                TB/kỳ: <strong style={{ color: '#3b82f6' }}>{fmtFull(chartData.length > 0 ? chartData.reduce((s, d) => s + (Number(d.revenue) || 0), 0) / chartData.length : 0)}</strong>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Revenue by payment method */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Method breakdown */}
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DollarSign size={16} color="#f59e0b" />
                        Doanh thu theo phương thức thanh toán
                    </div>
                    {Object.keys(byMethod).length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Chưa có dữ liệu</p>
                    ) : Object.entries(byMethod).map(([method, amount]) => {
                        const pct = totalByMethod > 0 ? (Number(amount) / totalByMethod) * 100 : 0
                        const color = methodColors[method] || '#6b7280'
                        return (
                            <div key={method} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                                        <span style={{ fontSize: 13, color: '#d1d5db' }}>{methodLabels[method] || method}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color }}>{fmtFull(amount)}</span>
                                        <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>{pct.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div style={{ height: 6, background: '#374151', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Period detail */}
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} color="#3b82f6" />
                        Chi tiết kỳ: {periodLabel}
                    </div>
                    {!periodData ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                            <div style={{ width: 28, height: 28, border: '3px solid #374151', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                    ) : (
                        <>
                            {[
                                { label: 'Tổng doanh thu', value: fmtFull(periodData.totalRevenue), color: '#f59e0b', big: true },
                                { label: 'Số giao dịch', value: periodData.totalTransactions, color: '#22c55e' },
                                { label: 'Giá trị TB/đơn', value: fmtFull(periodData.averageOrderValue), color: '#3b82f6' },
                            ].map(({ label, value, color, big }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #374151' }}>
                                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
                                    <span style={{ fontSize: big ? 18 : 14, fontWeight: 700, color }}>{value}</span>
                                </div>
                            ))}
                            {Object.entries(periodData.revenueByMethod || {}).map(([method, amount]) => (
                                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1f2937' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: methodColors[method] || '#6b7280' }} />
                                        <span style={{ fontSize: 12, color: '#d1d5db' }}>{methodLabels[method] || method}</span>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: methodColors[method] || '#9ca3af' }}>{fmtFull(amount)}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
