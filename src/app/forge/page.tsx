import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Forge from "@/components/forge/forge-client";

export default function ForgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Loading Code Forge…</span>
          </div>
        </div>
      }
    >
      <Forge />
    </Suspense>
  );
}
