import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Check, Minus, Plus, ShoppingBag, Truck, ShieldCheck, Leaf } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { Reveal } from "@/components/Reveal";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      setActiveImg(0);
      setVariant(r.data.variants?.length ? r.data.variants[0] : null);
    }).catch(() => navigate("/shop"));
  }, [slug, navigate]);

  if (!product) return <div className="min-h-screen flex items-center justify-center bg-ink"><div className="h-10 w-10 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;

  const price = variant ? variant.price : product.price;
  const mrp = variant ? variant.mrp : product.mrp;
  const images = product.images?.length ? product.images : [];

  const handleAdd = (buyNow) => {
    add({
      product_id: product.id, name: product.name, variant: variant?.label || null,
      price, image: images[0],
    }, qty);
    if (buyNow) navigate("/checkout");
  };

  return (
    <div className="pt-28 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="product-detail-page">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-cream/40 mb-8 flex gap-2">
          <Link to="/shop" className="hover:text-gold">Shop</Link> / <span className="text-cream/70">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Gallery */}
          <div className="lg:sticky lg:top-28 self-start">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden bg-surface border border-white/5 aspect-square gold-glow">
              {images[activeImg] && <img src={mediaUrl(images[activeImg])} alt={product.name} className="w-full h-full object-cover" />}
            </motion.div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4">
                {images.map((im, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} data-testid={`thumb-${i}`}
                    className={`h-20 w-20 rounded-xl overflow-hidden border ${activeImg === i ? "border-gold" : "border-white/10"}`}>
                    <img src={mediaUrl(im)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <Reveal>
              <p className="overline mb-3">{product.category}</p>
              <h1 className="text-3xl md:text-5xl font-extralight text-cream leading-tight">{product.name}</h1>
              {product.tagline && <p className="text-gold/90 mt-3 font-light">{product.tagline}</p>}

              <div className="flex items-center gap-2 mt-4">
                <div className="flex text-gold">{Array.from({ length: 5 }).map((_, s) => <Star key={s} size={15} fill={s < Math.round(product.rating) ? "currentColor" : "none"} />)}</div>
                <span className="text-cream/50 text-sm">{product.rating} · Trusted by 10,000+ families</span>
              </div>

              <div className="flex items-end gap-3 mt-6">
                <span className="text-4xl font-light text-gold">₹{price}</span>
                {mrp > price && <span className="text-cream/40 text-lg line-through mb-1">₹{mrp}</span>}
                {mrp > price && <span className="text-green-400 text-sm mb-1.5">Save {Math.round(((mrp - price) / mrp) * 100)}%</span>}
              </div>

              <p className="text-cream/65 mt-6 font-light leading-relaxed">{product.long_description || product.description}</p>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className="mt-7">
                  <p className="text-cream/60 text-sm mb-3">Select size</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((v) => (
                      <button key={v.label} onClick={() => setVariant(v)} data-testid={`variant-${v.size}`}
                        className={`px-5 py-3 rounded-xl border text-sm transition-colors ${variant?.label === v.label ? "border-gold bg-gold/10 text-gold" : "border-white/15 text-cream/70 hover:border-gold/50"}`}>
                        <span className="block">{v.label}</span>
                        <span className="block text-xs opacity-70">₹{v.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex items-center gap-4 border border-white/15 rounded-full px-5 py-3">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="qty-dec" className="text-cream/60 hover:text-gold"><Minus size={16} /></button>
                  <span className="text-cream w-6 text-center" data-testid="qty-value">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} data-testid="qty-inc" className="text-cream/60 hover:text-gold"><Plus size={16} /></button>
                </div>
                <button onClick={() => handleAdd(false)} data-testid="add-to-cart-btn" className="flex-1 flex items-center justify-center gap-2 border border-gold text-gold py-4 rounded-full hover:bg-gold/10 transition-colors">
                  <ShoppingBag size={18} /> Add to Cart
                </button>
              </div>
              <button onClick={() => handleAdd(true)} data-testid="buy-now-btn" className="w-full bg-gold text-ink py-4 rounded-full font-medium mt-4 hover:bg-gold-light transition-colors">
                Buy Now
              </button>

              <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                {[{ i: Truck, t: "Free over ₹999" }, { i: ShieldCheck, t: "Lab Tested" }, { i: Leaf, t: "100% Natural" }].map((b, k) => {
                  const Ic = b.i;
                  return <div key={k} className="glass rounded-xl py-4"><Ic size={20} className="text-gold mx-auto mb-2" /><span className="text-cream/60 text-xs">{b.t}</span></div>;
                })}
              </div>

              {/* Benefits */}
              {product.benefits?.length > 0 && (
                <div className="mt-10">
                  <h3 className="text-cream text-lg mb-4 font-light">Why you'll love it</h3>
                  <ul className="space-y-3">
                    {product.benefits.map((b, k) => (
                      <li key={k} className="flex items-center gap-3 text-cream/70"><Check size={16} className="text-gold flex-shrink-0" /> {b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Specs */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mt-10 glass rounded-2xl p-6">
                  <h3 className="text-cream text-lg mb-4 font-light">Specifications</h3>
                  <dl className="space-y-3">
                    {Object.entries(product.specs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm border-b border-white/5 pb-3">
                        <dt className="text-cream/50">{k}</dt><dd className="text-cream/90">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
