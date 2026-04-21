import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice, getAvailabilityLabel } from "../lib/utils";
import { useCart } from "../store/cartStore";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import { Minus, Plus, ShoppingCart } from "lucide-react";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    if (!slug) return;
    api.getProduct(slug).then((res) => {
      setProduct(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: qty,
      imageUrl: product.images?.[0]?.url,
      isLiveSpecimen: product.isLiveSpecimen,
    });
    navigate("/cart");
  };

  if (loading) return <div className="container mx-auto px-4 py-8">กำลังโหลด...</div>;
  if (!product) return <div className="container mx-auto px-4 py-8">ไม่พบสินค้า</div>;

  const isActive = product.status === "active" && product.availabilityStatus === "ready";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="aspect-square rounded-xl border bg-muted overflow-hidden">
            {product.images?.[0]?.url ? (
              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">ไม่มีรูป</div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            {product.isLiveSpecimen && <Badge className="bg-green-600 text-white">สินค้ามีชีวิต</Badge>}
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="text-2xl font-bold text-primary">{formatPrice(product.price)}</div>
            <div className="text-sm text-muted-foreground">สถานะ: {getAvailabilityLabel(product.availabilityStatus)}</div>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground">
            {product.description || "ไม่มีรายละเอียด"}
          </div>

          {product.isLiveSpecimen && (
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="font-semibold">ข้อมูลการเลี้ยง</div>
                {product.speciesName && <div>ชนิด: {product.speciesName}</div>}
                {product.sex && <div>เพศ: {product.sex}</div>}
                {product.lifeStage && <div>ช่วงวัย: {product.lifeStage}</div>}
                {product.careLevel && <div>ระดับความยาก: {product.careLevel}</div>}
                {product.temperatureRange && <div>อุณหภูมิ: {product.temperatureRange}</div>}
                {product.humidityRange && <div>ความชื้น: {product.humidityRange}</div>}
                {product.substrateNotes && <div>ดิน/วัสดุ: {product.substrateNotes}</div>}
                {product.feedingNotes && <div>อาหาร: {product.feedingNotes}</div>}
                {product.shippingNotes && <div className="text-amber-700">หมายเหตุจัดส่ง: {product.shippingNotes}</div>}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md">
              <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></button>
              <span className="px-3 text-sm font-medium">{qty}</span>
              <button className="px-3 py-2" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></button>
            </div>
            <Button disabled={!isActive} onClick={handleAddToCart} className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-2" /> เพิ่มลงตะกร้า
            </Button>
          </div>
          {!isActive && <div className="text-sm text-destructive">สินค้านี้ไม่พร้อมขายในขณะนี้</div>}
        </div>
      </div>
    </div>
  );
}
