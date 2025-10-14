-- Atualiza a função para inicializar o status de trial e cobrança para novos usuários.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, trial_started_at, trial_expires_at, billing_status)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        timezone('UTC', now()),
        timezone('UTC', now()) + interval '7 days',
        'trialing'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garante que o trigger está aplicado à tabela de usuários do Supabase Auth.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
