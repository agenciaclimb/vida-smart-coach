import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const createAuthSQL = `
      -- Create auth schema if it doesn't exist
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create auth.users table with complete structure
      CREATE TABLE IF NOT EXISTS auth.users (
          instance_id uuid,
          id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
          aud character varying(255),
          role character varying(255),
          email character varying(255) UNIQUE,
          encrypted_password character varying(255),
          email_confirmed_at timestamp with time zone,
          invited_at timestamp with time zone,
          confirmation_token character varying(255),
          confirmation_sent_at timestamp with time zone,
          recovery_token character varying(255),
          recovery_sent_at timestamp with time zone,
          email_change_token_new character varying(255),
          email_change character varying(255),
          email_change_sent_at timestamp with time zone,
          last_sign_in_at timestamp with time zone,
          raw_app_meta_data jsonb,
          raw_user_meta_data jsonb,
          is_super_admin boolean,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          phone text UNIQUE DEFAULT NULL,
          phone_confirmed_at timestamp with time zone,
          phone_change text DEFAULT '',
          phone_change_token character varying(255) DEFAULT '',
          phone_change_sent_at timestamp with time zone,
          confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
          email_change_token_current character varying(255) DEFAULT '',
          email_change_confirm_status smallint DEFAULT 0,
          banned_until timestamp with time zone,
          reauthentication_token character varying(255) DEFAULT '',
          reauthentication_sent_at timestamp with time zone
      );

      -- Create necessary indexes
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON auth.users USING btree (email);
      CREATE UNIQUE INDEX IF NOT EXISTS users_phone_key ON auth.users USING btree (phone);
      CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);

      -- Enable Row Level Security
      ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

      -- Create policies for registration and user access
      CREATE POLICY "Enable insert for registration" ON auth.users
      FOR INSERT WITH CHECK (true);

      CREATE POLICY "Users can view own data" ON auth.users
      FOR SELECT USING (auth.uid() = id);

      CREATE POLICY "Users can update own data" ON auth.users
      FOR UPDATE USING (auth.uid() = id);
    `;

    const { data, error } = await supabase.rpc('exec', { sql: createAuthSQL })

    if (error) {
      console.error('Error creating auth tables:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: 'Failed to execute SQL for auth table creation'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auth tables created successfully',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Function execution failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
