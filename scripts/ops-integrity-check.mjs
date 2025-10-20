#!/usr/bin/env node

/**
 * Automação de checagens recorrentes para o projeto Vida Smart Coach.
 *
 * Este script executa verificações leves que não expõem segredos:
 *  - Autenticação Vercel (`vercel whoami`)
 *  - Inventário de variáveis no Vercel (`vercel env ls --json`)
 *  - Comparação de chaves locais (.env.local) x Vercel
 *  - Health check HTTP do Supabase
 *  - Geração de um relatório em Markdown em `agent_outputs/`
 *
 * Dependências:
 *  - Node >= 18 (utiliza `fetch` nativo em 18+)
 *  - `npx` disponível no PATH para acionar `vercel@latest`
 *  - Opcional: `VERCEL_TOKEN` exportado no ambiente (ou definido em `.env.local`)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);
const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'agent_outputs');

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function mask(value) {
  if (!value) return 'N/A';
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function parseEnvFile(filePath) {
  const map = new Map();
  if (!existsSync(filePath)) {
    return map;
  }
  const content = readFileSync(filePath, 'utf8');
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const idx = line.indexOf('=');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      map.set(key, value);
    });
  return map;
}

async function runVercelCommand(args, token) {
  if (!token) {
    return {
      success: false,
      note: 'VERCEL_TOKEN não definido; pule a etapa ou exporte o token antes de executar.'
    };
  }

  try {
    const command = `vercel ${args.join(' ')}`.trim();
    const { stdout, stderr } = await execAsync(command, {
      cwd: ROOT,
      env: {
        ...process.env,
        VERCEL_TOKEN: token,
        npm_config_yes: 'true'
      },
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024
    });

    return {
      success: true,
      stdout: stdout?.trim() ?? '',
      stderr: stderr?.trim() ?? ''
    };
  } catch (error) {
    const stdout = error.stdout?.toString().trim();
    const stderr = error.stderr?.toString().trim();
    return {
      success: false,
      stdout,
      stderr,
      message: error.message
    };
  }
}

async function fetchSupabaseHealth(url, anonKey) {
  if (!url) {
    return { success: false, note: 'SUPABASE_URL não definido.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(new URL('/health', url), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'vida-smart-coach-ops-check/1.0',
        ...(anonKey ? { apikey: anonKey } : {})
      }
    });
    clearTimeout(timeout);

    const text = await response.text();
    const ok = response.ok;
    return {
      success: ok,
      status: response.status,
      body: text.slice(0, 200) // limite para evitar logs imensos
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      success: false,
      message: error.name === 'AbortError' ? 'Request timeout (7s).' : error.message
    };
  }
}

function formatCommandResult(title, result) {
  if (!result) return `### ${title}\n- Resultado: não executado.\n`;

  const lines = [`### ${title}`];

  if (result.note) {
    lines.push(`- Nota: ${result.note}`);
  }

  lines.push(`- Sucesso: ${result.success ? 'Sim' : 'Não'}`);

  if (result.message) {
    lines.push(`- Mensagem: ${result.message}`);
  }

  if (result.stdout) {
    lines.push('```text');
    lines.push(result.stdout);
    lines.push('```');
  }

  if (result.stderr) {
    lines.push('_stderr:_');
    lines.push('```text');
    lines.push(result.stderr);
    lines.push('```');
  }

  return `${lines.join('\n')}\n`;
}

function diffEnvKeys(localKeys, remoteKeys) {
  const localOnly = [...localKeys].filter((key) => !remoteKeys.has(key));
  const remoteOnly = [...remoteKeys].filter((key) => !localKeys.has(key));
  return { localOnly, remoteOnly };
}

async function main() {
  ensureOutputDir();
  const envMap = parseEnvFile(path.join(ROOT, '.env.local'));

  const vercelToken = process.env.VERCEL_TOKEN ?? envMap.get('VERCEL_TOKEN') ?? '';
  const maskedToken = mask(vercelToken);

  const reportSections = [];

  reportSections.push('# Relatório de Checagem Operacional');
  reportSections.push(`- Gerado em: ${new Date().toISOString()}`);
  reportSections.push(`- Diretório: ${ROOT}`);
  reportSections.push(`- Token Vercel detectado: ${maskedToken !== 'N/A' ? maskedToken : 'não encontrado'}`);
  reportSections.push('');

  // 1. vercel whoami
  const whoami = await runVercelCommand(['whoami'], vercelToken);
  reportSections.push(formatCommandResult('Vercel whoami', whoami));

  // 2. vercel env ls (tabela)
  const envListResult = await runVercelCommand(['env', 'ls'], vercelToken);
  let vercelEnvNames = new Set();
  if (envListResult.stdout) {
    const lines = envListResult.stdout.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^Vercel CLI/.test(trimmed)) continue;
      if (/^Retrieving project/.test(trimmed)) continue;
      if (/^>/.test(trimmed)) continue;
      if (/^name\s+value\s+environments/.test(trimmed)) continue;
      if (/^value\s+environments/.test(trimmed)) continue;
      const [name] = trimmed.split(/\s{2,}/);
      if (name && /^[A-Z0-9_]+$/.test(name)) {
        vercelEnvNames.add(name);
      }
    }

    const summaryLines = Array.from(vercelEnvNames)
      .sort()
      .map((name) => `- ${name}`);

    reportSections.push('### Variáveis detectadas no Vercel (apenas nomes)');
    reportSections.push(summaryLines.length ? summaryLines.join('\n') : '- Nenhuma variável retornada.');
    reportSections.push('');
  }
  reportSections.push(formatCommandResult('Vercel env ls', envListResult));

  // 3. Comparação de chaves locais x Vercel
  const localKeys = new Set(envMap.keys());
  const { localOnly, remoteOnly } = diffEnvKeys(localKeys, vercelEnvNames);
  reportSections.push('### Comparação de chaves (.env.local vs. Vercel)');
  reportSections.push(`- Total (.env.local): ${localKeys.size}`);
  reportSections.push(`- Total (Vercel): ${vercelEnvNames.size}`);
  reportSections.push('- Presentes apenas localmente:');
  reportSections.push(localOnly.length ? localOnly.map((key) => `  - ${key}`).join('\n') : '  - Nenhuma.');
  reportSections.push('- Presentes apenas no Vercel:');
  reportSections.push(remoteOnly.length ? remoteOnly.map((key) => `  - ${key}`).join('\n') : '  - Nenhuma.');
  reportSections.push('');

  // 4. Health check Supabase
  const supabaseUrl =
    envMap.get('SUPABASE_URL') ??
    envMap.get('NEXT_PUBLIC_SUPABASE_URL') ??
    envMap.get('VITE_SUPABASE_URL') ??
    '';
  const supabaseAnonKey =
    envMap.get('SUPABASE_ANON_KEY') ??
    envMap.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') ??
    envMap.get('VITE_SUPABASE_ANON_KEY') ??
    '';
  const supabaseHealth = await fetchSupabaseHealth(supabaseUrl, supabaseAnonKey);
  const supabaseLines = [
    '### Supabase Health Check',
    `- URL testada: ${supabaseUrl || 'não configurada'}`,
    `- Header apikey enviado: ${supabaseAnonKey ? mask(supabaseAnonKey) : 'não enviado'}`
  ];
  if (supabaseHealth.note) supabaseLines.push(`- Nota: ${supabaseHealth.note}`);
  supabaseLines.push(`- Sucesso: ${supabaseHealth.success ? 'Sim' : 'Não'}`);
  if (supabaseHealth.status) supabaseLines.push(`- Status HTTP: ${supabaseHealth.status}`);
  if (supabaseHealth.body) {
    supabaseLines.push('```text');
    supabaseLines.push(supabaseHealth.body);
    supabaseLines.push('```');
  }
  if (supabaseHealth.message) supabaseLines.push(`- Erro: ${supabaseHealth.message}`);
  reportSections.push(supabaseLines.join('\n'));
  reportSections.push('');

  const reportContent = reportSections.join('\n');
  const reportPath = path.join(OUTPUT_DIR, `ops-integrity-${timestamp()}.md`);
  writeFileSync(reportPath, reportContent, 'utf8');

  console.log(`Relatório gerado em: ${reportPath}`);
}

main().catch((error) => {
  console.error('Falha ao executar o script de checagem operacional:', error);
  process.exitCode = 1;
});
