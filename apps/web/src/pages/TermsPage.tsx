import { usePageTitle } from "../hooks/usePageTitle";

export default function TermsPage() {
  usePageTitle("เงื่อนไขการให้บริการ");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">เงื่อนไขการให้บริการ</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
        <p>กรุณาอ่านเงื่อนไขการให้บริการนี้อย่างละเอียดก่อนใช้งานเว็บไซต์เพื่อนด้วง</p>

        <h2 className="text-lg font-semibold text-foreground">1. การใช้บริการ</h2>
        <p>เว็บไซต์นี้ให้บริการซื้อ-ขายสินค้าเกี่ยวกับด้วงและอุปกรณ์เลี้ยงด้วง ผู้ใช้ต้องมีอายุไม่ต่ำกว่า 18 ปี หรือได้รับความยินยอมจากผู้ปกครอง</p>

        <h2 className="text-lg font-semibold text-foreground">2. การสั่งซื้อและชำระเงิน</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ราคาสินค้าแสดงเป็นบาทไทย (THB)</li>
          <li>คำสั่งซื้อมีอายุ 24 ชั่วโมง นับจากการสั่งซื้อ</li>
          <li>สินค้าสิ่งมีชีวิตไม่รับคืนยกเว้นกรณีส่งผิดหรือสินค้าเสียหายจากการขนส่ง</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. การจัดส่งสินค้าสิ่งมีชีวิต</h2>
        <p>สินค้าสิ่งมีชีวิตจัดส่งเฉพาะวันจันทร์-พุธ เพื่อป้องกันติดสุดสัปดาห์ ทางร้านไม่รับประกันชีวิตสินค้าหลังจากจัดส่งแล้วยกเว้นกรณีที่มีข้อตกลงเป็นลายลักษณ์อักษร</p>

        <h2 className="text-lg font-semibold text-foreground">4. ความรับผิดชอบ</h2>
        <p>ทางร้านไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้สินค้าผิดวิธี หรือการขนส่งที่เกิดจากเหตุสุดวิสัย</p>
      </div>
    </div>
  );
}
