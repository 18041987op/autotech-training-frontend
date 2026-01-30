import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import { apiFetch, clearToken } from "./lib/api";

import { Layout } from "./components/Layout";
import { AuthScreen } from "./pages/AuthScreen";
import { Home } from "./pages/Home";
import { SettingsPage } from "./pages/SettingsPage";

import { ModulesListPage } from "./pages/ModulesListPage";
import { ModuleDetailPage } from "./pages/ModuleDetailPage";
import { MyProgressPage } from "./pages/MyProgressPage";
import { AssessmentRunnerPage } from "./pages/AssessmentRunnerPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminModulesPage } from "./pages/AdminModulesPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AICoachPage } from "./pages/AICoachPage";



function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </I18nextProvider>
  );
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // Step 4: keep session after refresh
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/api/auth/verify");
        window.__APP_USER__ = data.user; // optional global for convenience
        setUser(data.user);
      } catch {
        // invalid/expired token or no token
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const signOut = () => {
    window.__APP_USER__ = null;
    clearToken();
    setUser(null);
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

        {/* Module detail (Drive resources) */}
        <Route path="modules/:id" element={<ModuleDetailPage />} />

        {/* A4-2: Assessment runner */}
        <Route path="modules/:id/assessments/:aid" element={<AssessmentRunnerPage />} />

        {/* AI Coach page */}
        <Route path="ai" element={<AICoachPage />} />
        
        {/* Settings page */}
        <Route path="settings" element={<SettingsPage />} />

        {/* Admin modules management */}
        <Route path="admin/modules" element={<AdminModulesPage />} />


        {/* Keep admin placeholders for later */}
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/content" element={<ModulesListPage pageType="admin-content-placeholder" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
