import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const FIELDS = [
  { k: "hero_overline", l: "Hero Overline" },
  { k: "hero_title", l: "Hero Title" },
  { k: "hero_subtitle", l: "Hero Subtitle", area: true },
  { k: "hero_cta", l: "Hero CTA Text" },
  { k: "story_title", l: "Story Title" },
  { k: "story_body", l: "Story Body", area: true },
];

export default function AdminHomepage() {
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/homepage").then((r) => setData(r.data || {})).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.put("/admin/homepage", data); toast.success("Homepage content updated"); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div data-testid="admin-homepage" className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Homepage Content</h1>
      <p className="text-cream/40 text-sm mb-8">Edit the cinematic homepage copy</p>
      <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.k}>
            <label className="block text-cream/50 text-xs mb-2">{f.l}</label>
            {f.area ? (
              <textarea rows={3} value={data[f.k] || ""} onChange={(e) => setData({ ...data, [f.k]: e.target.value })} data-testid={`homepage-${f.k}`}
                className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold resize-none" />
            ) : (
              <input value={data[f.k] || ""} onChange={(e) => setData({ ...data, [f.k]: e.target.value })} data-testid={`homepage-${f.k}`}
                className="w-full bg-ink border border-white/10 rounded-lg px-4 py-2.5 text-cream outline-none focus:border-gold" />
            )}
          </div>
        ))}
        <button onClick={save} disabled={saving} data-testid="homepage-save" className="bg-gold text-ink px-7 py-3 rounded-full font-medium hover:bg-gold-light transition-colors disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
      </div>
    </div>
  );
}
