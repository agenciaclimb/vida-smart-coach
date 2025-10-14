-- fix: Adiciona políticas RLS ausentes para gamification, user_profiles e daily_activities
--
-- PROBLEMA:
-- Várias views e endpoints estavam inacessíveis (erro 403) para os usuários
-- porque as tabelas base `gamification`, `user_profiles` e `daily_activities`
-- tinham RLS habilitado mas não possuíam políticas de SELECT, bloqueando todo o acesso.
--
-- SOLUÇÃO:
-- Adiciona políticas de SELECT, INSERT e UPDATE para as tabelas, garantindo
-- que os usuários autenticados possam acessar e modificar apenas seus próprios dados.

-- Políticas para a tabela 'gamification'
CREATE POLICY "Usuários podem ver seus próprios dados de gamificação"
ON public.gamification FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios dados de gamificação"
ON public.gamification FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios dados de gamificação"
ON public.gamification FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas para a tabela 'user_profiles'
CREATE POLICY "Usuários podem ver seus próprios perfis"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- Políticas para a tabela 'daily_activities'
CREATE POLICY "Usuários podem ver suas próprias atividades diárias"
ON public.daily_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias atividades diárias"
ON public.daily_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias atividades diárias"
ON public.daily_activities FOR UPDATE
USING (auth.uid() = user_id);

-- Nota: INSERT em user_profiles é gerenciado pelo trigger handle_new_user,
-- então uma política de INSERT explícita não é necessária para o fluxo normal de criação de usuário.