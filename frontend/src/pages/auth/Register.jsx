import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell, Field, SubmitBtn, GoogleBtn } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register, formatApiError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created. Welcome to Virgin Harvest.");
      navigate("/account");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell testid="register-page" title="Join the harvest" subtitle="Create your account in seconds"
      footer={<>Already have an account? <Link to="/login" className="text-gold">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-6">
        <Field label="Full Name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="register-name" />
        <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="register-email" />
        <Field label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="register-password" error={error} />
        <SubmitBtn loading={loading} data-testid="register-submit">Create Account</SubmitBtn>
      </form>
      <div className="flex items-center gap-4 my-7"><div className="flex-1 h-px bg-white/10" /><span className="text-cream/30 text-xs">OR</span><div className="flex-1 h-px bg-white/10" /></div>
      <GoogleBtn onClick={() => toast.info("Google sign-in coming soon")} />
    </AuthShell>
  );
}
