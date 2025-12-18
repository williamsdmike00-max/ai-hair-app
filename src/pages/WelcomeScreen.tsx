import { Link } from "react-router-dom";

export default function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 relative overflow-hidden">
      {/* Soft gradient glow in the background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-sky-500/5 to-fuchsia-500/20" />

      {/* Main content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 flex flex-col lg:flex-row gap-12 lg:items-center">
        {/* LEFT: Hero copy */}
        <div className="flex-1 max-w-xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-gray-400 mb-3 uppercase">
            MYHAIRGENIE · MVP
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
            Your AI front-desk for busy stylists.
          </h1>

          <p className="text-base sm:text-lg text-gray-300 mb-6">
            Keep formulas, notes, and processing times in one clean dashboard.
            Talk instead of typing, get instant client summaries, and never lose
            track of who’s in your chair or at the bowl.
          </p>

          <ul className="space-y-2 text-sm sm:text-base text-gray-300 mb-8">
            <li>💬 Voice → notes for every appointment.</li>
            <li>🤖 AI summaries + aftercare you can skim in seconds.</li>
            <li>⏱️ Processing timers so color never sits too long.</li>
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 transition"
            >
              Open today’s assistant
            </Link>

            <p className="text-xs sm:text-sm text-gray-400">
              MVP demo · built for salons, barbers, and colorists
            </p>
          </div>
        </div>

        {/* RIGHT: Phone-style preview card */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xs rounded-3xl bg-gray-900/80 border border-white/10 shadow-2xl shadow-emerald-500/30 px-4 py-5 backdrop-blur">
            {/* "Phone" notch */}
            <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-gray-700" />

            {/* Top bar */}
            <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
              <span className="font-semibold text-gray-200">Today’s chair</span>
              <span>MyHairGenie</span>
            </div>

            {/* Appointments */}
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl bg-gray-800/80 border border-emerald-500/30 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-100">9:00 · Aaliyah</span>
                  <span className="text-[10px] text-emerald-300">
                    processing · 18:32
                  </span>
                </div>
                <p className="text-gray-300">
                  Balayage refresh · warm honey tone, keep ends bright.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-800/60 border border-gray-700 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-100">10:30 · Marcus</span>
                  <span className="text-[10px] text-gray-400">at bowl · timer off</span>
                </div>
                <p className="text-gray-300">
                  Skin fade + beard detail · sharp lineup, no razor.
                </p>
              </div>

              <div className="mt-2 rounded-xl bg-gray-800/40 border border-dashed border-gray-700 p-3 text-gray-400">
                🎙️ Tap to dictate notes instead of typing after each client.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
