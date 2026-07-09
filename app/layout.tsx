import "./globals.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "TPKA",
  description: "TPKA Frontend",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
