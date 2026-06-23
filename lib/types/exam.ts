export type ExamOption = {
  id: number;
  option_label: string;
  option_text: string | null;
  option_image: string | null;
};

export type ExamQuestion = {
  id: number;
  section_id: number;
  order_number: number;
  question_text: string | null;
  question_image: string | null;
  options: ExamOption[];
};

export type ExamSection = {
  id: number;
  name: string;
  description: string | null;
  order_number: number;
  duration_minutes: number;
  question_count: number;
};

export type ExamAnswer = {
  question_id: number;
  question_option_id: number | null;
  answer_text: string | null;
  is_flagged: boolean;
  answered_at?: string | null;
};

export type AttemptAnswer = ExamAnswer;

export type ExamAttempt = {
  id: number;
  status: "in_progress" | "submitted" | "expired" | "cancelled";
  server_time: string;
  started_at: string;
  expires_at: string;
  schedule: { id: number; title: string; start_at: string; end_at: string };
  question_package: { id: number; name: string; total_duration_minutes: number; total_questions: number };
  sections: ExamSection[];
  questions: ExamQuestion[];
  answers: ExamAnswer[];
};

export type SaveExamAnswer = {
  question_option_id: number | null;
  answer_text?: string | null;
  is_flagged?: boolean;
};

export type ExamResult = {
  id: number;
  status: "submitted" | "expired";
  submitted_at: string | null;
  score_total: number;
  score_breakdown: Array<{ section_id: number; correct_count: number; wrong_count: number; unanswered_count: number; raw_score: number; final_score: number }>;
  schedule?: { id: number; title: string };
  question_package?: { id: number; name: string };
};
