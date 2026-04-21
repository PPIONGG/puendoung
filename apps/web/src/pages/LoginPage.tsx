import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem("accessToken", res.data.accessToken);
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate("/account");
    } catch (e: any) {
      setError(e.data?.error?.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm p-6 bg-background rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-center mb-6">เข้าสู่ระบบ</h1>
        {error && <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          ยังไม่มีบัญชี? <Link to="/register" className="text-primary hover:underline">สมัครสมาชิก</Link>
        </div>
      </div>
    </div>
  );
}
