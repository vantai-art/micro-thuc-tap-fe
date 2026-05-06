import React, { useState } from "react";
import useTableOrderStore from "../../store/useTableOrderStore";
import { tableOrderApi } from "../../services/tableOrderApi";
import { useTableSocket } from "../../hooks/useTableSocket";
import { fmtVND, fmtTime, TABLE_STATUS } from "../../utils/tableFormat";

const PAYMENT_METHODS = [
    { value: "cash", label: "💵 Tiền mặt" },
    { value: "transfer", label: "🏦 Chuyển khoản" },
    { value: "card", label: "💳 Thẻ" },
    { value: "momo", label: "📱 MoMo" },
    { value: "zalopay", label: "💚 ZaloPay" },
];

export default function StaffCartPanel({ allTableIds }) {
    const {
        activeTableId, tableOrders,
        changeQty, removeItem, updateTableMeta,
        setTableStatus, resetTable,
        getTotal, setOrderId,
    } = useTableOrderStore();

    const { emitUpdate, emitRequestCheckout } = useTableSocket(allTableIds);

    const [payMethod, setPayMethod] = useState("cash");
    const [loading, setLoading] = useState(false);

    const table = activeTableId ? tableOrders[activeTableId] : null;

    if (!table) {
        return (
            <div style={{
                flex: 1, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column",
                gap: 12, color: "#9CA3AF",
            }}>
                <span style={{ fontSize: 48 }}>🪑</span>
                <p style={{ fontSize: 14, margin: 0 }}>Chọn bàn bên trái để xem đơn</p>
            </div>
        );
    }

    const total = getTotal(activeTableId);
    const cfg = TABLE_STATUS[table.status];

    const handleQty = (productId, delta) => {
        changeQty(activeTableId, productId, delta);
        emitUpdate(activeTableId);
    };

    const handleRemove = (productId) => {
        removeItem(activeTableId, productId);
        emitUpdate(activeTableId);
    };

    const handleNoteChange = (val) => {
        updateTableMeta(activeTableId, { note: val });
    };

    const handleSubmitToKitchen = async () => {
        if (!table.items.length) return;
        setLoading(true);
        try {
            const res = await tableOrderApi.submitOrder(
                activeTableId, table.items, table.note,
                { customerId: table.customerId, customerName: table.customerName }
            );
            setOrderId(activeTableId, res.data.id);
            setTableStatus(activeTableId, "ordered");
            emitUpdate(activeTableId);
        } catch (e) {
            alert("Lỗi gửi bếp: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCheckout = () => {
        setTableStatus(activeTableId, "waiting_payment");
        emitRequestCheckout(activeTableId);
    };

    const handleConfirmPayment = async () => {
        if (!table.orderId) {
            alert("Chưa có order để thanh toán");
            return;
        }
        setLoading(true);
        try {
            await tableOrderApi.confirmPayment(table.orderId, payMethod);
            resetTable(activeTableId);
            emitUpdate(activeTableId);
        } catch (e) {
            alert("Lỗi thanh toán: " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCloseTable = () => {
        if (!window.confirm(`Đóng ${table.tableName}? Mọi đơn chưa thanh toán sẽ bị xóa.`))
            return;
        resetTable(activeTableId);
        emitUpdate(activeTableId);
    };

    return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* ── Left: item list ─────────────────────────────────── */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

                {/* Table header */}
                <div style={{
                    display: "flex", alignItems: "center",
                    gap: 10, marginBottom: 16
                }}>
                    <h2 style={{
                        margin: 0, fontSize: 16, fontWeight: 600,
                        color: "#111827"
                    }}>
                        {table.tableName}
                    </h2>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px",
                        borderRadius: 20, background: cfg.bg, color: cfg.text,
                    }}>
                        {cfg.label}
                    </span>
                    {table.openedAt && (
                        <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>
                            Mở lúc {fmtTime(table.openedAt)}
                        </span>
                    )}
                </div>

                {/* Customer info (nếu có) */}
                {table.customerName && (
                    <div style={{
                        marginBottom: 12, padding: "8px 12px",
                        background: "#F0FDF4", borderRadius: 8,
                        border: "1px solid #BBF7D0", fontSize: 13, color: "#166534",
                    }}>
                        👤 Khách: <strong>{table.customerName}</strong>
                    </div>
                )}

                {/* Items */}
                {table.items.length === 0 ? (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        height: 200, color: "#D1D5DB", gap: 8,
                    }}>
                        <span style={{ fontSize: 40 }}>🛒</span>
                        <p style={{ fontSize: 13, margin: 0, color: "#9CA3AF" }}>
                            Chưa có món nào
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {table.items.map((item) => (
                            <StaffCartItem
                                key={item.productId}
                                item={item}
                                onIncrease={() => handleQty(item.productId, +1)}
                                onDecrease={() => handleQty(item.productId, -1)}
                                onRemove={() => handleRemove(item.productId)}
                                onNoteChange={(note) => {
                                    useTableOrderStore.getState().setItemNote(
                                        activeTableId, item.productId, note
                                    );
                                }}
                                disabled={table.status === "waiting_payment" || table.status === "paid"}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right: summary + actions ───────────────────────── */}
            <div style={{
                width: 240, background: "#fff",
                borderLeft: "1px solid #F3F4F6",
                padding: 16, display: "flex",
                flexDirection: "column", gap: 12,
                overflowY: "auto",
            }}>
                <p style={{
                    margin: 0, fontSize: 11, fontWeight: 600,
                    color: "#9CA3AF", textTransform: "uppercase",
                    letterSpacing: "0.6px"
                }}>
                    Tổng đơn
                </p>

                {/* Mini item list */}
                <div style={{
                    flex: 1, overflowY: "auto",
                    display: "flex", flexDirection: "column", gap: 4
                }}>
                    {table.items.map((i) => (
                        <div key={i.productId}
                            style={{
                                display: "flex", justifyContent: "space-between",
                                fontSize: 12, color: "#6B7280"
                            }}>
                            <span style={{
                                flex: 1, overflow: "hidden",
                                textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                                {i.name} ×{i.qty}
                            </span>
                            <span style={{ marginLeft: 8, flexShrink: 0, fontWeight: 500 }}>
                                {fmtVND(i.price * i.qty)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div style={{
                    borderTop: "1px solid #F3F4F6", paddingTop: 12,
                    display: "flex", justifyContent: "space-between",
                    fontSize: 15, fontWeight: 700, color: "#111827",
                }}>
                    <span>Tổng</span>
                    <span style={{ color: "#2563EB" }}>{fmtVND(total)}</span>
                </div>

                {/* Note */}
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9CA3AF" }}>
                        Ghi chú bàn
                    </p>
                    <textarea
                        rows={3}
                        value={table.note || ""}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        placeholder="Thêm ghi chú..."
                        style={{
                            width: "100%", fontSize: 12,
                            border: "1px solid #E5E7EB", borderRadius: 8,
                            padding: "8px 10px", resize: "none",
                            background: "#F9FAFB", color: "#374151",
                            boxSizing: "border-box",
                            outline: "none",
                        }}
                    />
                </div>

                {/* Payment method — chỉ hiện khi chuẩn bị thanh toán */}
                {(table.status === "ordered" || table.status === "waiting_payment") && (
                    <div>
                        <p style={{ margin: "0 0 4px", fontSize: 11, color: "#9CA3AF" }}>
                            Phương thức TT
                        </p>
                        <select
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                            style={{
                                width: "100%", fontSize: 13, padding: "8px 10px",
                                border: "1px solid #E5E7EB", borderRadius: 8,
                                background: "#fff", color: "#374151", outline: "none",
                                boxSizing: "border-box",
                            }}
                        >
                            {PAYMENT_METHODS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                    {/* Gửi bếp — chỉ khi open và có món */}
                    {table.status === "open" && (
                        <ActionBtn
                            label="📋 Gửi bếp"
                            color="#2563EB"
                            disabled={table.items.length === 0 || loading}
                            onClick={handleSubmitToKitchen}
                        />
                    )}

                    {/* Yêu cầu thanh toán */}
                    {table.status === "ordered" && (
                        <ActionBtn
                            label="🔔 Yêu cầu TT"
                            color="#D97706"
                            disabled={loading}
                            onClick={handleRequestCheckout}
                        />
                    )}

                    {/* Xác nhận thanh toán */}
                    {(table.status === "ordered" || table.status === "waiting_payment") && (
                        <ActionBtn
                            label="💳 Xác nhận TT"
                            color="#059669"
                            disabled={loading}
                            onClick={handleConfirmPayment}
                        />
                    )}

                    {/* Đóng bàn */}
                    {table.status !== "empty" && (
                        <button
                            onClick={handleCloseTable}
                            style={{
                                width: "100%", padding: "9px 0",
                                border: "1px solid #FECACA",
                                borderRadius: 10, background: "transparent",
                                color: "#DC2626", fontSize: 13,
                                cursor: "pointer", fontWeight: 500,
                            }}
                        >
                            Đóng bàn
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StaffCartItem({ item, onIncrease, onDecrease, onRemove, onNoteChange, disabled }) {
    const [editNote, setEditNote] = useState(false);

    return (
        <div style={{
            background: "#fff", border: "1px solid #F3F4F6",
            borderRadius: 12, padding: "12px 14px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: 0, fontSize: 14, fontWeight: 500,
                        color: "#111827", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>
                        {item.name}
                    </p>
                    {item.note && !editNote && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>
                            📝 {item.note}
                        </p>
                    )}
                </div>

                {!disabled && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <QtyBtn onClick={onDecrease} label="−" />
                        <span style={{
                            fontSize: 14, fontWeight: 600,
                            minWidth: 22, textAlign: "center"
                        }}>
                            {item.qty}
                        </span>
                        <QtyBtn onClick={onIncrease} label="+" />
                    </div>
                )}
                {disabled && (
                    <span style={{ fontSize: 13, color: "#6B7280" }}>×{item.qty}</span>
                )}

                <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: "#2563EB", minWidth: 76, textAlign: "right"
                }}>
                    {fmtVND(item.price * item.qty)}
                </span>

                {!disabled && (
                    <button
                        onClick={onRemove}
                        style={{
                            background: "none", border: "none",
                            color: "#D1D5DB", cursor: "pointer",
                            fontSize: 16, padding: "0 2px", lineHeight: 1
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Note toggle */}
            {!disabled && (
                editNote ? (
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                        <input
                            autoFocus
                            value={item.note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="Ghi chú món..."
                            style={{
                                flex: 1, fontSize: 12, padding: "5px 8px",
                                border: "1px solid #E5E7EB", borderRadius: 6,
                                background: "#F9FAFB", outline: "none",
                            }}
                            onKeyDown={(e) => e.key === "Enter" && setEditNote(false)}
                        />
                        <button
                            onClick={() => setEditNote(false)}
                            style={{
                                fontSize: 12, padding: "4px 10px",
                                border: "1px solid #E5E7EB", borderRadius: 6,
                                background: "#fff", cursor: "pointer", color: "#374151"
                            }}
                        >
                            OK
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditNote(true)}
                        style={{
                            marginTop: 6, fontSize: 11, color: "#9CA3AF",
                            background: "none", border: "none", cursor: "pointer",
                            padding: 0
                        }}
                    >
                        + Ghi chú
                    </button>
                )
            )}
        </div>
    );
}

function QtyBtn({ onClick, label }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid #E5E7EB", background: "#fff",
                cursor: "pointer", fontSize: 16, lineHeight: 1,
                color: "#374151", display: "flex",
                alignItems: "center", justifyContent: "center",
            }}
        >
            {label}
        </button>
    );
}

function ActionBtn({ label, color, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                width: "100%", padding: "10px 0",
                background: disabled ? "#E5E7EB" : color,
                color: disabled ? "#9CA3AF" : "#fff",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
            }}
        >
            {label}
        </button>
    );
}