// src/lib/types/landing.ts

export type LandingScheduleItem = {
  id: number; // ✅ id schedule dari backend (dipakai untuk register)
  date: string; // "YYYY-MM-DD HH:mm:ss"
  start_time: string; // "HH:mm:ss"
  price: string; // "150000.00"
  capacity: number;
  current_participants: number;
  status: string; // "Tes Belum Dimulai" dll
};

export type LandingSchedulesResponse = LandingScheduleItem[];
