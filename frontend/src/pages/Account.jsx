import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, LogOut, User } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusColor = (s) => ({
  confirmed: "text-gold bg-gold/10", shipped: "text-blue-400 bg-blue-400/10",
  delivered: "text-green-400 bg-green-400/10", cancelled: "text-red-400 bg-red-400/10",
}[s] || "text-cream/60 bg-white/5");

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => { api.get("/orders/my").then((r) => setOrders(r.data)).catch(() => {}); }, []);

  return (
    <div className="pt-32 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="account-page">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gold/15 flex items-center justify-center"><User size={24} className="text-gold" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extralight text-cream">{user?.name}</h1>
              <p className="text-cream/50 text-sm">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 text-cream/60 hover:text-gold text-sm self-start" data-testid="account-logout"><LogOut size={16} /> Logout</button>
        </div>

        <h2 className="overline mb-6">My Orders</h2>
        {orders.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={36} className="text-cream/20 mx-auto mb-4" />
            <p className="text-cream/50">No orders yet.</p>
            <button onClick={() => navigate("/shop")} className="text-gold mt-3">Start shopping →</button>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((o) => (
              <div key={o.id} className="glass rounded-2xl p-6" data-testid={`order-${o.order_no}`}>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-cream font-medium">#{o.order_no}</p>
                    <p className="text-cream/40 text-xs">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColor(o.status)}`}>{o.status}</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {o.items.map((it, k) => (
                    <div key={k} className="flex gap-3 items-center">
                      <img src={mediaUrl(it.image)} alt={it.name} className="h-12 w-12 rounded-lg object-cover bg-ink" />
                      <div><p className="text-cream/80 text-sm">{it.name}</p><p className="text-cream/40 text-xs">{it.variant} × {it.quantity}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                  <span className="text-cream/50 text-sm">{o.shiprocket?.awb ? `Tracking: ${o.shiprocket.awb}` : "Processing"}</span>
                  <span className="text-gold font-medium">₹{o.amounts?.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
