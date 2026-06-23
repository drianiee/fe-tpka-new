export type PartnerOnboardingResponse = {
  message: string
  user: {
    id: number
    name: string
    email: string
    email_verified_at: string | null
    profile_completed_at: string | null
    role: string
  }
  token: string
  schedule_id: number | null
  partner: { id: number; name: string } | null
  package_id: number | null
  attempt_id?: number | null
}
