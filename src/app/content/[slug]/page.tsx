import { notFound } from "next/navigation";
import { marked } from "marked";
import { AppShell } from "@/components/ui/app-shell";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Tag,
  GraduationCap,
  ListChecks,
} from "lucide-react";
import { getTopic } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const { meta, checklist, lesson } = topic;

  const html = lesson ? await marked.parse(lesson) : "";

  return (
    <AppShell variant="page">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-3">
          {[meta.domain, meta.category, meta.module].filter(Boolean).join(" › ")}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{meta.title || slug}</h1>
          <span className="px-2.5 py-1 rounded-full border border-slate-700 text-slate-300 text-xs font-medium">
            v{meta.version || "0.0.0"}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
              checklist.valid
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
            }`}
          >
            {checklist.valid ? "Definition of Done met" : "Incomplete"}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6 text-sm">
          <MetaTile icon={<GraduationCap className="h-4 w-4" />} label="Difficulty" value={meta.difficulty || "—"} />
          <MetaTile icon={<Clock className="h-4 w-4" />} label="Est. time" value={meta.estimated_time ? `${meta.estimated_time}m` : "—"} />
          <MetaTile icon={<FileText className="h-4 w-4" />} label="Quiz Qs" value={String(checklist.quizQuestionCount)} />
          <MetaTile icon={<Tag className="h-4 w-4" />} label="Tags" value={meta.tags?.length ? `${meta.tags.length}` : "0"} />
        </div>

        {meta.career_paths && meta.career_paths.length > 0 && (
          <div className="mb-6">
            <span className="text-xs uppercase tracking-wide text-slate-500">Career paths</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {meta.career_paths.map((p) => (
                <span key={p} className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quest checklist */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-400" />
            Standard Checklist (guide §3 + Appendix)
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {checklist.sections.map((s) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                {s.present ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <span className={s.present ? "text-slate-200" : "text-slate-500"}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {checklist.missingFiles.length > 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8 text-sm">
            <p className="font-semibold text-amber-300 mb-2">Missing files</p>
            <div className="flex flex-wrap gap-2">
              {checklist.missingFiles.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Lesson render */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold">Lesson</h2>
          </div>
          {html ? (
            <div
              className="lesson-md"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-slate-400">No lesson.md yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function MetaTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="font-semibold capitalize">{value}</div>
    </div>
  );
}
