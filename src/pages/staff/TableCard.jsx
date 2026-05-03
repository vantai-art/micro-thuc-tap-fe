// src/components/staff/TableCard.jsx
import React from 'react'

export default function TableCard({ table, selected, onSelect }) {
    const isFree = table.status === 'FREE'
    const isSelected = selected?.id === table.id

    const borderColor = isSelected ? '#f59e0b' : isFree ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)'
    const bgColor = isSelected ? 'rgba(245,158,11,0.12)' : isFree ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.04)'
    const dotColor = isSelected ? '#f59e0b' : isFree ? '#10b981' : '#ef4444'
    const textColor = dotColor

    return (
        <button
            onClick={() => isFree && onSelect(table)}
            style={{
                padding: '10px 8px', borderRadius: 10,
                cursor: isFree ? 'pointer' : 'not-allowed',
                border: `2px solid ${borderColor}`,
                background: bgColor,
                transition: 'all 0.15s', textAlign: 'center',
            }}
        >
            <div style={{ fontSize: 11, fontWeight: 800, color: textColor }}>
                Bàn {table.number}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, margin: '4px auto 0' }} />
        </button>
    )
}