import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";
import { AuthShell, Field, SubmitBtn, GoogleBtn } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login, formatApiError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const u = await login(email, password);
      toast.success("Welcome back");
      const dest = (u.role === "admin" || u.role === "sub_admin") ? "/admin" : (location.state?.from || "/account");
      navigate(dest);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell testid="login-page" title="Welcome back" subtitle="Sign in to continue your journey"
      footer={<>New here? <Link to="/register" className="text-gold">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-6">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
        <Field label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" error={error} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-cream/50 text-xs hover:text-gold" data-testid="forgot-link">Forgot password?</Link>
        </div>
        <SubmitBtn loading={loading} data-testid="login-submit">Sign In</SubmitBtn>
      </form>

      <div className="flex items-center gap-4 my-7"><div className="flex-1 h-px bg-white/10" /><span className="text-cream/30 text-xs">OR</span><div className="flex-1 h-px bg-white/10" /></div>

      <div className="space-y-3">
        <Link to="/otp-login" data-testid="otp-login-link" className="w-full border border-white/20 text-cream py-3.5 rounded-full font-light hover:border-gold transition-colors flex items-center justify-center gap-3">
          <Smartphone size={18} className="text-gold" /> Login with Mobile OTP
        </Link>
        <GoogleBtn onClick={() => toast.info("Google sign-in coming soon")} />
      </div>
    </AuthShell>
  );
}
