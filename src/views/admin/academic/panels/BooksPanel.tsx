'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  BookOpen,
  Filter,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCreateBookMutation,
  useDeleteBookMutation,
  useGetBooksPaginatedQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useUpdateBookMutation,
  type BookWithRelations,
} from '@/src/services/academic';
import { ConfirmDialog } from '@/src/components/shared/Feedback';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import { BookType } from '@/src/types/enums';
import type { AcademicYear, Book, SchoolClass, Subject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { BOOK_TYPE_LABELS } from '../academic.labels';
import { bookSchema, type BookFormValues } from '../academic.schema';

const isUuid = (val?: string) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

const defaultFormValues: BookFormValues = {
  classId: '',
  subjectId: '',
  name: '',
  bookCode: '',
  type: BookType.TEXTBOOK,
  displayOrder: 1,
  isActive: true,
};

export function BooksPanel({
  db,
  year,
}: {
  db?: MockDatabase;
  year?: AcademicYear;
}) {

  // Queries
  const { data: realClasses } = useGetSchoolClassesQuery();
  const classList: SchoolClass[] =
    realClasses && realClasses.length > 0
      ? realClasses
      : (db?.classes ?? []);

  const { data: realSubjects } = useGetSubjectsQuery();
  const subjectList: Subject[] =
    realSubjects && realSubjects.length > 0
      ? realSubjects
      : (db?.subjects ?? []);

  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [deleteTarget, setDeleteTarget] = useState<BookWithRelations | Book | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedClassId, subjectFilter, typeFilter, statusFilter]);

  // Keep selectedClassId synchronized with real database classes
  useEffect(() => {
    if (realClasses && realClasses.length > 0) {
      const match =
        realClasses.find((c) => c.id === selectedClassId) ||
        realClasses.find(
          (c) => c.numericValue === classList.find((x) => x.id === selectedClassId)?.numericValue
        ) ||
        realClasses[0];
      if (match && selectedClassId !== match.id) {
        setSelectedClassId(match.id);
      }
    } else if (!selectedClassId && classList.length > 0) {
      setSelectedClassId(classList[0].id);
    }
  }, [realClasses, classList, selectedClassId]);

  // Backend-driven Paginated Books Query
  const {
    data: paginatedBooks,
    isLoading: loadingBooks,
    isFetching: fetchingBooks,
    refetch: refetchBooks,
  } = useGetBooksPaginatedQuery(
    {
      classId: selectedClassId,
      page,
      limit: 15,
      ...(subjectFilter !== 'all' ? { subjectId: subjectFilter } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter as BookType } : {}),
      ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
    { skip: !isUuid(selectedClassId) }
  );

  const rawBooks: BookWithRelations[] = paginatedBooks?.items ?? [];
  const booksMeta = paginatedBooks?.meta ?? {
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Mutations
  const [createBook, { isLoading: creating }] = useCreateBookMutation();
  const [updateBook, { isLoading: updating }] = useUpdateBookMutation();
  const [deleteBook, { isLoading: deleting }] = useDeleteBookMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form Management
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      ...defaultFormValues,
      classId: selectedClassId,
    },
  });

  const formSubjectId = watch('subjectId');
  const formType = watch('type');
  const formIsActive = watch('isActive');
  const saving = creating || updating;

  // Sync classId in form when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      setValue('classId', selectedClassId);
    }
  }, [selectedClassId, setValue]);

  // Set default subjectId in form when subjectList loads
  useEffect(() => {
    if (subjectList.length > 0 && !formSubjectId) {
      setValue('subjectId', subjectList[0].id);
    }
  }, [subjectList, formSubjectId, setValue]);

  const currentClass = classList.find((c) => c.id === selectedClassId);
  const isJuniorClass = (currentClass?.numericValue ?? 0) < 9;

  const startCreate = () => {
    setEditingId(null);
    reset({
      ...defaultFormValues,
      classId: selectedClassId,
      subjectId: subjectList[0]?.id || '',
      displayOrder: (rawBooks.length || 0) + 1,
    });
    setModalOpen(true);
  };

  const startEdit = (book: BookWithRelations | Book) => {
    setEditingId(book.id);
    reset({
      classId: book.classId,
      subjectId: book.subjectId,
      name: book.name,
      bookCode: book.bookCode || '',
      type: book.type,
      displayOrder: book.displayOrder ?? 1,
      isActive: book.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingId(null);
    reset(defaultFormValues);
    setModalOpen(false);
  };

  const onSubmit = async (values: BookFormValues) => {
    try {
      const sanitizedCode = !isJuniorClass && values.bookCode?.trim() ? values.bookCode.trim() : undefined;
      if (editingId) {
        await updateBook({
          id: editingId,
          name: values.name.trim(),
          bookCode: sanitizedCode,
          type: values.type,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
        }).unwrap();
        toast.success('পাঠ্যবই হালনাগাদ হয়েছে।');
      } else {
        await createBook({
          classId: values.classId,
          subjectId: values.subjectId,
          name: values.name.trim(),
          bookCode: sanitizedCode,
          type: values.type,
          displayOrder: values.displayOrder,
        }).unwrap();
        toast.success('নতুন পাঠ্যবই যুক্ত হয়েছে।');
      }
      closeModal();
    } catch (err) {
      toast.error(errorMessage(err, 'পাঠ্যবই সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleToggleActive = async (book: BookWithRelations | Book) => {
    try {
      await updateBook({
        id: book.id,
        isActive: !book.isActive,
      }).unwrap();
      toast.success('পাঠ্যবই হালনাগাদ হয়েছে।');
    } catch (err) {
      toast.error(errorMessage(err, 'পাঠ্যবই সংরক্ষণ করা যায়নি।'));
    }
  };

  const handleDelete = (book: BookWithRelations | Book) => {
    setDeleteTarget(book);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBook(deleteTarget.id).unwrap();
      toast.success('পাঠ্যবই মুছে ফেলা হয়েছে।');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(errorMessage(err, 'পাঠ্যবই মুছে ফেলা যায়নি।'));
    }
  };

  // Resolve Subject details
  const resolveSubject = (subjectId: string, relSubject?: any) => {
    if (relSubject?.name) {
      const nameBn = relSubject.nameBn || relSubject.name;
      const nameEn = relSubject.name;
      return {
        displayTitle: nameBn || nameEn,
        code: relSubject.officialCode,
        category: relSubject.category,
      };
    }
    const item = subjectList.find((s) => s.id === subjectId);
    const nameBn = item?.nameBn || item?.name;
    const nameEn = item?.name || subjectId;
    return {
      displayTitle: nameBn || nameEn,
      code: item?.officialCode,
      category: item?.category,
    };
  };

  // Stats (server-backed total + current page breakdown)
  const stats = useMemo(() => {
    const total = booksMeta.total;
    const textbooks = rawBooks.filter((b) => b.type === BookType.TEXTBOOK).length;
    const supplementary = rawBooks.filter((b) => b.type === BookType.SUPPLEMENTARY).length;
    const grammar = rawBooks.filter((b) => b.type === BookType.GRAMMAR).length;
    return { total, textbooks, supplementary, grammar };
  }, [booksMeta.total, rawBooks]);

  // Backend already filtered, searched, and sorted
  const filteredBooks = rawBooks;

  const hasActiveFilters =
    subjectFilter !== 'all' ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSubjectFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setPage(1);
  };

  const typeBadgeColors: Record<BookType, string> = {
    [BookType.TEXTBOOK]: 'bg-primary/10 text-primary border-primary/20',
    [BookType.SUPPLEMENTARY]: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    [BookType.GRAMMAR]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    [BookType.REFERENCE]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Top Class Switcher & Actions (no duplicate title) */}
      <Card className="p-4 bg-gradient-to-r from-surface to-surface-muted border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-base text-muted-foreground">
            {'শ্রেণিভিত্তিক এনসিটিবি অনুমোদিত মূল পাঠ্যবই, ব্যাকরণ ও সহপাঠ দ্রুতপঠনের তালিকা।'}
          </p>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchBooks()}
              disabled={fetchingBooks}
              title={'রিফ্রেশ করুন'}
            >
              <RefreshCw className={`w-4 h-4 ${fetchingBooks ? 'animate-spin' : ''}`} />
            </Button>
            <Button type="button" variant="primary" onClick={startCreate} className="flex-1 md:flex-initial">
              <Plus className="w-4 h-4" /> {'নতুন পাঠ্যবই'}
            </Button>
          </div>
        </div>

        {/* Class Selection Tabs */}
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap mr-1">
            {'শ্রেণি'}:
          </span>
          {classList.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            const clsName = cls.nameBn || cls.name;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                    : 'bg-surface-muted hover:bg-surface text-foreground border border-border'
                }`}
              >
                {clsName}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Live Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'মোট পাঠ্যবই'}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {formatNumber(stats.total, 'bn')}
            </p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'মূল পাঠ্যবই'}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {formatNumber(stats.textbooks, 'bn')}
            </p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'সহপাঠ'}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {formatNumber(stats.supplementary, 'bn')}
            </p>
          </div>
        </Card>

        <Card className="p-3.5 bg-surface border-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{'ব্যাকরণ'}</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {formatNumber(stats.grammar, 'bn')}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'বইয়ের নাম বা কোড দিয়ে খুঁজুন...'}
              className="pl-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full lg:w-44"
            >
              <option value="all">{'সকল বিষয়'}</option>
              {subjectList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nameBn || sub.name}
                </option>
              ))}
            </Select>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full lg:w-40"
            >
              <option value="all">{'সব ধরনের বই'}</option>
              {Object.values(BookType).map((bt) => (
                <option key={bt} value={bt}>
                  {BOOK_TYPE_LABELS[bt] ? (BOOK_TYPE_LABELS[bt]) : bt}
                </option>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full lg:w-36"
            >
              <option value="all">{'সকল অবস্থা'}</option>
              <option value="active">{'শুধু সক্রিয়'}</option>
              <option value="inactive">{'শুধু নিষ্ক্রিয়'}</option>
            </Select>

            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters}>
                <X className="w-4 h-4 mr-1" />
                {'ফিল্টার রিসেট করুন'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-surface-muted text-sm text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3.5 text-left w-16">{'ক্রম'}</th>
              <th className="p-3.5 text-left">{'বইয়ের নাম'}</th>
              <th className="p-3.5 text-left">{'বিষয়'}</th>
              <th className="p-3.5 text-left">{'বিষয় কোড'}</th>
              <th className="p-3.5 text-left">{'বইয়ের ধরন'}</th>
              <th className="p-3.5 text-left">{'অবস্থা'}</th>
              <th className="p-3.5 text-right">{'কাজ'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingBooks ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-base text-muted-foreground">
                  {'লোড হচ্ছে...'}
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-base text-muted-foreground">
                  <p className="font-medium">{'এই শ্রেণির জন্য কোনো পাঠ্যবই পাওয়া যায়নি।'}</p>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-2 text-primary"
                    >
                      {'ফিল্টার রিসেট করুন'}
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              filteredBooks.map((book, index) => {
                const sub = resolveSubject(
                  book.subjectId,
                  (book as BookWithRelations).subject
                );
                const typeLabel = BOOK_TYPE_LABELS[book.type]
                  ? BOOK_TYPE_LABELS[book.type]
                  : book.type;
                const typeColor = typeBadgeColors[book.type] || 'bg-surface-muted text-muted-foreground';

                return (
                  <tr key={book.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3.5 text-sm text-muted-foreground font-semibold">
                      <span className="tabular-nums">
                        {formatNumber(book.displayOrder ?? index + 1, 'bn')}
                      </span>
                    </td>

                    <td className="p-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span>{book.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-foreground">{sub.displayTitle}</span>
                    </td>

                    <td className="p-3.5 font-mono text-sm text-muted-foreground">
                      {!isJuniorClass && (book.bookCode || sub.code) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-surface-muted text-foreground border border-border">
                          {book.bookCode || sub.code}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor}`}>
                        {typeLabel}
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(book)}
                        title={'অবস্থা পরিবর্তন করুন'}
                        className="cursor-pointer"
                      >
                        <StatusBadge
                          value={book.isActive ? 'ACTIVE' : 'INACTIVE'}
                          customLabel={
                            book.isActive ? 'সক্রিয়' : 'বন্ধ'
                          }
                          customTone={book.isActive ? 'success' : 'neutral'}
                        />
                      </button>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(book)}
                      >
                        <Pencil className="w-4 h-4" />
                        {'সম্পাদনা'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={deleting}
                        onClick={() => handleDelete(book)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {booksMeta.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            {`মোট ${formatNumber(booksMeta.total, 'bn')} টি বই · পৃষ্ঠা ${formatNumber(booksMeta.page, 'bn')} / ${formatNumber(booksMeta.totalPages, 'bn')}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!booksMeta.hasPreviousPage || fetchingBooks}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {'পূর্ববর্তী'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!booksMeta.hasNextPage || fetchingBooks}
              onClick={() => setPage((p) => p + 1)}
            >
              {'পরবর্তী'}
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'পাঠ্যবই সম্পাদনা' : 'নতুন পাঠ্যবই যুক্ত করুন'}
        description={'নির্দিষ্ট শ্রেণি ও বিষয়ের জন্য পাঠ্যবই বা সহপাঠের তথ্য দিন।'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={'শ্রেণি'} required error={errors.classId?.message}>
              <Select
                value={watch('classId')}
                onChange={(e) => setValue('classId', e.target.value, { shouldValidate: true })}
                disabled={Boolean(editingId)}
              >
                {classList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nameBn || cls.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={'বিষয়'} required error={errors.subjectId?.message}>
              <Select
                value={formSubjectId}
                onChange={(e) => setValue('subjectId', e.target.value, { shouldValidate: true })}
              >
                {subjectList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nameBn || sub.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label={'বইয়ের নাম'} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={'যেমন: চারুপাঠ, আনন্দপাঠ বা সাধারণ গণিত'}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {!isJuniorClass ? (
              <FormField label={'বিষয় কোড'} error={errors.bookCode?.message}>
                <Input
                  {...register('bookCode')}
                  placeholder={'যেমন: ১০১, ১০৭ (শুধুমাত্র ৯ম–১০ম শ্রেণির জন্য)'}
                />
              </FormField>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-muted border border-border text-sm text-muted-foreground flex items-center h-10 mt-2">
                <span>{'৬ষ্ঠ–৮ম শ্রেণির জন্য কোনো বিষয় কোড নেই।'}</span>
              </div>
            )}

            <FormField label={'বইয়ের ধরন'} required error={errors.type?.message}>
              <Select
                value={formType}
                onChange={(e) => setValue('type', e.target.value as BookType, { shouldValidate: true })}
              >
                {Object.values(BookType).map((bt) => (
                  <option key={bt} value={bt}>
                    {BOOK_TYPE_LABELS[bt] ? (BOOK_TYPE_LABELS[bt]) : bt}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <FormField label={'ক্রম'} error={errors.displayOrder?.message}>
              <Input placeholder="ক্রম লিখুন"
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                min={1}
              />
            </FormField>

            <div className="pt-5">
              <Switch
                checked={formIsActive}
                onChange={(val) => setValue('isActive', val)}
                label={'সক্রিয়'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              {'বাতিল'}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? 'সংরক্ষণ হচ্ছে...'
                : editingId
                  ? 'হালনাগাদ করুন'
                  : 'সংরক্ষণ করুন'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={'পাঠ্যবই মুছে ফেলুন'}
        description={
          `আপনি কি নিশ্চিতভাবে "${deleteTarget?.name ?? ''}" পাঠ্যবইটি তালিকা থেকে মুছতে চান?`
        }
        confirmLabel={'মুছে ফেলুন'}
        destructive
        loading={deleting}
      />
    </div>
  );
}
