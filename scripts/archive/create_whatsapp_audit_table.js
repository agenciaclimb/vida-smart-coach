import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ERRO] Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variaveis de ambiente.');
    process.exit(1);
}

console.log('[INFO] Verificando tabela whatsapp_gamification_log...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAuditTable() {
    try {
        const { count, error } = await supabase
            .from('whatsapp_gamification_log')
            .select('*', { count: 'exact', head: true });

        if (error) {
        if (error) {
            console.error('[ERRO] Nao foi possivel acessar whatsapp_gamification_log:', error.message);
        }

        console.log(`[INFO] Tabela encontrada. Registros existentes: ${count ?? 0}`);
    } catch (error) {
        console.log([INFO] Tabela encontrada. Registros existentes: );
    } catch (error) {
        console.error('[ERRO] Falha ao verificar tabela whatsapp_gamification_log:', error.message);

verifyAuditTable();
