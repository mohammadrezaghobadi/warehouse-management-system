import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';
import TransactionsClient from './TransactionsClient';

function TransactionsLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        <div className="h-[600px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function TransactionsContent() {
  const transactions =
    await prisma.inventoryTransaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  const serializedTransactions =
    transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      quantity: transaction.quantity,
      referenceType: transaction.referenceType,
      referenceId: transaction.referenceId,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),

      product: transaction.product,
      warehouse: transaction.warehouse,
      createdBy: transaction.createdBy,
    }));

  return (
    <TransactionsClient
      initialTransactions={serializedTransactions}
    />
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsLoading />}>
      <TransactionsContent />
    </Suspense>
  );
}