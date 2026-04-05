import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import i18n from "./i18n";
import { queryClient } from './lib/queryClient';

import { apiFetch, clearToken } from "./lib/api";
import { useAuthStore } from "./stores/authStore";

import { Layout } from "./components/Layout";
import { AuthScreen } from "./pages/AuthScreen";
import { Home } from "./pages/Home";
import { SettingsPage } from "./pages/SettingsPage";

import { ModulesListPage } from "./pages/ModulesListPage";
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { MyProgressPage } from "./pages/MyProgressPage";
import { MyScorecardPage } from "./pages/MyScorecardPage";
import { AssessmentRunnerPage } from "./pages/AssessmentRunnerPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminModulesPage } from "./pages/AdminModulesPage";
import { AdminProgressPage } from "./pages/AdminProgressPage";
import { AdminSuggestionsPage } from "./pages/AdminSuggestionsPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AICoachPage } from "./pages/AICoachPage";
import { PayHistoryPage } from "./pages/PayHistoryPage";
import { KeyBoardPage } from "./pages/KeyBoardPage";

// Tools pages
import { ToolsCatalogPage } from "./pages/ToolsCatalogPage";
import { ToolDetailPage } from "./pages/ToolDetailPage";
import { MyToolsPage } from "./pages/MyToolsPage";
import { AdminToolsPage } from "./pages/AdminToolsPage";
import { AdminLoansPage } from "./pages/AdminLoansPage";
import { AdminToolReportsPage } from "./pages/AdminToolReportsPage";
import { AdminContentPage } from "./pages/AdminContentPage";

// HR pages
import { MyProfilePage } from "./pages/MyProfilePage";
import { SchedulePage } from "./pages/SchedulePage";
import { TimesheetPage } from "./pages/TimesheetPage";
import { TimeOffPage } from "./pages/TimeOffPage";
import { BenefitsPage } from "./pages/BenefitsPage";
import { TeamDirectoryPage } from "./pages/TeamDirectoryPage";


function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Step 4: keep session after refresh — sync to both local state and authStore
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/auth/verify");
        window.__APP_USER__ = data.user;
        setUser(data.user);
        setStoreUser(data.user); // sync authStore so HR pages can read user.email
      } catch {
        setUser(null);
        clearAuth();
      } finally {
        setBooting(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = () => {
    window.__APP_USER__ = null;
    clearToken();
    setUser(null);
    clearAuth();
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <div className="rounded-2xl border bg-white px-5 py-4 text-sm text-slate-700 shadow-sm">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <AuthScreen onSignedIn={(u) => setUser(u)} />
          )
        }
      />

      <Route
        path="/"
        element={
          <Protected user={user}>
            <Layout user={user} onSignOut={signOut} />
          </Protected>
        }
      >
        <Route index element={<Home user={user} />} />

        {/* OPTION B: real data pages */}
        <Route path="onboarding" element={<ModulesListPage pageType="onboarding" />} />
        <Route path="training" element={<ModulesListPage pageType="training" />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="progress" element={<MyProgressPage />} />
        <Route path="scorecard" element={<MyScorecardPage />} />
        <Route path="culture" element={<ModulesListPage pageType="culture" />} />

        {/* Module detail (Drive resources) */}
        <Route path="modules/:id" element={<ModuleDetailPage />} />

        {/* A4-2: Assessment runner */}
        <Route path="modules/:id/assessments/:aid" element={<AssessmentRunnerPage />} />

        {/* AI Coach page */}
        <Route path="ai" element={<AICoachPage />} />
        
        {/* Production history page */}
        <Route path="production" element={<PayHistoryPage />} />

        {/* Key Board — visible to all employees */}
        <Route path="keyboard" element={<KeyBoardPage />} />

        {/* Tools — visible to all employees */}
        <Route path="tools" element={<ToolsCatalogPage />} />
        <Route path="tools/:id" element={<ToolDetailPage />} />
        <Route path="my-tools" element={<MyToolsPage />} />

        {/* HR — visible to all employees */}
        <Route path="profile" element={<MyProfilePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="timesheet" element={<TimesheetPage />} />
        <Route path="time-off" element={<TimeOffPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="team" element={<TeamDirectoryPage />} />

        {/* Settings page */}
        <Route path="settings" element={<SettingsPage />} />

        {/* Admin pages */}
        <Route path="admin/modules" element={<AdminModulesPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/progress" element={<AdminProgressPage />} />
        <Route path="admin/suggestions" element={<AdminSuggestionsPage />} />
        <Route path="admin/content" element={<AdminContentPage />} />
        <Route path="admin/tools" element={<AdminToolsPage />} />
        <Route path="admin/loans" element={<AdminLoansPage />} />
        <Route path="admin/tool-reports" element={<AdminToolReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
