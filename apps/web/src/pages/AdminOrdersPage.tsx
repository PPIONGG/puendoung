import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatPrice, getOrderStatusLabel } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Eye } from "lucide-react";

const statuses = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    load();
  }, [page]);

  const load = () => {
    setLoading(true);
    api.getAdminOrders({ page: String(page), limit: "24" }).then((res) => {
      setOrders(res.data);
      setMeta(res.meta);
      setLoading(false);
    });
  };

  const viewDetail = async (id: string) => {
    const res = await api.getAdminOrder(id);
    setDetail(res.data);
  };

  const updateStatus = async (id: string, status: string) => {
    await api.updateOrderStatus(id, status);
    load();
    if (detail?.id === id) viewDetail(id);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">จัดการคำสั่งซื้อ</h1>
      {loading ? (
        <div className="text-center py-8">กำลังโหลด...</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">เลขคำสั่งซื้อ</th>
                <th className="text-left p-3">ลูกค้า</th>
                <th className="text-right p-3">ยอดรวม</th>
                <th className="text-left p-3">สถานะ</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-mono">{o.orderNumber}</td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3 text-right">{formatPrice(o.totalAmount)}</td>
                  <td className="p-3">
                    <Badge variant={o.status === "cancelled" ? "destructive" : "default"}>{getOrderStatusLabel(o.status)}</Badge>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" onClick={() => viewDetail(o.id)}><Eye className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
            <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>ถัดไป</Button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">รายละเอียดคำสั่งซื้อ</h2>
              <Button variant="ghost" onClick={() => setDetail(null)}>ปิด</Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">เลขคำสั่งซื้อ</span><span className="font-mono font-bold">{detail.orderNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ลูกค้า</span><span>{detail.customerName} / {detail.customerPhone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดรวม</span><span className="font-bold">{formatPrice(detail.totalAmount)}</span></div>
              <div>
                <div className="text-muted-foreground mb-1">เปลี่ยนสถานะ</div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <Button key={s} size="sm" variant={detail.status === s ? "default" : "outline"} onClick={() => updateStatus(detail.id, s)}>
                      {getOrderStatusLabel(s)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="font-semibold mt-2">รายการสินค้า</div>
              {detail.items.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
