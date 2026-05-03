// src/pages/admin/AdminActivityLog.jsx
// Xem log hành động của admin và staff (thêm/sửa/xóa sản phẩm)
// Dữ liệu từ: GET /admin/logs (product-catalog-service)

import React, { useState, useEffect, useCallback } from 'react'
import {
    Search, Filter, RefreshCw, AlertCircle, Plus, Edit3, Trash2,
    ChevronDown, ChevronUp, Eye, X, Clock, User, Tag, FileText
} from 'lucide-react'
import http from '../../services/api'

const ACTION_CONFIG = {
    ADD:    { label: 'Thêm mới', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: Plus },
    UPDATE: { label: 'Cập nhật', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Edit3 },
    DELETE: { label: 'Xóa',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: Trash2 },
}
const ROLE_CONFIG = {
    ADMIN: { label: 'Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    STAFF: { label: 'Staff', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
}

function fmtDate(dt) {
    if (!dt) return '—'
    const d = new Date(dt)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
}

function JsonViewer({ data, label }) {
    let parsed
    try { parsed = typeof data === 'string' ? JSON.parse(data) : data } catch { parsed = data }
    if (!parsed) return <span style={{ color: '#6b7280' }}>—</span>

    return (
        <div style={{ background: '#0f1117', borderRadius: 8, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: '#d1d5db', maxHeight: 220, overflowY: 'auto', border: '1px solid #374151' }}>
            <div style={{ color: '#6b7280', marginBottom: 6, fontFamily: 'DM Sans, system-ui' }}>{label}</div>
            {Object.entries(parsed).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: '#f59e0b', minWidth: 100 }}>{k}:</span>
                    <span style={{ color: v === null ? '#6b7280' : '#d1d5db' }}>
                        {v === null ? 'null' : String(v)}
                    </span>
                </div>
            ))}
        </div>
    )
}

function DetailModal({ log, onClose }) {
    if (!log) return null
    const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}>
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 14, padding: 28, maxWidth: 700, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: ac.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ac.icon size={18} color={ac.color} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#f9fafb' }}>Chi tiết log #{log.id}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(log.createdAt)}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Người thực hiện', value: log.performedBy, icon: User },
                        { label: 'Vai trò', value: log.role, icon: Tag },
                        { label: 'Hành động', value: ac.label, icon: FileText, color: ac.color },
                        { label: 'Tên sản phẩm', value: log.productName, icon: Tag },
                        { label: 'ID sản phẩm', value: log.productId ? `#${log.productId}` : '—', icon: Tag },
                        { label: 'Ghi chú', value: log.note || '—', icon: FileText },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} style={{ background: '#111827', borderRadius: 8, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                            <div style={{ fontSize: 13, color: color || '#f9fafb', fontWeight: 600 }}>{value || '—'}</div>
                        </div>
                    ))}
                </div>

                {/* Data diff */}
                {(log.oldData || log.newData) && (
                    <div style={{ display: 'grid', gridTemplateColumns: log.oldData && log.newData ? '1fr 1fr' : '1fr', gap: 12 }}>
                        {log.oldData && <JsonViewer data={log.oldData} label="Dữ liệu trước" />}
                        {log.newData && <JsonViewer data={log.newData} label="Dữ liệu sau" />}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AdminActivityLog() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [filterAction, setFilterAction] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [sortDir, setSortDir] = useState('desc')
    const [detail, setDetail] = useState(null)
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 20

    const fetchLogs = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const params = {}
            if (filterAction) params.action = filterAction
            if (filterRole) params.role = filterRole
            const res = await http.get('/admin/logs', { params })
            const data = Array.isArray(res.data) ? res.data : []
            setLogs(data)
            setPage(1)
        } catch (e) {
            setError('Không thể tải lịch sử hoạt động: ' + (e.response?.data?.message || e.message))
        } finally { setLoading(false) }
    }, [filterAction, filterRole])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    // Filter + sort
    const filtered = logs
        .filter(l => {
            if (!search) return true
            const q = search.toLowerCase()
            return (
                (l.performedBy || '').toLowerCase().includes(q) ||
                (l.productName || '').toLowerCase().includes(q) ||
                String(l.productId || '').includes(q) ||
                (l.action || '').toLowerCase().includes(q)
            )
        })
        .sort((a, b) => {
            const da = new Date(a.createdAt || 0)
            const db = new Date(b.createdAt || 0)
            return sortDir === 'desc' ? db - da : da - db
        })

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    // Stats
    const countByAction = (action) => logs.filter(l => l.action === action).length

    return (
        <div style={{ padding: 24, color: '#f9fafb', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Nhật Ký Hoạt Động</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        Lịch sử thêm/sửa/xóa sản phẩm của admin và nhân viên
                    </p>
                </div>
                <button onClick={fetchLogs}
                    style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 16px', color: '#f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <RefreshCw size={14} /> Làm mới
                </button>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
                {[
                    { label: 'Tổng log', value: logs.length, color: '#6b7280' },
                    { label: 'Thêm mới', value: countByAction('ADD'), color: '#22c55e' },
                    { label: 'Cập nhật', value: countByAction('UPDATE'), color: '#3b82f6' },
                    { label: 'Xóa', value: countByAction('DELETE'), color: '#ef4444' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 10, padding: '16px 20px' }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                        placeholder="Tìm theo tên người, sản phẩm..."
                        style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 36, padding: '9px 12px 9px 36px', background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 13, outline: 'none' }}
                    />
                </div>

                {/* Action filter */}
                <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1) }}
                    style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '9px 12px', color: '#f9fafb', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Tất cả hành động</option>
                    <option value="ADD">Thêm mới</option>
                    <option value="UPDATE">Cập nhật</option>
                    <option value="DELETE">Xóa</option>
                </select>

                {/* Role filter */}
                <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1) }}
                    style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '9px 12px', color: '#f9fafb', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                    <option value="">Tất cả vai trò</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Nhân viên</option>
                </select>

                {/* Sort */}
                <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                    style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '9px 14px', color: '#f9fafb', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    {sortDir === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                </button>

                {(search || filterAction || filterRole) && (
                    <button onClick={() => { setSearch(''); setFilterAction(''); setFilterRole(''); setPage(1) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '9px 14px', color: '#ef4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <X size={12} /> Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertCircle size={16} color="#ef4444" />
                    <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
                </div>
            )}

            {/* Table */}
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 140px 90px 90px 180px 1fr 120px 80px', gap: 0, padding: '12px 16px', borderBottom: '1px solid #374151', background: '#111827' }}>
                    {['ID', 'Người thực hiện', 'Vai trò', 'Hành động', 'Sản phẩm', 'Ghi chú', 'Thời gian', ''].map(h => (
                        <div key={h} style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48 }}>
                        <div style={{ width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        <p style={{ color: '#6b7280', fontSize: 13 }}>Đang tải...</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                ) : paged.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
                        {search || filterAction || filterRole ? 'Không có kết quả phù hợp' : 'Chưa có lịch sử hoạt động nào'}
                    </div>
                ) : paged.map((log, idx) => {
                    const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG.UPDATE
                    const rc = ROLE_CONFIG[log.role] || { label: log.role, color: '#6b7280', bg: '#374151' }
                    const Ico = ac.icon
                    return (
                        <div key={log.id} style={{
                            display: 'grid', gridTemplateColumns: '60px 140px 90px 90px 180px 1fr 120px 80px',
                            gap: 0, padding: '13px 16px',
                            borderBottom: idx < paged.length - 1 ? '1px solid #1f2937' : 'none',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                            alignItems: 'center', transition: 'background 0.15s',
                            cursor: 'default',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                        >
                            <div style={{ fontSize: 12, color: '#6b7280' }}>#{log.id}</div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>
                                    {(log.performedBy || '?')[0].toUpperCase()}
                                </div>
                                <span style={{ fontSize: 12, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.performedBy}</span>
                            </div>

                            <div>
                                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: rc.bg, color: rc.color, fontWeight: 600 }}>
                                    {rc.label}
                                </span>
                            </div>

                            <div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 6, background: ac.bg, color: ac.color, fontWeight: 600 }}>
                                    <Ico size={10} />{ac.label}
                                </span>
                            </div>

                            <div style={{ fontSize: 12, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.productName || '—'}
                                {log.productId && <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 4 }}>#{log.productId}</span>}
                            </div>

                            <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.note || '—'}
                            </div>

                            <div style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} />
                                {fmtDate(log.createdAt)}
                            </div>

                            <div>
                                <button onClick={() => setDetail(log)}
                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '5px 10px', color: '#3b82f6', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={11} /> Xem
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                        Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} kết quả
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '6px 12px', color: page === 1 ? '#374151' : '#f9fafb', cursor: page === 1 ? 'default' : 'pointer', fontSize: 12 }}>
                            ← Trước
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    style={{ background: page === p ? '#f59e0b' : '#1f2937', border: `1px solid ${page === p ? '#f59e0b' : '#374151'}`, borderRadius: 6, padding: '6px 11px', color: page === p ? '#111827' : '#f9fafb', cursor: 'pointer', fontSize: 12, fontWeight: page === p ? 700 : 400 }}>
                                    {p}
                                </button>
                            )
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 6, padding: '6px 12px', color: page === totalPages ? '#374151' : '#f9fafb', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12 }}>
                            Sau →
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detail && <DetailModal log={detail} onClose={() => setDetail(null)} />}
        </div>
    )
}
