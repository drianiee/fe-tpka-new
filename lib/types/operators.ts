// lib/types/operators.ts
export type Operator = {
  id: number;
  name: string;
  email: string;
  role: "operator";
  is_active: boolean;

  phone?: string | null;
  birth_date?: string | null;
  profile_completed_at?: string | null;
  email_verified_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type OperatorListItem = Operator;

export type OperatorDetailResponse = {
  operator: Operator;
};

export type UpdateOperatorStatusResponse = {
  message: string;
  operator: Operator;
};

export type DeleteOperatorResponse = {
  message: string;
};
