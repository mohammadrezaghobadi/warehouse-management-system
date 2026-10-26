'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiBriefcase,
  FiFileText,
} from 'react-icons/fi';

import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from '@/app/actions/departments';

interface DepartmentRecord {
  id: number;
  name: string;
  userCount: number;
  requestCount: number;
  createdAt: string;
}

interface DepartmentsClientProps {
  initialDepartments: DepartmentRecord[];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

export default function DepartmentsClient({
  initialDepartments,
}: DepartmentsClientProps) {
  const router = useRouter();

  const [departments, setDepartments] = useState(
    initialDepartments
  );

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const filteredDepartments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return departments;
    }

    return departments.filter((department) =>
      department.name
        .toLowerCase()
        .includes(query)
    );
  }, [departments, search]);

  const totalUsers = useMemo(
    () =>
      departments.reduce(
        (sum, department) =>
          sum + department.userCount,
        0
      ),
    [departments]
  );

  const totalRequests = useMemo(
    () =>
      departments.reduce(
        (sum, department) =>
          sum + department.requestCount,
        0
      ),
    [departments]
  );

  function openCreateModal() {
    setEditingId(null);
    setName('');
    setError('');
    setModalOpen(true);
  }

  function openEditModal(
    department: DepartmentRecord
  ) {
    setEditingId(department.id);
    setName(department.name);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setModalOpen(false);
    setEditingId(null);
    setName('');
    setError('');
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError('نام واحد را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');

    const result = editingId
      ? await updateDepartment(
          editingId,
          { name }
        )
      : await createDepartment({
          name,
        });

    setLoading(false);

    if (!result.success) {
      setError(
        result.error ??
          'عملیات با خطا مواجه شد.'
      );
      return;
    }

    closeModal();

    router.refresh();

    setDepartments((current) => {
      if (editingId) {
        return current.map((department) =>
          department.id === editingId
            ? {
                ...department,
                name: name.trim(),
              }
            : department
        );
      }

      return current;
    });
  }

  async function handleDelete(
    department: DepartmentRecord
  ) {
    const confirmed = window.confirm(
      `آیا از حذف واحد «${department.name}» مطمئن هستید؟`
    );

    if (!confirmed) return;

    const result = await deleteDepartment(
      department.id
    );

    if (!result.success) {
      window.alert(
        result.error ??
          'حذف واحد انجام نشد.'
      );
      return;
    }

    setDepartments((current) =>
      current.filter(
        (item) =>
          item.id !== department.id
      )
    );

    router.refresh();
  }

  function refreshPage() {
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
                <FiBriefcase size={22} />
              </div>

              <div>
                <h1 className="text-xl font-black text-slate-900 md:text-2xl">
                  واحدها
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  مدیریت واحدهای سازمانی
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={refreshPage}
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

                واحد جدید
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              تعداد واحدها
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatNumber(
                departments.length
              )}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              کاربران
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatNumber(totalUsers)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              درخواست‌ها
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatNumber(totalRequests)}
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
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
              placeholder="جستجوی واحد..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-right">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    نام واحد
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    کاربران
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    درخواست‌ها
                  </th>

                  <th className="px-6 py-4 text-xs font-black text-slate-500">
                    عملیات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map(
                  (department) => (
                    <tr
                      key={department.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <FiBriefcase size={18} />
                          </div>

                          <span className="font-bold text-slate-900">
                            {department.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiUsers size={16} />

                          {formatNumber(
                            department.userCount
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <FiFileText size={16} />

                          {formatNumber(
                            department.requestCount
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                department
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-900 hover:text-white"
                          >
                            <FiEdit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                department
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 p-4 md:hidden">
            {filteredDepartments.map(
              (department) => (
                <article
                  key={department.id}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <FiBriefcase size={17} />
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900">
                          {department.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatNumber(
                            department.userCount
                          )}{' '}
                          کاربر
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            department
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                      >
                        <FiEdit2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            department
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        کاربران
                      </p>

                      <p className="mt-1 font-black text-slate-800">
                        {formatNumber(
                          department.userCount
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        درخواست‌ها
                      </p>

                      <p className="mt-1 font-black text-slate-800">
                        {formatNumber(
                          department.requestCount
                        )}
                      </p>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>

          {filteredDepartments.length === 0 && (
            <div className="px-6 py-20 text-center">
              <FiBriefcase
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-700">
                واحدی پیدا نشد
              </p>

              <p className="mt-2 text-sm text-slate-400">
                هنوز واحدی ثبت نشده یا جستجو نتیجه‌ای
                نداشته است.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="font-black text-slate-900">
                  {editingId
                    ? 'ویرایش واحد'
                    : 'ثبت واحد جدید'}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  اطلاعات واحد را وارد کنید.
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
              className="p-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  نام واحد
                </span>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="مثلاً واحد مالی"
                  autoFocus
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </label>

              {error && (
                <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-3">
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
                    ? 'در حال ثبت...'
                    : editingId
                      ? 'ذخیره تغییرات'
                      : 'ثبت واحد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}