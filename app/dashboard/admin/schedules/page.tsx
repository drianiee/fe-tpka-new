// app/dashboard/admin/schedules/page.tsx
"use client"

import { AddScheduleDialog } from "@/components/schedules/AddScheduleDialog"
import { SchedulesTable } from "@/components/schedules/SchedulesTable"
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout"

export default function AdminSchedulesPage() {
  return (
    <PageHeaderLayout
      title="Jadwal Tes"
      description="Kelola jadwal tes"
      showBack={false}
      actions={<AddScheduleDialog />}
    >
      <SchedulesTable />
    </PageHeaderLayout>
  )
}
