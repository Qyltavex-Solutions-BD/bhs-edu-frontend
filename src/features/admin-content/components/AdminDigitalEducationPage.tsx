'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  useCreateNoticeMutation,
  useDeleteCmsItemMutation,
  useGetBootstrapQuery,
  useReorderCmsItemsMutation,
  useToggleCmsItemMutation,
  useUpdateAdmissionContentMutation,
  useUpsertCmsItemMutation,
} from '@/src/store/api';
import { formatDateShort, formatNumber } from '@/src/lib/formatters';
import { exportToCsv, triggerPrint } from '@/src/lib/utils/cn';
import { LoadingSkeleton, PageHeader } from '@/src/components/shared/Feedback';
import { CommonProfilePanel } from '@/src/components/shared/CommonProfilePanel';
import {
  NoticeDocumentModal,
  NoticeFormatBadge,
} from '@/src/components/shared/NoticeDocumentViewer';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import {
  Button,
  Card,
  FormField,
  Input,
  Modal,
  SegmentedTabs,
  Select,
  Switch,
  Textarea,
} from '@/src/components/ui/primitives';
import { LibraryDistributionType, NoticeStatus, ResourceType } from '@/src/types/enums';
import type { Notice, NoticeAttachmentType } from '@/src/types/entities';

// 7.11 Library
export function AdminDigitalEducationPage({
  defaultTab = 'resources',
}: {
  defaultTab?: 'resources' | 'classrooms';
} = {}) {
  const { data: db, isLoading } = useGetBootstrapQuery();
  const [toggleCms] = useToggleCmsItemMutation();
  const [upsertCms, { isLoading: saving }] = useUpsertCmsItemMutation();
  const [deleteCms] = useDeleteCmsItemMutation();
  const [tab, setTab] = useState<'resources' | 'classrooms'>(defaultTab);
  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);
  const [resSearch, setResSearch] = useState('');
  const [resClassFilter, setResClassFilter] = useState('ALL');
  const [classroomModalOpen, setClassroomModalOpen] = useState(false);
  const [classroomForm, setClassroomForm] = useState({
    id: '',
    name: '',
    location: '',
    description: '',
    isActive: true,
  });
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    id: '',
    title: '',
    description: '',
    resourceType: ResourceType.SMART_CLASS_VIDEO as ResourceType,
    classId: '',
    subjectId: '',
    url: '',
    isPublished: true,
  });

  if (isLoading || !db) return <LoadingSkeleton />;

  const publishedResources = db.digitalResources.filter((r) => r.isPublished).length;
  const draftResources = db.digitalResources.length - publishedResources;
  const filteredResources = db.digitalResources.filter((r) => {
    if (resClassFilter !== 'ALL' && r.classId !== resClassFilter) return false;
    if (resSearch.trim()) {
      const q = resSearch.trim().toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={'ডিজিটাল শিক্ষা ও স্মার্ট ক্লাসরুম'}
        description={'স্মার্ট ক্লাসরুম সুবিধা এবং শ্রেণিভিত্তিক ডিজিটাল পাঠসামগ্রী ও ভিডিও লেকচার ব্যবস্থাপনা।'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/academics/resources" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4" />
                {'পাবলিক রিসোর্স পেজ'}
              </Button>
            </Link>
            {tab === 'resources' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setResourceForm({
                    id: '',
                    title: '',
                    description: '',
                    resourceType: ResourceType.SMART_CLASS_VIDEO,
                    classId: db.classes[0]?.id ?? '',
                    subjectId: db.subjects[0]?.id ?? '',
                    url: '',
                    isPublished: true,
                  });
                  setResourceModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {'নতুন ডিজিটাল রিসোর্স'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setClassroomForm({
                    id: '',
                    name: '',
                    location: '',
                    description: '',
                    isActive: true,
                  });
                  setClassroomModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" /> {'নতুন স্মার্ট ক্লাসরুম'}
              </Button>
            )}
          </div>
        }
      />

      {/* 4-Column Institutional KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'স্মার্ট ক্লাসরুম'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums mt-1">
            {formatNumber(db.digitalClassrooms.length, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'মোট ডিজিটাল রিসোর্স'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-primary tabular-nums mt-1">
            {formatNumber(db.digitalResources.length, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'পাবলিক সাইটে প্রকাশিত'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-success tabular-nums mt-1">
            {formatNumber(publishedResources, 'bn')}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between gap-2">
          <p className="text-base font-bold text-foreground">{'খসড়া রিসোর্স'}</p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-muted-foreground tabular-nums mt-1">
            {formatNumber(draftResources, 'bn')}
          </p>
        </Card>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'resources', label: 'ডিজিটাল রিসোর্স ও পাঠসামগ্রী', count: db.digitalResources.length },
          { value: 'classrooms', label: 'স্মার্ট ক্লাসরুমসমূহ', count: db.digitalClassrooms.length },
        ]}
      />

      {tab === 'resources' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <Input
              value={resSearch}
              onChange={(e) => setResSearch(e.target.value)}
              placeholder={'রিসোর্সের শিরোনাম খুঁজুন...'}
              className="max-w-sm h-9"
            />
            <Select
              value={resClassFilter}
              onChange={(e) => setResClassFilter(e.target.value)}
              className="w-44 h-9"
            >
              <option value="ALL">{'সকল শ্রেণি'}</option>
              {db.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </Select>
          </Card>

          <Card className="divide-y divide-border">
            {filteredResources.map((r) => {
              const cls = db.classes.find((c) => c.id === r.classId);
              const sub = db.subjects.find((s) => s.id === r.subjectId);
              return (
                <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge enumName="ResourceType" value={r.resourceType} />
                      {cls && (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {cls.nameBn}
                        </span>
                      )}
                      {sub && (
                        <span className="text-sm font-semibold text-primary">
                          · {sub.nameBn}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground">{r.title}</p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={r.isPublished}
                      onChange={() => toggleCms({ collection: 'digitalResources', id: r.id, field: 'isPublished' })}
                      label={r.isPublished ? 'প্রকাশিত' : 'খসড়া'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setResourceForm({
                          id: r.id,
                          title: r.title,
                          description: r.description ?? '',
                          resourceType: r.resourceType,
                          classId: r.classId ?? '',
                          subjectId: r.subjectId ?? '',
                          url: r.url,
                          isPublished: r.isPublished,
                        });
                        setResourceModalOpen(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteCms({ collection: 'digitalResources', id: r.id }).unwrap();
                        toast.success('ডিজিটাল রিসোর্স মুছে ফেলা হয়েছে।');
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {!filteredResources.length && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {'কোনো ডিজিটাল রিসোর্স পাওয়া যায়নি।'}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'classrooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.digitalClassrooms.map((dc) => (
            <Card key={dc.id} className="p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{dc.name}</h3>
                  <Switch
                    checked={dc.isActive}
                    onChange={() => toggleCms({ collection: 'digitalClassrooms', id: dc.id, field: 'isActive' })}
                    label={dc.isActive ? 'সক্রিয়' : 'বন্ধ'}
                  />
                </div>
                <p className="text-sm font-medium text-primary">{dc.location || '—'}</p>
                <p className="text-sm text-muted-foreground">{dc.description}</p>
              </div>
              <div className="pt-3 border-t border-border flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClassroomForm({
                      id: dc.id,
                      name: dc.name,
                      location: dc.location ?? '',
                      description: dc.description ?? '',
                      isActive: dc.isActive,
                    });
                    setClassroomModalOpen(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" /> {'সম্পাদনা'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteCms({ collection: 'digitalClassrooms', id: dc.id }).unwrap();
                    toast.success('স্মার্ট ক্লাসরুম মুছে ফেলা হয়েছে।');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Smart Classroom CRUD Modal */}
      <Modal
        open={classroomModalOpen}
        onClose={() => setClassroomModalOpen(false)}
        title={classroomForm.id ? 'স্মার্ট ক্লাসরুম সম্পাদনা' : 'নতুন স্মার্ট ক্লাসরুম'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!classroomForm.name.trim()) return;
            await upsertCms({
              collection: 'digitalClassrooms',
              item: {
                ...(classroomForm.id ? { id: classroomForm.id } : {}),
                name: classroomForm.name.trim(),
                location: classroomForm.location.trim() || null,
                description: classroomForm.description.trim() || null,
                isActive: classroomForm.isActive,
              },
            }).unwrap();
            toast.success('স্মার্ট ক্লাসরুম সংরক্ষিত হয়েছে।');
            setClassroomModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'ক্লাসরুমের নাম'} required>
            <Input placeholder="ক্লাসরুমের নাম লিখুন" value={classroomForm.name} onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })} />
          </FormField>
          <FormField label={'অবস্থান / ভবন ও কক্ষ'}>
            <Input placeholder="অবস্থান / ভবন ও কক্ষ লিখুন" value={classroomForm.location} onChange={(e) => setClassroomForm({ ...classroomForm, location: e.target.value })} />
          </FormField>
          <FormField label={'সুবিধাদি ও বিবরণ'}>
            <Textarea placeholder="সুবিধাদি ও বিবরণ লিখুন..." rows={3} value={classroomForm.description} onChange={(e) => setClassroomForm({ ...classroomForm, description: e.target.value })} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClassroomModalOpen(false)}>{'বাতিল'}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Resource CRUD Modal */}
      <Modal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title={resourceForm.id ? 'ডিজিটাল রিসোর্স সম্পাদনা' : 'নতুন ডিজিটাল রিসোর্স'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!resourceForm.title.trim()) return;
            await upsertCms({
              collection: 'digitalResources',
              item: {
                ...(resourceForm.id ? { id: resourceForm.id } : {}),
                academicYearId: db.academicYears.find((y) => y.isActive)?.id ?? 'ay-2026',
                title: resourceForm.title.trim(),
                description: resourceForm.description.trim() || null,
                resourceType: resourceForm.resourceType,
                classId: resourceForm.classId || null,
                subjectId: resourceForm.subjectId || null,
                url: resourceForm.url.trim() || '#',
                isPublished: resourceForm.isPublished,
              },
            }).unwrap();
            toast.success('ডিজিটাল রিসোর্স সংরক্ষিত হয়েছে।');
            setResourceModalOpen(false);
          }}
          className="space-y-4"
        >
          <FormField label={'শিরোনাম'} required>
            <Input placeholder="শিরোনাম লিখুন" value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label={'ধরন'}>
              <Select
                value={resourceForm.resourceType}
                onChange={(e) => setResourceForm({ ...resourceForm, resourceType: e.target.value as ResourceType })}
              >
                <option value={ResourceType.SMART_CLASS_VIDEO}>{'স্মার্ট ক্লাস ভিডিও'}</option>
                <option value={ResourceType.EDUCATIONAL_VIDEO}>{'শিক্ষামূলক ভিডিও'}</option>
                <option value={ResourceType.MULTIMEDIA_CONTENT}>{'মাল্টিমিডিয়া কনটেন্ট'}</option>
                <option value={ResourceType.ONLINE_CLASS_LINK}>{'অনলাইন ক্লাস লিংক'}</option>
              </Select>
            </FormField>
            <FormField label={'শ্রেণি'}>
              <Select value={resourceForm.classId} onChange={(e) => setResourceForm({ ...resourceForm, classId: e.target.value })}>
                <option value="">{'সকল শ্রেণি'}</option>
                {db.classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameBn}</option>
                ))}
              </Select>
            </FormField>
            <FormField label={'বিষয়'}>
              <Select value={resourceForm.subjectId} onChange={(e) => setResourceForm({ ...resourceForm, subjectId: e.target.value })}>
                <option value="">{'সাধারণ'}</option>
                {db.subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.nameBn}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label={'রিসোর্স লিংক (URL)'} required>
            <Input
              value={resourceForm.url}
              onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>
          <FormField label={'বিবরণ'}>
            <Textarea placeholder="বিবরণ লিখুন..." rows={3} value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} />
          </FormField>
          <div className="flex items-center justify-between pt-2">
            <Switch
              checked={resourceForm.isPublished}
              onChange={(v) => setResourceForm({ ...resourceForm, isPublished: v })}
              label={'পাবলিক সাইটে প্রকাশ করুন'}
            />
            <Button type="submit" variant="primary" disabled={saving}>
              <Save className="w-4 h-4" /> {'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// 7.13 Notices, News, Events, Careers

