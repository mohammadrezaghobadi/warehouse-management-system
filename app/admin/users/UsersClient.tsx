'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiBriefcase,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';

import {
  createUser,
  toggleUser,
  updateUser,
} from '@/app/actions/users';

interface Department {
  id: number;
  name: string;
}

interface UserRecord {
  id: number;
  name: string;
  username: string;
  role: string;
  active: boolean;
  department: Department | null;
  createdAt: string;
}

interface UsersClientProps {
  initialUsers: UserRecord[];
  initialDepartments: Department[];
}

type UserRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'WAREHOUSE'
  | 'EMPLOYEE';

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

function getRoleStyle(role: string) {
  switch (role) {
    case 'ADMIN':
      return 'bg-violet-50 text-violet-700';

    case 'SUPERVISOR':
      return 'bg-blue-50 text-blue-700';

    case 'WAREHOUSE':
      return 'bg-amber-50 text-amber-700';

    case 'EMPLOYEE':
      return 'bg-slate-100 text-slate-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(
    value
  );
}

export default function UsersClient({
  initialUsers,
  initialDepartments,
}: UsersClientProps) {
  const router = useRouter();

  const [users, setUsers] =
    useState(initialUsers);

  const [search, setSearch] = useState('');

  const [roleFilter, setRoleFilter] =
    useState('ALL');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] =
    useState('');
  const [password, setPassword] =
    useState('');

  const [role, setRole] =
    useState<UserRole>('EMPLOYEE');

  const [departmentId, setDepartmentId] =
    useState<number | null>(null);

  const [active, setActive] =
    useState(true);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name
          .toLowerCase()
          .includes(query) ||
        user.username
          .toLowerCase()
          .includes(query) ||
        user.department?.name
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === 'ALL' ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE'
          ? user.active
          : !user.active);

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const activeUsers = users.filter(
      (user) => user.active
    ).length;

    const inactiveUsers =
      users.length - activeUsers;

    const admins = users.filter(
      (user) => user.role === 'ADMIN'
    ).length;

    return {
      total: users.length,
      active: activeUsers,
      inactive: inactiveUsers,
      admins,
    };
  }, [users]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('EMPLOYEE');
    setDepartmentId(null);
    setActive(true);
    setShowPassword(false);
    setError('');
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  function openEditModal(
    user: UserRecord
  ) {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword('');
    setRole(
      user.role as UserRole
    );
    setDepartmentId(
      user.department?.id ?? null
    );
    setActive(user.active);
    setShowPassword(false);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setModalOpen(false);
    resetForm();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError('');

    const result = editingId
      ? await updateUser(editingId, {
          name,
          username,
          password: password || undefined,
          role,
          departmentId,
          active,
        })
      : await createUser({
          name,
          username,
          password,
          role,
          departmentId,
        });

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ??
          'عملیات با خطا مواجه شد.'
      );
      return;
    }

    setModalOpen(false);
    resetForm();

    router.refresh();
  }

  async function handleToggle(
    user: UserRecord
  ) {
    const action = user.active
      ? 'غیرفعال'
      : 'فعال';

    const confirmed = window.confirm(
      `آیا می‌خواهید کاربر «${user.name}» را ${action} کنید؟`
    );

    if (!confirmed) return;

    const result = await toggleUser(
      user.id
    );

    if (!result.success) {
      window.alert(
        result.error ??
          'تغییر وضعیت کاربر انجام نشد.'
      );
      return;
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              active: !item.active,
            }
          : item
      )
    );

    router.refresh();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <FiUsers size={22} />
              </div>

              <div>
                <h1 className="text-xl font-black text-slate-900 md:text-2xl">
                  کاربران
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  مدیریت کاربران و سطح دسترسی
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.refresh()
                }
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <FiRefreshCw size={17} />
                بروزرسانی
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <FiPlus size={18} />
                کاربر جدید
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              کل کاربران
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatNumber(stats.total)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              کاربران فعال
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-600">
              {formatNumber(stats.active)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              کاربران غیرفعال
            </p>

            <p className="mt-2 text-2xl font-black text-rose-600">
              {formatNumber(stats.inactive)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              مدیر سیستم
            </p>

            <p className="mt-2 text-2xl font-black text-violet-600">
              {formatNumber(stats.admins)}
            </p>
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
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="جستجو بر اساس نام، نام کاربری یا واحد..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">
                همه نقش‌ها
              </option>

              <option value="ADMIN">
                مدیر سیستم
              </option>

              <option value="SUPERVISOR">
                سرپرست
              </option>

              <option value="WAREHOUSE">
                انباردار
              </option>

              <option value="EMPLOYEE">
                کارمند
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">
                همه وضعیت‌ها
              </option>

              <option value="ACTIVE">
                فعال
              </option>

              <option value="INACTIVE">
                غیرفعال
              </option>
            </select>
          </div>
        </section>

        {/* Desktop table */}
        <section className="hidden overflow-hidden rounded-3xl bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    کاربر
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    نقش
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    واحد
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    وضعیت
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(
                  (user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                            <FiUser size={18} />
                          </div>

                          <div>
                            <p className="font-black text-slate-900">
                              {user.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${getRoleStyle(
                            user.role
                          )}`}
                        >
                          <FiShield size={13} />

                          {getRoleLabel(
                            user.role
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiBriefcase
                            size={15}
                          />

                          {user.department
                            ?.name ??
                            'بدون واحد'}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {user.active ? (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                            <FiCheckCircle
                              size={14}
                            />
                            فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                            <FiXCircle
                              size={14}
                            />
                            غیرفعال
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                user
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-900 hover:text-white"
                          >
                            <FiEdit2
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggle(
                                user
                              )
                            }
                            disabled={
                              user.id === 1 &&
                              user.active
                            }
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {user.active
                              ? 'غیرفعال'
                              : 'فعال'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="px-6 py-20 text-center">
              <FiUsers
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-700">
                کاربری پیدا نشد
              </p>
            </div>
          )}
        </section>

        {/* Mobile */}
        <section className="space-y-3 lg:hidden">
          {filteredUsers.map((user) => (
            <article
              key={user.id}
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <FiUser size={18} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-black text-slate-900">
                      {user.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {user.active ? (
                  <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    فعال
                  </span>
                ) : (
                  <span className="shrink-0 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    غیرفعال
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    نقش
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {getRoleLabel(
                      user.role
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    واحد
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-slate-800">
                    {user.department
                      ?.name ??
                      'بدون واحد'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openEditModal(user)
                  }
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700"
                >
                  <FiEdit2 size={14} />
                  ویرایش
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleToggle(user)
                  }
                  disabled={
                    user.id === 1 &&
                    user.active
                  }
                  className="flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 disabled:opacity-40"
                >
                  {user.active
                    ? 'غیرفعال کردن'
                    : 'فعال کردن'}
                </button>
              </div>
            </article>
          ))}

          {filteredUsers.length === 0 && (
            <div className="rounded-3xl bg-white px-6 py-20 text-center shadow-sm">
              <FiUsers
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-700">
                کاربری پیدا نشد
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-black text-slate-900">
                  {editingId
                    ? 'ویرایش کاربر'
                    : 'ثبت کاربر جدید'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  اطلاعات کاربر و سطح دسترسی را مشخص کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <FiX size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    نام و نام خانوادگی
                  </span>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                    placeholder="مثلاً علی رضایی"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    نام کاربری
                  </span>

                  <input
                    value={username}
                    onChange={(event) =>
                      setUsername(
                        event.target.value
                      )
                    }
                    placeholder="username"
                    dir="ltr"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm outline-none focus:border-slate-400 focus:bg-white"
                  />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  {editingId
                    ? 'رمز عبور جدید (اختیاری)'
                    : 'رمز عبور'}
                </span>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder={
                      editingId
                        ? 'در صورت نیاز وارد کنید'
                        : 'حداقل ۶ کاراکتر'
                    }
                    dir="ltr"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 text-left text-sm outline-none focus:border-slate-400 focus:bg-white"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? (
                      <FiEyeOff size={18} />
                    ) : (
                      <FiEye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    نقش
                  </span>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target
                          .value as UserRole
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="EMPLOYEE">
                      کارمند
                    </option>

                    <option value="WAREHOUSE">
                      انباردار
                    </option>

                    <option value="SUPERVISOR">
                      سرپرست
                    </option>

                    <option value="ADMIN">
                      مدیر سیستم
                    </option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    واحد
                  </span>

                  <select
                    value={
                      departmentId ?? ''
                    }
                    onChange={(event) =>
                      setDepartmentId(
                        event.target.value
                          ? Number(
                              event.target.value
                            )
                          : null
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">
                      بدون واحد
                    </option>

                    {initialDepartments.map(
                      (department) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {department.name}
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              {editingId && (
                <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      وضعیت کاربر
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      کاربر غیرفعال امکان ورود ندارد.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) =>
                      setActive(
                        event.target.checked
                      )
                    }
                    className="h-5 w-5 accent-slate-900"
                  />
                </label>
              )}

              {error && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="h-12 flex-1 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 flex-1 rounded-2xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'در حال ذخیره...'
                    : editingId
                      ? 'ذخیره تغییرات'
                      : 'ثبت کاربر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}