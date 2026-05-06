// src/pages/ResetPasswordPage.jsx — Trang đặt lại mật khẩu (sau khi bấm link trong email)
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { validateResetToken, resetPassword } from '../services/api'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [status, setStatus] = useState('validating') // validating | valid | invalid | success
    const [firstName, setFirstName] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Bước 1: Validate token khi trang load
    useEffect(() => {
        if (!token) { setStatus('invalid'); return }
        validateResetToken(token)
            .then(res => {
                setFirstName(res.data?.firstName || 'bạn')
                setStatus('valid')
            })
            .catch(() => setStatus('invalid'))
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (newPassword.length < 4) return setError('Mật khẩu phải có ít nhất 4 ký tự')
        if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp')

        setLoading(true)
        try {
            await resetPassword(token, newPassword)
            setStatus('success')
        } catch (err) {
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    const strength = (() => {
        if (!newPassword) return { level: 0, label: '', color: '' }
        if (newPassword.length < 4) return { level: 1, label: 'Quá ngắn', color: '#ef4444' }
        if (newPassword.length < 8) return { level: 2, label: 'Yếu', color: '#f97316' }
        if (/^[a-z]+$/i.test(newPassword)) return { level: 2, label: 'Trung bình', color: '#eab308' }
        if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) return { level: 4, label: 'Mạnh', color: '#22c55e' }
        return { level: 3, label: 'Khá mạnh', color: '#84cc16' }
    })()

    return (
        <div style={s.page}>
            <style>{css}</style>
            <div style={s.foodBg1}>🍲</div>
            <div style={s.foodBg2}>🥗</div>

            <div style={s.card}>
                {/* Left panel */}
                <div style={s.left} className="rp-left">
                    <div style={s.leftInner}>
                        <div style={s.logo}>
                            <div style={s.logoIcon}>🍽️</div>
                            <div>
                                <div style={s.logoName}>Foodie Hub</div>
                                <div style={s.logoTagline}>Tinh tế từng bữa ăn</div>
                            </div>
                        </div>
                        <div style={s.headline}>
                            <h1 style={s.h1}>Tạo mật khẩu<br /><span style={{ color: '#e67e22' }}>mới</span><br />an toàn hơn</h1>
                            <p style={s.hSub}>Hãy chọn mật khẩu mạnh và dễ nhớ. Chúng tôi khuyên bạn dùng kết hợp chữ hoa, chữ thường và số.</p>
                        </div>
                        <div style={s.tips}>
                            <div style={s.tipTitle}>💡 Gợi ý mật khẩu an toàn</div>
                            {[
                                'Ít nhất 8 ký tự',
                                'Kết hợp chữ HOA và thường',
                                'Có ít nhất 1 chữ số',
                                'Không dùng thông tin cá nhân',
                            ].map((tip, i) => (
                                <div key={i} style={s.tipItem}>
                                    <span style={{ color: '#e67e22' }}>✓</span> {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={s.leftOverlay} />
                </div>

                {/* Right panel */}
                <div style={s.right}>
                    <div style={s.formWrap}>

                        {/* ── Đang xác thực token ── */}
                        {status === 'validating' && (
                            <div style={s.centeredBox}>
                                <div className="spinner-large" />
                                <p style={s.loadingText}>Đang xác thực liên kết...</p>
                            </div>
                        )}

                        {/* ── Token không hợp lệ hoặc hết hạn ── */}
                        {status === 'invalid' && (
                            <div style={s.centeredBox}>
                                <div style={s.invalidIcon}>⏰</div>
                                <h2 style={s.invalidTitle}>Liên kết không hợp lệ</h2>
                                <p style={s.invalidText}>
                                    Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.
                                    Mỗi liên kết chỉ có hiệu lực trong <strong>15 phút</strong>.
                                </p>
                                <button onClick={() => navigate('/forgot-password')} style={s.submitBtn} className="rp-btn">
                                    📨 Yêu cầu link mới
                                </button>
                                <button onClick={() => navigate('/auth')} style={s.backToLoginBtn}>
                                    ← Về trang đăng nhập
                                </button>
                            </div>
                        )}

                        {/* ── Form đặt mật khẩu mới ── */}
                        {status === 'valid' && (
                            <>
                                <button onClick={() => navigate('/auth')} style={s.backBtn} className="rp-back">
                                    ← Quay lại đăng nhập
                                </button>
                                <div style={{ marginBottom: 28 }}>
                                    <h2 style={s.formTitle}>Đặt mật khẩu mới</h2>
                                    <p style={s.formSub}>Xin chào <strong style={{ color: '#e67e22' }}>{firstName}</strong>! Hãy tạo mật khẩu mới cho tài khoản của bạn</p>
                                </div>

                                {error && (
                                    <div style={s.alertError}><span>⚠️</span> {error}</div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    {/* Mật khẩu mới */}
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={s.label}>MẬT KHẨU MỚI</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={s.icon}>🔑</span>
                                            <input
                                                type={showPwd ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Nhập mật khẩu mới"
                                                required
                                                disabled={loading}
                                                style={{ ...s.input, paddingLeft: 42, paddingRight: 42 }}
                                                className="rp-input"
                                            />
                                            <button type="button" onClick={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
                                                {showPwd ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        {/* Thanh đo độ mạnh mật khẩu */}
                                        {newPassword && (
                                            <div style={s.strengthBar}>
                                                <div style={s.strengthTrack}>
                                                    {[1, 2, 3, 4].map(lvl => (
                                                        <div
                                                            key={lvl}
                                                            style={{
                                                                ...s.strengthSegment,
                                                                background: lvl <= strength.level ? strength.color : '#222',
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span style={{ ...s.strengthLabel, color: strength.color }}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Xác nhận mật khẩu */}
                                    <div style={{ marginBottom: 24 }}>
                                        <label style={s.label}>XÁC NHẬN MẬT KHẨU</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={s.icon}>🔐</span>
                                            <input
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Nhập lại mật khẩu"
                                                required
                                                disabled={loading}
                                                style={{
                                                    ...s.input,
                                                    paddingLeft: 42, paddingRight: 42,
                                                    borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : undefined,
                                                }}
                                                className="rp-input"
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                                                {showConfirm ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                        {confirmPassword && confirmPassword !== newPassword && (
                                            <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>⚠️ Mật khẩu không khớp</p>
                                        )}
                                        {confirmPassword && confirmPassword === newPassword && (
                                            <p style={{ color: '#22c55e', fontSize: 12, marginTop: 6 }}>✓ Mật khẩu khớp</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
                                        className="rp-btn"
                                    >
                                        {loading ? <><span className="spinner" /> Đang xử lý...</> : <>🔐 Đặt mật khẩu mới</>}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* ── Đặt lại thành công ── */}
                        {status === 'success' && (
                            <div style={s.centeredBox}>
                                <div style={s.successIcon}>🎉</div>
                                <h2 style={s.successTitle}>Thành công!</h2>
                                <p style={s.successText}>
                                    Mật khẩu của bạn đã được đặt lại thành công.<br />
                                    Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                                </p>
                                <button onClick={() => navigate('/auth')} style={s.submitBtn} className="rp-btn">
                                    → Đăng nhập ngay
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

const s = {
    page: {
        minHeight: '100vh', background: '#0f0f0f',
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
        flex: 1, background: 'linear-gradient(145deg, #1a120b 0%, #2c1e12 40%, #1a120b 100%)',
        padding: 48, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    leftInner: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' },
    leftOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(230,126,34,0.08) 0%, transparent 60%)', pointerEvents: 'none' },
    logo: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 },
    logoIcon: { width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#e67e22,#d35400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 20px rgba(230,126,34,0.35)' },
    logoName: { color: '#fef3e2', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' },
    logoTagline: { color: 'rgba(254,243,226,0.45)', fontSize: 12, marginTop: 2 },
    headline: { marginBottom: 32 },
    h1: { color: '#fef3e2', fontWeight: 900, fontSize: 34, margin: '0 0 14px', letterSpacing: '-0.03em', lineHeight: 1.2 },
    hSub: { color: 'rgba(254,243,226,0.5)', fontSize: 15, lineHeight: 1.7, margin: 0, maxWidth: 320 },
    tips: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(230,126,34,0.15)', borderRadius: 16, padding: '18px 20px', marginTop: 'auto' },
    tipTitle: { color: '#fef3e2', fontWeight: 700, fontSize: 14, marginBottom: 12 },
    tipItem: { color: 'rgba(254,243,226,0.6)', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 },
    right: { width: '100%', maxWidth: 460, background: '#111', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 44px', overflowY: 'auto' },
    formWrap: { width: '100%' },
    backBtn: { background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 },
    formTitle: { color: '#fef3e2', fontWeight: 800, fontSize: 22, margin: '0 0 6px', letterSpacing: '-0.5px' },
    formSub: { color: '#555', fontSize: 13, margin: 0, lineHeight: 1.5 },
    alertError: {
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        borderLeft: '3px solid #ef4444', borderRadius: 12,
        padding: '11px 14px', marginBottom: 18,
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#fca5a5', fontSize: 13,
    },
    label: { display: 'block', color: '#aaa', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 },
    icon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none', zIndex: 1, color: '#888' },
    input: {
        width: '100%', boxSizing: 'border-box', background: '#0a0a0a',
        border: '1px solid #2c2c2c', borderRadius: 12, padding: '11px 14px',
        color: '#fef3e2', fontSize: 14, outline: 'none',
        fontFamily: "'Inter',system-ui", transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0, color: '#888' },
    strengthBar: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 },
    strengthTrack: { display: 'flex', gap: 4, flex: 1 },
    strengthSegment: { flex: 1, height: 4, borderRadius: 2, transition: 'background 0.3s' },
    strengthLabel: { fontSize: 11, fontWeight: 700, minWidth: 64, textAlign: 'right' },
    submitBtn: {
        width: '100%', padding: '13px 20px',
        background: 'linear-gradient(135deg,#e67e22,#d35400)',
        color: '#fff', border: 'none', borderRadius: 14,
        fontSize: 15, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 4px 20px rgba(230,126,34,0.35)',
        transition: 'all 0.2s', fontFamily: "'Inter',system-ui", cursor: 'pointer', marginBottom: 12,
    },
    backToLoginBtn: {
        width: '100%', padding: '12px 20px', background: 'transparent',
        border: '1px solid #2c2c2c', color: '#888', borderRadius: 14,
        fontSize: 14, cursor: 'pointer', fontFamily: "'Inter',system-ui",
    },
    centeredBox: { textAlign: 'center', padding: '20px 0' },
    invalidIcon: { fontSize: 64, marginBottom: 16, display: 'block' },
    invalidTitle: { color: '#fef3e2', fontWeight: 800, fontSize: 22, margin: '0 0 12px' },
    invalidText: { color: '#888', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' },
    successIcon: { fontSize: 64, marginBottom: 16, display: 'block' },
    successTitle: { color: '#fef3e2', fontWeight: 800, fontSize: 22, margin: '0 0 12px', letterSpacing: '-0.5px' },
    successText: { color: '#888', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' },
    loadingText: { color: '#555', fontSize: 14, marginTop: 16 },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,600;14..32,700;14..32,800;14..32,900&display=swap');
  .rp-back:hover { color: #e67e22 !important; }
  .rp-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(230,126,34,0.5) !important; }
  .rp-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.08) !important; }
  .spinner { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
  .spinner-large { display:inline-block; width:36px; height:36px; border:3px solid rgba(230,126,34,0.2); border-top-color:#e67e22; border-radius:50%; animation:spin 0.8s linear infinite; margin:20px auto; }
  @keyframes spin { to { transform: rotate(360deg) } }
  @media (max-width: 768px) { .rp-left { display: none !important; } }
`
