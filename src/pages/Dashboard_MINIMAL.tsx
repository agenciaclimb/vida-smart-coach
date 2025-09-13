import React from 'react';

// Dashboard mínimo para testar se o problema é de memory leak
export const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Dashboard Vida Smart - Versão Mínima</h1>
      <p>✅ Se você vê esta mensagem, o problema de memória foi resolvido!</p>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '15px', 
        marginTop: '20px',
        borderRadius: '8px' 
      }}>
        <h3>🔍 Teste de Funcionalidade:</h3>
        <p>✅ React está funcionando</p>
        <p>✅ Roteamento está funcionando</p>
        <p>✅ Não há loop infinito</p>
      </div>

      <div style={{ 
        backgroundColor: '#e8f4fd', 
        padding: '15px', 
        marginTop: '20px',
        borderRadius: '8px' 
      }}>
        <h3>📋 Próximos Passos:</h3>
        <p>1. Se esta tela aparecer → Problema era memory leak no código anterior</p>
        <p>2. Implementar componentes gradualmente</p>
        <p>3. Testar cada funcionalidade isoladamente</p>
      </div>

      <button 
        onClick={() => {
          alert('✅ JavaScript funcionando!');
          console.log('✅ Dashboard mínimo carregado com sucesso');
        }}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        🧪 Testar JavaScript
      </button>
    </div>
  );
};