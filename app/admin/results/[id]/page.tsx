import { MeritAndMarksheetsView } from '@/src/views/admin/examinations/MeritAndMarksheetsView';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MeritAndMarksheetsView initialExamId={id} />;
}
