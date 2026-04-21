import { usePageTitle } from "../hooks/usePageTitle";

export default function PrivacyPolicyPage() {
  usePageTitle("นโยบายความเป็นส่วนตัว");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">นโยบายความเป็นส่วนตัว</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
        <p>
          เพื่อนด้วงให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของลูกค้า ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของประเทศไทย
        </p>

        <h2 className="text-lg font-semibold text-foreground">1. ข้อมูลที่เราเก็บรวบรวม</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>ชื่อ-นามสกุล</li>
          <li>เบอร์โทรศัพท์</li>
          <li>ที่อยู่จัดส่ง</li>
          <li>อีเมล (ถ้ามี)</li>
          <li>ประวัติการสั่งซื้อ</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">2. วัตถุประสงค์ในการเก็บข้อมูล</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>จัดส่งสินค้าให้ถูกต้อง</li>
          <li>ติดต่อประสานงานเกี่ยวกับคำสั่งซื้อ</li>
          <li>ดูแลลูกค้าหลังการขาย</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. ระยะเวลาเก็บข้อมูล</h2>
        <p>เราเก็บข้อมูลตามความจำเป็นทางบัญชีและธุรกิจ โดยทั่วไปไม่เกิน 7 ปี นับจากวันสุดท้ายของการทำธุรกรรม</p>

        <h2 className="text-lg font-semibold text-foreground">4. สิทธิของเจ้าของข้อมูล</h2>
        <p>ท่านมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนตัวของท่านได้ โดยติดต่อเราผ่านช่องทางที่ระบุในเว็บไซต์</p>
      </div>
    </div>
  );
}
