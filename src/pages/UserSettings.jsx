// src/pages/UserSettings.jsx — Cài đặt tài khoản người dùng
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import http from '../services/api'
import {
    User, MapPin, Bell, Shield, LogOut, ChevronLeft,
    Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, X, Palette, Sun, Moon
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
    const ok = type !== 'error'
    return (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: '#111', border: `1px solid ${ok ? '#10b981' : '#ef4444'}`, borderLeft: `4px solid ${ok ? '#10b981' : '#ef4444'}`, borderRadius: 12, padding: '13px 18px', color: '#f0ede6', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.7)', animation: 'slideUp 0.25s ease' }}>
            {ok ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 0 }}><X size={14} /></button>
        </div>
    )
}

function Field({ label, value, onChange, placeholder, type = 'text', disabled, readOnly }) {
    const [focused, setFocused] = useState(false)
    const [showPw, setShowPw] = useState(false)
    const isPwd = type === 'password'
    return (
        <div style={{ marginBottom: 14 }}>
            {label && <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</label>}
            <div style={{ position: 'relative' }}>
                <input
                    type={isPwd && showPw ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        background: readOnly ? 'var(--input-bg-ro)' : 'var(--input-bg)',
                        border: `1px solid ${focused && !readOnly ? '#d4a853' : 'var(--border-color)'}`,
                        borderRadius: 10, padding: '10px 14px',
                        paddingRight: isPwd ? 42 : 14,
                        color: readOnly ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 14, outline: 'none',
                        fontFamily: "'DM Sans',system-ui",
                        boxShadow: focused && !readOnly ? '0 0 0 3px rgba(212,168,83,0.07)' : 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        cursor: readOnly ? 'default' : 'text',
                    }}
                />
                {isPwd && (
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, fontSize: 15 }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
        </div>
    )
}

function Toggle({ label, desc, value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{label}</div>
                {desc && <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>{desc}</div>}
            </div>
            <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: value ? '#d4a853' : 'var(--bg-elevated)', border: `1px solid ${value ? '#d4a853' : 'var(--border-color)'}`, position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
        </div>
    )
}

// ─── Tabs config ──────────────────────────────────────────────────
const TABS = [
    { id: 'profile', label: 'Hồ sơ', icon: User, color: '#d4a853' },
    { id: 'address', label: 'Địa chỉ', icon: MapPin, color: '#10b981' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, color: '#3b82f6' },
    { id: 'security', label: 'Bảo mật', icon: Shield, color: '#ef4444' },
    { id: 'appearance', label: 'Giao diện', icon: Palette, color: '#a855f7' },
]

export default function UserSettings() {
    const navigate = useNavigate()
    const { customerUser, logout, darkMode, setDarkMode } = useApp()
    const userId = customerUser?.id

    const [activeTab, setActiveTab] = useState('profile')
    const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' })
    const [address, setAddress] = useState({ street: '', streetNumber: '', zipCode: '', locality: '', country: 'Việt Nam' })
    const [notifications, setNotifications] = useState({ emailNotifications: true, orderNotifications: true, paymentAlerts: true, deliveryAlerts: true, promotionNotifications: false, newsletterSubscribed: false })
    const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3500)
    }

    // Load user settings
    const loadSettings = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        try {
            // Load profile from context or API
            if (customerUser?.userDetails) {
                const d = customerUser.userDetails
                setProfile({ firstName: d.firstName || '', lastName: d.lastName || '', email: d.email || '', phoneNumber: d.phoneNumber || '' })
            }
            // Load settings from API
            try {
                const res = await http.get(`/settings/user/${userId}`)
                const cfg = res.data?.data || res.data?.settings || res.data || {}
                if (cfg.address) setAddress(prev => ({ ...prev, ...cfg.address }))
                if (cfg.notifications) setNotifications(prev => ({ ...prev, ...cfg.notifications }))
            } catch (e) {
                // settings may not exist yet, init
                await http.post(`/settings/user/${userId}/init`).catch(() => { })
            }
        } catch (e) {
            console.error(e)
        } finally { setLoading(false) }
    }, [userId, customerUser])

    useEffect(() => { loadSettings() }, [loadSettings])

    // Save profile
    const saveProfile = async () => {
        if (!userId) return
        setSaving(true)
        try {
            await http.put(`/users/${userId}`, {
                ...customerUser,
                userDetails: { ...customerUser?.userDetails, ...profile },
            })
            showToast('Cập nhật hồ sơ thành công!')
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể lưu hồ sơ', 'error')
        } finally { setSaving(false) }
    }

    // Save address
    const saveAddress = async () => {
        if (!userId) return
        setSaving(true)
        try {
            await http.put(`/settings/user/${userId}`, { settings: { address } })
            showToast('Cập nhật địa chỉ thành công!')
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể lưu địa chỉ', 'error')
        } finally { setSaving(false) }
    }

    // Save notifications
    const saveNotifications = async () => {
        if (!userId) return
        setSaving(true)
        try {
            await http.put(`/settings/user/${userId}`, { settings: { notifications } })
            showToast('Cập nhật cài đặt thông báo thành công!')
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể lưu cài đặt', 'error')
        } finally { setSaving(false) }
    }

    // Change password
    const changePassword = async () => {
        if (!pwForm.newPassword || pwForm.newPassword.length < 4) { showToast('Mật khẩu ít nhất 4 ký tự', 'error'); return }
        if (pwForm.newPassword !== pwForm.confirmPassword) { showToast('Mật khẩu không khớp', 'error'); return }
        setSaving(true)
        try {
            await http.put(`/users/${userId}`, { ...customerUser, userPassword: pwForm.newPassword })
            showToast('Đổi mật khẩu thành công!')
            setPwForm({ newPassword: '', confirmPassword: '' })
        } catch (e) {
            showToast(e.response?.data?.message || 'Không thể đổi mật khẩu', 'error')
        } finally { setSaving(false) }
    }

    const handleLogout = () => {
        if (window.confirm('Đăng xuất khỏi tài khoản?')) {
            logout('ROLE_USER')
            navigate('/')
        }
    }

    if (!customerUser) { navigate('/auth'); return null }

    const displayName = `${customerUser.userDetails?.firstName || ''} ${customerUser.userDetails?.lastName || ''}`.trim() || customerUser.userName

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'DM Sans',system-ui,sans-serif", transition: 'background 0.25s ease, color 0.25s ease' }}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideUp { from { opacity:0;transform:translateY(10px) } to { opacity:1;transform:translateY(0) } }
        * { box-sizing: border-box }
        .tab-btn:hover { background: rgba(255,255,255,0.04) !important; }
        .save-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

            {/* Header */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '13px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: 0 }}>
                        <ChevronLeft size={16} /> Về trang chủ
                    </button>
                    <h1 style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>Cài đặt tài khoản</h1>
                    <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '7px 14px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                        <LogOut size={13} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px', display: 'flex', gap: 24 }}>
                {/* Sidebar */}
                <div style={{ width: 220, flexShrink: 0 }}>
                    {/* User card */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px', marginBottom: 12, textAlign: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#d4a853,#8b6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24, fontWeight: 800 }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>@{customerUser.userName}</div>
                        <div style={{ marginTop: 10, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 20, display: 'inline-block' }}>
                            <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>✓ Khách hàng</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                        {TABS.map((tab, i) => {
                            const Icon = tab.icon
                            const active = activeTab === tab.id
                            return (
                                <button key={tab.id} className="tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 16px', background: active ? `${tab.color}10` : 'transparent',
                                    border: 'none', borderLeft: `3px solid ${active ? tab.color : 'transparent'}`,
                                    borderBottom: i < TABS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                                }}>
                                    <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? `${tab.color}15` : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={14} color={active ? tab.color : '#555'} />
                                    </div>
                                    <span style={{ color: active ? tab.color : 'var(--text-secondary)', fontSize: 13, fontWeight: active ? 700 : 500 }}>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                            <Loader2 size={28} color="#d4a853" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : (
                        <>
                            {/* Profile tab */}
                            {activeTab === 'profile' && (
                                <div style={panelStyle}>
                                    <PanelHeader icon={User} color="#d4a853" title="Thông tin cá nhân" desc="Cập nhật thông tin hiển thị của tài khoản bạn" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        <Field label="Họ" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} placeholder="Nguyễn" />
                                        <Field label="Tên" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} placeholder="Văn A" />
                                    </div>
                                    <Field label="Tên đăng nhập" value={customerUser.userName} readOnly />
                                    <Field label="Email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="email@example.com" />
                                    <Field label="Số điện thoại" type="tel" value={profile.phoneNumber} onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })} placeholder="0912 345 678" />
                                    <SaveBtn onClick={saveProfile} loading={saving} />
                                </div>
                            )}

                            {/* Address tab */}
                            {activeTab === 'address' && (
                                <div style={panelStyle}>
                                    <PanelHeader icon={MapPin} color="#10b981" title="Địa chỉ giao hàng" desc="Địa chỉ mặc định để giao hàng và hóa đơn" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                                        <Field label="Tên đường" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="Lê Lợi" />
                                        <Field label="Số nhà" value={address.streetNumber} onChange={e => setAddress({ ...address, streetNumber: e.target.value })} placeholder="123A" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                        <Field label="Phường/Xã" value={address.locality} onChange={e => setAddress({ ...address, locality: e.target.value })} placeholder="Phường Bến Nghé" />
                                        <Field label="Mã bưu chính" value={address.zipCode} onChange={e => setAddress({ ...address, zipCode: e.target.value })} placeholder="700000" />
                                    </div>
                                    <Field label="Quốc gia" value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} placeholder="Việt Nam" />
                                    <SaveBtn onClick={saveAddress} loading={saving} />
                                </div>
                            )}

                            {/* Notifications tab */}
                            {activeTab === 'notifications' && (
                                <div style={panelStyle}>
                                    <PanelHeader icon={Bell} color="#3b82f6" title="Cài đặt thông báo" desc="Quản lý các loại thông báo bạn muốn nhận" />
                                    <div>
                                        <div style={{ color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Đơn hàng</div>
                                        <Toggle label="Thông báo đơn hàng" desc="Nhận thông báo khi trạng thái đơn thay đổi" value={notifications.orderNotifications} onChange={v => setNotifications({ ...notifications, orderNotifications: v })} />
                                        <Toggle label="Thông báo thanh toán" desc="Xác nhận và cảnh báo thanh toán" value={notifications.paymentAlerts} onChange={v => setNotifications({ ...notifications, paymentAlerts: v })} />
                                        <Toggle label="Thông báo giao hàng" desc="Cập nhật tình trạng giao hàng" value={notifications.deliveryAlerts} onChange={v => setNotifications({ ...notifications, deliveryAlerts: v })} />
                                    </div>
                                    <div style={{ marginTop: 20 }}>
                                        <div style={{ color: '#555', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Marketing</div>
                                        <Toggle label="Email thông báo" desc="Nhận thông báo quan trọng qua email" value={notifications.emailNotifications} onChange={v => setNotifications({ ...notifications, emailNotifications: v })} />
                                        <Toggle label="Khuyến mãi & ưu đãi" desc="Nhận thông tin về giảm giá và ưu đãi đặc biệt" value={notifications.promotionNotifications} onChange={v => setNotifications({ ...notifications, promotionNotifications: v })} />
                                        <Toggle label="Bản tin Coffee Blend" desc="Tin tức và cập nhật hàng tuần" value={notifications.newsletterSubscribed} onChange={v => setNotifications({ ...notifications, newsletterSubscribed: v })} />
                                    </div>
                                    <SaveBtn onClick={saveNotifications} loading={saving} />
                                </div>
                            )}

                            {/* Security tab */}
                            {activeTab === 'security' && (
                                <div style={panelStyle}>
                                    <PanelHeader icon={Shield} color="#ef4444" title="Bảo mật tài khoản" desc="Đổi mật khẩu và cài đặt bảo mật" />
                                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <Shield size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div>
                                            <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Bảo mật mật khẩu</div>
                                            <div style={{ color: '#888', fontSize: 13, lineHeight: 1.5 }}>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.</div>
                                        </div>
                                    </div>
                                    <Field label="Mật khẩu mới" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Ít nhất 4 ký tự" />
                                    <Field label="Xác nhận mật khẩu mới" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Nhập lại mật khẩu" />
                                    <button
                                        onClick={changePassword}
                                        disabled={saving || !pwForm.newPassword}
                                        className="save-btn"
                                        style={{ marginTop: 8, padding: '11px 20px', borderRadius: 10, border: 'none', background: saving || !pwForm.newPassword ? '#1a1a1a' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: saving || !pwForm.newPassword ? '#333' : '#fff', fontWeight: 700, fontSize: 14, cursor: saving || !pwForm.newPassword ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                                    >
                                        {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Shield size={15} /> Đổi mật khẩu</>}
                                    </button>

                                    <div style={{ marginTop: 32, borderTop: '1px solid #1e1e1e', paddingTop: 24 }}>
                                        <div style={{ color: '#888', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Đăng xuất khỏi tất cả thiết bị</div>
                                        <p style={{ color: '#555', fontSize: 13, marginBottom: 14, margin: '0 0 14px' }}>Đăng xuất toàn bộ phiên đăng nhập hiện tại trên tất cả thiết bị.</p>
                                        <button onClick={handleLogout} style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <LogOut size={14} /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                            {/* Appearance tab */}
                            {activeTab === 'appearance' && (
                                <div style={{ ...panelStyle, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                                    <PanelHeader icon={Palette} color="#a855f7" title="Giao diện" desc="Tùy chỉnh chế độ hiển thị cho toàn bộ ứng dụng" />

                                    {/* Theme switcher */}
                                    <div style={{ marginBottom: 28 }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Chế độ màu</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            {/* Light mode card */}
                                            <button
                                                onClick={() => setDarkMode(false)}
                                                style={{
                                                    border: `2px solid ${!darkMode ? '#a855f7' : 'var(--border-color)'}`,
                                                    borderRadius: 14, padding: 16, cursor: 'pointer',
                                                    background: !darkMode ? 'rgba(168,85,247,0.07)' : 'var(--bg-elevated)',
                                                    transition: 'all 0.2s', textAlign: 'left',
                                                    boxShadow: !darkMode ? '0 0 0 3px rgba(168,85,247,0.12)' : 'none',
                                                }}
                                            >
                                                {/* Preview */}
                                                <div style={{ background: '#f5f4f0', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #e5e3de' }}>
                                                    <div style={{ height: 8, background: '#1a1814', borderRadius: 4, marginBottom: 6, width: '60%' }} />
                                                    <div style={{ height: 6, background: '#a09e98', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                                                    <div style={{ height: 6, background: '#cccac5', borderRadius: 3, width: '50%' }} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Sun size={16} color={!darkMode ? '#a855f7' : 'var(--text-muted)'} />
                                                    <div>
                                                        <div style={{ color: !darkMode ? '#a855f7' : 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>Sáng</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Nền trắng</div>
                                                    </div>
                                                    {!darkMode && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={12} color="#fff" /></div>}
                                                </div>
                                            </button>

                                            {/* Dark mode card */}
                                            <button
                                                onClick={() => setDarkMode(true)}
                                                style={{
                                                    border: `2px solid ${darkMode ? '#a855f7' : 'var(--border-color)'}`,
                                                    borderRadius: 14, padding: 16, cursor: 'pointer',
                                                    background: darkMode ? 'rgba(168,85,247,0.07)' : 'var(--bg-elevated)',
                                                    transition: 'all 0.2s', textAlign: 'left',
                                                    boxShadow: darkMode ? '0 0 0 3px rgba(168,85,247,0.12)' : 'none',
                                                }}
                                            >
                                                {/* Preview */}
                                                <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '10px 12px', marginBottom: 12, border: '1px solid #1e1e1e' }}>
                                                    <div style={{ height: 8, background: '#f0ede6', borderRadius: 4, marginBottom: 6, width: '60%' }} />
                                                    <div style={{ height: 6, background: '#555', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                                                    <div style={{ height: 6, background: '#333', borderRadius: 3, width: '50%' }} />
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Moon size={16} color={darkMode ? '#a855f7' : 'var(--text-muted)'} />
                                                    <div>
                                                        <div style={{ color: darkMode ? '#a855f7' : 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>Tối</div>
                                                        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Nền đen</div>
                                                    </div>
                                                    {darkMode && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={12} color="#fff" /></div>}
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Current status */}
                                    <div style={{ background: darkMode ? 'rgba(168,85,247,0.07)' : 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {darkMode ? <Moon size={18} color="#a855f7" /> : <Sun size={18} color="#a855f7" />}
                                        <div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>
                                                Đang dùng chế độ {darkMode ? 'tối' : 'sáng'}
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                                Cài đặt được lưu tự động và áp dụng cho toàn bộ ứng dụng
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}

// ─── Reusable panel parts ─────────────────────────────────────────
function PanelHeader({ icon: Icon, color, title, desc }) {
    return (
        <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, margin: 0, letterSpacing: '-0.01em' }}>{title}</h2>
            </div>
            {desc && <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 0 48px' }}>{desc}</p>}
        </div>
    )
}

function SaveBtn({ onClick, loading }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="save-btn"
            style={{ marginTop: 20, padding: '11px 22px', borderRadius: 10, border: 'none', background: loading ? '#1a1a1a' : 'linear-gradient(135deg,#d4a853,#c49530)', color: loading ? '#333' : '#0a0a0a', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 16px rgba(212,168,83,0.2)' }}
        >
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Save size={15} /> Lưu thay đổi</>}
        </button>
    )
}

const panelStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: 18,
    padding: '24px 26px',
}