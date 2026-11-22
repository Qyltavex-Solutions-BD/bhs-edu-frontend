import { ExamSubjectsConfigView } from '@/src/views/admin/examinations/ExamsAndSubjectsView';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ExamSubjectsConfigView initialExamId={id} />;
}
