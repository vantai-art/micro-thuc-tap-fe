import axios from "axios";

// CRA dùng process.env, KHÔNG dùng import.meta.env
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8813";

const tableApi = axios.create({ baseURL: BASE });

tableApi.interceptors.request.use((cfg) => {
    const token = localStorage.getItem("token") || localStorage.getItem("staffToken");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

export const tableOrderApi = {
    // ── Tables ─────────────────────────────────────────────────────
    getAllTables: () =>
        tableApi.get("/tables"),

    createTable: (tableName, capacity) =>
        tableApi.post("/tables", { tableName, capacity }),

    getTableQR: (tableId) =>
        tableApi.get(`/tables/${tableId}/qr`),

    resolveQRToken: (token) =>
        tableApi.get(`/tables/qr/${token}`),

    // ── Orders ──────────────────────────────────────────────────────
    /** Gửi món lên bếp — khớp với POST /order/table của BE */
    submitOrder: (tableId, items, note, customerInfo) =>
        tableApi.post("/order/table", {
            tableId: Number(tableId),   // BE nhận Long, không nhận string
            customerName: customerInfo?.customerName || null,
            customerId: customerInfo?.customerId || null,
            note: note || "",
            items: items.map(i => ({
                productId: i.productId,
                productName: i.name,
                price: i.price,
                quantity: i.qty,   // BE dùng "quantity", store dùng "qty"
            })),
        }),

    /** Lấy order đang mở của bàn */
    getActiveOrder: (tableId) =>
        tableApi.get(`/order/table/${tableId}`),

    /** Khách / staff yêu cầu thanh toán */
    requestCheckout: (orderId) =>
        tableApi.post(`/order/${orderId}/request-checkout`),

    /** Xác nhận thanh toán — dùng endpoint checkout có sẵn */
    confirmPayment: (orderId, method) =>
        tableApi.post(`/order/${orderId}/checkout`, { paymentMethod: method }),

    // ── Menu ────────────────────────────────────────────────────────
    getMenu: () =>
        tableApi.get("/products"),
};