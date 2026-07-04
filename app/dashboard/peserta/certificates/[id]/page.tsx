// app/dashboard/peserta/certificates/[id]/page.tsx
import { redirect } from "next/navigation";

export default function ParticipantCertificateDetailPage() {
  redirect("/dashboard/peserta/my-schedules?status=all");
}
