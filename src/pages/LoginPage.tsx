// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";

type LoginPageProps = {
  onSwitchToSignup?: () => void;
  onLoginSuccess?: (email: string) => void;
};

function LoginPage({ onSwitchToSignup, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    console.log("Supabase login data:", data);
    setMessage("Logged in successfully. You now have an active session.");

    if (onLoginSuccess && data?.user?.email) {
      onLoginSuccess(data.user.email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Log in to StyleGenie
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          Enter the email and password you used to sign up.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Your password"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          {message && (
            <div className="text-sm text-emerald-400">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-100 text-slate-950 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-400">
          Need an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-slate-100 underline underline-offset-2"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
