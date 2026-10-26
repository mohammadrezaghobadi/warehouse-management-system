
import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import RequestForm from './RequestForm';

function RequestLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white" />

        <div className="h-40 animate-pulse rounded-3xl bg-white" />

        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function RequestContent() {
  const [products, departments] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
        },
      }),

      prisma.department.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  return (
    <RequestForm
      products={products}
      departments={departments}
    />
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<RequestLoading />}>
      <RequestContent />
    </Suspense>
  );
}

