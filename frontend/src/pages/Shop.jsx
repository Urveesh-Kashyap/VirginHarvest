import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("All");

  useEffect(() => { api.get("/products").then((r) => setProducts(r.data)).catch(() => {}); }, []);

  const cats = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = cat === "All" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="pt-32 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="shop-page">
      <div className="max-w-[1400px] mx-auto">
        <Reveal className="text-center mb-12">
          <p className="overline mb-4">The Collection</p>
          <h1 className="text-4xl md:text-6xl font-extralight text-cream">Cold Pressed Purity</h1>
          <p className="text-cream/60 mt-4 max-w-lg mx-auto font-light">Every bottle, slow wood-pressed from premium Rajasthan yellow mustard seeds.</p>
        </Reveal>

        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} data-testid={`filter-${c.toLowerCase().replace(/ /g, "-")}`}
              className={`px-6 py-2 rounded-full text-sm transition-colors ${cat === c ? "bg-gold text-ink" : "border border-white/15 text-cream/70 hover:border-gold hover:text-gold"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {filtered.length === 0 && <p className="text-center text-cream/50 py-20">No products yet.</p>}
      </div>
    </div>
  );
}
