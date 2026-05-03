// src/pages/admin/AdminLayout.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    LogOut, Menu, X, LayoutDashboard, Package,
    ShoppingBag, FolderOpen, Users, Shield,
    Settings, Coffee, Tag, ChevronRight,
    DollarSign, ClipboardList, LayoutGrid
} from 'lucide-react'
import { useAppContext } from '../../contexts/AppContext'

import AdminDashboard from './AdminDashboard'
import AdminProducts from './AdminProducts'
import AdminCategories from './AdminCategories'
import AdminOrders from './AdminOrders'
import AdminUsers from './AdminUsers'
import AdminStaff from './AdminStaff'
import AdminPromotions from './AdminPromotions'
import AdminSettings from './AdminSettings'
import AdminRevenue from './AdminRevenue'
import AdminTable from './AdminTable'
import AdminActivityLog from './AdminActivityLog'

const MENU = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard, color: '#f59e0b' },
    { id: 'products', label: 'Sản Phẩm', icon: Package, color: '#3b82f6' },
    { id: 'categories', label: 'Danh Mục', icon: FolderOpen, color: '#f59e0b' },
    { id: 'tables', label: 'Quản Lý Bàn', icon: LayoutGrid, color: '#f59e0b' },
    { id: 'orders', label: 'Đơn Hàng', icon: ShoppingBag, color: '#22c55e' },
    { id: 'revenue', label: 'Doanh Thu', icon: DollarSign, color: '#10b981' },
    { id: 'users', label: 'Khách Hàng', icon: Users, color: '#8b5cf6' },
    { id: 'staff', label: 'Nhân Viên', icon: Shield, color: '#06b6d4' },
    { id: 'activity', label: 'Nhật Ký', icon: ClipboardList, color: '#f97316' },
    { id: 'promotions', label: 'Khuyến Mãi', icon: Tag, color: '#ec4899' },
    { id: 'settings', label: 'Cài Đặt', icon: Settings, color: '#6b7280' },
]

function AdminLayout({ currentPage, setCurrentPage }) {
    const navigate = useNavigate()
    const { adminUser, logout, darkMode } = useAppContext?.() || {}
    const [sidebarOpen, setSidebarOpen] = useState(true)

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
            logout('ROLE_ADMIN')
            navigate('/admin/login')
        }
    }

    const renderContent = () => {
        switch (currentPage) {
            case 'dashboard': return <AdminDashboard />
            case 'products': return <AdminProducts />
            case 'categories': return <AdminCategories />
            case 'tables': return <AdminTable />
            case 'orders': return <AdminOrders />
            case 'revenue': return <AdminRevenue />
            case 'users': return <AdminUsers />
            case 'staff': return <AdminStaff />
            case 'activity': return <AdminActivityLog />
            case 'promotions': return <AdminPromotions />
            case 'settings': return <AdminSettings />
            default: return <AdminDashboard />
        }
    }

    const currentMenu = MENU.find(m => m.id === currentPage) || MENU[0]

    // ── Màu theo darkMode ──────────────────────────────────────────
    const bg = darkMode ? '#111827' : '#f0f2f5'
    const surface = darkMode ? '#1f2937' : '#ffffff'
    const border = darkMode ? '#374151' : '#e5e7eb'
    const textPri = darkMode ? '#f9fafb' : '#111827'
    const textSec = darkMode ? '#9ca3af' : '#6b7280'
    const navHover = darkMode ? '#374151' : '#f3f4f6'
    const navHoverText = darkMode ? '#f9fafb' : '#111827'

    return (
        <div style={{ minHeight: '100vh', background: bg, display: 'flex', fontFamily: '"DM Sans", system-ui, sans-serif', transition: 'background 0.2s' }}>

            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? 240 : 68,
                background: surface, borderRight: `1px solid ${border}`,
                position: 'fixed', top: 0, left: 0, bottom: 0,
                zIndex: 40, display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease, background 0.2s', overflow: 'hidden',
            }}>
                {/* Logo */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
                    {sidebarOpen && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(var(--theme-rgb,245,158,11),0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Coffee size={18} color="var(--theme-color, #f59e0b)" />
                            </div>
                            <div>
                                <div style={{ color: textPri, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>COFFEE BLEND</div>
                                <div style={{ color: textSec, fontSize: 10 }}>Admin Panel</div>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(v => !v)}
                        style={{ background: 'none', border: 'none', color: textSec, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {MENU.map(item => {
                        const Icon = item.icon
                        const active = currentPage === item.id
                        return (
                            <button key={item.id} onClick={() => setCurrentPage(item.id)}
                                title={!sidebarOpen ? item.label : ''}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center',
                                    gap: 10, padding: sidebarOpen ? '10px 12px' : '10px 0',
                                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                    background: active ? `${item.color}18` : 'none',
                                    border: active ? `1px solid ${item.color}44` : '1px solid transparent',
                                    borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                                    color: active ? item.color : textSec,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = navHover; e.currentTarget.style.color = navHoverText } }}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = textSec } }}
                            >
                                <Icon size={18} style={{ flexShrink: 0 }} />
                                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: '10px 8px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                    <button onClick={handleLogout} title={!sidebarOpen ? 'Đăng xuất' : ''}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen ? '10px 12px' : '10px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center', background: 'none', border: '1px solid transparent', borderRadius: 8, cursor: 'pointer', color: '#ef4444', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' }}>
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 500 }}>Đăng Xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 68, transition: 'margin-left 0.25s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Topbar */}
                <header style={{ height: 64, background: surface, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30, transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: textSec, fontSize: 13 }}>Admin</span>
                        <ChevronRight size={14} color={border} />
                        <span style={{ color: currentMenu.color, fontSize: 14, fontWeight: 600 }}>{currentMenu.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: textPri, fontSize: 13, fontWeight: 600 }}>{adminUser?.userName || 'Admin'}</div>
                            <div style={{ color: textSec, fontSize: 11 }}>
                                {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </div>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(var(--theme-rgb,245,158,11),0.2)', border: '2px solid rgba(var(--theme-rgb,245,158,11),0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-color, #f59e0b)', fontWeight: 700, fontSize: 14 }}>
                            {(adminUser?.userName || 'A')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div style={{ flex: 1, background: bg, transition: 'background 0.2s' }}>
                    {renderContent()}
                </div>
            </main>
        </div>
    )
}

export default AdminLayout