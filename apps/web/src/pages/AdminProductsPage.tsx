import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    load();
  }, [page, q]);

  const load = () => {
    setLoading(true);
    api.getAdminProducts({ page: String(page), limit: "24", q }).then((res) => {
      setProducts(res.data);
      setMeta(res.meta);
      setLoading(false);
    });
  };

  const startEdit = (product: any) => {
    setEditing(product.id);
    setForm({ ...product, images: product.images?.map((i: any) => i.url).join(", ") || "" });
  };

  const save = async () => {
    const payload = {
      ...form,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      images: form.images ? form.images.split(",").map((url: string) => ({ url: url.trim() })) : [],
    };
    if (editing === "new") {
      await api.createProduct(payload);
    } else {
      await api.updateProduct(editing, payload);
    }
    setEditing(null);
    load();
  };

  const archive = async (id: string) => {
    if (!confirm("ยืนยันการลบสินค้า?")) return;
    await api.archiveProduct(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">จัดการสินค้า</h1>
        <Button onClick={() => { setEditing("new"); setForm({ slug: "", name: "", price: 0, stockQuantity: 0, status: "draft", isLiveSpecimen: false, images: "" }); }}>
          <Plus className="h-4 w-4 mr-1" /> เพิ่มสินค้า
        </Button>
      </div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="ค้นหา..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Button variant="outline" onClick={() => setPage(1)}>ค้นหา</Button>
      </div>

      {editing && (
        <Card className="mb-4">
          <CardContent className="p-4 grid md:grid-cols-2 gap-3">
            <Input placeholder="Slug" value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Input placeholder="ชื่อสินค้า" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="ราคา (สตางค์)" type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="จำนวนสต็อก" type="number" value={form.stockQuantity || 0} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
            <select value={form.status || "draft"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="draft">ร่าง</option>
              <option value="active">เปิดขาย</option>
              <option value="archived">เก็บถาวร</option>
            </select>
            <select value={form.availabilityStatus || "out_of_stock"} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="ready">พร้อมส่ง</option>
              <option value="preorder">พรีออเดอร์</option>
              <option value="breeding">กำลังเพาะ</option>
              <option value="molting">กำลังลอกคราบ</option>
              <option value="out_of_stock">หมดชั่วคราว</option>
              <option value="unavailable">ไม่เปิดขาย</option>
            </select>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={!!form.isLiveSpecimen} onChange={(e) => setForm({ ...form, isLiveSpecimen: e.target.checked })} />
              <span className="text-sm">สินค้ามีชีวิต</span>
            </div>
            <Input placeholder="URL รูปภาพ (คั่นด้วยลูกน้ำ)" value={form.images || ""} onChange={(e) => setForm({ ...form, images: e.target.value })} />
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={save}>บันทึก</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>ยกเลิก</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">กำลังโหลด...</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">ชื่อ</th>
                <th className="text-right p-3">ราคา</th>
                <th className="text-right p-3">สต็อก</th>
                <th className="text-left p-3">สถานะ</th>
                <th className="text-left p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3 text-right">{formatPrice(p.price)}</td>
                  <td className="p-3 text-right">{p.stockQuantity}</td>
                  <td className="p-3">
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => archive(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
    </div>
  );
}
