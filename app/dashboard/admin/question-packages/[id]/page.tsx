"use client";

import { useParams } from "next/navigation";
import { QuestionPackageDetail } from "@/components/packages/QuestionPackageDetail";

export default function AdminQuestionPackageDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <QuestionPackageDetail
      packageId={Number(params.id)}
      backHref="/dashboard/admin/question-packages"
    />
  );
}
