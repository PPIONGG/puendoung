import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../store/authStore";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.register({ email, password, name, phone });
      localStorage.setItem("accessToken", res.data.accessToken);
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate("/account");
    } catch (e: any) {
      setError(e.data?.error?.message || "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm p-6 bg-background rounded-xl border shadow-sm">
        <h1 className="text-xl font-bold text-center mb-6">สมัครสมาชิก</h1>
        {error && <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">อีเมล</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">เบอร์โทร</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">รหัสผ่าน</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          มีบัญชีแล้ว? <Link to="/login" className="text-primary hover:underline">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
