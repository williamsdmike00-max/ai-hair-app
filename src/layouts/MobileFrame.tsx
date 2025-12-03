import type { ReactNode } from "react";

type MobileFrameProps = {
  children: ReactNode;
};

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      {/* iPhone 14 Pro style frame */}
      <div className="w-[393px] h-[852px] bg-white rounded-[48px] shadow-2xl overflow-hidden relative">
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-full z-10" />

        {/* Screen content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
