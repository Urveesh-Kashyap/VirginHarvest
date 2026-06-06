import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

const empty = {
  name: "", tagline: "", description: "", long_description: "", category: "Cold Pressed Oil",
  price: 0, mrp: 0, stock: 0, images: [], benefits: [], specs: {}, variants: [], featured: false, active: true, rating: 4.8,
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [specsText, setSpecsText] = useState("");

  const load = () => api.get("/admin/products").then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setSpecsText(""); setOpen(true); };
  const openEdit = (p) => {
    setEditing(p); setForm({ ...empty, ...p });
    setSpecsText(Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join("\n"));
    setOpen(true);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addVariant = () => set("variants", [...(form.variants || []), { label: "", size: "", price: 0, mrp: 0, stock: 0 }]);
  const updVariant = (i, k, v) => set("variants", form.variants.map((vr, idx) => idx === i ? { ...vr, [k]: k === "label" || k === "size" ? v : Number(v) } : vr));
  const delVariant = (i) => set("variants", form.variants.filter((_, idx) => idx !== i));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const specs = {};
    specsText.split("\n").forEach((line) => { const [k, ...rest] = line.split(":"); if (k && rest.length) specs[k.trim()] = rest.join(":").trim(); });
    const payload = {
      ...form, price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock), rating: Number(form.rating),
      benefits: Array.isArray(form.benefits) ? form.benefits : String(form.benefits).split(",").map((s) => s.trim()).filter(Boolean),
      specs,
    };
    try {
      if (editing) await api.put(`/admin/products/${editing.id}`, payload);
      else await api.post("/admin/products", payload);
      toast.success("Product saved");
      setOpen(false); load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/admin/products/${p.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const Input = ({ label, k, type = "text", full }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-cream/50 text-xs mb-2">{label}</label>
      <input type={type} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} data-testid={`product-${k}`}
        className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" />
    </div>
  );

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl md:text-3xl font-extralight text-cream">Products</h1><p className="text-cream/40 text-sm mt-1">{items.length} products</p></div>
        <button onClick={openCreate} data-testid="admin-products-add" className="flex items-center gap-2 bg-gold text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gold-light transition-colors"><Plus size={17} /> Add Product</button>
      </div>

      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-cream/40 text-left border-b border-white/5">
              <th className="p-4 font-normal">Image</th><th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Price</th><th className="p-4 font-normal">Stock</th><th className="p-4 font-normal">Featured</th><th className="p-4 font-normal text-right">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]" data-testid={`product-row-${p.id}`}>
                  <td className="p-4">{p.images?.[0] && <img src={mediaUrl(p.images[0])} alt="" className="h-11 w-11 rounded object-cover" />}</td>
                  <td className="p-4 text-cream/80 max-w-xs truncate">{p.name}</td>
                  <td className="p-4 text-gold">₹{p.price}</td>
                  <td className="p-4 text-cream/70">{p.stock}</td>
                  <td className="p-4">{p.featured ? <span className="text-gold">★</span> : "—"}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-cream/50 hover:text-gold mr-3" data-testid={`product-edit-${p.id}`}><Pencil size={16} /></button>
                    <button onClick={() => remove(p)} className="text-cream/50 hover:text-red-400" data-testid={`product-delete-${p.id}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-cream/40">No products yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="product-modal">
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-surface z-10">
                <h2 className="text-cream text-lg font-light">{editing ? "Edit" : "Add"} Product</h2>
                <button onClick={() => setOpen(false)} className="text-cream/50 hover:text-gold"><X size={20} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Name" k="name" full />
                  <Input label="Tagline" k="tagline" full />
                  <Input label="Category" k="category" />
                  <Input label="Rating" k="rating" type="number" />
                  <Input label="Price (₹)" k="price" type="number" />
                  <Input label="MRP (₹)" k="mrp" type="number" />
                  <Input label="Stock" k="stock" type="number" />
                </div>
                <div><label className="block text-cream/50 text-xs mb-2">Short Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="product-description" className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold resize-none" /></div>
                <div><label className="block text-cream/50 text-xs mb-2">Long Description</label>
                  <textarea rows={4} value={form.long_description} onChange={(e) => set("long_description", e.target.value)} className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold resize-none" /></div>

                <div><label className="block text-cream/50 text-xs mb-2">Images</label><ImageUpload value={form.images} onChange={(v) => set("images", v)} /></div>

                <div><label className="block text-cream/50 text-xs mb-2">Benefits (comma separated)</label>
                  <input value={Array.isArray(form.benefits) ? form.benefits.join(", ") : form.benefits} onChange={(e) => set("benefits", e.target.value.split(",").map((s) => s.trim()))} data-testid="product-benefits" className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" /></div>

                <div><label className="block text-cream/50 text-xs mb-2">Specs (one per line, "Key: Value")</label>
                  <textarea rows={3} value={specsText} onChange={(e) => setSpecsText(e.target.value)} className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold resize-none font-mono text-xs" /></div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-cream/50 text-xs">Variants / Sizes</label>
                    <button type="button" onClick={addVariant} data-testid="add-variant" className="text-gold text-xs flex items-center gap-1"><Plus size={13} /> Add variant</button>
                  </div>
                  <div className="space-y-2">
                    {(form.variants || []).map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input placeholder="Label" value={v.label} onChange={(e) => updVariant(i, "label", e.target.value)} className="flex-1 bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold" />
                        <input placeholder="Size" value={v.size} onChange={(e) => updVariant(i, "size", e.target.value)} className="w-20 bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold" />
                        <input placeholder="₹" type="number" value={v.price} onChange={(e) => updVariant(i, "price", e.target.value)} className="w-20 bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold" />
                        <input placeholder="Stock" type="number" value={v.stock} onChange={(e) => updVariant(i, "stock", e.target.value)} className="w-20 bg-ink border border-white/10 rounded-lg px-3 py-2 text-cream text-sm outline-none focus:border-gold" />
                        <button type="button" onClick={() => delVariant(i)} className="text-cream/40 hover:text-red-400"><Trash2 size={15} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-8">
                  {[{ k: "featured", l: "Featured" }, { k: "active", l: "Active" }].map((t) => (
                    <div key={t.k} className="flex items-center gap-3">
                      <button type="button" onClick={() => set(t.k, !form[t.k])} data-testid={`product-${t.k}`} className={`relative h-6 w-11 rounded-full transition-colors ${form[t.k] ? "bg-gold" : "bg-white/15"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${form[t.k] ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                      <span className="text-cream/70 text-sm">{t.l}</span>
                    </div>
                  ))}
                </div>

                <button type="submit" disabled={saving} data-testid="product-save" className="w-full bg-gold text-ink py-3 rounded-full font-medium hover:bg-gold-light transition-colors disabled:opacity-60">{saving ? "Saving..." : "Save Product"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
