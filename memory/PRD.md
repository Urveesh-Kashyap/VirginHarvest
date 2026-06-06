# Virgin Harvest — Product Requirements (PRD)

## Original Problem Statement
Premium cinematic luxury D2C brand site for **Virgin Harvest Pvt. Ltd.** — Cold Pressed Mustard Oil from Rajasthan yellow mustard seeds. Tagline: *Tradition in Every Drop*. Luxury dark theme (deep black, forest green, mustard gold, cream), Poppins font. Apple/Tesla/Aesop-inspired. Bottle is the hero; experience-before-shopping. Requires full auth, role-based admin, validated checkout, and Razorpay/Shiprocket/Mailchimp integrations.

## Architecture
- **Backend:** FastAPI (`/api` prefix) + MongoDB (motor). JWT auth (Bearer + httpOnly cookie), bcrypt, RBAC (customer / sub_admin / admin). UUID-based document ids. DB-backed media uploads (`/api/media/{id}`).
- **Frontend:** React 19 + React Router 7, Tailwind (custom luxury tokens), Framer Motion + Lenis smooth scroll, Sonner toasts, shadcn/ui. AuthContext + CartContext (localStorage).
- **Brand visuals:** AI-generated (Gemini Nano Banana) served from `/frontend/public/brand/*.png`.

## User Personas
1. **Customer** — browses cinematic site, shops, checks out, tracks orders.
2. **Admin** — full store control (all modules).
3. **Sub Admin (Sales)** — orders, users, subscribers, dashboard only.

## Core Requirements (static)
- Cinematic homepage w/ scroll storytelling + floating WhatsApp/Instagram/Call.
- Auth: login, register, forgot/reset password, mobile OTP (mock). Google deferred.
- Validated checkout (Full Name, Mobile, Address, City, State, Pincode + payment). Order created ONLY after payment confirmation. Validated frontend + backend.
- Admin CRUD for: Products, Orders, Users, Testimonials, FAQs, Gallery, Blogs, Homepage, SEO, Inventory, Coupons, Settings, Subscribers — all DB-connected.

## Implemented (2026-06-06)
- ✅ Full backend: auth+RBAC, products, orders, checkout (Razorpay mock + signature verify), coupons, blogs, testimonials, faqs, gallery, homepage, settings, seo, inventory, subscribers, media upload, admin stats, seeding. **36/36 backend tests pass.**
- ✅ Cinematic homepage, Shop, Product detail (variants), Cart drawer, validated Checkout, Order success, Story, Journal+BlogDetail, Contact (FAQs), Account (orders).
- ✅ Auth pages (login/register/forgot/reset/OTP) with luxury split-screen UI.
- ✅ Full admin panel with role-filtered nav + all management modules (generic ResourceManager + dedicated Products/Orders/Users/Inventory/Homepage/Settings/SEO).
- ✅ Demo accounts seeded: admin@virginharvest.in/Admin@123, sales@virginharvest.in/Sales@123.

## MOCKED (awaiting keys)
- Razorpay (test-mode payment flow), Shiprocket (mock AWB), Mailchimp (logged subscribe), Mobile OTP SMS (fixed code 123456).

## Backlog / Next
- **P0:** Wire real Razorpay/Shiprocket/Mailchimp keys (adapters ready, just add env vars).
- **P1:** Continue with Google (Emergent Google Auth) + real SMS OTP (Twilio).
- **P1:** Confirm coupon discount badge always reflects backend amounts (minor UI nuance).
- **P2:** Split server.py into modules; product reviews; order email receipts; wishlist; SEO meta injection into <head> per route.
