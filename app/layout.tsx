import "@fontsource-variable/inter";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PWARegistration } from "@/components/PWARegistration";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Folio — Private PDF Reader",
    template: "%s · Folio",
  },
  description:
    "A private, offline-first PDF library and focused reading experience.",
  applicationName: "Folio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Folio",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <PWARegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
