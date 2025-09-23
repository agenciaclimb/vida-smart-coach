import fs from "node:fs";

const file = "supabase/migrations/20250917162110_2025-09-17_codex_fix_pack.sql";
let sql = fs.readFileSync(file, "utf8");

// Encontra padroes: '...json...'::jsonb com barras invertidas internas
// Captura o conteudo entre aspas simples antes de ::jsonb
const re = /'((?:\\'|[^'])*)'::jsonb/g;

sql = sql.replace(re, (_m, inner) => {
  // desescapa \" -> "
  let unescaped = inner.replace(/\"/g, '"');
  // desescapa \\n, \\t etc (opcional)
  unescaped = unescaped.replace(/\\\\/g, "\\");
  // mantem unico: $$...$$::jsonb
  return `$$${unescaped}$$::jsonb`;
});

fs.writeFileSync(file, sql);
console.log("OK: JSON escapado convertido para $$...$$::jsonb em", file);
