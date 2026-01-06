// src/lib/services/landing.service.ts

import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { LandingSchedulesResponse } from "@/lib/types/landing";

export const landingService = {
  getUpcomingSchedules: async (): Promise<LandingSchedulesResponse> => {
    const res = await http.get<LandingSchedulesResponse>(API_ENDPOINTS.LANDING.SCHEDULES);
    return res.data;
  },
};
