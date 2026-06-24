import { redirect } from "next/navigation";

export default async function OperatorQuestionPackagePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/exam-preview/question-packages/${id}?back=${encodeURIComponent(`/dashboard/operator/question-packages/${id}`)}`);
}
