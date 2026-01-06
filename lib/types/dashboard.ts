export type DashboardTotals = {
  participants: number
  income_paid: number
  paid_count: number
  total_schedules: number
}

export type LatestSchedule = {
  id: number
  date: string
  start_time: string
  end_time: string
  price: string
  is_partner: boolean
  capacity: number
  current_participants: number
  partner_id?: number | null
  end_dt?: string
  status?: string
  quiz_url?: string | null
}

export type DashboardResponse = {
  totals: DashboardTotals
  latest_schedules: LatestSchedule[]
}

export type RevenueChartPoint = {
  month: number
  amount: number
  count: number
}

export type RevenueChartResponse = {
  year: number
  currency: string
  series: RevenueChartPoint[]
  total_amount: number
  total_count: number
}

export type ParticipantsChartPoint = {
  month: number
  participants: number
}

export type ParticipantsChartResponse = {
  year: number
  series: ParticipantsChartPoint[]
  total_participants: number
  source: string
}
