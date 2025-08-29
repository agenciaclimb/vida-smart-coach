# Configuração de URLs de Autenticação do Supabase

Para configurar corretamente a autenticação multi-subdomínio no painel do Supabase, siga estas instruções:

## 1. Acesse o Painel do Supabase
- Vá para https://supabase.com/dashboard
- Selecione o projeto "Vida Smart V3.0" (ID: zzugbgoylwbaojdnunuz)

## 2. Configure Authentication URLs
Navegue para **Authentication → URL Configuration** e configure:

### Site URL
```
https://appvidasmart.com.br
```

### Redirect URLs
Adicione todas as URLs abaixo (uma por linha):
```
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
https://appvidasmart.com.br/auth/callback
https://cliente.appvidasmart.com.br/auth/callback
https://parceiro.appvidasmart.com.br/auth/callback
https://admin.appvidasmart.com.br/auth/callback
```

### Additional Redirect URLs (se disponível)
```
https://vida-smart-supabase-v3-*.vercel.app/auth/callback
```

## 3. Verificação
Após salvar as configurações:
- ✅ Site URL deve estar definida como o domínio principal
- ✅ Todas as 6 URLs de redirect devem estar listadas
- ✅ URLs de desenvolvimento (localhost/127.0.0.1) incluídas para testes locais
- ✅ URLs de produção para todos os 3 subdomínios incluídas

## 4. Teste de Configuração
Para verificar se está funcionando:
1. Acesse cada subdomínio
2. Tente fazer login com magic link
3. Verifique se o redirect funciona corretamente
4. Confirme que não há erros 500 nos endpoints de auth

## Subdomínios Configurados
- **Cliente**: https://cliente.appvidasmart.com.br
- **Parceiro**: https://parceiro.appvidasmart.com.br  
- **Admin**: https://admin.appvidasmart.com.br

## Notas Importantes
- Qualquer espaço extra ou URL incorreta pode quebrar o fluxo de autenticação
- Sempre teste após fazer alterações nas configurações
- URLs de desenvolvimento são necessárias para testes locais
- Magic links só funcionarão com URLs configuradas corretamente
