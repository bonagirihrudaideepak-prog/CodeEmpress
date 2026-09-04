"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareBadges({
  user,
  levelTitle,
  levelNumber,
  xp,
  badges,
}: {
  user: string;
  levelTitle: string;
  levelNumber: number;
  xp: number;
  badges: { icon: string; name: string }[];
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = `🏆 ${user} leveled up on Codempress!\n\nLevel ${levelNumber} · ${levelTitle} · ${xp} XP\n\nBadges (${badges.length}):\n${badges
      .map((b) => `${b.icon} ${b.name}`)
      .join("\n")}\n\nCome build your dev career with me on Codempress.`;

    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard might be unavailable in some contexts
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  }

  return (
    <button onClick={share} className="btn btn-ghost btn-sm">
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Copied!" : "Share badges"}
    </button>
  );
}
