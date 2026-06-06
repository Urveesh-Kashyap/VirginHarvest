import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tag, Lock, ArrowLeft } from "lucide-react";
import api, { formatApiError, mediaUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const fields = [
  { name: "full_name", label: "Full Name", type: "text", col: 2 },
  { name: "mobile", label: "Mobile Number", type: "tel", col: 1 },
  { name: "email", label: "Email (optional)", type: "email", col: 1 },
  { name: "address", label: "Full Address", type: "text", col: 2 },
  { name: "city", label: "City", type: "text", col: 1 },
  { name: "state", label: "State", type: "text", col: 1 },
  { name: "pincode", label: "Pincode", type: "text", col: 1 },
];

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement("script");
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", mobile: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [amounts, setAmounts] = useState({ subtotal, shipping: 0, discount: 0, total: subtotal });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: f.full_name || user.name || "", email: f.email || (user.email?.includes("@mobile") ? "" : user.email || ""), mobile: f.mobile || user.mobile || "" }));
  }, [user]);

  useEffect(() => {
    if (items.length === 0) return;
    const shipping = subtotal >= 999 ? 0 : 60;
    let discount = 0;
    if (appliedCoupon) {
      discount = appliedCoupon.type === "percent" ? Math.round(subtotal * appliedCoupon.value / 100) : Math.min(appliedCoupon.value, subtotal);
    }
    setAmounts({ subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) });
  }, [subtotal, appliedCoupon, items.length]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, "").slice(-10)) || form.mobile.replace(/\D/g, "").length < 10) e.mobile = "Enter a valid 10-digit number";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!/^\d{6}$/.test(form.pincode.replace(/\D/g, ""))) e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon, items });
      setAppliedCoupon(data.coupon);
      toast.success(`Coupon ${data.coupon.code} applied`);
    } catch (err) {
      setAppliedCoupon(null);
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    setLoading(true);
    const orderItems = items.map((i) => ({ product_id: i.product_id, name: i.name, variant: i.variant, price: i.price, quantity: i.quantity, image: i.image }));
    const shipping = { ...form };
    try {
      const { data } = await api.post("/checkout/create-order", { items: orderItems, shipping, coupon_code: appliedCoupon?.code || null });

      const finalize = async (payment) => {
        const res = await api.post("/checkout/verify", {
          items: orderItems, shipping, coupon_code: appliedCoupon?.code || null,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature || "",
        });
        clear();
        navigate(`/order-success?no=${res.data.order_no}`);
      };

      if (data.mock || !data.key_id) {
        // Test mode payment
        toast.message("Processing payment (Test Mode)...");
        await new Promise((r) => setTimeout(r, 900));
        await finalize({ razorpay_payment_id: `pay_mock_${Date.now()}`, razorpay_signature: "mock" });
      } else {
        await loadRazorpay();
        const rzp = new window.Razorpay({
          key: data.key_id, amount: data.amount_paise, currency: data.currency,
          name: "Virgin Harvest", description: "Cold Pressed Mustard Oil", order_id: data.razorpay_order_id,
          prefill: { name: form.full_name, email: form.email, contact: form.mobile },
          theme: { color: "#DDA73B" },
          handler: async (resp) => { await finalize(resp); },
        });
        rzp.on("payment.failed", () => { toast.error("Payment failed. Please try again."); setLoading(false); });
        rzp.open();
        setLoading(false);
        return;
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-40 pb-32 px-5 text-center min-h-screen bg-ink" data-testid="checkout-empty">
        <h1 className="text-3xl font-extralight text-cream mb-4">Your cart is empty</h1>
        <button onClick={() => navigate("/shop")} className="text-gold">Continue shopping →</button>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 px-5 md:px-10 min-h-screen bg-ink" data-testid="checkout-page">
      <div className="max-w-[1300px] mx-auto">
        <button onClick={() => navigate(-1)} className="text-cream/50 hover:text-gold flex items-center gap-2 text-sm mb-8"><ArrowLeft size={16} /> Back</button>
        <h1 className="text-3xl md:text-5xl font-extralight text-cream mb-10">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Shipping form */}
          <div className="lg:col-span-3">
            <h2 className="overline mb-6">Shipping Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-7">
              {fields.map((f) => (
                <div key={f.name} className={f.col === 2 ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                  <label className="block text-cream/50 text-xs mb-2">{f.label}</label>
                  <input
                    type={f.type} value={form[f.name]} data-testid={`checkout-${f.name}`}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={`w-full bg-transparent border-b py-3 text-cream outline-none transition-colors ${errors[f.name] ? "border-red-500" : "border-white/20 focus:border-gold"}`}
                  />
                  {errors[f.name] && <span className="text-red-400 text-xs mt-1 block" data-testid={`error-${f.name}`}>{errors[f.name]}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-7 lg:sticky lg:top-28">
              <h2 className="overline mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((i, k) => (
                  <div key={k} className="flex gap-3 items-center">
                    <img src={mediaUrl(i.image)} alt={i.name} className="h-14 w-14 rounded-lg object-cover bg-ink" />
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-sm truncate">{i.name}</p>
                      <p className="text-cream/40 text-xs">{i.variant} × {i.quantity}</p>
                    </div>
                    <span className="text-gold text-sm">₹{i.price * i.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <div className="flex-1 flex items-center gap-2 border-b border-white/20">
                  <Tag size={15} className="text-gold" />
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" data-testid="coupon-input"
                    className="flex-1 bg-transparent py-2 text-cream text-sm outline-none placeholder:text-cream/30" />
                </div>
                <button onClick={applyCoupon} data-testid="apply-coupon-btn" className="text-gold text-sm hover:text-gold-light">Apply</button>
              </div>

              <div className="space-y-3 text-sm border-t border-white/10 pt-5">
                <div className="flex justify-between text-cream/60"><span>Subtotal</span><span data-testid="summary-subtotal">₹{amounts.subtotal}</span></div>
                <div className="flex justify-between text-cream/60"><span>Shipping</span><span>{amounts.shipping === 0 ? "Free" : `₹${amounts.shipping}`}</span></div>
                {amounts.discount > 0 && <div className="flex justify-between text-green-400"><span>Discount</span><span data-testid="summary-discount">−₹{amounts.discount}</span></div>}
                <div className="flex justify-between text-cream text-lg font-medium border-t border-white/10 pt-4"><span>Total</span><span className="text-gold" data-testid="summary-total">₹{amounts.total}</span></div>
              </div>

              <button onClick={placeOrder} disabled={loading} data-testid="place-order-btn"
                className="w-full bg-gold text-ink py-4 rounded-full font-medium mt-7 flex items-center justify-center gap-2 hover:bg-gold-light transition-colors disabled:opacity-60">
                <Lock size={16} /> {loading ? "Processing..." : `Pay ₹${amounts.total}`}
              </button>
              <p className="text-cream/30 text-[11px] text-center mt-3">Secured by Razorpay · Test mode active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
