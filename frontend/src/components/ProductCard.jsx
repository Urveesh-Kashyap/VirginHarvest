import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { mediaUrl } from "@/lib/api";

export const ProductCard = ({ product, index = 0 }) => {
  const img = mediaUrl(product.images?.[0]);
  const off = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.08 }}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl bg-surface border border-white/5 aspect-[4/5]">
          {off > 0 && (
            <span className="absolute top-4 left-4 z-10 bg-gold text-ink text-[11px] font-semibold px-3 py-1 rounded-full">{off}% OFF</span>
          )}
          {img && (
            <img src={img} alt={product.name}
              className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <span className="inline-flex items-center justify-center w-full bg-gold text-ink text-sm font-medium py-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              View Product
            </span>
          </div>
        </div>
        <div className="pt-4">
          <div className="flex items-center gap-1 text-gold mb-1">
            <Star size={13} fill="currentColor" />
            <span className="text-xs text-cream/60">{product.rating || 4.8}</span>
          </div>
          <h3 className="text-cream text-base md:text-lg font-light leading-snug group-hover:text-gold transition-colors">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-gold font-medium">₹{product.price}</span>
            {product.mrp > product.price && <span className="text-cream/40 text-sm line-through">₹{product.mrp}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
