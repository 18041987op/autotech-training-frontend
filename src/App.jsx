import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";

import { Layout } from "./components/Layout";
import { AuthScreen } from "./pages/AuthScreen";
import { Home } from "./pages/Home";
import { SimplePage } from "./pages/SimplePage";
import { SettingsPage } from "./pages/SettingsPage";

/**
 * OPTION A:
 * - UI Shell + Navigation + i18n
 * - Demo auth only (no backend calls)
 */

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

  return (
    <Routes>
      <Route path="/login" element={<AuthScreen onSignedIn={(u) => setUser(u)} />} />

      <Route
        path="/"
        element={user ? <Layout user={user} onSignOut={() => setUser(null)} /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Home user={user} />} />
        <Route path="onboarding" element={<SimplePage titleKey="pages.onboardingTitle" />} />
        <Route path="training" element={<SimplePage titleKey="pages.trainingTitle" />} />
        <Route path="culture" element={<SimplePage titleKey="pages.cultureTitle" />} />
        <Route path="assessments" element={<SimplePage titleKey="nav.assessments" />} />
        <Route path="ai" element={<SimplePage titleKey="pages.aiCoachTitle" />} />
        <Route path="progress" element={<SimplePage titleKey="pages.progressTitle" />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Admin shell pages (only shown in sidebar if role=admin) */}
        <Route path="admin/users" element={<SimplePage titleKey="nav.users" />} />
        <Route path="admin/content" element={<SimplePage titleKey="nav.content" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
