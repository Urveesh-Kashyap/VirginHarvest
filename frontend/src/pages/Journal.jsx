import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { mediaUrl } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

export default function Journal() {
  const [blogs, setBlogs] = useState([]);
  useEffect(() => { api.get("/blogs").then((r) => setBlogs(r.data)).catch(() => {}); }, []);

  return (
    <div className="pt-32 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="journal-page">
      <div className="max-w-[1300px] mx-auto">
        <Reveal className="text-center mb-16">
          <p className="overline mb-4">The Journal</p>
          <h1 className="text-4xl md:text-6xl font-extralight text-cream">Stories from the harvest</h1>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.08}>
              <Link to={`/journal/${b.slug}`} className="group block" data-testid={`blog-card-${b.slug}`}>
                <div className="rounded-2xl overflow-hidden aspect-[3/2] bg-surface border border-white/5 mb-5">
                  {b.cover_image && <img src={mediaUrl(b.cover_image)} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                </div>
                <h3 className="text-cream text-xl font-light group-hover:text-gold transition-colors">{b.title}</h3>
                <p className="text-cream/55 text-sm mt-2 line-clamp-2">{b.excerpt}</p>
                <span className="text-gold text-sm mt-3 inline-block">Read more →</span>
              </Link>
            </Reveal>
          ))}
        </div>
        {blogs.length === 0 && <p className="text-center text-cream/50 py-20">No journal entries yet.</p>}
      </div>
    </div>
  );
}
