import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

export default function AdminSubscribers() {
  const [subs, setSubs] = useState([]);
  useEffect(() => { api.get("/admin/subscribers").then((r) => setSubs(r.data)).catch(() => {}); }, []);

  const exportCsv = () => {
    const rows = [["Email", "Name", "Date"], ...subs.map((s) => [s.email, s.name || "", s.created_at])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
    toast.success("Exported");
  };

  return (
    <div data-testid="admin-subscribers">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl md:text-3xl font-extralight text-cream">Newsletter Subscribers</h1><p className="text-cream/40 text-sm mt-1">{subs.length} subscribers · Mailchimp ready</p></div>
        <button onClick={exportCsv} className="bg-gold text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gold-light transition-colors" data-testid="export-subscribers">Export CSV</button>
      </div>
      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-cream/40 text-left border-b border-white/5"><th className="p-4 font-normal">Email</th><th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Synced</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-white/5 last:border-0">
                <td className="p-4 text-cream/80">{s.email}</td><td className="p-4 text-cream/60">{s.name || "—"}</td>
                <td className="p-4">{s.synced_mailchimp ? <span className="text-green-400">Yes</span> : <span className="text-cream/40">Pending</span>}</td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-cream/40">No subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
