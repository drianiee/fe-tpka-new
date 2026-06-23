// lib/types/participants.ts

export type ParticipantRole = "peserta" | "operator" | "administrator";

export type Participant = {
  id: number;
  name: string;
  email: string;

  email_verified_at: string | null;

  role: ParticipantRole;
  is_active: boolean;

  id_type: "ktp" | "ktm" | "sim" | null;
  id_image_path: string | null;

  // ✅ dari API: URL absolut langsung
  id_image_url: string | null;

  birth_date: string | null; // ISO string dari API
  phone: string | null;

  profile_completed_at: string | null;

  created_at: string;
  updated_at: string;
};

export type ParticipantListItem = Pick<
  Participant,
  "id" | "name" | "email" | "email_verified_at" | "profile_completed_at" | "created_at"
>;

export type ParticipantScheduleItem = {
  schedule_id: number;
  date: string; // ISO date-time
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"

  status_jadwal: string; // "Tes Belum Dimulai", "Tes Sedang Berlangsung", "Tes Selesai"
  attempt_id: number | null;

  is_partner: boolean;
  partner: { id: number; name: string } | null;

  participant_status: string; // "peserta terdaftar" dst
  accessed_at: string | null;
  finished_at: string | null;
  assigned_at: string | null;

  capacity: number;
  current_participants: number;
};

export type ParticipantDetailResponse = {
  participant: Participant;
  schedules: ParticipantScheduleItem[];
  total_schedules: number;
};
