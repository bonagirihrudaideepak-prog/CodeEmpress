import Link from "next/link";
import { LayoutGrid, FileText, CheckCircle2, Plus } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";
import { listTopics, type TopicRecord } from "@/lib/content";

export const dynamic = "force-dynamic";

function DifficultyBadge({ level }: { level?: string }) {
  if (!level) return null;
  const map: Record<string, string> = {
    BEGINNER: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    INTERMEDIATE: "text-blue-300 bg-blue-500/10 border-blue-500/20",
    ADVANCED: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    EXPERT: "text-red-300 bg-red-500/10 border-red-500/20",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full border text-xs font-medium ${map[level] || map.BEGINNER}`}
    >
      {level}
    </span>
  );
}

export default function ContentPage() {
  const topics = listTopics();

  return (
    <AppShell variant="page">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <LayoutGrid className="h-7 w-7 text-blue-400" />
              Content Library
            </h1>
            <p className="text-slate-400 mt-1">
              Topics produced with the Content Production Guide
              (docs/CONTENT_GUIDE.md).
            </p>
          </div>
          <a
            href="https://github.com"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-sm font-medium transition text-slate-300"
          >
            <Plus className="h-4 w-4" />
            New Topic
          </a>
        </div>

        {topics.length === 0 ? (
          <div className="mt-16 text-center">
            <FileText className="h-10 w-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              No topics yet. Run{" "}
              <code className="text-blue-300 bg-slate-900 px-1.5 py-0.5 rounded">
                node scripts/scaffold-topic.mjs &lt;slug&gt;
              </code>{" "}
              to create one.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {topics.map((t) => (
              <TopicCard key={t.slug} topic={t} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TopicCard({ topic }: { topic: TopicRecord }) {
  const meta = topic.meta;
  const pct = Math.round(
    (topic.checklist.sections.filter((s) => s.present).length /
      topic.checklist.sections.length) *
      100
  );

  return (
    <Link
      href={`/content/${topic.slug}`}
      className="block p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-blue-500/40 hover:bg-slate-900/70 transition group"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            {[meta.domain, meta.category, meta.module].filter(Boolean).join(" › ") || "Uncategorized"}
          </div>
          <h2 className="text-xl font-semibold group-hover:text-blue-300 transition">
            {meta.title || topic.slug}
          </h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <DifficultyBadge level={meta.difficulty} />
        </div>
      </div>

      {meta.tags && meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
            topic.checklist.valid
              ? "text-green-400 bg-green-500/10 border-green-500/20"
              : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {topic.checklist.valid ? "Complete" : "In progress"}
        </span>
        <span className="text-slate-400">
          {topic.checklist.sections.filter((s) => s.present).length}/
          {topic.checklist.sections.length} sections
        </span>
        <span className="text-slate-500">v{meta.version || "0.0.0"}</span>
      </div>

      <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
