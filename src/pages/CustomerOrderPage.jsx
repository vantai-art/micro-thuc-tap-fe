import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import useTableOrderStore from "../store/useTableOrderStore";
import { tableOrderApi } from "../services/tableOrderApi";
import { useTableSocket } from "../hooks/useTableSocket";
import { fmtVND } from "../utils/tableFormat";

export default function CustomerOrderPage() {
    const [searchParams] = useSearchParams();
    const qrToken = searchParams.get("token");
    const tableIdQ = searchParams.get("tableId");

    const [tableInfo, setTableInfo] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState("Tất cả");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const {
        tableOrders, initTable, openTable,
        addItem, changeQty, removeItem,
        getTotal, getItemCount,
    } = useTableOrderStore();

    const { emitUpdate, emitItemAdded, emitRequestCheckout } =
        useTableSocket(tableInfo ? [tableInfo.tableId] : []);

    useEffect(() => {
        const init = async () => {
            try {
                let table;
                if (qrToken) {
                    const res = await tableOrderApi.resolveQRToken(qrToken);
                    table = res.data;
                } else if (tableIdQ) {
                    const res = await tableOrderApi.getAllTables();
                    table = res.data.find((t) => t.tableId === tableIdQ);
                }
                if (!table) { setError("Không tìm thấy bàn"); return; }

                setTableInfo(table);
                initTable(table.tableId, table.tableName);
                openTable(table.tableId);

                const menuRes = await tableOrderApi.getMenu();
                setMenuItems(menuRes.data.content || menuRes.data);
            } catch (e) {
                setError("Lỗi tải trang: " + e.message);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleAdd = useCallback((product) => {
        if (!tableInfo) return;
        const item = {
            productId: product.id,
            name: product.name,
            price: product.price,
        };
        addItem(tableInfo.tableId, item);
        emitItemAdded(tableInfo.tableId, item); // thông báo real-time cho staff
    }, [tableInfo]);

    const handleSubmit = async () => {
        if (!tableInfo) return;
        const table = tableOrders[tableInfo.tableId];
        if (!table?.items?.length) return;
        setSubmitting(true);
        try {
            await tableOrderApi.submitOrder(
                tableInfo.tableId, table.items, table.note, {}
            );
            emitUpdate(tableInfo.tableId);
            setSubmitted(true);
        } catch (e) {
            alert("Lỗi gọi món: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestBill = () => {
        if (!tableInfo) return;
        emitRequestCheckout(tableInfo.tableId);
        alert("✅ Đã gửi yêu cầu thanh toán. Nhân viên sẽ đến ngay!");
    };

    if (loading) return <Centered>Đang tải menu...</Centered>;
    if (error) return <Centered style={{ color: "#DC2626" }}>{error}</Centered>;
    if (submitted) return (
        <Centered>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56 }}>✅</div>
                <h2 style={{
                    fontSize: 18, fontWeight: 700,
                    color: "#111827", margin: "12px 0 6px"
                }}>
                    Gọi món thành công!
                </h2>
                <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px" }}>
                    Nhân viên đã nhận đơn và sẽ phục vụ ngay
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    style={{
                        padding: "11px 28px", background: "#1D4ED8",
                        color: "#fff", border: "none", borderRadius: 12,
                        fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                >
                    Gọi thêm món
                </button>
                <button
                    onClick={handleRequestBill}
                    style={{
                        display: "block", marginTop: 12,
                        padding: "11px 28px", background: "#fff",
                        color: "#374151", border: "1px solid #E5E7EB",
                        borderRadius: 12, fontSize: 14,
                        fontWeight: 500, cursor: "pointer",
                        width: "100%",
                    }}
                >
                    🔔 Gọi thanh toán
                </button>
            </div>
        </Centered>
    );

    const table = tableInfo ? tableOrders[tableInfo.tableId] : null;
    const cartCount = tableInfo ? getItemCount(tableInfo.tableId) : 0;
    const cartTotal = tableInfo ? getTotal(tableInfo.tableId) : 0;

    const categories = ["Tất cả", ...new Set(
        menuItems.map((p) => p.categoryName || "Khác")
    )];

    const filtered = menuItems.filter((p) => {
        const matchCat = activeCategory === "Tất cả"
            || p.categoryName === activeCategory;
        const matchSearch = p.name.toLowerCase()
            .includes(search.toLowerCase());
        return matchCat && matchSearch && p.available !== false;
    });

    return (
        <div style={{
            minHeight: "100vh", background: "#F9FAFB",
            fontFamily: "system-ui, -apple-system, sans-serif",
            paddingBottom: cartCount > 0 ? 100 : 24,
        }}>

            {/* ── Header ────────────────────────── */}
            <div style={{
                position: "sticky", top: 0, zIndex: 10,
                background: "#fff", borderBottom: "1px solid #F3F4F6",
                padding: "14px 16px",
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center", justifyContent: "space-between"
                }}>
                    <div>
                        <h1 style={{
                            margin: 0, fontSize: 16, fontWeight: 700,
                            color: "#111827"
                        }}>
                            {tableInfo?.tableName}
                        </h1>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>
                            Ăn tại nhà hàng
                        </p>
                    </div>
                    {cartCount > 0 && (
                        <span style={{
                            background: "#1D4ED8", color: "#fff",
                            fontSize: 12, fontWeight: 700,
                            padding: "6px 14px", borderRadius: 20,
                        }}>
                            {cartCount} món
                        </span>
                    )}
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="🔍 Tìm món..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        marginTop: 10, width: "100%",
                        padding: "9px 14px", borderRadius: 10,
                        border: "1px solid #E5E7EB", fontSize: 13,
                        background: "#F9FAFB", outline: "none",
                        boxSizing: "border-box",
                    }}
                />

                {/* Category tabs */}
                <div style={{
                    display: "flex", gap: 6, marginTop: 10,
                    overflowX: "auto", paddingBottom: 2,
                }}>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                flexShrink: 0, padding: "5px 14px",
                                borderRadius: 20, fontSize: 12, fontWeight: 500,
                                border: "1px solid",
                                borderColor: activeCategory === cat ? "#1D4ED8" : "#E5E7EB",
                                background: activeCategory === cat ? "#EFF6FF" : "#fff",
                                color: activeCategory === cat ? "#1D4ED8" : "#6B7280",
                                cursor: "pointer",
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Menu list ─────────────────────── */}
            <div style={{ padding: "12px 16px" }}>
                {filtered.length === 0 ? (
                    <div style={{
                        textAlign: "center", padding: "40px 0",
                        color: "#9CA3AF", fontSize: 14
                    }}>
                        Không tìm thấy món nào
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filtered.map((product) => {
                            const inCart = table?.items?.find(
                                (i) => i.productId === product.id
                            );
                            return (
                                <CustomerMenuCard
                                    key={product.id}
                                    product={product}
                                    inCart={inCart}
                                    onAdd={() => handleAdd(product)}
                                    onIncrease={() => {
                                        changeQty(tableInfo.tableId, product.id, +1);
                                        emitUpdate(tableInfo.tableId);
                                    }}
                                    onDecrease={() => {
                                        changeQty(tableInfo.tableId, product.id, -1);
                                        emitUpdate(tableInfo.tableId);
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Sticky bottom cart bar ─────────── */}
            {cartCount > 0 && (
                <div style={{
                    position: "fixed", bottom: 0, left: 0, right: 0,
                    background: "#fff", borderTop: "1px solid #F3F4F6",
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0, fontSize: 14, fontWeight: 700,
                            color: "#111827"
                        }}>
                            {cartCount} món · {fmtVND(cartTotal)}
                        </p>
                        <p style={{ margin: "1px 0 0", fontSize: 11, color: "#9CA3AF" }}>
                            {tableInfo?.tableName}
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            padding: "12px 24px",
                            background: submitting ? "#E5E7EB" : "#059669",
                            color: submitting ? "#9CA3AF" : "#fff",
                            border: "none", borderRadius: 12,
                            fontSize: 14, fontWeight: 700,
                            cursor: submitting ? "not-allowed" : "pointer",
                        }}
                    >
                        {submitting ? "Đang gửi..." : "🔔 Gọi món"}
                    </button>
                </div>
            )}
        </div>
    );
}

function CustomerMenuCard({ product, inCart, onAdd, onIncrease, onDecrease }) {
    return (
        <div style={{
            background: "#fff", borderRadius: 14,
            border: inCart ? "1.5px solid #BFDBFE" : "1px solid #F3F4F6",
            padding: 12, display: "flex", gap: 12, alignItems: "center",
        }}>
            {product.image ? (
                <img
                    src={product.image}
                    alt={product.name}
                    style={{
                        width: 72, height: 72, objectFit: "cover",
                        borderRadius: 10, flexShrink: 0
                    }}
                />
            ) : (
                <div style={{
                    width: 72, height: 72, background: "#F3F4F6",
                    borderRadius: 10, flexShrink: 0,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 28,
                }}>
                    🍜
                </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: 14, fontWeight: 600,
                    color: "#111827", lineHeight: 1.3
                }}>
                    {product.name}
                </p>
                {product.description && (
                    <p style={{
                        margin: "3px 0 0", fontSize: 12, color: "#9CA3AF",
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical"
                    }}>
                        {product.description}
                    </p>
                )}
                <p style={{
                    margin: "5px 0 0", fontSize: 14,
                    fontWeight: 700, color: "#1D4ED8"
                }}>
                    {fmtVND(product.price)}
                </p>
            </div>

            {inCart ? (
                <div style={{
                    display: "flex", alignItems: "center",
                    gap: 8, flexShrink: 0
                }}>
                    <button onClick={onDecrease} style={cQtyBtn}>−</button>
                    <span style={{
                        fontSize: 14, fontWeight: 700,
                        minWidth: 22, textAlign: "center", color: "#111827"
                    }}>
                        {inCart.qty}
                    </span>
                    <button onClick={onIncrease} style={{
                        ...cQtyBtn, background: "#1D4ED8", color: "#fff",
                        borderColor: "#1D4ED8",
                    }}>+</button>
                </div>
            ) : (
                <button
                    onClick={onAdd}
                    style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#1D4ED8", color: "#fff",
                        border: "none", fontSize: 22, lineHeight: 1,
                        cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    +
                </button>
            )}
        </div>
    );
}

const cQtyBtn = {
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid #E5E7EB", background: "#fff",
    cursor: "pointer", fontSize: 16, lineHeight: 1,
    color: "#374151", display: "flex",
    alignItems: "center", justifyContent: "center",
};

function Centered({ children, style }) {
    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "center", minHeight: "100vh",
            padding: 20, ...style,
        }}>
            {children}
        </div>
    );
}