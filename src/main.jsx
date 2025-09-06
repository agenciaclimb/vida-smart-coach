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

ReactDOM.createRoot(document.getElementById('root')).render(<AppWrapper />);
