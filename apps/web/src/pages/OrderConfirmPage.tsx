import { useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");

  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-lg">
      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">สร้างคำสั่งซื้อสำเร็จ</h1>
      <p className="text-muted-foreground mb-2">หมายเลขคำสั่งซื้อ: <span className="font-mono font-bold text-foreground">{orderNumber}</span></p>
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">กรุณาจำเบอร์โทรหรืออีเมลที่ใช้สั่งซื้อไว้ เพื่อใช้ติดตามคำสั่งซื้อ</p>
      <div className="flex justify-center gap-3">
        <Link to={`/orders/${orderNumber}`}><Button>ติดตามคำสั่งซื้อ</Button></Link>
        <Link to="/"><Button variant="outline">กลับหน้าแรก</Button></Link>
      </div>
    </div>
  );
}
