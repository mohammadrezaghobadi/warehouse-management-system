'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiEdit2,
  FiPackage,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiAlertTriangle,
  FiBox,
  FiLayers,
  FiCheckCircle,
} from 'react-icons/fi';

import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/app/actions/products';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
  minStock: number;
  maxStock: number | null;
  active: boolean;
  category: Category | null;
  quantity: number;
}

interface ProductsClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

interface ProductForm {
  id?: number;
  code: string;
  name: string;
  unit: string;
  categoryId: string;
  minStock: string;
  maxStock: string;
  active: boolean;
}

const emptyForm: ProductForm = {
  code: '',
  name: '',
  unit: '',
  categoryId: '',
  minStock: '0',
  maxStock: '',
  active: true,
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function ProductsClient({
  initialProducts,
  initialCategories,
}: ProductsClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>(
    emptyForm
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState('');
  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const products = initialProducts;
  const categories = initialCategories;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.code
          .toLowerCase()
          .includes(query) ||
        product.unit
          .toLowerCase()
          .includes(query) ||
        product.category?.name
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.active
  ).length;

  const inactiveProducts = products.filter(
    (product) => !product.active
  ).length;

  const lowStockProducts = products.filter(
    (product) =>
      product.quantity <= product.minStock
  ).length;

  function openCreateModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setError('');
    setIsModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);

    setForm({
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      categoryId: product.category
        ? String(product.category.id)
        : '',
      minStock: String(product.minStock),
      maxStock:
        product.maxStock !== null
          ? String(product.maxStock)
          : '',
      active: product.active,
    });

    setError('');
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setError('');
  }

  function handleChange(
    field: keyof ProductForm,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError('');

  const code = form.code.trim();
  const name = form.name.trim();
  const unit = form.unit.trim();

  // بررسی اطلاعات اصلی
  if (!code) {
    setError('کد کالا را وارد کنید.');
    return;
  }

  if (!name) {
    setError('نام کالا را وارد کنید.');
    return;
  }

  if (!unit) {
    setError('واحد کالا را وارد کنید.');
    return;
  }

  // تبدیل حداقل موجودی
  const minStock = Number(form.minStock || 0);

  // تبدیل حداکثر موجودی
  const maxStock =
    form.maxStock.trim() === ''
      ? null
      : Number(form.maxStock);

  // بررسی حداقل موجودی
  if (
    !Number.isFinite(minStock) ||
    minStock < 0
  ) {
    setError(
      'حداقل موجودی باید یک عدد معتبر باشد.'
    );
    return;
  }

  // بررسی حداکثر موجودی
  if (
    maxStock !== null &&
    (!Number.isFinite(maxStock) ||
      maxStock < 0)
  ) {
    setError(
      'حداکثر موجودی باید یک عدد معتبر باشد.'
    );
    return;
  }

  // بررسی ارتباط حداقل و حداکثر
  if (
    maxStock !== null &&
    maxStock < minStock
  ) {
    setError(
      'حداکثر موجودی نمی‌تواند کمتر از حداقل موجودی باشد.'
    );
    return;
  }

  // تبدیل دسته‌بندی
  const categoryId =
    form.categoryId.trim() === ''
      ? null
      : Number(form.categoryId);

  // بررسی شناسه دسته‌بندی
  if (
    categoryId !== null &&
    !Number.isInteger(categoryId)
  ) {
    setError(
      'دسته‌بندی انتخاب‌شده نامعتبر است.'
    );
    return;
  }

  setIsSubmitting(true);

  try {
    // =========================
    // ویرایش کالا
    // =========================
    if (editingProduct) {
      const result = await updateProduct({
        id: editingProduct.id,
        code,
        name,
        unit,
        categoryId,
        minStock,
        maxStock,
        active: form.active,
      });

      if (!result.success) {
        setError(
          result.error ||
            'ویرایش کالا با خطا مواجه شد.'
        );

        return;
      }
    }

    // =========================
    // ثبت کالای جدید
    // =========================
    else {
      const result = await createProduct({
        code,
        name,
        unit,
        categoryId,
        minStock,
        maxStock,
        active: form.active,
      });

      if (!result.success) {
        setError(
          result.error ||
            'ثبت کالا با خطا مواجه شد.'
        );

        return;
      }
    }

    // بستن فرم
    setIsModalOpen(false);

    setEditingProduct(null);

    setForm(emptyForm);

    setError('');

    // دریافت مجدد اطلاعات از Server Component
    router.refresh();
  } catch (error) {
    console.error(
      'Product submit error:',
      error
    );

    setError(
      'عملیات با خطا مواجه شد. دوباره تلاش کنید.'
    );
  } finally {
    setIsSubmitting(false);
  }
}

  function askDelete(productId: number) {
    setDeleteId(productId);
  }

  function cancelDelete() {
    if (isDeleting) {
      return;
    }

    setDeleteId(null);
  }

  async function handleDelete() {
    if (!deleteId) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteProduct(
        deleteId
      );

      if (!result?.success) {
        alert(
          result?.error ||
            'حذف کالا با خطا مواجه شد.'
        );

        return;
      }

      setDeleteId(null);

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        'حذف کالا با خطا مواجه شد. دوباره تلاش کنید.'
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
                <FiPackage size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                  مدیریت کالاها
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  ثبت، ویرایش و مدیریت کالاهای انبار
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
            ثبت کالای جدید
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کل کالاها
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {formatNumber(totalProducts)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiBox size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کالاهای فعال
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {formatNumber(activeProducts)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheckCircle size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کالاهای غیرفعال
                </p>

                <p className="mt-2 text-3xl font-black text-slate-600">
                  {formatNumber(inactiveProducts)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <FiLayers size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  موجودی کم
                </p>

                <p className="mt-2 text-3xl font-black text-amber-600">
                  {formatNumber(lowStockProducts)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiAlertTriangle size={22} />
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
                  لیست کالاها
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formatNumber(
                    filteredProducts.length
                  )}{' '}
                  کالا نمایش داده می‌شود
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
                    setSearch(event.target.value)
                  }
                  placeholder="جستجو بر اساس نام، کد یا دسته‌بندی..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
                />
              </div>
            </div>
          </div>

          {/* Empty */}
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <FiPackage size={34} />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-800">
                کالایی پیدا نشد
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? 'برای عبارت جستجوی واردشده کالایی وجود ندارد.'
                  : 'هنوز هیچ کالایی در سیستم ثبت نشده است.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <FiPlus size={17} />
                  ثبت اولین کالا
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        کالا
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        کد کالا
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        دسته‌بندی
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        واحد
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        موجودی
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black text-slate-500">
                        حداقل موجودی
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
                    {filteredProducts.map(
                      (product) => {
                        const isLowStock =
                          product.quantity <=
                          product.minStock;

                        return (
                          <tr
                            key={product.id}
                            className="border-b border-slate-100 transition hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                  <FiPackage
                                    size={20}
                                  />
                                </div>

                                <div>
                                  <p className="font-bold text-slate-900">
                                    {product.name}
                                  </p>

                                  {product.maxStock !==
                                    null && (
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      حداکثر:{' '}
                                      {formatNumber(
                                        product.maxStock
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-700">
                                {product.code}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {product.category ? (
                                <span className="text-sm font-medium text-slate-600">
                                  {product.category.name}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  بدون دسته‌بندی
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm font-bold text-slate-700">
                                {product.unit}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-black ${
                                    isLowStock
                                      ? 'text-amber-600'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {formatNumber(
                                    product.quantity
                                  )}
                                </span>

                                {isLowStock && (
                                  <FiAlertTriangle
                                    size={16}
                                    className="text-amber-500"
                                  />
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm font-medium text-slate-600">
                                {formatNumber(
                                  product.minStock
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {product.active ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  فعال
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  غیرفعال
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      product
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
                                      product.id
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
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 p-4 md:hidden">
                {filteredProducts.map(
                  (product) => {
                    const isLowStock =
                      product.quantity <=
                      product.minStock;

                    return (
                      <div
                        key={product.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <FiPackage
                                size={20}
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate font-black text-slate-900">
                                {product.name}
                              </h3>

                              <p className="mt-1 font-mono text-xs text-slate-400">
                                {product.code}
                              </p>
                            </div>
                          </div>

                          {product.active ? (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                              فعال
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                              غیرفعال
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-400">
                              دسته‌بندی
                            </p>

                            <p className="mt-1 truncate text-sm font-bold text-slate-700">
                              {product.category
                                ?.name ||
                                'بدون دسته‌بندی'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-400">
                              واحد
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {product.unit}
                            </p>
                          </div>

                          <div
                            className={`rounded-xl p-3 ${
                              isLowStock
                                ? 'bg-amber-50'
                                : 'bg-slate-50'
                            }`}
                          >
                            <p className="text-[11px] text-slate-400">
                              موجودی
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              <p
                                className={`text-sm font-black ${
                                  isLowStock
                                    ? 'text-amber-600'
                                    : 'text-slate-700'
                                }`}
                              >
                                {formatNumber(
                                  product.quantity
                                )}
                              </p>

                              {isLowStock && (
                                <FiAlertTriangle
                                  size={14}
                                  className="text-amber-500"
                                />
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] text-slate-400">
                              حداقل موجودی
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {formatNumber(
                                product.minStock
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                product
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-900 hover:text-white"
                          >
                            <FiEdit2 size={15} />
                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              askDelete(
                                product.id
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-500 hover:text-white"
                          >
                            <FiTrash2 size={15} />
                            حذف
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingProduct
                    ? 'ویرایش کالا'
                    : 'ثبت کالای جدید'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  اطلاعات کالا را به‌صورت کامل وارد کنید.
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
              className="max-h-[75vh] overflow-y-auto"
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

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Code */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      کد کالا
                    </label>

                    <input
                      type="text"
                      value={form.code}
                      onChange={(event) =>
                        handleChange(
                          'code',
                          event.target.value
                        )
                      }
                      placeholder="مثلاً PRD-001"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      نام کالا
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) =>
                        handleChange(
                          'name',
                          event.target.value
                        )
                      }
                      placeholder="مثلاً کاغذ A4"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      واحد
                    </label>

                    <input
                      type="text"
                      value={form.unit}
                      onChange={(event) =>
                        handleChange(
                          'unit',
                          event.target.value
                        )
                      }
                      placeholder="مثلاً عدد، بسته، کیلوگرم"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      دسته‌بندی
                    </label>

                    <select
                      value={form.categoryId}
                      onChange={(event) =>
                        handleChange(
                          'categoryId',
                          event.target.value
                        )
                      }
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">
                        بدون دسته‌بندی
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Min Stock */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      حداقل موجودی
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.minStock}
                      onChange={(event) =>
                        handleChange(
                          'minStock',
                          event.target.value
                        )
                      }
                      placeholder="0"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* Max Stock */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      حداکثر موجودی
                      <span className="mr-1 text-xs font-normal text-slate-400">
                        (اختیاری)
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.maxStock}
                      onChange={(event) =>
                        handleChange(
                          'maxStock',
                          event.target.value
                        )
                      }
                      placeholder="بدون محدودیت"
                      disabled={isSubmitting}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      وضعیت کالا
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      کالاهای غیرفعال در عملیات جدید قابل انتخاب نخواهند بود.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        handleChange(
                          'active',
                          event.target.checked
                        )
                      }
                      disabled={isSubmitting}
                      className="peer sr-only"
                    />

                    <div className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-disabled:opacity-50" />

                    <div className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:-translate-x-5" />
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
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
                      <FiCheckCircle size={17} />
                      {editingProduct
                        ? 'ذخیره تغییرات'
                        : 'ثبت کالا'}
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
              حذف کالا
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              آیا مطمئن هستید که می‌خواهید این کالا را
              حذف کنید؟ اگر کالا دارای موجودی یا سابقه
              تراکنش باشد، حذف آن توسط سیستم جلوگیری
              می‌شود.
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
                    حذف کالا
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