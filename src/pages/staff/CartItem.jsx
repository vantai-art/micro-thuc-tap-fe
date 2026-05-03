// src/components/staff/CartItem.jsx
import React from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'

const fmt = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'

const ctrlBtn = t => ({
    width: 26, height: 26, borderRadius: 6,
    border: `1px solid ${t === 'add' ? 'rgba(245,158,11,0.4)' : t === 'del' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
    background: t === 'add' ? 'rgba(245,158,11,0.1)' : t === 'del' ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.05)',
    color: t === 'add' ? '#f59e0b' : t === 'del' ? '#ef4444' : '#aaa',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
})

export default function CartItem({ item, onUpdate, onRemove }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f0ede6', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                </div>
                <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                    {fmt(item.price)} × {item.quantity} = <span style={{ fontWeight: 800 }}>{fmt(item.price * item.quantity)}</span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <button onClick={() => onUpdate(item.id, item.quantity - 1)} style={ctrlBtn('default')}><Minus size={11} /></button>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => onUpdate(item.id, item.quantity + 1)} style={ctrlBtn('add')}><Plus size={11} /></button>
                <button onClick={() => onRemove(item.id)} style={ctrlBtn('del')}><Trash2 size={11} /></button>
            </div>
        </div>
    )
}