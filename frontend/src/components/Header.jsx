import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, User, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const LOGO = "https://customer-assets.emergentagent.com/job_0875d049-6e15-4764-b4b0-462206d8f86a/artifacts/kvwlwyfi_Virgin%20Harvest%20logo%20design.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/story", label: "Our Story" },
  { to: "/journal", label: "Journal" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setOpen } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const isStaff = user && (user.role === "admin" || user.role === "sub_admin");

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
      data-testid="main-header"
    >
      <div className="max-w-[1500px] mx-auto px-5 md:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
          <img src={LOGO} alt="Virgin Harvest" className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full bg-cream/90 p-0.5" />
          <div className="leading-none">
            <span className="block text-cream font-semibold tracking-[0.18em] text-sm md:text-base">VIRGIN HARVEST</span>
            <span className="block text-gold text-[9px] md:text-[10px] tracking-[0.3em] uppercase mt-0.5">Tradition in Every Drop</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase().replace(" ", "-")}`}
              className={`text-sm tracking-wide transition-colors duration-300 hover:text-gold ${
                location.pathname === l.to ? "text-gold" : "text-cream/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isStaff && (
            <Link to="/admin" className="hidden md:inline-flex text-gold" data-testid="header-admin-link" title="Admin">
              <LayoutDashboard size={20} />
            </Link>
          )}
          {user ? (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/account" className="text-cream/80 hover:text-gold transition-colors" data-testid="header-account">
                <User size={20} />
              </Link>
              <button onClick={() => { logout(); navigate("/"); }} className="text-cream/60 hover:text-gold transition-colors" data-testid="header-logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:inline-flex text-cream/80 hover:text-gold transition-colors" data-testid="header-login">
              <User size={20} />
            </Link>
          )}

          <button onClick={() => setOpen(true)} className="relative text-cream hover:text-gold transition-colors" data-testid="header-cart">
            <ShoppingBag size={21} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] font-semibold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center" style={{ height: 18, minWidth: 18 }}>
                {count}
              </span>
            )}
          </button>

          <button onClick={() => setMobileOpen((v) => !v)} className="lg:hidden text-cream" data-testid="mobile-menu-toggle">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden glass mt-3 mx-4 rounded-2xl"
          >
            <div className="flex flex-col p-6 gap-4">
              {links.map((l) => (
                <Link key={l.to} to={l.to} className="text-cream/90 hover:text-gold text-lg" data-testid={`mobile-nav-${l.label.toLowerCase().replace(" ", "-")}`}>
                  {l.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {user ? (
                <>
                  <Link to="/account" className="text-cream/90 hover:text-gold">My Account</Link>
                  {isStaff && <Link to="/admin" className="text-gold">Admin Dashboard</Link>}
                  <button onClick={() => { logout(); navigate("/"); }} className="text-left text-cream/70">Logout</button>
                </>
              ) : (
                <Link to="/login" className="text-gold">Login / Register</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
