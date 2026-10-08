"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { setToken } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Demo mode — any credentials accepted, no backend required
    setToken("demo-jwt-token");
    router.push("/");
  };

  return (
    <div className="min-h-dvh bg-page-bg flex items-center justify-center px-5">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blueberry-alt-50 opacity-60 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sunshade-50 opacity-80 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-slide-up">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-purple elevation-4 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-[28px] font-extrabold text-blueberry-alt-700 font-manrope leading-tight">
            Welcome to PAL
          </h1>
          <p className="text-[15px] text-neutral-400 font-source-sans mt-1">
            Personalized Adaptive Learning
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: "var(--surfaceELementWhite)",
            boxShadow: "var(--elevation4)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex rounded-xl bg-neutral-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold font-manrope transition-all ${mode === "signin" ? "bg-white text-blueberry-alt-700 shadow-sm" : "text-neutral-400"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-[14px] font-semibold font-manrope transition-all ${mode === "signup" ? "bg-white text-blueberry-alt-700 shadow-sm" : "text-neutral-400"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-500 font-manrope uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-white border border-gray-100 text-[15px] font-source-sans text-neutral-500 placeholder-neutral-200 focus:outline-none focus:border-blueberry-300 focus:ring-2 focus:ring-blueberry-100 transition-all"
                  style={{ boxShadow: "var(--depth4)" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-neutral-500 font-manrope uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 pointer-events-none" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-[48px] pl-10 pr-10 rounded-xl bg-white border border-gray-100 text-[15px] font-source-sans text-neutral-500 placeholder-neutral-200 focus:outline-none focus:border-blueberry-300 focus:ring-2 focus:ring-blueberry-100 transition-all"
                  style={{ boxShadow: "var(--depth4)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>

        <p className="text-center text-[13px] text-neutral-300 font-source-sans mt-6">
          Ulipsu / Kidvento Education © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
