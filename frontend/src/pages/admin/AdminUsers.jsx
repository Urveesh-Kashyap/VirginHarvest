import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ROLES = ["customer", "sub_admin", "admin"];

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const isAdmin = me?.role === "admin";

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const setRole = async (u, role) => {
    try { await api.put(`/admin/users/${u.id}`, { role }); toast.success("Role updated"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };
  const remove = async (u) => {
    if (!window.confirm("Delete this user?")) return;
    try { await api.delete(`/admin/users/${u.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div data-testid="admin-users">
      <h1 className="text-2xl md:text-3xl font-extralight text-cream mb-2">Users</h1>
      <p className="text-cream/40 text-sm mb-8">{users.length} users</p>
      <div className="bg-surface border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-cream/40 text-left border-b border-white/5">
              <th className="p-4 font-normal">Name</th><th className="p-4 font-normal">Email</th><th className="p-4 font-normal">Mobile</th><th className="p-4 font-normal">Role</th>{isAdmin && <th className="p-4 font-normal text-right">Actions</th>}
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]" data-testid={`user-row-${u.id}`}>
                  <td className="p-4 text-cream/80">{u.name}</td>
                  <td className="p-4 text-cream/60">{u.email}</td>
                  <td className="p-4 text-cream/60">{u.mobile || "—"}</td>
                  <td className="p-4">
                    {isAdmin ? (
                      <select value={u.role} onChange={(e) => setRole(u, e.target.value)} data-testid={`user-role-${u.id}`}
                        className="bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-cream text-xs outline-none focus:border-gold capitalize">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : <span className="capitalize text-cream/70">{u.role}</span>}
                  </td>
                  {isAdmin && <td className="p-4 text-right"><button onClick={() => remove(u)} className="text-cream/50 hover:text-red-400" data-testid={`user-delete-${u.id}`}><Trash2 size={16} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
