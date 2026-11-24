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
  useGetBooksQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useUpdateBookMutation,
  type BookWithRelations,
} from '@/src/services/academic';
import { Button, Card, FormField, Input, Modal, Select, Switch } from '@/src/components/ui';
import { StatusBadge } from '@/src/components/shared/StatusBadge';
import { formatNumber } from '@/src/lib/formatters';
import { BookType } from '@/src/types/enums';
import type { AcademicYear, Book, SchoolClass, Subject } from '@/src/types/entities';
import type { MockDatabase } from '@/src/mocks/seed';
import { errorMessage } from './shared';
import { BOOK_TYPE_LABELS, useAcademicI18n } from '../academic.i18n';
import { bookSchema, type BookFormValues } from '../academic.schema';

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
  const { isBn, locale, t, dict } = useAcademicI18n();

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

  // Books Query for selected class
  const {
    data: realBooks,
    isLoading: loadingBooks,
    isFetching: fetchingBooks,
    refetch: refetchBooks,
  } = useGetBooksQuery(
    selectedClassId ? { classId: selectedClassId } : undefined,
    { skip: !selectedClassId }
  );

  const rawBooks: (BookWithRelations | Book)[] =
    realBooks !== undefined
      ? realBooks
      : (db?.books ?? []).filter((b) => !selectedClassId || b.classId === selectedClassId);

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
      if (editingId) {
        await updateBook({
          id: editingId,
          name: values.name.trim(),
          bookCode: values.bookCode?.trim() || undefined,
          type: values.type,
          displayOrder: values.displayOrder,
          isActive: values.isActive,
        }).unwrap();
        toast.success(t(dict.books.updateSuccess));
      } else {
        await createBook({
          classId: values.classId,
          subjectId: values.subjectId,
          name: values.name.trim(),
          bookCode: values.bookCode?.trim() || undefined,
          type: values.type,
          displayOrder: values.displayOrder,
        }).unwrap();
        toast.success(t(dict.books.createSuccess));
      }
      closeModal();
    } catch (err) {
      toast.error(errorMessage(err, t(dict.books.saveFailed)));
    }
  };

  const handleToggleActive = async (book: BookWithRelations | Book) => {
    try {
      await updateBook({
        id: book.id,
        isActive: !book.isActive,
      }).unwrap();
      toast.success(t(dict.books.updateSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.books.saveFailed)));
    }
  };

  const handleDelete = async (book: BookWithRelations | Book) => {
    if (
      !window.confirm(
        isBn
          ? `আপনি কি নিশ্চিতভাবে '${book.name}' পাঠ্যবইটি তালিকা থেকে মুছতে চান?`
          : `Are you sure you want to delete '${book.name}'?`
      )
    ) {
      return;
    }
    try {
      await deleteBook(book.id).unwrap();
      toast.success(t(dict.books.deleteSuccess));
    } catch (err) {
      toast.error(errorMessage(err, t(dict.books.deleteFailed)));
    }
  };

  // Resolve Subject details
  const resolveSubject = (subjectId: string, relSubject?: any) => {
    if (relSubject?.name) {
      const nameBn = relSubject.nameBn || relSubject.name;
      const nameEn = relSubject.name;
      return {
        displayTitle: isBn ? nameBn || nameEn : nameEn,
        code: relSubject.officialCode,
        category: relSubject.category,
      };
    }
    const item = subjectList.find((s) => s.id === subjectId);
    const nameBn = item?.nameBn || item?.name;
    const nameEn = item?.name || subjectId;
    return {
      displayTitle: isBn ? nameBn || nameEn : nameEn,
      code: item?.officialCode,
      category: item?.category,
    };
  };

  // Stats
  const stats = useMemo(() => {
    const total = rawBooks.length;
    const textbooks = rawBooks.filter((b) => b.type === BookType.TEXTBOOK).length;
    const supplementary = rawBooks.filter((b) => b.type === BookType.SUPPLEMENTARY).length;
    const grammar = rawBooks.filter((b) => b.type === BookType.GRAMMAR).length;
    return { total, textbooks, supplementary, grammar };
  }, [rawBooks]);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return rawBooks
      .filter((book) => {
        if (subjectFilter !== 'all' && book.subjectId !== subjectFilter) return false;
        if (typeFilter !== 'all' && book.type !== typeFilter) return false;
        if (statusFilter === 'active' && !book.isActive) return false;
        if (statusFilter === 'inactive' && book.isActive) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = book.name.toLowerCase().includes(q);
          const matchCode = (book.bookCode || '').toLowerCase().includes(q);
          const sub = resolveSubject(book.subjectId, (book as BookWithRelations).subject);
          const matchSub = (sub.displayTitle || '').toLowerCase().includes(q);
          return matchName || matchCode || matchSub;
        }
        return true;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
  }, [rawBooks, subjectFilter, typeFilter, statusFilter, searchQuery, isBn, subjectList]);

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
  };

  const typeBadgeColors: Record<BookType, string> = {
    [BookType.TEXTBOOK]: 'bg-primary/10 text-primary border-primary/20',
    [BookType.SUPPLEMENTARY]: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    [BookType.GRAMMAR]: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    [BookType.REFERENCE]: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Class Switcher */}
      <Card className="p-4 bg-gradient-to-r from-surface to-surface-muted border-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {t(dict.books.panelTitle)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isBn
                    ? 'শ্রেণিভিত্তিক এনসিটিবি অনুমোদিত মূল পাঠ্যবই, ব্যাকরণ ও সহপাঠ দ্রুতপঠনের তালিকা।'
                    : 'Class-wise NCTB prescribed textbooks, grammar, and supplementary reader catalog.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchBooks()}
              disabled={fetchingBooks}
              title={isBn ? 'রিফ্রেশ করুন' : 'Refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${fetchingBooks ? 'animate-spin' : ''}`} />
            </Button>
            <Button type="button" variant="primary" onClick={startCreate} className="flex-1 md:flex-initial">
              <Plus className="w-4 h-4" /> {t(dict.books.newBookButton)}
            </Button>
          </div>
        </div>

        {/* Class Selection Tabs */}
        <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-2">
            {t(dict.books.classLabel)}:
          </span>
          {classList.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            const clsName = isBn ? cls.nameBn || cls.name : cls.name;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-surface border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t(dict.books.statsTotal)}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatNumber(stats.total, locale)}
            </p>
          </div>
        </Card>

        <Card className="p-3 bg-surface border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t(dict.books.statsTextbook)}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatNumber(stats.textbooks, locale)}
            </p>
          </div>
        </Card>

        <Card className="p-3 bg-surface border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t(dict.books.statsSupplementary)}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatNumber(stats.supplementary, locale)}
            </p>
          </div>
        </Card>

        <Card className="p-3 bg-surface border-border flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t(dict.books.statsGrammar)}</p>
            <p className="text-lg font-bold text-foreground tabular-nums">
              {formatNumber(stats.grammar, locale)}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(dict.books.searchPlaceholder)}
              className="pl-9"
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <Select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full sm:w-auto min-w-40 text-xs"
            >
              <option value="all">{t(dict.books.allSubjects)}</option>
              {subjectList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {isBn ? sub.nameBn || sub.name : sub.name}
                </option>
              ))}
            </Select>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto min-w-36 text-xs"
            >
              <option value="all">{t(dict.books.allTypes)}</option>
              {Object.values(BookType).map((bt) => (
                <option key={bt} value={bt}>
                  {BOOK_TYPE_LABELS[bt] ? (isBn ? BOOK_TYPE_LABELS[bt].bn : BOOK_TYPE_LABELS[bt].en) : bt}
                </option>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto min-w-32 text-xs"
            >
              <option value="all">{t(dict.classSubjects.allStatuses)}</option>
              <option value="active">{t(dict.classSubjects.activeOnly)}</option>
              <option value="inactive">{t(dict.classSubjects.inactiveOnly)}</option>
            </Select>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs">
                <X className="w-3.5 h-3.5 mr-1" />
                {t(dict.classSubjects.resetFilters)}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground border-b border-border">
            <tr>
              <th className="p-3 text-left w-16">{t(dict.books.orderLabel)}</th>
              <th className="p-3 text-left">{t(dict.books.nameLabel)}</th>
              <th className="p-3 text-left">{t(dict.books.subjectLabel)}</th>
              <th className="p-3 text-left">{t(dict.books.codeLabel)}</th>
              <th className="p-3 text-left">{t(dict.books.typeLabel)}</th>
              <th className="p-3 text-left">{t(dict.common.status)}</th>
              <th className="p-3 text-right">{t(dict.common.actions)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingBooks ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {t(dict.common.loading)}
                </td>
              </tr>
            ) : filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  <p className="font-medium">{t(dict.books.emptyBooks)}</p>
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="mt-2 text-primary"
                    >
                      {t(dict.classSubjects.resetFilters)}
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              filteredBooks.map((book) => {
                const sub = resolveSubject(
                  book.subjectId,
                  (book as BookWithRelations).subject
                );
                const typeLabel = BOOK_TYPE_LABELS[book.type]
                  ? isBn
                    ? BOOK_TYPE_LABELS[book.type].bn
                    : BOOK_TYPE_LABELS[book.type].en
                  : book.type;
                const typeColor = typeBadgeColors[book.type] || 'bg-surface-muted text-muted-foreground';

                return (
                  <tr key={book.id} className="hover:bg-surface-muted/40 transition-colors">
                    <td className="p-3 tabular-nums text-muted-foreground text-xs">
                      #{book.displayOrder ?? 1}
                    </td>

                    <td className="p-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        <span>{book.name}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{sub.displayTitle}</span>
                        {sub.code && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-muted border border-border text-muted-foreground">
                            {sub.code}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {book.bookCode || '—'}
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
                        title={isBn ? 'অবস্থা পরিবর্তন করুন' : 'Toggle status'}
                        className="cursor-pointer"
                      >
                        <StatusBadge
                          value={book.isActive ? 'ACTIVE' : 'INACTIVE'}
                          customLabel={
                            book.isActive ? t(dict.common.active) : t(dict.common.inactive)
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
                        {t(dict.common.edit)}
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

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? t(dict.books.editTitle) : t(dict.books.newTitle)}
        description={t(dict.books.modalDescription)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t(dict.books.classLabel)} required error={errors.classId?.message}>
              <Select
                value={watch('classId')}
                onChange={(e) => setValue('classId', e.target.value, { shouldValidate: true })}
                disabled={Boolean(editingId)}
              >
                {classList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {isBn ? cls.nameBn || cls.name : cls.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t(dict.books.subjectLabel)} required error={errors.subjectId?.message}>
              <Select
                value={formSubjectId}
                onChange={(e) => setValue('subjectId', e.target.value, { shouldValidate: true })}
              >
                {subjectList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {isBn ? sub.nameBn || sub.name : sub.name}
                    {sub.officialCode ? ` (${sub.officialCode})` : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField label={t(dict.books.nameLabel)} required error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder={t(dict.books.namePlaceholder)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label={t(dict.books.codeLabel)} error={errors.bookCode?.message}>
              <Input
                {...register('bookCode')}
                placeholder={t(dict.books.codePlaceholder)}
              />
            </FormField>

            <FormField label={t(dict.books.typeLabel)} required error={errors.type?.message}>
              <Select
                value={formType}
                onChange={(e) => setValue('type', e.target.value as BookType, { shouldValidate: true })}
              >
                {Object.values(BookType).map((bt) => (
                  <option key={bt} value={bt}>
                    {BOOK_TYPE_LABELS[bt] ? (isBn ? BOOK_TYPE_LABELS[bt].bn : BOOK_TYPE_LABELS[bt].en) : bt}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <FormField label={t(dict.books.orderLabel)} error={errors.displayOrder?.message}>
              <Input
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
                min={1}
              />
            </FormField>

            <div className="pt-5">
              <Switch
                checked={formIsActive}
                onChange={(val) => setValue('isActive', val)}
                label={t(dict.common.active)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={closeModal}>
              {t(dict.common.cancel)}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t(dict.common.saving)
                : editingId
                  ? t(dict.common.update)
                  : t(dict.common.save)}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
