import { Suspense } from 'react';

import ReportsClient from './RequestsClient';

import { prisma } from '@/lib/prisma';

async function ReportsContent() {
const [
inventory,
incoming,
outgoing,
] = await Promise.all([
prisma.inventory.findMany({
include: {
product: {
include: {
category: true,
},
},
warehouse: true,
},
orderBy: {
product: {
name: 'asc',
},
},
}),

prisma.goodsReceiptItem.findMany({
  where: {
    receipt: {
      status: 'FINAL',
    },
  },
  include: {
    product: true,
    receipt: {
      include: {
        warehouse: true,
        receivedBy: {
          select: {
            name: true,
          },
        },
      },
    },
  },
  orderBy: {
    receipt: {
      receiptDate: 'desc',
    },
  },
}),

prisma.warehouseIssueItem.findMany({
  include: {
    product: true,
    issue: {
      include: {
        warehouse: true,
        issuedBy: {
          select: {
            name: true,
          },
        },
      },
    },
  },
  orderBy: {
    issue: {
      issueDate: 'desc',
    },
  },
}),


]);

const serializedInventory = inventory.map(
(item) => ({
id: item.id,
productId: item.productId,
productName: item.product.name,
productCode: item.product.code,
unit: item.product.unit,
categoryName:
item.product.category?.name ?? 'بدون دسته‌بندی',
minStock: item.product.minStock,
quantity: item.quantity,
warehouseName: item.warehouse.name,
})
);

const serializedIncoming = incoming.map(
(item) => ({
id: item.id,
receiptNumber:
item.receipt.receiptNumber,
productName: item.product.name,
productCode: item.product.code,
unit: item.product.unit,
quantity: item.acceptedQuantity,
warehouseName:
item.receipt.warehouse.name,
receivedBy:
item.receipt.receivedBy.name,
date:
item.receipt.receiptDate.toISOString(),
})
);

const serializedOutgoing = outgoing.map(
(item) => ({
id: item.id,
issueNumber:
item.issue.issueNumber,
productName: item.product.name,
productCode: item.product.code,
unit: item.product.unit,
quantity: item.quantity,
warehouseName:
item.issue.warehouse.name,
issuedBy:
item.issue.issuedBy.name,
date:
item.issue.issueDate.toISOString(),
})
);

return ( <ReportsClient
   inventory={serializedInventory}
   incoming={serializedIncoming}
   outgoing={serializedOutgoing}
 />
);
}

export default function ReportsPage() {
return (
<Suspense
fallback={ <div
       dir="rtl"
       className="flex min-h-[400px] items-center justify-center"
     > <div className="text-sm text-slate-500">
در حال دریافت گزارش‌ها... </div> </div>
}
> <ReportsContent /> </Suspense>
);
}
