'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiArrowDown,
  FiArrowUp,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTruck,
} from 'react-icons/fi';

interface TransactionProduct {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface TransactionWarehouse {
  id: number;
  name: string;
}

interface TransactionUser {
  id: number;
  name: string;
}

interface TransactionRecord {
  id: number;
  type: string;
  quantity: number;
  referenceType: string | null;
  referenceId: number | null;
  description: string | null;
  createdAt: string;

  product: TransactionProduct;
  warehouse: TransactionWarehouse;
  createdBy: TransactionUser;
}

interface TransactionsClientProps {
  initialTransactions: TransactionRecord[];
}

type FilterType = 'ALL' | 'IN' | 'OUT';

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getTypeLabel(type: string) {
  if (type === 'IN') {
    return 'ورود';
  }

  if (type === 'OUT') {
    return 'خروج';
  }

  return type;
}

function getReferenceLabel(
  referenceType: string | null
) {
  if (referenceType === 'GOODS_RECEIPT') {
    return 'قبض انبار';
  }

  if (referenceType === 'WAREHOUSE_ISSUE') {
    return 'حواله انبار';
  }

  return 'سایر';
}

export default function TransactionsClient({
  initialTransactions,
}: TransactionsClientProps) {
  const router = useRouter();

  const [transactions, setTransactions] = useState(
    initialTransactions
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<FilterType>('ALL');

  const [warehouseFilter, setWarehouseFilter] =
    useState('ALL');

  const [refreshing, setRefreshing] = useState(false);

  const warehouses = useMemo(() => {
    const map = new Map<number, string>();

    for (const transaction of transactions) {
      map.set(
        transaction.warehouse.id,
        transaction.warehouse.name
      );
    }

    return Array.from(map.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === 'ALL' ||
        transaction.type === typeFilter;

      const matchesWarehouse =
        warehouseFilter === 'ALL' ||
        String(transaction.warehouse.id) ===
          warehouseFilter;

      if (!matchesType || !matchesWarehouse) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        transaction.product.name
          .toLowerCase()
          .includes(query) ||
        transaction.product.code
          .toLowerCase()
          .includes(query) ||
        transaction.warehouse.name
          .toLowerCase()
          .includes(query) ||
        transaction.description
          ?.toLowerCase()
          .includes(query) ||
        false
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    warehouseFilter,
  ]);

  const stats = useMemo(() => {
    const incoming = transactions
      .filter((item) => item.type === 'IN')
      .reduce(
        (sum, item) => sum + item.quantity,
        0
      );

    const outgoing = transactions
      .filter((item) => item.type === 'OUT')
      .reduce(
        (sum, item) => sum + item.quantity,
        0
      );

    return {
      total: transactions.length,
      incoming,
      outgoing,
      filtered: filteredTransactions.length,
    };
  }, [transactions, filteredTransactions]);

  function refreshPage() {
    setRefreshing(true);

    router.refresh();

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 md:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <FiClock size={23} />
                  </div>

                  <div>
                    <h1 className="text-xl font-black text-slate-900 md:text-2xl">
                      گردش کالا
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      سابقه ورود و خروج کالاهای انبار
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshPage}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  size={17}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                بروزرسانی
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کل تراکنش‌ها
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatNumber(stats.total)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <FiClock size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مجموع ورود
                </p>

                <p className="mt-2 text-2xl font-black text-emerald-600">
                  {formatNumber(stats.incoming)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiArrowDown size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مجموع خروج
                </p>

                <p className="mt-2 text-2xl font-black text-rose-600">
                  {formatNumber(stats.outgoing)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FiArrowUp size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  نتیجه جستجو
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatNumber(stats.filtered)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiSearch size={21} />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <FiSearch
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="جستجو بر اساس کالا، کد کالا، انبار..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as FilterType
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-slate-400"
            >
              <option value="ALL">
                همه تراکنش‌ها
              </option>
              <option value="IN">
                ورود کالا
              </option>
              <option value="OUT">
                خروج کالا
              </option>
            </select>

            <select
              value={warehouseFilter}
              onChange={(event) =>
                setWarehouseFilter(event.target.value)
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-slate-400"
            >
              <option value="ALL">
                همه انبارها
              </option>

              {warehouses.map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                >
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Desktop */}
        <section className="hidden overflow-hidden rounded-3xl bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    کالا
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    نوع
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    مقدار
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    انبار
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    مرجع
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    ثبت‌کننده
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    تاریخ
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(
                  (transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <FiPackage size={18} />
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {
                                transaction.product
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                transaction.product
                                  .code
                              }
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {transaction.type === 'IN' ? (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                            <FiArrowDown size={14} />
                            ورود
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                            <FiArrowUp size={14} />
                            خروج
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-black text-slate-900">
                          {formatNumber(
                            transaction.quantity
                          )}
                        </span>

                        <span className="mr-1 text-xs text-slate-400">
                          {transaction.product.unit}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <FiTruck size={16} />

                          {
                            transaction.warehouse
                              .name
                          }
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                          {getReferenceLabel(
                            transaction.referenceType
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm font-medium text-slate-700">
                        {
                          transaction.createdBy
                            .name
                        }
                      </td>

                      <td className="px-6 py-5 text-xs text-slate-500">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FiClock size={27} />
              </div>

              <h3 className="mt-5 font-black text-slate-800">
                تراکنشی پیدا نشد
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                هنوز تراکنشی با این مشخصات ثبت نشده است.
              </p>
            </div>
          )}
        </section>

        {/* Mobile */}
        <section className="space-y-3 lg:hidden">
          {filteredTransactions.map(
            (transaction) => (
              <article
                key={transaction.id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <FiPackage size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-900">
                        {transaction.product.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.product.code}
                      </p>
                    </div>
                  </div>

                  {transaction.type === 'IN' ? (
                    <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                      ورود
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                      خروج
                    </span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      مقدار
                    </p>

                    <p className="mt-1 font-black text-slate-800">
                      {formatNumber(
                        transaction.quantity
                      )}{' '}
                      <span className="text-xs font-medium text-slate-400">
                        {transaction.product.unit}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      انبار
                    </p>

                    <p className="mt-1 truncate font-bold text-slate-800">
                      {
                        transaction.warehouse
                          .name
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      مرجع
                    </p>

                    <p className="mt-1 font-bold text-slate-800">
                      {getReferenceLabel(
                        transaction.referenceType
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      ثبت‌کننده
                    </p>

                    <p className="mt-1 truncate font-bold text-slate-800">
                      {
                        transaction.createdBy
                          .name
                      }
                    </p>
                  </div>
                </div>

                {transaction.description && (
                  <div className="mt-3 rounded-2xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-400">
                      توضیحات
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {transaction.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <FiClock size={14} />

                  {formatDate(
                    transaction.createdAt
                  )}
                </div>
              </article>
            )
          )}

          {filteredTransactions.length === 0 && (
            <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm">
              <FiClock
                size={32}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-black text-slate-800">
                تراکنشی پیدا نشد
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                هنوز تراکنشی با این مشخصات ثبت نشده است.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        {filteredTransactions.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-3xl bg-white px-5 py-4 text-sm text-slate-500 shadow-sm sm:flex-row">
            <span>
              نمایش{' '}
              <strong className="text-slate-900">
                {formatNumber(
                  filteredTransactions.length
                )}
              </strong>{' '}
              تراکنش
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-300"
              >
                <FiChevronRight size={16} />
              </button>

              <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white">
                ۱
              </span>

              <button
                type="button"
                disabled
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-300"
              >
                <FiChevronLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}