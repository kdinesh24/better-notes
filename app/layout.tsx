import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { DotGothic16 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jersey25 = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jersey-25",
});

export const metadata: Metadata = {
  title: "Better Notes - Smooth Note Taking Experience",
  description:
    "A beautiful, fast note-taking app with Apple Notes-inspired design",
  generator: "v0.app",
  icons: {
    icon: "/logo1.png",
    apple: "/logo1.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${jersey25.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delayDuration={0}>
            <Suspense fallback={null}>{children}</Suspense>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
