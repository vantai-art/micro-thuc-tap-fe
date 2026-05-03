// src/pages/UserAuthPage.jsx — Trang đăng nhập / đăng ký cho khách hàng (F&B Theme)
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { login as apiLogin, register as apiRegister } from '../services/api'

// ─── Field component ──────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, required, disabled, icon, autoComplete }) {
    const [focused, setFocused] = useState(false)
    const [show, setShow] = useState(false)
    const isPwd = type === 'password'
    return (
        <div style={{ marginBottom: 14 }}>
            {label && <label style={s.label}>{label}</label>}
            <div style={{ position: 'relative' }}>
                {icon && <span style={s.icon}>{icon}</span>}
                <input
                    type={isPwd && show ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        ...s.input,
                        paddingLeft: icon ? 42 : 14,
                        paddingRight: isPwd ? 42 : 14,
                        borderColor: focused ? '#e67e22' : '#2c2c2c',
                        boxShadow: focused ? '0 0 0 3px rgba(230,126,34,0.08)' : 'none',
                        opacity: disabled ? 0.55 : 1,
                    }}
                />
                {isPwd && (
                    <button type="button" onClick={() => setShow(!show)} style={s.eyeBtn}>
                        {show ? '🙈' : '👁️'}
                    </button>
                )}
            </div>
        </div>
    )
}

export default function UserAuthPage() {
    const navigate = useNavigate()
    const { login } = useApp()
    const [tab, setTab] = useState('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [lg, setLg] = useState({ userName: '', userPassword: '' })
    const [rg, setRg] = useState({ userName: '', userPassword: '', confirmPassword: '', firstName: '', lastName: '', email: '', phoneNumber: '' })

    const handleLogin = async (e) => {
        e.preventDefault()
        setError(''); setSuccess(''); setLoading(true)
        try {
            const res = await apiLogin(lg.userName, lg.userPassword)
            const data = res.data
            if (!data?.id) throw new Error('Phản hồi không hợp lệ')
            const role = data.role || 'ROLE_USER'
            if (role === 'ROLE_ADMIN') { setError('Quản lý vui lòng đăng nhập tại /admin/login'); return }
            if (role === 'ROLE_STAFF') { setError('Nhân viên vui lòng đăng nhập tại /staff/login'); return }
            login(data)
            setSuccess('Đăng nhập thành công! Đang chuyển hướng...')
            setTimeout(() => navigate('/'), 800)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Sai tên đăng nhập hoặc mật khẩu')
        } finally { setLoading(false) }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setError(''); setSuccess('')
        if (!rg.userName.trim()) return setError('Vui lòng nhập tên đăng nhập')
        if (rg.userPassword.length < 4) return setError('Mật khẩu ít nhất 4 ký tự')
        if (rg.userPassword !== rg.confirmPassword) return setError('Mật khẩu không khớp')
        if (!rg.email.trim()) return setError('Vui lòng nhập email')
        if (!rg.firstName.trim() || !rg.lastName.trim()) return setError('Vui lòng nhập đầy đủ họ tên')
        setLoading(true)
        try {
            await apiRegister({
                userName: rg.userName, userPassword: rg.userPassword, active: 1,
                userDetails: { firstName: rg.firstName, lastName: rg.lastName, email: rg.email, phoneNumber: rg.phoneNumber },
            })
            setSuccess('Đăng ký thành công! Chuyển sang đăng nhập...')
            const savedName = rg.userName
            setRg({ userName: '', userPassword: '', confirmPassword: '', firstName: '', lastName: '', email: '', phoneNumber: '' })
            setTimeout(() => { setTab('login'); setLg(prev => ({ ...prev, userName: savedName })); setSuccess('') }, 1500)
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại.')
        } finally { setLoading(false) }
    }

    const switchTab = t => { setTab(t); setError(''); setSuccess('') }

    return (
        <div style={s.page}>
            <style>{css}</style>

            {/* Decorative food elements */}
            <div style={s.foodBg1}>🍲</div>
            <div style={s.foodBg2}>🥗</div>
            <div style={s.foodBg3}>🍜</div>

            <div style={s.card}>
                {/* ── Left panel ── */}
                <div style={s.left} className="auth-left">
                    <div style={s.leftInner}>
                        {/* Logo */}
                        <div style={s.logo}>
                            <div style={s.logoIcon}>🍽️</div>
                            <div>
                                <div style={s.logoName}>Foodie Hub</div>
                                <div style={s.logoTagline}>Tinh tế từng bữa ăn</div>
                            </div>
                        </div>

                        {/* Headline */}
                        <div style={s.headline}>
                            <h1 style={s.h1}>Món ngon<br /><span style={{ color: '#e67e22' }}>mỗi ngày</span><br />giao tận nơi</h1>
                            <p style={s.hSub}>Đặt món online, thanh toán dễ dàng, thưởng thức trọn vẹn hương vị.</p>
                        </div>

                        {/* Features */}
                        <div style={s.features}>
                            {[
                                { emoji: '🍳', title: 'Đa dạng món', desc: 'Món Á - Âu, hải sản, chay...' },
                                { emoji: '🚴', title: 'Giao hàng nhanh', desc: '30 phút có mặt' },
                                { emoji: '🎁', title: 'Tích điểm thành viên', desc: 'Nhận ưu đãi mỗi tuần' },
                            ].map((f, i) => (
                                <div key={i} style={s.featureCard}>
                                    <span style={{ fontSize: 22 }}>{f.emoji}</span>
                                    <div>
                                        <div style={s.featureTitle}>{f.title}</div>
                                        <div style={s.featureDesc}>{f.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom gradient overlay */}
                    <div style={s.leftOverlay} />
                </div>

                {/* ── Right panel (form) ── */}
                <div style={s.right}>
                    <div style={s.formWrap}>
                        <button onClick={() => navigate('/')} style={s.backBtn} className="back-link">
                            ← Về trang chủ
                        </button>

                        {/* Tab switcher */}
                        <div style={s.tabs}>
                            {[{ id: 'login', label: 'Đăng nhập' }, { id: 'register', label: 'Đăng ký' }].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => switchTab(t.id)}
                                    style={{
                                        ...s.tabBtn,
                                        background: tab === t.id ? 'linear-gradient(135deg,#e67e22,#d35400)' : 'transparent',
                                        color: tab === t.id ? '#fff' : '#aaa',
                                        boxShadow: tab === t.id ? '0 2px 12px rgba(230,126,34,0.3)' : 'none',
                                    }}
                                >{t.label}</button>
                            ))}
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={s.formTitle}>
                                {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                            </h2>
                            <p style={s.formSub}>
                                {tab === 'login' ? 'Đăng nhập để đặt món nhanh chóng' : 'Nhập thông tin để bắt đầu trải nghiệm'}
                            </p>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div style={s.alertError}>
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div style={s.alertSuccess}>
                                <span>✅</span>
                                <span>{success}</span>
                            </div>
                        )}

                        {/* LOGIN */}
                        {tab === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <Field label="Tên đăng nhập" value={lg.userName} icon="👤" autoComplete="username"
                                    onChange={e => setLg({ ...lg, userName: e.target.value })}
                                    placeholder="Nhập tên đăng nhập" required disabled={loading} />
                                <Field label="Mật khẩu" type="password" value={lg.userPassword} icon="🔒" autoComplete="current-password"
                                    onChange={e => setLg({ ...lg, userPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu" required disabled={loading} />

                                <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} className={loading ? '' : 'btn-hover'}>
                                    {loading ? <><span className="spinner" /> Đang đăng nhập...</> : 'Đăng nhập →'}
                                </button>

                                <p style={s.switchHint}>
                                    Chưa có tài khoản?{' '}
                                    <span onClick={() => switchTab('register')} style={s.switchLink} className="link-hover">Đăng ký ngay</span>
                                </p>
                            </form>
                        ) : (
                            /* REGISTER */
                            <form onSubmit={handleRegister}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <Field label="Họ *" value={rg.firstName} icon="👤"
                                        onChange={e => setRg({ ...rg, firstName: e.target.value })}
                                        placeholder="Nguyễn" required disabled={loading} />
                                    <Field label="Tên *" value={rg.lastName}
                                        onChange={e => setRg({ ...rg, lastName: e.target.value })}
                                        placeholder="Văn A" required disabled={loading} />
                                </div>
                                <Field label="Tên đăng nhập *" value={rg.userName} icon="🏷️" autoComplete="username"
                                    onChange={e => setRg({ ...rg, userName: e.target.value })}
                                    placeholder="username (không dấu, không khoảng trắng)" required disabled={loading} />
                                <Field label="Email *" type="email" value={rg.email} icon="📧" autoComplete="email"
                                    onChange={e => setRg({ ...rg, email: e.target.value })}
                                    placeholder="email@example.com" required disabled={loading} />
                                <Field label="Số điện thoại" type="tel" value={rg.phoneNumber} icon="📱" autoComplete="tel"
                                    onChange={e => setRg({ ...rg, phoneNumber: e.target.value })}
                                    placeholder="0912 345 678" disabled={loading} />
                                <Field label="Mật khẩu *" type="password" value={rg.userPassword} icon="🔒" autoComplete="new-password"
                                    onChange={e => setRg({ ...rg, userPassword: e.target.value })}
                                    placeholder="Ít nhất 4 ký tự" required disabled={loading} />
                                <Field label="Xác nhận mật khẩu *" type="password" value={rg.confirmPassword} icon="🔏" autoComplete="new-password"
                                    onChange={e => setRg({ ...rg, confirmPassword: e.target.value })}
                                    placeholder="Nhập lại mật khẩu" required disabled={loading} />

                                <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }} className={loading ? '' : 'btn-hover'}>
                                    {loading ? <><span className="spinner" /> Đang đăng ký...</> : 'Tạo tài khoản →'}
                                </button>

                                <p style={s.switchHint}>
                                    Đã có tài khoản?{' '}
                                    <span onClick={() => switchTab('login')} style={s.switchLink} className="link-hover">Đăng nhập</span>
                                </p>
                            </form>
                        )}

                        <div style={s.policy}>
                            Bằng cách đăng ký, bạn đồng ý với{' '}
                            <span style={s.policyLink}>Điều khoản sử dụng</span> và{' '}
                            <span style={s.policyLink}>Chính sách bảo mật</span> của chúng tôi.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const s = {
    page: {
        minHeight: '100vh',
        background: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    // Food decorative elements
    foodBg1: {
        position: 'fixed', top: -80, left: -80, fontSize: 180, opacity: 0.03,
        pointerEvents: 'none', transform: 'rotate(-15deg)',
    },
    foodBg2: {
        position: 'fixed', bottom: -60, right: -60, fontSize: 200, opacity: 0.03,
        pointerEvents: 'none', transform: 'rotate(10deg)',
    },
    foodBg3: {
        position: 'fixed', top: '30%', right: '10%', fontSize: 140, opacity: 0.02,
        pointerEvents: 'none',
    },
    card: {
        width: '100%', maxWidth: 1000,
        display: 'flex', borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.05)',
        minHeight: 620,
        position: 'relative', zIndex: 1,
    },
    left: {
        flex: 1,
        background: 'linear-gradient(145deg, #1a120b 0%, #2c1e12 40%, #1a120b 100%)',
        padding: 48,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    leftInner: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' },
    leftOverlay: {
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 40%, rgba(230,126,34,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
    },
    logo: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 },
    logoIcon: {
        width: 52, height: 52, borderRadius: 16,
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
    },
    logoName: { color: '#fef3e2', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' },
    logoTagline: { color: 'rgba(254,243,226,0.45)', fontSize: 12, marginTop: 2 },
    headline: { marginBottom: 'auto' },
    h1: { color: '#fef3e2', fontWeight: 900, fontSize: 34, margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.2 },
    hSub: { color: 'rgba(254,243,226,0.5)', fontSize: 15, lineHeight: 1.7, margin: '0 0 40px', maxWidth: 320 },
    features: { display: 'flex', flexDirection: 'column', gap: 10 },
    featureCard: {
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(230,126,34,0.15)',
        borderRadius: 16, padding: '12px 16px',
    },
    featureTitle: { color: '#fef3e2', fontWeight: 700, fontSize: 14 },
    featureDesc: { color: 'rgba(254,243,226,0.5)', fontSize: 12, marginTop: 2 },

    right: {
        width: '100%', maxWidth: 460,
        background: '#111',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 44px',
        overflowY: 'auto',
    },
    formWrap: { width: '100%' },
    backBtn: {
        background: 'none', border: 'none', color: '#888',
        fontSize: 13, cursor: 'pointer', padding: 0,
        marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6,
    },
    tabs: {
        display: 'flex', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 4, marginBottom: 28,
    },
    tabBtn: {
        flex: 1, padding: '10px', borderRadius: 10, border: 'none',
        cursor: 'pointer', fontSize: 14, fontWeight: 600,
        transition: 'all 0.2s', fontFamily: "'Inter',system-ui", background: 'transparent',
    },
    formTitle: { color: '#fef3e2', fontWeight: 800, fontSize: 22, margin: '0 0 6px', letterSpacing: '-0.5px' },
    formSub: { color: '#555', fontSize: 13, margin: 0, lineHeight: 1.5 },
    alertError: {
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        borderLeft: '3px solid #ef4444', borderRadius: 12,
        padding: '11px 14px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#fca5a5', fontSize: 13,
    },
    alertSuccess: {
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 12, padding: '11px 14px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#86efac', fontSize: 13,
    },
    label: {
        display: 'block', color: '#aaa', fontSize: 11,
        fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', marginBottom: 7,
    },
    icon: {
        position: 'absolute', left: 13, top: '50%',
        transform: 'translateY(-50%)', fontSize: 14,
        pointerEvents: 'none', zIndex: 1, color: '#888',
    },
    input: {
        width: '100%', boxSizing: 'border-box',
        background: '#0a0a0a', border: '1px solid #2c2c2c',
        borderRadius: 12, padding: '11px 14px',
        color: '#fef3e2', fontSize: 14, outline: 'none',
        fontFamily: "'Inter',system-ui",
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    eyeBtn: {
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)', background: 'none',
        border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, color: '#888',
    },
    submitBtn: {
        width: '100%', padding: '13px 20px',
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        color: '#fff', border: 'none', borderRadius: 14,
        fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 6,
        boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
        transition: 'all 0.2s',
        fontFamily: "'Inter',system-ui",
    },
    switchHint: { textAlign: 'center', color: '#555', fontSize: 13, marginTop: 16, marginBottom: 0 },
    switchLink: { color: '#e67e22', cursor: 'pointer', fontWeight: 700 },
    policy: { color: '#3a3a3a', fontSize: 11, textAlign: 'center', marginTop: 20, lineHeight: 1.6 },
    policyLink: { color: '#6a6a6a', cursor: 'pointer', textDecoration: 'underline' },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
  .back-link:hover { color: #e67e22 !important; }
  .btn-hover:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(230,126,34,0.5) !important; }
  .link-hover:hover { text-decoration: underline; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg) } }
  @media (max-width: 768px) { .auth-left { display: none !important; } }
`