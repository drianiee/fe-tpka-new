// src/lib/types/schedules.ts

import type { PaginatedResponse } from "@/lib/types/pagination";

export type ScheduleStatus =
  | "Tes Belum Dimulai"
  | "Tes Akan Segera Dimulai"
  | "Tes Sedang Berlangsung"
  | "Tes Telah Selesai"
  | string;

export type QuestionPackageLite = {
  id: number;
  name: string;
  is_active?: boolean;
};

export type PartnerLite = {
  id: number;
  name: string;
};

export type ScheduleListItem = {
  id: number;
  date: string; // biasanya "YYYY-MM-DD HH:mm:ss"
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"
  price: string; // "150000.00"

  is_partner: boolean;
  partner_id: number | null;
  partner: PartnerLite | null;

  capacity: number;

  moodle_course_id?: number | null;
  moodle_quiz_id?: number | null;
  moodle_quiz_cmid?: number | null;
  provisioned_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  quiz_url: string | null;
  status: ScheduleStatus;
  current_participants: number;

  packages: QuestionPackageLite[];
};

export type ScheduleParticipantStatus =
  | "peserta terdaftar"
  | "peserta belum terdaftar"
  | "peserta mengakses tes"
  | "peserta selesai tes"
  | string;

export type ScheduleParticipantScores = {
  verbal?: number | null;
  kuantitatif?: number | null;
  logika?: number | null;
  spasial?: number | null;
  total?: number | null;
};

export type ScheduleParticipant = {
  id: number;
  name: string;
  email: string;
  status: ScheduleParticipantStatus;

  scores?: ScheduleParticipantScores | null;
  certificate_download_url?: string | null;

  scores_debug?: unknown;
};

export type ScheduleDetail = Omit<ScheduleListItem, "date"> & {
  date: string;
  participants: PaginatedResponse<ScheduleParticipant>;
};

export type CreateScheduleRequest = {
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:mm"
  end_time?: string; // "HH:mm"
  price?: number;
  capacity?: number;
  is_partner?: boolean;
  partner_id?: number | null;
  package_ids?: number[];
};

export type CreateScheduleResponse = {
  message: string;
  data: ScheduleListItem;
};

export type AddParticipantRequest = {
  user_id: number;
};

export type AddParticipantResponse = {
  message: string;
  schedule: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    price: string;
    is_partner: boolean;
    capacity: number;
    current_participants: number;
    status: ScheduleStatus;
    packages: QuestionPackageLite[];
    users: Array<{ id: number; name: string; email: string }>;
  };
  quiz_url: string | null;
};

export type RemoveParticipantResponse = {
  message: string;
};

export type PartnerImportSummary = {
  created_users: number;
  attached_to_schedule: number;
  sent_invitations: number;
  skipped_rows: number;
};

export type PartnerImportResponse = {
  message: string;
  summary?: PartnerImportSummary;
};

export type ExportSchedulesResponse<T = ScheduleListItem> = {
  message: string;
  mode: "print";
  filters: {
    q?: string | null;
    status?: string | null;
    date_from?: string | null;
    date_to?: string | null;
  };
  total: number;
  download_url: string;
  data?: T[];
};

export type ExportScheduleParticipantsResponse = {
  message: string;
  schedule_id: number;
  total: number;
  download_url: string;
};

/**
 * Participant register schedule (Midtrans Snap)
 * POST /api/participant/schedules/{id}/register
 */
export type RegisterScheduleResponse = {
  message: string;
  mode: "paid" | "free";
  data: {
    schedule_id: number;
    payment_id: number;
    order_id: string;
    snap_token: string;
    redirect_url: string;
    amount: number;
    picked?: {
      question_package_id: number;
      package_name: string;
      moodle_group_name: string;
    };
  };
};
