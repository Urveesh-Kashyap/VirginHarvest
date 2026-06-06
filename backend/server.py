from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
import base64
import hashlib
import hmac
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File
from fastapi.responses import Response as FastResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, field_validator

# ----------------------------------------------------------------------------
# Setup
# ----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_ALGORITHM = "HS256"
OTP_TEST_CODE = os.environ.get("OTP_TEST_CODE", "123456")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("virginharvest")

app = FastAPI(title="Virgin Harvest API")
api = APIRouter(prefix="/api")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": now_utc() + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def strip_id(doc: dict) -> dict:
    if doc:
        doc.pop("_id", None)
    return doc


# ----------------------------------------------------------------------------
# Auth dependencies
# ----------------------------------------------------------------------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user = strip_id(user)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


def require_roles(*roles):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker


require_admin = require_roles("admin")
require_staff = require_roles("admin", "sub_admin")


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

    @field_validator("name")
    @classmethod
    def name_ok(cls, v):
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6)


class OtpRequestIn(BaseModel):
    mobile: str

    @field_validator("mobile")
    @classmethod
    def mobile_ok(cls, v):
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) < 10:
            raise ValueError("Enter a valid 10-digit mobile number")
        return digits[-10:]


class OtpVerifyIn(BaseModel):
    mobile: str
    code: str
    name: Optional[str] = None


class ProductVariant(BaseModel):
    label: str
    size: str
    price: float
    mrp: Optional[float] = None
    stock: int = 0
    sku: Optional[str] = None


class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    tagline: Optional[str] = ""
    description: str = ""
    long_description: Optional[str] = ""
    category: Optional[str] = "Cold Pressed Oil"
    price: float
    mrp: Optional[float] = None
    stock: int = 0
    images: List[str] = []
    benefits: List[str] = []
    specs: dict = {}
    variants: List[ProductVariant] = []
    featured: bool = False
    active: bool = True
    rating: float = 4.8


class OrderItem(BaseModel):
    product_id: str
    name: str
    variant: Optional[str] = None
    price: float
    quantity: int = Field(ge=1)
    image: Optional[str] = None


class ShippingAddress(BaseModel):
    full_name: str
    mobile: str
    email: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str

    @field_validator("full_name", "address", "city", "state")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("This field is required")
        return v.strip()

    @field_validator("mobile")
    @classmethod
    def mobile_ok(cls, v):
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) < 10:
            raise ValueError("Enter a valid 10-digit mobile number")
        return digits[-10:]

    @field_validator("pincode")
    @classmethod
    def pin_ok(cls, v):
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) != 6:
            raise ValueError("Enter a valid 6-digit pincode")
        return digits


class CheckoutCreateIn(BaseModel):
    items: List[OrderItem]
    shipping: ShippingAddress
    coupon_code: Optional[str] = None

    @field_validator("items")
    @classmethod
    def items_ok(cls, v):
        if not v:
            raise ValueError("Cart cannot be empty")
        return v


class CheckoutVerifyIn(BaseModel):
    items: List[OrderItem]
    shipping: ShippingAddress
    coupon_code: Optional[str] = None
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None


class CouponIn(BaseModel):
    code: str
    type: Literal["percent", "flat"] = "percent"
    value: float
    min_order: float = 0
    active: bool = True
    expires_at: Optional[str] = None


class BlogIn(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: str = ""
    content: str = ""
    cover_image: Optional[str] = ""
    author: str = "Virgin Harvest"
    published: bool = True
    tags: List[str] = []


class TestimonialIn(BaseModel):
    name: str
    location: Optional[str] = ""
    quote: str
    rating: int = 5
    avatar: Optional[str] = ""
    active: bool = True


class FaqIn(BaseModel):
    question: str
    answer: str
    category: Optional[str] = "General"
    active: bool = True
    order: int = 0


class GalleryIn(BaseModel):
    title: Optional[str] = ""
    image: str
    caption: Optional[str] = ""
    active: bool = True


class NewsletterIn(BaseModel):
    email: EmailStr
    name: Optional[str] = ""


class OrderStatusIn(BaseModel):
    status: str
    note: Optional[str] = None


class UserUpdateIn(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def slugify(text: str) -> str:
    s = "".join(c.lower() if c.isalnum() else "-" for c in text)
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")[:80] or new_id()[:8]


async def compute_amounts(items: List[OrderItem], coupon_code: Optional[str]):
    subtotal = sum(i.price * i.quantity for i in items)
    settings = await db.settings.find_one({"id": "global"}) or {}
    free_above = settings.get("free_shipping_above", 999)
    ship_flat = settings.get("shipping_flat", 60)
    shipping = 0 if subtotal >= free_above else ship_flat
    discount = 0.0
    coupon_applied = None
    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code.upper(), "active": True})
        if coupon and subtotal >= coupon.get("min_order", 0):
            if coupon["type"] == "percent":
                discount = round(subtotal * coupon["value"] / 100, 2)
            else:
                discount = min(coupon["value"], subtotal)
            coupon_applied = coupon["code"]
    total = max(0, round(subtotal + shipping - discount, 2))
    return {
        "subtotal": round(subtotal, 2),
        "shipping": shipping,
        "discount": discount,
        "total": total,
        "coupon": coupon_applied,
    }


# ----------------------------------------------------------------------------
# Auth routes
# ----------------------------------------------------------------------------
def set_auth_cookie(response: Response, token: str):
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=True, samesite="none", max_age=604800, path="/")


@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": new_id(), "name": body.name, "email": email,
        "password_hash": hash_password(body.password), "role": "customer",
        "mobile": None, "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email, "customer")
    set_auth_cookie(response, token)
    out = {k: v for k, v in strip_id(user).items() if k != "password_hash"}
    return {"user": out, "token": token}


@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user["role"])
    set_auth_cookie(response, token)
    out = {k: v for k, v in strip_id(user).items() if k != "password_hash"}
    return {"user": out, "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotIn):
    user = await db.users.find_one({"email": body.email.lower()})
    # Always respond success (no user enumeration)
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "id": new_id(), "token": token, "user_id": user["id"],
            "expires_at": (now_utc() + timedelta(hours=1)).isoformat(),
            "used": False, "created_at": now_iso(),
        })
        reset_link = f"{os.environ.get('FRONTEND_URL', '')}/reset-password?token={token}"
        logger.info(f"[PASSWORD RESET] {body.email}: {reset_link}")
        return {"ok": True, "message": "Reset link sent", "debug_token": token}
    return {"ok": True, "message": "If the email exists, a reset link was sent"}


@api.post("/auth/reset-password")
async def reset_password(body: ResetIn):
    rec = await db.password_reset_tokens.find_one({"token": body.token, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one({"id": rec["user_id"]},
                              {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"token": body.token}, {"$set": {"used": True}})
    return {"ok": True, "message": "Password updated"}


@api.post("/auth/otp/request")
async def otp_request(body: OtpRequestIn):
    # MOCK OTP: always uses fixed test code from env
    await db.otp_codes.update_one(
        {"mobile": body.mobile},
        {"$set": {"mobile": body.mobile, "code": OTP_TEST_CODE,
                  "expires_at": (now_utc() + timedelta(minutes=10)).isoformat()}},
        upsert=True,
    )
    logger.info(f"[OTP MOCK] {body.mobile} -> {OTP_TEST_CODE}")
    return {"ok": True, "message": "OTP sent", "test_code": OTP_TEST_CODE, "mock": True}


@api.post("/auth/otp/verify")
async def otp_verify(body: OtpVerifyIn, response: Response):
    rec = await db.otp_codes.find_one({"mobile": body.mobile})
    if not rec or rec["code"] != body.code:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    if datetime.fromisoformat(rec["expires_at"]) < now_utc():
        raise HTTPException(status_code=401, detail="OTP expired")
    user = await db.users.find_one({"mobile": body.mobile})
    if not user:
        user = {
            "id": new_id(), "name": body.name or f"User {body.mobile[-4:]}",
            "email": f"{body.mobile}@mobile.virginharvest.in", "mobile": body.mobile,
            "password_hash": "", "role": "customer", "created_at": now_iso(),
        }
        await db.users.insert_one(user)
    await db.otp_codes.delete_one({"mobile": body.mobile})
    token = create_access_token(user["id"], user["email"], user["role"])
    set_auth_cookie(response, token)
    out = {k: v for k, v in strip_id(user).items() if k != "password_hash"}
    return {"user": out, "token": token}


# ----------------------------------------------------------------------------
# Public content routes
# ----------------------------------------------------------------------------
@api.get("/products")
async def list_products(featured: Optional[bool] = None, category: Optional[str] = None):
    q = {"active": True}
    if featured is not None:
        q["featured"] = featured
    if category:
        q["category"] = category
    docs = await db.products.find(q, {"_id": 0}).to_list(200)
    return docs


@api.get("/products/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug, "active": True}, {"_id": 0})
    if not doc:
        doc = await db.products.find_one({"id": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


@api.get("/blogs")
async def list_blogs():
    return await db.blogs.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api.get("/blogs/{slug}")
async def get_blog(slug: str):
    doc = await db.blogs.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog not found")
    return doc


@api.get("/testimonials")
async def list_testimonials():
    return await db.testimonials.find({"active": True}, {"_id": 0}).to_list(100)


@api.get("/faqs")
async def list_faqs():
    return await db.faqs.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)


@api.get("/gallery")
async def list_gallery():
    return await db.gallery.find({"active": True}, {"_id": 0}).to_list(100)


@api.get("/homepage")
async def get_homepage():
    doc = await db.homepage.find_one({"id": "main"}, {"_id": 0})
    return doc or {}


@api.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "global"}, {"_id": 0})
    return doc or {}


@api.get("/seo/{page}")
async def get_seo(page: str):
    doc = await db.seo.find_one({"page": page}, {"_id": 0})
    return doc or {}


@api.post("/newsletter")
async def subscribe_newsletter(body: NewsletterIn):
    existing = await db.newsletter.find_one({"email": body.email.lower()})
    if not existing:
        await db.newsletter.insert_one({
            "id": new_id(), "email": body.email.lower(), "name": body.name,
            "created_at": now_iso(), "synced_mailchimp": bool(os.environ.get("MAILCHIMP_API_KEY")),
        })
    # MOCK Mailchimp (no key configured) - logs intent
    logger.info(f"[MAILCHIMP MOCK] subscribe {body.email}")
    return {"ok": True, "message": "Subscribed"}


@api.post("/coupons/validate")
async def validate_coupon(payload: dict):
    code = (payload.get("code") or "").upper()
    items = [OrderItem(**i) for i in payload.get("items", [])]
    coupon = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    amounts = await compute_amounts(items, code)
    if amounts["coupon"] != code:
        raise HTTPException(status_code=400, detail=f"Minimum order ₹{coupon.get('min_order',0)} required")
    return {"coupon": coupon, "amounts": amounts}


# ----------------------------------------------------------------------------
# Checkout (order created ONLY on payment confirmation)
# ----------------------------------------------------------------------------
@api.post("/checkout/create-order")
async def checkout_create_order(body: CheckoutCreateIn, user: Optional[dict] = Depends(get_optional_user)):
    amounts = await compute_amounts(body.items, body.coupon_code)
    razorpay_key = os.environ.get("RAZORPAY_KEY_ID", "")
    mock = not bool(razorpay_key)
    razorpay_order_id = f"order_mock_{secrets.token_hex(8)}" if mock else None
    if not mock:
        # Live Razorpay order creation
        import razorpay
        rzp = razorpay.Client(auth=(razorpay_key, os.environ["RAZORPAY_KEY_SECRET"]))
        rzp_order = rzp.order.create({"amount": int(amounts["total"] * 100), "currency": "INR", "payment_capture": 1})
        razorpay_order_id = rzp_order["id"]
    return {
        "razorpay_order_id": razorpay_order_id,
        "amount": amounts["total"],
        "amount_paise": int(amounts["total"] * 100),
        "currency": "INR",
        "key_id": razorpay_key,
        "amounts": amounts,
        "mock": mock,
    }


def verify_rzp_signature(order_id: str, payment_id: str, signature: str) -> bool:
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not secret:
        return True  # mock mode
    generated = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated, signature or "")


@api.post("/checkout/verify")
async def checkout_verify(body: CheckoutVerifyIn, user: Optional[dict] = Depends(get_optional_user)):
    # Backend validation: payment confirmation mandatory
    if not body.razorpay_payment_id or not body.razorpay_order_id:
        raise HTTPException(status_code=400, detail="Payment confirmation required")
    if not verify_rzp_signature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    amounts = await compute_amounts(body.items, body.coupon_code)
    order_no = "VH" + datetime.now().strftime("%y%m%d") + secrets.token_hex(3).upper()
    order = {
        "id": new_id(),
        "order_no": order_no,
        "user_id": user["id"] if user else None,
        "items": [i.model_dump() for i in body.items],
        "shipping": body.shipping.model_dump(),
        "amounts": amounts,
        "payment": {
            "razorpay_order_id": body.razorpay_order_id,
            "razorpay_payment_id": body.razorpay_payment_id,
            "status": "paid",
            "method": "razorpay",
        },
        "status": "confirmed",
        "timeline": [{"status": "confirmed", "at": now_iso(), "note": "Payment received"}],
        "shiprocket": None,
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)

    # Decrement inventory
    for item in body.items:
        await db.products.update_one({"id": item.product_id},
                                     {"$inc": {"stock": -item.quantity}})

    # MOCK Shiprocket shipment
    shiprocket_configured = bool(os.environ.get("SHIPROCKET_EMAIL"))
    awb = f"AWB{secrets.token_hex(5).upper()}"
    await db.orders.update_one({"id": order["id"]}, {"$set": {
        "shiprocket": {"awb": awb, "courier": "Mock Express", "configured": shiprocket_configured,
                       "tracking_url": f"https://shiprocket.co/tracking/{awb}"}}})
    logger.info(f"[SHIPROCKET MOCK] shipment {awb} for {order_no}")
    logger.info(f"[MAILCHIMP MOCK] order confirmation -> {body.shipping.email or body.shipping.mobile}")

    return {"ok": True, "order_no": order_no, "order_id": order["id"]}


@api.get("/orders/my")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user["role"] == "customer" and order.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return order


# ----------------------------------------------------------------------------
# Media upload (DB-backed)
# ----------------------------------------------------------------------------
@api.post("/admin/upload")
async def upload_media(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    data = await file.read()
    if len(data) > 6 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 6MB)")
    mid = new_id()
    await db.media.insert_one({
        "id": mid, "content_type": file.content_type or "image/png",
        "data": base64.b64encode(data).decode(), "created_at": now_iso(),
    })
    return {"url": f"/api/media/{mid}", "id": mid}


@api.get("/media/{media_id}")
async def get_media(media_id: str):
    doc = await db.media.find_one({"id": media_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return FastResponse(content=base64.b64decode(doc["data"]),
                        media_type=doc.get("content_type", "image/png"))


# ----------------------------------------------------------------------------
# Admin CRUD helpers
# ----------------------------------------------------------------------------
async def admin_stats():
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.find({"payment.status": "paid"}, {"amounts.total": 1, "_id": 0}).to_list(10000)
    revenue = round(sum(o.get("amounts", {}).get("total", 0) for o in paid_orders), 2)
    return {
        "products": await db.products.count_documents({}),
        "orders": total_orders,
        "users": await db.users.count_documents({}),
        "revenue": revenue,
        "blogs": await db.blogs.count_documents({}),
        "subscribers": await db.newsletter.count_documents({}),
        "low_stock": await db.products.count_documents({"stock": {"$lt": 10}}),
    }


@api.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_staff)):
    return await admin_stats()


# Products (admin only)
@api.get("/admin/products")
async def admin_list_products(user: dict = Depends(require_admin)):
    return await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/admin/products")
async def admin_create_product(body: ProductIn, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["id"] = new_id()
    doc["slug"] = doc.get("slug") or slugify(doc["name"])
    doc["created_at"] = now_iso()
    await db.products.insert_one(doc)
    return strip_id(doc)


@api.put("/admin/products/{pid}")
async def admin_update_product(pid: str, body: ProductIn, user: dict = Depends(require_admin)):
    doc = body.model_dump()
    doc["slug"] = doc.get("slug") or slugify(doc["name"])
    res = await db.products.update_one({"id": pid}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": pid}, {"_id": 0})


@api.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, user: dict = Depends(require_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# Generic content factory for blogs/testimonials/faqs/gallery/coupons
def crud_routes(name: str, collection: str, model, roles=("admin",), sort_field="created_at", sort_dir=-1):
    guard = require_roles(*roles)

    @api.get(f"/admin/{name}", name=f"admin_list_{name}")
    async def _list(user: dict = Depends(guard)):
        return await db[collection].find({}, {"_id": 0}).sort(sort_field, sort_dir).to_list(500)

    @api.post(f"/admin/{name}", name=f"admin_create_{name}")
    async def _create(body: model, user: dict = Depends(guard)):
        doc = body.model_dump()
        doc["id"] = new_id()
        doc["created_at"] = now_iso()
        if "slug" in doc and not doc.get("slug") and doc.get("title"):
            doc["slug"] = slugify(doc["title"])
        if "code" in doc:
            doc["code"] = doc["code"].upper()
        await db[collection].insert_one(doc)
        return strip_id(doc)

    @api.put(f"/admin/{name}/{{item_id}}", name=f"admin_update_{name}")
    async def _update(item_id: str, body: model, user: dict = Depends(guard)):
        doc = body.model_dump()
        if "slug" in doc and not doc.get("slug") and doc.get("title"):
            doc["slug"] = slugify(doc["title"])
        if "code" in doc:
            doc["code"] = doc["code"].upper()
        res = await db[collection].update_one({"id": item_id}, {"$set": doc})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        return await db[collection].find_one({"id": item_id}, {"_id": 0})

    @api.delete(f"/admin/{name}/{{item_id}}", name=f"admin_delete_{name}")
    async def _delete(item_id: str, user: dict = Depends(guard)):
        await db[collection].delete_one({"id": item_id})
        return {"ok": True}


crud_routes("blogs", "blogs", BlogIn)
crud_routes("testimonials", "testimonials", TestimonialIn)
crud_routes("faqs", "faqs", FaqIn)
crud_routes("gallery", "gallery", GalleryIn)
crud_routes("coupons", "coupons", CouponIn)


# Orders (staff: admin + sub_admin)
@api.get("/admin/orders")
async def admin_list_orders(user: dict = Depends(require_staff)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.put("/admin/orders/{order_id}/status")
async def admin_update_order(order_id: str, body: OrderStatusIn, user: dict = Depends(require_staff)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    entry = {"status": body.status, "at": now_iso(), "note": body.note or ""}
    await db.orders.update_one({"id": order_id},
                               {"$set": {"status": body.status}, "$push": {"timeline": entry}})
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


# Users (staff)
@api.get("/admin/users")
async def admin_list_users(user: dict = Depends(require_staff)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users


@api.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: UserUpdateIn, current: dict = Depends(require_admin)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        await db.users.update_one({"id": user_id}, {"$set": update})
    return await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})


@api.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current: dict = Depends(require_admin)):
    await db.users.delete_one({"id": user_id})
    return {"ok": True}


# Inventory (admin)
@api.get("/admin/inventory")
async def admin_inventory(user: dict = Depends(require_admin)):
    products = await db.products.find({}, {"_id": 0, "name": 1, "id": 1, "stock": 1, "variants": 1, "price": 1}).to_list(500)
    return products


@api.put("/admin/inventory/{pid}")
async def admin_update_inventory(pid: str, payload: dict, user: dict = Depends(require_admin)):
    stock = int(payload.get("stock", 0))
    await db.products.update_one({"id": pid}, {"$set": {"stock": stock}})
    return await db.products.find_one({"id": pid}, {"_id": 0})


# Newsletter subscribers (staff)
@api.get("/admin/subscribers")
async def admin_subscribers(user: dict = Depends(require_staff)):
    return await db.newsletter.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


# Homepage content (admin)
@api.put("/admin/homepage")
async def admin_update_homepage(payload: dict, user: dict = Depends(require_admin)):
    payload["id"] = "main"
    payload["updated_at"] = now_iso()
    await db.homepage.update_one({"id": "main"}, {"$set": payload}, upsert=True)
    return await db.homepage.find_one({"id": "main"}, {"_id": 0})


# Settings (admin)
@api.put("/admin/settings")
async def admin_update_settings(payload: dict, user: dict = Depends(require_admin)):
    payload["id"] = "global"
    payload["updated_at"] = now_iso()
    await db.settings.update_one({"id": "global"}, {"$set": payload}, upsert=True)
    return await db.settings.find_one({"id": "global"}, {"_id": 0})


# SEO (admin)
@api.get("/admin/seo")
async def admin_list_seo(user: dict = Depends(require_admin)):
    return await db.seo.find({}, {"_id": 0}).to_list(100)


@api.put("/admin/seo/{page}")
async def admin_update_seo(page: str, payload: dict, user: dict = Depends(require_admin)):
    payload["page"] = page
    payload["updated_at"] = now_iso()
    await db.seo.update_one({"page": page}, {"$set": payload}, upsert=True)
    return await db.seo.find_one({"page": page}, {"_id": 0})


@api.get("/")
async def root():
    return {"message": "Virgin Harvest API", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------------
# Seeding
# ----------------------------------------------------------------------------
async def seed():
    # indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.products.create_index("slug")
        await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    except Exception as e:
        logger.warning(f"index warning: {e}")

    # admin + sub admin
    for email_key, pw_key, role, name in [
        ("ADMIN_EMAIL", "ADMIN_PASSWORD", "admin", "Virgin Harvest Admin"),
        ("SUBADMIN_EMAIL", "SUBADMIN_PASSWORD", "sub_admin", "Sales Team"),
    ]:
        email = os.environ.get(email_key, "").lower()
        pw = os.environ.get(pw_key, "")
        if not email:
            continue
        existing = await db.users.find_one({"email": email})
        if not existing:
            await db.users.insert_one({
                "id": new_id(), "name": name, "email": email,
                "password_hash": hash_password(pw), "role": role,
                "mobile": None, "created_at": now_iso(),
            })
        else:
            update = {"role": role}
            if not verify_password(pw, existing.get("password_hash", "")):
                update["password_hash"] = hash_password(pw)
            await db.users.update_one({"email": email}, {"$set": update})

    # write test credentials
    creds = Path("/app/memory/test_credentials.md")
    creds.parent.mkdir(parents=True, exist_ok=True)
    creds.write_text(
        "# Virgin Harvest Test Credentials\n\n"
        f"## Admin (Full Access)\n- Email: {os.environ.get('ADMIN_EMAIL')}\n- Password: {os.environ.get('ADMIN_PASSWORD')}\n- Role: admin\n\n"
        f"## Sub Admin (Sales Team Access)\n- Email: {os.environ.get('SUBADMIN_EMAIL')}\n- Password: {os.environ.get('SUBADMIN_PASSWORD')}\n- Role: sub_admin\n\n"
        f"## Mobile OTP (MOCK)\n- Any 10-digit mobile, OTP code: {OTP_TEST_CODE}\n\n"
        "## Auth endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- GET /api/auth/me\n- POST /api/auth/logout\n- POST /api/auth/forgot-password\n- POST /api/auth/reset-password\n- POST /api/auth/otp/request\n- POST /api/auth/otp/verify\n"
    )

    # settings
    if not await db.settings.find_one({"id": "global"}):
        await db.settings.insert_one({
            "id": "global", "brand": "Virgin Harvest Pvt. Ltd.",
            "tagline": "Tradition in Every Drop",
            "phone": "+919876543210", "whatsapp": "919876543210",
            "instagram": "https://instagram.com/virginharvest",
            "email": "care@virginharvest.in",
            "free_shipping_above": 999, "shipping_flat": 60,
            "address": "Jaipur, Rajasthan, India",
        })

    # homepage
    if not await db.homepage.find_one({"id": "main"}):
        await db.homepage.insert_one({
            "id": "main",
            "hero_overline": "Cold Pressed · Single Origin",
            "hero_title": "Tradition in Every Drop",
            "hero_subtitle": "Pure cold-pressed mustard oil crafted from premium Rajasthan Yellow Mustard Seeds.",
            "hero_cta": "Discover the Harvest",
            "story_title": "From the fields of Rajasthan",
            "story_body": "Hand-selected yellow mustard seeds, slow wood-pressed to preserve every nutrient and the bold aroma of tradition.",
            "updated_at": now_iso(),
        })

    # products
    if await db.products.count_documents({}) == 0:
        base_img = "/brand/hero-bottle.png"
        pack_img = "/brand/product-pack.png"
        products = [
            {
                "name": "Virgin Harvest Cold Pressed Mustard Oil — 1L",
                "tagline": "The Original. Wood-pressed, single origin.",
                "description": "Premium kachi ghani cold pressed mustard oil from Rajasthan yellow mustard seeds.",
                "long_description": "Slow wood-pressed in small batches to retain pungency, aroma and natural antioxidants. Zero refining, zero chemicals.",
                "price": 499, "mrp": 650, "stock": 120, "featured": True,
                "images": [base_img, pack_img], "category": "Cold Pressed Oil",
                "benefits": ["100% Cold Pressed", "Single Origin Rajasthan", "No Chemicals", "Rich in Omega-3"],
                "specs": {"Origin": "Rajasthan", "Process": "Wood Pressed (Kachi Ghani)", "Shelf Life": "9 months"},
                "variants": [
                    {"label": "500 ml", "size": "500ml", "price": 279, "mrp": 350, "stock": 80},
                    {"label": "1 Litre", "size": "1L", "price": 499, "mrp": 650, "stock": 120},
                    {"label": "5 Litre", "size": "5L", "price": 2299, "mrp": 2800, "stock": 40},
                ],
                "rating": 4.9,
            },
            {
                "name": "Virgin Harvest Mustard Oil — Family Pack 5L",
                "tagline": "For the family that values purity.",
                "description": "Bulk family pack of cold pressed mustard oil.",
                "long_description": "Our most loved family size. Same wood-pressed purity, value pricing.",
                "price": 2299, "mrp": 2800, "stock": 40, "featured": True,
                "images": [pack_img, base_img], "category": "Cold Pressed Oil",
                "benefits": ["Best Value", "Cold Pressed", "No Preservatives"],
                "specs": {"Origin": "Rajasthan", "Process": "Wood Pressed", "Size": "5 Litre"},
                "variants": [], "rating": 4.8,
            },
            {
                "name": "Virgin Harvest Tasting Trio — 3 x 250ml",
                "tagline": "Discover the difference. A curated trio.",
                "description": "Three 250ml bottles — perfect to gift or to try.",
                "long_description": "A beautifully boxed trio of our signature cold pressed mustard oil.",
                "price": 449, "mrp": 540, "stock": 60, "featured": True,
                "images": [base_img], "category": "Gift Box",
                "benefits": ["Giftable", "Cold Pressed", "Curated"],
                "specs": {"Contents": "3 x 250ml", "Origin": "Rajasthan"},
                "variants": [], "rating": 4.9,
            },
        ]
        for p in products:
            p["id"] = new_id()
            p["slug"] = slugify(p["name"])
            p["active"] = True
            p["created_at"] = now_iso()
        await db.products.insert_many(products)

    # testimonials
    if await db.testimonials.count_documents({}) == 0:
        await db.testimonials.insert_many([
            {"id": new_id(), "name": "Ananya Sharma", "location": "Jaipur", "rating": 5,
             "quote": "The aroma takes me straight back to my grandmother's kitchen. Pure, bold and honest.",
             "active": True, "avatar": "", "created_at": now_iso()},
            {"id": new_id(), "name": "Rohan Mehta", "location": "Mumbai", "rating": 5,
             "quote": "You can taste the difference cold pressing makes. This is the real thing.",
             "active": True, "avatar": "", "created_at": now_iso()},
            {"id": new_id(), "name": "Dr. Kavita Rao", "location": "Bengaluru", "rating": 5,
             "quote": "I recommend Virgin Harvest to my patients — clean, unrefined and nutrient rich.",
             "active": True, "avatar": "", "created_at": now_iso()},
        ])

    # faqs
    if await db.faqs.count_documents({}) == 0:
        await db.faqs.insert_many([
            {"id": new_id(), "question": "What makes cold pressed mustard oil different?", "category": "Product", "order": 1, "active": True,
             "answer": "Cold pressing extracts oil without heat, preserving nutrients, aroma and natural antioxidants.", "created_at": now_iso()},
            {"id": new_id(), "question": "Where are your seeds sourced from?", "category": "Sourcing", "order": 2, "active": True,
             "answer": "Premium yellow mustard seeds, single-origin from the fields of Rajasthan.", "created_at": now_iso()},
            {"id": new_id(), "question": "What is your delivery time?", "category": "Shipping", "order": 3, "active": True,
             "answer": "Orders are dispatched within 24-48 hours and typically delivered in 3-5 business days.", "created_at": now_iso()},
            {"id": new_id(), "question": "Do you offer free shipping?", "category": "Shipping", "order": 4, "active": True,
             "answer": "Yes, free shipping on all orders above ₹999.", "created_at": now_iso()},
        ])

    # gallery
    if await db.gallery.count_documents({}) == 0:
        await db.gallery.insert_many([
            {"id": new_id(), "title": "The Harvest", "image": "/brand/mustard-field.png", "caption": "Rajasthan mustard fields", "active": True, "created_at": now_iso()},
            {"id": new_id(), "title": "The Seeds", "image": "/brand/seeds-macro.png", "caption": "Hand-selected yellow mustard", "active": True, "created_at": now_iso()},
            {"id": new_id(), "title": "The Press", "image": "/brand/cold-press.png", "caption": "Traditional wood pressing", "active": True, "created_at": now_iso()},
            {"id": new_id(), "title": "The Pour", "image": "/brand/oil-pour.png", "caption": "Liquid gold", "active": True, "created_at": now_iso()},
        ])

    # blogs
    if await db.blogs.count_documents({}) == 0:
        await db.blogs.insert_many([
            {"id": new_id(), "title": "Why Cold Pressed Matters", "slug": "why-cold-pressed-matters",
             "excerpt": "The science behind preserving nutrients through cold pressing.",
             "content": "Cold pressing keeps temperatures low, protecting heat-sensitive nutrients and the signature pungency of mustard oil...",
             "cover_image": "/brand/cold-press.png", "author": "Virgin Harvest", "published": True, "tags": ["process"], "created_at": now_iso()},
            {"id": new_id(), "title": "The Fields of Rajasthan", "slug": "the-fields-of-rajasthan",
             "excerpt": "A journey to the source of our golden mustard seeds.",
             "content": "From the golden fields of Rajasthan to your kitchen, every drop tells a story of tradition...",
             "cover_image": "/brand/mustard-field.png", "author": "Virgin Harvest", "published": True, "tags": ["origin"], "created_at": now_iso()},
        ])

    # coupons
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_many([
            {"id": new_id(), "code": "HARVEST10", "type": "percent", "value": 10, "min_order": 499, "active": True, "expires_at": None, "created_at": now_iso()},
            {"id": new_id(), "code": "FIRST50", "type": "flat", "value": 50, "min_order": 299, "active": True, "expires_at": None, "created_at": now_iso()},
        ])

    logger.info("Seed complete.")


@app.on_event("startup")
async def on_startup():
    await seed()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
