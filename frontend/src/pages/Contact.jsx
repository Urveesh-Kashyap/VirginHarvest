import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import api, { formatApiError } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

export default function Contact() {
  const [faqs, setFaqs] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  useEffect(() => { api.get("/faqs").then((r) => setFaqs(r.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/newsletter", { email: form.email, name: form.name });
      toast.success("Message received. We'll be in touch soon.");
      setForm({ name: "", email: "", message: "" });
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  return (
    <div className="pt-32 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="contact-page">
      <div className="max-w-[1300px] mx-auto">
        <Reveal className="text-center mb-16">
          <p className="overline mb-4">Get in Touch</p>
          <h1 className="text-4xl md:text-6xl font-extralight text-cream">We'd love to hear from you</h1>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <form onSubmit={submit} className="space-y-7">
              {[{ k: "name", l: "Your Name", t: "text" }, { k: "email", l: "Email", t: "email" }].map((f) => (
                <div key={f.k}>
                  <label className="block text-cream/50 text-xs mb-2">{f.l}</label>
                  <input required type={f.t} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} data-testid={`contact-${f.k}`}
                    className="w-full bg-transparent border-b border-white/20 focus:border-gold py-3 text-cream outline-none transition-colors" />
                </div>
              ))}
              <div>
                <label className="block text-cream/50 text-xs mb-2">Message</label>
                <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message"
                  className="w-full bg-transparent border-b border-white/20 focus:border-gold py-3 text-cream outline-none transition-colors resize-none" />
              </div>
              <button type="submit" data-testid="contact-submit" className="bg-gold text-ink px-9 py-3.5 rounded-full font-medium hover:bg-gold-light transition-colors">Send Message</button>
            </form>

            <div className="grid sm:grid-cols-2 gap-5 mt-12">
              {[{ i: Phone, t: "Call us", v: "+91 98765 43210", h: "tel:+919876543210" }, { i: MessageCircle, t: "WhatsApp", v: "Chat with us", h: "https://wa.me/919876543210" }, { i: Mail, t: "Email", v: "care@virginharvest.in", h: "mailto:care@virginharvest.in" }, { i: MapPin, t: "Visit", v: "Jaipur, Rajasthan" }].map((c, k) => {
                const Ic = c.i; const inner = (<><Ic size={18} className="text-gold mb-3" /><p className="text-cream/40 text-xs">{c.t}</p><p className="text-cream text-sm">{c.v}</p></>);
                return c.h ? <a key={k} href={c.h} className="glass rounded-xl p-5 hover:border-gold/40 transition-colors">{inner}</a> : <div key={k} className="glass rounded-xl p-5">{inner}</div>;
              })}
            </div>
          </div>

          <div>
            <p className="overline mb-6">Frequently Asked</p>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f) => (
                <AccordionItem key={f.id} value={f.id} className="glass rounded-xl px-5 border-none" data-testid={`faq-${f.id}`}>
                  <AccordionTrigger className="text-cream hover:text-gold text-left text-sm md:text-base hover:no-underline">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-cream/60 font-light">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
