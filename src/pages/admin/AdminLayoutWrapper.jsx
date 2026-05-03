// src/pages/admin/AdminLayoutWrapper.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AdminLayout from './AdminLayout'

const PATH_TO_PAGE = {
    '/admin': 'dashboard',
    '/admin/dashboard': 'dashboard',
    '/admin/products': 'products',
    '/admin/categories': 'categories',
    '/admin/tables': 'tables',
    '/admin/orders': 'orders',
    '/admin/revenue': 'revenue',
    '/admin/users': 'users',
    '/admin/staff': 'staff',
    '/admin/activity': 'activity',
    '/admin/promotions': 'promotions',
    '/admin/settings': 'settings',
}

const PAGE_TO_PATH = {
    dashboard: '/admin/dashboard',
    products: '/admin/products',
    categories: '/admin/categories',
    tables: '/admin/tables',
    orders: '/admin/orders',
    revenue: '/admin/revenue',
    users: '/admin/users',
    staff: '/admin/staff',
    activity: '/admin/activity',
    promotions: '/admin/promotions',
    settings: '/admin/settings',
}

export default function AdminLayoutWrapper({ page }) {
    const navigate = useNavigate()
    const location = useLocation()
    const pageFromUrl = PATH_TO_PAGE[location.pathname] || page || 'dashboard'
    const [currentPage, setCurrentPage] = useState(pageFromUrl)

    useEffect(() => {
        const p = PATH_TO_PAGE[location.pathname]
        if (p && p !== currentPage) setCurrentPage(p)
    }, [location.pathname])

    const handleSetPage = (p) => {
        setCurrentPage(p)
        const path = PAGE_TO_PATH[p] || '/admin'
        if (location.pathname !== path) navigate(path, { replace: true })
    }

    return <AdminLayout currentPage={currentPage} setCurrentPage={handleSetPage} />
}
