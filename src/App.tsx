// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Dashboard from "./pages/Dashboard";
import ConsultationPage from "./pages/ConsultationPage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Load saved state on first render
  useEffect(() => {
    const savedEmail = localStorage.getItem("stylegenie_email");
    const savedPro = localStorage.getItem("stylegenie_pro");

    if (savedEmail) setUserEmail(savedEmail);
    if (savedPro === "true") setIsPro(true);
  }, []);

  // Called by LoginPage when Supabase login succeeds
  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("stylegenie_email", email);
    navigate("/dashboard");
  };

  // Simple logout
  const handleLogout = () => {
    setUserEmail(null);
    setIsPro(false);
    localStorage.removeItem("stylegenie_email");
    localStorage.removeItem("stylegenie_pro");
    navigate("/");
  };

  // If Stripe sends you back with ?success=1, mark Pro in localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "1") {
      setIsPro(true);
      localStorage.setItem("stylegenie_pro", "true");
    }
  }, [location.search]);

  return (
    <Routes>
      {/* Home / Login */}
      <Route
        path="/"
        element={
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => navigate("/signup")}
          />
        }
      />

      {/* Signup */}
      <Route
        path="/signup"
        element={<SignupPage onSwitchToLogin={() => navigate("/")} />}
      />

      {/* Dashboard (requires login) */}
      <Route
        path="/dashboard"
        element={
          userEmail ? (
            <Dashboard email={userEmail} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Consultation page */}
      <Route path="/consultations/new" element={<ConsultationPage />} />

      {/* Stripe return pages */}
      <Route path="/success" element={<SuccessPage />} />
      <Route path="/cancel" element={<CancelPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
