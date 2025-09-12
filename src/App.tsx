import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { Toaster as HotToaster } from 'react-hot-toast';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ClientDashboard from '@/pages/ClientDashboard';
import TestUltraSimple from '@/pages/TestUltraSimple';
import ClientDashboardSafeGuard from '@/pages/ClientDashboard_SAFEGUARD';
import SafeStatus from '@/pages/SafeStatus';
import { DataProvider } from '@/contexts/DataContext';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DataProvider><ClientDashboard /></DataProvider>} />
        <Route path="/test-ultra" element={<TestUltraSimple />} />
        <Route path="/dashboard-safeguard" element={<DataProvider><ClientDashboardSafeGuard /></DataProvider>} />
        <Route path="/safe" element={<SafeStatus />} />
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
