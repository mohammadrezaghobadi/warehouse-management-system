'use client';

import React, { useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiX,
} from 'react-icons/fi';

import { finalizeGoodsReceipt } from '@/app/actions/receipts';

interface ReceiptItem {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  unit: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: string;
  description: string | null;
}

interface Receipt {
  id: number;
  receiptNumber: string;
  warehouseId: number;
  warehouseName: string;
  receivedById: number;
  receivedByName: string;
  supplier: string | null;
  purchaseNumber: string | null;
  status: string;
  description: string | null;
  receiptDate: string;
  createdAt: string;
  items: ReceiptItem[];
}

interface ReceiptsClientProps {
  initialReceipts: Receipt[];
}

type FilterStatus =
  | 'ALL'
  | 'DRAFT'
  | 'FINAL';

export default function ReceiptsClient({
  initialReceipts,
}: ReceiptsClientProps) {
  const router = useRouter();

  const [receipts, setReceipts] =
    useState(initialReceipts);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>('ALL');

  const [selectedReceipt, setSelectedReceipt] =
    useState<Receipt | null>(null);

  const [isFinalizing, setIsFinalizing] =
    useState(false);

  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const filteredReceipts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return receipts.filter((receipt) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        receipt.status === statusFilter;

      if (!query) {
        return matchesStatus;
      }

      const searchableText = [
        receipt.receiptNumber,
        receipt.warehouseName,
        receipt.supplier ?? '',
        receipt.purchaseNumber ?? '',
        receipt.receivedByName,
      ]
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(query)
      );
    });
  }, [receipts, search, statusFilter]);

  const stats = useMemo(() => {
    const total = receipts.length;

    const draft = receipts.filter(
      (receipt) => receipt.status === 'DRAFT'
    ).length;

    const final = receipts.filter(
      (receipt) => receipt.status === 'FINAL'
    ).length;

    const acceptedQuantity = receipts.reduce(
      (sum, receipt) =>
        sum +
        receipt.items.reduce(
          (itemSum, item) =>
            itemSum + item.acceptedQuantity,
          0
        ),
      0
    );

    return {
      total,
      draft,
      final,
      acceptedQuantity,
    };
  }, [receipts]);

  function formatNumber(value: number) {
    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string) {
    try {
      return new Intl.DateTimeFormat(
        'fa-IR',
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }
      ).format(new Date(value));
    } catch {
      return '-';
    }
  }

  function getStatusLabel(status: string) {
    if (status === 'FINAL') {
      return 'نهایی شده';
    }

    return 'پیش‌نویس';
  }

  function getStatusClasses(status: string) {
    if (status === 'FINAL') {
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    }

    return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }

  function toggleExpanded(id: number) {
    setExpandedId((current) =>
      current === id ? null : id
    );
  }

  async function handleFinalize(
    receipt: Receipt
  ) {
    if (receipt.status === 'FINAL') {
      return;
    }

    const confirmed = window.confirm(
      `آیا از نهایی کردن قبض ${receipt.receiptNumber} اطمینان دارید؟\n\nبعد از نهایی شدن، مقدار تأییدشده کالاها وارد موجودی انبار می‌شود.`
    );

    if (!confirmed) {
      return;
    }

    setIsFinalizing(true);

    try {
      const result =
        await finalizeGoodsReceipt(
          receipt.id
        );

      if (!result.success) {
        window.alert(
          result.error ??
            'نهایی‌سازی قبض انجام نشد.'
        );

        return;
      }

      setReceipts((current) =>
        current.map((item) =>
          item.id === receipt.id
            ? {
                ...item,
                status: 'FINAL',
              }
            : item
        )
      );

      setSelectedReceipt((current) =>
        current && current.id === receipt.id
          ? {
              ...current,
              status: 'FINAL',
            }
          : current
      );

      router.refresh();
    } catch (error) {
      console.error(
        'Finalize receipt error:',
        error
      );

      window.alert(
        'هنگام نهایی‌سازی قبض خطایی رخ داد.'
      );
    } finally {
      setIsFinalizing(false);
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
            <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <FiTruck size={27} />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    قبض‌های انبار
                  </h1>

                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    مدیریت ورود کالا و ثبت موجودی انبار
                  </p>
                </div>
              </div>

              <Link
                href="/admin/receipts/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-600"
              >
                <FiPlus size={18} />
                ثبت قبض جدید
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کل قبض‌ها
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {formatNumber(stats.total)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiFileText size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  پیش‌نویس
                </p>

                <p className="mt-2 text-3xl font-black text-amber-600">
                  {formatNumber(stats.draft)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiFileText size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  نهایی شده
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {formatNumber(stats.final)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiCheck size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مجموع ورود تأییدشده
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {formatNumber(
                    stats.acceptedQuantity
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <FiTruck size={22} />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <FiSearch
                size={19}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="جستجو بر اساس شماره قبض، انبار یا تأمین‌کننده..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: 'ALL' as const,
                  label: 'همه',
                },
                {
                  value: 'DRAFT' as const,
                  label: 'پیش‌نویس',
                },
                {
                  value: 'FINAL' as const,
                  label: 'نهایی شده',
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      item.value
                    )
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    statusFilter === item.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              >
                <FiRefreshCw size={16} />
                بروزرسانی
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px] text-right">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    شماره قبض
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    انبار
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    تأمین‌کننده
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    تعداد کالا
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    تاریخ
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    وضعیت
                  </th>

                  <th className="px-6 py-5 text-xs font-black text-slate-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FiFileText size={28} />
                        </div>

                        <p className="mt-4 font-bold text-slate-700">
                          قبضی پیدا نشد
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          هنوز قبضی با این مشخصات ثبت نشده است.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(
                    (receipt) => (
                      <React.Fragment
                        key={receipt.id}
                      >
                        <tr className="border-b border-slate-100 transition hover:bg-slate-50">
                          <td className="px-6 py-5">
                            <div className="font-black text-slate-900">
                              {receipt.receiptNumber}
                            </div>

                            {receipt.purchaseNumber && (
                              <div className="mt-1 text-xs text-slate-400">
                                خرید: {receipt.purchaseNumber}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                              {receipt.warehouseName}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm font-medium text-slate-600">
                            {receipt.supplier ||
                              'بدون تأمین‌کننده'}
                          </td>

                          <td className="px-6 py-5">
                            <span className="font-bold text-slate-700">
                              {formatNumber(
                                receipt.items.length
                              )}
                            </span>

                            <span className="mr-1 text-xs text-slate-400">
                              قلم
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-slate-500">
                            {formatDate(
                              receipt.receiptDate
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(
                                receipt.status
                              )}`}
                            >
                              {getStatusLabel(
                                receipt.status
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceipt(
                                    receipt
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                                title="مشاهده جزئیات"
                              >
                                <FiEye size={18} />
                              </button>

                              {receipt.status ===
                                'DRAFT' && (
                                <button
                                  type="button"
                                  disabled={
                                    isFinalizing
                                  }
                                  onClick={() =>
                                    handleFinalize(
                                      receipt
                                    )
                                  }
                                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiCheck
                                    size={16}
                                  />
                                  نهایی‌سازی
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedId ===
                          receipt.id && (
                          <tr>
                            <td
                              colSpan={7}
                              className="bg-slate-50 px-6 py-5"
                            >
                              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                                <div className="grid gap-4 md:grid-cols-3">
                                  {receipt.items.map(
                                    (item) => (
                                      <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 p-4"
                                      >
                                        <p className="font-bold text-slate-900">
                                          {
                                            item.productName
                                          }
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                          کد: {
                                            item.productCode
                                          }
                                        </p>

                                        <div className="mt-3 flex justify-between text-sm">
                                          <span className="text-slate-500">
                                            تأییدشده
                                          </span>

                                          <span className="font-black text-emerald-600">
                                            {formatNumber(
                                              item.acceptedQuantity
                                            )}{' '}
                                            {
                                              item.unit
                                            }
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredReceipts.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FiFileText size={28} />
                </div>

                <p className="mt-4 font-bold text-slate-700">
                  قبضی پیدا نشد
                </p>
              </div>
            ) : (
              filteredReceipts.map(
                (receipt) => (
                  <div
                    key={receipt.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">
                          {receipt.receiptNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {receipt.warehouseName}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${getStatusClasses(
                          receipt.status
                        )}`}
                      >
                        {getStatusLabel(
                          receipt.status
                        )}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          تأمین‌کننده
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-700">
                          {receipt.supplier ||
                            '---'}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          تاریخ
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {formatDate(
                            receipt.receiptDate
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedReceipt(
                            receipt
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700"
                      >
                        <FiEye size={17} />
                        جزئیات
                      </button>

                      {receipt.status ===
                        'DRAFT' && (
                        <button
                          type="button"
                          disabled={
                            isFinalizing
                          }
                          onClick={() =>
                            handleFinalize(
                              receipt
                            )
                          }
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
                        >
                          <FiCheck size={17} />
                          نهایی‌سازی
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        toggleExpanded(
                          receipt.id
                        )
                      }
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                    >
                      {expandedId ===
                      receipt.id ? (
                        <>
                          <FiChevronUp />
                          بستن اقلام
                        </>
                      ) : (
                        <>
                          <FiChevronDown />
                          مشاهده اقلام
                        </>
                      )}
                    </button>

                    {expandedId ===
                      receipt.id && (
                      <div className="mt-3 space-y-2">
                        {receipt.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex justify-between gap-3">
                                <div>
                                  <p className="font-bold text-slate-800">
                                    {
                                      item.productName
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {
                                      item.productCode
                                    }
                                  </p>
                                </div>

                                <span className="font-black text-emerald-600">
                                  {formatNumber(
                                    item.acceptedQuantity
                                  )}{' '}
                                  {
                                    item.unit
                                  }
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              )
            )}
          </div>

          {filteredReceipts.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <p className="text-sm text-slate-500">
                نمایش{' '}
                <span className="font-black text-slate-800">
                  {formatNumber(
                    filteredReceipts.length
                  )}
                </span>{' '}
                قبض از{' '}
                <span className="font-black text-slate-800">
                  {formatNumber(
                    receipts.length
                  )}
                </span>
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 md:p-6">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  جزئیات قبض انبار
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {
                    selectedReceipt.receiptNumber
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReceipt(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    انبار
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {
                      selectedReceipt.warehouseName
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    تأمین‌کننده
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {selectedReceipt.supplier ||
                      '---'}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    شماره خرید
                  </p>

                  <p className="mt-1 font-bold text-slate-800">
                    {
                      selectedReceipt.purchaseNumber ||
                      '---'
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    وضعیت
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                      selectedReceipt.status
                    )}`}
                  >
                    {getStatusLabel(
                      selectedReceipt.status
                    )}
                  </span>
                </div>
              </div>

              {selectedReceipt.description && (
                <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-bold text-blue-500">
                    توضیحات
                  </p>

                  <p className="mt-1 text-sm text-blue-900">
                    {
                      selectedReceipt.description
                    }
                  </p>
                </div>
              )}

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-black text-slate-900">
                    اقلام قبض
                  </h3>

                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                    {
                      selectedReceipt.items.length
                    }{' '}
                    قلم
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedReceipt.items.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                              {index + 1}
                            </div>

                            <div>
                              <p className="font-black text-slate-800">
                                {
                                  item.productName
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                کد کالا:{' '}
                                {
                                  item.productCode
                                }
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded-xl bg-slate-50 px-3 py-2">
                              <p className="text-[10px] text-slate-400">
                                دریافتی
                              </p>

                              <p className="mt-1 text-sm font-black text-slate-700">
                                {formatNumber(
                                  item.receivedQuantity
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 px-3 py-2">
                              <p className="text-[10px] text-emerald-500">
                                تأیید
                              </p>

                              <p className="mt-1 text-sm font-black text-emerald-700">
                                {formatNumber(
                                  item.acceptedQuantity
                                )}
                              </p>
                            </div>

                            <div className="rounded-xl bg-rose-50 px-3 py-2">
                              <p className="text-[10px] text-rose-500">
                                مردود
                              </p>

                              <p className="mt-1 text-sm font-black text-rose-700">
                                {formatNumber(
                                  item.rejectedQuantity
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {item.description && (
                          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {selectedReceipt.status ===
                'DRAFT' && (
                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReceipt(null)
                    }
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                  >
                    بستن
                  </button>

                  <button
                    type="button"
                    disabled={isFinalizing}
                    onClick={() =>
                      handleFinalize(
                        selectedReceipt
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiCheck size={18} />

                    {isFinalizing
                      ? 'در حال نهایی‌سازی...'
                      : 'نهایی‌سازی قبض'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}