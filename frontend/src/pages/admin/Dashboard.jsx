import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShoppingCart, Users, Package, FileText, Mail, AlertTriangle, IndianRupee } from "lucide-react";
import api from "@/lib/api";

const cards = [
  { key: "revenue", label: "Revenue", icon: IndianRupee, prefix: "₹" },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "users", label: "Customers", icon: Users },
  { key: "products", label: "Products", icon: Package },
  { key: "subscribers", label: "Subscribers", icon: Mail },
  { key: "blogs", label: "Blogs", icon: FileText },
  { key: "low_stock", label: "Low Stock", icon: AlertTriangle, warn: true },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/admin/orders").then((r) => setOrders(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div data-testid="admin-dashboard">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Dashboard</h1>
      <p className="text-cream/40 text-sm mb-8 flex items-center gap-2"><TrendingUp size={14} className="text-gold" /> Live store overview</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-surface border border-white/5 rounded-xl p-5" data-testid={`stat-${c.key}`}>
              <Icon size={20} className={c.warn ? "text-red-400 mb-3" : "text-gold mb-3"} />
              <p className="text-2xl font-light text-cream">{c.prefix || ""}{stats[c.key] ?? 0}</p>
              <p className="text-cream/40 text-xs mt-1">{c.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-surface border border-white/5 rounded-xl p-6">
        <h2 className="text-cream text-lg font-light mb-5">Recent Orders</h2>
        {orders.length === 0 ? <p className="text-cream/40 text-sm">No orders yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-cream/40 text-left border-b border-white/5">
                <th className="pb-3 font-normal">Order</th><th className="pb-3 font-normal">Customer</th><th className="pb-3 font-normal">Total</th><th className="pb-3 font-normal">Status</th>
              </tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-gold">#{o.order_no}</td>
                    <td className="py-3 text-cream/70">{o.shipping?.full_name}</td>
                    <td className="py-3 text-cream">₹{o.amounts?.total}</td>
                    <td className="py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-gold/10 text-gold capitalize">{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
