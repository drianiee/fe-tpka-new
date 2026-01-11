// lib/services/participant-certificates.service.ts
import { api } from "@/lib/api/client";
import type {
  ParticipantScoresListParams,
  ParticipantScoresListResponse,
  ParticipantScoreDetailResponse,
} from "@/lib/types/participant-certificates";

export const participantCertificatesService = {
  async list(params?: ParticipantScoresListParams) {
    const res = await api.get<ParticipantScoresListResponse>("/api/participant/scores", {
      params,
    });
    return res.data;
  },

  async detail(id: number) {
    const res = await api.get<ParticipantScoreDetailResponse>(`/api/participant/scores/${id}`);
    return res.data;
  },
};
