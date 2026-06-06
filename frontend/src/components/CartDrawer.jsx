import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { mediaUrl } from "@/lib/api";

export const CartDrawer = () => {
  const { items, open, setOpen, updateQty, remove, subtotal, key } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface z-50 flex flex-col border-l border-white/10"
            data-testid="cart-drawer"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-cream text-lg tracking-wide flex items-center gap-2"><ShoppingBag size={18} className="text-gold" /> Your Cart</h3>
              <button onClick={() => setOpen(false)} data-testid="cart-close" className="text-cream/60 hover:text-gold"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {items.length === 0 ? (
                <div className="text-center text-cream/50 py-20">
                  <ShoppingBag size={40} className="mx-auto mb-4 text-cream/20" />
                  <p>Your cart is empty.</p>
                  <button onClick={() => { setOpen(false); navigate("/shop"); }} className="text-gold mt-4 text-sm">Explore the Harvest →</button>
                </div>
              ) : (
                items.map((i) => {
                  const k = key(i);
                  return (
                    <div key={k} className="flex gap-4" data-testid={`cart-item-${i.product_id}`}>
                      <img src={mediaUrl(i.image)} alt={i.name} className="h-20 w-20 object-cover rounded-xl bg-ink" />
                      <div className="flex-1">
                        <p className="text-cream text-sm leading-tight">{i.name}</p>
                        {i.variant && <p className="text-cream/40 text-xs mt-0.5">{i.variant}</p>}
                        <p className="text-gold text-sm mt-1">₹{i.price}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQty(k, i.quantity - 1)} className="text-cream/60 hover:text-gold" data-testid={`cart-dec-${i.product_id}`}><Minus size={15} /></button>
                          <span className="text-cream text-sm w-5 text-center">{i.quantity}</span>
                          <button onClick={() => updateQty(k, i.quantity + 1)} className="text-cream/60 hover:text-gold" data-testid={`cart-inc-${i.product_id}`}><Plus size={15} /></button>
                          <button onClick={() => remove(k)} className="ml-auto text-cream/40 hover:text-red-400" data-testid={`cart-remove-${i.product_id}`}><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex justify-between text-cream mb-4">
                  <span className="text-cream/60">Subtotal</span>
                  <span className="font-medium text-gold">₹{subtotal.toFixed(0)}</span>
                </div>
                <button
                  onClick={() => { setOpen(false); navigate("/checkout"); }}
                  data-testid="cart-checkout-btn"
                  className="w-full bg-gold text-ink py-4 rounded-full font-medium hover:bg-gold-light transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
