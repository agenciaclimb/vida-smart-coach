import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, fullName, email, password } = await req.json().catch(() => ({}));
    const phoneClean = String(phone ?? "").replace(/\D/g, "");

    if (!phoneClean && !email) {
      return new Response(JSON.stringify({ ok: false, error: "phone or email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    let existingUser = null;
    if (phoneClean) {
      const { data: existingByPhone } = await supabase
        .from("user_profiles")
        .select("id, phone, email")
        .eq("phone", phoneClean)
        .maybeSingle();
      
      if (existingByPhone) existingUser = existingByPhone;
    }
    
    if (!existingUser && email) {
      const { data: existingByEmail } = await supabase
        .from("user_profiles")
        .select("id, phone, email")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      
      if (existingByEmail) existingUser = existingByEmail;
    }

    let userId = existingUser?.id;
    const referralToken = crypto.randomUUID();

    if (!userId) {
      const randomPassword = password || Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const authOptions = {
        user_metadata: {
          full_name: fullName || "Usuário",
          role: "client",
        }
      };

      if (phoneClean) {
        Object.assign(authOptions, {
          phone: phoneClean,
          phone_confirm: true,
          password: randomPassword,
        });
      } else if (email) {
        Object.assign(authOptions, {
          email: email.toLowerCase(),
          email_confirm: true,
          password: randomPassword,
        });
      }

      console.log("Creating user with options:", JSON.stringify({
        ...authOptions,
        password: "REDACTED"
      }));

      const { data: created, error: createError } = await supabase.auth.admin.createUser(authOptions);

      if (createError) {
        console.error("User creation error:", createError);
        return new Response(
          JSON.stringify({ ok: false, error: createError.message }),
          { 
            status: createError.status || 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = created?.user?.id;
      
      if (!userId) {
        throw new Error("Failed to create user");
      }

      const { data: profileExists } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();
      
      if (!profileExists) {
        console.log("Profile not created by trigger, creating manually");
        
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert({
            id: userId,
            phone: phoneClean || null,
            email: email?.toLowerCase() || null,
            full_name: fullName || "Usuário",
            name: fullName || "Usuário",
            role: "client",
            activity_level: "moderate",
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }
    }

    const { data: base } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "app_base_url")
      .maybeSingle();

    const baseUrl = base?.value || Deno.env.get("APP_BASE_URL") || "";
    const referralUrl = baseUrl ? `${baseUrl}/register?ref=${referralToken}` : null;

    return new Response(
      JSON.stringify({ 
        ok: true, 
        userId, 
        phone: phoneClean || null,
        email: email?.toLowerCase() || null,
        referralUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("account-upsert ERROR:", error.message, error.stack);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
