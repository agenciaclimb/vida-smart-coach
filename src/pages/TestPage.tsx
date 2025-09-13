import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const testResults = [];

    // Test 1: Environment Variables
    testResults.push({
      name: 'Environment Variables',
      status: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
      details: {
        VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
        VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        VITE_STRIPE_PUBLIC_KEY: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'SET' : 'MISSING',
        VITE_APP_BASE_URL: import.meta.env.VITE_APP_BASE_URL || 'NOT SET'
      }
    });

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.auth.getSession();
      testResults.push({
        name: 'Supabase Auth Connection',
        status: !error,
        details: {
          hasSession: !!data?.session,
          error: error?.message || 'None',
          timestamp: new Date().toISOString()
        }
      });
    } catch (e: any) {
      testResults.push({
        name: 'Supabase Auth Connection',
        status: false,
        details: {
          error: e.message,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Test 3: Database Query
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      testResults.push({
        name: 'Database Query Test',
        status: !error,
        details: {
          queryWorked: !error,
          error: error?.message || 'None',
          resultCount: data?.length || 0
        }
      });
    } catch (e: any) {
      testResults.push({
        name: 'Database Query Test',
        status: false,
        details: {
          error: e.message
        }
      });
    }

    // Test 4: Local Storage
    try {
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      localStorage.removeItem('test');
      
      testResults.push({
        name: 'Local Storage Test',
        status: value === 'value',
        details: {
          canWrite: true,
          canRead: value === 'value'
        }
      });
    } catch (e: any) {
      testResults.push({
        name: 'Local Storage Test',
        status: false,
        details: {
          error: e.message
        }
      });
    }

    setTests(testResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Executando testes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Diagnóstico do Sistema - Vida Smart Coach
        </h1>
        
        <div className="space-y-6">
          {tests.map((test, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{test.name}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  test.status 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {test.status ? 'PASSOU' : 'FALHOU'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center space-x-4">
          <button 
            onClick={runTests}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Executar Testes Novamente
          </button>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
          >
            Ir para Dashboard
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}