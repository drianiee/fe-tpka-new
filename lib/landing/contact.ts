const DEFAULT_ADMIN_WHATSAPP = "6281233431571";

const rawWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || DEFAULT_ADMIN_WHATSAPP;

export const ADMIN_WHATSAPP = rawWhatsApp
  .replace(/\D/g, "")
  .replace(/^0/, "62");

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export const hasAdminWhatsApp = ADMIN_WHATSAPP.length > 0;

export function formatWhatsAppNumber(digits: string) {
  if (!digits) return "";
  const local = digits.replace(/^62/, "");
  const groups = local.match(/^(\d{3})(\d{4})(\d{0,5})$/);
  return groups
    ? `+62 ${groups[1]}-${groups[2]}${groups[3] ? `-${groups[3]}` : ""}`
    : `+${digits}`;
}

export function whatsAppLink(message = "Halo Admin TPKA ITS, saya butuh bantuan terkait tes TPKA.") {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export const TEST_INFO = {
  onlineSchedule: {
    title: "Jadwal Tes TPKA Online",
    days: "Senin – Jumat",
    hours: "09.00 – 11.30 WIB",
    updateNote: "Jadwal diperbarui setiap H-1 pukul 10.00 WIB.",
  },
  hardcopy: {
    title: "Pengambilan Sertifikat Hardcopy",
    office: "Direktorat Pascasarjana dan Pengembangan Akademik",
    location: "Gedung Pascasarjana Lantai 2, Kampus ITS",
  },
} as const;
