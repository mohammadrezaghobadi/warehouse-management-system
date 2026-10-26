import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import ReceiptsClient from './ReceiptsClient';

function ReceiptsLoading() {
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

        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="h-20 animate-pulse bg-slate-100" />

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

async function ReceiptsContent() {
  const receipts = await prisma.goodsReceipt.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      warehouse: {
        select: {
          id: true,
          name: true,
        },
      },
      receivedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  const serializedReceipts = receipts.map((receipt) => ({
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    warehouseId: receipt.warehouseId,
    warehouseName: receipt.warehouse.name,
    receivedById: receipt.receivedById,
    receivedByName: receipt.receivedBy.name,
    supplier: receipt.supplier,
    purchaseNumber: receipt.purchaseNumber,
    status: receipt.status,
    description: receipt.description,
    receiptDate: receipt.receiptDate.toISOString(),
    createdAt: receipt.createdAt.toISOString(),

    items: receipt.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productCode: item.product.code,
      productName: item.product.name,
      unit: item.product.unit,
      receivedQuantity: item.receivedQuantity,
      acceptedQuantity: item.acceptedQuantity,
      rejectedQuantity: item.rejectedQuantity,
      qualityStatus: item.qualityStatus,
      description: item.description,
    })),
  }));

  return (
    <ReceiptsClient
      initialReceipts={serializedReceipts}
    />
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<ReceiptsLoading />}>
      <ReceiptsContent />
    </Suspense>
  );
}