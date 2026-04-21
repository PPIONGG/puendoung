import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice, getOrderStatusLabel } from "../lib/utils";
import { Card, CardContent } from "../components/ui/Card";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAdminStats(),
      api.getAdminOrders({ limit: "5" }),
    ]).then(([statsRes, ordersRes]) => {
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-8">กำลังโหลด...</div>;

  const statCards = [
    { label: "คำสั่งซื้อทั้งหมด", value: stats?.totalOrders || 0 },
    { label: "รอชำระเงิน", value: stats?.pendingOrders || 0 },
    { label: "คำสั่งซื้อวันนี้", value: stats?.todayOrders || 0 },
    { label: "รายรับรวม", value: formatPrice(stats?.totalRevenue || 0) },
    { label: "สินค้าทั้งหมด", value: stats?.totalProducts || 0 },
    { label: "สต็อกใกล้หมด", value: stats?.lowStockProducts || 0, alert: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">แดชบอร์ด</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className={s.alert ? "border-destructive" : ""}>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className={`text-2xl font-bold mt-1 ${s.alert ? "text-destructive" : ""}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">คำสั่งซื้อล่าสุด</h2>
        <div className="overflow-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">เลขคำสั่งซื้อ</th>
                <th className="text-left p-3">ลูกค้า</th>
                <th className="text-right p-3">ยอดรวม</th>
                <th className="text-left p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-mono"><Link to={`/admin/orders`} className="hover:text-primary">{o.orderNumber}</Link></td>
                  <td className="p-3">{o.customerName}</td>
                  <td className="p-3 text-right">{formatPrice(o.totalAmount)}</td>
                  <td className="p-3">{getOrderStatusLabel(o.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
