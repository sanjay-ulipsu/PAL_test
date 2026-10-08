"use client";

import { useEffect, useState } from "react";
import { getToken, setToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/stores/userStore";

const DEMO_PROFILE = {
  id: "demo-user",
  display_name: "Demo Student",
  yol: 1,
  content_focus: "global",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const setProfile = useUserStore((s) => s.setProfile);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Demo mode — auto-login with demo profile, no backend required
    if (!getToken()) setToken("demo-jwt-token");
    setProfile(DEMO_PROFILE as any);
    setChecking(false);
  }, [setProfile]);

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-page-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center animate-pulse">
            <span className="text-white text-xl font-bold font-madimi-one">P</span>
          </div>
          <p className="text-neutral-400 text-[15px] font-source-sans">Loading your learning space…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
