import React, { createContext, useContext, useState } from 'react';

// AuthProvider mínimo para evitar loops infinitos
interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Login simulado:', { email });
    setLoading(true);
    
    // Simular login para testar se a tela carrega
    setTimeout(() => {
      setUser({ id: 'test-user', email });
      setLoading(false);
      console.log('✅ Login simulado bem-sucedido');
    }, 1000);
    
    return { data: { session: { user: { id: 'test-user', email } } }, error: null };
  };

  const signOut = async () => {
    console.log('🚪 Logout simulado');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};