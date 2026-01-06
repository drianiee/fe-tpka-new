export type JadwalItem = {
  id: string;
  tanggal: string;
  jam: string;
  harga: number;
  status: "tersedia" | "tersedia" | "kuota penuh";
};

export const JADWAL_DATA: JadwalItem[] = [
  { id: "tpka-1", tanggal: "2025-04-25", jam: "09:00", harga: 250_000, status: "tersedia" },
  { id: "tpka-2", tanggal: "2025-05-10", jam: "13:00", harga: 250_000, status: "tersedia" },
  { id: "tpka-3", tanggal: "2025-06-01", jam: "09:00", harga: 250_000, status: "kuota penuh" },
];