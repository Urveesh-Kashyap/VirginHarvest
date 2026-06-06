"""Backend regression tests for Virgin Harvest API.
Covers: auth (admin/sub_admin/customer/forgot/reset/OTP), public content,
checkout validation + verify flow, coupons, admin RBAC, admin CRUD, inventory,
order status, newsletter.
"""
import os
import time
import uuid
import pytest
import requests

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE:
    # Fallback: read frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip()
BASE = BASE.rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@virginharvest.in", "password": "Admin@123"}
SUB = {"email": "sales@virginharvest.in", "password": "Sales@123"}


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


def _login(s, creds):
    r = s.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(s):
    return _login(s, ADMIN)


@pytest.fixture(scope="session")
def sub_token(s):
    return _login(s, SUB)


@pytest.fixture(scope="session")
def customer(s):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Test@1234"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": "Test@1234", "token": data["token"], "user": data["user"]}


def H(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- AUTH ----------
class TestAuth:
    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login", json=ADMIN)
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert d["token"]

    def test_subadmin_login(self, s):
        r = s.post(f"{API}/auth/login", json=SUB)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "sub_admin"

    def test_invalid_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "x@y.com", "password": "wrong"})
        assert r.status_code == 401

    def test_register_and_me(self, s, customer):
        r = s.get(f"{API}/auth/me", headers=H(customer["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["email"] == customer["email"]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_forgot_and_reset(self, s, customer):
        r = s.post(f"{API}/auth/forgot-password", json={"email": customer["email"]})
        assert r.status_code == 200
        token = r.json().get("debug_token")
        assert token
        new_pw = "NewPass@123"
        r2 = s.post(f"{API}/auth/reset-password", json={"token": token, "password": new_pw})
        assert r2.status_code == 200
        # login with new password
        r3 = s.post(f"{API}/auth/login", json={"email": customer["email"], "password": new_pw})
        assert r3.status_code == 200
        customer["password"] = new_pw
        customer["token"] = r3.json()["token"]

    def test_otp_flow(self, s):
        mobile = "98" + str(int(time.time()))[-8:]
        r = s.post(f"{API}/auth/otp/request", json={"mobile": mobile})
        assert r.status_code == 200
        assert r.json().get("test_code") == "123456"
        r2 = s.post(f"{API}/auth/otp/verify", json={"mobile": mobile, "code": "123456", "name": "OTP User"})
        assert r2.status_code == 200
        assert r2.json()["token"]

    def test_otp_invalid(self, s):
        mobile = "97" + str(int(time.time()))[-8:]
        s.post(f"{API}/auth/otp/request", json={"mobile": mobile})
        r = s.post(f"{API}/auth/otp/verify", json={"mobile": mobile, "code": "000000"})
        assert r.status_code == 401


# ---------- PUBLIC CONTENT ----------
class TestPublic:
    def test_products(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 3

    def test_product_by_slug(self, s):
        prods = s.get(f"{API}/products").json()
        slug = prods[0]["slug"]
        r = s.get(f"{API}/products/{slug}")
        assert r.status_code == 200 and r.json()["slug"] == slug

    def test_product_pressed_gold_1(self, s):
        # Should 404 (not a real slug) — verifies error path
        r = s.get(f"{API}/products/pressed-gold-1")
        assert r.status_code == 404

    def test_blogs(self, s):
        r = s.get(f"{API}/blogs")
        assert r.status_code == 200 and len(r.json()) >= 2

    def test_testimonials(self, s):
        r = s.get(f"{API}/testimonials")
        assert r.status_code == 200 and len(r.json()) >= 3

    def test_faqs(self, s):
        r = s.get(f"{API}/faqs")
        assert r.status_code == 200 and len(r.json()) >= 3

    def test_gallery(self, s):
        r = s.get(f"{API}/gallery")
        assert r.status_code == 200 and len(r.json()) >= 4

    def test_homepage(self, s):
        r = s.get(f"{API}/homepage")
        assert r.status_code == 200 and r.json().get("hero_title")

    def test_settings(self, s):
        r = s.get(f"{API}/settings")
        assert r.status_code == 200 and r.json().get("brand")


# ---------- COUPONS ----------
class TestCoupons:
    def _items(self, qty=1, price=499):
        return [{"product_id": "x", "name": "Test", "price": price, "quantity": qty}]

    def test_harvest10(self, s):
        r = s.post(f"{API}/coupons/validate", json={"code": "HARVEST10", "items": self._items()})
        assert r.status_code == 200
        d = r.json()
        assert d["amounts"]["discount"] > 0
        assert d["amounts"]["coupon"] == "HARVEST10"

    def test_first50(self, s):
        r = s.post(f"{API}/coupons/validate", json={"code": "FIRST50", "items": self._items(price=299)})
        assert r.status_code == 200
        assert r.json()["amounts"]["discount"] == 50

    def test_invalid_coupon(self, s):
        r = s.post(f"{API}/coupons/validate", json={"code": "NOPE", "items": self._items()})
        assert r.status_code == 404


# ---------- CHECKOUT ----------
class TestCheckout:
    def _items(self, pid, price=499):
        return [{"product_id": pid, "name": "P", "price": price, "quantity": 1}]

    def _shipping(self, **kw):
        base = {
            "full_name": "Test Buyer", "mobile": "9876543210", "address": "123 St",
            "city": "Jaipur", "state": "Rajasthan", "pincode": "302001", "email": "buy@test.in",
        }
        base.update(kw)
        return base

    def test_invalid_pincode(self, s):
        prods = s.get(f"{API}/products").json()
        pid = prods[0]["id"]
        r = s.post(f"{API}/checkout/create-order", json={
            "items": self._items(pid), "shipping": self._shipping(pincode="12"),
        })
        assert r.status_code == 422

    def test_invalid_mobile(self, s):
        prods = s.get(f"{API}/products").json()
        pid = prods[0]["id"]
        r = s.post(f"{API}/checkout/create-order", json={
            "items": self._items(pid), "shipping": self._shipping(mobile="123"),
        })
        assert r.status_code == 422

    def test_create_and_verify(self, s, customer):
        prods = s.get(f"{API}/products").json()
        p = prods[0]
        items = self._items(p["id"], price=p["price"])
        payload = {"items": items, "shipping": self._shipping(), "coupon_code": "HARVEST10"}
        r = s.post(f"{API}/checkout/create-order", json=payload, headers=H(customer["token"]))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["razorpay_order_id"].startswith("order_mock_")
        assert d["mock"] is True

        # Verify without payment ids should 400
        rbad = s.post(f"{API}/checkout/verify", json={**payload, "razorpay_order_id": "", "razorpay_payment_id": ""})
        assert rbad.status_code in (400, 422)

        # Verify with mock payment ids
        vpayload = {**payload, "razorpay_order_id": d["razorpay_order_id"], "razorpay_payment_id": f"pay_mock_{uuid.uuid4().hex[:8]}"}
        rv = s.post(f"{API}/checkout/verify", json=vpayload, headers=H(customer["token"]))
        assert rv.status_code == 200, rv.text
        order_no = rv.json()["order_no"]
        assert order_no.startswith("VH")

        # Order shows up in my orders
        rm = s.get(f"{API}/orders/my", headers=H(customer["token"]))
        assert rm.status_code == 200
        assert any(o["order_no"] == order_no for o in rm.json())

        # Persist for later tests
        pytest.shared_order_id = rv.json()["order_id"]
        pytest.shared_product_id = p["id"]


# ---------- RBAC ----------
class TestRBAC:
    def test_admin_only_blocked_for_sub(self, s, sub_token):
        r = s.post(f"{API}/admin/products", json={"name": "X", "price": 1}, headers=H(sub_token))
        assert r.status_code == 403
        r2 = s.put(f"{API}/admin/homepage", json={"hero_title": "no"}, headers=H(sub_token))
        assert r2.status_code == 403
        r3 = s.post(f"{API}/admin/coupons", json={"code": "X", "type": "percent", "value": 5}, headers=H(sub_token))
        assert r3.status_code == 403
        r4 = s.post(f"{API}/admin/blogs", json={"title": "T", "content": "c"}, headers=H(sub_token))
        assert r4.status_code == 403

    def test_staff_endpoints_allow_both(self, s, admin_token, sub_token):
        for tok in [admin_token, sub_token]:
            assert s.get(f"{API}/admin/orders", headers=H(tok)).status_code == 200
            assert s.get(f"{API}/admin/users", headers=H(tok)).status_code == 200
            assert s.get(f"{API}/admin/stats", headers=H(tok)).status_code == 200

    def test_unauth_401(self):
        assert requests.get(f"{API}/admin/orders").status_code == 401
        assert requests.get(f"{API}/admin/products").status_code == 401
        assert requests.get(f"{API}/admin/stats").status_code == 401


# ---------- ADMIN CRUD ----------
class TestAdminProductCRUD:
    def test_product_lifecycle(self, s, admin_token):
        payload = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}", "price": 199, "stock": 50,
            "description": "test", "category": "Cold Pressed Oil", "featured": False, "active": True,
        }
        r = s.post(f"{API}/admin/products", json=payload, headers=H(admin_token))
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["slug"]

        # update
        upd = {**payload, "name": payload["name"] + "_UPD", "price": 249}
        r2 = s.put(f"{API}/admin/products/{pid}", json=upd, headers=H(admin_token))
        assert r2.status_code == 200
        assert r2.json()["price"] == 249

        # inventory update
        r3 = s.put(f"{API}/admin/inventory/{pid}", json={"stock": 7}, headers=H(admin_token))
        assert r3.status_code == 200
        assert r3.json()["stock"] == 7

        # delete
        r4 = s.delete(f"{API}/admin/products/{pid}", headers=H(admin_token))
        assert r4.status_code == 200


class TestAdminOrderStatus:
    def test_update_status(self, s, admin_token):
        oid = getattr(pytest, "shared_order_id", None)
        if not oid:
            pytest.skip("No order to update")
        r = s.put(f"{API}/admin/orders/{oid}/status",
                  json={"status": "shipped", "note": "dispatched"}, headers=H(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "shipped"
        assert any(t["status"] == "shipped" for t in d.get("timeline", []))


class TestAdminGenericCRUD:
    @pytest.mark.parametrize("name,payload", [
        ("blogs", {"title": "TEST_Blog", "content": "x"}),
        ("testimonials", {"name": "TEST_T", "quote": "good", "rating": 5}),
        ("faqs", {"question": "TEST_q?", "answer": "yes"}),
        ("gallery", {"title": "TEST_G", "image": "/x.png"}),
        ("coupons", {"code": f"TEST{uuid.uuid4().hex[:4].upper()}", "type": "percent", "value": 5}),
    ])
    def test_crud(self, s, admin_token, name, payload):
        r = s.post(f"{API}/admin/{name}", json=payload, headers=H(admin_token))
        assert r.status_code == 200, r.text
        item = r.json()
        iid = item["id"]
        r2 = s.put(f"{API}/admin/{name}/{iid}", json=payload, headers=H(admin_token))
        assert r2.status_code == 200
        r3 = s.delete(f"{API}/admin/{name}/{iid}", headers=H(admin_token))
        assert r3.status_code == 200


class TestAdminHomepageSettings:
    def test_homepage_save(self, s, admin_token):
        r = s.put(f"{API}/admin/homepage",
                  json={"hero_title": "Tradition in Every Drop", "hero_overline": "X"}, headers=H(admin_token))
        assert r.status_code == 200
        assert r.json()["hero_title"] == "Tradition in Every Drop"

    def test_settings_save(self, s, admin_token):
        r = s.put(f"{API}/admin/settings",
                  json={"brand": "Virgin Harvest Pvt. Ltd.", "free_shipping_above": 999, "shipping_flat": 60}, headers=H(admin_token))
        assert r.status_code == 200


class TestNewsletter:
    def test_subscribe(self, s):
        email = f"news_{uuid.uuid4().hex[:6]}@test.in"
        r = s.post(f"{API}/newsletter", json={"email": email, "name": "X"})
        assert r.status_code == 200
