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

  importFile(sectionId: number | string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return http
      .post<ImportQuestionsResponse>(API_ENDPOINTS.SECTIONS.IMPORT(sectionId), form)
      .then((r) => r.data);
  },

  downloadTemplate(sectionId: number | string, fallbackFilename = "template-soal.xlsx") {
    return http
      .get<Blob>(API_ENDPOINTS.SECTIONS.IMPORT_TEMPLATE(sectionId), { responseType: "blob" })
      .then((r) => {
        // Content-Disposition hanya terbaca kalau backend mengizinkannya lewat
        // Access-Control-Expose-Headers. Kalau tidak, pakai nama cadangan.
        const disposition = String(r.headers?.["content-disposition"] ?? "");
        const matched = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
        return {
          blob: r.data,
          filename: matched?.[1] ? decodeURIComponent(matched[1]) : fallbackFilename,
        };
      });
  },

  exportQuestions(packageId: number | string, fallbackFilename = "soal.xlsx") {
    return http
      .get<Blob>(API_ENDPOINTS.QUESTION_PACKAGES.EXPORT_QUESTIONS(packageId), {
        responseType: "blob",
      })
      .then((r) => {
        const disposition = String(r.headers?.["content-disposition"] ?? "");
        const matched = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
        return {
          blob: r.data,
          filename: matched?.[1] ? decodeURIComponent(matched[1]) : fallbackFilename,
        };
      });
  },

  uploadImage(file: File) {
    const form = new FormData();
    form.append("image", file);
    return http
      .post<UploadedQuestionImage>(API_ENDPOINTS.QUESTIONS.IMAGE_UPLOAD, form)
      .then((r) => r.data);
  },
};
