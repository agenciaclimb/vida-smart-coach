Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok", { status: 200 });

  const incoming = req.headers.get("apikey") ?? req.headers.get("x-api-key") ?? "";
  const evoKey = Deno.env.get("EVOLUTION_API_KEY") ?? "";
  if (evoKey && incoming && incoming !== evoKey) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  console.log("Evolution inbound:", body);

  return new Response(JSON.stringify({ received: true }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
});
