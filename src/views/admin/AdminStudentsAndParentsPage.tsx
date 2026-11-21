'use client';

import { useGetBootstrapQuery } from '@/src/store/api';
import { useI18n } from '@/src/lib/i18n';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { DataTable } from '@/src/components/shared/DataTable';

export { AdminStudentsPage } from '@/src/views/admin/AdminStudentOps';

export function AdminParentsPage() {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const { pick } = useI18n();
  if (isLoading || !db) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={pick('অভিভাবক ডিরেক্টরি ও সংযুক্ত শিক্ষার্থী', 'Parents & Guardians Directory')}
        description={pick(
          'একজন অভিভাবকের সাথে একাধিক শিক্ষার্থী সংযুক্তকরণ ও SMS প্রাপক ব্যবস্থাপনা।',
          'Manage guardian profiles, linked children, emergency contacts, and SMS receiver preferences.'
        )}
      />

      <DataTable
        data={db.parents}
        exportFilename="parents.csv"
        columns={[
          {
            accessorKey: 'name',
            header: pick('অভিভাবকের নাম', 'Parent Name'),
            cell: ({ row }) => (
              <div>
                <p className="font-semibold text-foreground">{row.original.nameBn ?? row.original.name}</p>
                <p className="text-xs text-muted-foreground">{row.original.name}</p>
              </div>
            ),
          },
          {
            accessorKey: 'phone',
            header: pick('মোবাইল', 'Phone'),
            cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span>,
          },
          { accessorKey: 'occupation', header: pick('পেশা', 'Occupation') },
          {
            id: 'children',
            header: pick('সংযুক্ত শিক্ষার্থী', 'Linked Children'),
            cell: ({ row }) => {
              const links = db.parentStudents.filter((ps) => ps.parentId === row.original.id);
              return (
                <div className="space-y-0.5 text-sm">
                  {links.map((link) => {
                    const student = db.students.find((item) => item.id === link.studentId);
                    return (
                      <div key={link.id}>
                        {student?.nameBn ?? student?.nameEn} {link.isSmsReceiver ? '· SMS' : ''}
                      </div>
                    );
                  })}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
