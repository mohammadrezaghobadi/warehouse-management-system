import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import ProductsClient from './ProductsClient';

function ProductsLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-slate-200" />

            <div>
              <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-200" />

              <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>

          <div className="h-12 w-40 animate-pulse rounded-2xl bg-slate-200" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="h-24 animate-pulse bg-slate-100" />

          <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

async function ProductsContent() {
  const [products, categories] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
          inventories: {
            select: {
              quantity: true,
            },
          },
        },
      }),

      prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

  const serializedProducts = products.map(
    (product) => ({
      id: product.id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      active: product.active,

      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
          }
        : null,

      quantity:
        product.inventories.reduce(
          (total, inventory) =>
            total + inventory.quantity,
          0
        ),
    })
  );

  const serializedCategories =
    categories.map((category) => ({
      id: category.id,
      name: category.name,
    }));

  return (
    <ProductsClient
      initialProducts={serializedProducts}
      initialCategories={serializedCategories}
    />
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}