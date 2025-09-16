/** DO NOT import legacy modules. See src/legacy/ for deprecated variants. */

import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage_ClienteFinal";
import PartnersPage from "@/pages/PartnersPage_Corrigida";
import LoginPage from "@/pages/LoginPage";
import ClientDashboard from "@/pages/ClientDashboard";
import SafeStatus from "@/pages/SafeStatus";
import RequireAuth from "@/components/auth/RequireAuth";
import { DataProvider } from "@/contexts/DataContext";
import AuthCallbackPage from "@/pages/AuthCallbackPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/parceiros" element={<PartnersPage />} />
      {/* pública */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* protegidas */}
      <Route element={<RequireAuth />}>
        <Route
          path="/dashboard/*"
          element={
            <DataProvider>
              <ClientDashboard />
            </DataProvider>
          }
        />
      </Route>
      <Route path="/safe" element={<SafeStatus />} />
      <Route path="*" element={<div className="p-8">404</div>} />
    </Routes>
  );
}
