import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Same host as sitemap.ts and robots.ts — a mismatch here makes every canonical and og:url
  // point at a different origin than the one being indexed.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.crossplatformterminal.com"
  ),
  title: {
    default: "Cross Platform Terminal (CPT) - Developer Workspace for Linux, Windows & macOS",
    template: "%s | Cross Platform Terminal",
  },
  description:
    "A GPU-accelerated terminal and dockable developer workspace that behaves identically on Linux, Windows and macOS. AI workflow integration for Claude Code and GitHub Copilot. One-time \u20ac8 licence.",
  openGraph: {
    type: "website",
    siteName: "Cross Platform Terminal",
    title: "One workspace. Every platform.",
    description:
      "A GPU-accelerated terminal and dockable developer workspace with the same shortcuts and layout on every OS. One-time \u20ac8 licence, no subscription.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
