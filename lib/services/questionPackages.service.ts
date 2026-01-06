// lib/services/questionPackages.service.ts
import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ListQuestionPackagesResponse,
  DetailQuestionPackageResponse,
  CreateQuestionPackageRequest,
  CreateQuestionPackageResponse,
  UpdateQuestionPackageStatusRequest,
  UpdateQuestionPackageStatusResponse,
  DeleteQuestionPackageResponse,
} from "@/lib/types/question-packages";

export type ListQuestionPackagesParams = {
  q?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
};

export const questionPackagesService = {
  list(params?: ListQuestionPackagesParams): Promise<ListQuestionPackagesResponse> {
    return http
      .get(API_ENDPOINTS.QUESTION_PACKAGES.BASE, { params })
      .then((r) => r.data as ListQuestionPackagesResponse);
  },

  detail(id: number | string): Promise<DetailQuestionPackageResponse> {
    return http
      .get(API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(id))
      .then((r) => r.data as DetailQuestionPackageResponse);
  },

  create(payload: CreateQuestionPackageRequest): Promise<CreateQuestionPackageResponse> {
    return http
      .post(API_ENDPOINTS.QUESTION_PACKAGES.BASE, payload)
      .then((r) => r.data as CreateQuestionPackageResponse);
  },

  updateStatus(
    id: number | string,
    payload: UpdateQuestionPackageStatusRequest
  ): Promise<UpdateQuestionPackageStatusResponse> {
    return http
      .patch(API_ENDPOINTS.QUESTION_PACKAGES.STATUS(id), payload)
      .then((r) => r.data as UpdateQuestionPackageStatusResponse);
  },

  destroy(id: number | string): Promise<DeleteQuestionPackageResponse> {
    return http
      .delete(API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(id))
      .then((r) => r.data as DeleteQuestionPackageResponse);
  },
};
