
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT user_profiles_id_fkey ON user_profiles IS 'Fixed foreign key constraint to reference auth.users instead of users table';

GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;

DO $$
BEGIN
    RAISE NOTICE 'Fixed user_profiles foreign key constraint to reference auth.users table';
END $$;
