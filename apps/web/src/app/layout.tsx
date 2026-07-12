import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Graha — Vedic Horoscope Engine",
    template: "%s | Graha",
  },
  description:
    "Accurate Vedic astrology calculations powered by Swiss Ephemeris. Get your complete birth chart with planetary positions, yogas, doshas, and remedies.",
  keywords: [
    "vedic astrology",
    "jyotish",
    "birth chart",
    "horoscope",
    "sri lanka astrology",
    "swiss ephemeris",
    "lagna calculator",
    "navamsa",
    "vedic horoscope",
  ],
  authors: [{ name: "Chutte", url: "https://supunsathsara.com" }],
  creator: "Chutte",
  metadataBase: new URL("https://graha.chutte.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://graha.chutte.dev",
    siteName: "Graha",
    title: "Graha — Vedic Horoscope Engine",
    description:
      "Accurate Vedic astrology calculations powered by Swiss Ephemeris. Get your complete birth chart with planetary positions, yogas, doshas, and remedies.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Graha — Vedic Horoscope Engine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Graha — Vedic Horoscope Engine",
    description:
      "Accurate Vedic astrology calculations powered by Swiss Ephemeris. Get your complete birth chart with planetary positions, yogas, doshas, and remedies.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon", apple: "/icon" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
