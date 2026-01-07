// src/lib/types/participant.ts

export type ParticipantScheduleStatus =
  | "Tes Belum Dimulai"
  | "Tes Akan Segera Dimulai"
  | "Tes Sedang Berlangsung"
  | "Tes Telah Selesai"
  | string;

export type ParticipantScheduleListItem = {
  id: number;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  start_time: string; // "HH:mm:ss"
  price: string; // "150000.00"
  capacity: number;
  current_participants: number;
  registration_status: string;
  status: ParticipantScheduleStatus;
};

export type ParticipantSchedulesResponse = ParticipantScheduleListItem[];
