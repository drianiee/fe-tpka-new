import { useQuery } from "@tanstack/react-query";
import { examService } from "@/lib/services/exam.service";

export function useExamAttempt(attemptId: string) {
  return useQuery({
    queryKey: ["exam-attempt", attemptId],
    queryFn: () => examService.get(attemptId),
    enabled: Boolean(attemptId),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });
}
