"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/ui/app-shell";

import {
  Hammer,
  Play,
  Loader2,
  RotateCcw,
  Terminal,
  Copy,
  CheckCircle2,
  Save,
  Trash2,
  FolderOpen,
  Bot,
  Sparkles,
  FileCode2,
} from "lucide-react";
import { CodeEditor } from "@/components/forge/code-editor";
import alasql from "@/lib/alasql-browser";

type Lang = "javascript" | "typescript" | "python" | "sql" | "html";

const LANGUAGE = {
  javascript: {
    id: "javascript",
    label: "JavaScript",
    color: "text-yellow-300",
    bg: "bg-yellow-500/10",
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    color: "text-sky-300",
    bg: "bg-sky-500/10",
  },
  python: {
    id: "python",
    label: "Python",
    color: "text-blue-300",
    bg: "bg-blue-500/10",
  },
  sql: {
    id: "sql",
    label: "SQL",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  html: {
    id: "html",
    label: "HTML · Live Preview",
    color: "text-orange-300",
    bg: "bg-orange-500/10",
  },
};

const JS_DEFAULT = `// Run JavaScript safely in an isolated sandbox
function greet(name) {
  return \`Hello, \${name}! 👋\`;
}

console.log(greet("Codempress"));

const nums = [1, 2, 3, 4, 5];
console.log("Sum:", nums.reduce((a, b) => a + b, 0));
console.log("Squares:", nums.map((n) => n * n));
`;

const TS_DEFAULT = `// TypeScript — transpiled in-browser via the TypeScript compiler (CDN),
// then executed in the isolated JS sandbox.
interface Person { name: string; age: number }

function greet({ name, age }: Person): string {
  return \`Hello, \${name}! You are \${age} years old.\`;
}

const person: Person = { name: "Codempress", age: 2026 };
console.log(greet(person));

const nums: number[] = [1, 2, 3, 4, 5];
const doubled: number[] = nums.map((n) => n * 2);
console.log("Doubled:", doubled);
`;

const PY_DEFAULT = `# Run Python in-browser via Pyodide (WebAssembly)
import math, statistics

def greet(name):
    return f"Hello, {name}! 👋"

print(greet("Codempress"))

nums = [1, 2, 3, 4, 5]
print("Sum:", sum(nums))
print("Mean:", round(statistics.mean(nums), 2))
print("Factorial 5:", math.factorial(5))
`;

const SQL_DEFAULT = `-- Run SQL in-browser (AlaSQL over a sample table)
-- A sample "employees" table is created automatically. Try:
SELECT dept, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept
ORDER BY avg_salary DESC;
`;

const HTML_DEFAULT = `<!-- Live browser preview — edit and Run to remount -->
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; background: #0b0f14; color: #e6edf3; }
  .card { max-width: 360px; margin: 0 auto; padding: 20px; border-radius: 16px; background: #161b22; border: 1px solid #30363d; }
  button { padding: 10px 16px; border-radius: 10px; border: none; background: #2f81f7; color: #fff; font-weight: 600; cursor: pointer; }
  #count { font-size: 28px; font-weight: 700; }
</style>
<div class="card">
  <h2>Codempress preview</h2>
  <p id="count">0</p>
  <button onclick="bump()">Click me</button>
</div>
<script>
  let n = 0;
  function bump() { n++; document.getElementById('count').textContent = n; }
</script>
`;

interface LogLine {
  kind: "log" | "warn" | "error" | "info" | "system";
  text: string;
}

export default function Forge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [lang, setLang] = useState<Lang>("javascript");
  const [code, setCode] = useState<string>(JS_DEFAULT);
  const [output, setOutput] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);
  const loadingPyodide = useRef(false);
  const tsCompilerRef = useRef<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [snippetName, setSnippetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [panel, setPanel] = useState<"snippets" | "none">("none");

  async function loadSnippets() {
    try {
      const res = await fetch("/api/playground");
      const data = await res.json();
      if (res.ok) setSnippets(data.snippets || []);
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    if (status === "authenticated") loadSnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function saveSnippet() {
    const name = snippetName.trim() || `${lang}-snippet`;
    setSaving(true);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, name, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSnippetName("");
      await loadSnippets();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSnippet(id: string) {
    await fetch(`/api/playground/${id}`, { method: "DELETE" });
    await loadSnippets();
  }

  function openSnippet(s: any) {
    setLang(s.lang as Lang);
    setCode(s.code);
    setOutput([]);
    setError(null);
    setPanel("none");
  }

  async function askAI() {
    setAiLoading(true);
    setAiAnswer("");
    const question = `I'm learning to code in ${LANGUAGE[lang].label}. Here is my code:\n\n\`\`\`\n${code}\n\`\`\`\n\nHere is the output it produced:\n\`\`\`\n${output
      .map((l) => l.text)
      .join("\n")}\n\`\`\`\n\nPlease explain what this code does, then point out any bugs or improvements. Be concise and beginner-friendly.`;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
      });
      if (!res.ok || !res.body) throw new Error("AI unavailable");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiAnswer((prev) => prev + dec.decode(value, { stream: true }));
      }
    } catch (e: any) {
      setAiAnswer("AI mentor is unavailable right now. Try again in a moment.");
    } finally {
      setAiLoading(false);
    }
  }

  if (status === "unauthenticated") router.push("/login?callbackUrl=/forge");

  const defaults = useMemo(
    () => ({ javascript: JS_DEFAULT, typescript: TS_DEFAULT, python: PY_DEFAULT, sql: SQL_DEFAULT, html: HTML_DEFAULT }),
    []
  );
  const [previewSrc, setPreviewSrc] = useState("");

  // Virtual file system (HTML project mode) — file tree + multi-file editor.
  const [multiFile, setMultiFile] = useState(false);
  const [activeFile, setActiveFile] = useState("index.html");
  const [files, setFiles] = useState<Record<string, string>>({
    "index.html": `<div class="card">
  <h2>Codempress project</h2>
  <p id="count">0</p>
  <button onclick="bump()">Click me</button>
</div>
`,
    "style.css": `body { font-family: system-ui, sans-serif; padding: 24px; background: #0b0f14; color: #e6edf3; }
.card { max-width: 360px; margin: 0 auto; padding: 20px; border-radius: 16px; background: #161b22; border: 1px solid #30363d; }
button { padding: 10px 16px; border-radius: 10px; border: none; background: #2f81f7; color: #fff; font-weight: 600; cursor: pointer; }
#count { font-size: 28px; font-weight: 700; }
`,
    "script.js": `let n = 0;
function bump() { n++; document.getElementById('count').textContent = n; }
`,
  });

  async function resetFiles() {
    setFiles({
      "index.html": `<div class="card">\n  <h2>Codempress project</h2>\n  <p id="count">0</p>\n  <button onclick="bump()">Click me</button>\n</div>\n`,
      "style.css": `body { font-family: system-ui, sans-serif; padding: 24px; background: #0b0f14; color: #e6edf3; }\n.card { max-width: 360px; margin: 0 auto; padding: 20px; border-radius: 16px; background: #161b22; border: 1px solid #30363d; }\nbutton { padding: 10px 16px; border-radius: 10px; border: none; background: #2f81f7; color: #fff; font-weight: 600; cursor: pointer; }\n#count { font-size: 28px; font-weight: 700; }\n`,
      "script.js": `let n = 0;\nfunction bump() { n++; document.getElementById('count').textContent = n; }\n`,
    });
    setActiveFile("index.html");
  }

  // Preload from ?lang= & ?code= (per-topic "Practice in Code Forge").
  useEffect(() => {
    const langParam = searchParams?.get("lang");
    const codeParam = searchParams?.get("code");
    if (langParam && (langParam.split("/")[0] as Lang) in LANGUAGE) {
      const l = langParam.split("/")[0] as Lang;
      setLang(l);
      if (codeParam) {
        setCode(decodeURIComponent(codeParam));
        setOutput([]);
        setPreviewSrc("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function switchLang(next: Lang) {
    if (next === lang) return;
    setLang(next);
    setCode(defaults[next]);
    setOutput([]);
    setError(null);
    setPreviewSrc("");
    setMultiFile(false);
  }

  // Build a virtual-FS page: inject style.css + script.js into index.html.
  function buildProject() {
    const html = (files["index.html"] ?? "").replace(/<\/head>/, `<style>\n${files["style.css"] ?? ""}\n</style></head>`);
    return html + `<script>\n${files["script.js"] ?? ""}\n</script>`;
  }

  function append(prefix: string, text: string, kind: LogLine["kind"] = "log") {
    setOutput((prev) => [...prev, { kind, text }]);
  }

  // ── JavaScript: run inside a sandboxed iframe (isolated from parent) ────────
  async function runJavaScript(src: string) {
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
      const send = (text, kind) => parent.postMessage({type:"forge", kind, text},"*");
      ["log","info","warn","error"].forEach((k) => {
        const orig = console[k];
        console[k] = (...args) => send(
          args.map((a) => typeof a === "object" ? JSON.stringify(a, null, 0) : String(a)).join(" "),
          k === "error" ? "error" : k === "warn" ? "warn" : "log"
        );
      });
      window.onerror = (msg) => send(String(msg), "error");
      try {
        ${src}
      } catch (e) {
        send("ERROR: " + (e && e.message ? e.message : e), "error");
      }
      send("__done__", "system");
    <\/script></body></html>`;

    const iframe = document.createElement("iframe");
    // allow-scripts but NOT allow-same-origin → child cannot touch parent DOM.
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      document.body.removeChild(iframe);
    };
    const onMessage = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || d.type !== "forge") return;
      if (d.text === "__done__") {
        setRunning(false);
        cleanup();
      } else {
        append("", d.text, d.kind);
      }
    };
    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
    iframe.srcdoc = html;
    // Safety: if the code never posts back (e.g. an infinite loop), stop waiting.
    setTimeout(() => {
      setRunning((wasRunning) => {
        if (wasRunning) {
          cleanup();
          append("", "Timed out (possible infinite loop) — the sandbox was reset.", "warn");
        }
        return false;
      });
    }, 5000);
  }

  // ── Python: load Pyodide lazily, then run ──────────────────────────────────
  function loadPyodide(): Promise<any> {
    if (pyodideRef.current) return Promise.resolve(pyodideRef.current);
    if (loadingPyodide.current) {
      return new Promise((res, rej) => {
        const check = setInterval(() => {
          if (pyodideRef.current) {
            clearInterval(check);
            res(pyodideRef.current);
          }
        }, 200);
      });
    }
    loadingPyodide.current = true;
    return new Promise((resolve, reject) => {
      append("⏳", "Loading Pyodide (Python in WebAssembly)…", "system");
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
      s.onload = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pyodide = await (window as any).loadPyodide();
          pyodideRef.current = pyodide;
          loadingPyodide.current = false;
          resolve(pyodide);
        } catch (e: any) {
          loadingPyodide.current = false;
          reject(e);
        }
      };
      s.onerror = () => {
        loadingPyodide.current = false;
        reject(new Error("Could not load Pyodide (network required)."));
      };
      document.body.appendChild(s);
    });
  }

  async function runPython(src: string) {
    try {
      const pyodide = await loadPyodide();
      pyodide.setStdout({
        batched: (text: string) => append("", text),
      });
      pyodide.setStderr({
        batched: (text: string) => append("", text, "error"),
      });
      try {
        await pyodide.runPythonAsync(src);
      } catch (e: any) {
        append("", "ERROR: " + (e?.message || e), "error");
      }
    } catch (e: any) {
      setError(e?.message || "Pyodide failed to load.");
      append("", "ERROR: " + (e?.message || e), "error");
    } finally {
      setRunning(false);
    }
  }

  // ── TypeScript: transpile in-browser (CDN compiler), then run as JS ────────
  function loadTSCompiler(): Promise<any> {
    if (tsCompilerRef.current) return Promise.resolve(tsCompilerRef.current);
    return new Promise((resolve, reject) => {
      append("⏳", "Loading the TypeScript compiler…", "system");
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/typescript@5.5.4/lib/typescript.min.js";
      s.onload = () => {
        tsCompilerRef.current = (window as any).ts;
        resolve(tsCompilerRef.current);
      };
      s.onerror = () => reject(new Error("Could not load the TypeScript compiler (network required)."));
      document.body.appendChild(s);
    });
  }

  // ── SQL: run against a small in-memory dataset via AlaSQL ─────────────────
  async function runSQL(src: string) {
    try {
      // Seed a sample table once per session.
      (alasql as any).options.logsql = false;
      await (alasql as any).promise(
        `CREATE TABLE IF NOT EXISTS employees (name STRING, dept STRING, salary NUMBER);`
      );
      const count: any[] = await (alasql as any).promise("SELECT COUNT(*) AS n FROM employees");
      if (!(count[0]?.n > 0)) {
        await (alasql as any).promise(`INSERT INTO employees VALUES
          ('Aarav','Engineering',90000),('Zara','Engineering',85000),('Kim','Data',95000),
          ('Maya','Data',88000),('Leo','DevOps',82000),('Nina','DevOps',79000),('Omar','Product',77000);`);
      }
      const res = await (alasql as any).promise(src);
      if (Array.isArray(res)) {
        if (res.length === 0) {
          append("", "(no rows returned)", "info");
        } else {
          const cols = Object.keys(res[0]);
          append("", cols.join("\t"));
          for (const row of res) append("", cols.map((c) => row[c] ?? "NULL").join("\t"));
        }
      } else {
        append("", "Query OK — " + JSON.stringify(res ?? res));
      }
    } catch (e: any) {
      append("", "SQL ERROR: " + (e?.message || e), "error");
    } finally {
      setRunning(false);
    }
  }

  async function run() {
    setRunning(true);
    setError(null);
    setOutput([]);
    try {
      if (lang === "html") {
        // Live preview mode — mount the markup (or virtual-FS project) into a sandboxed iframe.
        setPreviewSrc(multiFile ? buildProject() : code);
        setRunning(false);
      } else if (lang === "sql") {
        await runSQL(code);
      } else if (lang === "typescript") {
        const ts = await loadTSCompiler();
        const js = ts.transpileModule(code, {
          compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
        }).outputText;
        await runJavaScript(js);
      } else if (lang === "javascript") {
        await runJavaScript(code);
        // No immediate stop; JS finishes asynchronously via postMessage.
      } else {
        await runPython(code);
      }
    } catch (e: any) {
      setRunning(false);
      setError(e?.message || "Failed to run.");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Redirecting…
      </div>
    );
  }

  const active = LANGUAGE[lang];

  return (
    <AppShell variant="page">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Hammer className="h-7 w-7 text-orange-400" />
            Code Forge
          </h1>
          <p className="text-slate-400 mt-1">
            Run JavaScript and Python safely in your browser, or build a live
            HTML/CSS/JS preview — no server needed. JS runs in an isolated
            sandbox; Python runs via Pyodide (WebAssembly).
          </p>
        </div>

        {/* Language tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(Object.keys(LANGUAGE) as Lang[]).map((key) => {
            const l = LANGUAGE[key];
            return (
              <button
                key={key}
                onClick={() => switchLang(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  lang === key
                    ? `${l.bg} ${l.color} border border-slate-600`
                    : "text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Editor + output */}
        <div className="grid lg:grid-cols-2 gap-4 md:grid-cols-1">
          {/* Editor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className={`text-sm font-medium ${active.color}`}>
                {active.label}
              </span>
              <div className="flex items-center gap-2">
                {lang === "html" && (
                  <button
                    onClick={() => setMultiFile((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition ${
                      multiFile
                        ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                        : "text-slate-300 hover:text-white border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    {multiFile ? "Project mode" : "Virtual FS"}
                  </button>
                )}
                {multiFile ? (
                  <button
                    onClick={resetFiles}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                ) : (
                  <button
                    onClick={() => setCode(defaults[lang])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </div>
            {multiFile && lang === "html" ? (
              <div className="flex min-h-[320px] md:min-h-[440px] flex-1">
                {/* File tree (virtual FS) */}
                <div className="w-40 flex-shrink-0 border-r border-slate-800 bg-slate-950/40 p-2">
                  <div className="mb-2 px-1 text-[10px] uppercase tracking-wide text-slate-500">Files</div>
                  {Object.keys(files).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFile(f)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                        activeFile === f ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800/60"
                      }`}
                    >
                      <FileCode2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{f}</span>
                    </button>
                  ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <CodeEditor
                    value={files[activeFile] ?? ""}
                    onChange={(v) => setFiles((prev) => ({ ...prev, [activeFile]: v }))}
                    language={activeFile.endsWith(".css") ? "css" : activeFile.endsWith(".js") ? "javascript" : "html"}
                  />
                </div>
              </div>
            ) : (
              <CodeEditor
                value={code}
                onChange={setCode}
                language={lang === "html" ? "html" : lang === "javascript" ? "javascript" : lang === "typescript" ? "typescript" : lang === "sql" ? "sql" : "python"}
              />
            )}
          </div>

          {/* Output */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Output
              </span>
              <button
                onClick={() => {
                  setOutput([]);
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 min-h-[320px] md:min-h-[420px] p-4 font-mono text-sm space-y-1 overflow-auto bg-slate-950/60">
              {output.length === 0 && (
                <p className="text-slate-600">
                  Press Run to see the results here.
                </p>
              )}
              {output.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.kind === "error"
                      ? "text-red-400"
                      : line.kind === "warn"
                      ? "text-yellow-300"
                      : line.kind === "system"
                      ? "text-blue-300"
                      : "text-slate-200"
                  }
                >
                  {line.text}
                </div>
              ))}
            </div>
            {error && (
              <div className="px-4 py-2 border-t border-red-500/30 bg-red-500/10 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Live preview (HTML) */}
        {lang === "html" && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Live Preview
              </span>
              <span className="text-xs text-slate-500">sandboxed iframe</span>
            </div>
            {previewSrc ? (
              <iframe
                title="preview"
                sandbox="allow-scripts"
                srcDoc={previewSrc}
                className="h-[420px] w-full bg-[#0b0f14]"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-slate-600">
                Press Run to mount your page.
              </div>
            )}
          </div>
        )}

        {/* Run bar */}
        <div className="flex items-center gap-4 mt-5 flex-wrap">
          <button
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "Running…" : "Run Code"}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            JavaScript: isolated sandbox (no DOM/network access)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Python: Pyodide WASM in-browser
          </div>

          {/* Save / AI / Snippets controls */}
          <div className="flex items-center gap-2">
            <input
              value={snippetName}
              onChange={(e) => setSnippetName(e.target.value)}
              placeholder="Snippet name…"
              onKeyDown={(e) => e.key === "Enter" && saveSnippet()}
              className="px-3 py-2 text-sm rounded-lg border border-slate-800 bg-slate-900/60 outline-none focus:border-slate-600 w-44"
            />
            <button
              onClick={saveSnippet}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </button>
            <button
              onClick={askAI}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              AI Debug
            </button>
            <button
              onClick={() => setPanel(panel === "snippets" ? "none" : "snippets")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 hover:border-slate-500 transition"
            >
              <FolderOpen className="h-4 w-4" />
              My Snippets ({snippets.length})
            </button>
          </div>
        </div>

        {/* Snippets panel */}
        {panel === "snippets" && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-400" />
              Saved Snippets
            </h3>
            {snippets.length === 0 ? (
              <p className="text-xs text-slate-500">No saved snippets yet — write some code and hit Save.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {snippets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                  >
                    <button onClick={() => openSnippet(s)} className="min-w-0 text-left">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block text-[10px] uppercase text-slate-500">
                        {s.lang} · {new Date(s.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteSnippet(s.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* AI debug answer */}
        {(aiLoading || aiAnswer) && (
          <div className="mt-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-purple-300">
              <Sparkles className="h-4 w-4" />
              AI Mentor
            </h3>
            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {aiAnswer ||
                "Thinking…"}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Note: Python (Pyodide) and the TypeScript compiler load from a CDN,
          so they need network on first run. JavaScript and HTML run fully
          offline. Reference implementation of the spec&apos;s interactive Code Forge sandbox.
        </p>
      </div>
    </AppShell>
  );
}
