// lib/services/users.service.ts
import { http } from "@/lib/api/http";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type CreateOperatorRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type CreateOperatorResponse = {
  message: string;
  operator: {
    id: number;
    name: string;
    email: string;
    role: "operator";
    is_active: boolean;
    email_verified_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
};

export const usersService = {
  createOperator: async (payload: CreateOperatorRequest) => {
    const res = await http.post<CreateOperatorResponse>(
      API_ENDPOINTS.ADMIN.CREATE_OPERATOR,
      payload
    );
    return res.data;
  },
};
