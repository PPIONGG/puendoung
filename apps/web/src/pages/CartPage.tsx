import { useCart } from "../store/cartStore";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Minus, Plus, Trash2, AlertTriangle } from "lucide-react";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const navigate = useNavigate();
  const hasLive = items.some((i) => i.isLiveSpecimen);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-muted-foreground mb-4">ตะกร้าของคุณว่างเปล่า</div>
        <Button onClick={() => navigate("/products")}>เลือกซื้อสินค้า</Button>
      </div>
    );
  }

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">ตะกร้าสินค้า</h1>
      {hasLive && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>คำสั่งซื้อนี้มีสินค้าสิ่งมีชีวิต กรุณาตรวจสอบเงื่อนไขการจัดส่งก่อนชำระเงิน</div>
        </div>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.productId}>
            <CardContent className="p-4 flex gap-4 items-center">
              <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">ไม่มีรูป</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productId}`} className="font-medium text-sm hover:text-primary truncate block">{item.name}</Link>
                <div className="text-primary font-bold text-sm">{formatPrice(item.unitPrice)}</div>
              </div>
              <div className="flex items-center border rounded-md">
                <button className="px-2 py-1" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></button>
                <span className="px-2 text-sm">{item.quantity}</span>
                <button className="px-2 py-1" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></button>
              </div>
              <div className="text-sm font-bold w-20 text-right">{formatPrice(item.unitPrice * item.quantity)}</div>
              <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-lg font-bold">ยอดรวม: {formatPrice(total)}</div>
        <Button onClick={() => navigate("/checkout")}>ดำเนินการสั่งซื้อ</Button>
      </div>
    </div>
  );
}
