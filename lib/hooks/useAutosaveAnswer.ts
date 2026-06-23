"use client";
import { useMutation } from "@tanstack/react-query";
import { examService } from "@/lib/services/exam.service";
import type { SaveExamAnswer } from "@/lib/types/exam";

export function useAutosaveAnswer(attemptId: string) {
  return useMutation({ mutationFn: ({ questionId, answer }: { questionId: number; answer: SaveExamAnswer }) => examService.saveAnswer(attemptId, questionId, answer) });
}
