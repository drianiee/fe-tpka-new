import { PackageExamPreviewPage } from "@/components/packages/PackageExamPreviewPage";

export default async function QuestionPackageExamPreviewRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back } = await searchParams;

  return (
    <PackageExamPreviewPage
      packageId={Number(id)}
      backHref={back || "/dashboard/admin/question-packages"}
    />
  );
}
