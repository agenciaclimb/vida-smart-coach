-- Migration: Sistema de Métricas WhatsApp
-- Data: 2025-12-03
-- Objetivo: Observabilidade completa do fluxo WhatsApp → IA → Evolution

-- ================================================
-- TABELA: whatsapp_metrics
-- ================================================
CREATE TABLE IF NOT EXISTS whatsapp_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message_length INT NOT NULL,
  stage TEXT,
  ia_latency_ms INT,
  evolution_latency_ms INT,
  total_latency_ms INT NOT NULL,
  error TEXT,
  error_type TEXT, -- 'ia_timeout', 'ia_error', 'evolution_error', 'rate_limit', etc
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_emergency BOOLEAN DEFAULT FALSE,
  loop_detected BOOLEAN DEFAULT FALSE,
  circuit_breaker_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE whatsapp_metrics IS 'Métricas de performance e qualidade do sistema WhatsApp';
COMMENT ON COLUMN whatsapp_metrics.ia_latency_ms IS 'Latência da chamada ao ia-coach-chat em ms';
COMMENT ON COLUMN whatsapp_metrics.evolution_latency_ms IS 'Latência do envio via Evolution API em ms';
COMMENT ON COLUMN whatsapp_metrics.total_latency_ms IS 'Latência total da interação (webhook recebido → resposta enviada)';
COMMENT ON COLUMN whatsapp_metrics.error_type IS 'Classificação do erro para análise';

-- ================================================
-- ÍNDICES
-- ================================================
CREATE INDEX idx_whatsapp_metrics_created_at ON whatsapp_metrics(created_at DESC);
CREATE INDEX idx_whatsapp_metrics_stage ON whatsapp_metrics(stage) WHERE stage IS NOT NULL;
CREATE INDEX idx_whatsapp_metrics_user_id ON whatsapp_metrics(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_whatsapp_metrics_error ON whatsapp_metrics(created_at DESC) WHERE error IS NOT NULL;
CREATE INDEX idx_whatsapp_metrics_latency ON whatsapp_metrics(total_latency_ms) WHERE total_latency_ms > 3000;

-- ================================================
-- RLS (Row Level Security)
-- ================================================
ALTER TABLE whatsapp_metrics ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias métricas
CREATE POLICY "Users can view own metrics" ON whatsapp_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Apenas service role pode inserir
CREATE POLICY "Service role can insert metrics" ON whatsapp_metrics
  FOR INSERT WITH CHECK (true);

-- ================================================
-- VIEW: Dashboard de Performance
-- ================================================
CREATE OR REPLACE VIEW v_whatsapp_performance_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE error IS NOT NULL) AS errors,
  ROUND(COUNT(*) FILTER (WHERE error IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS error_rate_pct,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY total_latency_ms)) AS p50_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)) AS p95_latency_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_latency_ms)) AS p99_latency_ms,
  ROUND(AVG(total_latency_ms)) AS avg_latency_ms,
  MAX(total_latency_ms) AS max_latency_ms,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(*) FILTER (WHERE is_duplicate) AS duplicates,
  COUNT(*) FILTER (WHERE is_emergency) AS emergencies,
  COUNT(*) FILTER (WHERE loop_detected) AS loops_detected,
  COUNT(*) FILTER (WHERE circuit_breaker_active) AS circuit_breaker_triggers
FROM whatsapp_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

COMMENT ON VIEW v_whatsapp_performance_summary IS 'Dashboard de performance agregado por hora (últimas 24h)';

-- ================================================
-- VIEW: Métricas por Estágio
-- ================================================
CREATE OR REPLACE VIEW v_whatsapp_stage_performance AS
SELECT 
  stage,
  COUNT(*) AS total_interactions,
  ROUND(AVG(total_latency_ms)) AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)) AS p95_latency_ms,
  COUNT(*) FILTER (WHERE error IS NOT NULL) AS errors,
  ROUND(COUNT(*) FILTER (WHERE error IS NOT NULL)::NUMERIC / COUNT(*) * 100, 2) AS error_rate_pct,
  ROUND(AVG(ia_latency_ms)) AS avg_ia_latency_ms,
  ROUND(AVG(evolution_latency_ms)) AS avg_evolution_latency_ms
FROM whatsapp_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND stage IS NOT NULL
GROUP BY stage
ORDER BY total_interactions DESC;

COMMENT ON VIEW v_whatsapp_stage_performance IS 'Performance por estágio da jornada (últimos 7 dias)';

-- ================================================
-- VIEW: Alertas de Performance
-- ================================================
CREATE OR REPLACE VIEW v_whatsapp_alerts AS
WITH recent_metrics AS (
  SELECT 
    DATE_TRUNC('minute', created_at) AS minute,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE error IS NOT NULL) AS errors,
    ROUND(AVG(total_latency_ms)) AS avg_latency,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_latency_ms)) AS p95_latency
  FROM whatsapp_metrics
  WHERE created_at >= NOW() - INTERVAL '10 minutes'
  GROUP BY minute
)
SELECT 
  minute,
  total,
  errors,
  avg_latency,
  p95_latency,
  CASE 
    WHEN p95_latency > 3000 THEN '🔴 HIGH LATENCY'
    WHEN errors::NUMERIC / total > 0.05 THEN '🔴 HIGH ERROR RATE'
    WHEN p95_latency > 1500 THEN '🟡 DEGRADED PERFORMANCE'
    ELSE '🟢 OK'
  END AS status,
  CASE 
    WHEN p95_latency > 3000 THEN 'p95 latency > 3s'
    WHEN errors::NUMERIC / total > 0.05 THEN 'error rate > 5%'
    WHEN p95_latency > 1500 THEN 'p95 latency > 1.5s'
    ELSE NULL
  END AS alert_reason
FROM recent_metrics
WHERE errors::NUMERIC / total > 0.02 OR p95_latency > 1000
ORDER BY minute DESC;

COMMENT ON VIEW v_whatsapp_alerts IS 'Alertas em tempo real baseados em thresholds (últimos 10 minutos)';

-- ================================================
-- FUNÇÃO: Limpar métricas antigas
-- ================================================
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM whatsapp_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_whatsapp_metrics IS 'Remove métricas com mais de 90 dias (executar mensalmente via cron)';

-- ================================================
-- VALIDAÇÃO
-- ================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela whatsapp_metrics criada';
  RAISE NOTICE '✅ 5 índices criados';
  RAISE NOTICE '✅ RLS policies aplicadas';
  RAISE NOTICE '✅ 3 views criadas: v_whatsapp_performance_summary, v_whatsapp_stage_performance, v_whatsapp_alerts';
  RAISE NOTICE '✅ Função cleanup_old_whatsapp_metrics criada';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Dashboard queries:';
  RAISE NOTICE '   SELECT * FROM v_whatsapp_performance_summary LIMIT 24;';
  RAISE NOTICE '   SELECT * FROM v_whatsapp_stage_performance;';
  RAISE NOTICE '   SELECT * FROM v_whatsapp_alerts;';
END $$;
