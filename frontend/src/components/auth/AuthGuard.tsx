import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

// Wraps every protected route. On mount, checks the real backend
// session (GET /api/auth/me) rather than trusting any local flag —
// a locally-stored "isLoggedIn: true" can go stale the moment a
// refresh token expires or gets revoked server-side, so this always
// asks the source of truth.
export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const { data, isError, isFetched } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUser,
    retry: false, // a 401 here is expected for logged-out users, not worth retrying
  });

  useEffect(() => {
    if (isFetched) {
      setUser(isError ? null : data ?? null);
      setLoading(false);
    }
  }, [isFetched, isError, data, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-signal" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}