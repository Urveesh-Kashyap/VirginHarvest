import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SiteLayout } from "@/components/SiteLayout";
import { ProtectedRoute, StaffRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Story from "@/pages/Story";
import Journal from "@/pages/Journal";
import BlogDetail from "@/pages/BlogDetail";
import Contact from "@/pages/Contact";
import Account from "@/pages/Account";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import OtpLogin from "@/pages/auth/OtpLogin";

import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminInventory from "@/pages/admin/AdminInventory";
import AdminSubscribers from "@/pages/admin/AdminSubscribers";
import AdminBlogs from "@/pages/admin/AdminBlogs";
import AdminTestimonials from "@/pages/admin/AdminTestimonials";
import AdminFaqs from "@/pages/admin/AdminFaqs";
import AdminGallery from "@/pages/admin/AdminGallery";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminHomepage from "@/pages/admin/AdminHomepage";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminSeo from "@/pages/admin/AdminSeo";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster position="top-center" theme="dark" richColors />
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/story" element={<Story />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/journal/:slug" element={<BlogDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/otp-login" element={<OtpLogin />} />

              <Route path="/admin" element={<StaffRoute><AdminLayout /></StaffRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="inventory" element={<AdminInventory />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
                <Route path="faqs" element={<AdminFaqs />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="homepage" element={<AdminHomepage />} />
                <Route path="seo" element={<AdminSeo />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
