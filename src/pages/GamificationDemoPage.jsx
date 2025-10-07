import React from 'react';
import { Link } from 'react-router-dom';
import GamificationDemo from '@/components/demo/GamificationDemo';
import { useAuth } from '@/components/auth/AuthProvider';

const GamificationDemoPage = () => {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/" 
                                className="text-2xl font-bold text-blue-600 hover:text-blue-700"
                            >
                                Vida Smart Coach
                            </Link>
                            <span className="text-gray-400">|</span>
                            <span className="text-lg font-medium text-gray-700">
                                Demo Gamificação
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <>
                                    <span className="text-sm text-gray-600">
                                        Olá, {user.email}
                                    </span>
                                    <Link
                                        to="/dashboard"
                                        className="text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={signOut}
                                        className="text-gray-600 hover:text-gray-700"
                                    >
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-8">
                <GamificationDemo />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600">
                        <p className="mb-4">
                            🚀 <strong>Sistema de Gamificação - Vida Smart Coach</strong>
                        </p>
                        <div className="flex justify-center space-x-6 text-sm">
                            <span>✅ Detecção Automática via WhatsApp</span>
                            <span>🛡️ Sistema Anti-Fraude</span>
                            <span>⚡ Tempo Real</span>
                            <span>🎯 Missões Diárias</span>
                        </div>
                        <div className="mt-4 text-xs text-gray-500">
                            <p>
                                Aplicação URL: <strong>https://5173-i980bncctri6yqqpcxtrd-6532622b.e2b.dev</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default GamificationDemoPage;