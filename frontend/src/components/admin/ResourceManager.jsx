import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { ImageUpload } from "@/components/admin/ImageUpload";

// Generic modal-based CRUD manager driven by a field schema.
export default function ResourceManager({ title, endpoint, fields, columns, defaultItem, testid }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => api.get(`/admin/${endpoint}`).then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [endpoint]);

  const openCreate = () => { setEditing(null); setForm({ ...defaultItem }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    fields.forEach((f) => {
      if (f.type === "number") payload[f.name] = Number(payload[f.name] || 0);
      if (f.type === "tags" && typeof payload[f.name] === "string") payload[f.name] = payload[f.name].split(",").map((s) => s.trim()).filter(Boolean);
    });
    try {
      if (editing) await api.put(`/admin/${endpoint}/${editing.id}`, payload);
      else await api.post(`/admin/${endpoint}`, payload);
      toast.success(`${title} saved`);
      setOpen(false); load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()}?`)) return;
    try { await api.delete(`/admin/${endpoint}/${item.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const setField = (name, val) => setForm((f) => ({ ...f, [name]: val }));

  const renderCell = (item, col) => {
    const v = item[col.name];
    if (col.render) return col.render(item);
    if (col.type === "image") return v ? <img src={mediaUrl(Array.isArray(v) ? v[0] : v)} alt="" className="h-10 w-10 rounded object-cover" /> : "—";
    if (col.type === "boolean") return <span className={v ? "text-green-400" : "text-cream/40"}>{v ? "Yes" : "No"}</span>;
    if (Array.isArray(v)) return v.length;
    return String(v ?? "—");
  };

  return (
    <div data-testid={testid}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extralight text-cream">{title}</h1>
          <p className="text-cream/40 text-sm mt-1">{items.length} items</p>
        </div>
        <button onClick={openCreate} data-testid={`${testid}-add`} className="flex items-center gap-2 bg-gold text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gold-light transition-colors">
          <Plus size={17} /> Add
        </button>
      </div>

      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-cream/40 text-left border-b border-white/5">
              {columns.map((c) => <th key={c.name} className="p-4 font-normal">{c.label}</th>)}
              <th className="p-4 font-normal text-right">Actions</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]" data-testid={`${testid}-row-${item.id}`}>
                  {columns.map((c) => <td key={c.name} className="p-4 text-cream/80 max-w-xs truncate">{renderCell(item, c)}</td>)}
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(item)} className="text-cream/50 hover:text-gold mr-3" data-testid={`${testid}-edit-${item.id}`}><Pencil size={16} /></button>
                    <button onClick={() => remove(item)} className="text-cream/50 hover:text-red-400" data-testid={`${testid}-delete-${item.id}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={columns.length + 1} className="p-10 text-center text-cream/40">No items yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto" data-testid={`${testid}-modal`}>
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-surface">
                <h2 className="text-cream text-lg font-light">{editing ? "Edit" : "Add"} {title}</h2>
                <button onClick={() => setOpen(false)} className="text-cream/50 hover:text-gold"><X size={20} /></button>
              </div>
              <form onSubmit={save} className="p-6 space-y-5">
                {fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-cream/50 text-xs mb-2">{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea rows={f.rows || 4} value={form[f.name] || ""} onChange={(e) => setField(f.name, e.target.value)} data-testid={`field-${f.name}`}
                        className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold resize-none" />
                    ) : f.type === "boolean" ? (
                      <button type="button" onClick={() => setField(f.name, !form[f.name])} data-testid={`field-${f.name}`}
                        className={`relative h-6 w-11 rounded-full transition-colors ${form[f.name] ? "bg-gold" : "bg-white/15"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${form[f.name] ? "left-5.5 left-[22px]" : "left-0.5"}`} />
                      </button>
                    ) : f.type === "select" ? (
                      <select value={form[f.name] || ""} onChange={(e) => setField(f.name, e.target.value)} data-testid={`field-${f.name}`}
                        className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold">
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === "image" ? (
                      <ImageUpload value={form[f.name]} multiple={false} onChange={(v) => setField(f.name, v)} />
                    ) : f.type === "images" ? (
                      <ImageUpload value={form[f.name] || []} multiple onChange={(v) => setField(f.name, v)} />
                    ) : f.type === "tags" ? (
                      <input value={Array.isArray(form[f.name]) ? form[f.name].join(", ") : (form[f.name] || "")} onChange={(e) => setField(f.name, e.target.value)} data-testid={`field-${f.name}`}
                        placeholder="comma, separated" className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" />
                    ) : (
                      <input type={f.type} value={form[f.name] ?? ""} onChange={(e) => setField(f.name, e.target.value)} data-testid={`field-${f.name}`}
                        className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" />
                    )}
                  </div>
                ))}
                <button type="submit" disabled={saving} data-testid={`${testid}-save`} className="w-full bg-gold text-ink py-3 rounded-full font-medium hover:bg-gold-light transition-colors disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
