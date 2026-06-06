import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Reveal, RevealText } from "@/components/Reveal";

const IMG = {
  field: "/brand/mustard-field.png", seeds: "/brand/seeds-macro.png",
  press: "/brand/cold-press.png", founder: "/brand/founder-story.png", pour: "/brand/oil-pour.png",
};

const steps = [
  { n: "01", t: "The Seed", d: "Premium yellow mustard seeds, single-origin from Rajasthan's golden fields, hand-selected at peak harvest.", img: IMG.seeds },
  { n: "02", t: "The Press", d: "Slow wood-pressing in a traditional kachi ghani, below 40°C — no heat, no haste, no compromise.", img: IMG.press },
  { n: "03", t: "The Drop", d: "Unrefined, unfiltered, bottled at source. The bold aroma and goodness of tradition, sealed in.", img: IMG.pour },
];

export default function Story() {
  return (
    <div className="bg-ink" data-testid="story-page">
      <section className="relative h-[70vh] flex items-center justify-center grain overflow-hidden">
        <img src={IMG.founder} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/70" />
        <div className="relative text-center px-5">
          <p className="overline mb-5">Est. in Tradition</p>
          <h1 className="text-4xl md:text-7xl font-extralight text-cream leading-tight"><RevealText text="The Virgin Harvest Story" /></h1>
        </div>
      </section>

      <section className="py-24 md:py-32 px-5 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <p className="text-cream/75 text-lg md:text-2xl font-extralight leading-relaxed">
              For generations, mustard oil was pressed slowly, honestly, with patience. Then the world got faster — and purity got lost. Virgin Harvest is our return to the old way: <span className="text-gold">tradition in every drop.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {steps.map((s, i) => (
        <section key={s.n} className="py-16 md:py-24 px-5 md:px-10" data-testid={`process-step-${s.n}`}>
          <div className={`max-w-[1300px] mx-auto grid lg:grid-cols-2 gap-12 items-center ${i % 2 ? "lg:[direction:rtl]" : ""}`}>
            <Reveal className="lg:[direction:ltr]">
              <div className="rounded-3xl overflow-hidden">
                <motion.img src={s.img} alt={s.t} className="w-full h-[55vh] object-cover" initial={{ scale: 1.2 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.4 }} />
              </div>
            </Reveal>
            <Reveal delay={0.15} className="lg:[direction:ltr]">
              <span className="text-7xl font-extralight text-gold/30">{s.n}</span>
              <h2 className="text-3xl md:text-5xl font-extralight text-cream mt-2 mb-5">{s.t}</h2>
              <p className="text-cream/65 text-lg font-light leading-relaxed">{s.d}</p>
            </Reveal>
          </div>
        </section>
      ))}

      <section className="py-28 px-5 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-5xl font-extralight text-cream mb-8">Taste the tradition</h2>
          <Link to="/shop" className="inline-flex bg-gold text-ink px-10 py-4 rounded-full font-medium hover:bg-gold-light transition-colors">Shop the Collection</Link>
        </Reveal>
      </section>
    </div>
  );
}
