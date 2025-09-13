import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider_MINIMAL';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 Tentando login mínimo...');
    setLoading(true);

    try {
      await signIn(email, password);
      console.log('✅ Redirecionando para dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('❌ Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🚀 Vida Smart - Login Teste
        </h2>
        
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: 0, fontSize: '14px' }}>
            ⚠️ <strong>Versão de Teste:</strong> Use qualquer email/senha para testar se o problema de memória foi resolvido.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="email"
              placeholder="Email de teste"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Senha de teste"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '🔄 Testando...' : '🧪 Testar Login'}
          </button>
        </form>

        <div style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center'
        }}>
          <p>🔍 <strong>Objetivo:</strong> Verificar se a aplicação carrega sem erro de memória</p>
          <p>✅ Se funcionar → Problema era no código anterior</p>
        </div>
      </div>
    </div>
  );
};