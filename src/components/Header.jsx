// src/components/Header.jsx — theme-aware (light/dark)
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { Sun, Moon } from 'lucide-react'
import CartSidebar from './CartSidebar'

const NAV = [
    { path: '/', label: 'Trang Chủ' },
    { path: '/menu', label: 'Thực Đơn' },
    { path: '/shop', label: 'Cửa Hàng' },
]

export default function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const { customerUser: user, logout, cart, darkMode, setDarkMode } = useApp()
    const [scrolled, setScrolled] = useState(false)
    const [showCart, setShowCart] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const userMenuRef = useRef(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target))
                setUserMenuOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => { setMobileOpen(false) }, [location.pathname])

    const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

    const handleLogout = () => {
        logout("ROLE_USER")
        setUserMenuOpen(false)
        navigate('/')
    }

    // Màu header thay đổi theo theme
    const headerBg = darkMode
        ? (scrolled ? 'rgba(8,8,8,0.97)' : 'rgba(8,8,8,0.85)')
        : (scrolled ? 'rgba(250,249,245,0.97)' : 'rgba(250,249,245,0.85)')
    const headerBorder = darkMode
        ? (scrolled ? '1px solid rgba(212,168,83,0.15)' : '1px solid rgba(255,255,255,0.04)')
        : (scrolled ? '1px solid rgba(212,168,83,0.2)' : '1px solid rgba(0,0,0,0.06)')
    const navTextColor = darkMode ? 'rgba(245,239,230,0.65)' : 'rgba(30,24,20,0.6)'
    const navActiveColor = '#d4a853'
    const iconBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const iconBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    const iconColor = darkMode ? 'rgba(245,239,230,0.8)' : 'rgba(30,24,20,0.7)'
    const dropdownBg = darkMode ? '#141414' : '#ffffff'
    const dropdownBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    const dropdownText = darkMode ? 'rgba(245,239,230,0.75)' : 'rgba(30,24,20,0.75)'
    const dropdownDivider = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
    const userBtnBg = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const userBtnBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    const userNameColor = darkMode ? '#f5efe6' : '#1e1814'
    const logoTextColor = darkMode ? '#f5efe6' : '#1e1814'

    return (
        <>
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: headerBg,
                backdropFilter: 'blur(20px)',
                borderBottom: headerBorder,
                transition: 'all 0.3s ease',
                fontFamily: '"DM Sans", system-ui, sans-serif',
            }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>

                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #d4a853 0%, #a67c35 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(212,168,83,0.3)',
                        }}>
                            <span style={{ fontSize: 18 }}>☕</span>
                        </div>
                        <div>
                            <div style={{ color: logoTextColor, fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', lineHeight: 1.1 }}>FOOD AND DRINK</div>
                            <div style={{ color: '#d4a853', fontWeight: 600, fontSize: 10, letterSpacing: '0.25em' }}>BLEND</div>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {NAV.map(({ path, label }) => {
                            const active = location.pathname === path
                            return (
                                <Link key={path} to={path} style={{
                                    textDecoration: 'none', padding: '7px 16px', borderRadius: 8,
                                    fontSize: 13, fontWeight: active ? 600 : 500,
                                    color: active ? navActiveColor : navTextColor,
                                    background: active ? 'rgba(212,168,83,0.1)' : 'transparent',
                                    border: active ? '1px solid rgba(212,168,83,0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s', letterSpacing: '0.02em',
                                }}
                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = logoTextColor; e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}
                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = navTextColor; e.currentTarget.style.background = 'transparent' } }}
                                >{label}</Link>
                            )
                        })}
                    </nav>

                    {/* Right actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                        {/* 🌙 Dark/Light toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                            style={{
                                background: iconBg, border: `1px solid ${iconBorder}`,
                                borderRadius: 10, width: 42, height: 42,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: iconColor, transition: 'all 0.2s', flexShrink: 0,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,83,0.15)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.3)'; e.currentTarget.style.color = '#d4a853' }}
                            onMouseLeave={e => { e.currentTarget.style.background = iconBg; e.currentTarget.style.borderColor = iconBorder; e.currentTarget.style.color = iconColor }}
                        >
                            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Cart button */}
                        <button onClick={() => setShowCart(true)} style={{
                            position: 'relative', background: iconBg,
                            border: `1px solid ${iconBorder}`, borderRadius: 10,
                            width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: iconColor, transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,83,0.15)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.3)'; e.currentTarget.style.color = '#d4a853' }}
                            onMouseLeave={e => { e.currentTarget.style.background = iconBg; e.currentTarget.style.borderColor = iconBorder; e.currentTarget.style.color = iconColor }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {cartCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: -6, right: -6,
                                    background: 'linear-gradient(135deg, #d4a853, #c49530)',
                                    color: '#0a0a0a', borderRadius: '50%', width: 20, height: 20,
                                    fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid ${darkMode ? '#080808' : '#fafaf8'}`,
                                }}>{cartCount > 9 ? '9+' : cartCount}</span>
                            )}
                        </button>

                        {/* User menu */}
                        {user ? (
                            <div ref={userMenuRef} style={{ position: 'relative' }}>
                                <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{
                                    display: 'flex', alignItems: 'center', gap: 9,
                                    background: userBtnBg, border: `1px solid ${userBtnBorder}`,
                                    borderRadius: 10, padding: '7px 12px 7px 8px', cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,83,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.25)' }}
                                    onMouseLeave={e => { if (!userMenuOpen) { e.currentTarget.style.background = userBtnBg; e.currentTarget.style.borderColor = userBtnBorder } }}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #d4a853, #3d8b5e)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, color: '#0a0a0a', flexShrink: 0,
                                    }}>{(user.userName || 'U')[0].toUpperCase()}</div>
                                    <span style={{ color: userNameColor, fontSize: 13, fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.userName}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={darkMode ? 'rgba(245,239,230,0.5)' : 'rgba(30,24,20,0.4)'} strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>

                                {userMenuOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                        background: dropdownBg, border: `1px solid ${dropdownBorder}`,
                                        borderRadius: 12, overflow: 'hidden', minWidth: 180,
                                        boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,0.6)' : '0 16px 48px rgba(0,0,0,0.12)', zIndex: 10,
                                    }}>
                                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dropdownDivider}` }}>
                                            <div style={{ color: userNameColor, fontSize: 13, fontWeight: 600 }}>{user.userName}</div>
                                            <div style={{ color: darkMode ? 'rgba(245,239,230,0.4)' : 'rgba(30,24,20,0.4)', fontSize: 11, marginTop: 2 }}>Thành viên</div>
                                        </div>
                                        {[
                                            { label: '📦 Đơn hàng của tôi', path: '/my-orders' },
                                            { label: '⚙️ Cài đặt tài khoản', path: '/settings' },
                                        ].map(item => (
                                            <button key={item.path} onClick={() => { navigate(item.path); setUserMenuOpen(false) }} style={{
                                                display: 'block', width: '100%', padding: '10px 16px', background: 'none',
                                                border: 'none', color: dropdownText, fontSize: 13, textAlign: 'left',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,168,83,0.1)'; e.currentTarget.style.color = '#d4a853' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = dropdownText }}
                                            >{item.label}</button>
                                        ))}
                                        <div style={{ borderTop: `1px solid ${dropdownDivider}` }}>
                                            <button onClick={handleLogout} style={{
                                                display: 'block', width: '100%', padding: '10px 16px', background: 'none',
                                                border: 'none', color: '#e57373', fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                            >🚪 Đăng Xuất</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/auth" style={{
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7,
                                background: 'linear-gradient(135deg, #d4a853, #c49530)',
                                color: '#0a0a0a', padding: '9px 18px', borderRadius: 10,
                                fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
                                boxShadow: '0 4px 16px rgba(212,168,83,0.25)', transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,168,83,0.4)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,168,83,0.25)' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                Đăng Nhập
                            </Link>
                        )}

                        {/* Mobile hamburger */}
                        <button onClick={() => setMobileOpen(!mobileOpen)} style={{
                            display: 'none', background: 'none', border: 'none',
                            color: iconColor, cursor: 'pointer', padding: 6,
                        }} className="mobile-menu-btn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {mobileOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {showCart && <CartSidebar onClose={() => setShowCart(false)} />}

            <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          nav { display: none !important; }
        }
      `}</style>
        </>
    )
}