import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const FIELDS = [
  { k: "brand", l: "Brand Name" },
  { k: "tagline", l: "Tagline" },
  { k: "phone", l: "Phone" },
  { k: "whatsapp", l: "WhatsApp Number" },
  { k: "instagram", l: "Instagram URL" },
  { k: "email", l: "Support Email" },
  { k: "address", l: "Address" },
  { k: "free_shipping_above", l: "Free Shipping Above (₹)", num: true },
  { k: "shipping_flat", l: "Flat Shipping (₹)", num: true },
];

export default function AdminSettings() {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/settings").then((r) => setData(r.data || {})).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    const payload = { ...data };
    FIELDS.forEach((f) => { if (f.num) payload[f.k] = Number(payload[f.k] || 0); });
    try { await api.put("/admin/settings", payload); toast.success("Settings saved"); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-settings" className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Store Settings</h1>
      <p className="text-cream/40 text-sm mb-8">Brand info, contact & shipping</p>
      <div className="bg-surface border border-white/5 rounded-xl p-6 grid sm:grid-cols-2 gap-5">
        {FIELDS.map((f) => (
          <div key={f.k}>
            <label className="block text-cream/50 text-xs mb-2">{f.l}</label>
            <input type={f.num ? "number" : "text"} value={data[f.k] ?? ""} onChange={(e) => setData({ ...data, [f.k]: e.target.value })} data-testid={`settings-${f.k}`}
              className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" />
          </div>
        ))}
        <div className="sm:col-span-2">
          <button onClick={save} disabled={saving} data-testid="settings-save" className="bg-gold text-ink px-7 py-3 rounded-full font-medium hover:bg-gold-light transition-colors disabled:opacity-60">{saving ? "Saving..." : "Save Settings"}</button>
        </div>
      </div>
    </div>
  );
}
