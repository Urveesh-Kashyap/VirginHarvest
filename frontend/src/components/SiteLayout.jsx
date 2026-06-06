import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { CartDrawer } from "@/components/CartDrawer";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export const SiteLayout = () => {
  useSmoothScroll();
  return (
    <div className="bg-ink min-h-screen">
      <Header />
      <CartDrawer />
      <main>
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
    </div>
  );
};
