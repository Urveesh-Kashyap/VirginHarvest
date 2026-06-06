import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});

  const load = () => api.get("/admin/inventory").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async (p) => {
    const stock = edits[p.id] ?? p.stock;
    try { await api.put(`/admin/inventory/${p.id}`, { stock: Number(stock) }); toast.success("Stock updated"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div data-testid="admin-inventory">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Inventory</h1>
      <p className="text-cream/40 text-sm mb-8">Manage stock levels</p>
      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-cream/40 text-left border-b border-white/5">
            <th className="p-4 font-normal">Product</th><th className="p-4 font-normal">Price</th><th className="p-4 font-normal">Stock</th><th className="p-4 font-normal text-right">Update</th>
          </tr></thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className={`border-b border-white/5 last:border-0 ${p.stock < 10 ? "bg-red-500/5" : ""}`} data-testid={`inventory-row-${p.id}`}>
                <td className="p-4 text-cream/80">{p.name}</td>
                <td className="p-4 text-gold">₹{p.price}</td>
                <td className="p-4">
                  <input type="number" defaultValue={p.stock} onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })} data-testid={`inventory-stock-${p.id}`}
                    className={`w-24 bg-ink border rounded-lg px-3 py-1.5 text-cream outline-none focus:border-gold ${p.stock < 10 ? "border-red-500/50" : "border-white/10"}`} />
                </td>
                <td className="p-4 text-right"><button onClick={() => save(p)} data-testid={`inventory-save-${p.id}`} className="text-gold hover:text-gold-light text-sm">Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
