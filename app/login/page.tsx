"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import MjwLogo from "@/components/MjwLogo";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = params.get("callbackUrl") ?? "/";
  const justRegistered = params.get("registered") === "1";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Incorrect username or password.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <MjwLogo size={88} />
        </div>
        <h1 className="login-title">MJW Tracker</h1>
        <p className="login-sub">Sign in to your workspace</p>

        {justRegistered && (
          <p style={{ color: "#2d7a4a", background: "#eafaf1", border: "1px solid #b7e4c7", borderRadius: 8, padding: "10px 14px", fontSize: 13, margin: "0 0 12px", textAlign: "center" }}>
            Account created! Sign in below.
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              required
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-footer">
          New here?{" "}
          <a href="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
