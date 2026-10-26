'use client';

import React, {
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  FiEdit2,
  FiFolder,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiPackage,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/app/actions/categories';

interface Category {
  id: number;
  name: string;
  productCount: number;
}

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({
  initialCategories,
}: CategoriesClientProps) {
  const router = useRouter();

  const [search, setSearch] =
    useState('');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [name, setName] =
    useState('');

  const [error, setError] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const categories = initialCategories;

  const filteredCategories = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((category) =>
      category.name
        .toLowerCase()
        .includes(query)
    );
  }, [categories, search]);

  const totalCategories =
    categories.length;

  const categoriesWithProducts =
    categories.filter(
      (category) =>
        category.productCount > 0
    ).length;

  const emptyCategories =
    categories.filter(
      (category) =>
        category.productCount === 0
    ).length;

  const totalProducts =
    categories.reduce(
      (total, category) =>
        total + category.productCount,
      0
    );

  function formatNumber(
    value: number
  ) {
    return new Intl.NumberFormat(
      'fa-IR'
    ).format(value);
  }

  function openCreateModal() {
    setEditingCategory(null);
    setName('');
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(
    category: Category
  ) {
    setEditingCategory(category);
    setName(category.name);
    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setName('');
    setError('');
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        'نام دسته‌بندی را وارد کنید.'
      );
      return;
    }

    if (trimmedName.length < 2) {
      setError(
        'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCategory) {
        const result =
          await updateCategory(
            editingCategory.id,
            trimmedName
          );

        if (!result.success) {
          setError(
            result.error ||
              'ویرایش دسته‌بندی با خطا مواجه شد.'
          );

          return;
        }
      } else {
        const result =
          await createCategory(
            trimmedName
          );

        if (!result.success) {
          setError(
            result.error ||
              'ثبت دسته‌بندی با خطا مواجه شد.'
          );

          return;
        }
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setName('');
      setError('');

      router.refresh();
    } catch (error) {
      console.error(
        'Category submit error:',
        error
      );

      setError(
        'عملیات با خطا مواجه شد. دوباره تلاش کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function askDelete(
    categoryId: number
  ) {
    setDeleteId(categoryId);
  }

  function cancelDelete() {
    if (isDeleting) {
      return;
    }

    setDeleteId(null);
  }

  async function handleDelete() {
    if (deleteId === null) {
      return;
    }

    setIsDeleting(true);

    try {
      const result =
        await deleteCategory(
          deleteId
        );

      if (!result.success) {
        alert(
          result.error ||
            'حذف دسته‌بندی با خطا مواجه شد.'
        );

        return;
      }

      setDeleteId(null);

      router.refresh();
    } catch (error) {
      console.error(
        'Category delete error:',
        error
      );

      alert(
        'حذف دسته‌بندی با خطا مواجه شد. دوباره تلاش کنید.'
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <FiFolder size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                  مدیریت دسته‌بندی‌ها
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  ایجاد و مدیریت دسته‌بندی کالاها
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <FiPlus size={19} />
            ثبت دسته‌بندی جدید
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Total */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  کل دسته‌بندی‌ها
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {formatNumber(
                    totalCategories
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiFolder size={22} />
              </div>

            </div>
          </div>

          {/* With Products */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  دارای کالا
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {formatNumber(
                    categoriesWithProducts
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={22} />
              </div>

            </div>
          </div>

          {/* Empty */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  بدون کالا
                </p>

                <p className="mt-2 text-3xl font-black text-slate-600">
                  {formatNumber(
                    emptyCategories
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <FiFolder size={22} />
              </div>

            </div>
          </div>

          {/* Products */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  تعداد کالاها
                </p>

                <p className="mt-2 text-3xl font-black text-indigo-600">
                  {formatNumber(
                    totalProducts
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FiPackage size={22} />
              </div>

            </div>
          </div>

        </div>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="border-b border-slate-200 p-5">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  لیست دسته‌بندی‌ها
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatNumber(
                    filteredCategories.length
                  )}{' '}
                  دسته‌بندی نمایش داده می‌شود
                </p>
              </div>

              <div className="relative w-full md:max-w-md">

                <FiSearch
                  size={19}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="جستجوی دسته‌بندی..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                />

              </div>

            </div>

          </div>

          {/* Empty */}
          {filteredCategories.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <FiFolder size={34} />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-800">
                دسته‌بندی پیدا نشد
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? 'برای عبارت جستجوی واردشده دسته‌بندی‌ای وجود ندارد.'
                  : 'هنوز هیچ دسته‌بندی‌ای در سیستم ثبت نشده است.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <FiPlus size={17} />
                  ثبت اولین دسته‌بندی
                </button>
              )}

            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">

                <table className="w-full min-w-[700px]">

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        دسته‌بندی
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        تعداد کالا
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        وضعیت
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black text-slate-500">
                        عملیات
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50/70"
                        >

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                <FiFolder
                                  size={20}
                                />
                              </div>

                              <div>
                                <p className="font-bold text-slate-900">
                                  {category.name}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  شناسه:{' '}
                                  {formatNumber(
                                    category.id
                                  )}
                                </p>
                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                              <FiPackage
                                size={15}
                              />

                              {formatNumber(
                                category.productCount
                              )}
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            {category.productCount >
                            0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">

                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                دارای کالا

                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">

                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

                                خالی

                              </span>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <div className="flex items-center justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    category
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-900 hover:text-white"
                                title="ویرایش"
                              >
                                <FiEdit2
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  askDelete(
                                    category.id
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                                title="حذف"
                              >
                                <FiTrash2
                                  size={16}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* Mobile */}
              <div className="space-y-3 p-4 md:hidden">

                {filteredCategories.map(
                  (category) => (
                    <div
                      key={category.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <FiFolder
                              size={20}
                            />
                          </div>

                          <div className="min-w-0">

                            <h3 className="truncate font-black text-slate-900">
                              {category.name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                              شناسه:{' '}
                              {formatNumber(
                                category.id
                              )}
                            </p>

                          </div>

                        </div>

                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {formatNumber(
                            category.productCount
                          )}{' '}
                          کالا
                        </span>

                      </div>

                      <div className="mt-4 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              category
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                        >
                          <FiEdit2
                            size={15}
                          />
                          ویرایش
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            askDelete(
                              category.id
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-500 hover:text-white"
                        >
                          <FiTrash2
                            size={15}
                          />
                          حذف
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >

          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingCategory
                    ? 'ویرایش دسته‌بندی'
                    : 'ثبت دسته‌بندی جدید'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  نام دسته‌بندی را وارد کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX size={20} />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
            >

              <div className="space-y-5 p-6">

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">

                    <FiAlertTriangle
                      size={19}
                      className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>

                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    نام دسته‌بندی
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="مثلاً لوازم اداری"
                    autoFocus
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle
                        size={17}
                      />

                      {editingCategory
                        ? 'ذخیره تغییرات'
                        : 'ثبت دسته‌بندی'}
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Delete Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FiTrash2 size={24} />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-900">
              حذف دسته‌بندی
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              آیا مطمئن هستید که می‌خواهید این
              دسته‌بندی را حذف کنید؟
              <br />
              اگر دسته‌بندی دارای کالا باشد،
              سیستم اجازه حذف آن را نخواهد داد.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isDeleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    در حال حذف...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    حذف دسته‌بندی
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}