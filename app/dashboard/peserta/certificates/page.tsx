import { redirect } from "next/navigation";

export default function ParticipantCertificatesPage() {
  redirect("/dashboard/peserta/my-schedules?status=all");
}
