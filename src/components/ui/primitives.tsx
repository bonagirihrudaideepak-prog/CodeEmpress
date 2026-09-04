import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Card — the standard surface container. */
export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div className={cn("card", hover && "card-hover", className)}>{children}</div>
  );
}

/** StatCard — icon + label + big value tile (used on dashboard & library). */
export function StatCard({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("stat", className)}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

/** SectionHeading — consistent section titles across the app. */
export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Badge — small pill for tags / chips. */
export function Badge({
  children,
  tone = "blue",
  className,
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "purple" | "orange" | "red" | "yellow";
  className?: string;
}) {
  const tones: Record<string, string> = {
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    green: "border-green-500/20 bg-green-500/10 text-green-300",
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  };
  return (
    <span className={cn("chip", tones[tone], className)}>{children}</span>
  );
}
