import Link from "next/link";
import { Code2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Code2 className="h-7 w-7 text-blue-400" />
          <span className="text-lg font-bold">Codempress</span>
        </Link>
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><b className="text-slate-100">Last updated:</b> 2026.</p>
          <p>
            By using Codempress you agree to use the platform for lawful learning and career development.
            You are responsible for the accuracy of the resume and personal information you provide.
          </p>
          <p>
            AI-generated outputs (resume analysis, mentor chat, roadmap suggestions) are provided as guidance
            and are not a guarantee of employment outcomes.
          </p>
          <p>
            The free tier is subject to fair-use rate limits to keep the service available to everyone.
          </p>
          <p>
            These terms may be updated from time to time; continued use constitutes acceptance of the latest
            version.
          </p>
        </div>
      </div>
    </div>
  );
}
