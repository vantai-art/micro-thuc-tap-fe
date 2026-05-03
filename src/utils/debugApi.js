// src/utils/debugApi.js
import http from '../services/api'

export const debugOrderApi = async () => {
    console.log('🔍 ===== DEBUG ORDER API =====')
    console.log('Admin token:', localStorage.getItem('admin_token')?.substring(0, 50) + '...')

    const endpoints = [
        { name: '/order', url: '/order' },
        { name: '/api/orders', url: '/api/orders' },
        { name: '/orders', url: '/orders' },
        { name: '/api/order', url: '/api/order' },
    ]

    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing ${endpoint.name}...`)
            const res = await http.get(endpoint.url)
            console.log(`✅ ${endpoint.name} - Status: ${res.status}`)
            console.log(`   Data:`, Array.isArray(res.data) ? `${res.data.length} orders` : res.data)
            return { success: true, endpoint: endpoint.name, data: res.data }
        } catch (err) {
            console.log(`❌ ${endpoint.name} - Status: ${err.response?.status || 'NO RESPONSE'}`)
            console.log(`   Error:`, err.response?.data || err.message)
        }
    }

    console.log('\n💡 No working order endpoint found!')
    console.log('   Backend needs to implement one of: /order, /api/orders, /orders')
    return { success: false }
}

// Check authentication status
export const checkAuth = () => {
    console.log('🔐 ===== AUTH STATUS =====')
    console.log('admin_token:', !!localStorage.getItem('admin_token'))
    console.log('staff_token:', !!localStorage.getItem('staff_token'))
    console.log('user_token:', !!localStorage.getItem('user_token'))
    console.log('admin_user:', localStorage.getItem('admin_user'))
    console.log('staff_user:', localStorage.getItem('staff_user'))
    console.log('user_user:', localStorage.getItem('user_user'))
}

// Run this in browser console:
// import { debugOrderApi, checkAuth } from './src/utils/debugApi'
// debugOrderApi()
// checkAuth()