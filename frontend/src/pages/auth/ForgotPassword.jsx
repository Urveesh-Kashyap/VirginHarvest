import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell, Field, SubmitBtn } from "@/components/AuthShell";
import api, { formatApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.debug_token) setResetLink(`/reset-password?token=${data.debug_token}`);
      toast.success("If the email exists, a reset link was sent.");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell testid="forgot-password-page" title="Reset password" subtitle="We'll send you a secure reset link"
      footer={<><Link to="/login" className="text-gold">Back to sign in</Link></>}>
      {sent ? (
        <div className="space-y-4">
          <p className="text-cream/70 text-sm">Check your email for a reset link.</p>
          {resetLink && (
            <Link to={resetLink} data-testid="dev-reset-link" className="block glass rounded-xl p-4 text-gold text-sm break-all hover:border-gold/40">
              [Dev] Click here to reset →
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="forgot-email" />
          <SubmitBtn loading={loading} data-testid="forgot-submit">Send Reset Link</SubmitBtn>
        </form>
      )}
    </AuthShell>
  );
}
