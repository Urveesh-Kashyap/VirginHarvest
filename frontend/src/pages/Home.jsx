import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Leaf, Droplets, ShieldCheck, Award, Star, Quote } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { Reveal, RevealText } from "@/components/Reveal";
import { ProductCard } from "@/components/ProductCard";

const IMG = {
  hero: "/brand/hero-bottle.png",
  field: "/brand/mustard-field.png",
  seeds: "/brand/seeds-macro.png",
  press: "/brand/cold-press.png",
  pour: "/brand/oil-pour.png",
  kitchen: "/brand/lifestyle-kitchen.png",
  founder: "/brand/founder-story.png",
};

const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden grain" data-testid="hero-section">
      <motion.div style={{ scale }} className="absolute inset-0">
        <img src={IMG.field} alt="Rajasthan mustard fields" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-ink/40" />
      </motion.div>

      <motion.div style={{ y, opacity }} className="relative z-10 h-full max-w-[1500px] mx-auto px-5 md:px-10 flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
          <div>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="overline mb-6">
              Cold Pressed · Single Origin Rajasthan
            </motion.p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extralight leading-[1.02] text-cream tracking-tight">
              <RevealText text="Tradition in" />
              <br />
              <span className="gold-gradient-text font-light"><RevealText text="Every Drop" /></span>
            </h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-7 text-cream/70 text-base md:text-lg font-light max-w-md leading-relaxed">
              Pure cold-pressed mustard oil, slow wood-pressed from premium yellow mustard seeds — the way it was always meant to be.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-9 flex flex-wrap gap-4">
              <Link to="/shop" data-testid="hero-shop-btn" className="group inline-flex items-center gap-2 bg-gold text-ink px-8 py-4 rounded-full font-medium hover:bg-gold-light transition-colors">
                Shop the Collection <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/story" data-testid="hero-story-btn" className="inline-flex items-center gap-2 border border-cream/30 text-cream px-8 py-4 rounded-full hover:border-gold hover:text-gold transition-colors">
                Our Story
              </Link>
            </motion.div>
          </div>

          <div className="relative hidden lg:flex justify-center items-center">
            <div className="absolute h-[420px] w-[420px] rounded-full bg-gold/25 blur-3xl" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.5, duration: 1.2 }}
              className="relative z-10 animate-float"
            >
              <div className="relative rounded-[2rem] overflow-hidden border border-gold/30 gold-glow" style={{ width: 420, height: 560 }}>
                <img src={IMG.hero} alt="Virgin Harvest cold pressed mustard oil bottle" className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem]" />
                <div className="absolute bottom-5 left-5 right-5 glass rounded-xl px-4 py-3">
                  <p className="text-gold text-[10px] tracking-[0.25em] uppercase">Cold Pressed</p>
                  <p className="text-cream text-sm">Single Origin · Rajasthan</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-cream/40 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <div className="h-10 w-px bg-gradient-to-b from-gold to-transparent" />
      </motion.div>
    </section>
  );
};

const Marquee = () => (
  <div className="bg-gold py-4 overflow-hidden" data-testid="marquee">
    <motion.div className="flex gap-12 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
      {Array.from({ length: 2 }).map((_, r) => (
        <div key={r} className="flex gap-12">
          {["100% Cold Pressed", "Single Origin Rajasthan", "No Chemicals · No Refining", "Rich in Omega-3", "Wood Pressed Kachi Ghani", "Free Shipping over ₹999"].map((t, i) => (
            <span key={i} className="text-ink font-medium tracking-wide flex items-center gap-12 text-sm">{t} <span className="text-ink/40">✦</span></span>
          ))}
        </div>
      ))}
    </motion.div>
  </div>
);

const StorySection = ({ img, overline, title, body, reverse, testid }) => (
  <section className="py-24 md:py-36 px-5 md:px-10" data-testid={testid}>
    <div className={`max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
      <Reveal className="lg:[direction:ltr]">
        <div className="relative overflow-hidden rounded-3xl">
          <motion.img src={img} alt={title} className="w-full h-[60vh] object-cover" initial={{ scale: 1.2 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
        </div>
      </Reveal>
      <Reveal delay={0.15} className="lg:[direction:ltr]">
        <p className="overline mb-5">{overline}</p>
        <h2 className="text-3xl md:text-5xl font-extralight text-cream leading-tight mb-6">{title}</h2>
        <p className="text-cream/65 text-base md:text-lg font-light leading-relaxed">{body}</p>
      </Reveal>
    </div>
  </section>
);

const pillars = [
  { icon: Leaf, title: "Single Origin", desc: "Yellow mustard seeds from the golden fields of Rajasthan." },
  { icon: Droplets, title: "Cold Pressed", desc: "Slow wood-pressed below 40°C to preserve every nutrient." },
  { icon: ShieldCheck, title: "Zero Chemicals", desc: "No refining, no preservatives, no shortcuts. Ever." },
  { icon: Award, title: "Lab Tested", desc: "Every batch verified for purity and pungency." },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then((r) => setProducts(r.data)).catch(() => {});
    api.get("/testimonials").then((r) => setTestimonials(r.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      <Hero />
      <Marquee />

      {/* Trust pillars */}
      <section className="py-24 md:py-32 px-5 md:px-10 bg-ink" data-testid="pillars-section">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <p className="overline mb-4">Why Virgin Harvest</p>
            <h2 className="text-3xl md:text-5xl font-extralight text-cream leading-tight">Purity you can taste, tradition you can trust</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.1}>
                  <div className="glass rounded-2xl p-8 h-full hover:border-gold/40 transition-colors duration-500 group">
                    <Icon size={30} className="text-gold mb-5 group-hover:scale-110 transition-transform" />
                    <h3 className="text-cream text-lg mb-2">{p.title}</h3>
                    <p className="text-cream/55 text-sm leading-relaxed">{p.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <StorySection testid="story-harvest" img={IMG.field} overline="The Origin" title="Born in the fields of Rajasthan"
        body="Where the soil runs golden and the air is thick with the scent of mustard blossom. We hand-select only premium yellow mustard seeds — the heart of every bottle we craft." />

      <StorySection testid="story-press" reverse img={IMG.press} overline="The Craft" title="Slow wood-pressed, never rushed"
        body="Our seeds meet the traditional kachi ghani — a wooden press turning slowly, gently coaxing the oil out without heat. No refining. No chemicals. Just the bold, honest oil of generations past." />

      {/* Product hero showcase */}
      <section className="relative py-28 md:py-40 px-5 md:px-10 overflow-hidden grain" data-testid="product-showcase">
        <img src={IMG.pour} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative max-w-[1100px] mx-auto text-center">
          <Reveal>
            <p className="overline mb-5">The Hero</p>
            <h2 className="text-4xl md:text-6xl font-extralight text-cream leading-tight mb-6">Liquid gold, in a bottle</h2>
            <p className="text-cream/70 text-lg font-light max-w-xl mx-auto mb-10">Every drop carries the warmth of the harvest and the patience of the press.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-gold text-ink px-9 py-4 rounded-full font-medium hover:bg-gold-light transition-colors">
              Discover the Bottle <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-24 md:py-32 px-5 md:px-10 bg-ink" data-testid="featured-products">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="overline mb-4">The Collection</p>
              <h2 className="text-3xl md:text-5xl font-extralight text-cream">Crafted for your kitchen</h2>
            </div>
            <Link to="/shop" className="text-gold flex items-center gap-2 hover:gap-3 transition-all">View all <ArrowRight size={18} /></Link>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-24 md:py-32 px-5 md:px-10 bg-surface" data-testid="testimonials-section">
          <div className="max-w-[1400px] mx-auto">
            <Reveal className="text-center mb-16">
              <p className="overline mb-4">Loved across India</p>
              <h2 className="text-3xl md:text-5xl font-extralight text-cream">From our family to yours</h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t, i) => (
                <Reveal key={t.id} delay={i * 0.1}>
                  <div className="glass rounded-2xl p-8 h-full flex flex-col">
                    <Quote size={28} className="text-gold/50 mb-4" />
                    <p className="text-cream/80 font-light leading-relaxed flex-1">"{t.quote}"</p>
                    <div className="flex gap-0.5 text-gold mt-5 mb-3">
                      {Array.from({ length: t.rating || 5 }).map((_, s) => <Star key={s} size={14} fill="currentColor" />)}
                    </div>
                    <p className="text-cream text-sm font-medium">{t.name}</p>
                    <p className="text-cream/40 text-xs">{t.location}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lifestyle CTA */}
      <section className="relative py-32 md:py-48 px-5 md:px-10 overflow-hidden" data-testid="lifestyle-cta">
        <img src={IMG.kitchen} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/30" />
        <div className="relative max-w-[900px] mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-extralight text-cream leading-tight mb-6">Bring tradition home</h2>
            <p className="text-cream/75 text-lg font-light mb-10 max-w-lg mx-auto">Experience the difference cold pressing makes — in flavour, aroma and goodness.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-gold text-ink px-10 py-4 rounded-full font-medium hover:bg-gold-light transition-colors">
              Shop Now <ArrowRight size={18} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
