import { AuthBackdrop } from "@/pages/auth/components/auth-backdrop";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
      <AuthBackdrop />
      
      <main className="relative z-10 flex min-h-[calc(100dvh-160px)] items-center justify-center px-4 py-12 sm:py-16">
        <Outlet />
      </main>
    </div>
  );
}
