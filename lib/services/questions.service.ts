import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ImportQuestionsResponse,
  ListQuestionsParams,
  ListQuestionsResponse,
  QuestionPayload,
  QuestionResponse,
  UploadedQuestionImage,
} from "@/lib/types/questions";

export const questionsService = {
  list(packageId: number | string, params?: ListQuestionsParams) {
    return http
      .get<ListQuestionsResponse>(API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId), { params })
      .then((r) => r.data);
  },

  create(packageId: number | string, payload: QuestionPayload) {
    return http
      .post<QuestionResponse>(API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId), payload)
      .then((r) => r.data);
  },

  update(questionId: number | string, payload: QuestionPayload) {
    return http
      .put<QuestionResponse>(API_ENDPOINTS.QUESTIONS.DETAIL(questionId), payload)
      .then((r) => r.data);
  },

  destroy(questionId: number | string) {
    return http.delete(API_ENDPOINTS.QUESTIONS.DETAIL(questionId)).then((r) => r.data);
  },

  importCsv(packageId: number | string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return http
      .post<ImportQuestionsResponse>(API_ENDPOINTS.QUESTION_PACKAGES.IMPORT(packageId), form)
      .then((r) => r.data);
  },

  downloadTemplate(packageId: number | string) {
    return http
      .get<Blob>(API_ENDPOINTS.QUESTION_PACKAGES.IMPORT_TEMPLATE(packageId), { responseType: "blob" })
      .then((r) => r.data);
  },

  uploadImage(file: File) {
    const form = new FormData();
    form.append("image", file);
    return http
      .post<UploadedQuestionImage>(API_ENDPOINTS.QUESTIONS.IMAGE_UPLOAD, form)
      .then((r) => r.data);
  },
};
