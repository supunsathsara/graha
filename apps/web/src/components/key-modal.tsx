"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, KeyRound, ShieldAlert } from "lucide-react";
import { getFamilyId, markKeyAcknowledged } from "@/lib/vault";

/**
 * Recovery key modal — shown once after the first chart is saved.
 * Mirrors the "write down your seed phrase" pattern: the family key is the
 * only way to restore the vault after a browser data clear or on another
 * device.
 */

export function KeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const key = typeof window !== "undefined" ? getFamilyId() : "";

  useEffect(() => {
    if (open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your vault key:", key);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="key-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-turmeric" />
              <h2
                id="key-modal-title"
                className="font-display text-lg text-ola-leaf"
              >
                Save your vault key
              </h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mt-3">
              Your family vault is protected by a key. If you lose it (for
              example by clearing browser data),{" "}
              <span className="text-ola-leaf">
                your saved charts cannot be recovered
              </span>
              . Write it down or store it somewhere safe — it also restores your
              vault on any other device.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-turmeric/40 bg-night/60 px-3 py-2.5 font-mono text-sm text-turmeric tracking-wider select-all">
                {key}
              </code>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2.5 text-xs font-medium hover:bg-primary/80 transition"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="text-[11px] text-ash flex items-start gap-1.5 mt-3">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-sindoor" />
              Treat this like a password — anyone with this key can view this
              family&apos;s charts.
            </p>

            <button
              type="button"
              onClick={() => {
                markKeyAcknowledged();
                onClose();
              }}
              className="mt-5 w-full rounded-lg border border-border bg-secondary/40 text-sm font-medium py-2.5 hover:bg-secondary/70 transition"
            >
              I&apos;ve saved it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
