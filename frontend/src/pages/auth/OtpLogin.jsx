import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthShell, Field, SubmitBtn } from "@/components/AuthShell";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function OtpLogin() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState("");

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/otp/request", { mobile });
      setStep(2);
      if (data.test_code) setHint(`Test mode — your OTP is ${data.test_code}`);
      toast.success("OTP sent to your mobile");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(mobile, code, name);
      toast.success("Logged in successfully");
      navigate("/account");
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell testid="otp-login-page" title="Mobile OTP Login" subtitle={step === 1 ? "Enter your mobile to receive an OTP" : "Enter the 6-digit code"}
      footer={<><Link to="/login" className="text-gold">Use email instead</Link></>}>
      {step === 1 ? (
        <form onSubmit={requestOtp} className="space-y-6">
          <Field label="Mobile Number" type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)} data-testid="otp-mobile" placeholder="10-digit mobile" />
          <Field label="Your Name (optional)" type="text" value={name} onChange={(e) => setName(e.target.value)} data-testid="otp-name" />
          <SubmitBtn loading={loading} data-testid="otp-request-submit">Send OTP</SubmitBtn>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-6">
          {hint && <p className="glass rounded-xl p-3 text-gold text-xs text-center" data-testid="otp-hint">{hint}</p>}
          <Field label="OTP Code" type="text" required value={code} onChange={(e) => setCode(e.target.value)} data-testid="otp-code" placeholder="123456" maxLength={6} />
          <SubmitBtn loading={loading} data-testid="otp-verify-submit">Verify & Login</SubmitBtn>
          <button type="button" onClick={() => setStep(1)} className="w-full text-cream/50 text-xs hover:text-gold">Change number</button>
        </form>
      )}
    </AuthShell>
  );
}
