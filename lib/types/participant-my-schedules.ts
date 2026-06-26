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
  | "approved"
  | "pending_payment"
  | "cancelled"
  | "expired"
  | string;

export type ParticipantRegistrationInfo = {
  id: number;
  status: string;
  access_status: string;
  registration_source: string;
};

export type ParticipantPaymentInfo = {
  id: number;
  transaction_status: ParticipantPaymentStatus;
  snap_redirect_url: string | null;
  paid_at: string | null;
};

export type ParticipantRegistrationStatus =
  | "terdaftar"
  | "belum-terdaftar"
  | "mengakses-tes"
  | "selesai-tes"
  | string;

export type ParticipantMyScheduleListItem = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string; // ✅ tambahin ini
  is_partner?: boolean;
  payment_status: ParticipantPaymentStatus;
  participant_status_key?: string;
  participant_status_label?: string;
  title?: string;
  can_start?: boolean;
  has_attempt?: boolean;
  attempt_id?: number | null;
  registration?: ParticipantRegistrationInfo;
  payment?: ParticipantPaymentInfo | null;
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
  participant_status_key?: string;
  participant_status_label?: string;
  paid_at: string | null;
  order_id: string | null;
  payment_type: string | null;

  partner: { id: number; name: string } | null;
  registration: ParticipantRegistrationInfo;
  payment: ParticipantPaymentInfo | null;

  can_start: boolean;
  has_attempt: boolean;
  attempt_id: number | null;
  question_package: {
    id: number;
    name: string;
    total_duration_minutes: number;
    total_questions: number;
  };
};
