
'use client';

import React, {
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  FiArrowRight,
  FiCheck,
  FiClipboard,
  FiPackage,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';

import {
  createGoodsReceipt,
} from '@/app/actions/receipts';

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface ReceiptItem {
  id: string;
  productId: string;
  receivedQuantity: string;
  acceptedQuantity: string;
  rejectedQuantity: string;
  qualityStatus:
    | 'ACCEPTED'
    | 'PARTIAL'
    | 'REJECTED';
  description: string;
}

interface Props {
  products: Product[];
  warehouses: Warehouse[];
}

const createEmptyItem = (): ReceiptItem => ({
  id: crypto.randomUUID(),
  productId: '',
  receivedQuantity: '',
  acceptedQuantity: '',
  rejectedQuantity: '',
  qualityStatus: 'ACCEPTED',
  description: '',
});

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    'fa-IR',
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

export default function ReceiptForm({
  products,
  warehouses,
}: Props) {
  const router = useRouter();

  const [warehouseId, setWarehouseId] =
    useState('');

  const [supplier, setSupplier] =
    useState('');

  const [purchaseNumber, setPurchaseNumber] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [items, setItems] =
    useState<ReceiptItem[]>([
      createEmptyItem(),
    ]);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function addItem() {
    setItems((current) => [
      ...current,
      createEmptyItem(),
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (item) => item.id !== id
      );
    });
  }

  function updateItem(
    id: string,
    field: keyof ReceiptItem,
    value: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function handleReceivedChange(
    id: string,
    value: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          receivedQuantity: value,
          acceptedQuantity:
            value,
          rejectedQuantity:
            '0',
          qualityStatus:
            'ACCEPTED',
        };
      })
    );
  }

  function handleQualityChange(
    id: string,
    status:
      | 'ACCEPTED'
      | 'PARTIAL'
      | 'REJECTED'
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const received =
          Number(
            item.receivedQuantity
          ) || 0;

        if (status === 'ACCEPTED') {
          return {
            ...item,
            qualityStatus: status,
            acceptedQuantity:
              String(received),
            rejectedQuantity: '0',
          };
        }

        if (status === 'REJECTED') {
          return {
            ...item,
            qualityStatus: status,
            acceptedQuantity: '0',
            rejectedQuantity:
              String(received),
          };
        }

        return {
          ...item,
          qualityStatus: status,
          acceptedQuantity:
            item.acceptedQuantity,
          rejectedQuantity:
            item.rejectedQuantity,
        };
      })
    );
  }

  function getTotalAccepted() {
    return items.reduce(
      (sum, item) =>
        sum +
        (Number(
          item.acceptedQuantity
        ) || 0),
      0
    );
  }

  function getTotalRejected() {
    return items.reduce(
      (sum, item) =>
        sum +
        (Number(
          item.rejectedQuantity
        ) || 0),
      0
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!warehouseId) {
      setError(
        'انبار را انتخاب کنید.'
      );
      return;
    }

    if (!items.length) {
      setError(
        'حداقل یک کالا اضافه کنید.'
      );
      return;
    }

    const seenProducts =
      new Set<number>();

    const parsedItems = [];

    for (const item of items) {
      const productId =
        Number(item.productId);

      const receivedQuantity =
        Number(
          item.receivedQuantity
        );

      const acceptedQuantity =
        Number(
          item.acceptedQuantity
        );

      const rejectedQuantity =
        Number(
          item.rejectedQuantity
        );

      if (
        !Number.isInteger(productId) ||
        productId <= 0
      ) {
        setError(
          'برای تمام ردیف‌ها کالا را انتخاب کنید.'
        );
        return;
      }

      if (
        seenProducts.has(productId)
      ) {
        setError(
          'یک کالا را نمی‌توان چند بار در یک قبض اضافه کرد.'
        );
        return;
      }

      seenProducts.add(productId);

      if (
        !Number.isFinite(
          receivedQuantity
        ) ||
        receivedQuantity <= 0
      ) {
        setError(
          'مقدار دریافتی باید بیشتر از صفر باشد.'
        );
        return;
      }

      if (
        !Number.isFinite(
          acceptedQuantity
        ) ||
        acceptedQuantity < 0
      ) {
        setError(
          'مقدار تأییدشده نامعتبر است.'
        );
        return;
      }

      if (
        !Number.isFinite(
          rejectedQuantity
        ) ||
        rejectedQuantity < 0
      ) {
        setError(
          'مقدار مردود نامعتبر است.'
        );
        return;
      }

      if (
        Math.abs(
          receivedQuantity -
            acceptedQuantity -
            rejectedQuantity
        ) > 0.000001
      ) {
        setError(
          'مقدار دریافتی باید برابر مجموع مقدار تأییدشده و مردود باشد.'
        );
        return;
      }

      parsedItems.push({
        productId,
        receivedQuantity,
        acceptedQuantity,
        rejectedQuantity,
        qualityStatus:
          item.qualityStatus,
        description:
          item.description,
      });
    }

    setIsSubmitting(true);

    try {
      const result =
        await createGoodsReceipt({
          warehouseId:
            Number(warehouseId),
          supplier,
          purchaseNumber,
          description,
          items: parsedItems,
        });

      if (!result.success) {
        setError(
          result.error ||
            'ثبت قبض انجام نشد.'
        );
        return;
      }

      setSuccess(
        'قبض انبار با موفقیت به صورت پیش‌نویس ثبت شد.'
      );

      setTimeout(() => {
        router.push('/admin/receipts');
        router.refresh();
      }, 700);
    } catch (error) {
      console.error(
        'Receipt submit error:',
        error
      );

      setError(
        'ثبت قبض با خطا مواجه شد.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <div className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/receipts'
                  )
                }
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <FiArrowRight size={20} />
              </button>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <FiClipboard size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  ثبت قبض انبار
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  ثبت کالاهای دریافتی و کنترل کیفیت
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Basic Info */}
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FiClipboard size={18} />
            </div>

            <div>
              <h2 className="font-black text-slate-900">
                اطلاعات قبض
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                اطلاعات اصلی رسید کالا
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                انبار
              </label>

              <select
                value={warehouseId}
                onChange={(event) =>
                  setWarehouseId(
                    event.target.value
                  )
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              >
                <option value="">
                  انتخاب انبار
                </option>

                {warehouses.map(
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                تأمین‌کننده
                <span className="mr-1 text-xs font-normal text-slate-400">
                  (اختیاری)
                </span>
              </label>

              <input
                value={supplier}
                onChange={(event) =>
                  setSupplier(
                    event.target.value
                  )
                }
                placeholder="نام تأمین‌کننده"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                شماره خرید / فاکتور
                <span className="mr-1 text-xs font-normal text-slate-400">
                  (اختیاری)
                </span>
              </label>

              <input
                value={purchaseNumber}
                onChange={(event) =>
                  setPurchaseNumber(
                    event.target.value
                  )
                }
                placeholder="شماره فاکتور یا خرید"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                توضیحات
                <span className="mr-1 text-xs font-normal text-slate-400">
                  (اختیاری)
                </span>
              </label>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="توضیحات قبض"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>

          </div>
        </section>

        {/* Items */}
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiPackage size={18} />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  اقلام قبض
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  کالاهای دریافت‌شده را اضافه کنید.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <FiPlus size={17} />
              افزودن کالا
            </button>
          </div>

          <div className="space-y-4">

            {items.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500">
                      ردیف{' '}
                      {formatNumber(
                        index + 1
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                      disabled={
                        items.length === 1
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      title="حذف"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        کالا
                      </label>

                      <select
                        value={
                          item.productId
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            'productId',
                            event.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="">
                          انتخاب کالا
                        </option>

                        {products.map(
                          (product) => (
                            <option
                              key={
                                product.id
                              }
                              value={
                                product.id
                              }
                            >
                              {
                                product.name
                              }{' '}
                              —{' '}
                              {
                                product.code
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        مقدار دریافتی
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.receivedQuantity
                        }
                        onChange={(event) =>
                          handleReceivedChange(
                            item.id,
                            event.target
                              .value
                          )
                        }
                        placeholder="0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        وضعیت کیفیت
                      </label>

                      <select
                        value={
                          item.qualityStatus
                        }
                        onChange={(event) =>
                          handleQualityChange(
                            item.id,
                            event.target
                              .value as
                              | 'ACCEPTED'
                              | 'PARTIAL'
                              | 'REJECTED'
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      >
                        <option value="ACCEPTED">
                          تأیید کامل
                        </option>

                        <option value="PARTIAL">
                          تأیید جزئی
                        </option>

                        <option value="REJECTED">
                          مردود
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        مقدار تأییدشده
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.acceptedQuantity
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            'acceptedQuantity',
                            event.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        مقدار مردود
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          item.rejectedQuantity
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            'rejectedQuantity',
                            event.target
                              .value
                          )
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        توضیحات ردیف
                      </label>

                      <input
                        value={
                          item.description
                        }
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            'description',
                            event.target
                              .value
                          )
                        }
                        placeholder="توضیحات مربوط به این کالا"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
                      />
                    </div>

                  </div>
                </div>
              )
            )}

          </div>

        </section>

        {/* Summary */}
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-600">
                مجموع تأییدشده
              </p>

              <p className="mt-2 text-2xl font-black text-emerald-700">
                {formatNumber(
                  getTotalAccepted()
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs font-bold text-rose-600">
                مجموع مردود
              </p>

              <p className="mt-2 text-2xl font-black text-rose-700">
                {formatNumber(
                  getTotalRejected()
                )}
              </p>
            </div>

          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">
              {success}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  '/admin/receipts'
                )
              }
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-slate-100 px-6 text-sm font-bold text-slate-700"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={() => {
                const form =
                  document.querySelector(
                    'form'
                  ) as HTMLFormElement | null;

                form?.requestSubmit();
              }}
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiCheck size={18} />

              {isSubmitting
                ? 'در حال ثبت...'
                : 'ثبت قبض'}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="hidden"
          />
        </section>

      </div>
    </main>
  );
}

