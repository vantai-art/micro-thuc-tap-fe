export const fmtVND = (n) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency", currency: "VND", maximumFractionDigits: 0,
    }).format(n ?? 0);

export const fmtTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("vi-VN", {
        hour: "2-digit", minute: "2-digit",
    });
};

export const TABLE_STATUS = {
    empty: { label: "Trống", color: "#9CA3AF", bg: "#F3F4F6", text: "#4B5563" },
    open: { label: "Đang phục vụ", color: "#10B981", bg: "#D1FAE5", text: "#065F46" },
    ordered: { label: "Đã gọi món", color: "#3B82F6", bg: "#DBEAFE", text: "#1E40AF" },
    waiting_payment: { label: "Chờ thanh toán", color: "#F59E0B", bg: "#FEF3C7", text: "#92400E" },
    paid: { label: "Đã thanh toán", color: "#6B7280", bg: "#F9FAFB", text: "#374151" },
};