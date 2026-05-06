import React, { useEffect, useState } from "react";
import StaffTableSidebar from "./StaffTableSidebar";     // ← sửa path
import StaffCartPanel from "./StaffCartPanel";           // ← sửa path
import StaffMenuPanel from "./StaffMenuPanel";           // ← sửa path
import TableQRModal from "./TableQRModal";               // ← sửa path
import AddTableModal from "./AddTableModal";             // ← sửa path
import useTableOrderStore from "../../store/useTableOrderStore";
import { tableOrderApi } from "../../services/tableOrderApi";

export default function StaffDashboard() {
    const { activeTableId, tableOrders, initTable, getActiveTable } =
        useTableOrderStore();

    const [tables, setTables] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [showQR, setShowQR] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const allTableIds = tables.map((t) => String(t.id)); // BE dùng id (Long)

    useEffect(() => {
        Promise.all([
            tableOrderApi.getAllTables(),
            tableOrderApi.getMenu(),
        ]).then(([tablesRes, menuRes]) => {
            // BE trả về List<DiningTable> — dùng id (Long) và number (Integer)
            const tableList = tablesRes.data || [];
            setTables(tableList);

            // Init store với id của bàn làm key
            tableList.forEach((t) =>
                initTable(String(t.id), `Bàn ${t.number}`)
            );

            // BE product-catalog-service trả về page hoặc list
            const menu = menuRes.data?.content || menuRes.data || [];
            setMenuItems(Array.isArray(menu) ? menu : []);
        }).catch((e) => {
            setError("Lỗi tải dữ liệu: " + (e.response?.data?.message || e.message));
        }).finally(() => setLoading(false));
    }, []);

    const handleAddTable = async (tableName, capacity) => {
        try {
            // BE nhận { number, capacity, note }
            // Tách số từ tên bàn nếu có, VD "Bàn 5" → number=5
            const num = parseInt(tableName.replace(/\D/g, "")) || Date.now() % 1000;
            const res = await tableOrderApi.createTable(num, capacity);
            const newTable = res.data;
            setTables((prev) => [...prev, newTable]);
            initTable(String(newTable.id), `Bàn ${newTable.number}`);
            setShowAdd(false);
        } catch (e) {
            alert("Lỗi tạo bàn: " + (e.response?.data?.message || e.message));
        }
    };

    const activeTable = getActiveTable();

    if (loading) {
        return (
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", height: "100vh",
                color: "#9CA3AF", fontSize: 14, flexDirection: "column", gap: 12,
            }}>
                <div style={{
                    width: 32, height: 32, border: "3px solid #E5E7EB",
                    borderTopColor: "#2563EB", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Đang tải...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100vh", color: "#DC2626", fontSize: 14, flexDirection: "column", gap: 12,
            }}>
                <span style={{ fontSize: 40 }}>⚠️</span>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: "8px 20px", background: "#2563EB", color: "#fff",
                        border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    }}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div style={{
            display: "flex", flexDirection: "column",
            height: "100vh", background: "#F9FAFB",
            fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* ── Top bar ─────────────────────────────────────────── */}
            <header style={{
                background: "#fff", borderBottom: "1px solid #F3F4F6",
                padding: "0 20px", height: 56,
                display: "flex", alignItems: "center",
                justifyContent: "space-between", flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🍽</span>
                    <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>
                        Quản lý bàn
                    </h1>
                    {activeTable && (
                        <>
                            <span style={{ color: "#D1D5DB" }}>›</span>
                            <span style={{ fontSize: 14, color: "#6B7280" }}>
                                {activeTable.tableName}
                            </span>
                        </>
                    )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* Link về StaffPage cũ */}

                    <a
                        href="/staff"
                        style={{
                            ...headerBtnStyle,
                            textDecoration: "none", display: "inline-flex",
                            alignItems: "center", gap: 4,
                        }}
                    >
                        ← POS cũ
                    </a>

                    {activeTableId && (
                        <button onClick={() => setShowQR(true)} style={headerBtnStyle}>
                            📱 QR bàn
                        </button>
                    )}
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{
                            ...headerBtnStyle,
                            background: "#1D4ED8", color: "#fff",
                            borderColor: "#1D4ED8",
                        }}
                    >
                        + Thêm bàn
                    </button>
                </div>
            </header>

            {/* ── Main ────────────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <StaffTableSidebar
                    tables={tables}
                    onAddTable={() => setShowAdd(true)}
                />
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    <StaffCartPanel allTableIds={allTableIds} />
                    <StaffMenuPanel
                        menuItems={menuItems}
                        allTableIds={allTableIds}
                    />
                </div>
            </div>

            {/* ── Modals ──────────────────────────────────────────── */}
            {
                showQR && activeTable && (
                    <TableQRModal
                        table={activeTable}
                        onClose={() => setShowQR(false)}
                    />
                )
            }
            {
                showAdd && (
                    <AddTableModal
                        onConfirm={handleAddTable}
                        onClose={() => setShowAdd(false)}
                    />
                )
            }
        </div>
    );
}

const headerBtnStyle = {
    padding: "7px 14px", borderRadius: 8,
    border: "1px solid #E5E7EB", background: "#fff",
    color: "#374151", fontSize: 13, fontWeight: 500,
    cursor: "pointer",
};