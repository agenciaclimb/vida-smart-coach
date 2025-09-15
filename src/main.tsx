/** DO NOT import legacy modules. See src/legacy/ for deprecated variants. */

// Limpa quaisquer Service Workers/caches antigos que possam interferir nas requisições
// e causar pendências de rede (especialmente após migrações de build/host).
import './sw-cleanup';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from '@/components/auth/AuthProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
