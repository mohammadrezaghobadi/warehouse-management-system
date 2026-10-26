import { Suspense } from 'react';

import AdminDashboard from './AdminDashboard';

function Loading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-100 p-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="h-24 animate-pulse rounded-2xl bg-white" />

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboard />
    </Suspense>
  );
}