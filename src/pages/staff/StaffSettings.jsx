// src/pages/staff/StaffSettings.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
    Save, Palette, AlertCircle, CheckCircle2,
    User, Monitor, Printer, Grid3X3, List,
    X, Info, RefreshCw, ChevronLeft,
    LayoutGrid, Plus, Edit2, Trash2, Users, Coffee
} from 'lucide-react'
import http from '../../services/api'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../../contexts/AppContext'

const S = {
    page: { minHeight: '100vh', background: '#0f1117', color: '#f0ede6', fontFamily: '"DM Sans", system-ui, sans-serif' },
    header: { background: '#1a1a2e', borderBottom: '1px solid #2a2a3e', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 },
    wrap: { padding: 24, maxWidth: 820, margin: '0 auto' },
    section: { background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 14, marginBottom: 20, overflow: 'hidden' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid #2a2a3e' },
    sectionBody: { padding: 20 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
    fullRow: { marginBottom: 14 },
    label: { display: 'block', fontSize: 11, color: '#6b7080', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
    input: { width: '100%', background: '#0f1117', color: '#f0ede6', border: '1px solid #2a2a3e', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    select: { width: '100%', background: '#0f1117', color: '#f0ede6', border: '1px solid #2a2a3e', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' },
    toggle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(42,42,62,0.8)' },
    saveBtn: { display: 'flex', alignItems: 'center', gap: 8, background: '#f59e0b', color: '#111', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
}

function Toggle({ value, onChange }) {
    return (
        <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: value ? '#f59e0b' : '#374151', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s' }} />
        </div>
    )
}

function SectionHeader({ icon: Icon, title, color = '#f59e0b' }) {
    return (
        <div style={S.sectionHeader}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#f0ede6' }}>{title}</span>
        </div>
    )
}

function Toast({ msg, type, onClose }) {
    const c = type === 'error' ? '#ef4444' : '#22c55e'
    const Icon = type === 'error' ? AlertCircle : CheckCircle2
    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: '#1a1a2e', border: `1px solid ${c}`, borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 16px', color: '#f0ede6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <Icon size={16} color={c} /><span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7080', cursor: 'pointer' }}><X size={14} /></button>
        </div>
    )
}

// ── Table status helpers ───────────────────────────────────────────
const STATUS_CFG = {
    FREE: { label: 'Trống', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)' },
    OCCUPIED: { label: 'Có khách', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
    RESERVED: { label: 'Đặt trước', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
}

// ── Table Management Tab ──────────────────────────────────────────
function TableManagement() {
    const [tables, setTables] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [formData, setFormData] = useState({ number: '', capacity: '', status: 'FREE', note: '' })
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [toast, setToast] = useState(null)

    const notify = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchTables = useCallback(async () => {
        setLoading(true)
        try {
            const res = await http.get('/tables')
            const data = res.data?.data || res.data
            const list = Array.isArray(data) ? data : []
            list.sort((a, b) => (a.number || 0) - (b.number || 0))
            setTables(list)
        } catch (e) {
            notify('Không thể tải danh sách bàn: ' + (e.response?.data?.message || e.message), 'error')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchTables() }, [fetchTables])

    const closeModal = () => {
        setShowModal(false); setEditing(null)
        setFormData({ number: '', capacity: '', status: 'FREE', note: '' })
    }

    const openEdit = (table) => {
        setEditing(table)
        setFormData({ number: table.number, capacity: table.capacity, status: table.status, note: table.note || '' })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.number || Number(formData.number) <= 0) { notify('Số bàn phải lớn hơn 0!', 'error'); return }
        if (!formData.capacity || Number(formData.capacity) <= 0) { notify('Sức chứa phải lớn hơn 0!', 'error'); return }
        setLoading(true)
        const payload = { number: Number(formData.number), capacity: Number(formData.capacity), status: formData.status, note: formData.note || '' }
        try {
            if (editing) {
                await http.put(`/tables/${editing.id}`, payload)
                notify(`✅ Đã cập nhật Bàn ${formData.number}`)
            } else {
                await http.post('/tables', payload)
                notify(`✅ Đã thêm Bàn ${formData.number}`)
            }
            await fetchTables()
            closeModal()
        } catch (e) {
            notify('Lỗi: ' + (e.response?.data?.message || e.message), 'error')
        } finally { setLoading(false) }
    }

    const handleDelete = async (table) => {
        if (table.status === 'OCCUPIED') { notify('Không thể xóa bàn đang có khách!', 'error'); return }
        if (!window.confirm(`Xóa Bàn ${table.number}?`)) return
        try {
            await http.delete(`/tables/${table.id}`)
            notify(`✅ Đã xóa Bàn ${table.number}`)
            fetchTables()
        } catch (e) {
            notify('Lỗi xóa: ' + (e.response?.data?.message || e.message), 'error')
        }
    }

    const handleStatusChange = async (table, newStatus) => {
        try {
            await http.put(`/tables/${table.id}`, { number: table.number, capacity: table.capacity, status: newStatus, note: table.note || '' })
            notify(`Bàn ${table.number} → ${STATUS_CFG[newStatus]?.label}`)
            fetchTables()
        } catch { notify('Không thể cập nhật trạng thái', 'error') }
    }

    const filtered = tables.filter(t => {
        const ms = t.number?.toString().includes(search) || (t.note || '').toLowerCase().includes(search.toLowerCase())
        const mf = filterStatus === 'ALL' || t.status === filterStatus
        return ms && mf
    })

    const stats = {
        total: tables.length,
        free: tables.filter(t => t.status === 'FREE').length,
        occupied: tables.filter(t => t.status === 'OCCUPIED').length,
        reserved: tables.filter(t => t.status === 'RESERVED').length,
    }

    return (
        <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                    { label: 'Tổng bàn', value: stats.total, color: '#3b82f6' },
                    { label: 'Đang trống', value: stats.free, color: '#10b981' },
                    { label: 'Có khách', value: stats.occupied, color: '#ef4444' },
                    { label: 'Đặt trước', value: stats.reserved, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#0f1117', border: '1px solid #2a2a3e', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#6b7080', marginTop: 3 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160, position: 'relative' }}>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm số bàn, ghi chú..."
                        style={{ ...S.input, paddingLeft: 12 }}
                    />
                </div>
                {['ALL', 'FREE', 'OCCUPIED', 'RESERVED'].map(v => (
                    <button key={v} onClick={() => setFilterStatus(v)} style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                        borderColor: filterStatus === v ? '#f59e0b' : '#2a2a3e',
                        background: filterStatus === v ? 'rgba(245,158,11,0.12)' : '#0f1117',
                        color: filterStatus === v ? '#f59e0b' : '#6b7080',
                    }}>
                        {v === 'ALL' ? 'Tất cả' : STATUS_CFG[v]?.label}
                    </button>
                ))}
                <button onClick={fetchTables} disabled={loading} style={{ padding: '8px 12px', borderRadius: 8, background: '#0f1117', border: '1px solid #2a2a3e', color: '#6b7080', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    Làm mới
                </button>
                <button onClick={() => { setEditing(null); setFormData({ number: '', capacity: '', status: 'FREE', note: '' }); setShowModal(true) }}
                    style={{ padding: '8px 14px', borderRadius: 8, background: '#f59e0b', color: '#111', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Plus size={13} /> Thêm bàn
                </button>
            </div>

            {/* Table grid */}
            {loading && tables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7080' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #2a2a3e', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                    Đang tải...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7080', background: '#0f1117', borderRadius: 10, border: '1px dashed #2a2a3e' }}>
                    <Coffee size={40} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
                    {tables.length === 0 ? 'Chưa có bàn nào — bấm Thêm bàn để bắt đầu' : 'Không tìm thấy bàn phù hợp'}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                    {filtered.map(table => {
                        const cfg = STATUS_CFG[table.status] || STATUS_CFG.FREE
                        return (
                            <div key={table.id} style={{ background: '#0f1117', border: `1px solid #2a2a3e`, borderRadius: 12, padding: 14, transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#374151'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#6b7080', textTransform: 'uppercase', letterSpacing: 1 }}>Bàn</div>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#f0ede6', lineHeight: 1 }}>{table.number}</div>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Capacity */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7080', fontSize: 11, marginBottom: 4 }}>
                                    <Users size={11} /> {table.capacity} người
                                </div>
                                {table.note && <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{table.note}</div>}

                                {/* Quick status toggle */}
                                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                    {['FREE', 'OCCUPIED', 'RESERVED'].filter(s => s !== table.status).map(s => (
                                        <button key={s} onClick={() => handleStatusChange(table, s)} style={{
                                            flex: 1, fontSize: 9, padding: '4px 2px', borderRadius: 6, cursor: 'pointer', border: '1px solid #2a2a3e', background: 'transparent', color: '#6b7080', transition: 'all 0.15s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = STATUS_CFG[s].color; e.currentTarget.style.color = STATUS_CFG[s].color }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a3e'; e.currentTarget.style.color = '#6b7080' }}
                                            title={`Đổi sang ${STATUS_CFG[s]?.label}`}
                                        >{STATUS_CFG[s]?.label}</button>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #2a2a3e', paddingTop: 10 }}>
                                    <button onClick={() => openEdit(table)} style={{ flex: 1, background: 'rgba(59,130,246,0.12)', border: 'none', borderRadius: 7, color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <Edit2 size={11} /> Sửa
                                    </button>
                                    <button onClick={() => handleDelete(table)} disabled={table.status === 'OCCUPIED'} style={{ flex: 1, background: table.status === 'OCCUPIED' ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.12)', border: 'none', borderRadius: 7, color: table.status === 'OCCUPIED' ? '#374151' : '#ef4444', fontSize: 11, fontWeight: 600, cursor: table.status === 'OCCUPIED' ? 'not-allowed' : 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <Trash2 size={11} /> Xóa
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}
                    onClick={closeModal}>
                    <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24 }}
                        onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#f0ede6' }}>
                                {editing ? `✏️ Sửa Bàn ${editing.number}` : '➕ Thêm bàn mới'}
                            </h3>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#6b7080', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={S.label}>Số bàn *</label>
                                    <input type="number" value={formData.number} onChange={e => setFormData(f => ({ ...f, number: e.target.value }))}
                                        required min={1} placeholder="VD: 1" style={S.input} />
                                </div>
                                <div>
                                    <label style={S.label}>Sức chứa *</label>
                                    <input type="number" value={formData.capacity} onChange={e => setFormData(f => ({ ...f, capacity: e.target.value }))}
                                        required min={1} placeholder="VD: 4" style={S.input} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={S.label}>Trạng thái</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {Object.entries(STATUS_CFG).map(([v, cfg]) => (
                                        <button key={v} type="button" onClick={() => setFormData(f => ({ ...f, status: v }))} style={{
                                            flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
                                            background: formData.status === v ? cfg.bg : '#0f1117',
                                            color: formData.status === v ? cfg.color : '#6b7080',
                                            border: `2px solid ${formData.status === v ? cfg.color : '#2a2a3e'}`,
                                        }}>{cfg.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={S.label}>Ghi chú</label>
                                <input value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))}
                                    placeholder="VD: Tầng 1 - cạnh cửa sổ" style={S.input} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={closeModal} style={{ flex: 1, background: '#0f1117', border: '1px solid #2a2a3e', borderRadius: 8, padding: '10px', color: '#6b7080', cursor: 'pointer', fontSize: 13 }}>Hủy</button>
                                <button type="submit" disabled={loading} style={{ flex: 2, background: '#f59e0b', color: '#111', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {loading ? <><div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Đang lưu...</> : editing ? 'Cập nhật' : 'Thêm bàn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────
const TABS = [
    { id: 'profile', label: 'Hồ sơ', icon: User, color: '#f59e0b' },
    { id: 'pos', label: 'Cài đặt POS', icon: Monitor, color: '#3b82f6' },
    { id: 'appearance', label: 'Giao diện', icon: Palette, color: '#8b5cf6' },
    { id: 'tables', label: 'Quản lý bàn', icon: LayoutGrid, color: '#10b981' },
]

export default function StaffSettings({ onClose }) {
    const navigate = useNavigate()
    const { setDarkMode: setGlobalDarkMode, setThemeColor: setGlobalThemeColor } = useAppContext() || {}

    const staffUser = (() => {
        try { return JSON.parse(localStorage.getItem('staff_user') || localStorage.getItem('user') || '{}') }
        catch { return {} }
    })()
    const staffId = staffUser?.id

    const [activeTab, setActiveTab] = useState('profile')
    const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' })
    const [pos, setPos] = useState({
        defaultLayout: 'grid', autoPrintReceipt: false, soundOnOrder: true,
        itemsPerPage: 12, defaultPaymentMethod: 'CASH', showTableMap: true, tablesPerRow: 4
    })
    const [appear, setAppear] = useState({ themeColor: '#D97706', darkMode: false, fontSize: 'medium', language: 'vi' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

    const loadSettings = useCallback(async () => {
        setLoading(true)
        try {
            const [settingsRes, userRes] = await Promise.allSettled([
                staffId ? http.get(`/settings/staff/${staffId}`) : Promise.resolve({ data: { data: {} } }),
                staffId ? http.get(`/users/${staffId}`) : Promise.resolve({ data: null }),
            ])
            const rawSettings = settingsRes.status === 'fulfilled' ? (settingsRes.value.data?.data || {}) : {}
            const user = userRes.status === 'fulfilled' ? userRes.value.data : null
            if (user?.userDetails) {
                setProfile({ firstName: user.userDetails.firstName || '', lastName: user.userDetails.lastName || '', email: user.userDetails.email || '', phoneNumber: user.userDetails.phoneNumber || '' })
            }
            setPos(p => ({ ...p, ...rawSettings }))
            setAppear(p => ({ ...p, ...rawSettings }))
        } catch (e) { showToast('Lỗi tải cài đặt: ' + e.message, 'error') }
        finally { setLoading(false) }
    }, [staffId])

    useEffect(() => { loadSettings() }, [loadSettings])

    const handleSave = async () => {
        setSaving(true)
        try {
            const allSettings = { ...pos, ...appear }
            if (staffId) await http.put(`/settings/staff/${staffId}`, { settings: allSettings })
            if (setGlobalThemeColor) setGlobalThemeColor(appear.themeColor)
            if (setGlobalDarkMode) setGlobalDarkMode(appear.darkMode)
            showToast('✅ Đã lưu cài đặt thành công')
        } catch (e) { showToast('❌ Lỗi: ' + (e.response?.data?.message || e.message), 'error') }
        finally { setSaving(false) }
    }

    const handleReset = async () => {
        if (!window.confirm('Đặt lại tất cả cài đặt về mặc định?')) return
        try {
            if (staffId) {
                await http.delete(`/settings/staff/${staffId}/reset`)
                await http.post(`/settings/staff/${staffId}/init`)
                await loadSettings()
            }
            showToast('Đã đặt lại cài đặt mặc định')
        } catch { showToast('Lỗi reset', 'error') }
    }

    const isTableTab = activeTab === 'tables'

    if (loading) return (
        <div style={{ ...S.page, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #2a2a3e', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            <p style={{ color: '#6b7080', fontSize: 13 }}>Đang tải cài đặt...</p>
        </div>
    )

    return (
        <div style={S.page}>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={S.header}>
                <button onClick={onClose || (() => navigate('/staff'))}
                    style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#f0ede6' }}>Cài Đặt Nhân Viên</div>
                    <div style={{ fontSize: 11, color: '#6b7080' }}>{staffUser?.userName || 'Staff'} · ID: {staffId || '—'}</div>
                </div>
                {/* Chỉ hiện nút Lưu khi không ở tab bàn */}
                {!isTableTab && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleReset}
                            style={{ background: 'none', border: '1px solid #2a2a3e', borderRadius: 7, padding: '7px 14px', color: '#6b7080', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <RefreshCw size={12} /> Reset
                        </button>
                        <button onClick={handleSave} disabled={saving} style={S.saveBtn}>
                            {saving ? <div style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={13} />}
                            {saving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                )}
            </div>

            <div style={S.wrap}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, background: '#1a1a2e', borderRadius: 10, padding: 4, marginBottom: 20, overflowX: 'auto' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            style={{ flex: 1, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: activeTab === t.id ? '#0f1117' : 'transparent', color: activeTab === t.id ? t.color : '#6b7080', fontSize: 11, fontWeight: activeTab === t.id ? 700 : 500, transition: 'all .2s', whiteSpace: 'nowrap' }}>
                            <t.icon size={12} />{t.label}
                        </button>
                    ))}
                </div>

                {/* HỒ SƠ */}
                {activeTab === 'profile' && (
                    <div style={S.section}>
                        <SectionHeader icon={User} title="Thông tin cá nhân" />
                        <div style={S.sectionBody}>
                            <div style={S.row}>
                                <div><label style={S.label}>Họ</label><input style={S.input} value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="Nguyễn" /></div>
                                <div><label style={S.label}>Tên</label><input style={S.input} value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Văn A" /></div>
                            </div>
                            <div style={S.row}>
                                <div><label style={S.label}>Email</label><input style={S.input} type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="nhanvien@coffeeblend.vn" /></div>
                                <div><label style={S.label}>Số điện thoại</label><input style={S.input} value={profile.phoneNumber} onChange={e => setProfile(p => ({ ...p, phoneNumber: e.target.value }))} placeholder="0900000000" /></div>
                            </div>
                            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.07)', borderRadius: 8, fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Info size={13} color="#f59e0b" />
                                Tên đăng nhập: <strong style={{ color: '#f0ede6' }}>{staffUser?.userName || '—'}</strong>
                                &nbsp;·&nbsp; ID: <strong style={{ color: '#f0ede6' }}>{staffId || '—'}</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* CÀI ĐẶT POS */}
                {activeTab === 'pos' && (<>
                    <div style={S.section}>
                        <SectionHeader icon={Monitor} title="Giao diện POS" color="#3b82f6" />
                        <div style={S.sectionBody}>
                            <div style={S.row}>
                                <div>
                                    <label style={S.label}>Kiểu hiển thị sản phẩm</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[['grid', Grid3X3, 'Lưới'], ['list', List, 'Danh sách']].map(([val, Icon, lbl]) => (
                                            <button key={val} onClick={() => setPos(p => ({ ...p, defaultLayout: val }))}
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, border: `2px solid ${pos.defaultLayout === val ? '#f59e0b' : '#2a2a3e'}`, background: pos.defaultLayout === val ? 'rgba(245,158,11,0.1)' : '#0f1117', color: pos.defaultLayout === val ? '#f59e0b' : '#6b7080', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                                <Icon size={14} />{lbl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label style={S.label}>Sản phẩm mỗi trang</label>
                                    <select style={S.select} value={pos.itemsPerPage} onChange={e => setPos(p => ({ ...p, itemsPerPage: +e.target.value }))}>
                                        <option value={8}>8 sản phẩm</option>
                                        <option value={12}>12 sản phẩm</option>
                                        <option value={16}>16 sản phẩm</option>
                                        <option value={24}>24 sản phẩm</option>
                                    </select>
                                </div>
                            </div>
                            <div style={S.fullRow}>
                                <label style={S.label}>Phương thức thanh toán mặc định</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[['CASH', 'Tiền mặt', '#f59e0b'], ['MOMO', 'MoMo', '#ec4899'], ['VNPAY', 'VNPay', '#3b82f6']].map(([val, lbl, c]) => (
                                        <button key={val} onClick={() => setPos(p => ({ ...p, defaultPaymentMethod: val }))}
                                            style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${pos.defaultPaymentMethod === val ? c : '#2a2a3e'}`, background: pos.defaultPaymentMethod === val ? `${c}18` : '#0f1117', color: pos.defaultPaymentMethod === val ? c : '#6b7080', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={S.row}>
                                <div>
                                    <label style={S.label}>Số bàn mỗi hàng</label>
                                    <select style={S.select} value={pos.tablesPerRow} onChange={e => setPos(p => ({ ...p, tablesPerRow: +e.target.value }))}>
                                        {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} bàn</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={S.section}>
                        <SectionHeader icon={Printer} title="In & âm thanh" color="#10b981" />
                        <div style={S.sectionBody}>
                            {[
                                { key: 'autoPrintReceipt', label: 'Tự động in hoá đơn', sub: 'In bill ngay khi thanh toán xong' },
                                { key: 'soundOnOrder', label: 'Âm thanh khi có đơn', sub: 'Phát tiếng khi đơn hàng mới được thêm' },
                                { key: 'showTableMap', label: 'Hiển thị sơ đồ bàn', sub: 'Cho phép chọn bàn khi tạo đơn' },
                            ].map(item => (
                                <div key={item.key} style={S.toggle}>
                                    <div>
                                        <div style={{ fontSize: 13, color: '#e5e7eb' }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: '#6b7080', marginTop: 2 }}>{item.sub}</div>
                                    </div>
                                    <Toggle value={!!pos[item.key]} onChange={v => setPos(p => ({ ...p, [item.key]: v }))} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>)}

                {/* GIAO DIỆN */}
                {activeTab === 'appearance' && (
                    <div style={S.section}>
                        <SectionHeader icon={Palette} title="Giao diện" color="#8b5cf6" />
                        <div style={S.sectionBody}>
                            <div style={S.fullRow}>
                                <label style={S.label}>Màu chủ đề</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="color" value={appear.themeColor || '#D97706'} onChange={e => setAppear(p => ({ ...p, themeColor: e.target.value }))}
                                        style={{ width: 42, height: 36, padding: 2, background: '#0f1117', border: '1px solid #2a2a3e', borderRadius: 6, cursor: 'pointer' }} />
                                    <input style={{ ...S.input, flex: 1 }} value={appear.themeColor || '#D97706'} onChange={e => setAppear(p => ({ ...p, themeColor: e.target.value }))} maxLength={7} />
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                                    {['#D97706', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                                        <div key={c} onClick={() => setAppear(p => ({ ...p, themeColor: c }))}
                                            style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: appear.themeColor === c ? '3px solid #fff' : '2px solid transparent', boxSizing: 'border-box' }} />
                                    ))}
                                </div>
                            </div>
                            <div style={S.row}>
                                <div>
                                    <label style={S.label}>Ngôn ngữ</label>
                                    <select style={S.select} value={appear.language || 'vi'} onChange={e => setAppear(p => ({ ...p, language: e.target.value }))}>
                                        <option value="vi">🇻🇳 Tiếng Việt</option>
                                        <option value="en">🇺🇸 English</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>Cỡ chữ</label>
                                    <select style={S.select} value={appear.fontSize || 'medium'} onChange={e => setAppear(p => ({ ...p, fontSize: e.target.value }))}>
                                        <option value="small">Nhỏ</option>
                                        <option value="medium">Vừa</option>
                                        <option value="large">Lớn</option>
                                    </select>
                                </div>
                            </div>
                            <div style={S.toggle}>
                                <div>
                                    <div style={{ fontSize: 13, color: '#e5e7eb' }}>Chế độ tối</div>
                                    <div style={{ fontSize: 11, color: '#6b7080' }}>Giao diện tối để giảm mỏi mắt</div>
                                </div>
                                <Toggle value={!!appear.darkMode} onChange={v => setAppear(p => ({ ...p, darkMode: v }))} />
                            </div>
                        </div>
                    </div>
                )}

                {/* QUẢN LÝ BÀN */}
                {activeTab === 'tables' && (
                    <div style={S.section}>
                        <SectionHeader icon={LayoutGrid} title="Quản lý bàn" color="#10b981" />
                        <div style={S.sectionBody}>
                            <TableManagement />
                        </div>
                    </div>
                )}
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}