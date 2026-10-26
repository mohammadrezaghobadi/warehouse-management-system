import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import WarehousesClient from './WarehousesClient';

function WarehousesLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-white" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function WarehousesContent() {
  const warehouses =
    await prisma.warehouse.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        inventories: {
          select: {
            quantity: true,
          },
        },
        _count: {
          select: {
            receipts: true,
            issues: true,
          },
        },
      },
    });

  const serializedWarehouses =
    warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      active: warehouse.active,
      productCount: warehouse.inventories.length,
      totalQuantity:
        warehouse.inventories.reduce(
          (total, inventory) =>
            total + inventory.quantity,
          0
        ),
      receiptCount: warehouse._count.receipts,
      issueCount: warehouse._count.issues,
    }));

  return (
    <WarehousesClient
      initialWarehouses={
        serializedWarehouses
      }
    />
  );
}

export default function WarehousesPage() {
  return (
    <Suspense fallback={<WarehousesLoading />}>
      <WarehousesContent />
    </Suspense>
  );
}