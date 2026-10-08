"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, BookOpen } from "lucide-react";
import { clearToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/stores/userStore";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { href: "/", label: "Home", icon: null },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const reset = useUserStore((s) => s.reset);

  const handleSignOut = async () => {
    clearToken();
    reset();
    router.push("/login");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[64px] py-5 px-5 xl:px-16 flex items-center justify-between m-5 rounded-md"
      style={{ background: "var(--surfaceELementWhite)", boxShadow: "var(--elevation5)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[20px] font-bold text-blueberry-alt-700 font-manrope leading-none">
          PAL<span className="text-sunshade-500">2</span>
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2 rounded-lg text-[15px] font-semibold font-manrope transition-colors",
              pathname === href
                ? "text-blueberry-alt-600 bg-blueberry-alt-50"
                : "text-neutral-400 hover:text-blueberry-alt-600 hover:bg-blueberry-alt-50/50"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right: profile + sign out */}
      <div className="flex items-center gap-3">
        {profile && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-element elevation-1">
            <div className="w-7 h-7 rounded-full bg-gradient-purple flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px] font-semibold text-neutral-500 font-manrope hidden sm:block">
              {profile.display_name}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg text-neutral-400 hover:text-alert-danger hover:bg-[#fff0ec] transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
