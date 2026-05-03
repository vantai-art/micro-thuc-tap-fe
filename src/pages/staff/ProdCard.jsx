// src/components/staff/ProdCard.jsx
import React, { useState } from 'react'

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const PLACEHOLDER_GRID = 'https://placehold.co/200x150/0a0a0a/333?text=☕'
const PLACEHOLDER_LIST = 'https://placehold.co/80/1a1a1a/555?text=☕'

export default function ProdCard({ product, onAdd, viewMode }) {
    const out = !product.stockQuantity || product.stockQuantity <= 0
    const [hov, setHov] = useState(false)

    if (viewMode === 'list') {
        return (
            <button
                onClick={() => !out && onAdd(product)}
                disabled={out}
                onMouseOver={() => setHov(true)}
                onMouseOut={() => setHov(false)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', textAlign: 'left',
                    background: hov && !out ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hov && !out ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 10, padding: '10px 12px',
                    cursor: out ? 'not-allowed' : 'pointer',
                    opacity: out ? 0.45 : 1, transition: 'all 0.15s',
                }}
            >
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#1a1a1a' }}>
                    <img src={product.imageUrl || PLACEHOLDER_LIST} alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.src = PLACEHOLDER_LIST }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#f0ede6', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{product.category?.name}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>{fmt(product.price)}</div>
                    <div style={{ color: out ? '#ef4444' : '#444', fontSize: 10, marginTop: 1 }}>
                        {out ? 'Hết hàng' : `Còn ${product.stockQuantity}`}
                    </div>
                </div>
            </button>
        )
    }

    // Grid view
    return (
        <button
            onClick={() => !out && onAdd(product)}
            disabled={out}
            onMouseOver={() => setHov(true)}
            onMouseOut={() => setHov(false)}
            style={{
                border: `1px solid ${hov && !out ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: 0,
                cursor: out ? 'not-allowed' : 'pointer',
                opacity: out ? 0.45 : 1, transition: 'all 0.15s',
                overflow: 'hidden', textAlign: 'left', width: '100%',
                background: hov && !out ? 'rgba(245,158,11,0.04)' : '#111',
            }}
        >
            <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: '#0a0a0a' }}>
                <img src={product.imageUrl || PLACEHOLDER_GRID} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: hov && !out ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s' }}
                    onError={e => { e.target.src = PLACEHOLDER_GRID }} />
            </div>
            <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ color: '#f0ede6', fontWeight: 600, fontSize: 13, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>
                    {product.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 14 }}>{fmt(product.price)}</span>
                    <span style={{ fontSize: 10, color: out ? '#ef4444' : '#444' }}>{out ? 'Hết' : `SL: ${product.stockQuantity}`}</span>
                </div>
            </div>
        </button>
    )
}