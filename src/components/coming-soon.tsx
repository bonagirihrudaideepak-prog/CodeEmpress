import Link from "next/link";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/ui/app-shell";

export function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell variant="page">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <Construction className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">{title}</h1>
        <p className="mb-6 max-w-md text-slate-400">
          This section is under construction. It&apos;s coming in the next
          build step.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500"
        >
          Go to Dashboard
        </Link>
      </div>
    </AppShell>
  );
}
