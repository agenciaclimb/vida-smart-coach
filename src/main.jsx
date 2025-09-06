import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import BootWrapper from '@/components/BootWrapper';
import App from '@/App';
import '@/index.css';
import { supabase } from '@/core/supabase';

async function swKillOnce(tag = 'v2') {
  try {
    if (localStorage.getItem('__sw_killed_' + tag)) return;
    console.log('Boot: sw-cleanup-start');
    
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      console.log('Boot: sw-unregistered');
    }
    
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      console.log('Boot: caches-cleared');
    }
  } catch (e) {
    console.warn('Boot: sw-cleanup-error', e);
  } finally {
    localStorage.setItem('__sw_killed_' + tag, '1');
  }
}

function detectExtensionInterference() {
  try {
    const originalFetch = window.fetch;
    if (originalFetch.toString().includes('native code')) {
      console.log('Boot: fetch-native');
    } else {
      console.warn('Boot: fetch-monkeypatched - extensões podem estar interferindo');
      return true;
    }
  } catch (e) {
    console.warn('Boot: fetch-detection-error', e);
  }
  return false;
}

const AppWrapper = () => (
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <TooltipProvider>
                    <AuthProvider>
                        <BootWrapper>
                            <App />
                        </BootWrapper>
                    </AuthProvider>
                </TooltipProvider>
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
);

async function initApp() {
  console.log('Boot: start');
  
  const hasInterference = detectExtensionInterference();
  if (hasInterference) {
    console.warn('Boot: extension-interference-detected');
  }
  
  await swKillOnce('v2');
  
  ReactDOM.createRoot(document.getElementById('root')).render(<AppWrapper />);
}

initApp();
