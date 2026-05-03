// src/pages/admin/AdminProducts.jsx
// Hỗ trợ: thêm / sửa / xóa sản phẩm + upload / xem / xóa ảnh sản phẩm

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    Plus, Edit2, Trash2, Search, X, RefreshCw,
    Package, ClipboardList, ImagePlus, Eye
} from 'lucide-react'
import http from '../../services/api'
import { useAppContext } from '../../contexts/AppContext'
import { useSocket } from '../../contexts/SocketContext'

const S = {
    wrap: { padding: 24, color: '#f9fafb' },
    card: { background: '#1f2937', border: '1px solid #374151', borderRadius: 12 },
    input: { width: '100%', background: '#111827', color: '#f9fafb', border: '1px solid #374151', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' },
}

function Toast({ msg, type }) {
    const c = type === 'error' ? '#ef4444' : '#22c55e'
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#1f2937', border: `1px solid ${c}`, borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 20px', color: '#f9fafb', fontSize: 13, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {msg}
        </div>
    )
}

function ImagePreviewModal({ src, productName, onClose }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }} onClick={onClose}>
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{ position: 'absolute', top: -38, right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X size={18} /> Đóng
                </button>
                <img src={src} alt={productName} style={{ maxWidth: '88vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }} />
                <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 12, fontSize: 13 }}>{productName}</p>
            </div>
        </div>
    )
}

const EMPTY = { productName: '', discription: '', price: '', availability: '', category: '', imageUrl: '' }

export default function AdminProducts() {
    const { adminUser } = useAppContext()
    const { broadcastProductUpdate } = useSocket()
    const performedBy = adminUser?.userName || 'unknown'
    const role = adminUser?.role === 'ROLE_ADMIN' ? 'ADMIN' : 'STAFF'
    const logHeaders = { 'X-Performed-By': performedBy, 'X-Role': role }

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [catFilter, setCat] = useState('all')
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState(EMPTY)
    const [submitting, setSub] = useState(false)
    const [toast, setToast] = useState(null)
    const [previewImg, setPreviewImg] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [uploadingImg, setUploadingImg] = useState(false)
    const fileInputRef = useRef(null)

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await http.get('/products')
            setProducts(Array.isArray(res.data) ? res.data : [])
        } catch (e) { showToast('Không thể tải sản phẩm: ' + e.message, 'error') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const cats = ['all', ...new Set(products.map(p => (typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác'))]

    const openAdd = () => { setForm(EMPTY); setImageFile(null); setImagePreview(''); setModal({ mode: 'add' }) }
    const openEdit = (p) => {
        setForm({ productName: p.productName || p.name || '', discription: p.discription || p.description || '', price: p.price || '', availability: p.availability ?? p.stockQuantity ?? '', category: (typeof p.category === 'string' ? p.category : p.category?.name) || '', imageUrl: p.imageUrl || '' })
        setImageFile(null); setImagePreview(p.imageUrl || ''); setModal({ mode: 'edit', product: p })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { showToast('Chỉ chấp nhận file hình ảnh!', 'error'); return }
        if (file.size > 5 * 1024 * 1024) { showToast('File không được vượt quá 5MB!', 'error'); return }
        setImageFile(file); setImagePreview(URL.createObjectURL(file))
    }

    const uploadImageToServer = async (productId) => {
        if (!imageFile) return null
        setUploadingImg(true)
        try {
            const fd = new FormData(); fd.append('file', imageFile)
            const res = await http.post(`/admin/products/${productId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data', ...logHeaders } })
            return res.data?.imageUrl || null
        } catch (e) { showToast('Lỗi upload ảnh: ' + (e.response?.data?.error || e.message), 'error'); return null }
        finally { setUploadingImg(false) }
    }

    const handleDeleteImage = async (productId) => {
        if (!window.confirm('Xóa ảnh sản phẩm này?')) return
        try {
            await http.delete(`/admin/products/${productId}/image`, { headers: logHeaders })
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, imageUrl: null } : p))
            setImagePreview(''); setForm(f => ({ ...f, imageUrl: '' }))
            showToast('Đã xóa ảnh sản phẩm')
        } catch (e) { showToast('Lỗi xóa ảnh: ' + (e.response?.data?.error || e.message), 'error') }
    }

    const clearSelectedFile = () => { setImageFile(null); setImagePreview(form.imageUrl || ''); if (fileInputRef.current) fileInputRef.current.value = '' }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.productName.trim()) { showToast('Nhập tên sản phẩm', 'error'); return }
        if (!form.price) { showToast('Nhập giá sản phẩm', 'error'); return }
        if (!form.category.trim()) { showToast('Nhập danh mục', 'error'); return }
        const payload = { productName: form.productName.trim(), discription: form.discription.trim(), price: Number(form.price), availability: Number(form.availability) || 0, category: form.category.trim(), imageUrl: form.imageUrl || null }
        setSub(true)
        try {
            if (modal.mode === 'add') {
                const res = await http.post('/admin/products', payload, { headers: logHeaders })
                const saved = res.data || payload
                setProducts(prev => [...prev, saved])
                if (imageFile && saved.id) {
                    const newUrl = await uploadImageToServer(saved.id)
                    if (newUrl) setProducts(prev => prev.map(p => p.id === saved.id ? { ...p, imageUrl: newUrl } : p))
                }
                showToast('✅ Thêm sản phẩm thành công!')
                // 🔴 FIX: Broadcast real-time cho staff/user thấy sản phẩm mới NGAY, không cần reload
                broadcastProductUpdate(saved, 'create')
            } else {
                await http.put(`/admin/products/${modal.product.id}`, payload, { headers: logHeaders })
                let updatedImageUrl = form.imageUrl
                if (imageFile) { const newUrl = await uploadImageToServer(modal.product.id); if (newUrl) updatedImageUrl = newUrl }
                setProducts(prev => prev.map(p => p.id === modal.product.id ? { ...p, ...payload, imageUrl: updatedImageUrl } : p))
                showToast('✅ Cập nhật sản phẩm thành công!')
                // 🔴 FIX: Broadcast real-time cập nhật sản phẩm
                broadcastProductUpdate({ id: modal.product.id, ...payload, imageUrl: updatedImageUrl }, 'update')
            }
            setModal(null); setImageFile(null); setImagePreview('')
        } catch (e) { showToast('Lỗi: ' + (e.response?.data?.message || e.message), 'error') }
        finally { setSub(false) }
    }

    const handleDelete = async (p) => {
        if (!window.confirm(`Xóa sản phẩm "${p.productName || p.name}"?`)) return
        try {
            await http.delete(`/admin/products/${p.id}`, { headers: logHeaders })
            setProducts(prev => prev.filter(x => x.id !== p.id))
            showToast('✅ Đã xóa sản phẩm')
            // 🔴 FIX: Broadcast real-time xóa sản phẩm
            broadcastProductUpdate({ id: p.id, name: p.productName || p.name }, 'delete')
        } catch (e) { showToast('Lỗi xóa: ' + (e.response?.data?.message || e.message), 'error') }
    }

    const filtered = products.filter(p => {
        const name = (p.productName || p.name || '').toLowerCase()
        const cat = (typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác'
        return name.includes(search.toLowerCase()) && (catFilter === 'all' || cat === catFilter)
    })

    return (
        <div style={S.wrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Quản Lý Sản Phẩm</h1>
                    <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>{products.length} sản phẩm · {cats.length - 1} danh mục <span style={{ marginLeft: 12, color: '#f59e0b', fontSize: 12 }}>📋 Ghi nhật ký bởi {performedBy}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchProducts} style={{ background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={13} />Làm mới</button>
                    <button onClick={openAdd} style={{ background: '#f59e0b', color: '#111', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} />Thêm sản phẩm</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={14} color="#6b7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên sản phẩm..." style={{ ...S.input, paddingLeft: 34 }} />
                </div>
                <select value={catFilter} onChange={e => setCat(e.target.value)} style={{ background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}>
                    {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'Tất cả danh mục' : c}</option>)}
                </select>
            </div>

            <div style={{ ...S.card, overflow: 'auto' }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #374151', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                        <p style={{ color: '#6b7280', fontSize: 13 }}>Đang tải...</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                        <thead>
                            <tr>{['ID', 'Ảnh', 'Tên sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Mô tả', 'Thao tác'].map(h => (
                                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', background: '#111827', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                    <Package size={40} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />Không có sản phẩm nào
                                </td></tr>
                            ) : filtered.map((p, i) => (
                                <tr key={p.id} style={{ background: i % 2 === 1 ? '#111827' : 'transparent', borderTop: '1px solid #374151' }}>
                                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>#{p.id}</td>
                                    <td style={{ padding: '8px 14px' }}>
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.productName} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid #374151', cursor: 'pointer', display: 'block' }}
                                                onClick={() => setPreviewImg({ src: p.imageUrl, name: p.productName || p.name })}
                                                onError={e => { e.target.outerHTML = '<div style="width:52px;height:52px;borderRadius:8px;background:#374151;display:flex;align-items:center;justify-content:center;border:1px dashed #4b5563;font-size:18px">📦</div>' }} />
                                        ) : (
                                            <div style={{ width: 52, height: 52, borderRadius: 8, background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563', fontSize: 18 }}>📦</div>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{p.productName || p.name}</td>
                                    <td style={{ padding: '10px 14px' }}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{(typeof p.category === 'string' ? p.category : p.category?.name) || 'Khác'}</span></td>
                                    <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{Number(p.price || 0).toLocaleString('vi-VN')}đ</td>
                                    <td style={{ padding: '10px 14px' }}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: (p.availability || 0) > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: (p.availability || 0) > 0 ? '#22c55e' : '#ef4444' }}>{p.availability ?? 0}</span></td>
                                    <td style={{ padding: '10px 14px', color: '#9ca3af', fontSize: 12, maxWidth: 160 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.discription || p.description || '—'}</div></td>
                                    <td style={{ padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            {p.imageUrl && <button onClick={() => setPreviewImg({ src: p.imageUrl, name: p.productName || p.name })} style={{ width: 30, height: 30, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xem ảnh"><Eye size={13} /></button>}
                                            <button onClick={() => openEdit(p)} style={{ width: 30, height: 30, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa"><Edit2 size={13} /></button>
                                            <button onClick={() => handleDelete(p)} style={{ width: 30, height: 30, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa"><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Thêm/Sửa */}
            {modal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={() => setModal(null)}>
                    <div style={{ ...S.card, width: '100%', maxWidth: 540, maxHeight: '93vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{modal.mode === 'add' ? '➕ Thêm sản phẩm mới' : `✏️ Sửa: ${modal.product?.productName}`}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ margin: '12px 20px 0', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ClipboardList size={12} color="#f59e0b" />Thao tác ghi nhật ký bởi <strong style={{ color: '#f59e0b' }}>{performedBy}</strong> ({role})
                        </div>
                        <form onSubmit={handleSave} style={{ padding: 20 }}>
                            {/* Khu vực ảnh */}
                            <div style={{ marginBottom: 18 }}>
                                <label style={S.label}>Hình ảnh sản phẩm</label>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    {/* Preview */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="preview" style={{ width: 110, height: 110, objectFit: 'cover', borderRadius: 10, border: '2px solid #374151', display: 'block' }} onError={e => { e.target.style.display = 'none' }} />
                                                <button type="button" onClick={() => { if (imageFile) clearSelectedFile(); else if (modal.mode === 'edit' && modal.product?.id) handleDeleteImage(modal.product.id) }}
                                                    style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: '2px solid #111827', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} title={imageFile ? 'Bỏ chọn' : 'Xóa ảnh'}>
                                                    <X size={11} />
                                                </button>
                                                {imageFile && <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}><span style={{ background: '#f59e0b', color: '#111', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>MỚI</span></div>}
                                            </>
                                        ) : (
                                            <div style={{ width: 110, height: 110, borderRadius: 10, background: '#111827', border: '2px dashed #374151', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <Package size={28} color="#4b5563" /><span style={{ fontSize: 10, color: '#6b7280' }}>Chưa có ảnh</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Controls */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="prod-img-input" />
                                        <label htmlFor="prod-img-input" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: '#374151', color: '#d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, userSelect: 'none' }}>
                                            <ImagePlus size={14} />{imageFile ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
                                        </label>
                                        <input type="url" value={imageFile ? '' : (form.imageUrl || '')} onChange={e => { if (!imageFile) { setForm(f => ({ ...f, imageUrl: e.target.value })); setImagePreview(e.target.value) } }}
                                            placeholder="Hoặc dán URL ảnh..." disabled={!!imageFile} style={{ ...S.input, fontSize: 12, opacity: imageFile ? 0.4 : 1 }} />
                                        <p style={{ fontSize: 10, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
                                            JPG, PNG, WEBP · Tối đa 5MB
                                            {imageFile && <><br /><span style={{ color: '#f59e0b' }}>📎 {imageFile.name} ({(imageFile.size / 1024).toFixed(0)}KB)</span></>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={S.label}>Tên sản phẩm *</label>
                                <input value={form.productName} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))} required placeholder="Cà phê đen, Trà sữa..." style={S.input} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div>
                                    <label style={S.label}>Giá (VNĐ) *</label>
                                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required min={0} placeholder="35000" style={S.input} />
                                </div>
                                <div>
                                    <label style={S.label}>Tồn kho</label>
                                    <input type="number" value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} min={0} placeholder="100" style={S.input} />
                                </div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={S.label}>Danh mục *</label>
                                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} required placeholder="Coffee, Tea, Food..." style={S.input} />
                                {cats.filter(c => c !== 'all').length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                        {cats.filter(c => c !== 'all').map(c => (
                                            <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))} style={{ background: form.category === c ? '#f59e0b' : '#374151', color: form.category === c ? '#111' : '#d1d5db', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>{c}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={S.label}>Mô tả</label>
                                <textarea value={form.discription} onChange={e => setForm(p => ({ ...p, discription: e.target.value }))} rows={3} placeholder="Mô tả sản phẩm..." style={{ ...S.input, resize: 'vertical' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, background: '#374151', color: '#d1d5db', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontSize: 13 }}>Hủy</button>
                                <button type="submit" disabled={submitting || uploadingImg} style={{ flex: 2, background: '#f59e0b', color: '#111', border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {(submitting || uploadingImg) ? <><div style={{ width: 14, height: 14, border: '2px solid #111', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{uploadingImg ? 'Đang upload...' : 'Đang lưu...'}</> : (modal.mode === 'add' ? 'Thêm sản phẩm' : 'Lưu thay đổi')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {previewImg && <ImagePreviewModal src={previewImg.src} productName={previewImg.name} onClose={() => setPreviewImg(null)} />}
            {toast && <Toast {...toast} />}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}