import { Link, Outlet } from "react-router-dom";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useCart } from "../store/cartStore";
import { useAuth } from "../store/authStore";
import { useState } from "react";

export default function Layout() {
  const cartCount = useCart((s) => s.totalItems());
  const user = useAuth((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">เพื่อนด้วง</Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-sm font-medium hover:text-primary">สินค้าทั้งหมด</Link>
            <Link to="/products?category=live-specimens" className="text-sm font-medium hover:text-primary">ด้วงมีชีวิต</Link>
            <Link to="/products?category=housing" className="text-sm font-medium hover:text-primary">บ้านและกล่อง</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/account" className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">{user.name}</span>
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-medium hover:text-primary">เข้าสู่ระบบ</Link>
            )}
            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-2">
            <Link to="/products" className="block text-sm" onClick={() => setMenuOpen(false)}>สินค้าทั้งหมด</Link>
            <Link to="/products?category=live-specimens" className="block text-sm" onClick={() => setMenuOpen(false)}>ด้วงมีชีวิต</Link>
            <Link to="/products?category=housing" className="block text-sm" onClick={() => setMenuOpen(false)}>บ้านและกล่อง</Link>
            {user ? (
              <Link to="/account" className="block text-sm" onClick={() => setMenuOpen(false)}>บัญชีของฉัน</Link>
            ) : (
              <Link to="/login" className="block text-sm" onClick={() => setMenuOpen(false)}>เข้าสู่ระบบ</Link>
            )}
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-sm text-muted-foreground">
          <p>© 2024 เพื่อนด้วง - ร้านด้วงและอุปกรณ์เลี้ยงครบวงจร</p>
        </div>
      </footer>
    </div>
  );
}
