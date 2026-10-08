import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/providers/AuthGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-page-bg">
        <Header />
        <main className="pt-[88px] px-5 xl:px-16 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
