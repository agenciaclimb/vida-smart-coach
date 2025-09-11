// ===============================================
// 🧹 SERVICE WORKER & CACHE CLEANUP ENHANCED
// ===============================================
// Limpeza robusta para evitar problemas de cache antigo

interface CleanupResult {
  serviceWorkers: {
    found: number;
    removed: number;
    errors: string[];
  };
  caches: {
    found: number;
    removed: number;
    errors: string[];
  };
  localStorage: {
    found: number;
    removed: number;
    errors: string[];
  };
  success: boolean;
}

/**
 * Executa limpeza completa de SW, caches e storage
 */
async function performCleanup(): Promise<CleanupResult> {
  console.log('🧹 Iniciando limpeza enhanced de SW/caches...');
  
  const result: CleanupResult = {
    serviceWorkers: { found: 0, removed: 0, errors: [] },
    caches: { found: 0, removed: 0, errors: [] },
    localStorage: { found: 0, removed: 0, errors: [] },
    success: false
  };

  // ===============================================
  // 1️⃣ LIMPEZA DE SERVICE WORKERS
  // ===============================================
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Removendo service workers...');
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      result.serviceWorkers.found = registrations.length;
      
      if (registrations.length > 0) {
        console.log(`📋 Encontrados ${registrations.length} service workers`);
        
        for (const registration of registrations) {
          try {
            const unregistered = await registration.unregister();
            if (unregistered) {
              result.serviceWorkers.removed++;
              console.log('✅ Service Worker removido:', registration.scope);
            } else {
              console.warn('⚠️ Falha ao remover SW:', registration.scope);
            }
          } catch (error) {
            const errorMsg = `Erro ao remover SW ${registration.scope}: ${error}`;
            result.serviceWorkers.errors.push(errorMsg);
            console.error('❌', errorMsg);
          }
        }
      } else {
        console.log('ℹ️ Nenhum service worker encontrado');
      }
      
    } catch (error) {
      const errorMsg = `Erro geral nos service workers: ${error}`;
      result.serviceWorkers.errors.push(errorMsg);
      console.error('❌', errorMsg);
    }
  } else {
    console.log('ℹ️ Service Workers não suportados neste navegador');
  }

  // ===============================================
  // 2️⃣ LIMPEZA DE CACHES
  // ===============================================
  if ('caches' in window) {
    try {
      console.log('🗑️ Removendo caches...');
      
      const cacheNames = await caches.keys();
      result.caches.found = cacheNames.length;
      
      if (cacheNames.length > 0) {
        console.log(`📋 Encontrados ${cacheNames.length} caches:`, cacheNames);
        
        for (const cacheName of cacheNames) {
          try {
            const deleted = await caches.delete(cacheName);
            if (deleted) {
              result.caches.removed++;
              console.log('✅ Cache removido:', cacheName);
            } else {
              console.warn('⚠️ Falha ao remover cache:', cacheName);
            }
          } catch (error) {
            const errorMsg = `Erro ao remover cache ${cacheName}: ${error}`;
            result.caches.errors.push(errorMsg);
            console.error('❌', errorMsg);
          }
        }
      } else {
        console.log('ℹ️ Nenhum cache encontrado');
      }
      
    } catch (error) {
      const errorMsg = `Erro geral nos caches: ${error}`;
      result.caches.errors.push(errorMsg);
      console.error('❌', errorMsg);
    }
  } else {
    console.log('ℹ️ Cache API não suportada neste navegador');
  }

  // ===============================================
  // 3️⃣ LIMPEZA DE LOCALSTORAGE (AUTH ANTIGO)
  // ===============================================
  try {
    console.log('🧼 Limpando localStorage de auth antigo...');
    
    const keysToRemove: string[] = [];
    
    // Identificar chaves relacionadas a auth antigo
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Chaves suspeitas de auth antigo
        if (
          key.includes('auth0') ||
          key.includes('nextauth') ||
          key.includes('clerk') ||
          key.startsWith('@@auth') ||
          (key.includes('sb-') && key.includes('expired')) // Tokens Supabase expirados
        ) {
          keysToRemove.push(key);
        }
      }
    }
    
    result.localStorage.found = keysToRemove.length;
    
    if (keysToRemove.length > 0) {
      console.log(`📋 Removendo ${keysToRemove.length} chaves de auth antigo:`, keysToRemove);
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          result.localStorage.removed++;
          console.log('✅ localStorage key removida:', key);
        } catch (error) {
          const errorMsg = `Erro ao remover localStorage key ${key}: ${error}`;
          result.localStorage.errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      });
    } else {
      console.log('ℹ️ Nenhuma chave de auth antigo encontrada no localStorage');
    }
    
  } catch (error) {
    const errorMsg = `Erro geral no localStorage: ${error}`;
    result.localStorage.errors.push(errorMsg);
    console.error('❌', errorMsg);
  }

  // ===============================================
  // 4️⃣ RESULTADO FINAL
  // ===============================================
  const totalErrors = result.serviceWorkers.errors.length + 
                     result.caches.errors.length + 
                     result.localStorage.errors.length;
  
  result.success = totalErrors === 0;
  
  console.log('📊 Cleanup finalizado:', {
    success: result.success,
    serviceWorkers: `${result.serviceWorkers.removed}/${result.serviceWorkers.found}`,
    caches: `${result.caches.removed}/${result.caches.found}`,
    localStorage: `${result.localStorage.removed}/${result.localStorage.found}`,
    totalErrors
  });

  if (result.success) {
    console.log('✅ Limpeza completa realizada com sucesso!');
  } else {
    console.warn('⚠️ Limpeza concluída com alguns erros - verifique logs acima');
  }

  return result;
}

// ===============================================
// 🚀 EXECUTAR LIMPEZA AUTOMATICAMENTE
// ===============================================
// Executar quando o módulo for importado
performCleanup()
  .then(result => {
    // Salvar resultado para debugging
    (window as any).cleanupResult = result;
    
    // Emitir evento customizado para outros módulos
    window.dispatchEvent(new CustomEvent('sw-cleanup-complete', { 
      detail: result 
    }));
  })
  .catch(error => {
    console.error('❌ Erro crítico no cleanup:', error);
    (window as any).cleanupError = error;
  });

// ===============================================
// 📤 EXPORTAR FUNÇÕES UTILITÁRIAS
// ===============================================
export { performCleanup };
export type { CleanupResult };

// Função para executar limpeza manual
export const manualCleanup = () => {
  console.log('🔧 Executando limpeza manual...');
  return performCleanup();
};

// Função para verificar se limpeza é necessária
export const needsCleanup = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    return false;
  }

  try {
    const [registrations, cacheNames] = await Promise.all([
      navigator.serviceWorker.getRegistrations(),
      caches.keys()
    ]);

    return registrations.length > 0 || cacheNames.length > 0;
  } catch {
    return false;
  }
};

console.log('✅ SW Cleanup Enhanced carregado');