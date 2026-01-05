export type PaymentStatus =
  | "pending"
  | "capture"
  | "settlement"
  | "deny"
  | "cancel"
  | "expire"
  | "failure"
  | string

export type PaymentSummary = {
  income_paid_total: number
  count_paid: number
  count_pending: number
  count_failed: number
}

export type PaymentUserLite = {
  id: number
  name: string
  email: string
}

export type PaymentPartnerLite = {
  id: number
  name: string
}

export type PaymentScheduleLite = {
  id: number
  date: string
  start_time: string
  end_time: string
  price: string
  is_partner: boolean
  partner: PaymentPartnerLite | null
}

export type PaymentListItem = {
  id: number
  order_id: string | null
  amount: number
  transaction_status: PaymentStatus
  payment_type: string | null
  fraud_status: string | null
  bank: string | null
  va_number: string | null
  transaction_time: string | null
  settlement_time: string | null
  paid_at: string | null
  user: PaymentUserLite | null
  schedule: PaymentScheduleLite | null
}

export type PaymentsListResponse = {
  summary: PaymentSummary
  payments: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    next_page_url: string | null
    prev_page_url: string | null
    data: PaymentListItem[]
  }
}

export type PaymentDetail = {
  id: number
  user_id: number
  schedule_id: number
  order_id: string | null
  transaction_id: string | null
  snap_token: string | null
  snap_redirect_url: string | null

  amount: number
  transaction_status: PaymentStatus
  payment_type: string | null
  fraud_status: string | null

  status_code: string | null
  status_message: string | null

  bank: string | null
  va_number: string | null
  va_numbers: unknown

  transaction_time: string | null
  settlement_time: string | null
  paid_at: string | null

  payload: unknown

  created_at: string | null
  updated_at: string | null

  user: PaymentUserLite | null

  schedule: (PaymentScheduleLite & {
    moodle_course_id?: number | null
    moodle_quiz_id?: number | null
    moodle_quiz_cmid?: number | null
  }) | null
}

export type PaymentDetailResponse = {
  payment: PaymentDetail
}
