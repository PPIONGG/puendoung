import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice } from "../lib/utils";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProducts({ limit: "8" }).then((res) => {
      setProducts(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-10 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 text-white p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">ยินดีต้อนรับสู่เพื่อนด้วง</h1>
        <p className="text-lg opacity-90">ร้านด้วงและอุปกรณ์เลี้ยงครบวงจรสำหรับคนรักด้วงตัวจริง</p>
      </section>

      <h2 className="text-xl font-bold mb-4">สินค้าแนะนำ</h2>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
