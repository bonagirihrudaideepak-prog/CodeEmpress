import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Map,
  Code2,
  Briefcase,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Resume Analysis",
    desc: "Upload your resume and get instant, detailed feedback with a score and actionable improvements.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Map,
    title: "Custom Roadmaps",
    desc: "AI generates a personalized learning path based on your skills, gaps, and target role.",
    color: "text-accent-2",
    bg: "bg-accent-2/10",
  },
  {
    icon: Code2,
    title: "Learn & Practice",
    desc: "38+ courses, interactive playground, quizzes, and real-world projects to build your portfolio.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Briefcase,
    title: "Career Hub",
    desc: "Mock interviews, job tracking, portfolio builder, and AI mentorship until you land the job.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

const TESTIMONIALS = [
  { quote: "The AI resume analysis caught gaps I'd been missing for years. Two weeks later I had a new role.", name: "Priya S.", role: "Frontend Engineer" },
  { quote: "The personalized roadmap kept me disciplined. I leveled from Apprentice to Master in six months.", name: "Marcus L.", role: "Full-Stack Developer" },
  { quote: "Learning with the AI mentor felt like having a senior engineer on call. The career hub paid for itself.", name: "Ana R.", role: "Data Analyst" },
];

const PRICING = [
  { name: "Free", price: "$0", period: "forever", highlight: false, cta: "Get Started", features: ["Full AI Mentor & resume analysis", "All 38+ courses", "Code Forge playground", "Basic career tracking"] },
  { name: "Pro", price: "$9", period: "per month", highlight: true, cta: "Go Pro", features: ["Everything in Free", "Unlimited AI mentor chats", "Advanced recommendation engine", "Priority support"] },
  { name: "Teams", price: "$29", period: "per seat / mo", highlight: false, cta: "Contact Sales", features: ["Everything in Pro", "Team roadmaps & progress", "Admin analytics dashboard", "SSO & enterprise support"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">
      {/* Pop-art nav */}
      <nav className="sticky top-0 z-40 backdrop-blur border-b-2 border-line bg-surface/80">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold text-pop">Codempress</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-accent to-accent-2 text-white text-sm font-bold shadow-[4px_4px_0_var(--pop-shadow-pink)] transition hover:-translate-y-0.5"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — bold pop headline on candy gradient */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-2/10 border-2 border-accent-2/25 rounded-full text-accent-2 text-sm font-semibold mb-8 shadow-[3px_3px_0_var(--pop-shadow)]">
          <Sparkles className="h-4 w-4" />
          AI-Powered Developer Operating System
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Your AI Career
          <br />
          <span className="text-pop">Mentor &amp; Coach</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
          Upload your resume. Get a personalized learning roadmap. Master the
          skills you need. Land the job you want. All guided by AI that knows
          your career inside and out.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent to-accent-2 text-white text-lg font-bold transition flex items-center gap-2 shadow-[5px_5px_0_var(--pop-shadow-pink)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[2px_2px_0_var(--pop-shadow-pink)]"
          >
            Start Your Journey <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#features"
            className="px-8 py-3.5 border-2 border-line-strong rounded-2xl text-lg font-semibold bg-surface transition hover:border-accent-2 hover:shadow-[4px_4px_0_var(--pop-shadow)]"
          >
            See How It Works
          </Link>
          <Link
            href="/roadmaps"
            className="px-8 py-3.5 border-2 border-line-strong rounded-2xl text-lg font-semibold bg-surface transition hover:border-accent-2 hover:shadow-[4px_4px_0_var(--pop-shadow)] flex items-center gap-2"
          >
            <Map className="h-5 w-5" /> View Roadmaps
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4">
          Everything You Need to <span className="text-pop">Get Hired</span>
        </h2>
        <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
          Not just courses. Not just a chatbot. A complete operating system for
          your developer career.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="card card-hover p-6"
            >
              <div
                className={`w-12 h-12 ${feature.bg} rounded-2xl flex items-center justify-center mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4">
          Loved by <span className="text-pop">Developers</span>
        </h2>
        <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
          Real outcomes from people who built their careers with Codempress.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="text-amber-400 mb-3">★★★★★</div>
              <p className="text-foreground text-sm leading-relaxed">“{t.quote}”</p>
              <div className="mt-4">
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-faint">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-black text-center mb-4">
          Simple, <span className="text-pop">Free</span> Pricing
        </h2>
        <p className="text-muted text-center mb-16 max-w-2xl mx-auto">
          Start free. Upgrade when you&apos;re ready to take it to the next level.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`p-8 rounded-3xl border-2 transition ${
                p.highlight
                  ? "border-accent bg-surface shadow-[6px_6px_0_var(--pop-shadow-pink)]"
                  : "border-line-strong bg-surface/90 shadow-[4px_4px_0_var(--pop-shadow)] hover:shadow-[6px_6px_0_var(--pop-shadow-pink)]"
              }`}
            >
              <div className="text-sm font-bold text-accent-2">{p.name}</div>
              <div className="mt-3 text-4xl font-black">
                {p.price}
                <span className="text-sm font-medium text-faint ml-1">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block text-center py-3 rounded-2xl font-bold transition ${
                  p.highlight
                    ? "bg-gradient-to-r from-accent to-accent-2 text-white hover:-translate-y-0.5 shadow-[4px_4px_0_var(--pop-shadow-pink)]"
                    : "bg-surface-2 text-foreground border-2 border-line-strong hover:border-accent-2"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-12 rounded-3xl bg-gradient-to-br from-accent-2/15 via-surface-2 to-accent/10 border-2 border-line-strong card">
          <Zap className="h-10 w-10 text-amber-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black mb-4">
            Ready to <span className="text-pop">Level Up?</span>
          </h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Join thousands of developers who are using AI to accelerate their
            careers. Start free, no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent to-accent-2 text-white text-lg font-bold transition shadow-[5px_5px_0_var(--pop-shadow-pink)] hover:-translate-y-0.5"
          >
            Get Started Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-line py-10 bg-surface/70">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-accent" />
            <span className="font-bold text-pop">Codempress</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/roadmaps" className="hover:text-foreground">Roadmaps</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
            <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-faint">
          © {new Date().getFullYear()} Codempress. Built for developers, by developers.
        </div>
      </footer>
    </div>
  );
}
