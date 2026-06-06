import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, Eye } from "lucide-react";
import api, { formatApiError, mediaUrl } from "@/lib/api";

const STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
const color = (s) => ({ confirmed: "bg-gold/10 text-gold", processing: "bg-blue-400/10 text-blue-400", shipped: "bg-purple-400/10 text-purple-400", delivered: "bg-green-400/10 text-green-400", cancelled: "bg-red-400/10 text-red-400" }[s] || "bg-white/5 text-cream/60");

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = () => api.get("/admin/orders").then((r) => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateStatus = async (order, status) => {
    try {
      await api.put(`/admin/orders/${order.id}/status`, { status });
      toast.success(`Order marked ${status}`);
      load();
      if (selected?.id === order.id) setSelected({ ...selected, status });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div data-testid="admin-orders">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Orders</h1>
      <p className="text-cream/40 text-sm mb-8">{orders.length} orders</p>

      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-cream/40 text-left border-b border-white/5">
              <th className="p-4 font-normal">Order</th><th className="p-4 font-normal">Customer</th><th className="p-4 font-normal">Mobile</th><th className="p-4 font-normal">Total</th><th className="p-4 font-normal">Status</th><th className="p-4 font-normal text-right">View</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]" data-testid={`order-row-${o.order_no}`}>
                  <td className="p-4 text-gold">#{o.order_no}</td>
                  <td className="p-4 text-cream/80">{o.shipping?.full_name}</td>
                  <td className="p-4 text-cream/60">{o.shipping?.mobile}</td>
                  <td className="p-4 text-cream">₹{o.amounts?.total}</td>
                  <td className="p-4">
                    <select value={o.status} onChange={(e) => updateStatus(o, e.target.value)} data-testid={`order-status-${o.order_no}`}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize outline-none ${color(o.status)}`}>
                      {STATUSES.map((s) => <option key={s} value={s} className="bg-surface text-cream">{s}</option>)}
                    </select>
                  </td>
                  <td className="p-4 text-right"><button onClick={() => setSelected(o)} className="text-cream/50 hover:text-gold" data-testid={`order-view-${o.order_no}`}><Eye size={17} /></button></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-cream/40">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" data-testid="order-detail-modal">
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-surface">
                <h2 className="text-cream text-lg font-light">Order #{selected.order_no}</h2>
                <button onClick={() => setSelected(null)} className="text-cream/50 hover:text-gold"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="overline mb-3">Items</p>
                  {selected.items.map((it, k) => (
                    <div key={k} className="flex gap-3 items-center mb-3">
                      <img src={mediaUrl(it.image)} alt="" className="h-12 w-12 rounded-lg object-cover bg-ink" />
                      <div className="flex-1"><p className="text-cream text-sm">{it.name}</p><p className="text-cream/40 text-xs">{it.variant} × {it.quantity}</p></div>
                      <span className="text-gold text-sm">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="overline mb-3">Shipping</p>
                  <div className="text-cream/70 text-sm space-y-1">
                    <p>{selected.shipping.full_name} · {selected.shipping.mobile}</p>
                    <p>{selected.shipping.address}</p>
                    <p>{selected.shipping.city}, {selected.shipping.state} - {selected.shipping.pincode}</p>
                  </div>
                </div>
                <div>
                  <p className="overline mb-3">Payment & Shipment</p>
                  <div className="text-cream/70 text-sm space-y-1">
                    <p>Payment: <span className="text-green-400">{selected.payment?.status}</span> ({selected.payment?.razorpay_payment_id})</p>
                    <p>AWB: {selected.shiprocket?.awb || "—"} {selected.shiprocket?.configured ? "" : "(mock)"}</p>
                    <p>Total: <span className="text-gold">₹{selected.amounts?.total}</span></p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => updateStatus(selected, s)} className={`px-3 py-1.5 rounded-full text-xs capitalize ${selected.status === s ? "bg-gold text-ink" : "border border-white/15 text-cream/60 hover:border-gold"}`}>{s}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
