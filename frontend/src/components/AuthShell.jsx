import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO = "https://customer-assets.emergentagent.com/job_0875d049-6e15-4764-b4b0-462206d8f86a/artifacts/kvwlwyfi_Virgin%20Harvest%20logo%20design.png";

export const AuthShell = ({ title, subtitle, children, footer, testid }) => (
  <div className="min-h-screen grid lg:grid-cols-2 bg-ink" data-testid={testid}>
    <div className="relative hidden lg:block overflow-hidden grain">
      <img src="/brand/oil-pour.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/20" />
      <div className="absolute bottom-14 left-12 right-12">
        <p className="overline mb-4">Virgin Harvest</p>
        <h2 className="text-4xl font-extralight text-cream leading-tight">Tradition in <span className="gold-gradient-text">Every Drop</span></h2>
      </div>
    </div>

    <div className="flex items-center justify-center p-6 md:p-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <img src={LOGO} alt="Virgin Harvest" className="h-11 w-11 object-contain rounded-full bg-cream/90 p-0.5" />
          <span className="text-cream font-semibold tracking-[0.18em] text-sm">VIRGIN HARVEST</span>
        </Link>
        <h1 className="text-3xl font-extralight text-cream mb-2">{title}</h1>
        {subtitle && <p className="text-cream/50 text-sm mb-8">{subtitle}</p>}
        {children}
        {footer && <div className="mt-8 text-center text-sm text-cream/50">{footer}</div>}
      </motion.div>
    </div>
  </div>
);

export const Field = ({ label, error, ...props }) => (
  <div>
    <label className="block text-cream/50 text-xs mb-2">{label}</label>
    <input {...props}
      className={`w-full bg-transparent border-b py-3 text-cream outline-none transition-colors ${error ? "border-red-500" : "border-white/20 focus:border-gold"}`} />
    {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}
  </div>
);

export const SubmitBtn = ({ children, loading, ...props }) => (
  <button {...props} disabled={loading} className="w-full bg-gold text-ink py-3.5 rounded-full font-medium hover:bg-gold-light transition-colors disabled:opacity-60 mt-2">
    {loading ? "Please wait..." : children}
  </button>
);

export const GoogleBtn = ({ onClick }) => (
  <button onClick={onClick} type="button" data-testid="google-btn" className="w-full border border-white/20 text-cream py-3.5 rounded-full font-light hover:border-gold transition-colors flex items-center justify-center gap-3">
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.1 29.6 3 24 3 16 3 9.1 7.6 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-6.9l-6.5 5C9 41.4 15.9 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6.3 5.3C41.9 35.7 45 30.4 45 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
    Continue with Google
  </button>
);
