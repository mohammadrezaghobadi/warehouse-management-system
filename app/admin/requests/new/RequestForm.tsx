
'use client';

import {
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  FiArrowRight,
  FiCheck,
  FiFileText,
  FiMinus,
  FiPackage,
  FiPlus,
  FiTrash2,
} from 'react-icons/fi';

import {
  createRequest,
} from '@/app/actions/requests';

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface Department {
  id: number;
  name: string;
}

interface RequestFormProps {
  products: Product[];
  departments: Department[];
}

interface RequestItem {
  key: string;
  productId: string;
  quantity: string;
}

export default function RequestForm({
  products,
  departments,
}: RequestFormProps) {
  const router = useRouter();

  const [
    departmentId,
    setDepartmentId,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    items,
    setItems,
  ] = useState<RequestItem[]>([
    {
      key: crypto.randomUUID(),
      productId: '',
      quantity: '1',
    },
  ]);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  function addItem() {
    setItems((current) => [
      ...current,
      {
        key: crypto.randomUUID(),
        productId: '',
        quantity: '1',
      },
    ]);
  }

  function removeItem(
    key: string
  ) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (item) => item.key !== key
      );
    });
  }

  function updateItem(
    key: string,
    field:
      | 'productId'
      | 'quantity',
    value: string
  ) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function increaseQuantity(
    key: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const currentValue =
          Number(item.quantity) || 0;

        return {
          ...item,
          quantity: String(
            currentValue + 1
          ),
        };
      })
    );
  }

  function decreaseQuantity(
    key: string
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const currentValue =
          Number(item.quantity) || 1;

        return {
          ...item,
          quantity: String(
            Math.max(
              1,
              currentValue - 1
            )
          ),
        };
      })
    );
  }

  function resetForm() {
    setDepartmentId('');

    setDescription('');

    setItems([
      {
        key: crypto.randomUUID(),
        productId: '',
        quantity: '1',
      },
    ]);

    setError('');
    setSuccess('');
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError('');
    setSuccess('');

    if (!departmentId) {
      setError(
        'لطفاً واحد سازمانی را انتخاب کنید.'
      );

      return;
    }

    const preparedItems =
      items.map((item) => ({
        productId:
          Number(item.productId),

        requestedQuantity:
          Number(item.quantity),
      }));

    if (
      preparedItems.some(
        (item) =>
          !Number.isInteger(
            item.productId
          ) ||
          item.productId <= 0
      )
    ) {
      setError(
        'لطفاً برای تمام ردیف‌ها کالا انتخاب کنید.'
      );

      return;
    }

    if (
      preparedItems.some(
        (item) =>
          !Number.isFinite(
            item.requestedQuantity
          ) ||
          item.requestedQuantity <= 0
      )
    ) {
      setError(
        'مقدار کالا باید بیشتر از صفر باشد.'
      );

      return;
    }

    const productIds =
      preparedItems.map(
        (item) => item.productId
      );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      setError(
        'یک کالا را نمی‌توانید چند بار در یک درخواست اضافه کنید.'
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const result =
        await createRequest({
          departmentId:
            Number(departmentId),

          description,

          items: preparedItems,
        });

      if (!result.success) {
        setError(
          result.error ||
            'ثبت درخواست انجام نشد.'
        );

        return;
      }

      setSuccess(
        `درخواست با موفقیت ثبت شد. شماره درخواست: ${result.requestId}`
      );

      resetForm();

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        'در ارتباط با سرور خطایی رخ داد.'
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
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-700 p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <FiFileText size={27} />
                </div>

                <div>
                  <h1 className="text-xl font-bold md:text-2xl">
                    ثبت درخواست کالا
                  </h1>

                  <p className="mt-1 text-sm text-slate-300">
                    درخواست کالا برای واحد سازمانی
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/admin/requests'
                  )
                }
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15"
              >
                <FiArrowRight size={17} />
                بازگشت به درخواست‌ها
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            <FiCheck size={19} />
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiFileText size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  اطلاعات درخواست
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  اطلاعات پایه درخواست را وارد کنید
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  واحد درخواست‌کننده
                  <span className="mr-1 text-rose-500">
                    *
                  </span>
                </label>

                <select
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(
                      event.target.value
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">
                    انتخاب واحد
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={
                          department.id
                        }
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  توضیحات درخواست
                </label>

                <input
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="مثلاً نیاز فوری برای واحد..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 md:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FiPackage size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      اقلام درخواست
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      کالاهای موردنیاز و مقدار آن‌ها را مشخص کنید
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <FiPlus size={18} />
                  افزودن کالا
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 md:p-7">
              {items.map(
                (item, index) => {
                  const selectedProduct =
                    products.find(
                      (product) =>
                        product.id ===
                        Number(
                          item.productId
                        )
                    );

                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-600 shadow-sm">
                            {index + 1}
                          </span>

                          <span className="text-sm font-bold text-slate-700">
                            کالای {index + 1}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={
                            items.length ===
                            1
                          }
                          onClick={() =>
                            removeItem(
                              item.key
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <FiTrash2
                            size={17}
                          />
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            کالا
                          </label>

                          <select
                            value={
                              item.productId
                            }
                            onChange={(
                              event
                            ) =>
                              updateItem(
                                item.key,
                                'productId',
                                event.target
                                  .value
                              )
                            }
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                          >
                            <option value="">
                              انتخاب کالا
                            </option>

                            {products.map(
                              (
                                product
                              ) => (
                                <option
                                  key={
                                    product.id
                                  }
                                  value={
                                    product.id
                                  }
                                >
                                  {product.name}
                                  {' — '}
                                  {product.code}
                                </option>
                              )
                            )}
                          </select>

                          {selectedProduct && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <span>
                                کد:
                                {' '}
                                {
                                  selectedProduct.code
                                }
                              </span>

                              <span className="text-slate-300">
                                |
                              </span>

                              <span>
                                واحد:
                                {' '}
                                {
                                  selectedProduct.unit
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold text-slate-600">
                            مقدار درخواست
                          </label>

                          <div className="flex h-12 overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(
                                  item.key
                                )
                              }
                              className="flex w-12 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiMinus
                                size={16}
                              />
                            </button>

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                item.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                updateItem(
                                  item.key,
                                  'quantity',
                                  event.target
                                    .value
                                )
                              }
                              className="min-w-0 flex-1 bg-white px-3 text-center text-sm font-semibold text-slate-800 outline-none"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(
                                  item.key
                                )
                              }
                              className="flex w-12 items-center justify-center border-r border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              <FiPlus
                                size={16}
                              />
                            </button>
                          </div>

                          {selectedProduct && (
                            <p className="mt-2 text-xs text-slate-500">
                              واحد:
                              {' '}
                              {
                                selectedProduct.unit
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              <button
                type="button"
                onClick={addItem}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-semibold text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FiPlus size={18} />
                افزودن کالای دیگر
              </button>
            </div>
          </section>

          {/* Footer */}
          <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  آماده ثبت درخواست هستید؟
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  درخواست پس از ثبت برای بررسی و تأیید ارسال می‌شود.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/admin/requests'
                    )
                  }
                  className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <FiCheck size={18} />
                      ثبت درخواست
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

