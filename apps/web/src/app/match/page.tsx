"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Heart, Loader2, Sparkles } from "lucide-react";
import { BirthForm, type BirthFormData } from "@/components/birth-form";
import { GunaMilanResult, type MatchResult } from "@/components/guna-milan";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY: BirthFormData = {
  name: "",
  birthDate: "",
  birthTime: "",
  latitude: "",
  longitude: "",
  timezone: "Asia/Colombo",
};

/** Encode a person's birth data as the chart URL hash (matches the main page format). */
function chartHash(f: BirthFormData): string {
  const params = new URLSearchParams();
  if (f.name) params.set("n", f.name);
  params.set("d", f.birthDate);
  params.set("t", f.birthTime);
  params.set("la", f.latitude);
  params.set("lo", f.longitude);
  params.set("tz", f.timezone);
  return `#chart=${params.toString()}`;
}

export default function MatchPage() {
  const [boy, setBoy] = useState<BirthFormData>(EMPTY);
  const [girl, setGirl] = useState<BirthFormData>(EMPTY);

  const mutation = useMutation({
    mutationFn: async (): Promise<MatchResult> => {
      const res = await fetch(`/api/match/compute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boy: {
            name: boy.name || undefined,
            birthDate: boy.birthDate,
            birthTime: boy.birthTime,
            latitude: parseFloat(boy.latitude),
            longitude: parseFloat(boy.longitude),
            timezone: boy.timezone,
          },
          girl: {
            name: girl.name || undefined,
            birthDate: girl.birthDate,
            birthTime: girl.birthTime,
            latitude: parseFloat(girl.latitude),
            longitude: parseFloat(girl.longitude),
            timezone: girl.timezone,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to compute match");
      }
      return res.json();
    },
  });

  const canCompute =
    boy.birthDate &&
    boy.birthTime &&
    boy.latitude &&
    boy.longitude &&
    girl.birthDate &&
    girl.birthTime &&
    girl.latitude &&
    girl.longitude;

  return (
    <div className="flex flex-col min-h-screen bg-night text-ola-leaf">
      {/* Header */}
      <SiteHeader mobileLabel="Kundli Matching" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        {/* Intro */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-medium text-ola-leaf flex items-center gap-3">
            Guna Milan
            <span className="text-sindoor">
              <Heart className="w-6 h-6" />
            </span>
          </h1>
          <p className="font-sans text-sm text-ash leading-relaxed max-w-3xl">
            Traditional 36-point{" "}
            <span className="text-ola-leaf">Ashtakoota</span> compatibility
            analysis — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot,
            Nadi — plus Mangal (Kuja) dosha with classical cancellations,
            nakshatra Vedha, Rajju dosha, and Lagna compatibility. Computed
            from precise Swiss Ephemeris positions, following classical Sinhala
            practice.
          </p>
        </div>

        {/* Forms */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <p className="font-display text-sm text-turmeric mb-4 uppercase tracking-wider">
              Boy / Groom
            </p>
            <BirthForm
              onSubmit={setBoy}
              onChange={setBoy}
              pending={false}
              initial={boy}
              hideSubmit
            />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <p className="font-display text-sm text-turmeric mb-4 uppercase tracking-wider">
              Girl / Bride
            </p>
            <BirthForm
              onSubmit={setGirl}
              onChange={setGirl}
              pending={false}
              initial={girl}
              hideSubmit
            />
          </div>
        </div>

        <Button
          size="lg"
          disabled={!canCompute || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="w-full max-w-md mx-auto"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing match…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Compute match
            </>
          )}
        </Button>

        {/* Error */}
        <AnimatePresence>
          {mutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-sindoor/10 border border-sindoor/30 rounded-xl p-4 flex items-start gap-3 max-w-2xl mx-auto w-full"
            >
              <AlertCircle className="w-5 h-5 text-sindoor shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Match computation failed</p>
                <p className="text-sm text-muted-foreground">
                  {(mutation.error as Error)?.message || "Something went wrong"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {mutation.isPending && (
          <div
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
            role="status"
            aria-live="polite"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Computing both charts & scoring 8 kootas…
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {mutation.isSuccess && mutation.data && (
            <motion.div
              key={mutation.data.matchId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <GunaMilanResult result={mutation.data} />

              {/* Cross-link: explore the boy's full chart */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
                <div className="text-sm text-muted-foreground min-w-0">
                  <p className="text-ola-leaf font-medium">Explore the full birth chart</p>
                  <p className="text-xs mt-0.5">
                    Planetary dignities, yogas, Navamsa D9, dasa timeline and remedies.
                  </p>
                </div>
                <Link
                  href={`/${chartHash(boy)}`}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-medium hover:bg-primary/80 transition"
                >
                  {boy.name?.trim() || "Boy"}&apos;s chart
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter blurb="Guna Milan · Ashtakoota system · Swiss Ephemeris precision" />
    </div>
  );
}
