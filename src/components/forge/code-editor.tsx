"use client";

import { useState, useRef, useEffect } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";

// Monaco theme handles the model; if Monaco can't load (e.g. offline first
// render) we degrade to a plain textarea so the editor is always usable.
export function CodeEditor({
  value,
  onChange,
  language,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const mounted = useRef(false);

  // If Monaco doesn't mount within 7s (CDN unavailable), fall back to textarea.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!mounted.current) setFailed(true);
    }, 7000);
    return () => clearTimeout(t);
  }, [language]);

  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("codempress", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f172a40",
        "editor.lineHighlightBackground": "#1e293b40",
        "editorLineNumber.foreground": "#475569",
        "editorCursor.foreground": "#7dd3fc",
      },
    });
  };

  if (failed) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={`w-full flex-1 min-h-[320px] md:min-h-[440px] p-4 bg-transparent font-mono text-sm text-slate-100 outline-none resize-none ${className}`}
        style={{ tabSize: 2 }}
      />
    );
  }

  return (
    <div className={`flex-1 min-h-[320px] md:min-h-[440px] ${className}`}>
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        theme="codempress"
        beforeMount={beforeMount}
        onMount={(_editor, monaco) => {
          mounted.current = true;
          monaco.editor.setTheme("codempress");
        }}
        onChange={(v) => onChange(v ?? "")}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading editor…
          </div>
        }
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  );
}
