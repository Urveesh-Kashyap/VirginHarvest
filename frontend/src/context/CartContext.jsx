import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vh_cart") || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("vh_cart", JSON.stringify(items));
  }, [items]);

  const key = (i) => `${i.product_id}__${i.variant || ""}`;

  const add = (item, qty = 1) => {
    setItems((prev) => {
      const k = key(item);
      const found = prev.find((p) => key(p) === k);
      if (found) return prev.map((p) => (key(p) === k ? { ...p, quantity: p.quantity + qty } : p));
      return [...prev, { ...item, quantity: qty }];
    });
    toast.success(`${item.name}${item.variant ? " · " + item.variant : ""} added to cart`);
    setOpen(true);
  };

  const updateQty = (k, qty) => {
    if (qty < 1) return remove(k);
    setItems((prev) => prev.map((p) => (key(p) === k ? { ...p, quantity: qty } : p)));
  };

  const remove = (k) => setItems((prev) => prev.filter((p) => key(p) !== k));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, clear, count, subtotal, open, setOpen, key }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
