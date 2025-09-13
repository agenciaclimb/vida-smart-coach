import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import { cors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { fullName, email, password } = await req.json().catch(() => ({}));

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "email required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return new Response(JSON.stringify({ 
        ok: true, 
        userId: existingUser.id, 
        email: existingUser.email,
        message: "User already exists"
      }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    const userPassword = password || Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const authOptions = {
      email: email.toLowerCase(),
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || "Usuário",
        role: "client",
      }
    };

    console.log("Creating user with email:", email.toLowerCase());

    const { data: created, error: createError } = await supabase.auth.admin.createUser(authOptions);

    if (createError) {
      console.error("User creation error:", createError);
      return new Response(
        JSON.stringify({ ok: false, error: createError.message }),
        { 
          status: createError.status || 500,
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
    }

    const userId = created?.user?.id;
    
    if (!userId) {
      throw new Error("Failed to create user - no user ID returned");
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
          email: email.toLowerCase(),
          name: fullName || "Usuário",
          role: "client",
          activity_level: "moderate",
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        userId, 
        email: email.toLowerCase(),
        message: "User created successfully"
      }),
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("account-upsert-fixed-corrected ERROR:", error.message, error.stack);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "Database error creating new user",
      code: "unexpected_failure"
    }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
