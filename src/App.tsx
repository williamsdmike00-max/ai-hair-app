import { BrowserRouter, Routes, Route } from "react-router-dom";
import WelcomeScreen from "./pages/WelcomeScreen";
import HomeDashboard from "./pages/HomeDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/dashboard" element={<HomeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
