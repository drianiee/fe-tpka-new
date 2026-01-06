// app/(public)/layout.tsx
import type { Metadata } from "next";
import PublicNavbar from "./public-navbar";

export const metadata: Metadata = {
  title: "TPKA",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh grid grid-rows-[auto_1fr] bg-white">
      {/* Navbar hanya setinggi kontennya */}
      <PublicNavbar />

      {/* Konten mengisi sisa viewport */}
      <main className="overflow-hidden">
        {children}
      </main>
    </div>
  );
}
