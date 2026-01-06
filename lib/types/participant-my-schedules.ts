// src/lib/types/participant-my-schedules.ts

export type ParticipantMySchedulesStatusFilter =
  | "all"
  | "belum-dimulai"
  | "sedang-berlangsung"
  | "telah-selesai"
  | string;

export type ParticipantPaymentStatus =
  | "pending"
  | "capture"
  | "settlement"
  | "paid"
  | "expire"
  | "cancel"
  | "deny"
  | "failure"
  | "partner"
  | string;

export type ParticipantMyScheduleListItem = {
  id: number;
  date: string; // "YYYY-MM-DD HH:mm:ss"
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"
  payment_status: ParticipantPaymentStatus;
};

export type ParticipantMySchedulesResponse = {
  status: ParticipantMySchedulesStatusFilter;
  count: number;
  data: ParticipantMyScheduleListItem[];
};

export type ParticipantMyScheduleDetail = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;

  status: string; // "Tes Belum Dimulai" dst
  is_partner: boolean;
  price: string;

  payment_status: ParticipantPaymentStatus;
  paid_at: string | null;
  order_id: string | null;
  payment_type: string | null;

  partner: { id: number; name: string } | null;

  can_start: boolean;
  quiz_url: string | null;
};
