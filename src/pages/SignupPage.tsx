import { useState } from "react";
import { supabase } from "../supabaseClient";

type SignupPageProps = {
  onSwitchToLogin: () => void;
};

export default function SignupPage({ onSwitchToLogin }: SignupPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Look at the URL: ?success=1 or ?canceled=1
  const query = new URLSearchParams(window.location.search);
  const justUpgraded = query.get("success") === "1";
  const justCanceled = query.get("canceled") === "1";

  // Optional: clean the URL after we’ve read it (no more ?success=1)
  if (justUpgraded || justCanceled) {
    window.history.replaceState({}, "", "/");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setInfo("Check your email to confirm your account, then log in.");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong while signing up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Stripe messages */}
        {justUpgraded && (
          <div className="bg-green-600/20 border border-green-500 text-sm px-4 py-3 rounded">
            ✅ Payment successful! Your StyleGenie Pro subscription is active.
            Now create your account or log in using the same email you used at checkout.
          </div>
        )}

        {justCanceled && (
          <div className="bg-yellow-600/20 border border-yellow-500 text-sm px-4 py-3 rounded">
            ⚠️ Checkout was canceled. You can try again anytime from your dashboard.
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Create your StyleGenie account</h1>
          <p className="text-sm text-gray-300">
            Use your email and a password to sign up.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label className="block">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400">
              {error}
            </div>
          )}

          {info && (
            <div className="text-sm text-teal-300">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 rounded font-semibold"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-teal-400 hover:underline"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
