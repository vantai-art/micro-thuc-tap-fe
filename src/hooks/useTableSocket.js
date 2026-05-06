import { useEffect, useRef, useCallback } from "react";
import useTableOrderStore from "../store/useTableOrderStore";

// STOMP over SockJS — khớp với Spring WebSocket BE
// Cài: npm install @stomp/stompjs sockjs-client
let _client = null;

function getStompClient() {
    if (_client) return _client;

    // Lazy import để tránh lỗi SSR
    const SockJS = require("sockjs-client");
    const { Client } = require("@stomp/stompjs");

    const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:8813";

    _client = new Client({
        webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
        reconnectDelay: 3000,
        onStompError: (frame) => {
            console.warn("STOMP error:", frame);
        },
    });

    return _client;
}

/**
 * Hook real-time cho bàn dùng STOMP/SockJS.
 * Khớp với Spring WebSocketConfig BE.
 * tableIds: (string | number)[] — danh sách id bàn cần lắng nghe
 */
export function useTableSocket(tableIds = []) {
    const clientRef = useRef(null);
    const subsRef = useRef([]);
    const store = useTableOrderStore.getState;

    useEffect(() => {
        if (tableIds.length === 0) return;

        const client = getStompClient();
        clientRef.current = client;

        const subscribe = () => {
            // Hủy sub cũ
            subsRef.current.forEach(s => { try { s.unsubscribe(); } catch (_) { } });
            subsRef.current = [];

            tableIds.forEach((id) => {
                const sub = client.subscribe(`/topic/table/${id}`, (msg) => {
                    try {
                        const payload = JSON.parse(msg.body);
                        const { type, tableId, data } = payload;

                        switch (type) {
                            case "table:updated":
                                if (data) store().syncFromSocket(String(tableId), data);
                                break;
                            case "table:item_added":
                                if (data) store().addItem(String(tableId), data);
                                break;
                            case "table:request_checkout":
                                store().setTableStatus(String(tableId), "waiting_payment");
                                break;
                            case "table:paid":
                                store().resetTable(String(tableId));
                                break;
                            default:
                                break;
                        }
                    } catch (e) {
                        console.warn("STOMP parse error:", e);
                    }
                });
                subsRef.current.push(sub);
            });
        };

        if (client.connected) {
            subscribe();
        } else {
            client.onConnect = subscribe;
            if (!client.active) client.activate();
        }

        return () => {
            subsRef.current.forEach(s => { try { s.unsubscribe(); } catch (_) { } });
            subsRef.current = [];
        };
    }, [tableIds.join(",")]);

    // Emit update — gửi lên BE qua HTTP thay vì socket
    // vì BE broadcast qua REST endpoint rồi push xuống clients
    const emitUpdate = useCallback((tableId) => {
        // BE tự broadcast khi nhận REST request
        // Hook này chỉ cần lắng nghe, không cần emit ngược lên
    }, []);

    const emitItemAdded = useCallback((tableId, item) => {
        // Tương tự — BE broadcast sau khi POST /order/table
    }, []);

    const emitRequestCheckout = useCallback((tableId) => {
        // Gọi qua tableOrderApi.requestCheckout(orderId) thay vì socket
    }, []);

    return { emitUpdate, emitItemAdded, emitRequestCheckout };
}