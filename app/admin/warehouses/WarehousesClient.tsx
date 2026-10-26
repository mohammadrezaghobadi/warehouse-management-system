'use client';

import React, { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  FiEdit3,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiSearch,
  FiToggleLeft,
  FiToggleRight,
  FiTruck,
  FiX,
} from 'react-icons/fi';

import {
  createWarehouse,
  toggleWarehouse,
  updateWarehouse,
} from '@/app/actions/warehouses';

interface Warehouse {
  id: number;
  name: string;
  location: string | null;
  active: boolean;
  productCount: number;
  totalQuantity: number;
  receiptCount: number;
  issueCount: number;
}

interface WarehousesClientProps {
  initialWarehouses: Warehouse[];
}

interface FormState {
  name: string;
  location: string;
}

const emptyForm: FormState = {
  name: '',
  location: '',
};

export default function WarehousesClient({
  initialWarehouses,
}: WarehousesClientProps) {
  const router = useRouter();

  const [warehouses, setWarehouses] =
    useState(initialWarehouses);

  const [search, setSearch] =
    useState('');

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [editingWarehouse, setEditingWarehouse] =
    useState<Warehouse | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const filteredWarehouses = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return warehouses;
    }

    return warehouses.filter((warehouse) => {
      return [
        warehouse.name,
        warehouse.location ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [warehouses, search]);

  const stats = useMemo(() => {
    return {
      total: warehouses.length,
      active: warehouses.filter(
        (warehouse) => warehouse.active
      ).length,
      inactive: warehouses.filter(
        (warehouse) => !warehouse.active
      ).length,
      products: warehouses.reduce(
        (total, warehouse) =>
          total + warehouse.productCount,
        0
      ),
    };
  }, [warehouses]);

  function formatNumber(value: number) {
    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function openCreateModal() {
    setEditingWarehouse(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(
    warehouse: Warehouse
  ) {
    setEditingWarehouse(warehouse);

    setForm({
      name: warehouse.name,
      location: warehouse.location ?? '',
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsModalOpen(false);
    setEditingWarehouse(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      window.alert('نام انبار را وارد کنید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = editingWarehouse
        ? await updateWarehouse(
            editingWarehouse.id,
            form
          )
        : await createWarehouse(form);

      if (!result.success) {
        window.alert(
          result.error ??
            'عملیات انجام نشد.'
        );

        return;
      }

      if (editingWarehouse) {
        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id ===
            editingWarehouse.id
              ? {
                  ...warehouse,
                  name: form.name.trim(),
                  location:
                    form.location.trim() ||
                    null,
                }
              : warehouse
          )
        );
      } else if (result.warehouseId) {
        setWarehouses((current) => [
          {
            id: result.warehouseId!,
            name: form.name.trim(),
            location:
              form.location.trim() || null,
            active: true,
            productCount: 0,
            totalQuantity: 0,
            receiptCount: 0,
            issueCount: 0,
          },
          ...current,
        ]);
      }

      closeModal();
      router.refresh();
    } catch (error) {
      console.error(
        'Warehouse submit error:',
        error
      );

      window.alert(
        'خطایی هنگام ذخیره انبار رخ داد.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(
    warehouse: Warehouse
  ) {
    const nextActive = !warehouse.active;

    const message = nextActive
      ? `آیا می‌خواهید انبار «${warehouse.name}» فعال شود؟`
      : `آیا می‌خواهید انبار «${warehouse.name}» غیرفعال شود؟`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      const result =
        await toggleWarehouse(
          warehouse.id,
          nextActive
        );

      if (!result.success) {
        window.alert(
          result.error ??
            'تغییر وضعیت انجام نشد.'
        );

        return;
      }

      setWarehouses((current) =>
        current.map((item) =>
          item.id === warehouse.id
            ? {
                ...item,
                active: nextActive,
              }
            : item
        )
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Toggle warehouse error:',
        error
      );

      window.alert(
        'تغییر وضعیت انبار با خطا مواجه شد.'
      );
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="relative p-6 md:p-8">
            <div className="absolute left-0 top-0 h-36 w-36 rounded-full bg-blue-100 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <FiPackage size={27} />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    مدیریت انبارها
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    مدیریت انبارها و محل نگهداری کالاها
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-600"
              >
                <FiPlus size={19} />
                ثبت انبار جدید
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              کل انبارها
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {formatNumber(stats.total)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              انبار فعال
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              {formatNumber(stats.active)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              انبار غیرفعال
            </p>

            <p className="mt-2 text-3xl font-black text-rose-600">
              {formatNumber(stats.inactive)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              تعداد اقلام نگهداری‌شده
            </p>

            <p className="mt-2 text-3xl font-black text-blue-600">
              {formatNumber(stats.products)}
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="relative max-w-xl">
            <FiSearch
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="جستجوی نام یا محل انبار..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </section>

        {/* Desktop */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    انبار
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    محل
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    کالاها
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    ورود
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    خروج
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    وضعیت
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWarehouses.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      انباری پیدا نشد.
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map(
                    (warehouse) => (
                      <tr
                        key={warehouse.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FiPackage
                                size={20}
                              />
                            </div>

                            <div>
                              <p className="font-black text-slate-900">
                                {
                                  warehouse.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                موجودی کل:{' '}
                                {formatNumber(
                                  warehouse.totalQuantity
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <FiMapPin
                              className="text-slate-400"
                            />

                            {warehouse.location ||
                              'ثبت نشده'}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm font-bold text-slate-700">
                          {formatNumber(
                            warehouse.productCount
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-bold text-emerald-600">
                          {formatNumber(
                            warehouse.receiptCount
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-bold text-rose-600">
                          {formatNumber(
                            warehouse.issueCount
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-black ${
                              warehouse.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {warehouse.active
                              ? 'فعال'
                              : 'غیرفعال'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  warehouse
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                              title="ویرایش"
                            >
                              <FiEdit3
                                size={17}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleToggle(
                                  warehouse
                                )
                              }
                              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                                warehouse.active
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600'
                                  : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                              }`}
                              title={
                                warehouse.active
                                  ? 'غیرفعال کردن'
                                  : 'فعال کردن'
                              }
                            >
                              {warehouse.active ? (
                                <FiToggleRight
                                  size={21}
                                />
                              ) : (
                                <FiToggleLeft
                                  size={21}
                                />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredWarehouses.length ===
            0 ? (
              <div className="px-6 py-16 text-center text-sm text-slate-400">
                انباری پیدا نشد.
              </div>
            ) : (
              filteredWarehouses.map(
                (warehouse) => (
                  <div
                    key={warehouse.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FiPackage
                            size={20}
                          />
                        </div>

                        <div>
                          <p className="font-black text-slate-900">
                            {
                              warehouse.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {warehouse.location ||
                              'محل ثبت نشده'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          warehouse.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {warehouse.active
                          ? 'فعال'
                          : 'غیرفعال'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          کالا
                        </p>

                        <p className="mt-1 font-black text-slate-800">
                          {formatNumber(
                            warehouse.productCount
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          موجودی کل
                        </p>

                        <p className="mt-1 font-black text-slate-800">
                          {formatNumber(
                            warehouse.totalQuantity
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            warehouse
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700"
                      >
                        <FiEdit3 size={16} />
                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggle(
                            warehouse
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700"
                      >
                        {warehouse.active ? (
                          <>
                            <FiToggleRight
                              size={18}
                            />
                            غیرفعال
                          </>
                        ) : (
                          <>
                            <FiToggleLeft
                              size={18}
                            />
                            فعال
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  {editingWarehouse
                    ? 'ویرایش اطلاعات'
                    : 'ثبت اطلاعات جدید'}
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {editingWarehouse
                    ? 'ویرایش انبار'
                    : 'ثبت انبار جدید'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  نام انبار
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="مثلاً انبار مرکزی"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  محل انبار
                </label>

                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      location:
                        event.target.value,
                    }))
                  }
                  placeholder="مثلاً ساختمان شماره ۱"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'در حال ذخیره...'
                    : editingWarehouse
                      ? 'ذخیره تغییرات'
                      : 'ثبت انبار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}