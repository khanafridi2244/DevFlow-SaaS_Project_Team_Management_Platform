import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { getMyOrganizations } from "@/lib/workspace";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";

export function AppShell() {
  const setOrganizations = useWorkspaceStore((s) => s.setOrganizations);
  const user = useAuthStore((s) => s.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ["organizations"],
    queryFn: getMyOrganizations,
  });

  useEffect(() => {
    if (data) setOrganizations(data);
  }, [data, setOrganizations]);

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1">
        <header className="flex h-14 items-center justify-between border-b border-line px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-paper/60 hover:text-paper md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>
        {user && !user.isEmailVerified && !bannerDismissed && (
          <div className="flex items-center justify-between border-b border-warn/20 bg-warn-muted/20 px-4 py-2 text-sm">
            <span className="text-paper/80">
              Your email isn't verified yet.{" "}
              <Link to="/verify-email" className="text-warn hover:underline">
                Verify now
              </Link>
            </span>
            <button onClick={() => setBannerDismissed(true)} className="text-paper/40 hover:text-paper">
              Dismiss
            </button>
          </div>
        )}
        <main className="overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}