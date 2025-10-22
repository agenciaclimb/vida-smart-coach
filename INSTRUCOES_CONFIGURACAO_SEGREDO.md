# 🔐 CONFIGURAÇÃO INTERNAL_FUNCTION_SECRET - INSTRUÇÕES

## ✅ Passos já executados automaticamente:

1. ✅ Senha gerada: `VSC_INTERNAL_SECRET_gTwCd_aznWq43wgiFDpIo09K326pJh2sKUuOZ9Oz3D0`
2. ✅ Código de validação adicionado ao `ia-coach-chat/index.ts`
3. ✅ Header `X-Internal-Secret` adicionado ao `evolution-webhook/index.ts`
4. ✅ `verify_jwt` reativado (`true`) no `config.toml`
5. ✅ Funções deployadas com sucesso
6. ✅ Seller Stage atualizado para enviar link de cadastro: https://appvidasmart.com/cadastro

---

## 🎯 PRÓXIMO PASSO MANUAL (VOCÊ PRECISA FAZER):

### Configurar o segredo no Supabase Dashboard:

1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/settings/functions

2. Na seção **"Function Secrets"**, clique em **"Add new secret"**

3. Preencha:
   - **Name:** `INTERNAL_FUNCTION_SECRET`
   - **Value:** `VSC_INTERNAL_SECRET_gTwCd_aznWq43wgiFDpIo09K326pJh2sKUuOZ9Oz3D0`

4. Clique em **Save**

5. Aguarde ~30 segundos para propagar

---

## ✅ Como testar se funcionou:

Após configurar o segredo, envie uma mensagem no WhatsApp. A conversa deve funcionar normalmente.

Se aparecer erro 401, significa que o segredo não foi configurado corretamente no Dashboard.

---

## 🔒 Segurança:

- ✅ Este arquivo está no `.gitignore` (não será commitado)
- ✅ O segredo é forte (256 bits de entropia)
- ✅ Somente funções internas podem chamar `ia-coach-chat` agora
- ✅ `verify_jwt=true` reativado para camada adicional de segurança

---

## 📋 Status das correções:

### ✅ Segurança:
- [x] Gerado INTERNAL_FUNCTION_SECRET
- [x] Código de validação implementado
- [x] verify_jwt reativado
- [x] Funções deployadas
- [ ] Configurar segredo no Dashboard ← **VOCÊ PRECISA FAZER**

### ✅ IA WhatsApp:
- [x] Prompt SDR consultivo implementado
- [x] Link de cadastro adicionado ao Seller Stage
- [x] Sistema anti-loop funcionando
- [x] Histórico expandido (10 mensagens)

### ⚠️ Sistema de Planos (Dashboard):
- [x] Sistema implementado com dados mock
- [ ] Integrar com IA real (OpenAI) para gerar planos personalizados
- [ ] Criar endpoint de geração individual por área
- [ ] Validar dados reais do perfil do usuário

**Nota:** O sistema de geração de planos está funcional mas usando dados mock (simulados). Para torná-lo 100% real, seria necessário:
1. Criar um prompt específico para cada área (Físico, Alimentar, Emocional, Espiritual)
2. Chamar a API do OpenAI com os dados do perfil do usuário
3. Parsear a resposta e salvar no formato correto

Isso pode ser feito em uma próxima sprint. Por enquanto, o mock já permite testar o fluxo completo.
