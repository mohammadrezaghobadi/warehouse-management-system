
import {
  cookies,
} from 'next/headers';

import {
  ClipboardList,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  TrendingUp,
  Boxes,
  Activity,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

import { prisma } from '@/lib/prisma';

import AdminSidebar from './components/AdminSidebar';

export default async function AdminDashboard() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    redirect('/login');
  }

  const session =
    await verifySession(token);

  if (!session) {
    redirect('/login');
  }

  /*
   * دریافت اطلاعات داشبورد
   */
  const [
    requestsCount,
    inventoryCount,
    receiptsCount,
    issuesCount,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    deliveredRequests,
    lowStockItems,
    recentTransactions,
    activeProducts,
    activeWarehouses,
  ] = await Promise.all([
    prisma.request.count(),

    prisma.inventory.count({
      where: {
        quantity: {
          gt: 0,
        },
      },
    }),

    prisma.goodsReceipt.count({
      where: {
        status: 'FINAL',
      },
    }),

    prisma.warehouseIssue.count({
      where: {
        status: 'FINAL',
      },
    }),

    prisma.request.count({
      where: {
        status: 'PENDING',
      },
    }),

    prisma.request.count({
      where: {
        status: 'APPROVED',
      },
    }),

    prisma.request.count({
      where: {
        status: 'REJECTED',
      },
    }),

    prisma.request.count({
      where: {
        status: 'DELIVERED',
      },
    }),

    prisma.inventory.findMany({
      where: {
        quantity: {
          lte: 0,
        },
        product: {
          active: true,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    }),

    prisma.inventoryTransaction.findMany({
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    }),

    prisma.product.count({
      where: {
        active: true,
      },
    }),

    prisma.warehouse.count({
      where: {
        active: true,
      },
    }),
  ]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f6f7f9]"
    >
      <AdminSidebar user={session} />

      <main className="mr-[280px] min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-[82px] items-center justify-between px-8">
            <div>
              <h1 className="text-xl font-black text-slate-900">
                داشبورد
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                نمای کلی وضعیت سیستم انبار
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {session.name}
                </p>

                <p className="text-xs text-slate-400">
                  {session.username}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
                {session.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Welcome */}
          <section className="relative overflow-hidden rounded-3xl bg-slate-900 p-7 text-white shadow-sm">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-2 text-sm text-slate-400">
                خوش آمدید 👋
              </p>

              <h2 className="text-2xl font-black">
                {session.name}، به سیستم مدیریت انبار خوش آمدید.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                از این بخش می‌توانید درخواست‌ها، موجودی کالا،
                ورود و خروج کالا و گزارش‌های سیستم را مدیریت کنید.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/requests/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  <Plus size={17} />
                  ثبت درخواست کالا
                </Link>

                <Link
                  href="/admin/inventory"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  مشاهده موجودی
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </div>

            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/[0.03]" />

            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-white/[0.03]" />
          </section>

          {/* Stats */}
          <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="درخواست‌های ثبت شده"
              value={requestsCount.toLocaleString('fa-IR')}
              description="کل درخواست‌ها"
              icon={ClipboardList}
              href="/admin/requests"
            />

            <StatCard
              title="موجودی کالا"
              value={inventoryCount.toLocaleString('fa-IR')}
              description={`${activeProducts.toLocaleString('fa-IR')} قلم کالای فعال`}
              icon={Boxes}
              href="/admin/inventory"
            />

            <StatCard
              title="قبض‌های انبار"
              value={receiptsCount.toLocaleString('fa-IR')}
              description="قبض نهایی ثبت شده"
              icon={ArrowDownToLine}
              href="/admin/receipts"
            />

            <StatCard
              title="حواله‌های انبار"
              value={issuesCount.toLocaleString('fa-IR')}
              description="حواله نهایی ثبت شده"
              icon={ArrowUpFromLine}
              href="/admin/issues"
            />
          </section>

          {/* Request Status + Alerts */}
          <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
            {/* Requests */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900">
                    وضعیت درخواست‌ها
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    آخرین وضعیت درخواست‌های کالا
                  </p>
                </div>

                <Link
                  href="/admin/requests"
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-900"
                >
                  مشاهده همه
                  <ArrowLeft size={14} />
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <StatusCard
                  title="در انتظار بررسی"
                  value={pendingRequests.toLocaleString('fa-IR')}
                  icon={Clock3}
                />

                <StatusCard
                  title="تأیید شده"
                  value={approvedRequests.toLocaleString('fa-IR')}
                  icon={CheckCircle2}
                />

                <StatusCard
                  title="رد شده"
                  value={rejectedRequests.toLocaleString('fa-IR')}
                  icon={XCircle}
                />

                <StatusCard
                  title="تحویل داده شده"
                  value={deliveredRequests.toLocaleString('fa-IR')}
                  icon={TrendingUp}
                />
              </div>
            </div>

            {/* Alerts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div>
                <h3 className="font-black text-slate-900">
                  هشدارهای سیستم
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  مواردی که نیاز به توجه دارند
                </p>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="mt-6 flex min-h-[210px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <CheckCircle2
                      size={25}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-700">
                    موجودی کالاها مناسب است
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    در حال حاضر کالایی با موجودی صفر وجود ندارد.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {lowStockItems.map((item) => (
                    <Link
                      key={item.id}
                      href="/admin/inventory"
                      className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-slate-200 hover:bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                          <AlertTriangle size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {item.warehouse.name}
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-500">
                          موجودی
                        </p>

                        <p className="mt-1 text-sm font-black text-slate-900">
                          {item.quantity.toLocaleString('fa-IR')}
                        </p>
                      </div>
                    </Link>
                  ))}

                  <Link
                    href="/admin/inventory"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    مشاهده موجودی
                    <ArrowLeft size={14} />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Overview */}
          <section className="mt-7 grid gap-6 lg:grid-cols-2">
            {/* System Overview */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900">
                    نمای کلی سیستم
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    اطلاعات کلی بخش‌های سیستم
                  </p>
                </div>

                <Activity
                  size={20}
                  className="text-slate-400"
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <OverviewItem
                  title="کالاهای فعال"
                  value={activeProducts}
                  icon={Package}
                  href="/admin/products"
                />

                <OverviewItem
                  title="انبارهای فعال"
                  value={activeWarehouses}
                  icon={WarehouseIcon}
                  href="/admin/warehouses"
                />

                <OverviewItem
                  title="درخواست‌های باز"
                  value={pendingRequests + approvedRequests}
                  icon={ClipboardList}
                  href="/admin/requests"
                />

                <OverviewItem
                  title="کالاهای کم‌موجودی"
                  value={lowStockItems.length}
                  icon={AlertTriangle}
                  href="/admin/inventory"
                />
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900">
                    آخرین گردش کالا
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    آخرین ورود و خروج‌های ثبت شده
                  </p>
                </div>

                <Link
                  href="/admin/transactions"
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-900"
                >
                  مشاهده همه
                  <ArrowLeft size={14} />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="mt-6 flex min-h-[180px] flex-col items-center justify-center text-center">
                  <Activity
                    size={28}
                    className="text-slate-300"
                  />

                  <p className="mt-3 text-sm font-bold text-slate-600">
                    هنوز گردش کالایی ثبت نشده است
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-2">
                  {recentTransactions.map((transaction) => {
                    const isIncoming =
                      transaction.type === 'IN';

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                            {isIncoming ? (
                              <ArrowDownToLine size={16} />
                            ) : (
                              <ArrowUpFromLine size={16} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {transaction.product.name}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-slate-400">
                              {isIncoming
                                ? 'ورود کالا'
                                : 'خروج کالا'}
                              {' • '}
                              {transaction.warehouse.name}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-left">
                          <p className="text-xs font-black text-slate-800">
                            {transaction.quantity.toLocaleString('fa-IR')}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-7">
            <div className="mb-4">
              <h3 className="font-black text-slate-900">
                دسترسی سریع
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                عملیات پرکاربرد سیستم
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <QuickAction
                title="ثبت درخواست کالا"
                description="ایجاد درخواست جدید"
                href="/admin/requests/new"
                icon={ClipboardList}
              />

              <QuickAction
                title="ثبت قبض انبار"
                description="ثبت ورود کالا"
                href="/admin/receipts/new"
                icon={ArrowDownToLine}
              />

              <QuickAction
                title="ثبت حواله انبار"
                description="ثبت خروج کالا"
                href="/admin/issues"
                icon={ArrowUpFromLine}
              />

              <QuickAction
                title="مدیریت کالاها"
                description="مشاهده و مدیریت کالا"
                href="/admin/products"
                icon={Package}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
          <Icon size={20} />
        </div>
      </div>
    </Link>
  );
}

function StatusCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
          <Icon size={18} />
        </div>

        <span className="text-sm font-medium text-slate-600">
          {title}
        </span>
      </div>

      <span className="text-xl font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

function OverviewItem({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
          <Icon size={18} />
        </div>

        <span className="text-xs font-bold text-slate-600">
          {title}
        </span>
      </div>

      <span className="text-lg font-black text-slate-900">
        {value.toLocaleString('fa-IR')}
      </span>
    </Link>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
          <Icon size={20} />
        </div>

        <ArrowLeft
          size={16}
          className="text-slate-300 transition group-hover:-translate-x-1 group-hover:text-slate-700"
        />
      </div>

      <h4 className="mt-5 text-sm font-black text-slate-900">
        {title}
      </h4>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    'fa-IR',
    {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

