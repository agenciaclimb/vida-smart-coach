
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Heart, Mail, Lock, User, Phone, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { supabase } from '@/core/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [localLoading, setLocalLoading] = useState(false);

  const params = new URLSearchParams(location.search);
  const roleFromQuery = params.get('role') || 'client';
  const tabFromQuery = params.get('tab') || 'login';
  const refFromQuery = params.get('ref'); // Read referral code
  const [activeTab, setActiveTab] = useState(tabFromQuery);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: roleFromQuery,
    ref_code: refFromQuery || '' // Add ref_code to state
  });
  
  useEffect(() => {
    setRegisterData(prev => ({ ...prev, role: roleFromQuery, ref_code: refFromQuery || '' }));
  }, [roleFromQuery, refFromQuery]);

  useEffect(() => {
    setActiveTab(tabFromQuery);
  }, [tabFromQuery]);

  // Login handler robusto
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevenir duplo clique
    if (localLoading) return;
    
    setLocalLoading(true);
    const toastId = toast.loading('Entrando...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      
      if (error) throw error;

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        // Aguardar um pouco para garantir que a sessão foi definida
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success('Login realizado com sucesso!', { id: toastId });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.message ?? 'Falha ao entrar. Tente novamente.', { id: toastId });
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('[DEBUG] handleRegister iniciado', registerData);

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('As senhas nao coincidem');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLocalLoading(true);
    const toastId = toast.loading('Criando sua conta...');

    try {
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.full_name,
            whatsapp: registerData.phone,
            role: registerData.role,
            referred_by: registerData.ref_code, // Pass referral code to Supabase
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        const message = error.message || 'Nao foi possivel realizar o cadastro.';
        console.error('[signup] erro supabase', message);

        if (message?.includes('mail-error.png')) {
          toast.error('Nao conseguimos enviar o email de confirmacao agora. Ja estamos ajustando o template; solicite suporte se precisar ativar o acesso imediatamente.', {
            id: toastId,
            duration: 6000,
          });
        } else {
          toast.error(message, { id: toastId });
        }
        return;
      }

      if (!data.session) {
        console.info('[signup] registro criado, aguardando confirmacao de email', data?.user?.email);
        toast.success('Cadastro realizado! Verifique seu email para confirmar a conta.', { id: toastId, duration: 5000 });
        setActiveTab('login');
        setLoginData({ email: registerData.email, password: '' });
      } else {
        console.info('[signup] registro criado com sessao ativa', data?.user?.email);
        toast.success('Cadastro realizado com sucesso!', { id: toastId });
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('[signup] excecao inesperada', error);
      toast.error('Ocorreu um erro inesperado durante o cadastro.', { id: toastId });
    } finally {
      setLocalLoading(false);
    }
  };
  
  const isLoading = localLoading;

  const handleLoginWithGoogle = async () => {
    if (localLoading) return;

    setLocalLoading(true);
    const toastId = toast.loading('Abrindo Google para login...');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) throw error;

      toast.success('Redirecionando para o Google...', { id: toastId, duration: 2000 });
    } catch (err) {
      toast.error(err?.message ?? 'Não foi possível iniciar o login com Google.', { id: toastId });
      setLocalLoading(false);
    }
    // Supabase redireciona automaticamente em caso de sucesso, então o loading permanece ativo.
  };

  return (
    <>
      <Helmet>
        <title>Login - Vida Smart | Acesse sua conta</title>
        <meta name="description" content="Faça login na sua conta Vida Smart ou cadastre-se para começar sua jornada de transformação com nosso coach de IA via WhatsApp." />
      </Helmet>

      <div className="min-h-screen vida-smart-gradient flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-md"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-6"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Heart className="w-7 h-7 text-primary" />
              </div>
              <span className="text-3xl font-bold text-white">Vida Smart</span>
            </div>
            <p className="text-blue-100">Seu coach saudável por WhatsApp</p>
          </div>

          <div className="vida-smart-card rounded-2xl p-8 shadow-2xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" disabled={isLoading}>Entrar</TabsTrigger>
                <TabsTrigger value="register" disabled={isLoading}>Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full vida-smart-gradient text-white hover:opacity-90 flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Aguarde...' : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-6">
                  <div className="relative flex items-center">
                    <span className="flex-grow border-t border-slate-200" />
                    <span className="px-3 text-xs uppercase tracking-wide text-slate-400">ou continue com</span>
                    <span className="flex-grow border-t border-slate-200" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full gap-2"
                    onClick={handleLoginWithGoogle}
                    disabled={isLoading}
                  >
                    <LogIn className="h-4 w-4" />
                    Google
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10"
                        value={registerData.full_name}
                        onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="5511999999999"
                        className="pl-10"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full vida-smart-gradient text-white hover:opacity-90 flex items-center justify-center"
                    disabled={isLoading}
                  >
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Aguarde...' : 'Criar minha conta'}
                  </Button>

                  <p className="text-xs text-gray-600 text-center">
                    Ao se cadastrar, você concorda com nossos <Link to="/termos" className="underline">Termos de Uso</Link> e <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;

