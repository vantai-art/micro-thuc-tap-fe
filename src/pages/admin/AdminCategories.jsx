// src/pages/admin/AdminCategories.jsx
// Hỗ trợ: xem danh mục kèm ảnh đại diện (lấy từ sản phẩm đầu tiên), đổi tên, thêm tên mới

import React, { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Plus, Edit2, Package, Search, X, RefreshCw, AlertCircle, ChevronRight, Check, ArrowLeft, Image } from 'lucide-react'
import http from '../../services/api'

const CAT_COLORS = ['#f59e0b','#3b82f6','#22c55e','#8b5cf6','#ef4444','#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7']
function catColor(name) { let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffffffff; return CAT_COLORS[Math.abs(h)%CAT_COLORS.length] }

export default function AdminCategories() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(null)
    const [detail, setDetail] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

    const fetchProducts = useCallback(async () => {
        setLoading(true); setError('')
        try { const res = await http.get('/products'); setProducts(Array.isArray(res.data) ? res.data : []) }
        catch (e) { setError('Không thể tải sản phẩm: ' + e.message) }
        finally { setLoading(false) }
    }, [])
    useEffect(() => { fetchProducts() }, [fetchProducts])

    const catMap = {}
    products.forEach(p => {
        const cat = (typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác'
        if (!catMap[cat]) catMap[cat] = []
        catMap[cat].push(p)
    })
    const categories = Object.entries(catMap)
        .sort((a, b) => b[1].length - a[1].length)
        .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))

    const handleRename = async (oldName, newName) => {
        if (!newName.trim() || newName === oldName) return setModal(null)
        const targets = products.filter(p => ((typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác') === oldName)
        try {
            await Promise.all(targets.map(p => http.put(`/admin/products/${p.id}`, { ...p, category: newName.trim() })))
            showToast(`Đổi tên "${oldName}" → "${newName.trim()}" (${targets.length} sản phẩm)`)
            fetchProducts()
        } catch (e) { showToast('Lỗi đổi tên: ' + e.message, 'error') }
        setModal(null)
    }

    // Detail view
    if (detail) {
        const detailProducts = catMap[detail] || []
        return (
            <div style={{ padding: 24, color: '#f9fafb' }}>
                <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontSize: 14 }}>
                    <ArrowLeft size={16} /> Quay lại danh mục
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    {/* Ảnh đại diện category = ảnh sản phẩm đầu tiên có imageUrl */}
                    {(() => {
                        const imgProd = detailProducts.find(p => p.imageUrl)
                        return imgProd ? (
                            <img src={imgProd.imageUrl} alt={detail} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 12, border: `2px solid ${catColor(detail)}` }} onError={e => { e.target.style.display='none' }} />
                        ) : (
                            <div style={{ width: 52, height: 52, borderRadius: 12, background: `${catColor(detail)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FolderOpen size={24} color={catColor(detail)} />
                            </div>
                        )
                    })()}
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{detail}</h1>
                        <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{detailProducts.length} sản phẩm</p>
                    </div>
                </div>
                <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#111827' }}>
                                {['ID', 'Ảnh', 'Tên sản phẩm', 'Giá', 'Tồn kho', 'Mô tả'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {detailProducts.map((p, i) => (
                                <tr key={p.id} style={{ borderTop: '1px solid #374151', background: i % 2 === 1 ? '#111827' : 'transparent' }}>
                                    <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: 12 }}>#{p.id}</td>
                                    <td style={{ padding: '8px 16px' }}>
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.productName} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid #374151', display: 'block' }}
                                                onError={e => { e.target.style.display='none' }} />
                                        ) : (
                                            <div style={{ width: 44, height: 44, borderRadius: 7, background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563' }}>
                                                <Package size={16} color="#6b7280" />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{p.productName || p.name}</td>
                                    <td style={{ padding: '10px 16px', color: '#f59e0b', fontWeight: 600 }}>{Number(p.price || 0).toLocaleString('vi-VN')}đ</td>
                                    <td style={{ padding: '10px 16px' }}>
                                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: (p.availability||0)>0?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)', color: (p.availability||0)>0?'#22c55e':'#ef4444' }}>{p.availability??0}</span>
                                    </td>
                                    <td style={{ padding: '10px 16px', color: '#9ca3af', fontSize: 12, maxWidth: 200 }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.discription || p.description || '—'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: 24, color: '#f9fafb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Danh Mục Sản Phẩm</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        {Object.keys(catMap).length} danh mục · {products.length} sản phẩm
                        <span style={{ marginLeft: 8, fontSize: 11, color: '#4b5563' }}>(ảnh đại diện lấy từ sản phẩm trong danh mục)</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={fetchProducts} style={{ background: '#1f2937', color: '#d1d5db', border: '1px solid #374151', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} />Làm mới</button>
                    <button onClick={() => setModal({ mode: 'add' })} style={{ background: '#f59e0b', color: '#111', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Thêm danh mục</button>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
                <Search size={16} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục..."
                    style={{ width: '100%', background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: 8, padding: '9px 12px 9px 36px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />{error}
                </div>
            )}

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <div style={{ width: 36, height: 36, border: '3px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            ) : (
                <>
                    {/* Category grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                        {categories.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: '#6b7280' }}>
                                <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} /><p>Chưa có danh mục nào</p>
                            </div>
                        ) : categories.map(([name, prods]) => {
                            const color = catColor(name)
                            const available = prods.filter(p => (p.availability || 0) > 0).length
                            // Lấy ảnh đại diện: ưu tiên sản phẩm đầu tiên có imageUrl
                            const coverProduct = prods.find(p => p.imageUrl)
                            return (
                                <div key={name} style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.transform = 'translateY(0)' }}>
                                    {/* Color strip top */}
                                    <div style={{ height: 3, background: color }} />

                                    {/* Ảnh đại diện category */}
                                    {coverProduct ? (
                                        <div style={{ height: 120, overflow: 'hidden', position: 'relative' }}>
                                            <img src={coverProduct.imageUrl} alt={name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                onError={e => { e.target.parentElement.innerHTML = `<div style="height:120px;background:#111827;display:flex;align-items:center;justify-content:center;"><span style="font-size:40px">📦</span></div>` }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(31,41,55,0.9) 0%, transparent 60%)' }} />
                                            {/* Badge số ảnh */}
                                            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#d1d5db', fontSize: 10, padding: '3px 7px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Image size={10} />{prods.filter(p => p.imageUrl).length} ảnh
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ height: 90, background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <FolderOpen size={32} color={color} style={{ opacity: 0.4 }} />
                                            <span style={{ fontSize: 10, color: '#4b5563' }}>Chưa có ảnh</span>
                                        </div>
                                    )}

                                    <div style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{name}</div>
                                                <div style={{ fontSize: 12, color: '#6b7280' }}>{prods.length} sản phẩm · {available} còn hàng</div>
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); setModal({ mode: 'rename', catName: name }) }}
                                                style={{ width: 30, height: 30, border: 'none', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Đổi tên">
                                                <Edit2 size={13} />
                                            </button>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{ height: 4, background: '#374151', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                                            <div style={{ height: '100%', width: `${prods.length>0?(available/prods.length)*100:0}%`, background: color, borderRadius: 2 }} />
                                        </div>
                                        <button onClick={() => setDetail(name)} style={{ width: '100%', background: 'none', border: `1px solid ${color}44`, borderRadius: 8, color: color, padding: '7px 0', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                            Xem sản phẩm <ChevronRight size={13} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Summary table */}
                    {categories.length > 0 && (
                        <div style={{ marginTop: 24, background: '#1f2937', border: '1px solid #374151', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid #374151', fontWeight: 600, fontSize: 14 }}>Tổng quan theo danh mục</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#111827' }}>
                                        {['Danh mục', 'Ảnh đại diện', 'Số SP', 'Còn hàng', 'Hết hàng', 'Có ảnh', 'Giá TB'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(([name, prods], i) => {
                                        const available = prods.filter(p => (p.availability||0) > 0).length
                                        const withImg = prods.filter(p => p.imageUrl).length
                                        const avgPrice = prods.length > 0 ? prods.reduce((s, p) => s + Number(p.price||0), 0) / prods.length : 0
                                        const cover = prods.find(p => p.imageUrl)
                                        return (
                                            <tr key={name} style={{ borderTop: '1px solid #374151', background: i%2===1?'#111827':'transparent' }}>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColor(name), flexShrink: 0 }} />
                                                        <span style={{ fontWeight: 500 }}>{name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '8px 16px' }}>
                                                    {cover ? (
                                                        <img src={cover.imageUrl} alt={name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: `1px solid ${catColor(name)}55`, display: 'block' }} onError={e => { e.target.style.display='none' }} />
                                                    ) : (
                                                        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563' }}>
                                                            <Package size={14} color="#6b7280" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '10px 16px', color: '#9ca3af' }}>{prods.length}</td>
                                                <td style={{ padding: '10px 16px', color: '#22c55e', fontWeight: 600 }}>{available}</td>
                                                <td style={{ padding: '10px 16px', color: prods.length-available>0?'#ef4444':'#6b7280' }}>{prods.length-available}</td>
                                                <td style={{ padding: '10px 16px' }}>
                                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: withImg>0?'rgba(34,197,94,0.15)':'rgba(107,114,128,0.15)', color: withImg>0?'#22c55e':'#6b7280', fontWeight: 600 }}>{withImg}/{prods.length}</span>
                                                </td>
                                                <td style={{ padding: '10px 16px', color: '#f59e0b', fontWeight: 600 }}>{avgPrice.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {modal && (
                <CategoryModal mode={modal.mode} catName={modal.catName} existingCategories={Object.keys(catMap)}
                    onClose={() => setModal(null)}
                    onRename={handleRename}
                    onAdd={(name) => { showToast(`Tên danh mục "${name}" sẵn sàng. Gán vào sản phẩm khi tạo mới.`, 'info'); setModal(null) }}
                    showToast={showToast} />
            )}

            {toast && (
                <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#1f2937', border: `1px solid ${toast.type==='error'?'#ef4444':toast.type==='info'?'#3b82f6':'#22c55e'}`, borderLeft: `4px solid ${toast.type==='error'?'#ef4444':toast.type==='info'?'#3b82f6':'#22c55e'}`, borderRadius: 10, padding: '12px 20px', color: '#f9fafb', fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 360 }}>
                    {toast.msg}
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

function CategoryModal({ mode, catName, existingCategories, onClose, onRename, onAdd }) {
    const [value, setValue] = useState(mode === 'rename' ? catName : '')
    const [submitting, setSubmitting] = useState(false)
    const isRename = mode === 'rename'
    const handleSubmit = async (e) => {
        e.preventDefault(); if (!value.trim()) return
        setSubmitting(true)
        if (isRename) await onRename(catName, value.trim())
        else onAdd(value.trim())
        setSubmitting(false)
    }
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
            <div style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 16, padding: 28, width: 380, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{isRename ? `Đổi tên "${catName}"` : 'Thêm danh mục mới'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                {!isRename && (
                    <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#93c5fd' }}>
                        💡 Tên này sẽ được dùng khi bạn tạo hoặc chỉnh sửa sản phẩm. Ảnh đại diện tự lấy từ ảnh sản phẩm đầu tiên.
                    </div>
                )}
                {isRename && (
                    <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#fcd34d' }}>
                        ⚠️ Tất cả sản phẩm trong "{catName}" sẽ được cập nhật.
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên danh mục</label>
                        <input value={value} onChange={e => setValue(e.target.value)} autoFocus placeholder="VD: Cà phê, Trà sữa, Bánh ngọt..."
                            style={{ width: '100%', background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                        {!isRename && existingCategories.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Danh mục hiện có:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {existingCategories.map(c => (
                                        <button key={c} type="button" onClick={() => setValue(c)} style={{ background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>{c}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontSize: 14 }}>Hủy</button>
                        <button type="submit" disabled={submitting || !value.trim()} style={{ flex: 2, background: value.trim()?'#f59e0b':'#374151', color: value.trim()?'#111':'#6b7280', border: 'none', borderRadius: 8, padding: '10px 0', cursor: value.trim()?'pointer':'not-allowed', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {submitting ? <div style={{ width: 16, height: 16, border: '2px solid #111', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><Check size={15} />{isRename ? 'Đổi tên' : 'Xác nhận'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
