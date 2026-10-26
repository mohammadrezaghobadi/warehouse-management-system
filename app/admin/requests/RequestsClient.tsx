'use client';

import React, {
useMemo,
useState,
} from 'react';

import {
FiDownload,
FiPackage,
FiSearch,
FiTrendingDown,
FiTrendingUp,
} from 'react-icons/fi';

interface InventoryReport {
id: number;
productId: number;
productName: string;
productCode: string;
unit: string;
categoryName: string;
minStock: number;
quantity: number;
warehouseName: string;
}

interface IncomingReport {
id: number;
receiptNumber: string;
productName: string;
productCode: string;
unit: string;
quantity: number;
warehouseName: string;
receivedBy: string;
date: string;
}

interface OutgoingReport {
id: number;
issueNumber: string;
productName: string;
productCode: string;
unit: string;
quantity: number;
warehouseName: string;
issuedBy: string;
date: string;
}

interface ReportsClientProps {
inventory: InventoryReport[];
incoming: IncomingReport[];
outgoing: OutgoingReport[];
}

type ReportTab =
| 'inventory'
| 'incoming'
| 'outgoing';

function formatNumber(value: number) {
return new Intl.NumberFormat(
'fa-IR'
).format(value);
}

function formatDate(value: string) {
return new Intl.DateTimeFormat(
'fa-IR',
{
year: 'numeric',
month: '2-digit',
day: '2-digit',
}
).format(new Date(value));
}

export default function ReportsClient({
inventory,
incoming,
outgoing,
}: ReportsClientProps) {
const [activeTab, setActiveTab] =
useState<ReportTab>('inventory');

const [search, setSearch] =
useState('');

const filteredInventory = useMemo(() => {
const value = search
.trim()
.toLowerCase();


if (!value) {
  return inventory;
}

return inventory.filter(
  (item) =>
    item.productName
      .toLowerCase()
      .includes(value) ||
    item.productCode
      .toLowerCase()
      .includes(value) ||
    item.warehouseName
      .toLowerCase()
      .includes(value)
);


}, [inventory, search]);

const filteredIncoming = useMemo(() => {
const value = search
.trim()
.toLowerCase();

if (!value) {
  return incoming;
}

return incoming.filter(
  (item) =>
    item.productName
      .toLowerCase()
      .includes(value) ||
    item.productCode
      .toLowerCase()
      .includes(value) ||
    item.receiptNumber
      .toLowerCase()
      .includes(value) ||
    item.warehouseName
      .toLowerCase()
      .includes(value)
);


}, [incoming, search]);

const filteredOutgoing = useMemo(() => {
const value = search
.trim()
.toLowerCase();


if (!value) {
  return outgoing;
}

return outgoing.filter(
  (item) =>
    item.productName
      .toLowerCase()
      .includes(value) ||
    item.productCode
      .toLowerCase()
      .includes(value) ||
    item.issueNumber
      .toLowerCase()
      .includes(value) ||
    item.warehouseName
      .toLowerCase()
      .includes(value)
);


}, [outgoing, search]);

const totalInventory =
inventory.reduce(
(sum, item) =>
sum + item.quantity,
0
);

const lowStockCount =
inventory.filter(
(item) =>
item.quantity <= item.minStock
).length;

const totalIncoming =
incoming.reduce(
(sum, item) =>
sum + item.quantity,
0
);

const totalOutgoing =
outgoing.reduce(
(sum, item) =>
sum + item.quantity,
0
);

const tabs = [
{
id: 'inventory' as const,
title: 'موجودی فعلی',
icon: FiPackage,
count: inventory.length,
},
{
id: 'incoming' as const,
title: 'ورودی کالا',
icon: FiTrendingUp,
count: incoming.length,
},
{
id: 'outgoing' as const,
title: 'خروجی کالا',
icon: FiTrendingDown,
count: outgoing.length,
},
];

return ( <div
   dir="rtl"
   className="min-h-screen bg-slate-50 p-4 sm:p-6"
 > <div className="mx-auto max-w-7xl">
{/* Header */} <div className="mb-6"> <h1 className="text-2xl font-bold text-slate-900">
گزارش‌ها </h1>

      <p className="mt-1 text-sm text-slate-500">
        گزارش وضعیت موجودی و گردش ورود و خروج کالا
      </p>
    </div>

    {/* Stats */}
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            کل موجودی
          </span>

          <div className="rounded-xl bg-slate-100 p-2">
            <FiPackage className="text-slate-700" />
          </div>
        </div>

        <div className="text-2xl font-bold text-slate-900">
          {formatNumber(totalInventory)}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          مجموع تمام انبارها
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            کالاهای کم‌موجود
          </span>

          <div className="rounded-xl bg-amber-50 p-2">
            <FiPackage className="text-amber-600" />
          </div>
        </div>

        <div className="text-2xl font-bold text-slate-900">
          {formatNumber(lowStockCount)}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          نیازمند بررسی
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            مجموع ورودی
          </span>

          <div className="rounded-xl bg-emerald-50 p-2">
            <FiTrendingUp className="text-emerald-600" />
          </div>
        </div>

        <div className="text-2xl font-bold text-slate-900">
          {formatNumber(totalIncoming)}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          مقدار کالاهای دریافت‌شده
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            مجموع خروجی
          </span>

          <div className="rounded-xl bg-red-50 p-2">
            <FiTrendingDown className="text-red-600" />
          </div>
        </div>

        <div className="text-2xl font-bold text-slate-900">
          {formatNumber(totalOutgoing)}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          مقدار کالاهای تحویل‌شده
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearch('');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
              active
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={17} />

            <span>{tab.title}</span>

            <span
              className={`rounded-lg px-2 py-0.5 text-xs ${
                active
                  ? 'bg-white/15 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {formatNumber(tab.count)}
            </span>
          </button>
        );
      })}
    </div>

    {/* Search */}
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <FiSearch
        size={18}
        className="text-slate-400"
      />

      <input
        value={search}
        onChange={(event) =>
          setSearch(event.target.value)
        }
        placeholder="جستجو بر اساس کالا، کد کالا یا انبار..."
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      />

      {search && (
        <button
          type="button"
          onClick={() => setSearch('')}
          className="text-xs text-slate-400 hover:text-slate-700"
        >
          پاک کردن
        </button>
      )}
    </div>

    {/* Inventory */}
    {activeTab === 'inventory' && (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">
              گزارش موجودی فعلی
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              موجودی فعلی کالاها در انبارها
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {formatNumber(
              filteredInventory.length
            )}{' '}
            مورد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-4 font-medium">
                  کالا
                </th>

                <th className="px-5 py-4 font-medium">
                  دسته‌بندی
                </th>

                <th className="px-5 py-4 font-medium">
                  انبار
                </th>

                <th className="px-5 py-4 font-medium">
                  موجودی
                </th>

                <th className="px-5 py-4 font-medium">
                  حداقل
                </th>

                <th className="px-5 py-4 font-medium">
                  وضعیت
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredInventory.map(
                (item) => {
                  const low =
                    item.quantity <=
                    item.minStock;

                  const empty =
                    item.quantity <= 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {item.productName}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {item.productCode}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.categoryName}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.warehouseName}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatNumber(
                          item.quantity
                        )}{' '}
                        {item.unit}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatNumber(
                          item.minStock
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                            empty
                              ? 'bg-red-50 text-red-600'
                              : low
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {empty
                            ? 'ناموجود'
                            : low
                              ? 'کم‌موجودی'
                              : 'موجود'}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {filteredInventory.length ===
          0 && (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            گزارشی برای نمایش وجود ندارد.
          </div>
        )}
      </div>
    )}

    {/* Incoming */}
    {activeTab === 'incoming' && (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            گزارش ورود کالا
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            کالاهای پذیرفته‌شده از قبض‌های نهایی
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-4 font-medium">
                  قبض
                </th>

                <th className="px-5 py-4 font-medium">
                  کالا
                </th>

                <th className="px-5 py-4 font-medium">
                  مقدار
                </th>

                <th className="px-5 py-4 font-medium">
                  انبار
                </th>

                <th className="px-5 py-4 font-medium">
                  ثبت‌کننده
                </th>

                <th className="px-5 py-4 font-medium">
                  تاریخ
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredIncoming.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {item.receiptNumber}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {item.productName}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {item.productCode}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                      +
                      {formatNumber(
                        item.quantity
                      )}{' '}
                      {item.unit}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.warehouseName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.receivedBy}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(item.date)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {filteredIncoming.length ===
          0 && (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            گزارشی برای نمایش وجود ندارد.
          </div>
        )}
      </div>
    )}

    {/* Outgoing */}
    {activeTab === 'outgoing' && (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            گزارش خروج کالا
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            کالاهای تحویل‌شده از انبار
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-4 font-medium">
                  حواله
                </th>

                <th className="px-5 py-4 font-medium">
                  کالا
                </th>

                <th className="px-5 py-4 font-medium">
                  مقدار
                </th>

                <th className="px-5 py-4 font-medium">
                  انبار
                </th>

                <th className="px-5 py-4 font-medium">
                  تحویل‌دهنده
                </th>

                <th className="px-5 py-4 font-medium">
                  تاریخ
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredOutgoing.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {item.issueNumber}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {item.productName}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {item.productCode}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-red-600">
                      -
                      {formatNumber(
                        item.quantity
                      )}{' '}
                      {item.unit}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.warehouseName}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.issuedBy}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(item.date)}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {filteredOutgoing.length ===
          0 && (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            گزارشی برای نمایش وجود ندارد.
          </div>
        )}
      </div>
    )}
  </div>
</div>


);
}
