'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/actions/auth';

const initialState: LoginState = {
  success: false,
};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    login,
    initialState
  );

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
              ان
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              سیستم مدیریت انبار
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              ورود به پنل مدیریت
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                نام کاربری
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="نام کاربری خود را وارد کنید"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                رمز عبور
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="رمز عبور خود را وارد کنید"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            {state.error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
            سیستم مدیریت درخواست و موجودی انبار
          </div>
        </div>
      </div>
    </main>
  );
}