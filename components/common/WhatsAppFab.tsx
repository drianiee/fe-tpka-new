"use client";

import { MessageCircle } from "lucide-react";
import { hasAdminWhatsApp, whatsAppLink } from "@/lib/landing/contact";

/** Tombol WhatsApp melayang di pojok kanan bawah. Tidak tampil kalau nomor belum diatur. */
export function WhatsAppFab() {
  if (!hasAdminWhatsApp) return null;

  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi admin lewat WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25D366] pl-3 pr-4 py-3 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold">Hubungi Admin</span>
    </a>
  );
}
