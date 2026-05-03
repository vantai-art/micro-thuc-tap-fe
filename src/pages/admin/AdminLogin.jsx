// src/pages/admin/AdminLogin.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, User, Coffee, AlertCircle, ArrowRight, Fingerprint, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { login as apiLogin } from '../../services/api'

function AdminLogin() {
    const navigate = useNavigate()
    const { login } = useApp()
    const [formData, setFormData] = useState({ userName: '', userPassword: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await apiLogin(formData.userName, formData.userPassword)
            const data = res.data

            if (!data || !data.id) throw new Error('Phản hồi không hợp lệ từ server')

            const role = data.role || ''
            if (role !== 'ROLE_ADMIN') {
                throw new Error('Tài khoản này không có quyền Admin!')
            }

            login(data)
            navigate('/admin', { replace: true })

        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #4c1d95 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background Blobs */}
            <div style={{
                position: 'absolute',
                top: '-10rem',
                right: '-10rem',
                width: '20rem',
                height: '20rem',
                background: '#8b5cf6',
                borderRadius: '50%',
                filter: 'blur(3rem)',
                opacity: 0.2,
                animation: 'blob1 7s infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10rem',
                left: '-10rem',
                width: '20rem',
                height: '20rem',
                background: '#3b82f6',
                borderRadius: '50%',
                filter: 'blur(3rem)',
                opacity: 0.2,
                animation: 'blob2 7s infinite 2s'
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20rem',
                height: '20rem',
                background: '#ec4899',
                borderRadius: '50%',
                filter: 'blur(3rem)',
                opacity: 0.2,
                animation: 'blob3 7s infinite 4s'
            }} />

            <style>{`
                @keyframes blob1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes blob2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-30px, 50px) scale(1.1); }
                    66% { transform: translate(20px, -20px) scale(0.9); }
                }
                @keyframes blob3 {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    33% { transform: translate(-50%, -50%) translate(40px, -30px) scale(1.1); }
                    66% { transform: translate(-50%, -50%) translate(-30px, 40px) scale(0.9); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: '72rem',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 0,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    {/* Left Side - Branding */}
                    <div style={{
                        background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '600px',
                        position: 'relative'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
                                <div style={{
                                    width: '3rem',
                                    height: '3rem',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    <Shield style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
                                </div>
                                <div>
                                    <h2 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', margin: 0 }}>Admin Portal</h2>
                                    <p style={{ color: '#e9d5ff', fontSize: '0.875rem', margin: 0 }}>Secure Access Only</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    backdropFilter: 'blur(4px)',
                                    width: 'fit-content'
                                }}>
                                    <div style={{ width: '0.5rem', height: '0.5rem', background: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                    <span style={{ color: 'white', fontSize: '0.875rem' }}>Secure Connection</span>
                                </div>

                                <h1 style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    lineHeight: '1.2',
                                    margin: 0
                                }}>
                                    Welcome Back,
                                    <br />
                                    <span style={{
                                        background: 'linear-gradient(135deg, #e9d5ff, #fbcfe8)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        color: 'transparent'
                                    }}>Administrator</span>
                                </h1>

                                <p style={{ color: '#e9d5ff', fontSize: '1.125rem', lineHeight: '1.625', margin: 0 }}>
                                    Access the complete management dashboard to control orders, products, and system settings.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Lock style={{ width: '1rem', height: '1rem' }} />
                                </div>
                                <span style={{ fontSize: '0.875rem' }}>256-bit SSL Encryption</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                                <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Coffee style={{ width: '1rem', height: '1rem' }} />
                                </div>
                                <span style={{ fontSize: '0.875rem' }}>Coffee Shop Management System</span>
                            </div>
                        </div>

                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '16rem',
                            height: '16rem',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)',
                            borderRadius: '50%',
                            pointerEvents: 'none'
                        }} />
                    </div>

                    {/* Right Side - Login Form */}
                    <div style={{ padding: '2rem 3rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', margin: 0 }}>Sign In</h3>
                            <p style={{ color: '#9ca3af', marginTop: '0.5rem', margin: 0 }}>Enter your credentials to access the dashboard</p>
                        </div>

                        {error && (
                            <div style={{
                                marginBottom: '1.5rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                color: '#f87171',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                animation: 'shake 0.3s ease-in-out'
                            }}>
                                <AlertCircle style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.875rem' }}>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ color: '#d1d5db', display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Username</label>
                                <div style={{ position: 'relative' }}>
                                    <User style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        color: '#6b7280'
                                    }} />
                                    <input
                                        type="text"
                                        value={formData.userName}
                                        onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(31, 41, 55, 0.5)',
                                            color: 'white',
                                            padding: '0.875rem 1rem 0.875rem 3rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #374151',
                                            outline: 'none',
                                            transition: 'all 0.3s'
                                        }}
                                        placeholder="admin@coffeeshop.com"
                                        required
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = '#374151'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#d1d5db', display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        color: '#6b7280'
                                    }} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.userPassword}
                                        onChange={e => setFormData({ ...formData, userPassword: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(31, 41, 55, 0.5)',
                                            color: 'white',
                                            padding: '0.875rem 3rem 0.875rem 3rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid #374151',
                                            outline: 'none',
                                            transition: 'all 0.3s'
                                        }}
                                        placeholder="••••••••"
                                        required
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = '#374151'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '1rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#6b7280'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" style={{
                                        width: '1rem',
                                        height: '1rem',
                                        borderRadius: '0.25rem',
                                        borderColor: '#374151',
                                        background: '#1f2937'
                                    }} />
                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Remember me</span>
                                </label>
                                <button type="button" style={{
                                    color: '#a78bfa',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    cursor: 'pointer'
                                }}>
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    background: loading ? '#4b5563' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                    color: 'white',
                                    padding: '0.875rem',
                                    borderRadius: '0.75rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'all 0.3s'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{
                                            width: '1.25rem',
                                            height: '1.25rem',
                                            border: '2px solid white',
                                            borderTopColor: 'transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint size={20} />
                                        <span>Secure Login</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #374151' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <button
                                    onClick={() => navigate('/')}
                                    style={{
                                        color: '#9ca3af',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    ← Back to Homepage
                                </button>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ width: '0.5rem', height: '0.5rem', background: '#22c55e', borderRadius: '50%' }} />
                                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>System Online</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                <Shield size={12} />
                                <span>Secured by CoffeeShop Security</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    )
}

export default AdminLogin