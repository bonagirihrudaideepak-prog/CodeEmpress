import Link from "next/link";
import { Code2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Code2 className="h-7 w-7 text-blue-400" />
          <span className="text-lg font-bold">Codempress</span>
        </Link>
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p><b className="text-slate-100">Last updated:</b> 2026. You are in control of your data.</p>
          <p>
            Codempress collects the information you provide when creating an account (name, email) and the
            content you generate — resume uploads, learning progress, quiz results, and career-tracking data.
            This data is used solely to personalize your learning experience and is never sold.
          </p>
          <p>
            Your resume text is processed by our AI analysis pipeline to produce insights; it is stored securely
            and can be deleted at any time.
          </p>
          <p>
            We may send transactional emails (account verification, password reset). We do not run third-party
            advertising trackers on this platform.
          </p>
          <p>
            For any privacy request, contact us at{" "}
            <a href="mailto:support@codempress.example" className="text-blue-400 underline">support@codempress.example</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
