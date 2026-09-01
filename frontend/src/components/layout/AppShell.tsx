import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { getMyOrganizations } from "@/lib/workspace";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function AppShell() {
  const setOrganizations = useWorkspaceStore((s) => s.setOrganizations);

  const { data } = useQuery({
    queryKey: ["organizations"],
    queryFn: getMyOrganizations,
  });

  useEffect(() => {
    if (data) setOrganizations(data);
  }, [data, setOrganizations]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <header className="flex h-14 items-center justify-end border-b border-line px-4">
          <NotificationBell />
        </header>
        <main className="overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}