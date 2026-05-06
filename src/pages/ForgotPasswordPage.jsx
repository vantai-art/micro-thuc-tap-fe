// src/pages/ForgotPasswordPage.jsx — Trang quên mật khẩu
// FIX: Gọi thẳng axios với withCredentials: false thay vì dùng http instance (withCredentials: true)
// Lý do: withCredentials: true + CORS gateway trả "Allow-Origin: *" → browser block hoàn toàn
// Endpoint /auth/forgot-password không cần cookie/session nên withCredentials: false là đúng
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:8080'

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim()) return setError('Vui lòng nhập địa chỉ email')
        setError(''); setLoading(true)
        try {
            // FIX: withCredentials: false → tránh CORS conflict với gateway
            await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim() }, {
                withCredentials: false,
                timeout: 15000,
            })
            setSent(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }


    return (
        <div style={s.page}>
            <style>{css}</style>
            <div style={s.foodBg1}>🍲</div>
            <div style={s.foodBg2}>🥗</div>

            <div style={s.card}>
                {/* Left panel */}
                <div style={s.left} className="fp-left">
                    <div style={s.leftInner}>
                        <div style={s.logo}>
                            <div style={s.logoIcon}>🍽️</div>
                            <div>
                                <div style={s.logoName}>Foodie Hub</div>
                                <div style={s.logoTagline}>Tinh tế từng bữa ăn</div>
                            </div>
                        </div>
                        <div style={s.headline}>
                            <h1 style={s.h1}>Quên<br /><span style={{ color: '#e67e22' }}>mật khẩu?</span><br />Không sao!</h1>
                            <p style={s.hSub}>Chỉ cần nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu ngay lập tức.</p>
                        </div>
                        <div style={s.steps}>
                            {[
                                { icon: '📧', step: '1', text: 'Nhập email đã đăng ký' },
                                { icon: '📬', step: '2', text: 'Kiểm tra hộp thư đến' },
                                { icon: '🔐', step: '3', text: 'Tạo mật khẩu mới' },
                            ].map((item, i) => (
                                <div key={i} style={s.stepCard}>
                                    <div style={s.stepNum}>{item.step}</div>
                                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                                    <span style={s.stepText}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={s.leftOverlay} />
                </div>

                {/* Right panel */}
                <div style={s.right}>
                    <div style={s.formWrap}>
                        <button onClick={() => navigate('/auth')} style={s.backBtn} className="fp-back">
                            ← Quay lại đăng nhập
                        </button>

                        {sent ? (
                            /* ── Trạng thái đã gửi thành công ── */
                            <div style={s.successBox}>
                                <div style={s.successIcon}>📬</div>
                                <h2 style={s.successTitle}>Email đã được gửi!</h2>
                                <p style={s.successText}>
                                    Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                                    <strong style={{ color: '#e67e22' }}>{email}</strong>.
                                </p>
                                <p style={s.successNote}>
                                    Không thấy email? Hãy kiểm tra thư mục <strong>Spam / Junk</strong> hoặc đợi vài phút.
                                </p>
                                <p style={s.successExpiry}>⏱️ Liên kết có hiệu lực trong <strong>15 phút</strong>.</p>
                                <button
                                    onClick={() => { setSent(false); setEmail('') }}
                                    style={s.resendBtn}
                                    className="fp-btn"
                                >
                                    Gửi lại email
                                </button>
                                <button
                                    onClick={() => navigate('/auth')}
                                    style={s.backToLoginBtn}
                                >
                                    ← Về trang đăng nhập
                                </button>
                            </div>
                        ) : (
                            /* ── Form nhập email ── */
                            <>
                                <div style={{ marginBottom: 28 }}>
                                    <h2 style={s.formTitle}>Quên mật khẩu</h2>
                                    <p style={s.formSub}>Nhập email liên kết với tài khoản của bạn</p>
                                </div>

                                {error && (
                                    <div style={s.alertError}>
                                        <span>⚠️</span> {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={s.label}>ĐỊA CHỈ EMAIL</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={s.icon}>📧</span>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="example@gmail.com"
                                                required
                                                disabled={loading}
                                                autoComplete="email"
                                                style={{
                                                    ...s.input,
                                                    paddingLeft: 42,
                                                }}
                                                className="fp-input"
                                            />
                                        </div>
                                        <p style={s.inputHint}>
                                            Nhập email bạn đã dùng khi đăng ký tài khoản Foodie Hub
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
                                        className="fp-btn"
                                    >
                                        {loading ? (
                                            <><span className="spinner" /> Đang gửi...</>
                                        ) : (
                                            <>📨 Gửi link đặt lại mật khẩu</>
                                        )}
                                    </button>
                                </form>

                                <div style={s.divider}>
                                    <span style={s.dividerLine} />
                                    <span style={s.dividerText}>hoặc</span>
                                    <span style={s.dividerLine} />
                                </div>

                                <div style={s.switchHint}>
                                    Nhớ mật khẩu rồi?{' '}
                                    <span style={s.switchLink} onClick={() => navigate('/auth')} className="fp-link">
                                        Đăng nhập ngay
                                    </span>
                                </div>
                            </>
                        )}
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: 16, position: 'relative', overflow: 'hidden',
    },
    foodBg1: { position: 'fixed', top: -80, left: -80, fontSize: 180, opacity: 0.03, pointerEvents: 'none', transform: 'rotate(-15deg)' },
    foodBg2: { position: 'fixed', bottom: -60, right: -60, fontSize: 200, opacity: 0.03, pointerEvents: 'none', transform: 'rotate(10deg)' },
    card: {
        width: '100%', maxWidth: 980, display: 'flex', borderRadius: 28,
        overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.05)', minHeight: 580,
        position: 'relative', zIndex: 1,
    },
    left: {
        flex: 1,
        background: 'linear-gradient(145deg, #1a120b 0%, #2c1e12 40%, #1a120b 100%)',
        padding: 48, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    leftInner: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' },
    leftOverlay: {
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 40%, rgba(230,126,34,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
    },
    logo: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 },
    logoIcon: {
        width: 52, height: 52, borderRadius: 16,
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
    },
    logoName: { color: '#fef3e2', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' },
    logoTagline: { color: 'rgba(254,243,226,0.45)', fontSize: 12, marginTop: 2 },
    headline: { marginBottom: 36 },
    h1: { color: '#fef3e2', fontWeight: 900, fontSize: 34, margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.2 },
    hSub: { color: 'rgba(254,243,226,0.5)', fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 320 },
    steps: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' },
    stepCard: {
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(230,126,34,0.15)',
        borderRadius: 16, padding: '12px 16px',
    },
    stepNum: {
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        color: '#fff', fontWeight: 800, fontSize: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    stepText: { color: '#fef3e2', fontWeight: 600, fontSize: 14 },
    right: {
        width: '100%', maxWidth: 460, background: '#111', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 44px', overflowY: 'auto',
    },
    formWrap: { width: '100%' },
    backBtn: {
        background: 'none', border: 'none', color: '#888',
        fontSize: 13, cursor: 'pointer', padding: 0,
        marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6,
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
    label: {
        display: 'block', color: '#aaa', fontSize: 11,
        fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7,
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
    inputHint: { color: '#444', fontSize: 12, marginTop: 8, lineHeight: 1.5 },
    submitBtn: {
        width: '100%', padding: '13px 20px',
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        color: '#fff', border: 'none', borderRadius: 14,
        fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
        transition: 'all 0.2s', fontFamily: "'Inter',system-ui", cursor: 'pointer',
    },
    divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
    dividerLine: { flex: 1, height: 1, background: '#222' },
    dividerText: { color: '#444', fontSize: 12 },
    switchHint: { textAlign: 'center', color: '#555', fontSize: 13 },
    switchLink: { color: '#e67e22', cursor: 'pointer', fontWeight: 700 },

    // Success state styles
    successBox: { textAlign: 'center', padding: '20px 0' },
    successIcon: { fontSize: 64, marginBottom: 16, display: 'block' },
    successTitle: { color: '#fef3e2', fontWeight: 800, fontSize: 22, margin: '0 0 12px', letterSpacing: '-0.5px' },
    successText: { color: '#888', fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' },
    successNote: { color: '#555', fontSize: 13, lineHeight: 1.6, margin: '0 0 8px' },
    successExpiry: { color: '#666', fontSize: 12, margin: '0 0 28px' },
    resendBtn: {
        width: '100%', padding: '13px 20px',
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        color: '#fff', border: 'none', borderRadius: 14,
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
        fontFamily: "'Inter',system-ui", marginBottom: 12,
    },
    backToLoginBtn: {
        width: '100%', padding: '12px 20px',
        background: 'transparent', border: '1px solid #2c2c2c',
        color: '#888', borderRadius: 14, fontSize: 14, cursor: 'pointer',
        fontFamily: "'Inter',system-ui",
    },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
  .fp-back:hover { color: #e67e22 !important; }
  .fp-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(230,126,34,0.5) !important; }
  .fp-link:hover { text-decoration: underline; }
  .fp-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.08) !important; }
  .spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg) } }
  @media (max-width: 768px) { .fp-left { display: none !important; } }
`