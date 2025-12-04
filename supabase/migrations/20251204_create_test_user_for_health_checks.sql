-- HOTFIX PROTOCOL 1.0 - Criar usuário de teste
-- Causa raiz: userId "test-user-id" não é UUID válido
-- Solução: Criar usuário de teste com UUID válido para health checks

-- UUID fixo para testes: 00000000-0000-0000-0000-000000000001
DO $$
BEGIN
  -- Inserir usuário de teste se não existir
  INSERT INTO user_profiles (
    id,
    full_name,
    age,
    current_weight,
    target_weight,
    height,
    goal_type,
    activity_level,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Health Check Test User',
    30,
    75,
    70,
    175,
    'general_health',
    'sedentary',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now();
    
  RAISE NOTICE 'Usuário de teste criado/atualizado com sucesso';
END $$;

-- Verificar se foi criado
SELECT id, full_name, goal_type, activity_level 
FROM user_profiles 
WHERE id = '00000000-0000-0000-0000-000000000001';
