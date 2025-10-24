import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * API de diagnóstico para verificar variáveis de ambiente
 * Acesse: /api/debug-env
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Lista de variáveis para verificar
  const envVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET", 
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "SB_SECRET_KEY" // Verificar se esta existe
  ];

  const envStatus: Record<string, string> = {};

  envVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      envStatus[varName] = "❌ NOT_SET";
    } else if (value.startsWith("${") && value.endsWith("}")) {
      envStatus[varName] = `⚠️ REFERENCE: ${value}`;
    } else if (value.length > 20) {
      envStatus[varName] = `✅ SET (${value.substring(0, 8)}...)`;
    } else {
      envStatus[varName] = `✅ SET (${value})`;
    }
  });

  // Verificar se referências estão sendo resolvidas
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sbSecretKey = process.env.SB_SECRET_KEY;
  
  let resolutionStatus = "";
  // eslint-disable-next-line no-template-curly-in-string
  if (supabaseServiceKey === "${SB_SECRET_KEY}") {
    if (sbSecretKey) {
      resolutionStatus = "⚠️ SUPABASE_SERVICE_ROLE_KEY está como referência, mas SB_SECRET_KEY existe";
    } else {
      resolutionStatus = "❌ SUPABASE_SERVICE_ROLE_KEY é referência para SB_SECRET_KEY que NÃO EXISTE";
    }
  } else if (supabaseServiceKey && supabaseServiceKey.startsWith("eyJ")) {
    resolutionStatus = "✅ SUPABASE_SERVICE_ROLE_KEY tem valor JWT válido";
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || "development",
    variables: envStatus,
    resolution: resolutionStatus,
    note: "Este endpoint deve ser removido em produção"
  });
}