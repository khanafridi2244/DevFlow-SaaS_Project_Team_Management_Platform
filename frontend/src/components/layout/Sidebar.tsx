import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Calendar, Search, Users, Activity, CreditCard, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/search", label: "Search", icon: Search },
  { to: "/members", label: "Members", icon: Users },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/billing", label: "Billing", icon: CreditCard },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const setUser = useAuthStore((s) => s.setUser);

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <>
      {/* Mobile-only backdrop, dismisses the drawer on tap-outside */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-ink transition-transform duration-200",
          "md:static md:translate-x-0", // always visible, non-fixed on desktop
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <span className="font-mono text-sm font-semibold tracking-tight text-paper">
            DevFlow
          </span>
          <button onClick={onClose} className="text-paper/40 hover:text-paper md:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <WorkspaceSwitcher />

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose} // closes the drawer on mobile after navigating
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-signal-muted text-signal"
                    : "text-paper/70 hover:bg-white/5 hover:text-paper"
                )
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-paper/70 transition-colors hover:bg-white/5 hover:text-paper"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}