// src/pages/CancelPage.tsx
import React from "react";

const CancelPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md border border-slate-800 rounded-xl p-6 text-center">
        <h1 className="text-2xl font-semibold mb-3">Payment Cancelled</h1>
        <p className="text-slate-400">
          Your payment was cancelled. You can try again anytime.
        </p>

        <a
          href="/"
          className="mt-6 inline-block text-slate-100 underline underline-offset-2"
        >
          Return Home
        </a>
      </div>
    </div>
  );
};

export default CancelPage;
