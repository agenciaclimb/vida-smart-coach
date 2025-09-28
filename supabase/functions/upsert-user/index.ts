import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}` },
        },
      },
    );

    const {
      email,
      password,
      full_name,
      phone,
      metadata,
    } = await req.json();

    let userId;
    let session = null;

    // First, try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        // If user exists, try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw new Error(`Authentication failed: ${signInError.message}`);
        }
        userId = signInData.user.id;
        session = signInData.session;
      } else {
        throw new Error(`Sign-up failed: ${signUpError.message}`);
      }
    } else {
      userId = signUpData.user.id;
      session = signUpData.session;
    }

    if (!userId) {
      throw new Error("Could not determine user ID.");
    }

    // Upsert profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        full_name,
        phone,
        email,
        ...metadata,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Profile upsert failed: ${profileError.message}`);
    }
    
    // Generate referral link
    const referralCode = Math.random().toString(36).substring(2, 12);
    const { error: referralError } = await supabase
      .from("referrals")
      .insert({
        user_id: userId,
        referral_code: referralCode,
        usage_count: 0,
      });

    if (referralError) {
      console.error("Failed to create referral code:", referralError.message);
    }

    return new Response(JSON.stringify({ user: profile, session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in upsert-user:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});