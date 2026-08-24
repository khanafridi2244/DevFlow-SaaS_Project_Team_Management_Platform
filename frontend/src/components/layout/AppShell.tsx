import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
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
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}