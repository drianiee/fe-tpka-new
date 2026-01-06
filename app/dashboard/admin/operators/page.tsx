// app/dashboard/admin/operators/page.tsx
"use client";

import { AddOperatorDialog } from "@/components/operators/AddOperatorDialog";
import { OperatorsTable } from "@/components/operators/OperatorsTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

export default function AdminOperatorPage() {
  return (
    <PageHeaderLayout
      title="Operator"
      description="Kelola Operator"
      showBack={false}
      actions={<AddOperatorDialog />}
    >
      <OperatorsTable />
    </PageHeaderLayout>
  );
}