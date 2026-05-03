// src/components/Navbar.jsx — theme-aware (light/dark)
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { Sun, Moon } from 'lucide-react'

export default function Navbar() {
    const { user, logout, isAdmin, isStaff, cartCount, darkMode, setDarkMode } = useApp()
    const nav = useNavigate()
    const loc = useLocation()
    const [open, setOpen] = useState(false)

    const go = (path) => { nav(path); setOpen(false) }
    const isActive = (path) => loc.pathname === path

    const handleLogout = () => {
        logout()
        nav('/login')
        setOpen(false)
    }

    return (
        <nav style={{
            position: 'sticky', top: 0, zIndex: 100,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px',
            transition: 'background 0.25s ease',
        }}>
            <div style={{
                maxWidth: 1200, margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: 60,
            }}>
                <button onClick={() => go('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#d4a853', letterSpacing: '-0.02em' }}>🌈 Rainbow</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Forest</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[
                        { label: 'Sản phẩm', path: '/products' },
                        ...(isAdmin ? [{ label: 'Admin', path: '/admin' }] : []),
                        ...(isStaff ? [{ label: 'Nhân viên', path: '/staff' }] : []),
                    ].map(({ label, path }) => (
                        <button key={path} onClick={() => go(path)} style={{
                            background: isActive(path) ? 'rgba(212,168,83,0.1)' : 'none',
                            border: 'none', color: isActive(path) ? '#d4a853' : 'var(--text-secondary)',
                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                            fontSize: 14, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, transition: 'all 0.2s',
                        }}>{label}</button>
                    ))}

                    {user && !isAdmin && !isStaff && (
                        <button onClick={() => go('/cart')} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            position: 'relative', padding: '6px 10px',
                            color: isActive('/cart') ? '#d4a853' : 'var(--text-secondary)', fontSize: 18,
                        }}>
                            🛒
                            {cartCount > 0 && (
                                <span style={{ position: 'absolute', top: 2, right: 4, background: '#d4a853', color: '#0a0a0a', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
                            )}
                        </button>
                    )}

                    {user && !isAdmin && !isStaff && (
                        <button onClick={() => go('/orders')} style={{ background: 'none', border: 'none', color: isActive('/orders') ? '#d4a853' : 'var(--text-secondary)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Đơn hàng</button>
                    )}

                    {/* 🌙 Dark/Light toggle */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                        style={{
                            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                            borderRadius: 8, width: 34, height: 34,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
                        }}
                    >
                        {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setOpen(!open)} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                                borderRadius: 20, padding: '6px 14px 6px 8px',
                                cursor: 'pointer', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
                            }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#d4a853,#3d8b5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0a0a0a' }}>
                                    {(user.userName || user.username || 'U')[0].toUpperCase()}
                                </div>
                                {user.userName || user.username}
                            </button>
                            {open && (
                                <div style={{ position: 'absolute', right: 0, top: '110%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', minWidth: 160, boxShadow: 'var(--shadow-card)' }}>
                                    <div style={{ padding: '8px 0' }}>
                                        <button onClick={() => go('/settings')} style={menuItemStyle}>Cài đặt</button>
                                        <button onClick={() => go('/orders')} style={menuItemStyle}>Đơn hàng</button>
                                        <button onClick={handleLogout} style={{ ...menuItemStyle, color: '#c0392b' }}>Đăng xuất</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => go('/login')} className="btn btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>Đăng nhập</button>
                    )}
                </div>
            </div>
        </nav>
    )
}

const menuItemStyle = {
    display: 'block', width: '100%', padding: '9px 16px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'DM Sans, sans-serif',
    textAlign: 'left', transition: 'all 0.15s',
}