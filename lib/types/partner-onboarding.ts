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
  moodle?: {
    sync_enabled: boolean
    ok: boolean
    step: string | null
    error: string | null
    warnings: string[]
    moodle_user_id?: number | null
    course_id?: number | null
    groups_assigned?: number | null
    login?: { username: string; password: string } | null
  }
}
