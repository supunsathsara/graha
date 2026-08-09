"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Unified site header — consistent brand, nav with active states,
 * and a right slot for page-specific actions.
 */

const NAV_ITEMS = [
  { href: "/", key: "chart", label: "Birth Chart", sub: "ජන්ම පත්‍රය", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { href: "/match", key: "match", label: "Kundli Match", sub: "නැකැත් ගැලපීම", icon: <Heart className="w-3.5 h-3.5" /> },
];

export function SiteHeader({
  right,
  mobileLabel,
}: {
  right?: React.ReactNode;
  mobileLabel?: string;
}) {
  const pathname = usePathname();
  const active = pathname === "/match" ? "match" : "chart";

  return (
    <header className="h-16 border-b border-ash/30 flex items-center justify-between px-4 md:px-8 bg-night/80 backdrop-blur-md sticky top-0 z-50">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="Graha — home">
        <span className="font-display text-2xl font-semibold text-turmeric tracking-tight group-hover:opacity-90 transition">
          Graha
        </span>
        <div className="h-5 w-px bg-ash/30" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash hidden lg:inline">
          {mobileLabel || "Vedic Precision Instrument"}
        </span>
      </Link>

      {/* Nav */}
      <nav aria-label="Main" className="flex items-center gap-1.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition border",
              active === item.key
                ? "bg-turmeric/10 border-turmeric/40 text-turmeric"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60",
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
            <span className="hidden md:inline text-[10px] font-mono text-ash/70">
              {item.sub}
            </span>
          </Link>
        ))}

        {right && <div className="h-5 w-px bg-ash/30 mx-1.5 hidden md:block" />}

        {right}
      </nav>
    </header>
  );
}

/** Consistent footer with nav + attribution. */
export function SiteFooter({ blurb }: { blurb?: string }) {
  return (
    <footer className="border-t border-ash/20 mt-8 py-8">
      <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            Birth Chart
          </Link>
          <span className="text-ash/40">·</span>
          <Link
            href="/match"
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            Kundli Match
          </Link>
          <span className="text-ash/40">·</span>
          <span className="text-xs text-muted-foreground">
            {blurb || "Graha — Vedic Astrology Engine"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Made with <span className="text-sindoor">♥</span> by{" "}
          <a
            href="https://supunsathsara.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline transition"
          >
            chutte
          </a>
        </p>
      </div>
    </footer>
  );
}
