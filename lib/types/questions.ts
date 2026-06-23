import type { PaginatedResponse } from "@/lib/types/pagination";
import type { ExamSection } from "@/lib/types/question-packages";

export type QuestionOptionAdmin = {
  id?: number;
  option_label: "A" | "B" | "C" | "D";
  option_text: string | null;
  option_image: string | null;
  is_correct: boolean;
  order_number?: number;
};

export type QuestionAdmin = {
  id: number;
  question_package_id: number;
  exam_section_id: number;
  type: "multiple_choice" | "single_choice" | string;
  question_text: string | null;
  question_image: string | null;
  explanation: string | null;
  difficulty: string | null;
  score: number | string;
  is_active: boolean;
  order_number: number;
  section?: ExamSection;
  options: QuestionOptionAdmin[];
  created_at?: string;
  updated_at?: string;
};

export type QuestionPayload = {
  exam_section_id: number;
  order_number?: number;
  question_text?: string | null;
  question_image?: string | null;
  explanation?: string | null;
  difficulty?: string | null;
  score?: number;
  is_active: boolean;
  options: QuestionOptionAdmin[];
};

export type ListQuestionsParams = {
  section_id?: number;
  section_code?: string;
  search?: string;
  difficulty?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
};

export type ImportQuestionsResponse = {
  message: string;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
};

export type UploadedQuestionImage = {
  url: string;
  path: string;
};

export type ListQuestionsResponse = PaginatedResponse<QuestionAdmin>;
export type QuestionResponse = { message?: string; data: QuestionAdmin };
