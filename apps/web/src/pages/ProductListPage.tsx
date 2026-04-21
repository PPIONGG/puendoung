import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice, getAvailabilityLabel } from "../lib/utils";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const category = searchParams.get("category") || "";
  const isLive = searchParams.get("isLive") || "";
  const q = searchParams.get("q") || "";
  const page = Number(searchParams.get("page") || "1");

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: "24" };
    if (category) params.category = category;
    if (isLive) params.isLive = isLive;
    if (q) params.q = q;
    api.getProducts(params).then((res) => {
      setProducts(res.data);
      setMeta(res.meta);
      setLoading(false);
    });
  }, [category, isLive, q, page]);

  const toggleParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.set("page", "1");
    setSearchParams(next);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">สินค้าทั้งหมด</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 space-y-4">
          <div>
            <div className="font-semibold mb-2">หมวดหมู่</div>
            <div className="space-y-1">
              <button onClick={() => { const n = new URLSearchParams(searchParams); n.delete("category"); setSearchParams(n); }} className={`block w-full text-left px-2 py-1 rounded text-sm ${!category ? "bg-accent" : ""}`}>
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => toggleParam("category", c.slug)} className={`block w-full text-left px-2 py-1 rounded text-sm ${category === c.slug ? "bg-accent" : ""}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">ประเภท</div>
            <button onClick={() => toggleParam("isLive", "true")} className={`block w-full text-left px-2 py-1 rounded text-sm ${isLive === "true" ? "bg-accent" : ""}`}>
              สินค้ามีชีวิต
            </button>
          </div>
        </aside>
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">ไม่พบสินค้า</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Link key={product.id} to={`/products/${product.slug}`}>
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                      <div className="aspect-[4/3] bg-muted relative">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">ไม่มีรูป</div>
                        )}
                        {product.isLiveSpecimen && (
                          <Badge className="absolute top-2 left-2 bg-green-600 text-white">สิ่งมีชีวิต</Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="font-medium text-sm line-clamp-2">{product.name}</div>
                        <div className="mt-1 text-primary font-bold">{formatPrice(product.price)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{getAvailabilityLabel(product.availabilityStatus)}</div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" disabled={page <= 1} onClick={() => { const n = new URLSearchParams(searchParams); n.set("page", String(page - 1)); setSearchParams(n); }}>
                  ก่อนหน้า
                </Button>
                <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => { const n = new URLSearchParams(searchParams); n.set("page", String(page + 1)); setSearchParams(n); }}>
                  ถัดไป
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
