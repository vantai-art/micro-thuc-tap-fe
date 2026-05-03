// src/components/staff/SlideConfirm.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'

export default function SlideConfirm({ onConfirm, disabled, loading, success }) {
    const [pos, setPos] = useState(0)
    const [drag, setDrag] = useState(false)
    const wrapRef = useRef(null)
    const thumbRef = useRef(null)

    useEffect(() => { if (!drag && !success) setPos(0) }, [drag, success])
    useEffect(() => { if (success) setPos(9999) }, [success])

    const onStart = e => { if (disabled || loading || success) return; setDrag(true); e.preventDefault() }

    const onMove = useCallback(e => {
        if (!drag) return
        const w = wrapRef.current, t = thumbRef.current
        if (!w || !t) return
        const r = w.getBoundingClientRect()
        const cx = e.touches ? e.touches[0].clientX : e.clientX
        const max = r.width - t.offsetWidth
        const np = Math.max(0, Math.min(cx - r.left - t.offsetWidth / 2, max))
        setPos(np)
        if (np >= max * 0.9) { setDrag(false); onConfirm() }
    }, [drag, onConfirm])

    const onEnd = useCallback(() => setDrag(false), [])

    useEffect(() => {
        if (drag) {
            window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd)
            window.addEventListener('touchmove', onMove); window.addEventListener('touchend', onEnd)
        }
        return () => {
            window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd)
            window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd)
        }
    }, [drag, onMove, onEnd])

    const max = wrapRef.current && thumbRef.current
        ? wrapRef.current.offsetWidth - thumbRef.current.offsetWidth : 1
    const pct = success ? 100 : Math.min((pos / max) * 100, 100)

    return (
        <div ref={wrapRef} style={{
            position: 'relative', height: 52, borderRadius: 26,
            background: success ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${success ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
            overflow: 'hidden', userSelect: 'none',
        }}>
            {/* Progress fill */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${pct}%`, minWidth: 52,
                background: success
                    ? 'linear-gradient(90deg,#059669,#10b981)'
                    : 'linear-gradient(90deg,rgba(245,158,11,0.25),rgba(245,158,11,0.05))',
                transition: drag ? 'none' : 'all 0.3s ease', borderRadius: 26,
            }} />

            {/* Label */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: success ? '#d1fae5' : pct > 40 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                    {success ? '✓ Xác nhận thành công' : loading ? 'Đang xử lý...' : 'Kéo để xác nhận thanh toán →'}
                </span>
            </div>

            {/* Thumb */}
            {!success && (
                <div ref={thumbRef} onMouseDown={onStart} onTouchStart={onStart} style={{
                    position: 'absolute', left: 4, top: 4, bottom: 4, width: 44,
                    borderRadius: 22, cursor: disabled ? 'not-allowed' : 'grab',
                    background: disabled ? '#333' : 'linear-gradient(135deg,#f59e0b,#d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `translateX(${pos}px)`,
                    transition: drag ? 'none' : 'transform 0.3s cubic-bezier(.34,1.56,.64,1)',
                    boxShadow: disabled ? 'none' : '0 2px 12px rgba(245,158,11,0.5)',
                    touchAction: 'none',
                }}>
                    {loading
                        ? <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                        : <ChevronRight size={18} color="#fff" />}
                </div>
            )}
        </div>
    )
}