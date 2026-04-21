import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, setUser, clearAuth } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then((res) => setUser(res.data.user))
      .catch(() => clearAuth())
      .finally(() => setLoading(false));
  }, [setUser, clearAuth]);

  const logout = () => {
    api.logout().catch(() => {});
    clearAuth();
    navigate("/");
  };

  if (loading) return <div className="container mx-auto px-4 py-8">กำลังโหลด...</div>;
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-muted-foreground mb-4">กรุณาเข้าสู่ระบบ</div>
        <Button onClick={() => navigate("/login")}>เข้าสู่ระบบ</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">บัญชีของฉัน</h1>
      <Card className="mb-4">
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">ชื่อ</span><span>{user.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">อีเมล</span><span>{user.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">เบอร์โทร</span><span>{user.phone || "-"}</span></div>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={logout}>ออกจากระบบ</Button>
    </div>
  );
}
