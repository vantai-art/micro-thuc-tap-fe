import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { tableOrderApi } from "../../services/tableOrderApi";

export default function TableQRModal({ table, onClose }) {
    const [qrImg, setQrImg] = useState(null);
    const [qrUrl, setQrUrl] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!table) return;
        (async () => {
            let url;
            try {
                const res = await tableOrderApi.getTableQR(table.tableId);
                url = res.data.qrUrl;
            } catch {
                url = `${window.location.origin}/order?tableId=${table.tableId}`;
            }
            setQrUrl(url);
            const img = await QRCode.toDataURL(url, { width: 220, margin: 2 });
            setQrImg(img);
        })();
    }, [table?.tableId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(qrUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownload = () => {
        const a = document.createElement("a");
        a.href = qrImg;
        a.download = `qr-${table.tableId}.png`;
        a.click();
    };

    if (!table) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                zIndex: 100, display: "flex", alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: 20, padding: 28,
                    width: 300, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                }}
            >
                <h3 style={{
                    margin: "0 0 4px", fontSize: 16, fontWeight: 600,
                    color: "#111827"
                }}>
                    QR — {table.tableName}
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: 12, color: "#9CA3AF" }}>
                    Khách quét để đặt món trực tiếp
                </p>

                {qrImg ? (
                    <img src={qrImg} alt="QR Code"
                        style={{
                            width: 200, height: 200, borderRadius: 12,
                            border: "1px solid #F3F4F6", display: "block", margin: "0 auto"
                        }} />
                ) : (
                    <div style={{
                        width: 200, height: 200, background: "#F9FAFB",
                        borderRadius: 12, display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#9CA3AF", fontSize: 13,
                        margin: "0 auto",
                    }}>
                        Đang tạo QR...
                    </div>
                )}

                <div style={{
                    marginTop: 16, background: "#EFF6FF", borderRadius: 8,
                    padding: "8px 12px",
                }}>
                    <p style={{
                        margin: 0, fontSize: 10, fontFamily: "monospace",
                        color: "#1D4ED8", wordBreak: "break-all"
                    }}>
                        {qrUrl}
                    </p>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <button onClick={handleCopy} style={btnStyle("#F3F4F6", "#374151")}>
                        {copied ? "✅ Đã sao chép" : "📋 Sao chép"}
                    </button>
                    <button onClick={handleDownload} style={btnStyle("#F3F4F6", "#374151")}>
                        ⬇ Tải PNG
                    </button>
                    <button onClick={onClose} style={btnStyle("#1F2937", "#fff")}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

const btnStyle = (bg, color) => ({
    flex: 1, padding: "9px 0", borderRadius: 10,
    border: "none", background: bg, color,
    fontSize: 12, fontWeight: 500, cursor: "pointer",
});