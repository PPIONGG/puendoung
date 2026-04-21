import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice, getOrderStatusLabel } from "../lib/utils";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useNavigate } from "react-router-dom";

export default function OrderTrackPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchOrder = async (lookup?: { phone?: string; email?: string }) => {
    setError("");
    try {
      const [orderRes, timelineRes] = await Promise.all([
        api.getOrder(orderNumber!, lookup),
        api.getOrderTimeline(orderNumber!, lookup),
      ]);
      setOrder(orderRes.data);
      setTimeline(timelineRes.data);
      setNeedsAuth(false);
    } catch (e: any) {
      if (e.status === 401) {
        setNeedsAuth(true);
      } else {
        setError(e.data?.error?.message || "ไม่พบคำสั่งซื้อ");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderNumber) return;
    fetchOrder();
  }, [orderNumber]);

  const submitLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const lookup: any = {};
    if (phone) lookup.phone = phone;
    if (email) lookup.email = email;
    await fetchOrder(lookup);
  };

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const payment = await api.createPayment(order.orderNumber);
      await api.mockPay(payment.data.paymentId);
      const updated = await api.getOrder(order.orderNumber);
      setOrder(updated.data);
    } catch (e) {
      alert("ชำระเงินไม่สำเร็จ");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">กำลังโหลด...</div>;

  if (needsAuth) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-2xl font-bold mb-4">ติดตามคำสั่งซื้อ</h1>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">กรุณากรอกข้อมูลยืนยันเพื่อดูรายละเอียดคำสั่งซื้อ</div>
            <form onSubmit={submitLookup} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">เบอร์โทร</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทรที่ใช้สั่งซื้อ" />
              </div>
              <div>
                <label className="block text-sm mb-1">อีเมล (ถ้ามี)</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="อีเมลที่ใช้สั่งซื้อ" />
              </div>
              <Button type="submit" className="w-full">ตรวจสอบ</Button>
            </form>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </CardContent>
        </Card>
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>กลับหน้าแรก</Button>
        </div>
      </div>
    );
  }

  if (!order) return <div className="container mx-auto px-4 py-8">{error || "ไม่พบคำสั่งซื้อ"}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">ติดตามคำสั่งซื้อ</h1>
      <Card className="mb-4">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">หมายเลขคำสั่งซื้อ</span>
            <span className="font-mono font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">สถานะ</span>
            <span className="font-medium">{getOrderStatusLabel(order.status)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ยอดรวม</span>
            <span className="font-bold">{formatPrice(order.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="font-semibold mb-2">รายการสินค้า</div>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {timeline.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="font-semibold mb-2">ไทม์ไลน์</div>
            <div className="space-y-2">
              {timeline.map((t: any) => (
                <div key={t.id} className="flex justify-between text-sm border-l-2 pl-3 border-primary">
                  <div>
                    <div className="font-medium">{getOrderStatusLabel(t.status)}</div>
                    {t.note && <div className="text-muted-foreground text-xs">{t.note}</div>}
                  </div>
                  <div className="text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleString("th-TH")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.shippingName && (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-1 text-sm">
            <div className="font-semibold mb-1">ข้อมูลจัดส่ง</div>
            <div>{order.shippingName}</div>
            <div>{order.shippingPhone}</div>
            <div>{order.shippingAddress} {order.shippingDistrict} {order.shippingProvince} {order.shippingPostalCode}</div>
            <div className="text-muted-foreground">วิธีจัดส่ง: {order.shippingMethod}</div>
          </CardContent>
        </Card>
      )}

      {order.status === "pending_payment" && (
        <Button onClick={handlePay} disabled={paying} className="w-full">
          {paying ? "กำลังชำระเงิน..." : "ชำระเงิน (Mock)"}
        </Button>
      )}

      <div className="mt-4 text-center">
        <Button variant="ghost" onClick={() => navigate("/")}>กลับหน้าแรก</Button>
      </div>
    </div>
  );
}
