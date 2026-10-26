
import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import ReceiptForm from './ReceiptForm';

function ReceiptLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="h-32 animate-pulse rounded-3xl bg-white" />

        <div className="h-80 animate-pulse rounded-3xl bg-white" />

        <div className="h-64 animate-pulse rounded-3xl bg-white" />

      </div>
    </main>
  );
}

async function ReceiptContent() {
  const [products, warehouses] =
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

      prisma.warehouse.findMany({
        where: {
          active: true,
        },
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
    <ReceiptForm
      products={products}
      warehouses={warehouses}
    />
  );
}

export default function NewReceiptPage() {
  return (
    <Suspense fallback={<ReceiptLoading />}>
      <ReceiptContent />
    </Suspense>
  );
}

