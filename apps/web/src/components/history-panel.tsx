"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import type { BirthFormData } from "@/components/birth-form";

interface HistoryEntry extends BirthFormData {
  ts: number;
  label: string;
}

const STORAGE_KEY = "graha:history:v1";
const MAX_ENTRIES = 8;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function useChartHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  const save = (form: BirthFormData) => {
    const label = form.name?.trim() || `${form.birthDate} · ${form.birthTime}`;
    const entry: HistoryEntry = { ...form, ts: Date.now(), label };
    setEntries((prev) => {
      const next = [
        entry,
        ...prev.filter(
          (p) =>
            !(
              p.birthDate === form.birthDate &&
              p.birthTime === form.birthTime &&
              p.latitude === form.latitude &&
              p.longitude === form.longitude
            )
        ),
      ].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const remove = (ts: number) => {
    setEntries((prev) => {
      const next = prev.filter((p) => p.ts !== ts);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clear = () => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return { entries, save, remove, clear };
}

export function HistoryPanel({
  entries,
  onSelect,
  onRemove,
  onClear,
}: {
  entries: HistoryEntry[];
  onSelect: (e: HistoryEntry) => void;
  onRemove: (ts: number) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!entries.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition border border-border rounded-md px-2 py-1.5 bg-secondary/40"
      >
        <History className="w-3.5 h-3.5" />
        Recent charts
        <span className="font-mono text-[10px] text-ash">({entries.length})</span>
      </button>

      {open && (
        <div className="absolute z-40 top-full mt-1 right-0 w-72 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">Saved charts</span>
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-destructive hover:underline"
            >
              Clear all
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-border">
            {entries.map((e) => (
              <li key={e.ts} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(e);
                    setOpen(false);
                  }}
                  className="flex-1 text-left px-3 py-2 hover:bg-secondary/50 transition min-w-0"
                >
                  <p className="text-xs font-medium truncate">{e.label}</p>
                  <p className="font-mono text-[10px] text-ash truncate">
                    {e.latitude}°, {e.longitude}° · {e.timezone}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(e.ts)}
                  aria-label="Remove entry"
                  className="px-2 py-2 text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
