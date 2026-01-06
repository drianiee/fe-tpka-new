import { api } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type {
  DashboardResponse,
  ParticipantsChartResponse,
  RevenueChartResponse,
} from "@/lib/types/dashboard"

export class DashboardService {
  async getDashboard(limit = 10): Promise<DashboardResponse> {
    const res = await api.get<DashboardResponse>(API_ENDPOINTS.DASHBOARD.BASE, {
      params: { limit },
    })
    return res.data
  }

  async getRevenueChart(year?: number): Promise<RevenueChartResponse> {
    const y = year ?? new Date().getFullYear()
    const res = await api.get<RevenueChartResponse>(API_ENDPOINTS.DASHBOARD.REVENUE_CHART, {
      params: { year: y },
    })
    return res.data
  }

  async getParticipantsChart(year?: number): Promise<ParticipantsChartResponse> {
    const y = year ?? new Date().getFullYear()
    const res = await api.get<ParticipantsChartResponse>(
      API_ENDPOINTS.DASHBOARD.PARTICIPANTS_CHART,
      {
        params: { year: y },
      }
    )
    return res.data
  }
}

export const dashboardService = new DashboardService()
