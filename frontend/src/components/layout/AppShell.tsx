import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { getMyOrganizations } from "@/lib/workspace";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function AppShell() {
  const setOrganizations = useWorkspaceStore((s) => s.setOrganizations);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <main className="overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}