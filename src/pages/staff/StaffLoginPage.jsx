// src/pages/staff/StaffLoginPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import { login as apiLogin } from '../../services/api'

export default function StaffLoginPage() {
    const navigate = useNavigate()
    const { login } = useApp()
    const [form, setForm] = useState({ userName: '', userPassword: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await apiLogin(form.userName, form.userPassword)
            const data = res.data
            if (!data?.id) throw new Error('Phản hồi không hợp lệ')
            const role = data.role || ''
            if (role !== 'ROLE_STAFF' && role !== 'ROLE_ADMIN') {
                throw new Error('Tài khoản không có quyền nhân viên')
            }
            login(data)
            navigate('/staff', { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>
            <style>{css}</style>

            {/* Background decoration */}
            <div style={styles.bgLeft} />
            <div style={styles.bgRight} />

            <div style={styles.card}>
                {/* Left panel */}
                <div style={styles.leftPanel}>
                    <div style={styles.brandArea}>
                        <div style={styles.logoBox}>
                            <span style={{ fontSize: 32 }}>☕</span>
                        </div>
                        <h2 style={styles.brandName}>Coffee Blend</h2>
                        <p style={styles.brandSub}>Cổng nhân viên</p>
                    </div>

                    <div style={styles.featureList}>
                        {[
                            { icon: '🖥️', text: 'Quản lý POS bán hàng' },
                            { icon: '📋', text: 'Quản lý đơn theo bàn' },
                            { icon: '💳', text: 'Thanh toán đa phương thức' },
                            { icon: '🧾', text: 'In hóa đơn tức thì' },
                        ].map((f, i) => (
                            <div key={i} style={styles.featureItem}>
                                <span style={{ fontSize: 18 }}>{f.icon}</span>
                                <span style={styles.featureText}>{f.text}</span>
                            </div>
                        ))}
                    </div>

                    <div style={styles.leftFooter}>
                        <div style={styles.statusDot} />
                        <span style={styles.statusText}>Hệ thống đang hoạt động</span>
                    </div>
                </div>

                {/* Right panel - form */}
                <div style={styles.rightPanel}>
                    <div style={styles.formWrap}>
                        <div style={styles.formHeader}>
                            <h1 style={styles.formTitle}>Đăng nhập</h1>
                            <p style={styles.formSub}>Nhập thông tin tài khoản nhân viên của bạn</p>
                        </div>

                        {error && (
                            <div style={styles.errorBox}>
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Tên đăng nhập</label>
                                <div style={styles.inputWrap}>
                                    <span style={styles.inputIcon}>👤</span>
                                    <input
                                        type="text"
                                        value={form.userName}
                                        onChange={e => setForm({ ...form, userName: e.target.value })}
                                        placeholder="Nhập tên đăng nhập..."
                                        required
                                        disabled={loading}
                                        style={styles.input}
                                        className="staff-input"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Mật khẩu</label>
                                <div style={styles.inputWrap}>
                                    <span style={styles.inputIcon}>🔒</span>
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        value={form.userPassword}
                                        onChange={e => setForm({ ...form, userPassword: e.target.value })}
                                        placeholder="Nhập mật khẩu..."
                                        required
                                        disabled={loading}
                                        style={{ ...styles.input, paddingRight: 44 }}
                                        className="staff-input"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(!showPwd)}
                                        style={styles.eyeBtn}
                                    >
                                        {showPwd ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    ...styles.submitBtn,
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                                className={loading ? '' : 'submit-hover'}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" />
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    <>
                                        Đăng nhập hệ thống
                                        <span>→</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={styles.divider}>
                            <span style={styles.dividerLine} />
                            <span style={styles.dividerText}>hoặc</span>
                            <span style={styles.dividerLine} />
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            style={styles.backBtn}
                            className="back-hover"
                        >
                            ← Về trang khách hàng
                        </button>

                        <p style={styles.adminHint}>
                            Là quản lý?{' '}
                            <span
                                onClick={() => navigate('/admin/login')}
                                style={styles.adminLink}
                                className="link-hover"
                            >
                                Đăng nhập admin
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0c0c0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    bgLeft: {
        position: 'fixed',
        top: -200,
        left: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    bgRight: {
        position: 'fixed',
        bottom: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    card: {
        width: '100%',
        maxWidth: 900,
        display: 'flex',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        zIndex: 1,
    },
    leftPanel: {
        width: 320,
        flexShrink: 0,
        background: 'linear-gradient(160deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)',
        padding: '48px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    brandArea: { textAlign: 'center' },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    },
    brandName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 800,
        margin: '0 0 6px',
        letterSpacing: '-0.02em',
    },
    brandSub: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
        margin: 0,
    },
    featureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 14px',
    },
    featureText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: 500,
    },
    leftFooter: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#4ade80',
        boxShadow: '0 0 8px rgba(74,222,128,0.6)',
    },
    statusText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    rightPanel: {
        flex: 1,
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
    },
    formWrap: { width: '100%', maxWidth: 380 },
    formHeader: { marginBottom: 32 },
    formTitle: {
        color: '#f0ede6',
        fontSize: 28,
        fontWeight: 800,
        margin: '0 0 8px',
        letterSpacing: '-0.02em',
    },
    formSub: {
        color: '#555',
        fontSize: 14,
        margin: 0,
        lineHeight: 1.5,
    },
    errorBox: {
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderLeft: '3px solid #ef4444',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#fca5a5',
        fontSize: 13,
        marginBottom: 20,
    },
    fieldGroup: { marginBottom: 18 },
    label: {
        display: 'block',
        color: '#888',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    inputWrap: { position: 'relative' },
    inputIcon: {
        position: 'absolute',
        left: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 15,
        pointerEvents: 'none',
        zIndex: 1,
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        background: '#0a0a0a',
        border: '1px solid #222',
        borderRadius: 10,
        padding: '12px 14px 12px 42px',
        color: '#f0ede6',
        fontSize: 14,
        outline: 'none',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        transition: 'border-color 0.2s',
    },
    eyeBtn: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        padding: 0,
        color: '#555',
    },
    submitBtn: {
        width: '100%',
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 8,
        boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
        transition: 'all 0.2s',
        fontFamily: "'DM Sans', system-ui, sans-serif",
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        margin: '24px 0',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: '#1e1e1e',
    },
    dividerText: {
        color: '#444',
        fontSize: 12,
    },
    backBtn: {
        width: '100%',
        padding: '12px 20px',
        background: 'transparent',
        color: '#888',
        border: '1px solid #222',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        marginBottom: 16,
    },
    adminHint: {
        textAlign: 'center',
        color: '#444',
        fontSize: 13,
        margin: 0,
    },
    adminLink: {
        color: '#0ea5e9',
        cursor: 'pointer',
        fontWeight: 600,
        textDecoration: 'none',
    },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  
  .staff-input:focus {
    border-color: #0ea5e9 !important;
    box-shadow: 0 0 0 3px rgba(14,165,233,0.1) !important;
  }
  .staff-input:disabled {
    opacity: 0.5;
  }
  .submit-hover:hover {
    background: linear-gradient(135deg, #38bdf8, #0ea5e9) !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(14,165,233,0.4) !important;
  }
  .back-hover:hover {
    background: #1a1a1a !important;
    color: #f0ede6 !important;
    border-color: #333 !important;
  }
  .link-hover:hover {
    text-decoration: underline;
  }
  .spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg) } }

  @media (max-width: 640px) {
    .staff-left-panel { display: none !important; }
  }
`