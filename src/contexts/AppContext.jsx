// src/contexts/AppContext.jsx
// FIX: Tách localStorage key theo role để admin/staff/user không conflict nhau
//   - admin  → localStorage['admin_user']
//   - staff  → localStorage['staff_user']
//   - user   → localStorage['customer_user']
// FIX: Tách giỏ hàng riêng cho staff và customer (staff_cart, customer_cart)
// FIX: Global darkMode + themeColor — áp dụng toàn app qua CSS variables

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080'

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
})

// ─── Theme helpers ───────────────────────────────────────────────
const THEME_KEY = 'app_darkMode'
const COLOR_KEY = 'app_themeColor'
const DEFAULT_COLOR = '#D97706'

// Key theo userId để mỗi user có setting riêng
const themeKey = (userId) => userId ? `app_darkMode_${userId}` : THEME_KEY
const colorKey = (userId) => userId ? `app_themeColor_${userId}` : COLOR_KEY

function applyTheme(darkMode, themeColor) {
    const root = document.documentElement
    root.style.setProperty('--theme-color', themeColor || DEFAULT_COLOR)
    if (darkMode) {
        root.classList.add('dark')
        root.setAttribute('data-theme', 'dark')
    } else {
        root.classList.remove('dark')
        root.setAttribute('data-theme', 'light')
    }
}

// ─── Per-role storage keys ───────────────────────────────────────
const KEY_ADMIN = 'admin_user'
const KEY_STAFF = 'staff_user'
const KEY_CUSTOMER = 'customer_user'
const KEY_STAFF_CART = 'staff_cart'
const KEY_CUSTOMER_CART = 'customer_cart'

const getStoredUser = (key) => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null }
    catch { return null }
}

const AppCtx = createContext(null)

export function AppProvider({ children }) {
    const [adminUser, setAdminUser] = useState(() => getStoredUser(KEY_ADMIN))
    const [staffUser, setStaffUser] = useState(() => getStoredUser(KEY_STAFF))
    const [customerUser, setCustomerUser] = useState(() => getStoredUser(KEY_CUSTOMER))

    // ============================================
    // 🎨 GLOBAL THEME — dark mode + accent color (per-user)
    // ============================================
    const [darkMode, setDarkModeState] = useState(() => {
        try {
            const stored = getStoredUser(KEY_CUSTOMER)
            const key = stored?.id ? themeKey(stored.id) : THEME_KEY
            return localStorage.getItem(key) === 'true'
        } catch { return false }
    })
    const [themeColor, setThemeColorState] = useState(() => {
        try {
            const stored = getStoredUser(KEY_CUSTOMER)
            const key = stored?.id ? colorKey(stored.id) : COLOR_KEY
            return localStorage.getItem(key) || DEFAULT_COLOR
        } catch { return DEFAULT_COLOR }
    })

    // Apply theme on mount + whenever state changes
    useEffect(() => {
        applyTheme(darkMode, themeColor)
    }, [darkMode, themeColor])

    // Khi customerUser thay đổi (login/logout) → load theme của user đó
    useEffect(() => {
        const userId = customerUser?.id
        try {
            const dm = localStorage.getItem(themeKey(userId)) === 'true'
            const tc = localStorage.getItem(colorKey(userId)) || DEFAULT_COLOR
            setDarkModeState(dm)
            setThemeColorState(tc)
        } catch { }
    }, [customerUser?.id])

    const setDarkMode = useCallback((val) => {
        const userId = customerUser?.id
        localStorage.setItem(themeKey(userId), String(val))
        setDarkModeState(val)
    }, [customerUser?.id])

    const setThemeColor = useCallback((color) => {
        const userId = customerUser?.id
        localStorage.setItem(colorKey(userId), color)
        setThemeColorState(color)
    }, [customerUser?.id])

    // ============================================
    // 🛒 GIỎ HÀNG RIÊNG BIỆT CHO TỪNG ROLE
    // ============================================
    const [staffCart, setStaffCart] = useState(() => {
        try {
            const saved = localStorage.getItem(KEY_STAFF_CART)
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    const [customerCart, setCustomerCart] = useState(() => {
        try {
            const saved = localStorage.getItem(KEY_CUSTOMER_CART)
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    // Lưu vào localStorage khi thay đổi
    useEffect(() => {
        localStorage.setItem(KEY_STAFF_CART, JSON.stringify(staffCart))
    }, [staffCart])

    useEffect(() => {
        localStorage.setItem(KEY_CUSTOMER_CART, JSON.stringify(customerCart))
    }, [customerCart])

    // Cart actions — dùng setStaffCart/setCustomerCart trực tiếp để tránh stale closure — dùng setStaffCart/setCustomerCart trực tiếp để tránh stale closure
    const addToCart = useCallback((product, qty = 1) => {
        const setter = staffUser ? setStaffCart : customerUser ? setCustomerCart : null
        if (!setter) return
        setter(prev => {
            const existing = prev.find(i => i.id === product.id)
            if (existing) {
                return prev.map(i => i.id === product.id
                    ? { ...i, quantity: i.quantity + qty }
                    : i)
            }
            return [...prev, { ...product, quantity: qty }]
        })
    }, [staffUser, customerUser])

    const removeFromCart = useCallback((id) => {
        const setter = staffUser ? setStaffCart : customerUser ? setCustomerCart : null
        if (!setter) return
        setter(prev => prev.filter(i => i.id !== id))
    }, [staffUser, customerUser])

    const updateQuantity = useCallback((id, qty) => {
        const setter = staffUser ? setStaffCart : customerUser ? setCustomerCart : null
        if (!setter) return
        if (qty <= 0) {
            setter(prev => prev.filter(i => i.id !== id))
        } else {
            setter(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i))
        }
    }, [staffUser, customerUser])

    const clearCart = useCallback(() => {
        if (staffUser) setStaffCart([])
        else if (customerUser) setCustomerCart([])
    }, [staffUser, customerUser])

    // Computed values cho cart hiện tại — dùng useMemo để đảm bảo reactive
    const cart = useMemo(() => {
        if (staffUser) return staffCart
        if (customerUser) return customerCart
        return []
    }, [staffUser, customerUser, staffCart, customerCart])

    const cartTotal = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart])
    const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart])

    // ── login: lưu đúng key theo role ─────────────────────────────
    const login = useCallback((userData) => {
        const role = userData?.role || 'ROLE_USER'
        if (role === 'ROLE_ADMIN') {
            localStorage.setItem(KEY_ADMIN, JSON.stringify(userData))
            setAdminUser(userData)
        } else if (role === 'ROLE_STAFF') {
            localStorage.setItem(KEY_STAFF, JSON.stringify(userData))
            setStaffUser(userData)
        } else {
            localStorage.setItem(KEY_CUSTOMER, JSON.stringify(userData))
            setCustomerUser(userData)
        }
    }, [])

    // ── logout: xoá đúng key theo role ────────────────────────────
    const logout = useCallback((role) => {
        if (role === 'ROLE_ADMIN') {
            localStorage.removeItem(KEY_ADMIN)
            setAdminUser(null)
        } else if (role === 'ROLE_STAFF') {
            localStorage.removeItem(KEY_STAFF)
            setStaffUser(null)
            // KHÔNG xóa staff_cart để giữ lại khi login lại
        } else {
            localStorage.removeItem(KEY_CUSTOMER)
            localStorage.removeItem(KEY_CUSTOMER_CART)
            setCustomerUser(null)
        }
    }, [])

    const logoutAll = useCallback(() => {
        localStorage.removeItem(KEY_ADMIN)
        localStorage.removeItem(KEY_STAFF)
        localStorage.removeItem(KEY_CUSTOMER)
        localStorage.removeItem(KEY_STAFF_CART)
        localStorage.removeItem(KEY_CUSTOMER_CART)
        setAdminUser(null)
        setStaffUser(null)
        setCustomerUser(null)
    }, [])

    const isAdmin = adminUser?.role === 'ROLE_ADMIN'
    const isStaff = staffUser?.role === 'ROLE_STAFF'
    const isUser = customerUser?.role === 'ROLE_USER'

    // ── Products ──────────────────────────────────────────────────
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchProducts = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await axiosInstance.get('/products')
            const list = Array.isArray(res.data) ? res.data : []
            setProducts(list.map(p => ({
                ...p,
                name: p.productName ?? p.name ?? '',
                description: p.discription ?? p.description ?? '',
                category: typeof p.category === 'string' ? { name: p.category } : (p.category ?? { name: 'Khác' }),
                imageUrl: p.imageUrl ?? p.image ?? '',
                price: Number(p.price ?? 0),
                stockQuantity: p.availability ?? p.stockQuantity ?? 0,
            })))
        } catch (err) {
            console.error('Lỗi tải sản phẩm:', err)
            setError('Không thể tải danh sách sản phẩm')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    // ── Tables ────────────────────────────────────────────────────
    const [tables, setTables] = useState([])

    // ── Toast ──────────────────────────────────────────────────────
    const [toast, setToast] = useState(null)
    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type, id: Date.now() })
        setTimeout(() => setToast(null), 3000)
    }, [])

    // ── Create order (chỉ tạo order, KHÔNG clear cart — dùng cho VNPay) ──
    const createOrderOnly = useCallback(async () => {
        if (!customerUser) throw new Error('Chưa đăng nhập')
        if (cart.length === 0) throw new Error('Giỏ hàng trống')
        const cartItems = cart.map(item => ({
            productId: item.id, productName: item.name ?? '', price: item.price, quantity: item.quantity,
        }))
        const res = await axiosInstance.post(`/order/${customerUser.id}/direct`, cartItems)
        return res.data
    }, [customerUser, cart, axiosInstance])

    // ── Create order COD (tạo order + clear cart — dùng cho thanh toán khi nhận hàng) ──
    const createOrder = useCallback(async () => {
        if (!customerUser) throw new Error('Chưa đăng nhập')
        if (cart.length === 0) throw new Error('Giỏ hàng trống')
        const cartItems = cart.map(item => ({
            productId: item.id, productName: item.name ?? '', price: item.price, quantity: item.quantity,
        }))
        const res = await axiosInstance.post(`/order/${customerUser.id}/direct`, cartItems)
        clearCart(); showToast('Đặt hàng thành công!', 'success')
        return res.data
    }, [customerUser, cart, clearCart, showToast, axiosInstance])

    // ─── Create table order (cho staff) ────────────────────────────
    const createTableOrder = useCallback(async (tableId, customerName, items) => {
        const res = await axiosInstance.post('/order/table', {
            tableId,
            customerName: customerName || 'Khách lẻ',
            items: items.map(i => ({
                productId: i.id,
                productName: i.name,
                price: i.price,
                quantity: i.quantity
            }))
        })
        return res.data?.data || res.data
    }, [axiosInstance])

    // Interceptor để log (debug)
    axiosInstance.interceptors.response.use(
        response => {
            console.log('Response for', response.config.url, ':', response.status)
            return response
        },
        error => {
            console.error('Error:', error.response?.status, error.response?.config?.url)
            return Promise.reject(error)
        }
    )

    // Expose setCart cho customerCart (dùng trong SocketContext để sync real-time)
    const setCart = useCallback((cartOrUpdater) => {
        setCustomerCart(cartOrUpdater)
    }, [])

    const value = {
        // User info
        user: customerUser,
        adminUser,
        staffUser,
        customerUser,
        login,
        logout,
        logoutAll,
        isAdmin,
        isStaff,
        isUser,
        // 🎨 Theme (global — dùng ở mọi trang)
        darkMode,
        themeColor,
        setDarkMode,
        setThemeColor,
        // Products
        products,
        loading,
        error,
        fetchProducts,
        // Tables
        tables,
        setTables,
        // Cart - dùng chung interface nhưng data riêng theo role
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        // Expose setCart trực tiếp để SocketContext sync real-time
        setCart,
        // Orders
        createOrder,
        createOrderOnly,
        createTableOrder,
        // Utils
        showToast,
        axiosInstance,
        // Expose riêng cho debug (nếu cần)
        staffCart,
        customerCart,
    }

    return (
        <AppCtx.Provider value={value}>
            {children}
            {toast && <Toast toast={toast} />}
        </AppCtx.Provider>
    )
}

export const useApp = () => useContext(AppCtx)
export const useAppContext = () => useContext(AppCtx)

function Toast({ toast }) {
    const colors = { success: '#3d8b5e', error: '#c0392b', info: '#2980b9', warning: '#d4a853' }
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: '#1a1a1a', border: `1px solid ${colors[toast.type] || colors.success}`,
            borderLeft: `4px solid ${colors[toast.type] || colors.success}`,
            borderRadius: 8, padding: '12px 20px', color: '#f0ede6',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'slideIn 0.2s ease',
        }}>
            {toast.msg}
            <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
        </div>
    )
}