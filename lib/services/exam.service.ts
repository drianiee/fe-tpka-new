import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ExamAttempt, ExamResult, SaveExamAnswer } from "@/lib/types/exam";

export const examService = {
  start(scheduleId: number | string) {
    return http.post<ExamAttempt>(API_ENDPOINTS.PARTICIPANT.ATTEMPT_START(scheduleId)).then((r) => r.data);
  },
  get(attemptId: number | string) {
    return http.get<ExamAttempt>(API_ENDPOINTS.PARTICIPANT.ATTEMPT(attemptId)).then((r) => r.data);
  },
  saveAnswer(attemptId: number | string, questionId: number | string, answer: SaveExamAnswer) {
    return http.put(API_ENDPOINTS.PARTICIPANT.ATTEMPT_ANSWER(attemptId, questionId), answer).then((r) => r.data);
  },
  saveBatch(attemptId: number | string, answers: Array<SaveExamAnswer & { question_id: number }>) {
    return http.post(API_ENDPOINTS.PARTICIPANT.ATTEMPT_ANSWERS_BATCH(attemptId), { answers }).then((r) => r.data);
  },
  heartbeat(attemptId: number | string) {
    return http.post<{ server_time: string; expires_at: string; status: string }>(API_ENDPOINTS.PARTICIPANT.ATTEMPT_HEARTBEAT(attemptId)).then((r) => r.data);
  },
  submit(attemptId: number | string) {
    return http.post<ExamResult>(API_ENDPOINTS.PARTICIPANT.ATTEMPT_SUBMIT(attemptId)).then((r) => r.data);
  },
  result(attemptId: number | string) {
    return http.get<ExamResult>(API_ENDPOINTS.PARTICIPANT.ATTEMPT_RESULT(attemptId)).then((r) => r.data);
  },
};
