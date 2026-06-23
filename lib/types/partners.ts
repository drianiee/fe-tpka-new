export type PartnerListItem = {
  id: number
  name: string
  code?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type PartnerLite = {
  id: number
  name: string
}

export type CreatePartnerRequest = {
  name: string
  code?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  is_active?: boolean
}

export type CreatePartnerResponse = {
  message: string
  partner: PartnerListItem
}

export type PartnerDetail = PartnerListItem & {
  schedules_count?: number
}

export type PartnerSchedulePackage = {
  id: number
  name: string
  is_active?: boolean
  pivot?: {
    test_schedule_id: number
    question_package_id: number
  }
}

export type PartnerScheduleItem = {
  id: number
  date: string
  start_time: string
  end_time: string
  capacity: number
  is_partner: boolean
  partner_id: number | null
  price: string

  question_package_id: number
  attempt_count?: number
  submitted_count?: number

  created_at?: string
  updated_at?: string

  current_participants: number
  status: string

  packages: PartnerSchedulePackage[]
}

export type PartnerSchedulesPaginated = {
  current_page: number
  data: PartnerScheduleItem[]
  from: number | null
  last_page: number
  last_page_url: string | null
  next_page_url: string | null
  prev_page_url: string | null
  path: string | null
  per_page: number
  to: number | null
  total: number
}

export type PartnerDetailResponse = {
  partner: PartnerDetail
  schedules: PartnerSchedulesPaginated
}
