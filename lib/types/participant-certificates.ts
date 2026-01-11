// lib/types/participant-certificates.ts
export type ParticipantScoreStatus = string;

export type ParticipantScoresListParams = {
  status?: "all" | "upcoming" | "done" | string;
};

export type ParticipantScoreItem = {
  id: number;
  date: string; // "2026-01-11 00:00:00"
  start_time: string; // "01:00:00"
  end_time: string; // "03:00:00"
  status: ParticipantScoreStatus;
  partner: { id?: number; name?: string } | string | null;

  scores: {
    verbal: number | null;
    kuantitatif: number | null;
    logika: number | null;
    spasial: number | null;
    total: number | null;
  };

  certificate: {
    certificate_no: string;
    verify_url: string;
    download_url: string;
  } | null;
};

export type ParticipantScoresListResponse = {
  status: string;
  count: number;
  data: ParticipantScoreItem[];
};

export type ParticipantScoreDetailResponse = ParticipantScoreItem;
