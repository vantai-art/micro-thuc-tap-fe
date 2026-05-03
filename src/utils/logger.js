// src/utils/logger.js
const isDev = process.env.NODE_ENV === 'development'
const isDebugMode = localStorage.getItem('DEBUG_MODE') === 'true'

class Logger {
    static log(...args) {
        if (isDev || isDebugMode) {
            console.log(...args)
        }
    }

    static info(...args) {
        if (isDev || isDebugMode) {
            console.info('[INFO]', ...args)
        }
    }

    static warn(...args) {
        if (isDev || isDebugMode) {
            console.warn('[WARN]', ...args)
        }
    }

    static error(...args) {
        // Errors luôn được log (nhưng ẩn chi tiết trong production)
        if (isDev || isDebugMode) {
            console.error('[ERROR]', ...args)
        } else {
            // Production: chỉ log message đầu tiên
            console.error('[ERROR]', args[0]?.message || args[0])
        }
    }

    static debug(...args) {
        if (isDev && localStorage.getItem('DEBUG_DETAIL') === 'true') {
            console.debug('[DEBUG]', ...args)
        }
    }

    // Log API requests (ẩn sensitive data)
    static api(method, url, data = null, status = null) {
        if (!isDev && !isDebugMode) return

        // Ẩn password
        let safeData = data
        if (data?.userPassword) {
            safeData = { ...data, userPassword: '***' }
        }

        console.group(`🌐 API ${method.toUpperCase()} ${url}`)
        if (safeData) console.log('Request:', safeData)
        if (status) console.log('Response status:', status)
        console.groupEnd()
    }
}

export default Logger