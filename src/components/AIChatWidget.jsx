// src/components/AIChatWidget.jsx
// AI hỗ trợ khách hàng — dùng Google Gemini API (MIỄN PHÍ)
// Setup:
//   1. Lấy API key tại https://aistudio.google.com/app/apikey
//   2. Thêm vào .env: REACT_APP_GEMINI_KEY=AIzaSy...
//   3. Import vào App.js: import AIChatWidget from './components/AIChatWidget'
//   4. Thêm <AIChatWidget /> vào trong <SocketProvider>...</SocketProvider>

import React, { useState, useEffect, useRef, useCallback } from 'react'

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080'
const GEMINI_KEY = process.env.REACT_APP_GEMINI_KEY || ''

// ── Gemini API call ────────────────────────────────────────────────
async function askGemini(messages, products) {
    const productList = products.length > 0
        ? products.map(p =>
            `- ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}đ` +
            (p.category?.name ? ` (${p.category.name})` : '') +
            (p.description ? ` — ${p.description}` : '')
        ).join('\n')
        : '(Chưa tải được menu)'

    const systemPrompt = `Bạn là trợ lý AI thân thiện của nhà hàng. Bạn tư vấn về menu và trả lời câu hỏi thông thường một cách thoải mái.

MENU HIỆN TẠI:
${productList}

CÁCH TRẢ LỜI:
- Thân thiện, vui vẻ, tự nhiên như người bạn
- Trả lời ngắn gọn, đúng trọng tâm, bằng tiếng Việt
- Câu hỏi về menu/nhà hàng: tư vấn chính xác dựa trên danh sách món trên
- Câu hỏi ngoài chủ đề: trả lời bình thường, thoải mái
- Không bịa thông tin về nhà hàng nếu không có trong dữ liệu
- Dùng emoji tự nhiên, không lạm dụng`

    // Gemini yêu cầu lịch sử phải xen kẽ user/model, bắt đầu bằng user
    // Lọc ra các tin nhắn hợp lệ
    const history = []
    for (const m of messages) {
        const role = m.role === 'assistant' ? 'model' : 'user'
        // Bỏ qua tin nhắn đầu tiên của assistant (lời chào)
        if (history.length === 0 && role === 'model') continue
        history.push({ role, parts: [{ text: m.content }] })
    }

    // Nếu không có lịch sử hợp lệ, tạo 1 tin user giả
    if (history.length === 0) {
        history.push({ role: 'user', parts: [{ text: messages[messages.length - 1]?.content || 'Xin chào' }] })
    }

    if (!GEMINI_KEY) {
        return '⚠️ Chưa cấu hình REACT_APP_GEMINI_KEY trong file .env'
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: history,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            })
        }
    )

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Gemini error:', err)
        if (res.status === 400) return '❌ API key không hợp lệ. Kiểm tra lại REACT_APP_GEMINI_KEY trong .env'
        if (res.status === 429) return '⏳ Đang bị giới hạn tốc độ, vui lòng thử lại sau vài giây!'
        return 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!'
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text
        || data.candidates?.[0]?.content?.parts?.[0]?.text
        || 'Xin lỗi, tôi chưa thể trả lời lúc này. 🙏'
}

// ── Helpers ────────────────────────────────────────────────────────
const fmtTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

const QUICK = [
    'Menu có gì ngon? 🍜',
    'Gợi ý món cho buổi tối',
    'Có combo nào không?',
    'Món nào bán chạy nhất?',
]

// ── Component ──────────────────────────────────────────────────────
export default function AIChatWidget() {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'Xin chào! Mình là AI trợ lý của nhà hàng ☕\nBạn muốn xem menu, tư vấn món ăn, hay hỏi gì khác cũng được — cứ tự nhiên nhé!',
            time: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [unread, setUnread] = useState(0)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    // ── Load products ──────────────────────────────────────────────
    const fetchProducts = useCallback(async () => {
        if (products.length > 0) return
        setLoadingProducts(true)
        try {
            const res = await fetch(`${BASE_URL}/products`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await res.json()
            const list = data?.content || data?.data || data || []
            setProducts(Array.isArray(list) ? list.map(p => ({
                ...p,
                name: p.productName ?? p.name ?? '',
                description: p.discription ?? p.description ?? '',
                category: typeof p.category === 'string' ? { name: p.category } : (p.category ?? { name: '' }),
                price: Number(p.price ?? 0),
            })) : [])
        } catch (e) {
            console.warn('AIChatWidget: không tải được sản phẩm', e)
        } finally {
            setLoadingProducts(false)
        }
    }, [products.length])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    // ── Auto scroll ────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    // ── Focus input khi mở ─────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 150)
            setUnread(0)
        }
    }, [open])

    // ── Send message ───────────────────────────────────────────────
    const send = useCallback(async (text) => {
        const content = (text !== undefined ? text : input).trim()
        if (!content || loading) return
        setInput('')

        const userMsg = { id: Date.now(), role: 'user', content, time: new Date() }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setLoading(true)

        try {
            const reply = await askGemini(newMessages, products)
            const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: reply, time: new Date() }
            setMessages(prev => [...prev, assistantMsg])
            if (!open) setUnread(u => u + 1)
        } catch (e) {
            console.error('Chat error:', e)
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau nhé! 🙏',
                time: new Date(),
            }])
        } finally {
            setLoading(false)
        }
    }, [input, loading, messages, products, open])

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
    }

    return (
        <>
            <style>{`
                @keyframes ai-fadein {
                    from { opacity: 0; transform: translateY(14px) scale(0.96) }
                    to   { opacity: 1; transform: translateY(0) scale(1) }
                }
                @keyframes ai-pulse {
                    0%,100% { box-shadow: 0 4px 20px rgba(245,158,11,0.45) }
                    50%     { box-shadow: 0 6px 32px rgba(245,158,11,0.75) }
                }
                @keyframes ai-spin { to { transform: rotate(360deg) } }
                @keyframes ai-dot {
                    0%,80%,100% { transform: scale(0.55); opacity: 0.35 }
                    40%         { transform: scale(1);    opacity: 1 }
                }
                @keyframes ai-bounce {
                    0%,100% { transform: translateY(0) }
                    50%     { transform: translateY(-3px) }
                }
                .ai-bubble-btn { animation: ai-pulse 2.8s ease-in-out infinite }
                .ai-bubble-btn:hover { transform: scale(1.1) !important; animation: none !important; box-shadow: 0 6px 28px rgba(245,158,11,0.65) !important }
                .ai-send-btn:hover:not(:disabled) { background: #d97706 !important; transform: scale(1.05) }
                .ai-chip:hover { background: rgba(245,158,11,0.12) !important; border-color: #f59e0b !important; color: #92400e !important; transform: translateY(-1px) }
                .ai-chip { transition: all 0.18s ease !important }
                .ai-msg-appear { animation: ai-fadein 0.2s ease forwards }
                .ai-window { animation: ai-fadein 0.22s cubic-bezier(0.34,1.56,0.64,1) }
            `}</style>

            {/* ── Floating bubble ── */}
            {!open && (
                <button
                    className="ai-bubble-btn"
                    onClick={() => setOpen(true)}
                    title="Chat với AI tư vấn"
                    style={{
                        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
                        width: 58, height: 58, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, transition: 'transform 0.2s, box-shadow 0.2s',
                        fontFamily: 'system-ui',
                    }}
                >
                    ☕
                    {unread > 0 && (
                        <span style={{
                            position: 'absolute', top: -3, right: -3,
                            background: '#ef4444', color: '#fff',
                            borderRadius: '50%', width: 20, height: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, border: '2px solid #fff',
                            animation: 'ai-bounce 1s ease infinite',
                        }}>{unread}</span>
                    )}
                </button>
            )}

            {/* ── Chat window ── */}
            {open && (
                <div
                    className="ai-window"
                    style={{
                        position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
                        width: 368, height: 580,
                        background: '#ffffff',
                        borderRadius: 22,
                        boxShadow: '0 12px 50px rgba(0,0,0,0.16), 0 3px 10px rgba(0,0,0,0.08)',
                        display: 'flex', flexDirection: 'column',
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                        overflow: 'hidden',
                        border: '1px solid rgba(0,0,0,0.07)',
                    }}
                >
                    {/* ── Header ── */}
                    <div style={{
                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                        padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 10,
                        flexShrink: 0,
                        boxShadow: '0 2px 10px rgba(217,119,6,0.25)',
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, flexShrink: 0,
                            backdropFilter: 'blur(4px)',
                        }}>☕</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>
                                Trợ lý AI nhà hàng
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac', display: 'inline-block', boxShadow: '0 0 6px #86efac' }} />
                                {loadingProducts ? 'Đang tải menu...' : `Sẵn sàng · ${products.length} món trong menu`}
                            </div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.18)', border: 'none',
                                borderRadius: 10, width: 32, height: 32, cursor: 'pointer',
                                color: '#fff', fontSize: 15, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s', flexShrink: 0,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                        >✕</button>
                    </div>

                    {/* ── Messages ── */}
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
                        display: 'flex', flexDirection: 'column', gap: 10,
                        background: '#f8f7f5',
                    }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={msg.id}
                                className="ai-msg-appear"
                                style={{
                                    display: 'flex',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-end', gap: 7,
                                    animationDelay: `${idx * 0.03}s`,
                                }}
                            >
                                {msg.role === 'assistant' && (
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, flexShrink: 0,
                                        boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
                                    }}>☕</div>
                                )}
                                <div style={{ maxWidth: '76%' }}>
                                    <div style={{
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                                            : '#ffffff',
                                        color: msg.role === 'user' ? '#fff' : '#1c1c1c',
                                        borderRadius: msg.role === 'user'
                                            ? '18px 18px 5px 18px'
                                            : '18px 18px 18px 5px',
                                        padding: '10px 14px',
                                        fontSize: 13.5,
                                        lineHeight: 1.55,
                                        boxShadow: msg.role === 'user'
                                            ? '0 2px 10px rgba(217,119,6,0.3)'
                                            : '0 1px 6px rgba(0,0,0,0.08)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                                    }}>
                                        {msg.content}
                                    </div>
                                    <div style={{
                                        fontSize: 10, color: '#bbb', marginTop: 4,
                                        textAlign: msg.role === 'user' ? 'right' : 'left',
                                        paddingLeft: msg.role === 'assistant' ? 4 : 0,
                                        paddingRight: msg.role === 'user' ? 4 : 0,
                                    }}>
                                        {fmtTime(msg.time)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {loading && (
                            <div className="ai-msg-appear" style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
                                }}>☕</div>
                                <div style={{
                                    background: '#fff', border: '1px solid rgba(0,0,0,0.06)',
                                    borderRadius: '18px 18px 18px 5px', padding: '12px 16px',
                                    display: 'flex', gap: 5, boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                                }}>
                                    {[0, 0.18, 0.36].map((delay, i) => (
                                        <span key={i} style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#f59e0b', display: 'inline-block',
                                            animation: `ai-dot 1.3s ${delay}s ease-in-out infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick chips */}
                    {messages.length === 1 && !loading && (
                        <div style={{
                            padding: '8px 14px 6px',
                            display: 'flex', flexWrap: 'wrap', gap: 6,
                            background: '#f8f7f5',
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            flexShrink: 0,
                        }}>
                            {QUICK.map(q => (
                                <button
                                    key={q}
                                    className="ai-chip"
                                    onClick={() => send(q)}
                                    style={{
                                        background: '#fff',
                                        border: '1px solid rgba(245,158,11,0.25)',
                                        borderRadius: 20, padding: '5px 12px',
                                        fontSize: 11.5, fontWeight: 600,
                                        color: '#92400e', cursor: 'pointer',
                                        fontFamily: 'inherit', display: 'flex',
                                        alignItems: 'center', gap: 4,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                    }}
                                >{q}</button>
                            ))}
                        </div>
                    )}

                    {/* ── Input ── */}
                    <div style={{
                        padding: '10px 12px 12px',
                        background: '#fff',
                        borderTop: '1px solid rgba(0,0,0,0.07)',
                        display: 'flex', alignItems: 'flex-end', gap: 8,
                        flexShrink: 0,
                    }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Nhắn tin hỏi AI tư vấn..."
                            rows={1}
                            style={{
                                flex: 1, resize: 'none',
                                border: '1.5px solid rgba(0,0,0,0.1)',
                                borderRadius: 14, padding: '9px 13px',
                                fontSize: 13.5, outline: 'none',
                                fontFamily: 'inherit', lineHeight: 1.45,
                                maxHeight: 90, overflowY: 'auto',
                                background: '#f9f8f7', color: '#1a1a1a',
                                transition: 'border-color 0.18s, box-shadow 0.18s',
                            }}
                            onFocus={e => {
                                e.target.style.borderColor = '#f59e0b'
                                e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.12)'
                            }}
                            onBlur={e => {
                                e.target.style.borderColor = 'rgba(0,0,0,0.1)'
                                e.target.style.boxShadow = 'none'
                            }}
                        />
                        <button
                            className="ai-send-btn"
                            onClick={() => send()}
                            disabled={!input.trim() || loading}
                            style={{
                                width: 40, height: 40, borderRadius: '50%', border: 'none',
                                background: input.trim() && !loading
                                    ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                                    : '#e5e5e5',
                                color: input.trim() && !loading ? '#fff' : '#bbb',
                                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 17, transition: 'all 0.18s', flexShrink: 0,
                                boxShadow: input.trim() && !loading
                                    ? '0 3px 12px rgba(217,119,6,0.35)'
                                    : 'none',
                            }}
                        >
                            {loading
                                ? <span style={{
                                    width: 15, height: 15,
                                    border: '2px solid rgba(255,255,255,0.35)',
                                    borderTopColor: '#fff', borderRadius: '50%',
                                    animation: 'ai-spin 0.75s linear infinite',
                                    display: 'inline-block',
                                }} />
                                : '↑'
                            }
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}