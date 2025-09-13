import { Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import ClientDashboard from "@/pages/ClientDashboard";
import SafeStatus from "@/pages/SafeStatus";
import AuthRedirection from "@/components/auth/AuthRedirection";
import { DataProvider } from "@/contexts/DataContext";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard/*"
        element={
          <AuthRedirection>
            <DataProvider>
              <ClientDashboard />
            </DataProvider>
          </AuthRedirection>
        }
      />
      <Route path="/safe" element={<SafeStatus />} />
      <Route path="*" element={<div className="p-8">404</div>} />
    </Routes>
  );
}
