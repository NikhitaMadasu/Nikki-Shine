
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ADMIN, KEYS, readJSON } from "../utils/storage";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // Admin authentication for this demo
    if (
      cleanEmail === ADMIN.email.toLowerCase() &&
      password === ADMIN.password
    ) {
      localStorage.setItem(
        KEYS.currentUser,
        JSON.stringify({
          name: ADMIN.name,
          email: ADMIN.email,
          role: "admin",
        })
      );

      navigate("/admin", { replace: true });
      return;
    }

    // Check registered user details
    const users = readJSON(KEYS.users, []);

    const foundUser = users.find(
      (user) =>
        user.email.toLowerCase() === cleanEmail &&
        user.password === password &&
        user.role === "user"
    );

    if (!foundUser) {
      setError(
        "Account not found or password is incorrect. Please sign up first."
      );
      return;
    }

    // Store only the logged-in user's public details
    localStorage.setItem(
      KEYS.currentUser,
      JSON.stringify({
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: "user",
      })
    );

    const destination = location.state?.from;

    navigate(
      destination && destination !== "/admin"
        ? destination
        : "/",
      { replace: true }
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="eyebrow">
          WELCOME TO NIKKI SHINE
        </span>

        <h1>
          Login to your <em>glow.</em>
        </h1>

        <p>
          Sign in to access your wishlist, shopping bag
          and personal account.
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
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
          New to Nikki Shine?{" "}
          <Link to="/signup">Create an account</Link>
        </p>

        <div className="admin-hint">
          <b>Admin Demo Login</b>
          <br />
          Email: admin@nikkishine.com
          <br />
          Password: NikkiAdmin@123
        </div>
      </div>
    </section>
  );
}
