'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MonitorPlay,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  EmptyState,
  LoadingSkeleton,
  PageHeader,
} from '@/src/components/shared/Feedback';
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
} from '@/src/components/ui/primitives';
import { useGetSchoolClassesQuery } from '@/src/services/academic';
import { formatNumber } from '@/src/lib/formatters';
import {
  useCreateDigitalResourceMutation,
  useDeleteDigitalResourceMutation,
  useGetDigitalResourcesQuery,
  type DigitalResourceType,
} from '../api/digital-education.api';

const RESOURCE_TYPE_LABELS: Record<DigitalResourceType, string> = {
  SMART_CLASS_VIDEO: 'স্মার্ট ক্লাস ভিডিও',
  ONLINE_CLASS_LINK: 'অনলাইন ক্লাস লিংক',
  EDUCATIONAL_VIDEO: 'শিক্ষামূলক ভিডিও',
  MULTIMEDIA_CONTENT: 'মাল্টিমিডিয়া কনটেন্ট',
};

const PAGE_SIZE = 12;

export function DigitalResourcesPortalView({
  title,
  description,
  canManage = false,
}: {
  title: string;
  description: string;
  canManage?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [resourceType, setResourceType] = useState<'' | DigitalResourceType>('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'EDUCATIONAL_VIDEO' as DigitalResourceType,
    classId: '',
    url: '',
  });

  const { data: classes = [] } = useGetSchoolClassesQuery();
  const { data, isLoading } = useGetDigitalResourcesQuery({
    search: search.trim() || undefined,
    classId: classId || undefined,
    resourceType: resourceType || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const [createResource, { isLoading: saving }] = useCreateDigitalResourceMutation();
  const [deleteResource] = useDeleteDigitalResourceMutation();

  const items = data?.items ?? [];
  const meta = data?.meta;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('শিরোনাম এবং রিসোর্স লিংক আবশ্যক।');
      return;
    }
    try {
      await createResource({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        resourceType: form.resourceType,
        classId: form.classId || undefined,
        url: form.url.trim(),
      }).unwrap();
      toast.success('নতুন শিক্ষা রিসোর্স যুক্ত হয়েছে।');
      setCreateOpen(false);
      setForm({
        title: '',
        description: '',
        resourceType: 'EDUCATIONAL_VIDEO',
        classId: '',
        url: '',
      });
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'রিসোর্স সংরক্ষণ করা যায়নি।');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          canManage ? (
            <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              {'নতুন রিসোর্স যোগ করুন'}
            </Button>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="শিরোনাম বা বিবরণ খুঁজুন..."
              className="pl-9"
            />
          </div>
          <Select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{'সকল শ্রেণি'}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameBn || c.name}
              </option>
            ))}
          </Select>
          <Select
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value as '' | DigitalResourceType);
              setPage(1);
            }}
          >
            <option value="">{'সকল ধরন'}</option>
            {(Object.keys(RESOURCE_TYPE_LABELS) as DigitalResourceType[]).map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title={'কোনো ডিজিটাল শিক্ষা রিসোর্স পাওয়া যায়নি'}
          description={
            canManage
              ? 'উপরের "+ নতুন রিসোর্স যোগ করুন" বাটনে ক্লিক করে প্রথম কনটেন্ট যুক্ত করুন।'
              : 'বর্তমানে কোনো প্রকাশিত ডিজিটাল শিক্ষা রিসোর্স নেই।'
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((r) => (
              <Card key={r.id} className="p-5 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      <MonitorPlay className="w-3.5 h-3.5" />
                      {RESOURCE_TYPE_LABELS[r.resourceType]}
                    </span>
                    <span>{r.schoolClass?.nameBn || r.schoolClass?.name || 'সকল শ্রেণি'}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {'খুলুন / দেখুন'}
                  </Button>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteResource(r.id).unwrap();
                          toast.success('রিসোর্স মুছে ফেলা হয়েছে।');
                        } catch (err: any) {
                          toast.error(err?.data?.message || err?.message || 'মুছে ফেলা যায়নি।');
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {meta && meta.total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
              <span>
                {`পৃষ্ঠা ${formatNumber(meta.page, 'bn')} / ${formatNumber(meta.totalPages, 'bn')} (মোট ${formatNumber(meta.total, 'bn')}টি)`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {'পূর্ববর্তী'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {'পরবর্তী'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canManage && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="নতুন ডিজিটাল শিক্ষা রিসোর্স যুক্ত করুন"
          size="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{'শিরোনাম *'}</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="যেমন: ৭ম শ্রেণি গণিত — জ্যামিতি লেকচার"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{'রিসোর্সের ধরন *'}</label>
                <Select
                  value={form.resourceType}
                  onChange={(e) =>
                    setForm({ ...form, resourceType: e.target.value as DigitalResourceType })
                  }
                >
                  {(Object.keys(RESOURCE_TYPE_LABELS) as DigitalResourceType[]).map((t) => (
                    <option key={t} value={t}>
                      {RESOURCE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{'শ্রেণি (ঐচ্ছিক)'}</label>
                <Select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                >
                  <option value="">{'সকল শ্রেণি'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn || c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{'ভিডিও / ফাইল লিংক (URL) *'}</label>
              <Input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{'সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)'}</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="পাঠের বিবরণ..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {'বাতিল'}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
