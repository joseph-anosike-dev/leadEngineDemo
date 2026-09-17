import type { Metadata } from "next";
import { Spectral, Inter } from "next/font/google";
import "./globals.css";

// Spectral (serif, headlines) + Inter (sans, body/data) — a deliberate
// departure from plain system-sans "marketplace" UI (Nigeria Property
// Centre and most agent template sites use flat sans-serif throughout).
// A serious serif headline signals a curated, single-agent brand rather
// than a mass listings marketplace.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Real Estate Lead Engine",
    template: "%s",
  },
  description: "Find and inquire about properties across Nigeria.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spectral.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
