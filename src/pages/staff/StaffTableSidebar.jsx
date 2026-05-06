import React from "react";
import useTableOrderStore from "../../store/useTableOrderStore";
import { TABLE_STATUS } from "../../utils/tableFormat";

export default function StaffTableSidebar({ tables, onAddTable }) {
    const { tableOrders, activeTableId, setActiveTable, openTable, getItemCount } =
        useTableOrderStore();

    const handleClick = (table) => {
        const tableId = String(table.id);
        const order = tableOrders[tableId];
        if (!order || order.status === "empty") {
            openTable(tableId);
        } else {
            setActiveTable(tableId);
        }
    };

    return (
        <aside style={{
            width: 220, flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #F3F4F6",
            display: "flex", flexDirection: "column",
            height: "100%", overflow: "hidden",
        }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
                <p style={{
                    fontSize: 11, fontWeight: 600, color: "#9CA3AF",
                    textTransform: "uppercase", letterSpacing: "0.6px", margin: 0
                }}>
                    Danh sách bàn
                </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                {tables.map((table) => {
                    const order = tableOrders[String(table.id)];
                    const status = order?.status || "empty";
                    const cfg = TABLE_STATUS[status];
                    const count = getItemCount(String(table.id));
                    const isActive = String(table.id) === activeTableId;

                    return (
                        <button
                            key={table.id}
                            onClick={() => handleClick(table)}
                            style={{
                                width: "100%", display: "flex", alignItems: "center",
                                gap: 10, padding: "10px 12px",
                                borderRadius: 10, marginBottom: 4,
                                border: isActive ? `1.5px solid #BFDBFE` : "1.5px solid transparent",
                                background: isActive ? "#EFF6FF" : "transparent",
                                cursor: "pointer", textAlign: "left",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#F9FAFB"; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                        >
                            <span style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: cfg.color, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    margin: 0, fontSize: 14, fontWeight: 500,
                                    color: "#111827", overflow: "hidden",
                                    textOverflow: "ellipsis", whiteSpace: "nowrap"
                                }}>
                                    {`Bàn ${table.number}`}
                                </p>
                                <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                                    {cfg.label}
                                </p>
                            </div>
                            {count > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    background: "#DBEAFE", color: "#1D4ED8",
                                    padding: "2px 8px", borderRadius: 10,
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ padding: 8 }}>
                <button
                    onClick={onAddTable}
                    style={{
                        width: "100%", padding: "10px 0",
                        border: "1.5px dashed #D1D5DB", borderRadius: 10,
                        background: "transparent", color: "#9CA3AF",
                        fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6,
                    }}
                >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Thêm bàn
                </button>
            </div>
        </aside>
    );
}