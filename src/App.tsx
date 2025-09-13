import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import ClientDashboard from "@/pages/ClientDashboard";
import SafeStatus from "@/pages/SafeStatus";
import RequireAuth from "@/components/auth/RequireAuth";
import { DataProvider } from "@/contexts/DataContext";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* protegidas */}
      <Route
        path="/dashboard/*"
        element={
          <RequireAuth>
            <DataProvider>
              <ClientDashboard />
            </DataProvider>
          </RequireAuth>
        }
      />
      <Route path="/safe" element={<SafeStatus />} />
      <Route path="*" element={<div className="p-8">404</div>} />
    </Routes>
  );
}
