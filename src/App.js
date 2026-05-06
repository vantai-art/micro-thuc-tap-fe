// src/App.js
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StaffSettings from './pages/staff/StaffSettings'
import { AppProvider, useApp } from './contexts/AppContext'

import Header from './components/Header'

import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import ShopPage from './pages/ShopPage'
import UserAuthPage from './pages/UserAuthPage'
import CheckoutPage from './pages/CheckoutPage'
import UserOrdersPage from './pages/UserOrdersPage'
import UserSettings from './pages/UserSettings'

import AdminLogin from './pages/admin/AdminLogin'
import AdminLayoutWrapper from './pages/admin/AdminLayoutWrapper'

import StaffLoginPage from './pages/staff/StaffLoginPage'
import StaffPage from './pages/staff/StaffPage'
import StaffDashboard from './pages/staff/StaffDashboard'   // ← MỚI
import CustomerOrderPage from './pages/CustomerOrderPage'   // ← MỚI

import { SocketProvider } from './contexts/SocketContext'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

// ─── Protected Routes ────────────────────────────────────────────
function ProtectedUserRoute({ children }) {
    const { customerUser } = useApp()
    if (!customerUser) return <Navigate to="/auth" replace />
    return children
}

function ProtectedAdminRoute({ children }) {
    const { adminUser } = useApp()
    if (!adminUser) return <Navigate to="/admin/login" replace />
    if (adminUser.role !== 'ROLE_ADMIN') return <Navigate to="/admin/login" replace />
    return children
}

function ProtectedStaffRoute({ children }) {
    const { staffUser } = useApp()
    if (!staffUser) return <Navigate to="/staff/login" replace />
    if (staffUser.role !== 'ROLE_STAFF' && staffUser.role !== 'ROLE_ADMIN') {
        return <Navigate to="/staff/login" replace />
    }
    return children
}

function UserAuthGuard({ children }) {
    const { customerUser } = useApp()
    if (customerUser) return <Navigate to="/" replace />
    return children
}

function AdminLoginGuard({ children }) {
    const { adminUser } = useApp()
    if (adminUser?.role === 'ROLE_ADMIN') return <Navigate to="/admin" replace />
    return children
}

function StaffLoginGuard({ children }) {
    const { staffUser } = useApp()
    if (staffUser?.role === 'ROLE_STAFF' || staffUser?.role === 'ROLE_ADMIN') {
        return <Navigate to="/staff" replace />
    }
    return children
}

// ─── Routes ─────────────────────────────────────────────────────
function AppRoutes() {
    return (
        <>
            {/* Header ẩn ở admin/staff/order */}
            <Routes>
                <Route path="/admin/*" element={null} />
                <Route path="/staff/*" element={null} />
                <Route path="/order" element={null} />     {/* ← ẩn header ở trang khách */}
                <Route path="*" element={<Header />} />
            </Routes>

            <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/shop" element={<ShopPage />} />

                {/* User auth */}
                <Route path="/auth" element={
                    <UserAuthGuard><UserAuthPage /></UserAuthGuard>
                } />

                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* User protected */}
                <Route path="/checkout" element={
                    <ProtectedUserRoute><CheckoutPage /></ProtectedUserRoute>
                } />
                <Route path="/my-orders" element={
                    <ProtectedUserRoute><UserOrdersPage /></ProtectedUserRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedUserRoute><UserSettings /></ProtectedUserRoute>
                } />

                {/* Admin login */}
                <Route path="/admin/login" element={
                    <AdminLoginGuard><AdminLogin /></AdminLoginGuard>
                } />

                {/* Admin panel */}
                <Route path="/admin" element={<ProtectedAdminRoute><AdminLayoutWrapper page="dashboard" /></ProtectedAdminRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminLayoutWrapper page="dashboard" /></ProtectedAdminRoute>} />
                <Route path="/admin/products" element={<ProtectedAdminRoute><AdminLayoutWrapper page="products" /></ProtectedAdminRoute>} />
                <Route path="/admin/categories" element={<ProtectedAdminRoute><AdminLayoutWrapper page="categories" /></ProtectedAdminRoute>} />
                <Route path="/admin/tables" element={<ProtectedAdminRoute><AdminLayoutWrapper page="tables" /></ProtectedAdminRoute>} />
                <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminLayoutWrapper page="orders" /></ProtectedAdminRoute>} />
                <Route path="/admin/revenue" element={<ProtectedAdminRoute><AdminLayoutWrapper page="revenue" /></ProtectedAdminRoute>} />
                <Route path="/admin/users" element={<ProtectedAdminRoute><AdminLayoutWrapper page="users" /></ProtectedAdminRoute>} />
                <Route path="/admin/staff" element={<ProtectedAdminRoute><AdminLayoutWrapper page="staff" /></ProtectedAdminRoute>} />
                <Route path="/admin/activity" element={<ProtectedAdminRoute><AdminLayoutWrapper page="activity" /></ProtectedAdminRoute>} />
                <Route path="/admin/promotions" element={<ProtectedAdminRoute><AdminLayoutWrapper page="promotions" /></ProtectedAdminRoute>} />
                <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminLayoutWrapper page="settings" /></ProtectedAdminRoute>} />

                {/* Staff cũ — GIỮ NGUYÊN */}
                <Route path="/staff/login" element={
                    <StaffLoginGuard><StaffLoginPage /></StaffLoginGuard>
                } />
                <Route path="/staff" element={
                    <ProtectedStaffRoute><StaffPage /></ProtectedStaffRoute>
                } />
                <Route path="/staff/settings" element={
                    <ProtectedStaffRoute><StaffSettings /></ProtectedStaffRoute>
                } />

                {/* ── Dine-in MỚI — TÁCH BIỆT hoàn toàn ── */}
                <Route path="/staff/dashboard" element={
                    <ProtectedStaffRoute><StaffDashboard /></ProtectedStaffRoute>
                } />
                {/* Khách scan QR → không cần đăng nhập */}
                <Route path="/order" element={<CustomerOrderPage />} />

                {/* 404 */}
                <Route path="*" element={
                    <div style={{
                        minHeight: '80vh', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexDirection: 'column', gap: 16,
                        background: '#0a0a0a',
                    }}>
                        <div style={{ fontSize: 72, color: '#5a5550' }}>404</div>
                        <p style={{ color: '#8a8580' }}>Trang không tồn tại</p>
                        <a href="/" style={{
                            background: '#d4a853', color: '#0a0a0a',
                            padding: '10px 24px', borderRadius: 8,
                            textDecoration: 'none', fontWeight: 700,
                        }}>Về trang chủ</a>
                    </div>
                } />
            </Routes>
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AppProvider>
                <SocketProvider>
                    <AppRoutes />
                </SocketProvider>
            </AppProvider>
        </BrowserRouter>
    )
}