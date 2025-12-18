import React, { useEffect } from "react";

const SuccessPage: React.FC = () => {
  // When user lands here after Stripe checkout, activate Pro on this browser
  useEffect(() => {
    localStorage.setItem("stylegenie_pro", "true");
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-center">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-xl max-w-md">
        <h1 className="text-3xl font-bold mb-4 text-white">StyleGenie Pro</h1>

        <p className="text-green-400 text-lg mb-2">
          ✅ Pro is now active on this browser.
        </p>

        <p className="text-gray-300 text-sm">
          You can now use all Pro features. If you log in from another device,
          you'll need to connect this subscription to your account later.
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
