import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/SupabaseAuthContext';
import RouteGuard from '../components/RouteGuard';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

// Arquivo legado mantido apenas para referência/histórico.
// Não é usado no build atual.

function App() {
  return (
    <AuthProvider>
      <RouteGuard>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div>Registro em breve...</div>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RouteGuard>
    </AuthProvider>
  );
}

export default App;
