import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      },
    });

    const { email, password, full_name, phone, metadata } = await req.json();

    let userId: string | undefined;
    let session = null;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            full_name,
            phone,
          },
        },
      },
    );

    if (signUpError) {
      if (
        (signUpError as any).code === "user_already_registered" ||
        (signUpError as any).status === 422 ||
        (signUpError as any).status === 409 ||
        signUpError.message.includes("User already registered")
      ) {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
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
      userId = signUpData.user?.id;
      session = signUpData.session;
    }

    if (!userId) {
      throw new Error("Could not determine user id");
    }

    const profilePayload = {
      id: userId,
      full_name,
      name: full_name,
      phone,
      whatsapp: phone,
      email,
      ...(metadata ?? {}),
    };

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert(profilePayload)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Profile upsert failed: ${profileError.message}`);
    }

    const referralCode = Math.random().toString(36).substring(2, 12);
    const { error: referralError } = await supabase.from("referrals").insert({
      referrer_id: userId,
      referral_code: referralCode,
      status: "pending",
      points_earned: 0,
    });

    if (referralError) {
      console.error("Failed to create referral code:", referralError.message);
    }

    return new Response(JSON.stringify({ user: profile, session }), {
      headers: { ...headers, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in upsert-user:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
