export const API_ENDPOINTS = {
  LANDING: {
    SCHEDULES: "/api/schedules/upcoming",
  },
  CERTIFICATES: {
    VERIFY_DATA: (uuid: string | number) => `/api/certificates/data/${uuid}`,
    VERIFY_PDF: (uuid: string | number) => `/api/certificates/pdf/${uuid}`,
  },
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    VERIFY_EMAIL: "/api/auth/email/verify",
    ME: "/api/me",
    LOGOUT: "/api/logout",
    COMPLETE_PROFILE: "/api/auth/complete-profile",
    RESEND_VERIFY: "/api/auth/email/resend",
  },

  DASHBOARD: {
    BASE: "/api/dashboard",
    REVENUE_CHART: "/api/dashboard/revenue-chart",
    PARTICIPANTS_CHART: "/api/dashboard/participants-chart",
  },

  SCHEDULES: {
    BASE: "/api/schedules",
    DETAIL: (id: number | string) => `/api/schedules/${id}`,
    PARTICIPANTS: (scheduleId: number | string) =>
      `/api/schedules/${scheduleId}/participants`,
    PARTICIPANT_DELETE: (
      scheduleId: number | string,
      userId: number | string
    ) => `/api/schedules/${scheduleId}/participants/${userId}`,
    PARTICIPANT_RETAKE: (
      scheduleId: number | string,
      userId: number | string
    ) => `/api/schedules/${scheduleId}/participants/${userId}/retake`,
    PARTNER_IMPORT: (scheduleId: number | string) =>
      `/api/schedules/${scheduleId}/partner/import`,
    PARTNER_IMPORT_TEMPLATE: (scheduleId: number | string) =>
      `/api/schedules/${scheduleId}/partner/import-template`,
    PARTICIPANTS_EXPORT: (scheduleId: number | string) =>
      `/api/schedules/${scheduleId}/participants/export`,
  },

  PARTNERS: {
    BASE: "/api/partners",
    DETAIL: (id: number | string) => `/api/partners/${id}`,
  },

  PARTNER: {
    ONBOARDING: "/api/partner/onboarding/claim",
    PREVIEW: "/api/partner/onboarding/preview",
  },
  
  QUESTION_PACKAGES: {
    BASE: "/api/question-packages",
    DETAIL: (id: number | string) => `/api/question-packages/${id}`,
    STATUS: (id: number | string) => `/api/question-packages/${id}/status`,
    SECTIONS: (id: number | string) => `/api/question-packages/${id}/sections`,
    QUESTIONS: (id: number | string) => `/api/question-packages/${id}/questions`,
    IMPORT_TEMPLATE: (id: number | string) =>
      `/api/question-packages/${id}/questions/import-template`,
    IMPORT: (id: number | string) =>
      `/api/question-packages/${id}/questions/import`,
  },
  QUESTIONS: {
    DETAIL: (id: number | string) => `/api/questions/${id}`,
    IMAGE_UPLOAD: "/api/admin/question-images",
  },

  PAYMENTS: {
    MIDTRANS_CREATE: "/api/payments/midtrans/create",
    MIDTRANS_CALLBACK: "/api/payments/midtrans/callback",
    MIDTRANS_SYNC: "/api/participant/payments/midtrans/sync",
    PAY_BY_SCHEDULE: (scheduleId: number | string) =>
      `/api/participant/schedules/${scheduleId}/pay`,
  },

  ADMIN: {
    OPERATORS: "/api/admin/operators",
    CREATE_OPERATOR: "/api/admin/users/operator",
    OPERATOR_DETAIL: (id: number | string) => `/api/admin/operators/${id}`,
    OPERATOR_STATUS: (id: number | string) =>
      `/api/admin/operators/${id}/status`,
    OPERATOR_DELETE: (id: number | string) => `/api/admin/operators/${id}`,

    CERTIFICATES: {
      ROOT: "/api/admin/certificates",
      DETAIL: (id: number | string) => `/api/admin/certificates/${id}`,
      LAYOUT: (id: number | string) => `/api/admin/certificates/${id}/layout`,
      ACTIVATE: (id: number | string) =>
        `/api/admin/certificates/${id}/activate`,
    },
  },

  PARTICIPANTS: {
    BASE: "/api/participants",
    DETAIL: (id: number | string) => `/api/participants/${id}`,
  },
  PARTICIPANT: {
    SCHEDULES: "/api/participant/schedules",
    SCHEDULE_REGISTER: (id: number | string) =>
      `/api/participant/schedules/${id}/register`,
    MY_SCHEDULES: "/api/participant/my-schedules",
    MY_SCHEDULE_DETAIL: (id: number | string) =>
      `/api/participant/my-schedules/${id}`,
    SCORES: "/api/participant/scores",
    SCORE_DETAIL: (id: number | string) => `/api/participant/scores/${id}`,
    ATTEMPT_START: (scheduleId: number | string) =>
      `/api/participant/schedules/${scheduleId}/attempts`,
    ATTEMPT: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}`,
    ATTEMPT_ANSWER: (attemptId: number | string, questionId: number | string) =>
      `/api/participant/attempts/${attemptId}/answers/${questionId}`,
    ATTEMPT_ANSWERS_BATCH: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}/answers/batch`,
    ATTEMPT_HEARTBEAT: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}/heartbeat`,
    ATTEMPT_VIOLATION: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}/violation`,
    ATTEMPT_SUBMIT: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}/submit`,
    ATTEMPT_RESULT: (attemptId: number | string) =>
      `/api/participant/attempts/${attemptId}/result`,
  },
  PAYMENTS_ADMIN: {
    BASE: "/api/payments",
    DETAIL: (id: number | string) => `/api/payments/${id}`,
  },
} as const;
