"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Terminal,
  FileText,
  MessageSquare,
  Cpu,
  Map,
  Briefcase,
  User,
  Menu,
  X,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NotificationsBell } from "@/components/ui/notifications-bell";

export type AppShellUser = {
  name?: string | null;
  targetRole?: string | null;
};

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/forge", label: "Forge", icon: Terminal },
  { href: "/chat", label: "AI Mentor", icon: MessageSquare },
  { href: "/career", label: "Career", icon: Briefcase },
  { href: "/ai-status", label: "AI Status", icon: Cpu },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  user,
  children,
  variant = "page",
}: {
  user?: AppShellUser;
  children: React.ReactNode;
  variant?: "page" | "immersive";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Branded header */}
      <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Code2 className="h-7 w-7 text-accent" />
            <span className="text-lg font-black text-pop">Codempress</span>
          </Link>

          {/* Search (desktop) */}
          <form onSubmit={submitSearch} className="hidden flex-1 max-w-sm xl:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, courses, roadmaps…"
                className="input !py-2 pl-9"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive(pathname, link.href)
                    ? "bg-gradient-to-r from-accent/20 to-accent-2/20 text-foreground shadow-[3px_3px_0_var(--pop-shadow)]"
                    : "text-muted hover:text-foreground hover:bg-surface-3"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <div className="hidden text-sm text-muted sm:block">
              {user?.targetRole || "Developer"}
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-accent/20 font-semibold text-accent-soft md:flex">
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div className="hidden md:block">
              <SignOutButton />
            </div>
            {/* Mobile toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border border-line p-2 text-muted hover:text-foreground lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {open && (
          <div className="border-t border-line bg-background lg:hidden">
            <nav className="grid grid-cols-2 gap-1 px-4 py-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition",
                    isActive(pathname, link.href)
                      ? "bg-accent/15 text-accent-soft"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <div className="text-sm text-muted">
                {(user?.name?.split(" ")[0] || "Developer")}
                {user?.targetRole ? ` · ${user.targetRole}` : ""}
              </div>
              <SignOutButton />
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main
        className={cn(
          variant === "page" && "mx-auto max-w-7xl px-6 py-10",
          variant === "immersive" && "flex min-h-[calc(100vh-4rem)] flex-col"
        )}
      >
        {children}
      </main>
    </div>
  );
}
