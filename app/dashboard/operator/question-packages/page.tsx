// app/dashboard/admin/question-packages/page.tsx
"use client";

import { AddQuestionPackageDialog } from "@/components/packages/AddQuestionPackageDialog";
import { QuestionPackagesTable } from "@/components/packages/QuestionPackagesTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

export default function AdminPackagesPage() {
  return (
    <PageHeaderLayout
      title="Paket Soal"
      description="Kelola Paket Soal"
      showBack={false}
      actions={<AddQuestionPackageDialog />}
    >
      <QuestionPackagesTable />
    </PageHeaderLayout>
  );
}