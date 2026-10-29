import { useEffect, useState } from "react";
import "./App.css";
import {
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";

import productsData from "./data/products.json";

const USERS_KEY = "ns_users";
const USER_KEY = "ns_user";
const CART_KEY = "ns_cart_by_user";
const WISHLIST_KEY = "ns_wishlist_by_user";
const ORDERS_KEY = "ns_orders";

const ADMIN_EMAIL = "admin@nikkishine.com";
const ADMIN_PASSWORD = "NikkiAdmin@123";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=650&q=80";

const products = Array.isArray(productsData)
  ? productsData
  : productsData.products || [];

function readData(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getUser() {
  return readData(USER_KEY, null);
}

function getUserList(key, user) {
  if (!user?.email) return [];
  return readData(key, {})[user.email.toLowerCase()] || [];
}

function saveUserList(key, user, items) {
  if (!user?.email) return;
  const all = readData(key, {});
  all[user.email.toLowerCase()] = items;
  localStorage.setItem(key, JSON.stringify(all));
}

function productName(product) {
  return product.name || product.title || "Beauty Product";
}

function productImage(product) {
  return (
    product.image ||
    product.img ||
    product.imageUrl ||
    FALLBACK_IMAGE
  );
}

// ================= HEADER =================

function Header() {
  const user = getUser();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem(USER_KEY);
    navigate("/login", { replace: true });
  }

  return (
    <>
      <div className="announcement">
        ✨ YOUR DAILY DOSE OF BEAUTY ✨
      </div>

      <header className="header">
        <Link to="/" className="brand">
          <span className="brand-mark">N</span>
          <span>
            NIKKI <b>SHINE</b>
            <small>YOUR BEAUTY, YOUR RULES</small>
          </span>
        </Link>

        <nav className="nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/shop">Beauty Store</NavLink>
          <NavLink to="/shop?category=Makeup">Makeup</NavLink>
          <NavLink to="/shop?category=Skincare">Skincare</NavLink>
          <NavLink to="/shop?category=Haircare">Haircare</NavLink>
          <NavLink to="/shop?category=Fragrance">Fragrance</NavLink>
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => navigate(user ? "/wishlist" : "/login")}
            title="Wishlist"
          >
            ♡
          </button>

          <button
            className="icon-btn"
            onClick={() => navigate(user ? "/cart" : "/login")}
            title="Shopping bag"
          >
            🛍
          </button>

          {user ? (
            <>
              <button
                className="secondary-btn"
                onClick={() =>
                  navigate(
                    user.role === "admin" ? "/admin" : "/account"
                  )
                }
              >
                {user.role === "admin" ? "Admin" : user.name}
              </button>

              <button className="secondary-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="primary-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </header>
    </>
  );
}

// ================= PRODUCT CARD =================

function ProductCard({ product }) {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [bagMessage, setBagMessage] = useState("");
  const [imageError, setImageError] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const wishlist = user
    ? getUserList(WISHLIST_KEY, user)
    : [];

  const isWished = wishlist.some(
    (id) => String(id) === String(product.id)
  );

  const name = productName(product);
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old || product.originalPrice || 0);

  function requireLogin() {
    navigate("/login", {
      state: {
        from: location.pathname + location.search,
        message: "Please login to continue shopping.",
      },
    });
  }

  function toggleWishlist() {
    if (!user || user.role !== "user") {
      requireLogin();
      return;
    }

    const current = getUserList(WISHLIST_KEY, user);

    const updated = isWished
      ? current.filter((id) => String(id) !== String(product.id))
      : [...current, product.id];

    saveUserList(WISHLIST_KEY, user, updated);
    setRefresh((value) => value + 1);
  }

  function addToCart() {
    if (!user || user.role !== "user") {
      requireLogin();
      return;
    }

    const cart = getUserList(CART_KEY, user);

    const existing = cart.find(
      (item) => String(item.id) === String(product.id)
    );

    const updated = existing
      ? cart.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, qty: (item.qty || 1) + 1 }
            : item
        )
      : [...cart, { ...product, qty: 1 }];

    saveUserList(CART_KEY, user, updated);
    setBagMessage("✓ Added to your bag successfully!");
  }

  void refresh;

  return (
    <article className="product-card">
      <div className="product-image">
        <img
          src={imageError ? FALLBACK_IMAGE : productImage(product)}
          alt={name}
          loading="lazy"
          onError={() => setImageError(true)}
        />

        <span className="product-tag">
          {product.tag || "BEAUTY PICK"}
        </span>

        <button
          className={`wishlist-btn ${isWished ? "wished" : ""}`}
          onClick={toggleWishlist}
          aria-label="Toggle wishlist"
        >
          {isWished ? "♥" : "♡"}
        </button>

        <button className="quick-add" onClick={addToCart}>
          + ADD TO BAG
        </button>
      </div>

      <div className="product-info">
        <span className="product-brand">
          {product.brand || "NIKKI SHINE"}
        </span>

        <div className="product-name">{name}</div>

        <div className="product-rating">
          ★ {product.rating || 4.5}
          <span> Customer rating</span>
        </div>

        <div className="product-price">
          <b>₹{price}</b>
          {oldPrice > price && (
            <>
              <del>₹{oldPrice}</del>
              <span>
                {Math.round((1 - price / oldPrice) * 100)}% off
              </span>
            </>
          )}
        </div>

        {bagMessage && (
          <div className="bag-success-message">
            {bagMessage}
            <Link to="/cart">View Bag →</Link>
            <button
              className="remove-btn"
              onClick={() => setBagMessage("")}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ================= HOME =================

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">THE BEAUTY EDIT</span>

          <h1>
            Find Your
            <br />
            <em>Own Glow.</em>
          </h1>

          <p>
            Discover makeup, skincare, haircare and fragrances
            for your everyday beauty routine.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("/shop")}
          >
            SHOP BEAUTY →
          </button>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=85"
            alt="Beauty collection"
          />
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BEAUTY FAVOURITES</span>
            <h2>
              Trending <em>Products</em>
            </h2>
          </div>

          <button
            className="text-btn"
            onClick={() => navigate("/shop")}
          >
            View all →
          </button>
        </div>

        <div className="product-grid">
          {products.slice(0, 12).map((product, index) => (
            <ProductCard
              key={product.id ?? index}
              product={{
                ...product,
                id: product.id ?? index + 1,
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}

// ================= SHOP =================

function Shop() {
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(
    new URLSearchParams(location.search).get("category") || "All Beauty"
  );
  const [sort, setSort] = useState("featured");

  const categories = [
    "All Beauty",
    "Makeup",
    "Skincare",
    "Haircare",
    "Bath & Body",
    "Fragrance",
  ];

  let filtered = products.filter((product) => {
    const text = `${productName(product)} ${
      product.brand || ""
    } ${product.category || ""}`.toLowerCase();

    const matchesCategory =
      category === "All Beauty" ||
      String(product.category || "").toLowerCase() ===
        category.toLowerCase();

    return matchesCategory && text.includes(search.toLowerCase());
  });

  if (sort === "low") {
    filtered = [...filtered].sort(
      (a, b) => Number(a.price || 0) - Number(b.price || 0)
    );
  }

  if (sort === "high") {
    filtered = [...filtered].sort(
      (a, b) => Number(b.price || 0) - Number(a.price || 0)
    );
  }

  if (sort === "rating") {
    filtered = [...filtered].sort(
      (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
    );
  }

  return (
    <section className="section shop-page">
      <div className="shop-title">
        <div>
          <span className="eyebrow">YOUR BEAUTY DESTINATION</span>
          <h1>
            Beauty <em>Store</em>
          </h1>
          <p>Discover products that make you feel your best.</p>
        </div>

        <span>{filtered.length} products</span>
      </div>

      <div className="shop-search">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products or brands..."
        />

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="filter-pills">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id ?? index}
              product={{
                ...product,
                id: product.id ?? index + 1,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products found</h2>
          <p>Try another search or category.</p>
          <button
            className="primary-btn"
            onClick={() => {
              setSearch("");
              setCategory("All Beauty");
            }}
          >
            CLEAR FILTERS
          </button>
        </div>
      )}
    </section>
  );
}

// ================= LOGIN =================

// ================= LOGIN =================

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // Admin login
    if (
      cleanEmail === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          name: "Nikki Shine Admin",
          email: ADMIN_EMAIL,
          role: "admin",
        })
      );

      navigate("/admin", { replace: true });
      return;
    }

    // Registered customer login
    const users = readData(USERS_KEY, []);

    const foundUser = users.find(
      (item) =>
        item.email?.toLowerCase() === cleanEmail &&
        item.password === password &&
        item.role !== "admin"
    );

    if (!foundUser) {
      setError(
        "Account not found or password incorrect. Please signup first."
      );
      return;
    }

    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: "user",
      })
    );

    const destination = location.state?.from || "/";

    navigate(
      destination.startsWith("/admin")
        ? "/"
        : destination,
      { replace: true }
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">WELCOME BACK</span>

        <h1>
          Login to your <em>glow.</em>
        </h1>

        <p>
          Sign in to continue your beauty journey.
        </p>

        {location.state?.message && (
          <div className="info-message">
            {location.state.message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <label>
            Email address

            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
            />
          </label>

          <button
            type="submit"
            className="primary-btn full-btn"
          >
            LOGIN →
          </button>
        </form>

        <p className="auth-switch">
          New customer?{" "}
          <Link to="/signup">
            Create account
          </Link>
        </p>
      </div>
    </section>
  );
}
// ================= SIGNUP =================

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSignup(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === ADMIN_EMAIL) {
      setError("This email is reserved for the administrator.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const users = readData(USERS_KEY, []);

    if (users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
      setError("Email already registered. Please login.");
      return;
    }

    users.push({
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    navigate("/login", {
      replace: true,
      state: { message: "Signup successful! Please login." },
    });
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">JOIN NIKKI SHINE</span>

        <h1>
          Create your <em>account.</em>
        </h1>

        <p>Join us and save your favourite beauty products.</p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSignup}>
          <label>
            Full name
            <input
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
            />
          </label>

          <button type="submit" className="primary-btn full-btn">
            CREATE ACCOUNT →
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

// ================= PROTECTED ROUTE =================

function ProtectedRoute({ adminOnly = false, children }) {
  const user = getUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: window.location.pathname + window.location.search,
          message: "Please login to access this page.",
        }}
      />
    );
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (!adminOnly && user.role !== "user") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// ================= WISHLIST =================

function Wishlist() {
  const user = getUser();
  const ids = getUserList(WISHLIST_KEY, user);

  const savedProducts = products.filter((product) =>
    ids.some((id) => String(id) === String(product.id))
  );

  return (
    <section className="section shop-page">
      <span className="eyebrow">YOUR FAVOURITE FINDS</span>

      <h1>
        My <em>Wishlist</em>
      </h1>

      {savedProducts.length ? (
        <div className="product-grid">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your wishlist is empty ♡</h2>
          <p>Explore products and save your favourites.</p>
          <Link className="primary-btn" to="/shop">
            SHOP BEAUTY
          </Link>
        </div>
      )}
    </section>
  );
}

// ================= CART & CHECKOUT =================

function Cart() {
  const user = getUser();
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => getUserList(CART_KEY, user));
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState("");

  const [details, setDetails] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    payment: "Cash on Delivery",
  });

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || 1),
    0
  );

  const delivery = subtotal === 0 || subtotal >= 999 ? 0 : 49;
  const total = subtotal + delivery;

  function updateCart(updated) {
    setCart(updated);
    saveUserList(CART_KEY, user, updated);
  }

  function changeQuantity(id, amount) {
    updateCart(
      cart
        .map((item) =>
          String(item.id) === String(id)
            ? { ...item, qty: (item.qty || 1) + amount }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function updateDetail(event) {
    const { name, value } = event.target;

    setDetails((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function placeOrder(event) {
    event.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your bag is empty.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(details.phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(details.pincode.trim())) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    if (
      !details.name.trim() ||
      !details.address.trim() ||
      !details.city.trim() ||
      !details.state.trim()
    ) {
      setError("Please fill in all delivery details.");
      return;
    }

    const order = {
      id: `NS-${Date.now()}`,
      customer: details.name.trim(),
      email: user.email,
      phone: details.phone.trim(),
      address: details.address.trim(),
      city: details.city.trim(),
      state: details.state.trim(),
      pincode: details.pincode.trim(),
      payment: details.payment,
      items: cart.map((item) => ({ ...item })),
      subtotal,
      delivery,
      total,
      date: new Date().toISOString(),
      status: "Order Placed",
    };

    const orders = readData(ORDERS_KEY, []);
    orders.push(order);

    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    updateCart([]);
    setCheckoutOpen(false);
    setOrderSuccess(order);
  }

  if (orderSuccess) {
    return (
      <section className="order-success-page">
        <div className="order-success-card">
          <div className="success-icon">✓</div>

          <span className="eyebrow">THANK YOU FOR SHOPPING</span>

          <h1>
            Order <em>Successful!</em>
          </h1>

          <p>
            Your order has been placed successfully.
            Thank you for choosing Nikki Shine!
          </p>

          <div className="success-order-details">
            <div>
              <span>Order ID</span>
              <strong>{orderSuccess.id}</strong>
            </div>

            <div>
              <span>Order Total</span>
              <strong>₹{orderSuccess.total}</strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>{orderSuccess.payment}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{orderSuccess.status}</strong>
            </div>
          </div>

          <div className="success-address">
            <b>Delivery Address</b>
            <p>{orderSuccess.customer}</p>
            <p>{orderSuccess.phone}</p>
            <p>
              {orderSuccess.address}, {orderSuccess.city},{" "}
              {orderSuccess.state} - {orderSuccess.pincode}
            </p>
          </div>

          <div className="success-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("/account")}
            >
              VIEW MY ORDERS
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("/shop")}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section shop-page">
      <span className="eyebrow">YOUR BEAUTY FAVOURITES</span>

      <h1>
        Your Beauty <em>Bag</em>
      </h1>

      {error && <div className="error-message">{error}</div>}

      {!cart.length ? (
        <div className="empty-state">
          <h2>Your bag is waiting for some beauty!</h2>
          <p>Add your favourite products to get started.</p>
          <Link className="primary-btn" to="/shop">
            EXPLORE BEAUTY
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img
                  src={productImage(item)}
                  alt={productName(item)}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                <div className="cart-info">
                  <span className="product-brand">
                    {item.brand || "NIKKI SHINE"}
                  </span>

                  <b>{productName(item)}</b>
                  <p>₹{item.price}</p>

                  <div className="qty">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                    >
                      −
                    </button>

                    <span>{item.qty || 1}</span>

                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() =>
                      updateCart(
                        cart.filter(
                          (product) =>
                            String(product.id) !== String(item.id)
                        )
                      )
                    }
                  >
                    Remove
                  </button>
                </div>

                <strong>
                  ₹{Number(item.price || 0) * Number(item.qty || 1)}
                </strong>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Price Details</h2>

            <p>
              <span>Subtotal</span>
              <b>₹{subtotal}</b>
            </p>

            <p>
              <span>Delivery</span>
              <b>{delivery ? `₹${delivery}` : "FREE"}</b>
            </p>

            <h3>
              Total <span>₹{total}</span>
            </h3>

            <button
              className="primary-btn full-btn"
              onClick={() => {
                setError("");
                setCheckoutOpen(true);
              }}
            >
              PROCEED TO CHECKOUT →
            </button>

            <small>Cash on Delivery · Secure demo checkout</small>
          </aside>
        </div>
      )}

      {checkoutOpen && cart.length > 0 && (
        <div className="checkout-overlay">
          <div className="checkout-card">
            <button
              className="checkout-close"
              onClick={() => setCheckoutOpen(false)}
            >
              ×
            </button>

            <span className="eyebrow">ALMOST YOURS</span>

            <h2>
              Delivery <em>Details</em>
            </h2>

            <p className="checkout-description">
              Enter your details to complete your order.
            </p>

            <form className="checkout-form" onSubmit={placeOrder}>
              <label>
                Full Name
                <input
                  name="name"
                  value={details.name}
                  onChange={updateDetail}
                  required
                  minLength={2}
                  placeholder="Your full name"
                />
              </label>

              <label>
                Mobile Number
                <input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={details.phone}
                  onChange={updateDetail}
                  required
                  placeholder="10-digit mobile number"
                />
              </label>

              <label className="checkout-full">
                Complete Address
                <textarea
                  name="address"
                  value={details.address}
                  onChange={updateDetail}
                  required
                  rows={3}
                  placeholder="House number, street, area"
                />
              </label>

              <label>
                City
                <input
                  name="city"
                  value={details.city}
                  onChange={updateDetail}
                  required
                  placeholder="Your city"
                />
              </label>

              <label>
                State
                <input
                  name="state"
                  value={details.state}
                  onChange={updateDetail}
                  required
                  placeholder="Your state"
                />
              </label>

              <label>
                Pincode
                <input
                  name="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={details.pincode}
                  onChange={updateDetail}
                  required
                  placeholder="6-digit pincode"
                />
              </label>

              <label>
                Payment Method
                <select
                  name="payment"
                  value={details.payment}
                  onChange={updateDetail}
                >
                  <option value="Cash on Delivery">
                    Cash on Delivery
                  </option>
                </select>
              </label>

              <div className="checkout-total checkout-full">
                <span>Payable Amount</span>
                <strong>₹{total}</strong>
              </div>

              {error && (
                <div className="error-message checkout-full">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="primary-btn full-btn checkout-full"
              >
                PLACE ORDER · ₹{total}
              </button>

              <small className="checkout-full">
                Demo checkout. No real payment is collected.
              </small>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// ================= ACCOUNT =================

function Account() {
  const user = getUser();

  const orders = readData(ORDERS_KEY, [])
    .filter(
      (order) =>
        order.email?.toLowerCase() === user?.email?.toLowerCase()
    )
    .reverse();

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <section className="section shop-page account-page">
      <div className="account-welcome">
        <span className="eyebrow">YOUR BEAUTY, YOUR RULES</span>
        <h1>My <em>Account</em></h1>
        <p>Manage your profile and keep track of your beauty orders.</p>
      </div>

      <div className="account-profile-card">
        <div className="account-avatar">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="account-profile-info">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>{user?.name || "Customer"}</h2>
          <p>{user?.email || "Email unavailable"}</p>
          <span className="status-pill">Registered Customer</span>
        </div>
        <div className="account-profile-count">
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
      </div>

      <div className="account-orders-heading">
        <div>
          <span className="eyebrow">YOUR PURCHASES</span>
          <h2>My <em>Orders</em></h2>
        </div>
        <span className="account-order-count">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      {orders.length > 0 ? (
        <div className="account-orders-list">
          {orders.map((order, index) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const hasAddress = Boolean(
              order.address?.trim() &&
              order.city?.trim() &&
              order.state?.trim() &&
              order.pincode?.trim()
            );

            return (
              <article
                className="account-order-card"
                key={order.id || `${order.email}-${index}`}
              >
                <div className="account-order-top">
                  <div>
                    <span className="account-label">ORDER ID</span>
                    <h3>{order.id || "Order ID unavailable"}</h3>
                    <p className="account-order-date">
                      <span>◷</span> Ordered on {formatDate(order.date)}
                    </p>
                  </div>

                  <div className="account-order-total">
                    <span className="account-label">ORDER TOTAL</span>
                    <strong>₹{Number(order.total || 0).toLocaleString("en-IN")}</strong>
                  </div>

                  <span className="account-status">
                    <span className="status-dot"></span>
                    {order.status || "Order Placed"}
                  </span>
                </div>

                <div className="account-order-section">
                  <h4><span>🛍</span> Items in your order</h4>

                  {items.length > 0 ? (
                    <div className="account-items-list">
                      {items.map((item, itemIndex) => (
                        <div
                          className="account-product-row"
                          key={`${item.id || itemIndex}-${itemIndex}`}
                        >
                          <img
                            src={productImage(item)}
                            alt={productName(item)}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                          <div className="account-product-info">
                            <strong>{productName(item)}</strong>
                            <span>{item.brand || "Nikki Shine Beauty"}</span>
                            <small>Quantity: {item.qty || 1}</small>
                          </div>
                          <strong className="account-product-price">
                            ₹{(
                              Number(item.price || 0) * Number(item.qty || 1)
                            ).toLocaleString("en-IN")}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="account-missing">
                      Product details are unavailable for this order.
                    </p>
                  )}
                </div>

                <div className="account-delivery-grid">
                  <div className="account-delivery-box">
                    <h4><span>⌖</span> Delivery Details</h4>
                    {hasAddress ? (
                      <>
                        <strong>{order.customer || user?.name || "Customer"}</strong>
                        <p>{order.phone || "Phone number unavailable"}</p>
                        <p>
                          {order.address}, {order.city}, {order.state} - {order.pincode}
                        </p>
                      </>
                    ) : (
                      <p className="account-missing">
                        Delivery details were not saved for this order.
                      </p>
                    )}
                  </div>

                  <div className="account-payment-box">
                    <h4><span>₹</span> Payment Information</h4>
                    <p>
                      Payment Method
                      <strong>{order.payment || "Not recorded"}</strong>
                    </p>
                    <p>
                      Delivery Fee
                      <strong>
                        {order.delivery == null
                          ? "Not recorded"
                          : Number(order.delivery) === 0
                          ? "FREE"
                          : `₹${order.delivery}`}
                      </strong>
                    </p>
                    <p className="account-payment-total">
                      Total Payable
                      <strong>
                        ₹{Number(order.total || 0).toLocaleString("en-IN")}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="account-order-footer">
                  <span>Thank you for shopping with <strong>Nikki Shine</strong> ♡</span>
                  <span>Order #{orders.length - index}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state account-empty">
          <div className="account-empty-icon">♡</div>
          <h2>Your beauty journey starts here</h2>
          <p>
            You haven't placed any orders yet. Find your favourites and make them yours!
          </p>
          <Link className="primary-btn" to="/shop">EXPLORE BEAUTY →</Link>
        </div>
      )}
    </section>
  );
}

// ================= ADMIN DASHBOARD =================


function AdminDashboard() {
  const [refresh, setRefresh] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const users = readData(USERS_KEY, []);
  const allOrders = readData(ORDERS_KEY, []).slice().reverse();

  const orders = allOrders.filter((order) => {
    const searchText = [
      order.id,
      order.customer,
      order.email,
      order.phone,
      order.address,
      order.city,
      order.pincode,
      ...(order.items || []).map(productName),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(orderSearch.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (order.status || "Order Placed") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const customers = users.filter((customer) =>
    `${customer.name || ""} ${customer.email || ""}`
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  );

  const revenue = allOrders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const pendingCount = allOrders.filter((order) =>
    ["Order Placed", "Processing"].includes(
      order.status || "Order Placed"
    )
  ).length;

  const deliveredCount = allOrders.filter(
    (order) => order.status === "Delivered"
  ).length;

  function updateStatus(orderId, status) {
    const updated = readData(ORDERS_KEY, []).map((order) =>
      order.id === orderId ? { ...order, status } : order
    );

    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    setRefresh((value) => value + 1);
  }

  function exportCSV(filename, rows) {
    if (!rows.length) {
      window.alert("No data available to export.");
      return;
    }

    const columns = [...new Set(rows.flatMap(Object.keys))];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.map(escapeCSV).join(","),
      ...rows.map((row) =>
        columns.map((column) => escapeCSV(row[column])).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const customerExportRows = customers.map(
    ({ password, ...customer }) => ({
      name: customer.name,
      email: customer.email,
      registered: customer.createdAt || "",
    })
  );

  const orderExportRows = orders.map((order) => ({
    orderId: order.id,
    customer: order.customer,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    payment: order.payment,
    subtotal: order.subtotal,
    delivery: order.delivery,
    total: order.total,
    status: order.status || "Order Placed",
    date: order.date,
    products: (order.items || [])
      .map((item) => `${productName(item)} x${item.qty || 1}`)
      .join("; "),
  }));

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  void refresh;

  return (
    <main className="admin-dashboard">
      <section className="admin-welcome">
        <div className="admin-welcome-copy">
          <span className="eyebrow">NIKKI SHINE · CONTROL CENTER</span>

          <h1>
            Admin <em>Dashboard</em>
          </h1>

          <p>
            Manage your beauty store, customers and orders from one place.
          </p>
        </div>

        <div className="admin-welcome-actions">
          <span className="admin-live-label">
            <span className="status-dot"></span>
            STORE OVERVIEW
          </span>

          <button
            className="primary-btn"
            onClick={() => {
              setRefresh((value) => value + 1);
            }}
          >
            ↻ REFRESH VIEW
          </button>
        </div>
      </section>

      <section className="admin-dashboard-stats">
        <article className="admin-dashboard-stat">
          <div className="admin-stat-icon">♙</div>
          <span>Total Customers</span>
          <strong>{users.length}</strong>
          <small>Registered accounts</small>
        </article>

        <article className="admin-dashboard-stat">
          <div className="admin-stat-icon">▤</div>
          <span>Total Orders</span>
          <strong>{allOrders.length}</strong>
          <small>All recorded orders</small>
        </article>

        <article className="admin-dashboard-stat">
          <div className="admin-stat-icon">₹</div>
          <span>Order Value</span>
          <strong>₹{revenue.toLocaleString("en-IN")}</strong>
          <small>Excludes cancelled orders</small>
        </article>

        <article className="admin-dashboard-stat">
          <div className="admin-stat-icon">◷</div>
          <span>Pending Orders</span>
          <strong>{pendingCount}</strong>
          <small>{deliveredCount} delivered</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">CUSTOMER DIRECTORY</span>
            <h2>Registered Customers</h2>
            <p>Search and review customer accounts.</p>
          </div>

          <button
            className="admin-outline-btn"
            onClick={() =>
              exportCSV("nikki-shine-customers.csv", customerExportRows)
            }
          >
            ↓ EXPORT CUSTOMERS
          </button>
        </div>

        <div className="admin-toolbar">
          <div className="admin-search">
            <span>⌕</span>
            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search by customer name or email..."
            />
          </div>

          <span className="admin-result-count">
            {customers.length} customers
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-modern-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email Address</th>
                <th>Registered On</th>
                <th>Account Type</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.email || index}>
                  <td>
                    <div className="admin-customer-cell">
                      <span className="admin-customer-avatar">
                        {(customer.name || "U").charAt(0).toUpperCase()}
                      </span>

                      <strong>{customer.name || "Customer"}</strong>
                    </div>
                  </td>

                  <td>{customer.email || "—"}</td>
                  <td>{formatDate(customer.createdAt)}</td>

                  <td>
                    <span className="admin-role-pill">
                      Customer
                    </span>
                  </td>
                </tr>
              ))}

              {!customers.length && (
                <tr>
                  <td colSpan="4" className="admin-empty-cell">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">ORDER MANAGEMENT</span>
            <h2>Customer Orders</h2>
            <p>Review deliveries and update order status.</p>
          </div>

          <button
            className="admin-outline-btn"
            onClick={() =>
              exportCSV("nikki-shine-orders.csv", orderExportRows)
            }
          >
            ↓ EXPORT ORDERS
          </button>
        </div>

        <div className="admin-toolbar admin-orders-toolbar">
          <div className="admin-search">
            <span>⌕</span>
            <input
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Search order ID, customer, phone, product..."
            />
          </div>

          <select
            className="admin-filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All</option>
            <option>Order Placed</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
        </div>

        <div className="admin-order-count-line">
          Showing <strong>{orders.length}</strong> of{" "}
          <strong>{allOrders.length}</strong> orders
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-modern-table admin-orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Delivery Address</th>
                <th>Products</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Order Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id || index}>
                  <td>
                    <strong className="admin-order-id">
                      {order.id || "—"}
                    </strong>
                    <small className="table-sub">
                      {formatDate(order.date)}
                    </small>
                  </td>

                  <td>
                    <strong>{order.customer || "Customer"}</strong>
                    <small className="table-sub">
                      {order.email || "Email unavailable"}
                    </small>
                    <small className="table-sub">
                      {order.phone || "Phone unavailable"}
                    </small>
                  </td>

                  <td>
                    <div className="admin-address-cell">
                      <span>{order.address || "Address unavailable"}</span>
                      <span>
                        {[order.city, order.state]
                          .filter(Boolean)
                          .join(", ") || "City/state unavailable"}
                      </span>
                      <span>
                        {order.pincode || "Pincode unavailable"}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="admin-products-cell">
                      {(order.items || []).map((item, itemIndex) => (
                        <div
                          className="admin-product-line"
                          key={`${item.id || itemIndex}-${itemIndex}`}
                        >
                          <span>
                            {productName(item)} × {item.qty || 1}
                          </span>
                          <strong>
                            ₹
                            {(
                              Number(item.price || 0) *
                              Number(item.qty || 1)
                            ).toLocaleString("en-IN")}
                          </strong>
                        </div>
                      ))}

                      {!order.items?.length && (
                        <span>Product details unavailable</span>
                      )}
                    </div>
                  </td>

                  <td>{order.payment || "Not recorded"}</td>

                  <td>
                    <strong className="admin-order-total-value">
                      ₹{Number(order.total || 0).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>
                    <select
                      className={`admin-status-select status-${(
                        order.status || "Order Placed"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      value={order.status || "Order Placed"}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value)
                      }
                    >
                      <option>Order Placed</option>
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}

              {!orders.length && (
                <tr>
                  <td colSpan="7" className="admin-empty-cell">
                    No orders found. Try another search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-footer-note">
        <span>♡</span>
        <p>
          <strong>Nikki Shine Admin</strong>
          <br />
          This dashboard reads demo data from browser localStorage.
          Changes are saved in this browser only.
        </p>
      </div>
    </main>
  );
}


// ================= FOOTER =================

function Footer() {
  return (
    <footer className="footer">
      <h3>
        NIKKI <b>SHINE</b>
      </h3>
      <p>Your Beauty, Your Rules.</p>
      <p>© 2026 Nikki Shine</p>
    </footer>
  );
}

// ================= MAIN APP =================

function ScrollContentToTop() {
  const location = useLocation();

  useEffect(() => {
    const contentArea = document.querySelector(".app-scroll-area");
    if (contentArea) {
      contentArea.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname, location.search]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-scroll-area" id="app-scroll-area">
        <ScrollContentToTop />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
