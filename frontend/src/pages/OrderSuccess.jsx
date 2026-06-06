import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Package } from "lucide-react";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderNo = params.get("no");
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-ink grain" data-testid="order-success-page">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="inline-flex h-20 w-20 rounded-full bg-gold/15 items-center justify-center mb-8">
          <CheckCircle2 size={44} className="text-gold" />
        </motion.div>
        <p className="overline mb-4">Order Confirmed</p>
        <h1 className="text-3xl md:text-4xl font-extralight text-cream mb-4">Thank you for choosing tradition</h1>
        <p className="text-cream/60 font-light mb-2">Your payment was successful and your order is confirmed.</p>
        {orderNo && <p className="text-gold text-lg mb-8" data-testid="order-number">Order #{orderNo}</p>}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/account" className="inline-flex items-center justify-center gap-2 bg-gold text-ink px-7 py-3.5 rounded-full font-medium hover:bg-gold-light transition-colors"><Package size={17} /> Track My Order</Link>
          <Link to="/shop" className="inline-flex items-center justify-center border border-white/20 text-cream px-7 py-3.5 rounded-full hover:border-gold hover:text-gold transition-colors">Continue Shopping</Link>
        </div>
      </motion.div>
    </div>
  );
}
