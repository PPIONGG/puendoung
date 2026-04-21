import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number) {
  return `฿${(amount / 100).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getAvailabilityLabel(status: string) {
  const map: Record<string, string> = {
    ready: "พร้อมส่ง",
    preorder: "พรีออเดอร์",
    breeding: "กำลังเพาะ",
    molting: "กำลังลอกคราบ",
    out_of_stock: "หมดชั่วคราว",
    unavailable: "ไม่เปิดขาย",
  };
  return map[status] || status;
}

export function getOrderStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending_payment: "รอชำระเงิน",
    paid: "ชำระเงินแล้ว",
    preparing: "ร้านกำลังเตรียม",
    shipped: "จัดส่งแล้ว",
    delivered: "ส่งสำเร็จ",
    cancelled: "ยกเลิก",
    refunded: "คืนเงินแล้ว",
  };
  return map[status] || status;
}
