import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import { selectAuth } from "@/features/auth/authSlice";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAppSelector(selectAuth);
  const loc = useLocation();

  if (!token) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <>{children}</>;
}