import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import RequireAuth from '@/components/auth/RequireAuth';
import AuthRedirection from '@/components/auth/AuthRedirection';
import ErrorBoundary from '@/components/ErrorBoundary';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ContactPage from '@/pages/ContactPage';
import ClientDashboard from '@/pages/ClientDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import PartnerPage from '@/pages/PartnerPage';
import PartnerDashboard from '@/pages/PartnerDashboard';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import IntegrationCallbackPage from '@/pages/IntegrationCallbackPage';
import SuccessPage from '@/pages/SuccessPage';
import StorePage from '@/pages/StorePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { CartProvider } from '@/hooks/useCart';

function App() {
  return (
    <>
      <AuthRedirection />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contato" element={<ContactPage />} />
        <Route path="/parceiros" element={<PartnerPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/integration-callback" element={<IntegrationCallbackPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ClientDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/painel-parceiro"
          element={
            <RequireAuth>
              <PartnerDashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ShadcnToaster />
      <HotToaster position="top-center" reverseOrder={false} />
    </>
  );
}

const AppWithProviders = () => (
  <ErrorBoundary>
    <AuthProvider>
      <DataProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </DataProvider>
    </AuthProvider>
  </ErrorBoundary>
);

export default AppWithProviders;
