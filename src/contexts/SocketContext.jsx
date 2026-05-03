// src/contexts/SocketContext.jsx
// FIX 1: Socket chỉ khởi tạo MỘT LẦN (không phụ thuộc vào objects user/staffUser/customerUser)
//         → tránh reconnect liên tục mỗi khi AppContext re-render
// FIX 2: Dùng useRef để lưu user IDs thay vì object → dependency ổn định hơn
// FIX 3: Thêm polling fallback khi WebSocket không available
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import io from 'socket.io-client'
import { useApp } from './AppContext'

const SocketContext = createContext(null)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080'

export const useSocket = () => {
    const context = useContext(SocketContext)
    if (!context) throw new Error('useSocket must be used within SocketProvider')
    return context
}

export const SocketProvider = ({ children }) => {
    const { user, staffUser, customerUser, addToCart, setCart, showToast, fetchProducts } = useApp()
    const [socket, setSocket] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [liveOrders, setLiveOrders] = useState([])
    const [liveNotifications, setLiveNotifications] = useState([])
    const socketRef = useRef(null)

    // FIX: Dùng ref để lưu thông tin user → tránh effect phụ thuộc vào object reference
    const userInfoRef = useRef({ user, staffUser, customerUser })
    useEffect(() => {
        userInfoRef.current = { user, staffUser, customerUser }
    }, [user, staffUser, customerUser])

    // FIX: Chỉ tạo socket MỘT LẦN duy nhất — không có dependencies thay đổi
    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            // FIX: Thử polling trước rồi mới upgrade lên websocket
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            timeout: 5000,
        })

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id)
            setIsConnected(true)

            const { user: u, staffUser: su, customerUser: cu } = userInfoRef.current
            if (su) {
                newSocket.emit('join-staff', { staffId: su.id, name: su.userName, role: 'STAFF' })
            } else if (cu) {
                newSocket.emit('join-user', { userId: cu.id, name: cu.userName, role: 'USER' })
            } else if (u?.role === 'ROLE_ADMIN') {
                newSocket.emit('join-admin', { adminId: u.id, name: u.userName })
            }
        })

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected')
            setIsConnected(false)
        })

        newSocket.on('connect_error', (err) => {
            if (newSocket.io._reconnectionAttempts <= 1) {
                console.warn('Socket server chưa chạy hoặc không kết nối được:', err.message)
            }
            setIsConnected(false)
        })

        socketRef.current = newSocket
        setSocket(newSocket)

        return () => { newSocket.disconnect() }
    }, []) // FIX: Empty deps — socket chỉ tạo 1 lần

    // FIX: Khi user đăng nhập SAU KHI socket đã kết nối → join room ngay
    useEffect(() => {
        const sock = socketRef.current
        if (!sock || !sock.connected) return
        if (staffUser) {
            sock.emit('join-staff', { staffId: staffUser.id, name: staffUser.userName, role: 'STAFF' })
        } else if (customerUser) {
            sock.emit('join-user', { userId: customerUser.id, name: customerUser.userName, role: 'USER' })
        } else if (user?.role === 'ROLE_ADMIN') {
            sock.emit('join-admin', { adminId: user.id, name: user.userName })
        }
    }, [user?.id, staffUser?.id, customerUser?.id]) // FIX: Chỉ phụ thuộc vào ID (primitive)

    // ─── USER: Real-time cart sync ───
    useEffect(() => {
        if (!socket || !customerUser) return
        const handleCartSync = (data) => {
            if (data.userId === customerUser.id) {
                if (data.cart) setCart(data.cart)
                if (data.action === 'add' && data.item) showToast(`🛒 ${data.item.name} đã được thêm vào giỏ hàng`, 'info')
                else if (data.action === 'remove') showToast(`🗑️ Đã xóa món khỏi giỏ hàng`, 'info')
            }
        }
        const handleStaffAddToCart = (data) => {
            if (data.userId === customerUser.id && data.item) {
                addToCart(data.item, data.quantity || 1)
                showToast(`👨‍🍳 Nhân viên vừa thêm "${data.item.name}" vào đơn của bạn!`, 'info')
            }
        }
        socket.on('cart-sync', handleCartSync)
        socket.on('staff-add-to-cart', handleStaffAddToCart)
        return () => {
            socket.off('cart-sync', handleCartSync)
            socket.off('staff-add-to-cart', handleStaffAddToCart)
        }
    }, [socket, customerUser?.id, addToCart, setCart, showToast])

    // ─── STAFF: Receive real-time orders ───
    useEffect(() => {
        if (!socket || !staffUser) return
        const handleNewUserOrder = (orderData) => {
            setLiveOrders(prev => [orderData, ...prev.slice(0, 49)])
            showToast(`📦 Đơn hàng mới từ ${orderData.customerName || 'Khách'} - ${(orderData.total || 0).toLocaleString('vi-VN')}đ`, 'info')
            try { new Audio('/notification.mp3').play().catch(() => { }) } catch (e) { }
        }
        const handleOrderStatusUpdate = (data) => {
            setLiveOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o))
            if (data.status === 'PAID') showToast(`💰 Đơn hàng #${data.orderId} đã được thanh toán`, 'success')
        }
        socket.on('new-user-order', handleNewUserOrder)
        socket.on('order-status-update', handleOrderStatusUpdate)
        return () => {
            socket.off('new-user-order', handleNewUserOrder)
            socket.off('order-status-update', handleOrderStatusUpdate)
        }
    }, [socket, staffUser?.id, showToast])

    // ─── ALL CLIENTS: Product updates real-time ───
    useEffect(() => {
        if (!socket) return
        const handleProductUpdated = (data) => {
            if (data.action === 'update' || data.action === 'create' || data.action === 'delete') {
                fetchProducts()
                if (data.action === 'create') showToast(`🆕 Sản phẩm mới: ${data.product?.name || 'Đã thêm'}`, 'info')
                else if (data.action === 'update') showToast(`📦 Sản phẩm "${data.product?.name || ''}" đã được cập nhật`, 'info')
            }
        }
        socket.on('product-updated', handleProductUpdated)
        return () => { socket.off('product-updated', handleProductUpdated) }
    }, [socket, fetchProducts, showToast])

    // ─── Emit functions ───
    const emitCartUpdate = useCallback((action, item, userId = null) => {
        const sock = socketRef.current
        if (!sock?.connected) return
        const targetUserId = userId || userInfoRef.current.customerUser?.id
        if (!targetUserId) return
        sock.emit('cart-update', { action, userId: targetUserId, item, timestamp: Date.now() })
    }, [])

    const staffAddToUserCart = useCallback((userId, item, quantity = 1) => {
        const sock = socketRef.current
        const su = userInfoRef.current.staffUser
        if (!sock?.connected || !su) { showToast('Không thể kết nối real-time', 'error'); return false }
        sock.emit('staff-add-to-cart', { userId, item, quantity, staffId: su.id, staffName: su.userName, timestamp: Date.now() })
        showToast(`✅ Đã thêm ${item.name} vào đơn bàn`, 'success')
        return true
    }, [showToast])

    const broadcastProductUpdate = useCallback((product, action = 'update') => {
        const sock = socketRef.current
        if (!sock?.connected) return
        sock.emit('product-updated', { product, action, timestamp: Date.now() })
    }, [])

    const emitUserOrder = useCallback((orderData) => {
        const sock = socketRef.current
        const cu = userInfoRef.current.customerUser
        if (!sock?.connected || !cu) return
        sock.emit('user-order-placed', { ...orderData, userId: cu.id, userName: cu.userName, timestamp: Date.now() })
    }, [])

    const emitOrderStatusUpdate = useCallback((orderId, status, userId) => {
        const sock = socketRef.current
        if (!sock?.connected) return
        sock.emit('order-status-update', { orderId, status, userId, timestamp: Date.now() })
    }, [])

    const addNotification = useCallback((message, type = 'info') => {
        const notif = { id: Date.now(), message, type, timestamp: new Date() }
        setLiveNotifications(prev => [notif, ...prev.slice(0, 19)])
        setTimeout(() => { setLiveNotifications(prev => prev.filter(n => n.id !== notif.id)) }, 5000)
    }, [])

    const clearNotifications = useCallback(() => { setLiveNotifications([]) }, [])

    return (
        <SocketContext.Provider value={{
            socket, isConnected, liveOrders, liveNotifications,
            emitCartUpdate, staffAddToUserCart, broadcastProductUpdate,
            emitUserOrder, emitOrderStatusUpdate, addNotification, clearNotifications,
        }}>
            {children}
        </SocketContext.Provider>
    )
}
