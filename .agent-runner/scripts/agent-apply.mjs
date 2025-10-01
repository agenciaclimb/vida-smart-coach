import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const OUT_DIR = ".agent/out";
const PATCH_FILE = path.join(OUT_DIR, "patch.diff");
const LOG_FILE = path.join(OUT_DIR, "log.txt");

function nowIso() {
  return new Date().toISOString();
}

function run(cmd, args, opts = {}) {
  const out = spawnSync(cmd, args, { encoding: "utf-8", ...opts });
  const all = (out.stdout || "") + (out.stderr || "");
  return { code: out.status ?? 0, out: all };
}

function runShell(command) {
  if (!command) return { code: 0, out: "" };
  if (process.platform === "win32") {
    return run("powershell", ["-NoLogo", "-NoProfile", "-Command", command]);
  }
  return run("bash", ["-lc", command]);
}

function log(msg) {
  fs.appendFileSync(LOG_FILE, `[${nowIso()}] ${msg}\n`, "utf-8");
  console.log(msg);
}

function detectGitRepo() {
  if (fs.existsSync(path.resolve(".git"))) {
    return { ok: true, root: process.cwd() };
  }
  const status = run("git", ["rev-parse", "--is-inside-work-tree"]);
  if (status.code === 0 && status.out.trim() === "true") {
    const root = run("git", ["rev-parse", "--show-toplevel"]);
    return { ok: true, root: (root.out || "").trim() || process.cwd() };
  }
  return { ok: false, root: "" };
}

function parseFilesFromDiff(diffText) {
  const files = new Set();
  const regex = /^\+\+\+ b\/(.+)$/gm;
  let match;
  while ((match = regex.exec(diffText)) !== null) {
    const file = match[1].trim();
    if (file && file !== "/dev/null") files.add(file);
  }
  return Array.from(files);
}

function categorize(files) {
  return {
    frontend: files.some(f => f.startsWith("src/") || f.endsWith(".tsx") || f.endsWith(".jsx")),
    supabase: files.some(f => f.startsWith("supabase/") || f.startsWith("sql/") || f.endsWith(".sql")),
    scripts: files.some(f => f.startsWith("scripts/") || f.endsWith(".ps1") || f.endsWith(".sh")),
    docs: files.some(f => f.startsWith("docs/") || f.endsWith(".md"))
  };
}

function runTargetedValidations(categories) {
  const commands = [];
  const missing = [];
  const frontCmd = process.env.AGENT_VALIDATE_FRONTEND;
  const supabaseCmd = process.env.AGENT_VALIDATE_SUPABASE;
  const scriptsCmd = process.env.AGENT_VALIDATE_SCRIPTS;
  if (categories.frontend) {
    commands.push({ name: "frontend", cmd: frontCmd });
    if (!frontCmd) missing.push("AGENT_VALIDATE_FRONTEND");
  }
  if (categories.supabase) {
    commands.push({ name: "supabase", cmd: supabaseCmd });
    if (!supabaseCmd) missing.push("AGENT_VALIDATE_SUPABASE");
  }
  if (categories.scripts) {
    commands.push({ name: "scripts", cmd: scriptsCmd });
    if (!scriptsCmd) missing.push("AGENT_VALIDATE_SCRIPTS");
  }
  const executed = [];
  for (const { name, cmd } of commands) {
    if (!cmd) continue;
    log(`[agent-apply] Executando validacao ${name}: ${cmd}`);
    const res = runShell(cmd);
    executed.push({ name, res });
    if (res.code !== 0) {
      log(`[agent-apply] Validacao ${name} falhou: ${res.out}`);
      return { ok: false, executed, missing };
    }
    log(`[agent-apply] Validacao ${name} OK.`);
  }
  return { ok: true, executed, missing };
}

async function main() {
  const diff = fs.existsSync(PATCH_FILE) ? fs.readFileSync(PATCH_FILE, "utf-8").trim() : "";
  if (!diff) {
    log("[agent-apply] Nenhum PATCH encontrado apos gerar plano. Verifique se o LLM retornou bloco # PATCH.");
    return;
  }

  const gitInfo = detectGitRepo();
  if (!gitInfo.ok) {
    log("[agent-apply] Nenhum repositorio Git detectado; pulando aplicacao automatica do patch.");
    return;
  } else if (gitInfo.root && gitInfo.root !== process.cwd()) {
    log(`[agent-apply] Repo detectado em ${gitInfo.root}`);
  }

  const filesTouched = parseFilesFromDiff(diff);
  if (filesTouched.length) {
    log(`[agent-apply] Arquivos afetados: ${filesTouched.join(", ")}`);
  }
  const categories = categorize(filesTouched);

  const apply = run("git", ["apply", "--index", "--whitespace=fix", PATCH_FILE]);
  if (apply.code !== 0) {
    log("[agent-apply] Falha ao aplicar patch:\n" + apply.out);
    return;
  }

  const targeted = runTargetedValidations(categories);
  if (targeted.missing && targeted.missing.length) {
    log(`[agent-apply] Validacoes especificas nao configuradas: ${targeted.missing.join(", ")}. Defina as variaveis correspondentes para aumentar a cobertura.`);
  }
  if (!targeted.ok) {
    run("git", ["reset", "--hard"]);
    return;
  }

  const isWindows = process.platform === "win32";
  const cmd = isWindows ? "powershell" : "bash";
  const script = isWindows ? "./scripts/validate.ps1" : "./scripts/validate.sh";
  const args = isWindows
    ? ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script]
    : ["-lc", script];
  const val = run(cmd, args);
  if (val.code !== 0) {
    log("[agent-apply] Validacoes falharam:\n" + val.out);
    run("git", ["reset", "--hard"]);
    return;
  }

  const name = process.env.GIT_COMMIT_AUTHOR_NAME || "Agente Vida Smart";
  const email = process.env.GIT_COMMIT_AUTHOR_EMAIL || "bot@vida-smart.local";
  run("git", ["config", "user.name", name]);
  run("git", ["config", "user.email", email]);
  run("git", ["add", "-A"]);
  const commit = run("git", ["commit", "-m", "chore(agent): proximo passo Vida Smart"]);
  if (commit.code !== 0) {
    log("[agent-apply] Nada para commitar: " + commit.out);
    return;
  }

  try {
    const docPath = process.env.DOC_PATH || "docs/documento_mestre.md";
    const planPath = path.join(OUT_DIR, "plan.md");
    const planText = fs.existsSync(planPath) ? fs.readFileSync(planPath, "utf-8") : "";
    const when = new Date().toLocaleString();
    if (fs.existsSync(docPath)) {
      const header = `\n\n---\n## Changelog do Agente - ${when}\n`;
      const body = planText ? `**Plano executado:**\n\n${planText}\n` : "_(Plano indisponivel neste ciclo)_\n";
      fs.appendFileSync(docPath, header + body, "utf-8");
      run("git", ["add", docPath]);
      run("git", ["commit", "--amend", "--no-edit"]);
    }
  } catch (e) {
    log("[agent-apply] Falha ao atualizar Documento Mestre: " + e.message);
  }

  const remote = run("git", ["remote", "-v"]).out;
  if (remote.includes("origin")) {
    const push = run("git", ["push", "origin", "HEAD:feat/vida-agent"]);
    log("[agent-apply] Push:\n" + push.out);
  } else {
    log("[agent-apply] Nenhum remoto configurado. Commit local realizado.");
  }
}

await main();
