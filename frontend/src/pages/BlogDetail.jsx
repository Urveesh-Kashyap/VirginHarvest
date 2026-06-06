import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { mediaUrl } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  useEffect(() => { api.get(`/blogs/${slug}`).then((r) => setBlog(r.data)).catch(() => {}); }, [slug]);

  if (!blog) return <div className="min-h-screen flex items-center justify-center bg-ink"><div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;

  return (
    <div className="pt-28 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="blog-detail-page">
      <article className="max-w-3xl mx-auto">
        <Link to="/journal" className="text-cream/50 hover:text-gold text-sm">← Back to Journal</Link>
        <Reveal>
          <p className="overline mt-8 mb-4">{blog.author}</p>
          <h1 className="text-3xl md:text-5xl font-extralight text-cream leading-tight mb-8">{blog.title}</h1>
        </Reveal>
        {blog.cover_image && (
          <div className="rounded-3xl overflow-hidden mb-10">
            <img src={mediaUrl(blog.cover_image)} alt={blog.title} className="w-full h-[50vh] object-cover" />
          </div>
        )}
        <div className="text-cream/75 text-lg font-light leading-relaxed whitespace-pre-line">{blog.content}</div>
      </article>
    </div>
  );
}
