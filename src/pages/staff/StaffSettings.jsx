// src/pages/staff/StaffSettings.jsx
// Đúng với setting-service BE: GET/PUT /settings/staff/{staffId}
// DELETE /settings/staff/{staffId}/reset, POST /settings/staff/{staffId}/init

import React, { useState, useEffect, useCallback } from 'react'
import {
    Save, Palette, AlertCircle, CheckCircle2,
    User, Monitor, Printer, Grid3X3, List,
    X, Info, RefreshCw, ChevronLeft
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

const TABS = [
    { id: 'profile', label: 'Hồ sơ', icon: User, color: '#f59e0b' },
    { id: 'pos', label: 'Cài đặt POS', icon: Monitor, color: '#3b82f6' },
    { id: 'appearance', label: 'Giao diện', icon: Palette, color: '#8b5cf6' },
]

export default function StaffSettings({ onClose }) {
    const navigate = useNavigate()
    const { setDarkMode: setGlobalDarkMode, setThemeColor: setGlobalThemeColor } = useAppContext() || {}

    // Đọc staff user từ localStorage (đúng key 'staff_user')
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
    const [appear, setAppear] = useState({
        themeColor: '#D97706', darkMode: false, fontSize: 'medium', language: 'vi'
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    const loadSettings = useCallback(async () => {
        setLoading(true)
        try {
            const [settingsRes, userRes] = await Promise.allSettled([
                staffId ? http.get(`/settings/staff/${staffId}`) : Promise.resolve({ data: { data: {} } }),
                staffId ? http.get(`/users/${staffId}`) : Promise.resolve({ data: null }),
            ])

            // Parse settings từ BE
            const rawSettings = settingsRes.status === 'fulfilled'
                ? (settingsRes.value.data?.data || {})
                : {}

            // Parse user
            const user = userRes.status === 'fulfilled' ? userRes.value.data : null

            if (user?.userDetails) {
                setProfile({
                    firstName: user.userDetails.firstName || '',
                    lastName: user.userDetails.lastName || '',
                    email: user.userDetails.email || '',
                    phoneNumber: user.userDetails.phoneNumber || '',
                })
            }

            // Áp settings vào từng state
            setPos(p => ({ ...p, ...rawSettings }))
            setAppear(p => ({ ...p, ...rawSettings }))
        } catch (e) {
            showToast('Lỗi tải cài đặt: ' + e.message, 'error')
        } finally { setLoading(false) }
    }, [staffId])

    useEffect(() => { loadSettings() }, [loadSettings])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Gộp tất cả settings lại thành 1 object
            const allSettings = { ...pos, ...appear }

            if (staffId) {
                // PUT /settings/staff/{staffId}  body: { settings: {...} }
                await http.put(`/settings/staff/${staffId}`, { settings: allSettings })
            }

            // Lưu theme vào localStorage và áp dụng toàn app qua context
            if (setGlobalThemeColor) setGlobalThemeColor(appear.themeColor)
            if (setGlobalDarkMode) setGlobalDarkMode(appear.darkMode)

            showToast('✅ Đã lưu cài đặt thành công')
        } catch (e) {
            showToast('❌ Lỗi: ' + (e.response?.data?.message || e.message), 'error')
        } finally { setSaving(false) }
    }


    const handleReset = async () => {
        if (!window.confirm('Đặt lại tất cả cài đặt về mặc định?')) return
        try {
            if (staffId) {
                // DELETE /settings/staff/{staffId}/reset → xóa toàn bộ setting riêng
                await http.delete(`/settings/staff/${staffId}/reset`)
                // POST /settings/staff/{staffId}/init → tạo lại default
                await http.post(`/settings/staff/${staffId}/init`)
                await loadSettings()
            }
            showToast('Đã đặt lại cài đặt mặc định')
        } catch { showToast('Lỗi reset', 'error') }
    }

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

            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}