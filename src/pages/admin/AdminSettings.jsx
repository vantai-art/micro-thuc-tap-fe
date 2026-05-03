// src/pages/admin/AdminSettings.jsx
// Tích hợp hoàn toàn với Setting Service qua API Gateway (port 8080)

import React, { useState, useEffect, useCallback } from 'react'
import {
    Save, Globe, Bell, Palette, Package, Loader2, AlertCircle,
    CheckCircle2, RefreshCw, Store, Clock, Truck, Shield, X,
    CreditCard, Smartphone, Mail, MapPin, Phone, Globe2,
    Moon, Sun, Volume2, Database, Key, Fingerprint, Download, Upload
} from 'lucide-react'
import { useAppContext } from '../../contexts/AppContext'

// ─── Sub-components ────────────────────────────────────────────────
const Input = ({ label, type = 'text', value, onChange, placeholder, icon: Icon }) => (
    <div>
        <label style={labelStyle}>
            {Icon && <Icon size={12} style={{ marginRight: 4, display: 'inline' }} />}
            {label}
        </label>
        <input
            type={type}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
        />
    </div>
)

const Textarea = ({ label, value, onChange, rows = 2, icon: Icon }) => (
    <div>
        <label style={labelStyle}>
            {Icon && <Icon size={12} style={{ marginRight: 4, display: 'inline' }} />}
            {label}
        </label>
        <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...inputStyle, resize: 'vertical' }} />
    </div>
)

const Select = ({ label, value, onChange, options, icon: Icon }) => (
    <div>
        <label style={labelStyle}>
            {Icon && <Icon size={12} style={{ marginRight: 4, display: 'inline' }} />}
            {label}
        </label>
        <select value={value ?? ''} onChange={e => onChange(e.target.value)} style={selectStyle}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
)

const Toggle = ({ label, desc, checked, onChange, icon: Icon }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid rgba(55,65,81,0.5)'
    }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {Icon && <Icon size={16} style={{ marginTop: 2, color: '#6b7280' }} />}
            <div>
                <div style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 500 }}>{label}</div>
                {desc && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</div>}
            </div>
        </div>
        <button onClick={() => onChange(!checked)}
            style={{
                width: 46, height: 25, borderRadius: 13, border: 'none',
                cursor: 'pointer', background: checked ? '#f59e0b' : '#374151',
                position: 'relative', transition: 'background .2s', flexShrink: 0
            }}>
            <span style={{
                width: 19, height: 19, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: checked ? 24 : 3,
                transition: 'left .2s', display: 'block'
            }} />
        </button>
    </div>
)

const SectionCard = ({ icon, title, desc, children, onSave }) => (
    <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>{title}</div>
                    {desc && <div style={{ fontSize: 11, color: '#6b7280' }}>{desc}</div>}
                </div>
            </div>
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {children}
        </div>
    </div>
)

const Full = ({ children }) => <div style={{ gridColumn: '1 / -1' }}>{children}</div>

const inputStyle = {
    width: '100%', boxSizing: 'border-box', background: '#111827',
    color: '#f9fafb', border: '1px solid #374151', borderRadius: 8,
    padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
    transition: 'all 0.2s'
}
const selectStyle = { ...inputStyle, cursor: 'pointer' }
const labelStyle = {
    display: 'block', fontSize: 11, color: '#6b7280',
    marginBottom: 5, textTransform: 'uppercase',
    letterSpacing: '0.04em', fontWeight: 600
}

const THEME_COLORS = [
    { value: '#D97706', name: 'Cam' }, { value: '#DC2626', name: 'Đỏ' },
    { value: '#3B82F6', name: 'Xanh dương' }, { value: '#10B981', name: 'Xanh lá' },
    { value: '#8B5CF6', name: 'Tím' }, { value: '#EC4899', name: 'Hồng' },
]

export default function AdminSettings() {
    const { adminUser, axiosInstance, darkMode, themeColor, setDarkMode, setThemeColor } = useAppContext()
    const adminId = adminUser?.id

    const [activeTab, setActiveTab] = useState('store')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)

    // ── State cho từng nhóm cài đặt ───────────────────────────────
    const [store, setStore] = useState({
        storeName: '',
        storeEmail: '',
        storePhone: '',
        storeAddress: '',
        storeDescription: '',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        openTime: '07:00',
        closeTime: '22:00',
        taxRate: 10,
        freeShippingThreshold: 200000,
        shippingFee: 30000
    })

    const [notify, setNotify] = useState({
        emailNotifications: true,
        orderNotifications: true,
        promotionNotifications: false,
        lowStockAlerts: true,
        newOrderAlerts: true,
        paymentAlerts: true
    })

    const [appearance, setAppearance] = useState({
        themeColor: themeColor || '#D97706',
        darkMode: darkMode || false,
        fontSize: 'medium',
        language: 'vi'
    })

    const [security, setSecurity] = useState({
        twoFactorEnabled: false,
        sessionTimeoutMinutes: 60
    })

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    // ── Fetch settings từ BE ──────────────────────────────────────
    const fetchSettings = useCallback(async () => {
        setLoading(true)
        try {
            // Gọi API song song
            const [globalRes, adminRes] = await Promise.allSettled([
                axiosInstance.get('/api/settings/global'),
                adminId ? axiosInstance.get(`/api/settings/admin/${adminId}`) : Promise.resolve({ data: { data: {} } })
            ])

            let globalData = {}
            let adminData = {}

            if (globalRes.status === 'fulfilled' && globalRes.value.data?.success) {
                globalData = globalRes.value.data.data || {}
            }

            if (adminRes.status === 'fulfilled' && adminRes.value.data?.success) {
                adminData = adminRes.value.data.data || {}
            }

            // Merge: admin settings override global
            const merged = { ...globalData, ...adminData }

            // Cập nhật store settings
            setStore(prev => ({
                ...prev,
                storeName: merged.storeName || prev.storeName,
                storeEmail: merged.storeEmail || prev.storeEmail,
                storePhone: merged.storePhone || prev.storePhone,
                storeAddress: merged.storeAddress || prev.storeAddress,
                storeDescription: merged.storeDescription || prev.storeDescription,
                currency: merged.currency || prev.currency,
                timezone: merged.timezone || prev.timezone,
                language: merged.language || prev.language,
                openTime: merged.openTime || prev.openTime,
                closeTime: merged.closeTime || prev.closeTime,
                taxRate: merged.taxRate ?? prev.taxRate,
                freeShippingThreshold: merged.freeShippingThreshold ?? prev.freeShippingThreshold,
                shippingFee: merged.shippingFee ?? prev.shippingFee
            }))

            // Cập nhật notification settings
            setNotify(prev => ({
                ...prev,
                emailNotifications: merged.emailNotifications ?? prev.emailNotifications,
                orderNotifications: merged.orderNotifications ?? prev.orderNotifications,
                promotionNotifications: merged.promotionNotifications ?? prev.promotionNotifications,
                lowStockAlerts: merged.lowStockAlerts ?? prev.lowStockAlerts,
                newOrderAlerts: merged.newOrderAlerts ?? prev.newOrderAlerts,
                paymentAlerts: merged.paymentAlerts ?? prev.paymentAlerts
            }))

            // Cập nhật appearance settings
            setAppearance(prev => ({
                ...prev,
                themeColor: merged.themeColor || prev.themeColor,
                darkMode: merged.darkMode ?? prev.darkMode,
                fontSize: merged.fontSize || prev.fontSize,
                language: merged.language || prev.language
            }))

            // Cập nhật security settings
            setSecurity(prev => ({
                ...prev,
                twoFactorEnabled: merged.twoFactorEnabled ?? prev.twoFactorEnabled,
                sessionTimeoutMinutes: merged.sessionTimeoutMinutes ?? prev.sessionTimeoutMinutes
            }))

            // Apply theme via context (propagates to entire app)
            if (merged.themeColor) setThemeColor(merged.themeColor)
            if (merged.darkMode !== undefined) setDarkMode(!!merged.darkMode)

        } catch (e) {
            console.warn('Settings load error:', e)
            showToast('Lỗi tải cài đặt: ' + (e.response?.data?.message || e.message), 'error')
        } finally {
            setLoading(false)
        }
    }, [axiosInstance, adminId])

    useEffect(() => { fetchSettings() }, [fetchSettings])

    // ── Save settings to BE ───────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            // Prepare global settings (store + financial)
            const globalSettings = {
                storeName: store.storeName,
                storeEmail: store.storeEmail,
                storePhone: store.storePhone,
                storeAddress: store.storeAddress,
                storeDescription: store.storeDescription,
                currency: store.currency,
                timezone: store.timezone,
                language: store.language,
                openTime: store.openTime,
                closeTime: store.closeTime,
                taxRate: store.taxRate,
                freeShippingThreshold: store.freeShippingThreshold,
                shippingFee: store.shippingFee,
                // Appearance
                themeColor: appearance.themeColor,
                darkMode: appearance.darkMode,
                fontSize: appearance.fontSize,
                // Notifications (global defaults)
                emailNotifications: notify.emailNotifications,
                orderNotifications: notify.orderNotifications,
                promotionNotifications: notify.promotionNotifications,
                lowStockAlerts: notify.lowStockAlerts,
                newOrderAlerts: notify.newOrderAlerts,
                paymentAlerts: notify.paymentAlerts
            }

            // Prepare admin settings
            const adminSettings = {
                twoFactorEnabled: security.twoFactorEnabled,
                sessionTimeoutMinutes: security.sessionTimeoutMinutes,
                emailNotifications: notify.emailNotifications,
                orderNotifications: notify.orderNotifications,
                lowStockAlerts: notify.lowStockAlerts,
                newOrderAlerts: notify.newOrderAlerts,
                paymentAlerts: notify.paymentAlerts,
                themeColor: appearance.themeColor,
                darkMode: appearance.darkMode,
                fontSize: appearance.fontSize,
                language: appearance.language
            }

            // Gọi API song song
            await Promise.all([
                axiosInstance.put('/api/settings/global', { settings: globalSettings }),
                adminId ? axiosInstance.put(`/api/settings/admin/${adminId}`, { settings: adminSettings }) : Promise.resolve()
            ])

            // Apply theme via context (propagates to entire app)
            setThemeColor(appearance.themeColor)
            setDarkMode(appearance.darkMode)

            showToast('✅ Đã lưu cài đặt thành công')
        } catch (e) {
            showToast('❌ Lỗi lưu cài đặt: ' + (e.response?.data?.message || e.message), 'error')
        } finally {
            setSaving(false)
        }
    }

    // ── Reset to defaults ─────────────────────────────────────────
    const handleReset = async () => {
        if (!window.confirm('Bạn có chắc muốn reset tất cả cài đặt về mặc định?')) return

        setSaving(true)
        try {
            if (adminId) {
                await axiosInstance.delete(`/api/settings/admin/${adminId}/reset`)
            }
            await fetchSettings()
            showToast('Đã reset về cài đặt mặc định', 'success')
        } catch (e) {
            showToast('Lỗi reset: ' + (e.response?.data?.message || e.message), 'error')
        } finally {
            setSaving(false)
        }
    }

    // ── Export settings to JSON ───────────────────────────────────
    const handleExport = async () => {
        try {
            const [globalRes, adminRes] = await Promise.all([
                axiosInstance.get('/api/settings/global'),
                adminId ? axiosInstance.get(`/api/settings/admin/${adminId}`) : Promise.resolve({ data: { data: {} } })
            ])

            const exportData = {
                exportedAt: new Date().toISOString(),
                global: globalRes.data?.data || {},
                admin: adminRes.data?.data || {}
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
            showToast('Đã xuất cài đặt thành công', 'success')
        } catch (e) {
            showToast('Lỗi xuất: ' + e.message, 'error')
        }
    }

    const TABS = [
        { id: 'store', label: '🏪 Cửa hàng' },
        { id: 'notify', label: '🔔 Thông báo' },
        { id: 'appearance', label: '🎨 Giao diện' },
        { id: 'security', label: '🔒 Bảo mật' },
    ]

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>Đang tải cài đặt từ server...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )

    return (
        <div style={{ padding: 24, color: '#f9fafb', fontFamily: '"DM Sans", system-ui, sans-serif', maxWidth: 1000, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Cài Đặt Hệ Thống</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        Quản lý cấu hình cửa hàng • Kết nối Setting Service qua API Gateway
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleExport} style={buttonOutlineStyle}>
                        <Download size={13} /> Xuất
                    </button>
                    <button onClick={handleReset} style={buttonOutlineStyle}>
                        <RefreshCw size={13} /> Reset
                    </button>
                    <button onClick={fetchSettings} style={buttonOutlineStyle}>
                        <RefreshCw size={13} /> Tải lại
                    </button>
                    <button onClick={handleSave} disabled={saving} style={buttonPrimaryStyle}>
                        {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                        {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 4,
                background: '#1f2937',
                border: '1px solid #374151',
                borderRadius: 10,
                padding: 4,
                marginBottom: 24,
                overflowX: 'auto'
            }}>
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        style={{
                            flex: 1, minWidth: 100, padding: '8px 14px', borderRadius: 7,
                            border: 'none', cursor: 'pointer',
                            background: activeTab === t.id ? '#111827' : 'transparent',
                            color: activeTab === t.id ? '#f59e0b' : '#6b7280',
                            fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
                            transition: 'all .15s', whiteSpace: 'nowrap'
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab: Cửa hàng */}
            {activeTab === 'store' && (
                <SectionCard icon={<Store size={18} color="#f59e0b" />} title="Thông tin cửa hàng" desc="Thông tin cơ bản hiển thị với khách hàng">
                    <Input label="Tên cửa hàng" value={store.storeName} onChange={v => setStore(p => ({ ...p, storeName: v }))} icon={Store} />
                    <Input label="Email" type="email" value={store.storeEmail} onChange={v => setStore(p => ({ ...p, storeEmail: v }))} icon={Mail} />
                    <Input label="Số điện thoại" value={store.storePhone} onChange={v => setStore(p => ({ ...p, storePhone: v }))} icon={Phone} />
                    <Full><Textarea label="Địa chỉ" value={store.storeAddress} onChange={v => setStore(p => ({ ...p, storeAddress: v }))} icon={MapPin} /></Full>
                    <Full><Textarea label="Mô tả cửa hàng" value={store.storeDescription} onChange={v => setStore(p => ({ ...p, storeDescription: v }))} rows={3} /></Full>
                    <Select label="Ngôn ngữ" value={store.language} onChange={v => setStore(p => ({ ...p, language: v }))} icon={Globe2}
                        options={[{ value: 'vi', label: '🇻🇳 Tiếng Việt' }, { value: 'en', label: '🇺🇸 English' }]} />
                    <Select label="Múi giờ" value={store.timezone} onChange={v => setStore(p => ({ ...p, timezone: v }))} icon={Globe2}
                        options={[{ value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' }, { value: 'UTC', label: 'UTC' }]} />
                    <Select label="Tiền tệ" value={store.currency} onChange={v => setStore(p => ({ ...p, currency: v }))}
                        options={[{ value: 'VND', label: 'VND - Việt Nam Đồng' }, { value: 'USD', label: 'USD - US Dollar' }]} />
                    <Input label="Thuế VAT (%)" type="number" value={store.taxRate} onChange={v => setStore(p => ({ ...p, taxRate: Number(v) }))} />
                    <Input label="Miễn phí ship từ (đ)" type="number" value={store.freeShippingThreshold} onChange={v => setStore(p => ({ ...p, freeShippingThreshold: Number(v) }))} />
                    <Input label="Phí vận chuyển (đ)" type="number" value={store.shippingFee} onChange={v => setStore(p => ({ ...p, shippingFee: Number(v) }))} />
                    <div>
                        <label style={labelStyle}><Clock size={10} style={{ display: 'inline', marginRight: 4 }} />Giờ mở cửa</label>
                        <input type="time" value={store.openTime} onChange={e => setStore(p => ({ ...p, openTime: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}><Clock size={10} style={{ display: 'inline', marginRight: 4 }} />Giờ đóng cửa</label>
                        <input type="time" value={store.closeTime} onChange={e => setStore(p => ({ ...p, closeTime: e.target.value }))} style={inputStyle} />
                    </div>
                </SectionCard>
            )}

            {/* Tab: Thông báo */}
            {activeTab === 'notify' && (
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={18} color="#3b82f6" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>Cài đặt thông báo</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>Quản lý các loại thông báo hệ thống</div>
                        </div>
                    </div>
                    <div style={{ padding: 20 }}>
                        <Toggle label="Thông báo email" desc="Gửi email khi có sự kiện quan trọng" icon={Mail}
                            checked={!!notify.emailNotifications} onChange={v => setNotify(p => ({ ...p, emailNotifications: v }))} />
                        <Toggle label="Thông báo đơn hàng" desc="Cảnh báo khi có đơn hàng mới" icon={Bell}
                            checked={!!notify.orderNotifications} onChange={v => setNotify(p => ({ ...p, orderNotifications: v }))} />
                        <Toggle label="Đơn hàng mới (popup)" desc="Hiển thị popup ngay khi có đơn mới" icon={Volume2}
                            checked={!!notify.newOrderAlerts} onChange={v => setNotify(p => ({ ...p, newOrderAlerts: v }))} />
                        <Toggle label="Thông báo khuyến mãi" desc="Gửi thông báo về chương trình khuyến mãi"
                            checked={!!notify.promotionNotifications} onChange={v => setNotify(p => ({ ...p, promotionNotifications: v }))} />
                        <Toggle label="Cảnh báo hàng sắp hết" desc="Thông báo khi sản phẩm sắp hết" icon={Database}
                            checked={!!notify.lowStockAlerts} onChange={v => setNotify(p => ({ ...p, lowStockAlerts: v }))} />
                        <Toggle label="Cảnh báo thanh toán" desc="Theo dõi các giao dịch bất thường" icon={CreditCard}
                            checked={!!notify.paymentAlerts} onChange={v => setNotify(p => ({ ...p, paymentAlerts: v }))} />
                    </div>
                </div>
            )}

            {/* Tab: Giao diện */}
            {activeTab === 'appearance' && (
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palette size={18} color="#8b5cf6" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>Tùy chỉnh giao diện</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>Màu sắc và chế độ hiển thị</div>
                        </div>
                    </div>
                    <div style={{ padding: 20 }}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>Màu chủ đạo</label>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                {THEME_COLORS.map(c => (
                                    <button key={c.value} title={c.name} onClick={() => setAppearance(p => ({ ...p, themeColor: c.value }))}
                                        style={{ width: 38, height: 38, borderRadius: 9, border: `3px solid ${appearance.themeColor === c.value ? '#fff' : 'transparent'}`, background: c.value, cursor: 'pointer', transition: 'all .15s', transform: appearance.themeColor === c.value ? 'scale(1.15)' : 'scale(1)' }} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="color" value={appearance.themeColor} onChange={e => setAppearance(p => ({ ...p, themeColor: e.target.value }))}
                                    style={{ width: 42, height: 36, border: '1px solid #374151', borderRadius: 7, cursor: 'pointer', background: '#111827', padding: 2 }} />
                                <input value={appearance.themeColor} onChange={e => setAppearance(p => ({ ...p, themeColor: e.target.value }))} maxLength={7}
                                    style={{ ...inputStyle, maxWidth: 120 }} />
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: appearance.themeColor, border: '2px solid #374151' }} />
                            </div>
                        </div>
                        <Select label="Cỡ chữ" value={appearance.fontSize} onChange={v => setAppearance(p => ({ ...p, fontSize: v }))}
                            options={[{ value: 'small', label: 'Nhỏ' }, { value: 'medium', label: 'Vừa' }, { value: 'large', label: 'Lớn' }]} />
                        <Toggle label="Chế độ tối (Dark Mode)" desc="Giao diện tối cho toàn bộ admin panel" icon={appearance.darkMode ? Moon : Sun}
                            checked={!!appearance.darkMode} onChange={v => setAppearance(p => ({ ...p, darkMode: v }))} />
                    </div>
                </div>
            )}

            {/* Tab: Bảo mật */}
            {activeTab === 'security' && (
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={18} color="#ef4444" />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#f9fafb' }}>Bảo mật tài khoản</div>
                            <div style={{ fontSize: 11, color: '#6b7280' }}>Cài đặt bảo mật cho tài khoản admin</div>
                        </div>
                    </div>
                    <div style={{ padding: 20 }}>
                        <Toggle label="Xác thực 2 bước (2FA)" desc="Bảo vệ tài khoản bằng mã xác thực khi đăng nhập" icon={Fingerprint}
                            checked={!!security.twoFactorEnabled} onChange={v => setSecurity(p => ({ ...p, twoFactorEnabled: v }))} />

                        <div style={{ marginTop: 16 }}>
                            <label style={labelStyle}>Thời gian hết session (phút)</label>
                            <select value={security.sessionTimeoutMinutes} onChange={e => setSecurity(p => ({ ...p, sessionTimeoutMinutes: Number(e.target.value) }))} style={selectStyle}>
                                {[15, 30, 60, 120, 240, 480].map(m => (
                                    <option key={m} value={m}>{m} phút{m >= 60 ? ` (${m / 60} giờ)` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                            <Shield size={12} style={{ display: 'inline', marginRight: 6 }} />
                            Tài khoản: <strong style={{ color: '#f9fafb' }}>{adminUser?.userName || 'Admin'}</strong>
                            &nbsp;·&nbsp; ID: <strong style={{ color: '#f9fafb' }}>{adminId || '1'}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={toastStyle}>
                    {toast.type === 'error' ? <AlertCircle size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="#22c55e" />}
                    <span style={{ flex: 1 }}>{toast.msg}</span>
                    <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={14} /></button>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes slideIn {
                    from { transform: translateX(40px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}

// Styles
const buttonOutlineStyle = {
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: 8,
    padding: '8px 16px',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    transition: 'all 0.2s'
}

const buttonPrimaryStyle = {
    background: '#f59e0b',
    border: 'none',
    borderRadius: 8,
    padding: '8px 20px',
    color: '#111827',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    transition: 'all 0.2s'
}

const toastStyle = {
    position: 'fixed',
    bottom: 28,
    right: 28,
    zIndex: 9999,
    background: '#1f2937',
    border: '1px solid #22c55e',
    borderLeft: '4px solid #22c55e',
    borderRadius: 10,
    padding: '13px 18px',
    color: '#f9fafb',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    maxWidth: 380,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    animation: 'slideIn 0.2s ease'
}