export type QuestionPackage = {
  id: number;
  name: string;
  moodle_group_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ListQuestionPackagesResponse = {
  data: QuestionPackage[];
};

export type DetailQuestionPackageResponse = {
  data: QuestionPackage;
};

export type CreateQuestionPackageRequest = {
  name: string;
  moodle_group_name: string;
  is_active: boolean;
};

export type CreateQuestionPackageResponse = {
  message?: string;
  data: QuestionPackage;
};

export type UpdateQuestionPackageStatusRequest = {
  is_active: boolean;
};

export type UpdateQuestionPackageStatusResponse = {
  message?: string;
  data: QuestionPackage;
};

export type DeleteQuestionPackageResponse = {
  message?: string;
};
