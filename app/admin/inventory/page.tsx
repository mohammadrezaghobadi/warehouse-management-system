import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import InventoryClient from './InventoryClient';

function InventoryLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-28 animate-pulse rounded-3xl bg-white" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        <div className="h-24 animate-pulse rounded-3xl bg-white" />

        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function InventoryContent() {
  const [inventories, warehouses] =
    await Promise.all([
      prisma.inventory.findMany({
        orderBy: [
          {
            warehouse: {
              name: 'asc',
            },
          },
          {
            product: {
              name: 'asc',
            },
          },
        ],
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
              minStock: true,
              maxStock: true,
              active: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              location: true,
              active: true,
            },
          },
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

  const serializedInventory = inventories.map(
    (inventory) => ({
      id: inventory.id,

      product: {
        id: inventory.product.id,
        code: inventory.product.code,
        name: inventory.product.name,
        unit: inventory.product.unit,
        minStock: inventory.product.minStock,
        maxStock: inventory.product.maxStock,
        active: inventory.product.active,

        category: inventory.product.category
          ? {
              id: inventory.product.category.id,
              name: inventory.product.category.name,
            }
          : null,
      },

      warehouse: {
        id: inventory.warehouse.id,
        name: inventory.warehouse.name,
        location: inventory.warehouse.location,
        active: inventory.warehouse.active,
      },

      quantity: inventory.quantity,
    })
  );

  const serializedWarehouses =
    warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
    }));

  return (
    <InventoryClient
      initialInventory={serializedInventory}
      initialWarehouses={serializedWarehouses}
    />
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventoryLoading />}>
      <InventoryContent />
    </Suspense>
  );
}