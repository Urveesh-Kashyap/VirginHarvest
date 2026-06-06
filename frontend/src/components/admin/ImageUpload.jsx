import React, { useState } from "react";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import api, { mediaUrl, formatApiError } from "@/lib/api";

export const ImageUpload = ({ value = [], onChange, multiple = true }) => {
  const [uploading, setUploading] = useState(false);
  const list = Array.isArray(value) ? value : value ? [value] : [];

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        urls.push(data.url);
      }
      onChange(multiple ? [...list, ...urls] : urls[0]);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeAt = (i) => {
    const next = list.filter((_, idx) => idx !== i);
    onChange(multiple ? next : "");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {list.map((url, i) => (
          <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-white/10 group">
            <img src={mediaUrl(url)} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => removeAt(i)} className="absolute top-1 right-1 bg-ink/80 rounded-full p-0.5 text-cream/80 hover:text-red-400"><X size={13} /></button>
          </div>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gold cursor-pointer hover:text-gold-light">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? "Uploading..." : "Upload image"}
        <input type="file" accept="image/*" multiple={multiple} onChange={upload} className="hidden" data-testid="image-upload-input" />
      </label>
    </div>
  );
};
