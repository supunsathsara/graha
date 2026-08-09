"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BirthFormData } from "@/components/birth-form";

interface DailyPredictionData {
  date: string;
  overall: string;
  career: string;
  love: string;
  health: string;
  auspiciousTime: string | null;
  inauspiciousTime: string | null;
}

interface DailyResponse {
  success: boolean;
  prediction: DailyPredictionData;
  currentDasa?: { lordName: { en: string } } | null;
}

export function DailyPrediction({ form }: { form: BirthFormData }) {
  const [result, setResult] = useState<DailyResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<DailyResponse> => {
      const res = await fetch(`/api/prediction/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: form.birthDate,
          birthTime: form.birthTime,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          timezone: form.timezone,
          name: form.name || undefined,
          provider: "auto",
        }),
      });
      if (!res.ok) throw new Error("Failed to compute daily prediction");
      return res.json();
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-base">Today&apos;s transit reading</h4>
          <p className="text-sm text-muted-foreground">
            Transit-based guidance using current planetary positions against your birth chart.
          </p>
        </div>
        <Button
          size="sm"
          variant={result ? "secondary" : "default"}
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CalendarDays className="w-3.5 h-3.5" />
          )}
          {result ? "Refresh" : "Get daily reading"}
        </Button>
      </div>

      {mutation.isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            {(mutation.error as Error)?.message || "Failed to load daily prediction"}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mutation.isPending && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-full bg-secondary animate-pulse rounded" />
            ))}
          </motion.div>
        )}

        {result?.prediction && !mutation.isPending && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="font-mono text-xs text-ash uppercase tracking-widest">
              {result.prediction.date}
            </p>

            <DailySection title="Overall" text={result.prediction.overall} tone="neutral" />
            <div className="grid md:grid-cols-2 gap-4">
              <DailySection title="Career" text={result.prediction.career} tone="good" />
              <DailySection title="Love & relationships" text={result.prediction.love} tone="good" />
            </div>
            <DailySection title="Health" text={result.prediction.health} tone="warn" />

            {(result.prediction.auspiciousTime || result.prediction.inauspiciousTime) && (
              <div className="grid grid-cols-2 gap-2">
                {result.prediction.auspiciousTime && (
                  <div className="rounded-lg border border-tulsi/30 bg-tulsi/5 p-3">
                    <p className="text-xs text-tulsi uppercase tracking-wider font-medium">Auspicious time</p>
                    <p className="text-sm mt-0.5 font-mono">{result.prediction.auspiciousTime}</p>
                  </div>
                )}
                {result.prediction.inauspiciousTime && (
                  <div className="rounded-lg border border-sindoor/30 bg-sindoor/5 p-3">
                    <p className="text-xs text-sindoor uppercase tracking-wider font-medium">Avoid</p>
                    <p className="text-sm mt-0.5 font-mono">{result.prediction.inauspiciousTime}</p>
                  </div>
                )}
              </div>
            )}

            {result.currentDasa && (
              <p className="text-xs text-muted-foreground">
                Active Mahadasa:{" "}
                <span className="text-foreground font-medium">{result.currentDasa.lordName.en}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DailySection({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "neutral" | "good" | "warn";
}) {
  if (!text) return null;
  return (
    <div>
      <p
        className={
          "text-xs uppercase tracking-wider font-medium mb-1 " +
          (tone === "good" ? "text-tulsi" : tone === "warn" ? "text-sindoor" : "text-ash")
        }
      >
        {title}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
