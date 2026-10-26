'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Building2,
  FolderTree,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Boxes,
} from 'lucide-react';

import { logout } from '@/app/actions/auth';
import { FiClock } from 'react-icons/fi';

interface AdminSidebarProps {
  user: {
    name: string;
    username: string;
    role: string;
  };
}

const menuItems = [
  {
    title: 'داشبورد',
    href: '/admin',
    icon: LayoutDashboard,
  },
    {
    href: '/admin/transactions',
    label: 'گردش کالا',
    icon: FiClock,
  },
  {
    title: 'درخواست کالا',
    href: '/admin/requests',
    icon: ClipboardList,
  },
  {
    title: 'کالاها',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'موجودی انبار',
    href: '/admin/inventory',
    icon: Boxes,
  },
  {
    title: 'انبارها',
    href: '/admin/warehouses',
    icon: Warehouse,
  },
  {
    title: 'قبض انبار',
    href: '/admin/receipts',
    icon: ArrowDownToLine,
  },
  {
    title: 'حواله انبار',
    href: '/admin/issues',
    icon: ArrowUpFromLine,
  },
  {
    title: 'دسته‌بندی کالا',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: 'کاربران',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'واحدها',
    href: '/admin/departments',
    icon: Building2,
  },
  {
    title: 'گزارش‌ها',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

export default function AdminSidebar({
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-[280px] flex-col border-l border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-[82px] items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Warehouse size={23} />
          </div>

          <div>
            <h1 className="text-lg font-black text-slate-900">
              انبارینو
            </h1>

            <p className="text-[11px] text-slate-400">
              سیستم مدیریت انبار
            </p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="mx-4 mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
            {user.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {user.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-3 px-3 text-[11px] font-bold text-slate-400">
          منوی اصلی
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.4 : 2}
                  />

                  <span>{item.title}</span>
                </div>

                <ChevronLeft
                  size={15}
                  className={`transition ${
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-50'
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 p-4">
        <Link
          href="/admin/settings"
          className="mb-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <Settings size={19} />
          تنظیمات
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            خروج از حساب
          </button>
        </form>
      </div>
    </aside>
  );
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'مدیر سیستم';

    case 'SUPERVISOR':
      return 'سرپرست';

    case 'WAREHOUSE':
      return 'انباردار';

    case 'EMPLOYEE':
      return 'کارمند';

    default:
      return role;
  }
}