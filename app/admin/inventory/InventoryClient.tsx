'use client';

import React, { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  FiAlertTriangle,
  FiArchive,
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiXCircle,
} from 'react-icons/fi';

interface InventoryProduct {
  id: number;
  code: string;
  name: string;
  unit: string;
  minStock: number;
  maxStock: number | null;
  active: boolean;

  category: {
    id: number;
    name: string;
  } | null;
}

interface InventoryWarehouse {
  id: number;
  name: string;
  location: string | null;
  active: boolean;
}

interface InventoryItem {
  id: number;
  product: InventoryProduct;
  warehouse: InventoryWarehouse;
  quantity: number;
}

interface WarehouseOption {
  id: number;
  name: string;
}

interface InventoryClientProps {
  initialInventory: InventoryItem[];
  initialWarehouses: WarehouseOption[];
}

type StockFilter =
  | 'ALL'
  | 'AVAILABLE'
  | 'LOW'
  | 'OUT';

export default function InventoryClient({
  initialInventory,
  initialWarehouses,
}: InventoryClientProps) {
  const router = useRouter();

  const [inventory, setInventory] =
    useState(initialInventory);

  const [search, setSearch] =
    useState('');

  const [warehouseFilter, setWarehouseFilter] =
    useState<string>('ALL');

  const [stockFilter, setStockFilter] =
    useState<StockFilter>('ALL');

  const [expandedProduct, setExpandedProduct] =
    useState<number | null>(null);

  const stats = useMemo(() => {
    const totalQuantity = inventory.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const uniqueProducts = new Set(
      inventory.map(
        (item) => item.product.id
      )
    ).size;

    const lowStock = inventory.filter(
      (item) =>
        item.quantity > 0 &&
        item.quantity <= item.product.minStock
    ).length;

    const outOfStock = inventory.filter(
      (item) => item.quantity <= 0
    ).length;

    return {
      totalQuantity,
      uniqueProducts,
      lowStock,
      outOfStock,
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return inventory.filter((item) => {
      const matchesWarehouse =
        warehouseFilter === 'ALL' ||
        String(item.warehouse.id) ===
          warehouseFilter;

      let matchesStock = true;

      if (stockFilter === 'AVAILABLE') {
        matchesStock = item.quantity > 0;
      }

      if (stockFilter === 'LOW') {
        matchesStock =
          item.quantity > 0 &&
          item.quantity <= item.product.minStock;
      }

      if (stockFilter === 'OUT') {
        matchesStock =
          item.quantity <= 0;
      }

      if (!matchesWarehouse || !matchesStock) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        item.product.name,
        item.product.code,
        item.product.category?.name ?? '',
        item.warehouse.name,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    inventory,
    search,
    warehouseFilter,
    stockFilter,
  ]);

  const groupedProducts = useMemo(() => {
    const map = new Map<
      number,
      {
        product: InventoryProduct;
        warehouses: InventoryItem[];
        totalQuantity: number;
      }
    >();

    for (const item of filteredInventory) {
      const existing = map.get(
        item.product.id
      );

      if (existing) {
        existing.warehouses.push(item);
        existing.totalQuantity += item.quantity;
      } else {
        map.set(item.product.id, {
          product: item.product,
          warehouses: [item],
          totalQuantity: item.quantity,
        });
      }
    }

    return Array.from(map.values());
  }, [filteredInventory]);

  function formatNumber(value: number) {
    return new Intl.NumberFormat('fa-IR', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function getStockState(
    quantity: number,
    minStock: number
  ) {
    if (quantity <= 0) {
      return {
        label: 'ناموجود',
        className:
          'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        icon: <FiXCircle size={15} />,
      };
    }

    if (quantity <= minStock) {
      return {
        label: 'کم‌موجودی',
        className:
          'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        icon: (
          <FiAlertTriangle size={15} />
        ),
      };
    }

    return {
      label: 'موجود',
      className:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
      icon: (
        <FiCheckCircle size={15} />
      ),
    };
  }

  function toggleProduct(productId: number) {
    setExpandedProduct((current) =>
      current === productId
        ? null
        : productId
    );
  }

  function refreshPage() {
    router.refresh();
    setInventory(initialInventory);
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
            <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <FiArchive size={27} />
                </div>

                <div>
                  <h1 className="text-2xl font-black text-slate-900 md:text-3xl">
                    موجودی انبار
                  </h1>

                  <p className="mt-1 text-sm text-slate-500 md:text-base">
                    مشاهده موجودی واقعی کالاها به تفکیک انبار
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshPage}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-600"
              >
                <FiRefreshCw size={18} />
                بروزرسانی موجودی
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مجموع موجودی
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {formatNumber(
                    stats.totalQuantity
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiPackage size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کالاهای موجود
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-600">
                  {formatNumber(
                    stats.uniqueProducts
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <FiBox size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  کم‌موجودی
                </p>

                <p className="mt-2 text-3xl font-black text-amber-600">
                  {formatNumber(
                    stats.lowStock
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <FiAlertTriangle size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  ناموجود
                </p>

                <p className="mt-2 text-3xl font-black text-rose-600">
                  {formatNumber(
                    stats.outOfStock
                  )}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FiXCircle size={22} />
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">

            {/* Search */}
            <div className="relative">
              <FiSearch
                size={19}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="جستجوی نام کالا، کد کالا یا انبار..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Warehouse */}
            <select
              value={warehouseFilter}
              onChange={(event) =>
                setWarehouseFilter(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">
                همه انبارها
              </option>

              {initialWarehouses.map(
                (warehouse) => (
                  <option
                    key={warehouse.id}
                    value={warehouse.id}
                  >
                    {warehouse.name}
                  </option>
                )
              )}
            </select>

            {/* Stock filter */}
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(
                  event.target.value as StockFilter
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="ALL">
                همه وضعیت‌ها
              </option>

              <option value="AVAILABLE">
                موجود
              </option>

              <option value="LOW">
                کم‌موجودی
              </option>

              <option value="OUT">
                ناموجود
              </option>
            </select>
          </div>
        </section>

        {/* Results */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    کالا
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    دسته‌بندی
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    انبار
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    موجودی
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    حداقل
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    حداکثر
                  </th>

                  <th className="px-6 py-5 text-right text-xs font-black text-slate-500">
                    وضعیت
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-20 text-center"
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <FiPackage size={28} />
                        </div>

                        <p className="mt-4 font-black text-slate-700">
                          موجودی پیدا نشد
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          با تغییر فیلترها دوباره جستجو کنید.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(
                    (item) => {
                      const stock =
                        getStockState(
                          item.quantity,
                          item.product
                            .minStock
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FiBox
                                  size={20}
                                />
                              </div>

                              <div>
                                <p className="font-black text-slate-900">
                                  {
                                    item.product
                                      .name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  کد:{' '}
                                  {
                                    item.product
                                      .code
                                  }
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            {item.product
                              .category ? (
                              <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                {
                                  item
                                    .product
                                    .category
                                    .name
                                }
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                بدون دسته‌بندی
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-700">
                              {
                                item
                                  .warehouse
                                  .name
                              }
                            </p>

                            {item.warehouse
                              .location && (
                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  item
                                    .warehouse
                                    .location
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-slate-900">
                                {formatNumber(
                                  item.quantity
                                )}
                              </span>

                              <span className="text-xs text-slate-400">
                                {
                                  item.product
                                    .unit
                                }
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-sm font-bold text-slate-600">
                            {formatNumber(
                              item.product
                                .minStock
                            )}
                          </td>

                          <td className="px-6 py-5 text-sm font-bold text-slate-600">
                            {item.product
                              .maxStock !==
                            null
                              ? formatNumber(
                                  item.product
                                    .maxStock
                                )
                              : '---'}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${stock.className}`}
                            >
                              {stock.icon}
                              {stock.label}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {groupedProducts.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <FiPackage size={28} />
                </div>

                <p className="mt-4 font-black text-slate-700">
                  موجودی پیدا نشد
                </p>
              </div>
            ) : (
              groupedProducts.map(
                (group) => {
                  const isExpanded =
                    expandedProduct ===
                    group.product.id;

                  const stock =
                    getStockState(
                      group.totalQuantity,
                      group.product
                        .minStock
                    );

                  return (
                    <div
                      key={group.product.id}
                      className="p-5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleProduct(
                            group.product.id
                          )
                        }
                        className="w-full text-right"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                              <FiBox
                                size={21}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-slate-900">
                                {
                                  group
                                    .product
                                    .name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                کد:{' '}
                                {
                                  group
                                    .product
                                    .code
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-black ${stock.className}`}
                            >
                              {stock.icon}
                              {stock.label}
                            </span>

                            {isExpanded ? (
                              <FiChevronUp className="text-slate-400" />
                            ) : (
                              <FiChevronDown className="text-slate-400" />
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              مجموع موجودی
                            </p>

                            <p className="mt-1 text-lg font-black text-slate-900">
                              {formatNumber(
                                group.totalQuantity
                              )}{' '}
                              <span className="text-xs font-bold text-slate-400">
                                {
                                  group
                                    .product
                                    .unit
                                }
                              </span>
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">
                              حداقل موجودی
                            </p>

                            <p className="mt-1 text-lg font-black text-slate-900">
                              {formatNumber(
                                group
                                  .product
                                  .minStock
                              )}
                            </p>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-slate-800">
                              موجودی به تفکیک انبار
                            </p>

                            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                              {
                                group
                                  .warehouses
                                  .length
                              }{' '}
                              انبار
                            </span>
                          </div>

                          {group.warehouses.map(
                            (item) => {
                              const itemStock =
                                getStockState(
                                  item.quantity,
                                  item
                                    .product
                                    .minStock
                                );

                              return (
                                <div
                                  key={item.id}
                                  className="rounded-2xl border border-slate-200 p-4"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-black text-slate-800">
                                        {
                                          item
                                            .warehouse
                                            .name
                                        }
                                      </p>

                                      {item
                                        .warehouse
                                        .location && (
                                        <p className="mt-1 text-xs text-slate-400">
                                          {
                                            item
                                              .warehouse
                                              .location
                                          }
                                        </p>
                                      )}
                                    </div>

                                    <div className="text-left">
                                      <p className="text-lg font-black text-slate-900">
                                        {formatNumber(
                                          item.quantity
                                        )}
                                      </p>

                                      <p className="text-[11px] text-slate-400">
                                        {
                                          item
                                            .product
                                            .unit
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${itemStock.className}`}
                                    >
                                      {
                                        itemStock.icon
                                      }
                                      {
                                        itemStock.label
                                      }
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                نمایش{' '}
                <span className="font-black text-slate-800">
                  {formatNumber(
                    filteredInventory.length
                  )}
                </span>{' '}
                رکورد موجودی
              </p>

              <p>
                مجموع{' '}
                <span className="font-black text-slate-800">
                  {formatNumber(
                    filteredInventory.reduce(
                      (sum, item) =>
                        sum + item.quantity,
                      0
                    )
                  )}
                </span>{' '}
                واحد
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}