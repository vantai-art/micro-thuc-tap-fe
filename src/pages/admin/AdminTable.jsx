import React, { useState, useEffect, useCallback } from "react";
import {
    Plus, Edit2, Trash2, Search, X, AlertCircle,
    CheckCircle, RefreshCw, Users, Coffee
} from "lucide-react";
import http from "../../services/api";

function AdminTable() {
    const [tables, setTables] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({ number: "", capacity: "", status: "FREE", note: "" });

    const fetchTables = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await http.get("/tables");
            const data = res.data?.data || res.data;
            const list = Array.isArray(data) ? data : [];
            list.sort((a, b) => (a.number || 0) - (b.number || 0));
            setTables(list);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Không thể tải danh sách bàn");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.number || Number(formData.number) <= 0) { setError("Số bàn phải lớn hơn 0!"); return; }
        if (!formData.capacity || Number(formData.capacity) <= 0) { setError("Sức chứa phải lớn hơn 0!"); return; }
        setLoading(true); setError(null); setSuccess(null);
        const payload = { number: Number(formData.number), capacity: Number(formData.capacity), status: formData.status, note: formData.note || "" };
        try {
            if (editing) {
                await http.put(`/tables/${editing.id}`, payload);
                setSuccess("Cập nhật bàn thành công!");
            } else {
                await http.post("/tables", payload);
                setSuccess("Thêm bàn mới thành công!");
            }
            await fetchTables();
            closeModal();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Không thể lưu bàn");
        } finally { setLoading(false); }
    };

    const handleDelete = async (id, number) => {
        if (!window.confirm(`Xóa Bàn ${number}?`)) return;
        setLoading(true); setError(null);
        try {
            await http.delete(`/tables/${id}`);
            setSuccess(`Đã xóa Bàn ${number}!`);
            await fetchTables();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Không thể xóa bàn");
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (table, newStatus) => {
        try {
            await http.put(`/tables/${table.id}`, { number: table.number, capacity: table.capacity, status: newStatus, note: table.note || "" });
            await fetchTables();
            setSuccess(`Bàn ${table.number} → ${getStatusText(newStatus)}`);
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) { setError("Không thể cập nhật trạng thái"); }
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setFormData({ number: "", capacity: "", status: "FREE", note: "" }); setError(null); };
    const openEdit = (table) => { setEditing(table); setFormData({ number: table.number, capacity: table.capacity, status: table.status, note: table.note || "" }); setShowModal(true); setError(null); };

    const getStatusColor = (s) => s === "FREE" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/40" : s === "OCCUPIED" ? "text-red-400 bg-red-500/10 border-red-500/40" : s === "RESERVED" ? "text-amber-400 bg-amber-500/10 border-amber-500/40" : "text-gray-400 bg-gray-500/10 border-gray-500/40";
    const getStatusDot = (s) => s === "FREE" ? "bg-emerald-400" : s === "OCCUPIED" ? "bg-red-400" : s === "RESERVED" ? "bg-amber-400" : "bg-gray-400";
    const getStatusText = (s) => s === "FREE" ? "Trống" : s === "OCCUPIED" ? "Đang có khách" : s === "RESERVED" ? "Đã đặt" : s;

    const stats = { total: tables.length, free: tables.filter(t => t.status === "FREE").length, occupied: tables.filter(t => t.status === "OCCUPIED").length, reserved: tables.filter(t => t.status === "RESERVED").length };
    const filtered = tables.filter(t => {
        const ms = t.number?.toString().includes(searchTerm) || (t.note || "").toLowerCase().includes(searchTerm.toLowerCase());
        const mf = filterStatus === "ALL" || t.status === filterStatus;
        return ms && mf;
    });

    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Coffee className="w-7 h-7 text-amber-500" /> Quản Lý Bàn
                    </h1>
                    <p className="text-gray-400 text-sm">Sơ đồ bàn và trạng thái phục vụ</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchTables} disabled={loading} className="p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white transition-all disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={() => { setEditing(null); setFormData({ number: "", capacity: "", status: "FREE", note: "" }); setShowModal(true); setError(null); }}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-lg shadow-amber-900/30">
                        <Plus className="w-4 h-4" /> Thêm Bàn
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Tổng bàn", value: stats.total, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Đang trống", value: stats.free, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Có khách", value: stats.occupied, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "Đặt trước", value: stats.reserved, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-gray-400 text-xs mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Alerts */}
            {success && (
                <div className="mb-5 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                    <button onClick={() => setSuccess(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}
            {error && (
                <div className="mb-5 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Tìm theo số bàn, ghi chú..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 text-white pl-9 pr-4 py-2.5 rounded-lg border border-gray-700 focus:border-amber-500 outline-none text-sm" />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[["ALL", "Tất cả"], ["FREE", "Trống"], ["OCCUPIED", "Có khách"], ["RESERVED", "Đặt trước"]].map(([v, l]) => (
                        <button key={v} onClick={() => setFilterStatus(v)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${filterStatus === v ? "bg-amber-600 border-amber-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"}`}>
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && tables.length === 0 && (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-amber-500 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Đang tải...</p>
                </div>
            )}

            {/* Empty */}
            {!loading && tables.length === 0 && (
                <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                    <Coffee className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">Chưa có bàn nào</p>
                    <button onClick={() => setShowModal(true)} className="text-amber-500 hover:text-amber-400 text-sm font-semibold">+ Thêm bàn đầu tiên</button>
                </div>
            )}

            {/* Grid */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map(table => (
                        <div key={table.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Bàn</div>
                                    <div className="text-3xl font-black text-white leading-none">{table.number}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(table.status)}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(table.status)}`} />
                                    {getStatusText(table.status)}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                                <Users className="w-3 h-3" />{table.capacity} người
                            </div>
                            {table.note && <div className="text-gray-500 text-[11px] mb-3 truncate">{table.note}</div>}

                            {/* Quick toggle */}
                            <div className="flex gap-1 mb-3">
                                {["FREE", "OCCUPIED", "RESERVED"].filter(s => s !== table.status).map(s => (
                                    <button key={s} onClick={() => handleStatusChange(table, s)}
                                        className="flex-1 text-[10px] py-1 rounded-md border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-all truncate px-1"
                                        title={`Đổi sang ${getStatusText(s)}`}>
                                        {getStatusText(s)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-gray-700">
                                <button onClick={() => openEdit(table)}
                                    className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all">
                                    <Edit2 className="w-3 h-3" /> Sửa
                                </button>
                                <button onClick={() => handleDelete(table.id, table.number)}
                                    disabled={table.status === "OCCUPIED"}
                                    className="flex-1 bg-red-600/80 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-500 text-white py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                                    title={table.status === "OCCUPIED" ? "Không xóa được bàn đang có khách" : ""}>
                                    <Trash2 className="w-3 h-3" /> Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filtered.length === 0 && tables.length > 0 && (
                <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                    <p className="text-gray-400 text-sm">Không tìm thấy bàn nào</p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h2 className="text-xl font-bold text-white">{editing ? `Sửa Bàn ${editing.number}` : "Thêm Bàn Mới"}</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            {error && (
                                <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-2.5 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-gray-300 text-sm font-medium block mb-1.5">Số Bàn <span className="text-red-400">*</span></label>
                                        <input type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:border-amber-500 outline-none text-sm"
                                            required min="1" placeholder="VD: 1" />
                                    </div>
                                    <div>
                                        <label className="text-gray-300 text-sm font-medium block mb-1.5">Sức Chứa <span className="text-red-400">*</span></label>
                                        <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                            className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:border-amber-500 outline-none text-sm"
                                            required min="1" placeholder="VD: 4" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-300 text-sm font-medium block mb-1.5">Trạng Thái</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { v: "FREE", l: "Trống", c: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400" },
                                            { v: "OCCUPIED", l: "Có khách", c: "border-red-500/60 bg-red-500/10 text-red-400" },
                                            { v: "RESERVED", l: "Đặt trước", c: "border-amber-500/60 bg-amber-500/10 text-amber-400" },
                                        ].map(opt => (
                                            <button key={opt.v} type="button" onClick={() => setFormData({ ...formData, status: opt.v })}
                                                className={`py-2 rounded-lg border text-xs font-semibold transition-all ${formData.status === opt.v ? opt.c : "border-gray-700 bg-gray-800 text-gray-500 hover:border-gray-600"}`}>
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-gray-300 text-sm font-medium block mb-1.5">Ghi Chú</label>
                                    <input type="text" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:border-amber-500 outline-none text-sm"
                                        placeholder="VD: Tầng 1 - cạnh cửa sổ" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={closeModal}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm font-medium border border-gray-700 transition-all">
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2">
                                        {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Đang lưu...</> : editing ? "Cập Nhật" : "Thêm Mới"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminTable;
