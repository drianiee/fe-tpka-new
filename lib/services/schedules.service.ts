import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

import type { PaginatedResponse } from "@/lib/types/pagination";
import type {
  AddParticipantRequest,
  AddParticipantResponse,
  CreateScheduleRequest,
  CreateScheduleResponse,
  ExportScheduleParticipantsResponse,
  ExportSchedulesResponse,
  PartnerImportResponse,
  RemoveParticipantResponse,
  RegisterScheduleResponse,
  ScheduleDetail,
  ScheduleListItem,
} from "@/lib/types/schedules";

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

export const schedulesService = {
  list(params?: ListSchedulesParams): Promise<PaginatedResponse<ScheduleListItem>> {
    return http.get(API_ENDPOINTS.SCHEDULES.BASE, { params }).then((r) => r.data);
  },

  exportExcel(params?: Omit<ListSchedulesParams, "per_page" | "page">): Promise<ExportSchedulesResponse> {
    return http
      .get(API_ENDPOINTS.SCHEDULES.BASE, { params: { ...(params ?? {}), print: 1 } })
      .then((r) => r.data);
  },

  create(payload: CreateScheduleRequest): Promise<CreateScheduleResponse> {
    return http.post(API_ENDPOINTS.SCHEDULES.BASE, payload).then((r) => r.data);
  },

  detail(id: number | string, params?: ScheduleDetailParams): Promise<ScheduleDetail> {
    return http.get(API_ENDPOINTS.SCHEDULES.DETAIL(id), { params }).then((r) => r.data);
  },

  addParticipant(scheduleId: number | string, payload: AddParticipantRequest): Promise<AddParticipantResponse> {
    return http
      .post(API_ENDPOINTS.SCHEDULES.PARTICIPANTS(scheduleId), payload)
      .then((r) => r.data);
  },

  removeParticipant(scheduleId: number | string, userId: number | string): Promise<RemoveParticipantResponse> {
    return http
      .delete(API_ENDPOINTS.SCHEDULES.PARTICIPANT_DELETE(scheduleId, userId))
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

  exportParticipants(scheduleId: number | string): Promise<ExportScheduleParticipantsResponse> {
    return http.get(API_ENDPOINTS.SCHEDULES.PARTICIPANTS_EXPORT(scheduleId)).then((r) => r.data);
  },

  // ✅ participant flow: register schedule -> midtrans snap
  registerParticipant(scheduleId: number | string): Promise<RegisterScheduleResponse> {
    return http.post(API_ENDPOINTS.SCHEDULES.PARTICIPANT_REGISTER(scheduleId)).then((r) => r.data);
  },
};
