"use client";

import { useMemo, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  Crosshair,
  Globe,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SRI_LANKA_CITIES, TIMEZONES } from "@/lib/astro";
import { cn } from "@/lib/utils";

export interface BirthFormData {
  name: string;
  birthDate: string;
  birthTime: string;
  latitude: string;
  longitude: string;
  timezone: string;
}

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Simple Nominatim-style cache to avoid duplicate requests
const geocodeCache = new Map<string, LocationResult[]>();

function parseTime(t: string): string {
  // "14:30" → "14:30:00" not needed; keep as-is
  return t;
}

export function BirthForm({
  onSubmit,
  onChange,
  pending,
  initial,
  hideSubmit = false,
  accentLabel,
}: {
  onSubmit: (data: BirthFormData) => void;
  onChange?: (data: BirthFormData) => void;
  pending: boolean;
  initial?: Partial<BirthFormData>;
  hideSubmit?: boolean;
  accentLabel?: string;
}) {
  const [form, setForm] = useState<BirthFormData>({
    name: "",
    birthDate: "",
    birthTime: "",
    latitude: "",
    longitude: "",
    timezone: "Asia/Colombo",
    ...initial,
  });
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.birthDate) e.birthDate = "Required";
    if (!form.birthTime) e.birthTime = "Required";
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    if (form.latitude === "" || isNaN(lat) || lat < -90 || lat > 90)
      e.latitude = "Latitude −90 to 90";
    if (form.longitude === "" || isNaN(lon) || lon < -180 || lon > 180)
      e.longitude = "Longitude −180 to 180";
    return e;
  }, [form]);

  const set = (patch: Partial<BirthFormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange?.(next);
  };

  const fillNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    set({
      birthDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      birthTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    });
  };

  const useGeolocation = () => {
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        set({ latitude: latitude.toFixed(5), longitude: longitude.toFixed(5) });
        // Reverse geocode for a friendly label
        try {
          const res = await fetch(
            `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`,
          );
          if (res.ok) {
            const raw = await res.json();
            const props = raw.features?.[0]?.properties || {};
            const parts = [
              props.name,
              props.city,
              props.state,
              props.country,
            ].filter(Boolean);
            if (parts.length)
              setSelectedLocation([...new Set(parts)].join(", "));
          }
        } catch {}
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied — enter coordinates manually."
            : "Could not determine location.",
        );
      },
      { timeout: 8000 },
    );
  };

  const handleQuery = (q: string) => {
    setLocationQuery(q);
    setSelectedLocation("");
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const cached = geocodeCache.get(q.trim());
      if (cached) {
        setLocationResults(cached);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q.trim())}&limit=5`,
        );
        if (!res.ok) return;
        const raw = await res.json();
        const data: LocationResult[] = (raw.features || []).map((f: any) => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const parts = [
            props.name,
            props.city,
            props.state,
            props.country,
          ].filter(Boolean);
          return {
            display_name: [...new Set(parts)].join(", "),
            lat: String(coords[1]),
            lon: String(coords[0]),
          };
        });
        geocodeCache.set(q.trim(), data);
        setLocationResults(data);
      } catch {}
      setSearching(false);
    }, 400); // 400ms — fast enough to feel responsive
  };

  const pickLocation = (r: LocationResult) => {
    set({
      latitude: r.lat,
      longitude: r.lon,
    });
    setLocationQuery(r.display_name.split(",")[0]);
    setSelectedLocation(r.display_name);
    setLocationResults([]);
  };

  const markTouched = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      birthDate: true,
      birthTime: true,
      latitude: true,
      longitude: true,
    });
    if (Object.keys(errors).length) return;
    onSubmit(form);
  };

  const fieldClass = (k: string) =>
    cn(touched[k] && errors[k] && "border-destructive/70");

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Name{" "}
          <span className="text-muted-foreground/50 font-normal">
            (optional)
          </span>
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="e.g. Kamal Perera"
          autoComplete="name"
        />
      </div>

      {/* Birthplace search */}
      <div className="space-y-1.5">
        <Label htmlFor="birthplace" className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Birthplace
        </Label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          <Input
            id="birthplace"
            value={locationQuery}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Search city (e.g. Colombo, Galle)"
            className="pl-8"
            role="combobox"
            aria-expanded={locationResults.length > 0}
            aria-controls="location-results"
            aria-autocomplete="list"
          />
          {searching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-2.5 text-muted-foreground" />
          )}
          {locationResults.length > 0 && (
            <div
              id="location-results"
              role="listbox"
              className="absolute z-30 top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl max-h-56 overflow-y-auto"
            >
              {locationResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pickLocation(r)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/60 transition border-b border-border last:border-0"
                >
                  <span className="font-medium">
                    {r.display_name.split(",")[0]}
                  </span>
                  <span className="block text-muted-foreground truncate">
                    {r.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedLocation && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {selectedLocation}
            {form.latitude && form.longitude && (
              <span className="font-mono">
                · {parseFloat(form.latitude).toFixed(3)}°,{" "}
                {parseFloat(form.longitude).toFixed(3)}°
              </span>
            )}
          </span>
        )}
      </div>

      {/* Quick city chips */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Quick fill</label>
        <div className="flex flex-wrap gap-1.5">
          {SRI_LANKA_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                set({
                  latitude: String(city.lat),
                  longitude: String(city.lon),
                });
                setSelectedLocation(city.name);
                setLocationQuery(city.name);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-secondary border border-border hover:border-primary/50 transition"
            >
              {city.name}
            </button>
          ))}
          <button
            type="button"
            onClick={useGeolocation}
            disabled={geoLoading}
            className="px-2.5 py-1 text-xs rounded-md bg-secondary border border-border hover:border-primary/50 transition inline-flex items-center gap-1 disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Crosshair className="w-3 h-3" />
            )}
            Use my location
          </button>
        </div>
        {geoError && <p className="text-xs text-destructive">{geoError}</p>}
      </div>

      {/* Date & time */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="birthDate" className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Birth Date
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => set({ birthDate: e.target.value })}
            onBlur={() => markTouched("birthDate")}
            required
            className={cn("[color-scheme:dark]", fieldClass("birthDate"))}
            aria-invalid={touched.birthDate && !!errors.birthDate}
          />
          {touched.birthDate && errors.birthDate && (
            <p className="text-xs text-destructive">{errors.birthDate}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthTime" className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Birth Time
          </Label>
          <Input
            id="birthTime"
            type="time"
            value={form.birthTime}
            onChange={(e) => set({ birthTime: parseTime(e.target.value) })}
            onBlur={() => markTouched("birthTime")}
            required
            className={cn("[color-scheme:dark]", fieldClass("birthTime"))}
            aria-invalid={touched.birthTime && !!errors.birthTime}
          />
          {touched.birthTime && errors.birthTime && (
            <p className="text-xs text-destructive">{errors.birthTime}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={fillNow}
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <Clock className="w-3 h-3" /> Use current date & time
      </button>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="latitude" className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Latitude
          </Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            inputMode="decimal"
            value={form.latitude}
            onChange={(e) => set({ latitude: e.target.value })}
            onBlur={() => markTouched("latitude")}
            placeholder="e.g. 6.9271"
            required
            className={fieldClass("latitude")}
            aria-invalid={touched.latitude && !!errors.latitude}
          />
          {touched.latitude && errors.latitude && (
            <p className="text-xs text-destructive">{errors.latitude}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="longitude" className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Longitude
          </Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            inputMode="decimal"
            value={form.longitude}
            onChange={(e) => set({ longitude: e.target.value })}
            onBlur={() => markTouched("longitude")}
            placeholder="e.g. 79.8612"
            required
            className={fieldClass("longitude")}
            aria-invalid={touched.longitude && !!errors.longitude}
          />
          {touched.longitude && errors.longitude && (
            <p className="text-xs text-destructive">{errors.longitude}</p>
          )}
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-1.5">
        <Label htmlFor="timezone" className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Timezone
        </Label>
        <select
          id="timezone"
          value={form.timezone}
          onChange={(e) => set({ timezone: e.target.value })}
          className="w-full h-8 bg-background border border-input rounded-lg px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition [color-scheme:dark]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label} ({tz.offset})
            </option>
          ))}
        </select>
      </div>

      {!hideSubmit && (
        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {accentLabel || "Compute chart"}
            </>
          )}
        </Button>
      )}
      {!hideSubmit && Object.keys(errors).length > 0 && touched.birthDate && (
        <p className="text-xs text-muted-foreground text-center">
          Complete the highlighted fields to compute.
        </p>
      )}
    </form>
  );
}
