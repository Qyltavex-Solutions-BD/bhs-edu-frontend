'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useImportStudentsMutation } from '@/src/store/api';
import { Button, Card, Input } from '@/src/components/ui/primitives';
import { errorMessage } from './admin/studentShared';
import type { MockDatabase } from '@/src/mocks/seed';

export function StudentImporter({ db, yearId }: { db: MockDatabase; yearId: string }) {
  const [importStudents, { isLoading }] = useImportStudentsMutation();
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [fileName, setFileName] = useState('');

  const preview = rows.map((row, index) => {
    const schoolClass = db.classes.find((item) => item.name === row.className || item.nameBn === row.className);
    const section = schoolClass ? db.sections.find((item) => item.classId === schoolClass.id && item.name === row.sectionName) : undefined;
    const problem = !row.nameEn || !row.parentName || !row.parentPhone || !schoolClass || !section || !Number(row.roll);
    return {
      index: index + 1,
      nameEn: row.nameEn || '',
      nameBn: row.nameBn || '',
      className: row.className || '',
      sectionName: row.sectionName || '',
      roll: row.roll || '',
      problem,
    };
  });

  const commit = async () => {
    const ready = rows.filter((_, index) => !preview[index]?.problem);
    if (!ready.length) {
      toast.error('সঠিক সারি নেই।');
      return;
    }
    try {
      const result = await importStudents({ academicYearId: yearId, rows: ready }).unwrap();
      toast.success(`${result.created} জন ভর্তি হয়েছে।`);
      if (result.errors.length) {
        toast.error(result.errors.map((item) => `${item.row}: ${item.message}`).join(' '));
      }
      setRows([]);
      setFileName('');
    } catch (err) {
      toast.error(errorMessage(err, 'আমদানি হয়নি।'));
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <p className="text-sm text-muted-foreground">
        nameEn, nameBn, gender, dateOfBirth, className, sectionName, groupName, roll, birthCertificateNo, parentName, parentPhone
      </p>
      <Input
        type="file"
        accept=".csv,text/csv"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          const headers = lines[0]?.split(',').map((cell) => cell.trim()) ?? [];
          const parsed = lines.slice(1).map((line) => {
            const cells = line.split(',');
            return Object.fromEntries(headers.map((header, index) => [header, (cells[index] ?? '').trim()]));
          });
          setRows(parsed);
          setFileName(file.name);
        }}
      />
      {fileName && <p className="text-sm">{fileName}</p>}
      {!!preview.length && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">{'নাম'}</th>
                  <th className="p-2 text-left">{'শ্রেণি'}</th>
                  <th className="p-2 text-left">{'শাখা'}</th>
                  <th className="p-2 text-left">{'রোল'}</th>
                  <th className="p-2 text-left">{'যাচাই'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row) => (
                  <tr key={row.index}>
                    <td className="p-2">{row.index}</td>
                    <td className="p-2">{row.nameBn || row.nameEn}</td>
                    <td className="p-2">{row.className}</td>
                    <td className="p-2">{row.sectionName}</td>
                    <td className="p-2">{row.roll}</td>
                    <td className="p-2">{row.problem ? 'অসম্পূর্ণ' : 'ঠিক আছে'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" disabled={isLoading} onClick={commit}>
              {'সঠিক সারি ভর্তি করুন'}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
