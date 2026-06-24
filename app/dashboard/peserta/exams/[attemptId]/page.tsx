import { redirect } from "next/navigation";

export default async function ParticipantExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  redirect(`/exams/${attemptId}`);
}
