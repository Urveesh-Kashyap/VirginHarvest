import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell, Field, SubmitBtn } from "@/components/AuthShell";
import api, { formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated. Please sign in.");
      navigate("/login");
    } catch (err) { setError(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell testid="reset-password-page" title="Set new password" subtitle="Choose a strong new password"
      footer={<><Link to="/login" className="text-gold">Back to sign in</Link></>}>
      {!token ? (
        <p className="text-red-400 text-sm">Invalid reset link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Field label="New Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="reset-password" error={error} />
          <SubmitBtn loading={loading} data-testid="reset-submit">Update Password</SubmitBtn>
        </form>
      )}
    </AuthShell>
  );
}
