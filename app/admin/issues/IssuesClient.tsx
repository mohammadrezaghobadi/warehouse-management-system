
'use client';

import React, {
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  FiArchive,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiFileText,
  FiInfo,
  FiMapPin,
  FiPackage,
  FiSearch,
  FiTruck,
  FiUser,
  FiX,
} from 'react-icons/fi';

import { createWarehouseIssue } from '@/app/actions/issues';

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface RequestItem {
  id: number;
  requestedQuantity: number;
  approvedQuantity: number | null;
  deliveredQuantity: number;
  product: Product;
}

interface RequestUser {
  id: number;
  name: string;
  username: string;
}

interface Department {
  id: number;
  name: string;
}

interface RequestRecord {
  id: number;
  requestNumber: string;
  status: string;
  description: string | null;
  createdAt: string;
  requester: RequestUser;
  department: Department;
  items: RequestItem[];
}

interface IssueItem {
  id: number;
  quantity: number;
  product: Product;
}

interface Warehouse {
  id: number;
  name: string;
  location: string | null;
}

interface IssueRecord {
  id: number;
  issueNumber: string;
  requestId: number;
  status: string;
  description: string | null;
  issueDate: string;
  createdAt: string;

  request: {
    id: number;
    requestNumber: string;
    status: string;
    requester: RequestUser;
    department: Department;
  };

  warehouse: Warehouse;

  issuedBy: {
    id: number;
    name: string;
  };

  items: IssueItem[];
}

interface IssuesClientProps {
  initialIssues: IssueRecord[];
  initialRequests: RequestRecord[];
  initialWarehouses: Warehouse[];
}

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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === 'FINAL') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <FiCheck size={13} />
        صادر شده
      </span>
    );
  }

  if (status === 'DRAFT') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-inset ring-amber-200">
        <FiClock size={13} />
        پیش‌نویس
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
      {status}
    </span>
  );
}

export default function IssuesClient({
  initialIssues,
  initialRequests,
  initialWarehouses,
}: IssuesClientProps) {
  const router = useRouter();

  const [issues, setIssues] =
    useState<IssueRecord[]>(
      initialIssues
    );

  const [requests, setRequests] =
    useState<RequestRecord[]>(
      initialRequests
    );

  const [search, setSearch] =
    useState('');

  const [activeTab, setActiveTab] =
    useState<'READY' | 'ISSUES'>(
      'READY'
    );

  const [selectedRequest, setSelectedRequest] =
    useState<RequestRecord | null>(
      null
    );

  const [selectedIssue, setSelectedIssue] =
    useState<IssueRecord | null>(
      null
    );

  const [selectedWarehouseId, setSelectedWarehouseId] =
    useState<number | ''>('');

  const [quantities, setQuantities] =
    useState<Record<number, string>>({});

  const [description, setDescription] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const stats = useMemo(() => {
    const totalIssuedItems =
      issues.reduce(
        (sum, issue) =>
          sum + issue.items.length,
        0
      );

    return {
      issues: issues.length,
      ready: requests.length,
      items: totalIssuedItems,
      warehouses:
        initialWarehouses.length,
    };
  }, [
    issues,
    requests,
    initialWarehouses.length,
  ]);

  const filteredRequests =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return requests;
      }

      return requests.filter(
        (request) => {
          const text = [
            request.requestNumber,
            request.requester.name,
            request.requester.username,
            request.department.name,
            request.description ?? '',
            ...request.items.map(
              (item) =>
                `${item.product.name} ${item.product.code}`
            ),
          ]
            .join(' ')
            .toLowerCase();

          return text.includes(query);
        }
      );
    }, [requests, search]);

  const filteredIssues =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return issues;
      }

      return issues.filter((issue) => {
        const text = [
          issue.issueNumber,
          issue.request.requestNumber,
          issue.request.requester.name,
          issue.request.department.name,
          issue.warehouse.name,
          ...issue.items.map(
            (item) =>
              `${item.product.name} ${item.product.code}`
          ),
        ]
          .join(' ')
          .toLowerCase();

        return text.includes(query);
      });
    }, [issues, search]);

  function openRequest(
    request: RequestRecord
  ) {
    setSelectedRequest(request);
    setSelectedIssue(null);
    setError('');
    setDescription('');

    const initialQuantities: Record<
      number,
      string
    > = {};

    request.items.forEach((item) => {
      const approved =
        item.approvedQuantity ?? 0;

      const remaining =
        Math.max(
          0,
          approved -
            item.deliveredQuantity
        );

      initialQuantities[item.id] =
        String(remaining);
    });

    setQuantities(initialQuantities);

    setSelectedWarehouseId(
      initialWarehouses.length === 1
        ? initialWarehouses[0].id
        : ''
    );
  }

  function closeRequest() {
    if (loading) return;

    setSelectedRequest(null);
    setQuantities({});
    setSelectedWarehouseId('');
    setDescription('');
    setError('');
  }

  function openIssue(
    issue: IssueRecord
  ) {
    setSelectedIssue(issue);
    setSelectedRequest(null);
    setError('');
  }

  function handleQuantityChange(
    item: RequestItem,
    value: string
  ) {
    const cleanValue =
      value.replace(
        /[^0-9.]/g,
        ''
      );

    if (cleanValue === '') {
      setQuantities((previous) => ({
        ...previous,
        [item.id]: '',
      }));
      return;
    }

    const numericValue =
      Number(cleanValue);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    const approved =
      item.approvedQuantity ?? 0;

    const remaining = Math.max(
      0,
      approved -
        item.deliveredQuantity
    );

    if (numericValue > remaining) {
      setQuantities((previous) => ({
        ...previous,
        [item.id]: String(remaining),
      }));
      return;
    }

    setQuantities((previous) => ({
      ...previous,
      [item.id]: cleanValue,
    }));
  }

  async function handleCreateIssue() {
    if (!selectedRequest) return;

    setError('');

    if (
      selectedWarehouseId === ''
    ) {
      setError(
        'انبار را انتخاب کنید.'
      );
      return;
    }

    const items = selectedRequest.items
      .map((item) => {
        const quantity =
          Number(
            quantities[item.id] ?? '0'
          );

        return {
          productId:
            item.product.id,
          quantity,
        };
      })
      .filter(
        (item) =>
          Number.isFinite(
            item.quantity
          ) &&
          item.quantity > 0
      );

    if (!items.length) {
      setError(
        'حداقل یک کالا با مقدار بیشتر از صفر انتخاب کنید.'
      );
      return;
    }

    setLoading(true);

    try {
      const result =
        await createWarehouseIssue({
          requestId:
            selectedRequest.id,
          warehouseId:
            selectedWarehouseId,
          description,
          items,
        });

      if (!result.success) {
        setError(
          result.error ??
            'ثبت حواله انجام نشد.'
        );
        return;
      }

      const createdIssueId =
        result.issueId;

      setRequests((previous) =>
        previous.filter(
          (request) =>
            request.id !==
            selectedRequest.id
        )
      );

      closeRequest();

      setActiveTab('ISSUES');

      router.refresh();

      if (createdIssueId) {
        const freshIssue =
          issues.find(
            (issue) =>
              issue.id ===
              createdIssueId
          );

        if (freshIssue) {
          setSelectedIssue(
            freshIssue
          );
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        'هنگام ثبت حواله خطایی رخ داد.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="relative p-5 md:p-7">
            <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-orange-100/60 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">
                  <FiArchive size={14} />
                  مدیریت حواله انبار
                </div>

                <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                  حواله انبار
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  تحویل کالا بر اساس درخواست‌های
                  تأییدشده و کنترل موجودی انبار
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-lg">
                <p className="text-xs font-medium text-slate-400">
                  حواله‌های صادرشده
                </p>

                <p className="mt-1 text-3xl font-black">
                  {formatNumber(
                    stats.issues
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="حواله صادر شده"
            value={stats.issues}
            icon={<FiArchive />}
            className="bg-slate-900 text-white"
          />

          <StatCard
            title="آماده صدور"
            value={stats.ready}
            icon={<FiClock />}
            className="bg-amber-50 text-amber-700"
          />

          <StatCard
            title="اقلام تحویلی"
            value={stats.items}
            icon={<FiPackage />}
            className="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="انبارهای فعال"
            value={stats.warehouses}
            icon={<FiTruck />}
            className="bg-blue-50 text-blue-700"
          />
        </section>

        {/* Tabs + Search */}
        <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() =>
                  setActiveTab('READY')
                }
                className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                  activeTab === 'READY'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                آماده صدور
                <span className="mr-2 rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-700">
                  {formatNumber(
                    requests.length
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab('ISSUES')
                }
                className={`rounded-xl px-5 py-2.5 text-sm font-black transition ${
                  activeTab === 'ISSUES'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                حواله‌ها
                <span className="mr-2 rounded-lg bg-slate-200 px-2 py-1 text-xs text-slate-600">
                  {formatNumber(
                    issues.length
                  )}
                </span>
              </button>
            </div>

            <div className="relative w-full lg:max-w-md">
              <FiSearch
                size={18}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="جستجو..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>
          </div>
        </section>

        {/* Ready Requests */}
        {activeTab === 'READY' && (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-5 py-5">
              <h2 className="font-black text-slate-900">
                درخواست‌های آماده صدور حواله
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                فقط درخواست‌های تأییدشده‌ای که هنوز
                حواله ندارند نمایش داده می‌شوند.
              </p>
            </div>

            {filteredRequests.length === 0 ? (
              <EmptyState
                icon={<FiCheck size={28} />}
                title="درخواستی برای صدور حواله وجود ندارد"
                description="تمام درخواست‌های تأییدشده دارای حواله هستند یا هنوز درخواستی تأیید نشده است."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px] text-right">
                    <thead className="bg-slate-50 text-xs font-black text-slate-500">
                      <tr>
                        <th className="px-5 py-4">
                          درخواست
                        </th>

                        <th className="px-5 py-4">
                          درخواست‌کننده
                        </th>

                        <th className="px-5 py-4">
                          واحد
                        </th>

                        <th className="px-5 py-4">
                          اقلام
                        </th>

                        <th className="px-5 py-4">
                          تاریخ
                        </th>

                        <th className="px-5 py-4">
                          عملیات
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.map(
                        (request) => (
                          <tr
                            key={
                              request.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-5">
                              <p className="font-black text-slate-900">
                                {
                                  request.requestNumber
                                }
                              </p>

                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                                <FiCheck />
                                تأیید شده
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                  <FiUser />
                                </div>

                                <div>
                                  <p className="font-bold text-slate-800">
                                    {
                                      request
                                        .requester
                                        .name
                                    }
                                  </p>

                                  <p className="text-xs text-slate-400">
                                    @
                                    {
                                      request
                                        .requester
                                        .username
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 text-sm font-bold text-slate-600">
                              {
                                request
                                  .department
                                  .name
                              }
                            </td>

                            <td className="px-5 py-5">
                              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                                {formatNumber(
                                  request
                                    .items
                                    .length
                                )}{' '}
                                قلم
                              </span>
                            </td>

                            <td className="px-5 py-5 text-xs text-slate-500">
                              {formatDate(
                                request.createdAt
                              )}
                            </td>

                            <td className="px-5 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  openRequest(
                                    request
                                  )
                                }
                                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
                              >
                                صدور حواله
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredRequests.map(
                    (request) => (
                      <div
                        key={request.id}
                        className="p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">
                              {
                                request.requestNumber
                              }
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              {
                                request
                                  .requester
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                request
                                  .department
                                  .name
                              }
                            </p>
                          </div>

                          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                            تأیید شده
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openRequest(
                              request
                            )
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-black text-white"
                        >
                          <FiArchive />
                          صدور حواله
                        </button>
                      </div>
                    )
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {/* Issues */}
        {activeTab === 'ISSUES' && (
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-5 py-5">
              <h2 className="font-black text-slate-900">
                حواله‌های صادرشده
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                سوابق خروج کالا از انبار
              </p>
            </div>

            {filteredIssues.length === 0 ? (
              <EmptyState
                icon={<FiArchive size={28} />}
                title="هنوز حواله‌ای صادر نشده است"
                description="پس از صدور حواله، سوابق آن در این قسمت نمایش داده می‌شود."
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[950px] text-right">
                    <thead className="bg-slate-50 text-xs font-black text-slate-500">
                      <tr>
                        <th className="px-5 py-4">
                          حواله
                        </th>

                        <th className="px-5 py-4">
                          درخواست
                        </th>

                        <th className="px-5 py-4">
                          انبار
                        </th>

                        <th className="px-5 py-4">
                          درخواست‌کننده
                        </th>

                        <th className="px-5 py-4">
                          اقلام
                        </th>

                        <th className="px-5 py-4">
                          تاریخ
                        </th>

                        <th className="px-5 py-4">
                          وضعیت
                        </th>

                        <th className="px-5 py-4">
                          عملیات
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredIssues.map(
                        (issue) => (
                          <tr
                            key={issue.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-5 font-black text-slate-900">
                              {
                                issue.issueNumber
                              }
                            </td>

                            <td className="px-5 py-5 text-sm font-bold text-slate-600">
                              {
                                issue
                                  .request
                                  .requestNumber
                              }
                            </td>

                            <td className="px-5 py-5">
                              <p className="font-bold text-slate-700">
                                {
                                  issue
                                    .warehouse
                                    .name
                                }
                              </p>

                              {issue
                                .warehouse
                                .location && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                  <FiMapPin />
                                  {
                                    issue
                                      .warehouse
                                      .location
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-5 text-sm font-bold text-slate-600">
                              {
                                issue
                                  .request
                                  .requester
                                  .name
                              }
                            </td>

                            <td className="px-5 py-5">
                              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                                {formatNumber(
                                  issue
                                    .items
                                    .length
                                )}{' '}
                                قلم
                              </span>
                            </td>

                            <td className="px-5 py-5 text-xs text-slate-500">
                              {formatDate(
                                issue.issueDate
                              )}
                            </td>

                            <td className="px-5 py-5">
                              <StatusBadge
                                status={
                                  issue.status
                                }
                              />
                            </td>

                            <td className="px-5 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  openIssue(
                                    issue
                                  )
                                }
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                              >
                                جزئیات
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredIssues.map(
                    (issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() =>
                          openIssue(
                            issue
                          )
                        }
                        className="w-full p-4 text-right transition hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-900">
                              {
                                issue.issueNumber
                              }
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              {
                                issue
                                  .warehouse
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                issue
                                  .request
                                  .requestNumber
                              }{' '}
                              •{' '}
                              {
                                issue
                                  .request
                                  .requester
                                  .name
                              }
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              issue.status
                            }
                          />
                        </div>
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Create Issue Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeRequest();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 md:px-7">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    صدور حواله انبار
                  </h3>

                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                    تأیید شده
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {
                    selectedRequest.requestNumber
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={closeRequest}
                disabled={loading}
                className="rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 md:p-7">
              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <InfoBox
                  title="درخواست‌کننده"
                  value={
                    selectedRequest
                      .requester.name
                  }
                />

                <InfoBox
                  title="واحد"
                  value={
                    selectedRequest
                      .department.name
                  }
                />

                <InfoBox
                  title="شماره درخواست"
                  value={
                    selectedRequest
                      .requestNumber
                  }
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-black text-slate-700">
                  انبار صادرکننده
                </label>

                <select
                  value={
                    selectedWarehouseId
                  }
                  onChange={(event) =>
                    setSelectedWarehouseId(
                      event.target.value
                        ? Number(
                            event.target
                              .value
                          )
                        : ''
                    )
                  }
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">
                    انتخاب انبار
                  </option>

                  {initialWarehouses.map(
                    (warehouse) => (
                      <option
                        key={
                          warehouse.id
                        }
                        value={
                          warehouse.id
                        }
                      >
                        {warehouse.name}
                        {warehouse.location
                          ? ` - ${warehouse.location}`
                          : ''}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900">
                      اقلام حواله
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      مقدار قابل تحویل را وارد کنید.
                    </p>
                  </div>

                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                    {formatNumber(
                      selectedRequest.items
                        .length
                    )}{' '}
                    قلم
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="hidden grid-cols-[1fr_110px_110px_150px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 md:grid">
                    <span>کالا</span>
                    <span>تأیید شده</span>
                    <span>تحویل شده</span>
                    <span>مقدار حواله</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {selectedRequest.items.map(
                      (item) => {
                        const approved =
                          item.approvedQuantity ??
                          0;

                        const remaining =
                          Math.max(
                            0,
                            approved -
                              item.deliveredQuantity
                          );

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="grid gap-3 p-4 md:grid-cols-[1fr_110px_110px_150px] md:items-center"
                          >
                            <div>
                              <p className="font-bold text-slate-800">
                                {
                                  item
                                    .product
                                    .name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                کد:{' '}
                                {
                                  item
                                    .product
                                    .code
                                }{' '}
                                • واحد:{' '}
                                {
                                  item
                                    .product
                                    .unit
                                }
                              </p>
                            </div>

                            <div>
                              <span className="text-xs text-slate-400 md:hidden">
                                تأیید شده:{' '}
                              </span>

                              <span className="font-black text-slate-700">
                                {formatNumber(
                                  approved
                                )}
                              </span>
                            </div>

                            <div>
                              <span className="text-xs text-slate-400 md:hidden">
                                تحویل شده:{' '}
                              </span>

                              <span className="font-bold text-slate-600">
                                {formatNumber(
                                  item.deliveredQuantity
                                )}
                              </span>
                            </div>

                            <div>
                              <input
                                type="number"
                                min="0"
                                max={
                                  remaining
                                }
                                step="0.01"
                                value={
                                  quantities[
                                    item.id
                                  ] ??
                                  ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleQuantityChange(
                                    item,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                disabled={
                                  loading ||
                                  remaining <=
                                    0
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-400"
                              />

                              {remaining >
                                0 && (
                                <p className="mt-1 text-[11px] text-slate-400">
                                  باقی‌مانده:{' '}
                                  {formatNumber(
                                    remaining
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-black text-slate-700">
                  توضیحات حواله
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  disabled={loading}
                  placeholder="توضیحات اختیاری..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-7">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRequest}
                  disabled={loading}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={
                    handleCreateIssue
                  }
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiArchive />

                  {loading
                    ? 'در حال ثبت...'
                    : 'ثبت و صدور حواله'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedIssue(null);
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 md:px-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">
                    {
                      selectedIssue.issueNumber
                    }
                  </h3>

                  <StatusBadge
                    status={
                      selectedIssue.status
                    }
                  />
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(
                    selectedIssue.issueDate
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedIssue(
                    null
                  )
                }
                className="rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200"
              >
                <FiX />
              </button>
            </div>

            <div className="overflow-y-auto p-5 md:p-7">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                  title="شماره درخواست"
                  value={
                    selectedIssue
                      .request
                      .requestNumber
                  }
                />

                <InfoBox
                  title="انبار"
                  value={
                    selectedIssue
                      .warehouse
                      .name
                  }
                />

                <InfoBox
                  title="درخواست‌کننده"
                  value={
                    selectedIssue
                      .request
                      .requester
                      .name
                  }
                />

                <InfoBox
                  title="صادرکننده"
                  value={
                    selectedIssue
                      .issuedBy.name
                  }
                />
              </div>

              {selectedIssue.description && (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-400">
                    توضیحات
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {
                      selectedIssue.description
                    }
                  </p>
                </div>
              )}

              <div className="mt-6">
                <h4 className="mb-3 font-black text-slate-900">
                  اقلام حواله
                </h4>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
                    <span>کالا</span>
                    <span>مقدار</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {selectedIssue.items.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="grid grid-cols-[1fr_120px] gap-3 p-4"
                        >
                          <div>
                            <p className="font-bold text-slate-800">
                              {
                                item
                                  .product
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {
                                item
                                  .product
                                  .code
                              }{' '}
                              •{' '}
                              {
                                item
                                  .product
                                  .unit
                              }
                            </p>
                          </div>

                          <div className="font-black text-slate-700">
                            {formatNumber(
                              item.quantity
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold opacity-70">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black">
            {formatNumber(value)}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">
        {title}
      </p>

      <p className="mt-2 truncate text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
        {icon}
      </div>

      <h3 className="mt-5 font-black text-slate-800">
        {title}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

