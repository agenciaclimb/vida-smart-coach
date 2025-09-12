import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './utils/sw-cleanup-enhanced';
import AuthProvider from './components/auth/AuthProvider';
import AuthRedirection from './components/auth/AuthRedirection';
import App from './App';
import './index.css';

// Debug import (apenas em desenvolvimento)  
if (import.meta.env.MODE === 'development') {
  import('./debug.js');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AuthRedirection>
          <App />
        </AuthRedirection>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
