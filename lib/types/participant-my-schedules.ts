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
  retake_granted_at?: string | null;
  retake_consumed_at?: string | null;
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

export type ParticipantAssignedQuestionPackageSection = {
  code?: string | null;
  name: string;
  duration_minutes: number;
  question_count: number;
  target_question_count: number;
};

export type ParticipantAssignedQuestionPackage = {
  total_duration_minutes: number;
  total_questions: number;
  sections?: ParticipantAssignedQuestionPackageSection[];
};

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
  attempt_status?: string | null;
  registration?: ParticipantRegistrationInfo;
  payment?: ParticipantPaymentInfo | null;
  question_package?: ParticipantAssignedQuestionPackage | null;
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
  attempt_status?: string | null;
  scores?: {
    verbal: number | null;
    kuantitatif: number | null;
    logika: number | null;
    spasial: number | null;
    total: number | null;
  } | null;
  certificate?: {
    certificate_no: string;
    verify_url: string;
    download_url: string;
    public_pdf_url?: string | null;
  } | null;
  question_package: ParticipantAssignedQuestionPackage | null;
};
