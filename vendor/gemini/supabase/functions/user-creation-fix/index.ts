import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const supabase = (SUPABASE_URL && SERVICE_ROLE)
      ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } })
      : null;

    let body: any = {};
    try {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) body = await req.json();
      else { const txt = await req.text(); try { body = JSON.parse(txt); } catch {} }
    } catch {}

    console.log("user-creation-fix received:", body);

    if (supabase && body?.user_id) {
      const { error } = await supabase.from("user_profiles").insert({ 
        id: body.user_id,
        name: "Usuário",
        email: `user${body.user_id.slice(0,8)}@temp.com`,
        activity_level: "moderate"
      }).select("id");
      if (error && !/duplicate key/i.test(error.message)) console.error("user_profiles insert error:", error.message);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", ...headers } });
  } catch (e) {
    console.error("edge hotfix error:", e);
    return new Response(JSON.stringify({ ok: true, softError: String(e) }), { status: 200, headers: { "Content-Type": "application/json", ...headers } });
  }
});
