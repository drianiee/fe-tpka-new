import type { PaginatedResponse } from "@/lib/types/pagination";

export type QuestionPackageStatus = "draft" | "published" | "archived";
export type SectionCode = "verbal" | "kuantitatif" | "logika" | "spasial";
export type ExamSection = {
  id: number;
  code: SectionCode | string | null;
  name: string;
  description: string | null;
  order_number: number;
  duration_minutes: number;
  question_count: number;
  questions_count?: number;
};
export type QuestionPackage = {
  id: number;
  name: string;
  description: string | null;
  status: QuestionPackageStatus;
  total_duration_minutes: number;
  total_questions: number;
  sections_count?: number;
  sections?: ExamSection[];
  summary?: Record<string, number>;
  created_at: string;
  updated_at: string;
};
export type ListQuestionPackagesResponse = PaginatedResponse<QuestionPackage>;
export type DetailQuestionPackageResponse = { data: QuestionPackage };
export type CreateQuestionPackageRequest = { name: string; description?: string; status: QuestionPackageStatus; total_duration_minutes: number };
export type CreateQuestionPackageResponse = { message?: string; data: QuestionPackage };
export type UpdateQuestionPackageStatusRequest = { status: QuestionPackageStatus };
export type UpdateQuestionPackageStatusResponse = { message?: string; data: QuestionPackage };
export type DeleteQuestionPackageResponse = { message?: string };
