// src/constants/payMethods.js
// Dùng chung ở PaymentModal, StaffPage (bills list), printReceipt
import { Banknote, CreditCard } from 'lucide-react'

export const PAY_METHODS = {
    CASH: { label: 'Tiền mặt', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Banknote },
    VNPAY: { label: 'VNPay', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: CreditCard },
}