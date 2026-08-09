"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  Check,
  Cloud,
  Copy,
  KeyRound,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  listCharts,
  deleteChart,
  getFamilyId,
  setFamilyId,
  normalizeKey,
  isValidKey,
  type VaultEntry,
} from "@/lib/vault";
import { cn } from "@/lib/utils";

/**
 * Family chart vault panel — cloud-saved birth charts for this family,
 * keyed by a user-backup-able vault key. Includes:
 *   - show + copy the vault key (recovery across devices/browser clears)
 *   - restore a vault from a key (e.g. on a new device)
 *   - save / load / delete charts
 *   - storage-policy copy (25-chart cap, 12-month retention)
 */

export function VaultPanel({
  canSave,
  onSave,
  onLoad,
  savePending,
}: {
  canSave: boolean;
  onSave: () => void;
  onLoad: (id: string) => void;
  savePending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadId, setLoadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreMsg, setRestoreMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const key = getFamilyId();

  const refresh = async () => {
    setLoading(true);
    try {
      const { charts } = await listCharts();
      setEntries(charts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleLoad = async (id: string) => {
    setLoadId(id);
    await onLoad(id);
    setLoadId(null);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteChart(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {}
    setDeletingId(null);
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your vault key:", key);
    }
  };

  const doRestore = async () => {
    const normalized = normalizeKey(restoreInput);
    if (!isValidKey(normalized)) {
      setRestoreMsg({
        ok: false,
        text: "That doesn't look like a valid key. Format: GRH-XXXX-XXXX-XXXX-XXXX",
      });
      return;
    }
    setRestoring(true);
    setRestoreMsg(null);
    const ok = setFamilyId(normalized);
    if (ok) {
      try {
        const { charts } = await listCharts();
        setEntries(charts);
        setRestoreMsg({
          ok: true,
          text:
            charts.length > 0
              ? `Vault restored — ${charts.length} chart${charts.length === 1 ? "" : "s"} found.`
              : "Key accepted. No saved charts under this key yet — it will be used for new saves.",
        });
        setShowRestore(false);
      } catch {
        setRestoreMsg({ ok: true, text: "Key accepted." });
      }
    }
    setRestoring(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition border border-border rounded-md px-2.5 py-1.5 bg-secondary/40"
      >
        <Archive className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Family vault</span>
        {entries.length > 0 && (
          <span className="font-mono text-[10px] text-ash">
            ({entries.length})
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-40 top-full mt-1 right-0 w-96 max-w-[92vw] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-turmeric" />
              Family chart vault
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Vault key */}
          <div className="px-3 py-2.5 border-b border-border bg-night/40">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-ash font-medium flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Your vault key
              </p>
              <button
                type="button"
                onClick={() => setShowRestore((s) => !s)}
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Restore a key
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-secondary/60 px-2 py-1.5 font-mono text-[11px] text-turmeric tracking-wider">
                {key}
              </code>
              <button
                type="button"
                onClick={copyKey}
                aria-label="Copy vault key"
                className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/60 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-tulsi" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[10px] text-ash mt-1.5 leading-relaxed">
              Save this key to restore your charts on any device. Keep it
              private.
            </p>

            {/* Restore */}
            {showRestore && (
              <div className="mt-2 rounded-md border border-border bg-secondary/40 p-2">
                <input
                  value={restoreInput}
                  onChange={(e) => setRestoreInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doRestore()}
                  placeholder="GRH-XXXX-XXXX-XXXX-XXXX"
                  spellCheck={false}
                  autoCapitalize="characters"
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={doRestore}
                  disabled={restoring || !restoreInput.trim()}
                  className="mt-1.5 w-full inline-flex items-center justify-center gap-1 rounded-md bg-primary text-primary-foreground px-2 py-1.5 text-[11px] font-medium hover:bg-primary/80 transition disabled:opacity-50"
                >
                  {restoring && <Loader2 className="w-3 h-3 animate-spin" />}
                  Restore vault
                </button>
                {restoreMsg && (
                  <p
                    className={cn(
                      "text-[10px] mt-1.5 leading-relaxed",
                      restoreMsg.ok ? "text-tulsi" : "text-sindoor",
                    )}
                  >
                    {restoreMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save action */}
          <div className="px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={() => {
                onSave();
                setOpen(false);
              }}
              disabled={!canSave || savePending}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/80 transition disabled:opacity-50"
            >
              {savePending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save current chart
            </button>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-full bg-secondary animate-pulse rounded"
                  />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                No saved charts yet. Compute a chart, then save it here.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((e) => (
                  <li key={e.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleLoad(e.id)}
                      disabled={!!loadId}
                      className="flex-1 text-left px-3 py-2 hover:bg-secondary/50 transition min-w-0"
                    >
                      <p className="text-xs font-medium truncate">{e.label}</p>
                      <p className="font-mono text-[10px] text-ash">
                        {e.birthDate} · {e.birthTime}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id)}
                      disabled={!!deletingId}
                      aria-label={`Delete ${e.label}`}
                      className="px-2 py-2 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Policy */}
          <div className="px-3 py-2 border-t border-border bg-night/40">
            <p className="text-[10px] text-ash leading-relaxed">
              Vault policy: up to 25 charts per family · charts not opened for
              12 months are removed automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
