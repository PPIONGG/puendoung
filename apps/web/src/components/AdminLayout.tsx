import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Package, ClipboardList, LogOut } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminMe()
      .then((res) => setUser(res.data.user))
      .catch(() => navigate("/admin/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = async () => {
    await api.adminLogout();
    navigate("/admin/login");
  };

  if (loading) return <div className="p-8">กำลังโหลด...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/30 p-4 space-y-2">
        <div className="font-bold text-lg mb-4">เพื่อนด้วง Admin</div>
        <Link to="/admin/products" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent text-sm">
          <Package className="h-4 w-4" /> สินค้า
        </Link>
        <Link to="/admin/orders" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent text-sm">
          <ClipboardList className="h-4 w-4" /> คำสั่งซื้อ
        </Link>
        <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-accent text-sm w-full text-left">
          <LogOut className="h-4 w-4" /> ออกจากระบบ
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
