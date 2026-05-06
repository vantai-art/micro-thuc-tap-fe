/**
 * Store RIÊNG cho chức năng đặt món tại bàn nhà hàng (dine-in).
 * KHÔNG liên quan đến useCartStore của user mua online.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useTableOrderStore = create(
    persist(
        (set, get) => ({
            // ─── State ──────────────────────────────────────────────────────────────
            /**
             * tableOrders: Record<tableId, TableOrder>
             * TableOrder = {
             *   tableId: string
             *   tableName: string
             *   status: "empty" | "open" | "ordered" | "waiting_payment" | "paid"
             *   items: TableCartItem[]
             *   note: string
             *   customerId: string | null
             *   customerName: string | null
             *   orderId: number | null        ← backend orderId sau khi submit
             *   openedAt: string | null
             * }
             * TableCartItem = {
             *   productId: number
             *   name: string
             *   price: number
             *   qty: number
             *   note: string
             * }
             */
            tableOrders: {},
            activeTableId: null,

            // ─── Table CRUD ──────────────────────────────────────────────────────────

            initTable: (tableId, tableName) =>
                set((s) => {
                    if (s.tableOrders[tableId]) return s; // đã tồn tại, giữ nguyên
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                tableId, tableName,
                                status: "empty",
                                items: [], note: "",
                                customerId: null, customerName: null,
                                orderId: null, openedAt: null,
                            },
                        },
                    };
                }),

            openTable: (tableId, customerInfo = {}) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                ...t,
                                status: "open",
                                customerId: customerInfo.customerId ?? t.customerId,
                                customerName: customerInfo.customerName ?? t.customerName,
                                openedAt: t.openedAt ?? new Date().toISOString(),
                            },
                        },
                        activeTableId: tableId,
                    };
                }),

            setActiveTable: (tableId) => set({ activeTableId: tableId }),

            updateTableMeta: (tableId, patch) =>
                set((s) => ({
                    tableOrders: {
                        ...s.tableOrders,
                        [tableId]: { ...s.tableOrders[tableId], ...patch },
                    },
                })),

            setTableStatus: (tableId, status) =>
                set((s) => ({
                    tableOrders: {
                        ...s.tableOrders,
                        [tableId]: { ...s.tableOrders[tableId], status },
                    },
                })),

            resetTable: (tableId) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                ...t,
                                status: "empty",
                                items: [], note: "",
                                customerId: null, customerName: null,
                                orderId: null, openedAt: null,
                            },
                        },
                        activeTableId: s.activeTableId === tableId ? null : s.activeTableId,
                    };
                }),

            // ─── Item CRUD ────────────────────────────────────────────────────────────

            addItem: (tableId, product) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    const items = [...t.items];
                    const idx = items.findIndex((i) => i.productId === product.productId);
                    if (idx >= 0) {
                        items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
                    } else {
                        items.push({
                            productId: product.productId,
                            name: product.name,
                            price: product.price,
                            qty: 1,
                            note: "",
                        });
                    }
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                ...t,
                                items,
                                status: t.status === "empty" ? "open" : t.status,
                                openedAt: t.openedAt ?? new Date().toISOString(),
                            },
                        },
                    };
                }),

            changeQty: (tableId, productId, delta) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    const items = t.items
                        .map((i) => i.productId === productId
                            ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
                        .filter((i) => i.qty > 0);
                    return {
                        tableOrders: { ...s.tableOrders, [tableId]: { ...t, items } },
                    };
                }),

            removeItem: (tableId, productId) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                ...t,
                                items: t.items.filter((i) => i.productId !== productId),
                            },
                        },
                    };
                }),

            setItemNote: (tableId, productId, note) =>
                set((s) => {
                    const t = s.tableOrders[tableId];
                    if (!t) return s;
                    return {
                        tableOrders: {
                            ...s.tableOrders,
                            [tableId]: {
                                ...t,
                                items: t.items.map((i) =>
                                    i.productId === productId ? { ...i, note } : i),
                            },
                        },
                    };
                }),

            // ─── Selectors ────────────────────────────────────────────────────────────

            getTable: (tableId) => get().tableOrders[tableId],

            getActiveTable: () => {
                const { activeTableId, tableOrders } = get();
                return activeTableId ? tableOrders[activeTableId] : null;
            },

            getTotal: (tableId) => {
                const t = get().tableOrders[tableId];
                return t ? t.items.reduce((s, i) => s + i.price * i.qty, 0) : 0;
            },

            getItemCount: (tableId) => {
                const t = get().tableOrders[tableId];
                return t ? t.items.reduce((s, i) => s + i.qty, 0) : 0;
            },

            // ─── Socket sync ─────────────────────────────────────────────────────────

            syncFromSocket: (tableId, data) =>
                set((s) => ({
                    tableOrders: { ...s.tableOrders, [tableId]: data },
                })),

            setOrderId: (tableId, orderId) =>
                set((s) => ({
                    tableOrders: {
                        ...s.tableOrders,
                        [tableId]: { ...s.tableOrders[tableId], orderId },
                    },
                })),
        }),
        {
            name: "dine-in-table-orders", // key localStorage khác hoàn toàn với cart của user
            partialize: (s) => ({
                tableOrders: s.tableOrders,
                activeTableId: s.activeTableId,
            }),
        }
    )
);

export default useTableOrderStore;