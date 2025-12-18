// src/pages/Dashboard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

type DashboardProps = {
  email: string;
  isPro: boolean;        // comes from App.tsx
  onLogout: () => void;
};

const Dashboard: React.FC<DashboardProps> = ({ email, isPro, onLogout }) => {
  const navigate = useNavigate();

  // Check URL for Stripe return flags: ?success=1 or ?canceled=1
  const query = new URLSearchParams(window.location.search);
  const justUpgraded = query.get("success") === "1";
  const canceled = query.get("canceled") === "1";

  // Stripe checkout for Pro upgrade (only does anything if not Pro)
  const handleUpgradeClick = async () => {
    if (isPro) {
      // Already Pro; nothing to do
      return;
    }

    try {
      const res = await fetch("http://localhost:4242/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error(
          "Failed to create checkout session:",
          res.status,
          res.statusText
        );
        alert("Could not start checkout. Check the server and try again.");
        return;
      }

      const data = await res.json();

      // Our server should send back: { url: session.url }
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned from server:", data);
        alert("Checkout URL missing. Check the server logs.");
      }
    } catch (err) {
      console.error("Error starting checkout:", err);
      alert("Something went wrong starting checkout.");
    }
  };

  // Go to the consultation sheet page in the SPA (no full reload)
  const handleNewConsultation = () => {
    navigate("/consultations/new");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "80px",
        paddingBottom: "40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Banners for Stripe return */}
      {justUpgraded && isPro && (
        <div
          style={{
            background: "#16a34a",
            color: "white",
            padding: "10px 18px",
            borderRadius: 999,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          🎉 Your StyleGenie Pro subscription is active. Welcome to Pro!
        </div>
      )}

      {canceled && (
        <div
          style={{
            background: "#b91c1c",
            color: "white",
            padding: "10px 18px",
            borderRadius: 999,
            marginBottom: 20,
            fontSize: 14,
          }}
        >
          Checkout was canceled. You haven’t been charged.
        </div>
      )}

      {/* Top header row: app name + plan badge */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingInline: 24,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            StyleGenie Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            Logged in as <strong>{email}</strong>
          </p>
        </div>

        <div
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            background: isPro ? "#22c55e33" : "#4b556333",
            border: `1px solid ${isPro ? "#22c55e" : "#6b7280"}`,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.06,
            color: isPro ? "#bbf7d0" : "#e5e7eb",
          }}
        >
          {isPro ? "Pro Plan" : "Free Plan"}
        </div>
      </div>

      {/* Main content wrapper */}
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          display: "grid",
          gridTemplateColumns: "2fr 1.2fr",
          gap: 24,
          paddingInline: 24,
        }}
      >
        {/* Left side: Consultation tools */}
        <div
          style={{
            background: "#020617",
            borderRadius: 16,
            border: "1px solid #1f2937",
            padding: 20,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Daily consultation workflow
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Use consultation sheets to capture the basics every time:
            lifestyle, hair goals, budget, and maintenance. No more scribbled
            notes or forgotten details.
          </p>

          <button
            onClick={handleNewConsultation}
            style={{
              marginTop: 4,
              padding: "12px 20px",
              fontSize: 15,
              borderRadius: 999,
              border: "none",
              background: "#22c55e",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Start a new consultation sheet
          </button>

          <ul
            style={{
              marginTop: 18,
              fontSize: 13,
              color: "#9ca3af",
              paddingLeft: 18,
              lineHeight: 1.6,
            }}
          >
            <li>Pre-appointment questions your client can answer in seconds.</li>
            <li>Quick reference during the cut or color service.</li>
            <li>Helps you remember what worked last time and what didn’t.</li>
          </ul>
        </div>

        {/* Right side: Plan / Pro info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#020617",
              borderRadius: 16,
              border: "1px solid #1f2937",
              padding: 18,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Your plan
            </h3>
            {isPro ? (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: "#a7f3d0",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  You’re on <strong>StyleGenie Pro</strong>. You’ll get access
                  to upcoming advanced tools built specifically for busy
                  barbers and stylists.
                </p>
                <ul
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    paddingLeft: 18,
                    lineHeight: 1.6,
                  }}
                >
                  <li>Save and reuse consultation sheets per client.</li>
                  <li>AI suggestions for styles based on face shape and routine.</li>
                  <li>Pro-only tweaks and priority improvements as we ship them.</li>
                </ul>

                <button
                  style={{
                    marginTop: 12,
                    padding: "10px 16px",
                    fontSize: 13,
                    borderRadius: 999,
                    border: "1px solid #4b5563",
                    background: "transparent",
                    color: "#e5e7eb",
                    cursor: "default",
                  }}
                >
                  ✅ You are already on Pro
                </button>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: "#9ca3af",
                    marginBottom: 10,
                    lineHeight: 1.5,
                  }}
                >
                  You’re on the free version. You can use consultation sheets
                  right away. Upgrade to unlock saved histories and smarter
                  AI tools as they go live.
                </p>

                <ul
                  style={{
                    fontSize: 13,
                    color: "#9ca3af",
                    paddingLeft: 18,
                    lineHeight: 1.6,
                  }}
                >
                  <li>Free: unlimited basic consultation sheets.</li>
                  <li>
                    Pro: save client history, templates, and AI-powered ideas.
                  </li>
                </ul>

                <button
                  onClick={handleUpgradeClick}
                  style={{
                    marginTop: 12,
                    padding: "10px 18px",
                    fontSize: 14,
                    borderRadius: 999,
                    border: "none",
                    background: "#4f46e5",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Upgrade to StyleGenie Pro
                </button>
              </>
            )}
          </div>

          {/* Account section */}
          <div
            style={{
              background: "#020617",
              borderRadius: 16,
              border: "1px solid #1f2937",
              padding: 18,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Account
            </h3>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 10 }}>
              If you’re done for the day or sharing this device, log out to
              keep your client data safe.
            </p>
            <button
              onClick={onLogout}
              style={{
                marginTop: 4,
                padding: "10px 18px",
                fontSize: 14,
                borderRadius: 999,
                border: "none",
                background: "#6b7280",
                color: "white",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
