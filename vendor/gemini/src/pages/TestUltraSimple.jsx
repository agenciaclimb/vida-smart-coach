// src/pages/TestUltraSimple.jsx
import React from 'react';

// ===============================================
// 🧪 TESTE ULTRA SIMPLES - SEM DEPENDÊNCIAS
// ===============================================

export const TestUltraSimple = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          🎯 Teste Ultra Simples - Vida Smart
        </h1>
        
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#166534',
            marginBottom: '0.5rem'
          }}>
            ✅ Aplicação Funcionando!
          </h2>
          <p style={{ color: '#15803d', marginBottom: '0.5rem' }}>
            Se você está vendo esta página, significa que:
          </p>
          <ul style={{ color: '#15803d', paddingLeft: '1.5rem' }}>
            <li>✓ React está compilando corretamente</li>
            <li>✓ Vite dev server está ativo</li>
            <li>✓ Roteamento está funcionando</li>
            <li>✓ Não há erros críticos de importação</li>
          </ul>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #bfdbfe',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#1e40af', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
              🛡️ SafeGuard Status
            </h3>
            <p style={{ color: '#1d4ed8', fontSize: '0.875rem' }}>
              Proteções implementadas e prontas para uso
            </p>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: '#f3e8ff',
            border: '1px solid #e9d5ff',
            borderRadius: '8px'
          }}>
            <h3 style={{ color: '#7c3aed', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
              🔧 Build Status
            </h3>
            <p style={{ color: '#8b5cf6', fontSize: '0.875rem' }}>
              Compilação bem-sucedida sem erros
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Ir para Login
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard-final'}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Dashboard Final
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Reload Página
          </button>
        </div>

        <div style={{
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📊 Debug Information:
          </h3>
          <pre style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280',
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
{JSON.stringify({
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent.slice(0, 80) + '...',
  location: window.location.href,
  screen: `${window.screen.width}x${window.screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`
}, null, 2)}
          </pre>
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px'
        }}>
          <h3 style={{ color: '#92400e', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
            🎯 Próximos Passos:
          </h3>
          <ol style={{ color: '#b45309', paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
            <li>Faça login pela página de login</li>
            <li>Teste o dashboard com as proteções SafeGuard</li>
            <li>Verifique no DevTools se não há loops infinitos</li>
            <li>Confirme que a autenticação está estável</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestUltraSimple;