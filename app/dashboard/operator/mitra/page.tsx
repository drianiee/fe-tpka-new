// app/dashboard/admin/partners/page.tsx
"use client";

import { AddPartnerDialog } from "@/components/partners/AddPartnerDialog";
import { PartnersTable } from "@/components/partners/PartnersTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

export default function AdminMitraPage() {
  return (
    <PageHeaderLayout
      title="Mitra"
      description="Kelola Mitra"
      showBack={false}
      actions={<AddPartnerDialog />}
    >
      <PartnersTable />
    </PageHeaderLayout>
  );
}