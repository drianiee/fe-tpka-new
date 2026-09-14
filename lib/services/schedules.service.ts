// src/lib/services/schedules.service.ts (tambahan fungsi peserta)

import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type { PaginatedResponse } from "@/lib/types/pagination";
import type {
  AddParticipantRequest,
  AddParticipantResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
  ExportScheduleParticipantsResponse,
  GrantRetakeResponse,
  PartnerImportResponse,
  RemoveParticipantResponse,
  RegisterScheduleResponse,
  ScheduleDetail,
  ScheduleListItem,
} from "@/lib/types/schedules";

import type {
  ParticipantSchedulesResponse,
  ParticipantScheduleListItem,
} from "@/lib/types/participant";

import type {
  ParticipantMySchedulesResponse,
  ParticipantMyScheduleDetail,
  ParticipantMySchedulesStatusFilter,
} from "@/lib/types/participant-my-schedules";

export type ListSchedulesParams = {
  q?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
};

export type ScheduleDetailParams = {
  q?: string;
  per_page?: number;
  page?: number;
};

export type ExportParticipantsParams = {
  q?: string;
};

export type ParticipantSchedulesParams = {
  limit?: number;
};

export type ParticipantMySchedulesParams = {
  status?: ParticipantMySchedulesStatusFilter; // default: "all"
};

export type ExportSchedulesFile = {
  blob: Blob;
  filename: string;
};

function isParticipantScheduleRow(v: unknown): v is ParticipantScheduleListItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;

  return (
    typeof o["id"] === "number" &&
    typeof o["date"] === "string" &&
    typeof o["start_time"] === "string" &&
    typeof o["price"] === "string" &&
    typeof o["capacity"] === "number" &&
    typeof o["current_participants"] === "number" &&
    typeof o["status"] === "string"
  );
}

export const schedulesService = {
  list(params?: ListSchedulesParams): Promise<PaginatedResponse<ScheduleListItem>> {
    return http.get(API_ENDPOINTS.SCHEDULES.BASE, { params }).then((r) => r.data);
  },

  exportExcel(
    params?: Omit<ListSchedulesParams, "per_page" | "page">
  ): Promise<ExportSchedulesFile> {
    return http
      .get(API_ENDPOINTS.SCHEDULES.BASE, {
        params: { ...(params ?? {}), export: 1 },
        responseType: "blob",
      })
      .then((r) => {
        const disposition = String(r.headers["content-disposition"] ?? "");
        const matched = disposition.match(/filename="?([^"]+)"?/i);

        return {
          blob: r.data,
          filename: matched?.[1] ?? "schedules.xlsx",
        };
      });
  },

  create(payload: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    return http.post(API_ENDPOINTS.SCHEDULES.BASE, payload).then((r) => r.data);
  },

  detail(id: number | string, params?: ScheduleDetailParams): Promise<ScheduleDetail> {
    return http.get(API_ENDPOINTS.SCHEDULES.DETAIL(id), { params }).then((r) => r.data);
  },

  addParticipant(
    scheduleId: number | string,
    payload: AddParticipantRequest
  ): Promise<AddParticipantResponse> {
    return http
      .post(API_ENDPOINTS.SCHEDULES.PARTICIPANTS(scheduleId), payload)
      .then((r) => r.data);
  },

  removeParticipant(
    scheduleId: number | string,
    userId: number | string
  ): Promise<RemoveParticipantResponse> {
    return http
      .delete(API_ENDPOINTS.SCHEDULES.PARTICIPANT_DELETE(scheduleId, userId))
      .then((r) => r.data);
  },

  grantRetake(
    scheduleId: number | string,
    userId: number | string
  ): Promise<GrantRetakeResponse> {
    return http
      .post(API_ENDPOINTS.SCHEDULES.PARTICIPANT_RETAKE(scheduleId, userId))
      .then((r) => r.data);
  },

  grantResume(
    scheduleId: number | string,
    userId: number | string
  ): Promise<GrantRetakeResponse> {
    return http
      .post(API_ENDPOINTS.SCHEDULES.PARTICIPANT_RESUME(scheduleId, userId))
      .then((r) => r.data);
  },

  partnerImport(scheduleId: number | string, file: File): Promise<PartnerImportResponse> {
    const fd = new FormData();
    fd.append("file", file);

    return http
      .post(API_ENDPOINTS.SCHEDULES.PARTNER_IMPORT(scheduleId), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  partnerImportTemplateUrl(scheduleId: number | string): string {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

    return `${baseUrl}${API_ENDPOINTS.SCHEDULES.PARTNER_IMPORT_TEMPLATE(
      scheduleId,
    )}`;
  },

  exportParticipants(
    scheduleId: number | string,
    params?: ExportParticipantsParams
  ): Promise<ExportSchedulesFile> {
    return http
      .get(API_ENDPOINTS.SCHEDULES.PARTICIPANTS_EXPORT(scheduleId), {
        params,
        responseType: "blob",
      })
      .then((r) => {
        const disposition = String(r.headers["content-disposition"] ?? "");
        const matched = disposition.match(/filename="?([^"]+)"?/i);

        return {
          blob: r.data,
          filename: matched?.[1] ?? `schedule-${scheduleId}-participants.xlsx`,
        };
      });
  },

  registerParticipant(scheduleId: number | string): Promise<RegisterScheduleResponse> {
    return http.post(API_ENDPOINTS.PARTICIPANT.SCHEDULE_REGISTER(scheduleId)).then((r) => r.data);
  },

  participantSchedules(params?: ParticipantSchedulesParams): Promise<ParticipantSchedulesResponse> {
    return http.get(API_ENDPOINTS.PARTICIPANT.SCHEDULES, { params }).then((r) => {
      const raw: unknown = r.data;

      if (!Array.isArray(raw)) return [];

      const out: ParticipantScheduleListItem[] = [];
      for (const row of raw) {
        if (!isParticipantScheduleRow(row)) continue;
        out.push(row);
      }

      return out;
    });
  },

  participantMySchedules(
    params?: ParticipantMySchedulesParams
  ): Promise<ParticipantMySchedulesResponse> {
    return http.get(API_ENDPOINTS.PARTICIPANT.MY_SCHEDULES, { params }).then((r) => r.data);
  },

  participantMyScheduleDetail(id: number | string): Promise<ParticipantMyScheduleDetail> {
    return http.get(API_ENDPOINTS.PARTICIPANT.MY_SCHEDULE_DETAIL(id)).then((r) => r.data);
  },
};
