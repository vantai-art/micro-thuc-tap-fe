// src/services/api.js
import axios from 'axios'
import Logger from '../utils/logger'
const BASE = 'http://localhost:8080'

export const http = axios.create({
    baseURL: BASE,
    withCredentials: true,
    timeout: 10000,
})

// Interceptor request
http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token') ||
            localStorage.getItem('staff_token') ||
            localStorage.getItem('user_token') ||
            localStorage.getItem('jwt_token')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Sử dụng logger thay vì console.log trực tiếp
        Logger.api(config.method, config.url, config.data)

        return config
    },
    (error) => {
        Logger.error('Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// Interceptor response
http.interceptors.response.use(
    (response) => {
        Logger.api(response.config.method, response.config.url, null, response.status)
        return response
    },
    (error) => {
        // Log error nhưng không lộ chi tiết
        Logger.error(`${error.config?.method?.toUpperCase()} ${error.config?.url} failed:`,
            error.response?.status)

        // Xử lý 401 (giữ nguyên logic)
        if (error.response?.status === 401) {
            const tokens = ['admin_token', 'staff_token', 'user_token', 'jwt_token']
            tokens.forEach(t => localStorage.removeItem(t))

            const path = window.location.pathname
            if (path.includes('/admin')) {
                window.location.href = '/admin/login'
            } else if (path.includes('/staff')) {
                window.location.href = '/staff/login'
            } else if (path.includes('/checkout') || path.includes('/my-orders')) {
                window.location.href = '/auth'
            }
        }

        return Promise.reject(error)
    }
)

// ─── Auth local helpers ──────────────────────────────────────────
export const getUser = (role) => {
    const key = role === 'ROLE_ADMIN' ? 'admin_user' : role === 'ROLE_STAFF' ? 'staff_user' : 'customer_user'
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
}
export const setUser = (u) => {
    const role = u?.role || 'ROLE_USER'
    const key = role === 'ROLE_ADMIN' ? 'admin_user' : role === 'ROLE_STAFF' ? 'staff_user' : 'customer_user'
    localStorage.setItem(key, JSON.stringify(u))
}
export const removeUser = (role) => {
    if (role === 'ROLE_ADMIN') localStorage.removeItem('admin_user')
    else if (role === 'ROLE_STAFF') localStorage.removeItem('staff_user')
    else { localStorage.removeItem('customer_user'); localStorage.removeItem('cartId') }
}
export const getCartId = () => localStorage.getItem('cartId') || ''
export const setCartId = (id) => localStorage.setItem('cartId', String(id))

// ─── USER SERVICE ─────────────────────────────────────────────────
export const login = (userName, userPassword) =>
    http.post('/login', { userName, userPassword })
export const register = (body) => http.post('/registration', body)
export const getUsers = () => http.get('/users')
export const getUserByName = (name) => http.get('/users', { params: { name } })
export const getUserById = (id) => http.get(`/users/${id}`)
export const updateUser = (id, body) => http.put(`/users/${id}`, body)
export const deleteUser = (id) => http.delete(`/users/${id}`)
export const createAdmin = (body) => http.post('/users/admin', body)
export const createStaff = (body) => http.post('/users/staff', body)
export const getAdmins = () => http.get('/users/admins')
export const getStaffs = () => http.get('/users/staffs')
export const createRole = (body) => http.post('/roles', body)
export const getRoles = () => http.get('/roles')

// ─── PRODUCT SERVICE ──────────────────────────────────────────────
export const getProducts = () => http.get('/products')
export const getProductsByCategory = (category) =>
    http.get('/products', { params: { category } })
export const getProductsByName = (name) =>
    http.get('/products', { params: { name } })
export const getProductById = (id) => http.get(`/products/${id}`)

// Admin product CRUD — gửi header X-Performed-By & X-Role để ghi ActivityLog
export const createProduct = (body, performedBy = 'unknown', role = 'ADMIN') =>
    http.post('/admin/products', body, {
        headers: { 'X-Performed-By': performedBy, 'X-Role': role }
    })
export const updateProduct = (id, body, performedBy = 'unknown', role = 'ADMIN') =>
    http.put(`/admin/products/${id}`, body, {
        headers: { 'X-Performed-By': performedBy, 'X-Role': role }
    })
export const deleteProduct = (id, performedBy = 'unknown', role = 'ADMIN') =>
    http.delete(`/admin/products/${id}`, {
        headers: { 'X-Performed-By': performedBy, 'X-Role': role }
    })

// ─── PRODUCT IMAGE (upload / delete) ─────────────────────────────
export const uploadProductImage = (id, file, performedBy = 'unknown', role = 'ADMIN') => {
    const fd = new FormData()
    fd.append('file', file)
    return http.post(`/admin/products/${id}/image`, fd, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Performed-By': performedBy,
            'X-Role': role,
        }
    })
}
export const deleteProductImage = (id, performedBy = 'unknown', role = 'ADMIN') =>
    http.delete(`/admin/products/${id}/image`, {
        headers: { 'X-Performed-By': performedBy, 'X-Role': role }
    })

// ─── ACTIVITY LOG ────────────────────────────────────────────────
export const getActivityLogs = (params = {}) =>
    http.get('/admin/logs', { params })
export const getLogsByAction = (action) =>
    http.get('/admin/logs', { params: { action } })
export const getLogsByUser = (performedBy) =>
    http.get('/admin/logs', { params: { performedBy } })
export const getLogsByRole = (role) =>
    http.get('/admin/logs', { params: { role } })
export const getLogsByProduct = (productId) =>
    http.get('/admin/logs', { params: { productId } })

// ─── CART SERVICE ─────────────────────────────────────────────────
export const getCart = (cartId) =>
    http.get('/cart', { headers: { Cookie: cartId } })
export const addToCart = (cartId, productId, quantity) =>
    http.post('/cart', null, {
        params: { productId, quantity },
        headers: { Cookie: cartId },
    })
export const removeFromCart = (cartId, productId) =>
    http.delete('/cart', {
        params: { productId },
        headers: { Cookie: cartId },
    })

// ─── ORDER SERVICE (FIXED) ────────────────────────────────────────
// Thử nhiều endpoint khác nhau để tương thích với backend
export const getOrders = () => http.get('/order')
export const getOrdersAlt = () => http.get('/api/orders') // Alternative endpoint
export const getOrdersV2 = () => http.get('/orders') // Another alternative

// Smart fetch - tự động thử các endpoint
export const getOrdersSmart = async () => {
    const endpoints = ['/order', '/api/orders', '/orders']
    let lastError = null

    for (const endpoint of endpoints) {
        try {
            const response = await http.get(endpoint)
            return response
        } catch (error) {
            lastError = error
            console.warn(`Endpoint ${endpoint} failed:`, error.response?.status)
        }
    }
    throw lastError
}

export const getOrderById = (id) => http.get(`/order/${id}`)
export const getOrdersByUser = (userId) => http.get(`/order/user/${userId}`)
export const placeOrder = (userId, cartId) =>
    http.post(`/order/${userId}`, null, { headers: { Cookie: cartId } })
export const updateOrderStatus = (id, status) =>
    http.put(`/order/${id}/status`, { status })
export const deleteOrder = (id) => http.delete(`/order/${id}`)

// ─── PAYMENT SERVICE ──────────────────────────────────────────────
export const getPayments = () => http.get('/api/payments')
export const getPaymentById = (id) => http.get(`/api/payments/${id}`)
export const getPaymentsByOrder = (orderId) =>
    http.get(`/api/payments/order/${orderId}`)
export const getPaymentsByUser = (userId) =>
    http.get(`/api/payments/user/${userId}`)
export const createPayment = (body) => http.post('/api/payments', body)
export const processPayment = (id) => http.post(`/api/payments/${id}/process`)
export const refundPayment = (body) => http.post('/api/payments/refund', body)
export const updatePaymentStatus = (id, body) =>
    http.put(`/api/payments/${id}/status`, body)
export const createVNPayUrl = (body) =>
    http.post('/api/payments/vnpay/create', body)

// ─── REVENUE SERVICE ──────────────────────────────────────────────
export const getRevenueSummary = () => http.get('/api/revenue/summary')
export const getRevenueToday = () => http.get('/api/revenue/today')
export const getRevenueByDay = (date) =>
    http.get('/api/revenue/by-day', { params: { date } })
export const getRevenueByMonth = (year, month) =>
    http.get('/api/revenue/by-month', { params: { year, month } })
export const getRevenueByYear = (year) =>
    http.get('/api/revenue/by-year', { params: { year } })
export const getRevenueByRange = (from, to) =>
    http.get('/api/revenue/range', { params: { from, to } })
export const getRevenueChartDaily = (year, month) =>
    http.get('/api/revenue/chart/daily', { params: { year, month } })
export const getRevenueChartMonthly = (year) =>
    http.get('/api/revenue/chart/monthly', { params: { year } })

// ─── SETTING SERVICE ──────────────────────────────────────────────
export const getGlobalSettings = () => http.get('/settings/global')
export const updateGlobalSettings = (settings) =>
    http.put('/settings/global', { settings })
export const getStoreSettings = () => http.get('/settings/store')
export const updateStoreSettings = (settings) =>
    http.put('/settings/store', { settings })
export const getAdminSettings = (adminId) =>
    http.get(`/settings/admin/${adminId}`)
export const updateAdminSettings = (adminId, settings) =>
    http.put(`/settings/admin/${adminId}`, { settings })
export const getStaffSettings = (staffId) =>
    http.get(`/settings/staff/${staffId}`)
export const updateStaffSettings = (staffId, settings) =>
    http.put(`/settings/staff/${staffId}`, { settings })
export const initStaffSettings = (staffId) =>
    http.post(`/settings/staff/${staffId}/init`)
export const resetStaffSettingsApi = (staffId) =>
    http.delete(`/settings/staff/${staffId}/reset`)
export const getUserSettingsApi = (userId) =>
    http.get(`/settings/user/${userId}`)
export const updateUserSettingsApi = (userId, settings) =>
    http.put(`/settings/user/${userId}`, { settings })
export const initUserSettings = (userId) =>
    http.post(`/settings/user/${userId}/init`)
export const resetUserSettingsApi = (userId) =>
    http.delete(`/settings/user/${userId}/reset`)

// ─── TABLE SERVICE ────────────────────────────────────────────────
export const getTables = () => http.get('/tables')
export const getAvailableTables = () => http.get('/tables/available')
export const getTableById = (id) => http.get(`/tables/${id}`)
export const createTable = (body) => http.post('/tables', body)
export const updateTable = (id, body) => http.put(`/tables/${id}`, body)
export const updateTableStatus = (id, status) => http.put(`/tables/${id}/status`, { status })
export const deleteTable = (id) => http.delete(`/tables/${id}`)

// ─── TABLE ORDER (Staff POS) ──────────────────────────────────────
export const createTableOrder = (body) => http.post('/order/table', body)
export const checkoutOrder = (orderId) => http.post(`/order/${orderId}/checkout`)

export default http