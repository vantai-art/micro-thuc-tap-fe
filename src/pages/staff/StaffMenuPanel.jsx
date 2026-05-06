import React, { useState } from "react";
import useTableOrderStore from "../../store/useTableOrderStore";
import { useTableSocket } from "../../hooks/useTableSocket";
import { fmtVND } from "../../utils/tableFormat";

export default function StaffMenuPanel({ menuItems, allTableIds }) {
    const { activeTableId, tableOrders, addItem } = useTableOrderStore();
    const { emitUpdate } = useTableSocket(allTableIds);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tất cả");

    const table = activeTableId ? tableOrders[activeTableId] : null;
    const canAdd = table && table.status !== "waiting_payment"
        && table.status !== "paid";

    const categories = ["Tất cả", ...new Set(
        menuItems.map((p) => p.category || "Khác")
    )];

    const filtered = menuItems.filter((p) => {
        const matchCat = activeCategory === "Tất cả"
            || (p.category || "Khác") === activeCategory;
        const matchSearch = (p.productName || "").toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const handleAdd = (product) => {
        if (!activeTableId || !canAdd) return;
        addItem(activeTableId, {
            productId: product.id,
            name: product.productName,
            price: product.price,
        });
        emitUpdate(activeTableId);
    };

    return (
        <div style={{
            width: 320, borderLeft: "1px solid #F3F4F6",
            display: "flex", flexDirection: "column",
            height: "100%", background: "#FAFAFA",
        }}>
            {/* Search */}
            <div style={{ padding: "12px 12px 0" }}>
                <input
                    type="text"
                    placeholder="🔍 Tìm món..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%", padding: "8px 12px",
                        border: "1px solid #E5E7EB", borderRadius: 10,
                        fontSize: 13, background: "#fff",
                        outline: "none", boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Category tabs */}
            <div style={{
                display: "flex", gap: 6, padding: "10px 12px",
                overflowX: "auto", flexShrink: 0,
            }}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            flexShrink: 0, padding: "5px 12px",
                            borderRadius: 20, fontSize: 12, fontWeight: 500,
                            border: "1px solid",
                            borderColor: activeCategory === cat ? "#2563EB" : "#E5E7EB",
                            background: activeCategory === cat ? "#EFF6FF" : "#fff",
                            color: activeCategory === cat ? "#1D4ED8" : "#6B7280",
                            cursor: "pointer", whiteSpace: "nowrap",
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* No table selected warning */}
            {!activeTableId && (
                <div style={{
                    margin: "0 12px 10px", padding: "8px 12px",
                    background: "#FFFBEB", border: "1px solid #FDE68A",
                    borderRadius: 8, fontSize: 12, color: "#92400E",
                }}>
                    ⚠️ Chọn bàn trước khi thêm món
                </div>
            )}

            {/* Product grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                }}>
                    {filtered.map((product) => {
                        const inCart = table?.items?.find(
                            (i) => i.productId === product.id
                        );
                        return (
                            <button
                                key={product.id}
                                onClick={() => handleAdd(product)}
                                disabled={!canAdd}
                                style={{
                                    background: "#fff",
                                    border: inCart
                                        ? "1.5px solid #BFDBFE"
                                        : "1px solid #F3F4F6",
                                    borderRadius: 12, padding: 10,
                                    textAlign: "left", cursor: canAdd ? "pointer" : "not-allowed",
                                    opacity: canAdd ? 1 : 0.5,
                                    position: "relative",
                                    transition: "border-color 0.15s",
                                }}
                            >
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        style={{
                                            width: "100%", height: 80,
                                            objectFit: "cover", borderRadius: 8,
                                            marginBottom: 8, display: "block",
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: "100%", height: 80,
                                        background: "#F3F4F6", borderRadius: 8,
                                        marginBottom: 8, display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        fontSize: 28,
                                    }}>
                                        🍽
                                    </div>
                                )}
                                <p style={{
                                    margin: 0, fontSize: 12, fontWeight: 500,
                                    color: "#111827", lineHeight: 1.3,
                                    overflow: "hidden", textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                                }}>
                                    {product.productName}
                                </p>
                                <p style={{
                                    margin: "4px 0 0", fontSize: 12,
                                    fontWeight: 700, color: "#2563EB"
                                }}>
                                    {fmtVND(product.price)}
                                </p>

                                {inCart && (
                                    <span style={{
                                        position: "absolute", top: 8, right: 8,
                                        width: 20, height: 20, borderRadius: "50%",
                                        background: "#2563EB", color: "#fff",
                                        fontSize: 11, fontWeight: 700,
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        {inCart.qty}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}