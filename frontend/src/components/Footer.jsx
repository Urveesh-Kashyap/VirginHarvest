import React from "react";
import { Link } from "react-router-dom";
import { useNewsletter } from "@/hooks/useNewsletter";
import { MessageCircle, Instagram, Phone, Mail } from "lucide-react";

const LOGO = "https://customer-assets.emergentagent.com/job_0875d049-6e15-4764-b4b0-462206d8f86a/artifacts/kvwlwyfi_Virgin%20Harvest%20logo%20design.png";

export const Footer = () => {
  const { email, setEmail, submit, loading } = useNewsletter();
  return (
    <footer className="relative bg-ink border-t border-white/10 pt-20 pb-10 px-5 md:px-10" data-testid="main-footer">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <img src={LOGO} alt="Virgin Harvest" className="h-12 w-12 object-contain rounded-full bg-cream/90 p-0.5" />
              <span className="text-cream font-semibold tracking-[0.18em]">VIRGIN HARVEST</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Pure cold-pressed mustard oil from premium Rajasthan yellow mustard seeds. Tradition in every drop.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className="overline mb-5">Explore</h4>
            <ul className="space-y-3 text-sm text-cream/70">
              <li><Link to="/shop" className="hover:text-gold transition-colors">Shop</Link></li>
              <li><Link to="/story" className="hover:text-gold transition-colors">Our Story</Link></li>
              <li><Link to="/journal" className="hover:text-gold transition-colors">Journal</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="overline mb-5">Support</h4>
            <ul className="space-y-3 text-sm text-cream/70">
              <li><Link to="/account" className="hover:text-gold transition-colors">My Orders</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">FAQs</Link></li>
              <li><Link to="/login" className="hover:text-gold transition-colors">Account</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="overline mb-5">The Inner Circle</h4>
            <p className="text-sm text-cream/70 mb-4">Stories from the harvest, early access & quiet offers.</p>
            <form onSubmit={submit} className="flex border-b border-white/20 focus-within:border-gold transition-colors">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email" data-testid="footer-newsletter-input"
                className="flex-1 bg-transparent py-3 text-cream placeholder:text-cream/40 outline-none"
              />
              <button disabled={loading} data-testid="footer-newsletter-submit" className="text-gold text-sm tracking-wide hover:text-gold-light transition-colors disabled:opacity-50">
                {loading ? "..." : "Join →"}
              </button>
            </form>
            <div className="flex gap-4 mt-6">
              <a href="https://wa.me/919876543210" aria-label="WhatsApp" className="text-cream/60 hover:text-gold transition-colors"><MessageCircle size={18} /></a>
              <a href="https://instagram.com/virginharvest" aria-label="Instagram" className="text-cream/60 hover:text-gold transition-colors"><Instagram size={18} /></a>
              <a href="tel:+919876543210" aria-label="Call" className="text-cream/60 hover:text-gold transition-colors"><Phone size={18} /></a>
              <a href="mailto:care@virginharvest.in" aria-label="Email" className="text-cream/60 hover:text-gold transition-colors"><Mail size={18} /></a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/10 text-xs text-cream/40">
          <p>© {new Date().getFullYear()} Virgin Harvest Pvt. Ltd. All rights reserved.</p>
          <p>Jaipur, Rajasthan · Made with tradition</p>
        </div>
      </div>
    </footer>
  );
};
