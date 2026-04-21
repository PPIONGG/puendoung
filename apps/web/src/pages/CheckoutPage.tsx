import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/cartStore";
import { api } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { AlertTriangle, Tag } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  customerName: z.string().min(1, "กรุณากรอกชื่อ"),
  customerPhone: z.string().min(9, "กรุณากรอกเบอร์โทร"),
  customerEmail: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  shippingName: z.string().min(1, "กรุณากรอกชื่อผู้รับ"),
  shippingPhone: z.string().min(9, "กรุณากรอกเบอร์โทรผู้รับ"),
  shippingAddress: z.string().min(1, "กรุณากรอกที่อยู่"),
  shippingProvince: z.string().min(1, "กรุณากรอกจังหวัด"),
  shippingDistrict: z.string().min(1, "กรุณากรอกอำเภอ/เขต"),
  shippingPostalCode: z.string().min(1, "กรุณากรอกรหัสไปรษณีย์"),
  shippingMethod: z.string().min(1, "กรุณาเลือกวิธีจัดส่ง"),
  shippingNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discount = couponData?.discount || 0;
  const total = subtotal - discount;
  const hasLive = items.some((i) => i.isLiveSpecimen);

  const onSubmit = async (data: FormData) => {
    setError("");
    setSubmitting(true);
    try {
      const validated = await api.validateCart(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      if (validated.data.hasLiveSpecimen && data.shippingMethod !== "express") {
        // อนุญาตทุกวิธีใน MVP แต่แสดง warning
      }
      const order = await api.createOrder({
        ...data,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: couponData?.code || undefined,
      });
      clearCart();
      navigate(`/order-confirmation?orderNumber=${order.data.orderNumber}`);
    } catch (e: any) {
      setError(e.data?.error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-muted-foreground mb-4">ไม่มีสินค้าในตะกร้า</div>
        <Button onClick={() => navigate("/products")}>เลือกซื้อสินค้า</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">ชำระเงิน</h1>
      {hasLive && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>คำสั่งซื้อนี้มีสินค้าสิ่งมีชีวิต กรุณาตรวจสอบเงื่อนไขการจัดส่ง</div>
        </div>
      )}
      {error && <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold">ข้อมูลลูกค้า</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
                <Input {...register("customerName")} />
                {errors.customerName && <div className="text-xs text-destructive mt-1">{errors.customerName.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">เบอร์โทร</label>
                <Input {...register("customerPhone")} />
                {errors.customerPhone && <div className="text-xs text-destructive mt-1">{errors.customerPhone.message}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">อีเมล (ไม่บังคับ)</label>
                <Input {...register("customerEmail")} />
                {errors.customerEmail && <div className="text-xs text-destructive mt-1">{errors.customerEmail.message}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold">ที่อยู่จัดส่ง</div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">ชื่อผู้รับ</label>
                <Input {...register("shippingName")} />
                {errors.shippingName && <div className="text-xs text-destructive mt-1">{errors.shippingName.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">เบอร์โทรผู้รับ</label>
                <Input {...register("shippingPhone")} />
                {errors.shippingPhone && <div className="text-xs text-destructive mt-1">{errors.shippingPhone.message}</div>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">ที่อยู่</label>
                <Input {...register("shippingAddress")} />
                {errors.shippingAddress && <div className="text-xs text-destructive mt-1">{errors.shippingAddress.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">จังหวัด</label>
                <Input {...register("shippingProvince")} />
                {errors.shippingProvince && <div className="text-xs text-destructive mt-1">{errors.shippingProvince.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">อำเภอ/เขต</label>
                <Input {...register("shippingDistrict")} />
                {errors.shippingDistrict && <div className="text-xs text-destructive mt-1">{errors.shippingDistrict.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">รหัสไปรษณีย์</label>
                <Input {...register("shippingPostalCode")} />
                {errors.shippingPostalCode && <div className="text-xs text-destructive mt-1">{errors.shippingPostalCode.message}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">วิธีจัดส่ง</label>
                <select {...register("shippingMethod")} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">เลือกวิธีจัดส่ง</option>
                  <option value="express">ขนส่งเอกชน (Kerry/Flash/J&T)</option>
                  <option value="thailand-post">ไปรษณีย์ไทย</option>
                </select>
                {errors.shippingMethod && <div className="text-xs text-destructive mt-1">{errors.shippingMethod.message}</div>}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">หมายเหตุถึงร้าน</label>
              <Input {...register("shippingNotes")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">สรุปคำสั่งซื้อ</div>
            <div className="space-y-1 text-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>ส่วนลด ({couponData.name})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base">
                <span>ยอดสุดท้าย</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Input placeholder="รหัสคูปอง" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
              <Button type="button" variant="outline" onClick={async () => {
                setCouponError("");
                if (!couponCode) { setCouponData(null); return; }
                try {
                  const res = await api.validateCoupon(couponCode, subtotal);
                  setCouponData(res.data);
                } catch (e: any) {
                  setCouponError(e.data?.error?.message || "คูปองไม่ถูกต้อง");
                  setCouponData(null);
                }
              }}><Tag className="h-4 w-4 mr-1" />ใช้คูปอง</Button>
            </div>
            {couponError && <div className="text-xs text-destructive">{couponError}</div>}
            {couponData && <div className="text-xs text-green-700">ใช้คูปอง {couponData.name} สำเร็จ</div>}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "กำลังดำเนินการ..." : "ยืนยันคำสั่งซื้อ"}
        </Button>
      </form>
    </div>
  );
}
