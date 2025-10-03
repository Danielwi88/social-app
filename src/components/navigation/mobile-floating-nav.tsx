import { Home, Plus, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

type MobileFloatingNavProps = {
  onlyMobile?: boolean;
};

export function MobileFloatingNav({ onlyMobile = false }: MobileFloatingNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center",
        onlyMobile && "md:hidden"
      )}
    >
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-8 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <Link
          to="/feed"
          className="flex min-w-[64px] flex-col items-center gap-1 text-xs font-medium"
        >
          <span
            className={`flex size-12 items-center justify-center rounded-full border ${
              isActive("/feed")
                ? "border-white/40 bg-white/[0.14] text-white"
                : "border-transparent bg-white/[0.08] text-white/70"
            }`}
          >
            <Home className="size-5" />
          </span>
          <span className={isActive("/feed") ? "text-white" : "text-white/70"}>Home</span>
        </Link>

        <button
          type="button"
          onClick={() => navigate("/posts/new")}
          className="flex flex-col items-center gap-1 text-xs font-medium text-white"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-[0_12px_35px_rgba(168,85,247,0.45)]">
            <Plus className="size-6" />
          </span>
          <span className="text-white">New Post</span>
        </button>

        <Link
          to="/me"
          className="flex min-w-[64px] flex-col items-center gap-1 text-xs font-medium"
        >
          <span
            className={`flex size-12 items-center justify-center rounded-full border ${
              isActive("/my-profile")
                ? "border-white/40 bg-white/[0.14] text-white"
                : "border-transparent bg-white/[0.08] text-white/70"
            }`}
          >
            <UserRound className="size-5" />
          </span>
          <span className={isActive("/my-profile") ? "text-white" : "text-white/70"}>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
