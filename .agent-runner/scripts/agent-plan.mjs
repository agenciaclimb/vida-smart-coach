import "dotenv/config";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const OUT_DIR = ".agent/out";
const DOC_PATH = process.env.DOC_PATH || "docs/documento_mestre.md";
const TASKS_DIR = "agent_tasks";
const KNOWLEDGE_DIR = "domain_knowledge";
const MAX_TASK_TEXT = 60000;
const MAX_PLAYBOOK_TEXT = 20000;
const MAX_KNOWLEDGE_TEXT = 80000;

const PROVIDER = (process.env.PROVIDER || "openai").toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro";

function readFileSafe(p) {
  try { return fs.readFileSync(p, "utf-8"); }
  catch { return ""; }
}
function nowIso() {
  return new Date().toISOString();
}

async function callOpenAI(messages) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.2 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI erro");
  return data?.choices?.[0]?.message?.content || "";
}

async function callGemini(messages) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
  const contents = messages.map(m => ({
    role: m.role === "user" ? "user" : (m.role === "system" ? "user" : "model"),
    parts: [{ text: m.content }]
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini erro");
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
  return text;
}

async function callLLM(messages) {
  if (PROVIDER === "gemini") return callGemini(messages);
  return callOpenAI(messages);
}

function run(cmd, args) {
  const out = spawnSync(cmd, args, { encoding: "utf-8" });
  return (out.stdout || "") + (out.stderr || "");
}

function splitSections(text) {
  const out = {};
  let current = null;
  text.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*(?:#{1,6}\s+)?(PLAN|PATCH|TEST|DOC)\s*[:\-]?/i);
    if (m) {
      current = m[1].toUpperCase();
      out[current] = out[current] || "";
      return;
    }
    if (current) out[current] += line + "\n";
  });
  return out;
}

function cleanPatch(raw) {
  if (!raw) return "";
  const withoutFences = raw
    .split(/\r?\n/)
    .filter(line => !/^`/.test(line.trim()))
    .map(line => line.replace(/[ \t]+$/g, ""))
    .join("\n");
  const trimmed = withoutFences.trim();
  if (!trimmed) return "";
  const hasDiffMarkers = /^(diff --git|---\s|\+\+\+\s|@@\s|Index:)/m.test(trimmed);
  if (!hasDiffMarkers) return "";
  return trimmed.endsWith("\n") ? trimmed : trimmed + "\n";
}function loadAgentTaskContext() {
  const payload = { tasksText: "", playbookText: "" };
  if (!fs.existsSync(TASKS_DIR)) return payload;

  try {
    const entries = fs.readdirSync(TASKS_DIR)
      .filter(name => name.toLowerCase().endsWith(".yaml") || name.toLowerCase().endsWith(".yml"))
      .sort();

    const pieces = [];
    for (const file of entries) {
      const raw = readFileSafe(path.join(TASKS_DIR, file)).trim();
      if (!raw) continue;
      pieces.push(`### ${file}\n${raw}`);
    }

    const joined = pieces.join("\n\n");
    payload.tasksText = joined.length > MAX_TASK_TEXT
      ? joined.slice(0, MAX_TASK_TEXT) + "\n... (truncado)"
      : joined;

    const playbookPath = path.join(TASKS_DIR, "PLAYBOOK.md");
    const playbook = readFileSafe(playbookPath).trim();
    if (playbook) {
      payload.playbookText = playbook.length > MAX_PLAYBOOK_TEXT
        ? playbook.slice(0, MAX_PLAYBOOK_TEXT) + "\n... (truncado)"
        : playbook;
    }
  } catch (err) {
    payload.tasksText = `Erro ao ler agent_tasks: ${err.message || err}`;
  }

  return payload;
}

function loadKnowledgeBase() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return "";
  try {
    const entries = fs.readdirSync(KNOWLEDGE_DIR)
      .filter(name => name.toLowerCase().match(/\.(md|txt)$/))
      .sort();
    const pieces = entries
      .map(file => {
        const raw = readFileSafe(path.join(KNOWLEDGE_DIR, file)).trim();
        if (!raw) return "";
        return `### ${file}\n${raw}`;
      })
      .filter(Boolean);
    if (pieces.length === 0) return "";
    const joined = pieces.join("\n\n");
    return joined.length > MAX_KNOWLEDGE_TEXT
      ? joined.slice(0, MAX_KNOWLEDGE_TEXT) + "\n... (truncado)"
      : joined;
  } catch (err) {
    return `Erro ao ler domain_knowledge: ${err.message || err}`;
  }
}

async function main() {
  const doc = readFileSafe(DOC_PATH);
  const gitStatus = readFileSafe(".git/HEAD") ? run("git", ["status", "--porcelain=v1"]) : "";
  const { tasksText, playbookText } = loadAgentTaskContext();
  const knowledgeText = loadKnowledgeBase();

  const promptBase = "Voce e o Agente Vida Smart. Siga o Documento Mestre e o pacote de tarefas.\n" +
    "Incorpore o conhecimento de dominio fornecido. Entregue PLAN, PATCH, TEST, DOC. PRs curtos e testaveis. " +
    "O PATCH deve ser um diff no formato unificado, compativel com ''git apply''. Mesmo em auditorias, registre um diff que crie ou atualize relatorios em agent_outputs/ (ou ajuste arquivos relevantes) com as conclusoes, usando o formato: diff --git, new file mode, index 0000000..1111111, --- /dev/null, +++ b/caminho, @@ -0,0 +N @@. " +
    "Nunca deixe a secao PATCH vazia nem apenas textual. Para arquivos novos, use o formato de criacao de arquivo do diff.";

  const playbookSection = playbookText
    ? `\n\n--- Playbook do Agente ---\n${playbookText}\n--- Fim ---`
    : "";
  const tasksSection = tasksText
    ? `\n\n--- Agent Tasks YAML ---\n${tasksText}\n--- Fim ---`
    : "";
  const knowledgeSection = knowledgeText
    ? `\n\n--- Conhecimento de Dominio ---\n${knowledgeText}\n--- Fim ---`
    : "";

  const messages = [
    { role: "system", content: "Voce e um engenheiro de software senior." },
    {
      role: "user",
      content: `${promptBase}\n\n--- Documento Mestre ---\n${doc.slice(0, 180000)}\n--- Fim ---\n\n--- git status ---\n${gitStatus}\n--- Fim ---${playbookSection}${tasksSection}${knowledgeSection}`
    }
  ];

  let text = "";
  try {
    text = await callLLM(messages);
  } catch (e) {
    const fallback = PROVIDER === "gemini" ? "openai" : "gemini";
    try {
      text = await (fallback === "gemini" ? callGemini(messages) : callOpenAI(messages));
    } catch (e2) {
      text = `PLAN: Falha ao chamar LLM (${PROVIDER} e fallback ${fallback}).\nPATCH:\n\nTEST:\n\nDOC:\nErro: ${e.message} | Fallback: ${e2.message}`;
    }
  }

  const sections = splitSections(text);
  const plan = sections.PLAN || text;
  const diff = cleanPatch(sections.PATCH || "");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "llm_output.txt"), text, "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "plan.md"), plan, "utf-8");
  fs.writeFileSync(path.join(OUT_DIR, "patch.diff"), diff, "utf-8");
  fs.appendFileSync(path.join(OUT_DIR, "log.txt"), `[${nowIso()}] PLAN gerado (provider: ${PROVIDER}).\n`, "utf-8");

  console.log("[agent-plan] PLAN e PATCH gerados em .agent/out");
}

await main();






