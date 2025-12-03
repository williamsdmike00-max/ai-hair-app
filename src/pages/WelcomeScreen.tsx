import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">
          AI Hairstylist Assistant
        </h1>

        <p className="text-gray-600 mb-8">
          Capture color formulas, client history, and AI-powered suggestions
          in one simple workflow.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
