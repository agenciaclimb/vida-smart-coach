import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error('Email ou senha incorretos');
        console.error('Login error:', error);
        return;
      }

      if (data?.session) {
        toast.success('Login realizado com sucesso!');
        // Force reload para garantir que a sessão seja reconhecida
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Login exception:', err);
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Vida Smart Coach
            </h1>
            <p className="text-gray-600">
              Faça login para acessar seu dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="seu@email.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Sua senha"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Voltar ao início
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="text-xs text-gray-500">
              <p>Versão simplificada para resolução de problemas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}