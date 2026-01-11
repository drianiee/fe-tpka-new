// app/dashboard/admin/peserta/page.tsx
"use client";

import { ParticipantsTable } from "@/components/participants/ParticipantsTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

export default function AdminParticipantsPage() {
  return (
    <PageHeaderLayout
      title="Peserta"
      description="Kelola dan lihat data peserta"
      showBack={false}
    >
      <ParticipantsTable />
    </PageHeaderLayout>
  );
}