import { Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";

import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectBoardPage from "@/pages/ProjectBoardPage";
import CalendarPage from "@/pages/CalendarPage";
import SearchPage from "@/pages/SearchPage";
import NotFoundPage from "@/pages/NotFoundPage";
import MembersPage from "@/pages/MembersPage";
import ActivityPage from "@/pages/ActivityPage";
import BillingPage from "@/pages/BillingPage";

export default function App() {
  return (
    <Routes>
      {/* Public routes — no auth required */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — everything inside AppShell requires a
          valid session. AuthGuard redirects to /login if not authed,
          rather than each page checking auth individually. */}
      <Route
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectBoardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/billing" element={<BillingPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}