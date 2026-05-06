import React, { useState } from "react";

export default function AddTableModal({ onConfirm, onClose }) {
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState(4);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                zIndex: 100, display: "flex", alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 20, padding: 28,
                    width: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                }}
            >
                <h3 style={{
                    margin: "0 0 20px", fontSize: 16,
                    fontWeight: 600, color: "#111827"
                }}>
                    Thêm bàn mới
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <label style={{
                        fontSize: 12, color: "#6B7280",
                        display: "block", marginBottom: 6
                    }}>
                        Tên bàn
                    </label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim(), capacity)}
                        placeholder="VD: Bàn 5, Bàn VIP 1, Bàn Ngoài Trời..."
                        style={{
                            width: "100%", padding: "10px 12px",
                            border: "1px solid #E5E7EB", borderRadius: 10,
                            fontSize: 14, outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label style={{
                        fontSize: 12, color: "#6B7280",
                        display: "block", marginBottom: 6
                    }}>
                        Số chỗ ngồi
                    </label>
                    <input
                        type="number" min={1} max={30}
                        value={capacity}
                        onChange={(e) => setCapacity(+e.target.value)}
                        style={{
                            width: "100%", padding: "10px 12px",
                            border: "1px solid #E5E7EB", borderRadius: 10,
                            fontSize: 14, outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: "11px 0",
                            border: "1px solid #E5E7EB", borderRadius: 10,
                            background: "#fff", color: "#374151",
                            fontSize: 14, cursor: "pointer", fontWeight: 500,
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => name.trim() && onConfirm(name.trim(), capacity)}
                        disabled={!name.trim()}
                        style={{
                            flex: 1, padding: "11px 0",
                            border: "none", borderRadius: 10,
                            background: name.trim() ? "#1D4ED8" : "#E5E7EB",
                            color: name.trim() ? "#fff" : "#9CA3AF",
                            fontSize: 14, cursor: name.trim() ? "pointer" : "not-allowed",
                            fontWeight: 600,
                        }}
                    >
                        Tạo bàn
                    </button>
                </div>
            </div>
        </div>
    );
}