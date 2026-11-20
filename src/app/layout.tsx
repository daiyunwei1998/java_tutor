import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "PixelForge Dev HQ · Java Tutor",
  description: "Project-based Java learning: students work as Junior Developers on real-feeling tickets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
