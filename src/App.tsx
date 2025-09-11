import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import RequireAuth from '@/components/auth/RequireAuth';
import AuthRedirection from '@/components/auth/AuthRedirection';
import EmailVerifyGuard from '@/components/auth/EmailVerifyGuard';
import ErrorBoundary from '@/components/ErrorBoundary';
import SafeWrapper from '@/components/SafeWrapper';
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
import StatusPage from '@/pages/StatusPage';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { CartProvider } from '@/hooks/useCart';

function App() {
  return (
    <>
      <EmailVerifyGuard />
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
        <Route path="/status" element={<StatusPage />} />
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
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
              <p className="text-gray-600 mb-6">A página que você procura não existe.</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        } />
      </Routes>
      <ShadcnToaster />
      <HotToaster position="top-center" reverseOrder={false} />
    </>
  );
}

const AppWithProviders = () => (
  <SafeWrapper>
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </SafeWrapper>
);

export default AppWithProviders;
