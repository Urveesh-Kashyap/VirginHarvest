import React from "react";
import { Phone, MessageCircle, Instagram } from "lucide-react";
import { motion } from "framer-motion";

const buttons = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25D366", href: "https://wa.me/919876543210" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", href: "https://instagram.com/virginharvest" },
  { id: "call", label: "Call", icon: Phone, color: "#DDA73B", href: "tel:+919876543210" },
];

export const FloatingActions = () => (
  <div className="fixed bottom-6 right-5 md:bottom-8 md:right-8 z-40 flex flex-col gap-3">
    {buttons.map((b, i) => {
      const Icon = b.icon;
      return (
        <motion.a
          key={b.id}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={b.label}
          data-testid={`float-${b.id}`}
          initial={{ opacity: 0, scale: 0, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          className="group relative h-12 w-12 md:h-13 md:w-13 rounded-full flex items-center justify-center glass shadow-lg"
          style={{ boxShadow: `0 0 22px -6px ${b.color}` }}
        >
          <Icon size={21} style={{ color: b.color }} />
          <span className="absolute right-full mr-3 whitespace-nowrap text-xs bg-ink/90 text-cream px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
            {b.label}
          </span>
        </motion.a>
      );
    })}
  </div>
);
