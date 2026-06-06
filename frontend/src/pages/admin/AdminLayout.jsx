import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, FileText, MessageSquareQuote,
  HelpCircle, Image, Ticket, Home as HomeIcon, Search, Boxes, Settings, Mail, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const LOGO = "https://customer-assets.emergentagent.com/job_0875d049-6e15-4764-b4b0-462206d8f86a/artifacts/kvwlwyfi_Virgin%20Harvest%20logo%20design.png";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "sub_admin"], end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, roles: ["admin", "sub_admin"] },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin", "sub_admin"] },
  { to: "/admin/subscribers", label: "Subscribers", icon: Mail, roles: ["admin", "sub_admin"] },
  { to: "/admin/products", label: "Products", icon: Package, roles: ["admin"] },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ["admin"] },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, roles: ["admin"] },
  { to: "/admin/blogs", label: "Blogs", icon: FileText, roles: ["admin"] },
  { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, roles: ["admin"] },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle, roles: ["admin"] },
  { to: "/admin/gallery", label: "Gallery", icon: Image, roles: ["admin"] },
  { to: "/admin/homepage", label: "Homepage", icon: HomeIcon, roles: ["admin"] },
  { to: "/admin/seo", label: "SEO", icon: Search, roles: ["admin"] },
  { to: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = nav.filter((n) => n.roles.includes(user?.role));

  const isActive = (n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to));

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <img src={LOGO} alt="" className="h-9 w-9 object-contain rounded-full bg-cream/90 p-0.5" />
        <div className="leading-none">
          <span className="block text-cream text-sm font-semibold tracking-wider">VIRGIN HARVEST</span>
          <span className="block text-gold text-[10px] tracking-widest uppercase mt-0.5">{user?.role === "admin" ? "Admin" : "Sales Team"}</span>
        </div>
      </Link>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} data-testid={`admin-nav-${n.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${isActive(n) ? "bg-gold/15 text-gold" : "text-cream/60 hover:text-cream hover:bg-white/5"}`}>
              <Icon size={18} /> {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={() => { logout(); navigate("/"); }} data-testid="admin-logout" className="flex items-center gap-3 px-4 py-2.5 text-cream/60 hover:text-red-400 text-sm w-full">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink flex" data-testid="admin-layout">
      <aside className="hidden lg:flex w-64 bg-surface border-r border-white/5 flex-col fixed inset-y-0">
        <Sidebar />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/70" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-surface border-r border-white/5"><Sidebar /></aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 glass px-5 py-4 flex items-center justify-between lg:justify-end">
          <button className="lg:hidden text-cream" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <div className="flex items-center gap-3">
            <span className="text-cream/60 text-sm hidden sm:block">{user?.email}</span>
            <div className="h-9 w-9 rounded-full bg-gold/15 flex items-center justify-center text-gold text-sm font-medium">{user?.name?.[0]}</div>
          </div>
        </header>
        <div className="p-5 md:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
