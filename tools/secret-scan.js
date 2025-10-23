#!/usr/bin/env node
/**
 * Secret scanner for staged changes.
 * Fails the commit if it finds likely secrets in the staged diff.
 */
import { execSync } from 'child_process';

function getStagedDiff() {
  try {
    return execSync('git diff --cached -U0', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return '';
  }
}

// Curated patterns of secrets (keep focused to reduce false positives)
const patterns = [
  /sb_secret_[A-Za-z0-9_\-]+/g,                 // Supabase Service Role key
  /\bsk_(live|test)_[A-Za-z0-9]+/g,             // Stripe secret keys
  /\bwhsec_[A-Za-z0-9]+/g,                      // Stripe webhook secret
  /\bsk-(proj-)?[A-Za-z0-9_-]{20,}/g,           // OpenAI keys (sk-... or sk-proj-...)
  /\bAIza[0-9A-Za-z\-_]{35}\b/g,               // Google API key
  /VSC_INTERNAL_SECRET_[A-Za-z0-9_\-]+/g,       // Internal function secret
  /EVOLUTION_(API_SECRET|API_TOKEN|WEBHOOK)_?=?.*/g, // Evolution tokens in env-like diffs
];

// Block committing actual .env files (except .env.example)
const blockedEnvFiles = /\+\+\+ b\/(.*\.env(\..*)?)\n/; // parse file headers in diff

function main() {
  const diff = getStagedDiff();
  if (!diff) return;

  // Block .env* files except .env.example
  const envFileHeaders = [...diff.matchAll(/\+\+\+ b\/([^\n]+)/g)].map(m => m[1]);
  const blocked = envFileHeaders.filter(p => /(^|\/)\.env(\..*)?$/.test(p) && !p.endsWith('.env.example'));
  if (blocked.length) {
    console.error('\n❌ Commit bloqueado: arquivos de ambiente detectados:', blocked.join(', '));
    console.error('Regra: Nunca commitar .env* (use .env.example com placeholders).');
    process.exit(1);
  }

  // Scan for patterns
  const violations = [];
  for (const re of patterns) {
    const matches = diff.match(re);
    if (matches) {
      violations.push({ pattern: re.toString(), samples: [...new Set(matches)].slice(0, 3) });
    }
  }

  if (violations.length) {
    console.error('\n❌ Commit bloqueado: possíveis segredos encontrados no diff staged.');
    for (const v of violations) {
      console.error(`- Padrão: ${v.pattern}`);
      v.samples.forEach(s => console.error(`  Exemplo: ${s.substring(0, 120)}${s.length>120?'...':''}`));
    }
    console.error('\nComo proceder:');
    console.error('- Remova chaves do código (use process.env / import.meta.env)');
    console.error('- Se houve exposição, rode rotação de chaves (ver seção 5.3.7 do Documento Mestre)');
    process.exit(1);
  }
}

main();
