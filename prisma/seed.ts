import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
console.log('شروع ساخت داده‌های نمونه...');

// =========================
// Departments
// =========================

const itDepartment = await prisma.department.upsert({
  where: { name: 'فناوری اطلاعات' },
  update: {},
  create: {
    name: 'فناوری اطلاعات',
  },
});

const financeDepartment = await prisma.department.upsert({
where: { name: 'امور مالی' },
update: {},
create: { name: 'امور مالی' },
});

const adminDepartment = await prisma.department.upsert({
where: { name: 'مدیریت' },
update: {},
create: { name: 'مدیریت' },
});

// =========================
// Users
// =========================

const passwordHash = await bcrypt.hash('admin123', 10);

const admin = await prisma.user.upsert({
where: { username: 'admin' },
update: {
name: 'مدیر سیستم',
role: 'ADMIN',
active: true,
departmentId: adminDepartment.id,
},
create: {
name: 'مدیر سیستم',
username: 'admin',
passwordHash,
role: 'ADMIN',
active: true,
departmentId: adminDepartment.id,
},
});

const supervisor = await prisma.user.upsert({
where: { username: 'supervisor' },
update: {
name: 'سرپرست واحد',
role: 'SUPERVISOR',
active: true,
departmentId: itDepartment.id,
},
create: {
name: 'سرپرست واحد',
username: 'supervisor',
passwordHash,
role: 'SUPERVISOR',
active: true,
departmentId: itDepartment.id,
},
});

const warehouseUser = await prisma.user.upsert({
where: { username: 'warehouse' },
update: {
name: 'انباردار',
role: 'WAREHOUSE',
active: true,
departmentId: adminDepartment.id,
},
create: {
name: 'انباردار',
username: 'warehouse',
passwordHash,
role: 'WAREHOUSE',
active: true,
departmentId: adminDepartment.id,
},
});

const employee = await prisma.user.upsert({
where: { username: 'employee' },
update: {
name: 'کارمند نمونه',
role: 'EMPLOYEE',
active: true,
departmentId: itDepartment.id,
},
create: {
name: 'کارمند نمونه',
username: 'employee',
passwordHash,
role: 'EMPLOYEE',
active: true,
departmentId: itDepartment.id,
},
});

// =========================
// Categories
// =========================

const computerCategory = await prisma.category.upsert({
where: { name: 'تجهیزات کامپیوتری' },
update: {},
create: { name: 'تجهیزات کامپیوتری' },
});

const officeCategory = await prisma.category.upsert({
where: { name: 'لوازم اداری' },
update: {},
create: { name: 'لوازم اداری' },
});

const consumableCategory = await prisma.category.upsert({
where: { name: 'مواد مصرفی' },
update: {},
create: { name: 'مواد مصرفی' },
});

// =========================
// Products
// =========================

const mouse = await prisma.product.upsert({
where: { code: 'IT-001' },
update: {},
create: {
code: 'IT-001',
name: 'ماوس بی‌سیم',
unit: 'عدد',
minStock: 5,
maxStock: 30,
active: true,
categoryId: computerCategory.id,
},
});

const keyboard = await prisma.product.upsert({
where: { code: 'IT-002' },
update: {},
create: {
code: 'IT-002',
name: 'کیبورد USB',
unit: 'عدد',
minStock: 5,
maxStock: 30,
active: true,
categoryId: computerCategory.id,
},
});

const paper = await prisma.product.upsert({
where: { code: 'OF-001' },
update: {},
create: {
code: 'OF-001',
name: 'کاغذ A4',
unit: 'بسته',
minStock: 10,
maxStock: 100,
active: true,
categoryId: officeCategory.id,
},
});

const pen = await prisma.product.upsert({
where: { code: 'OF-002' },
update: {},
create: {
code: 'OF-002',
name: 'خودکار آبی',
unit: 'عدد',
minStock: 20,
maxStock: 200,
active: true,
categoryId: officeCategory.id,
},
});

const toner = await prisma.product.upsert({
where: { code: 'CO-001' },
update: {},
create: {
code: 'CO-001',
name: 'تونر پرینتر',
unit: 'عدد',
minStock: 2,
maxStock: 10,
active: true,
categoryId: consumableCategory.id,
},
});

// =========================
// Warehouse
// =========================

const mainWarehouse = await prisma.warehouse.upsert({
where: { id: 1 },
update: {
name: 'انبار مرکزی',
location: 'ساختمان اداری',
active: true,
},
create: {
name: 'انبار مرکزی',
location: 'ساختمان اداری',
active: true,
},
});

// =========================
// Initial Inventory
// =========================

const inventoryData = [
{
productId: mouse.id,
quantity: 12,
},
{
productId: keyboard.id,
quantity: 8,
},
{
productId: paper.id,
quantity: 45,
},
{
productId: pen.id,
quantity: 15,
},
{
productId: toner.id,
quantity: 1,
},
];

for (const item of inventoryData) {
const inventory = await prisma.inventory.findUnique({
where: {
productId_warehouseId: {
productId: item.productId,
warehouseId: mainWarehouse.id,
},
},
});


if (!inventory) {
  await prisma.inventory.create({
    data: {
      productId: item.productId,
      warehouseId: mainWarehouse.id,
      quantity: item.quantity,
    },
  });
}


}

// =========================
// Initial Transactions
// =========================

const initialProducts = [
mouse,
keyboard,
paper,
pen,
toner,
];

for (const product of initialProducts) {
const exists =
await prisma.inventoryTransaction.findFirst({
where: {
productId: product.id,
warehouseId: mainWarehouse.id,
type: 'INITIAL',
referenceType: 'SEED_INITIAL',
},
});


if (!exists) {
  const inventory =
    await prisma.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: mainWarehouse.id,
        },
      },
    });

  if (inventory && inventory.quantity > 0) {
    await prisma.inventoryTransaction.create({
      data: {
        productId: product.id,
        warehouseId: mainWarehouse.id,
        createdById: admin.id,
        type: 'INITIAL',
        quantity: inventory.quantity,
        referenceType: 'SEED_INITIAL',
        description:
          `موجودی اولیه ${product.name}`,
      },
    });
  }
}


}

// =========================
// Goods Receipt
// =========================

let receipt =
await prisma.goodsReceipt.findUnique({
where: {
receiptNumber: 'GR-1001',
},
});

if (!receipt) {
receipt = await prisma.goodsReceipt.create({
data: {
receiptNumber: 'GR-1001',
warehouseId: mainWarehouse.id,
receivedById: warehouseUser.id,
supplier: 'شرکت تأمین تجهیزات',
purchaseNumber: 'PO-1001',
status: 'FINAL',
description: 'رسید نمونه برای تست سیستم',


    items: {
      create: [
        {
          productId: mouse.id,
          receivedQuantity: 10,
          acceptedQuantity: 10,
          rejectedQuantity: 0,
          qualityStatus: 'ACCEPTED',
        },
        {
          productId: paper.id,
          receivedQuantity: 20,
          acceptedQuantity: 20,
          rejectedQuantity: 0,
          qualityStatus: 'ACCEPTED',
        },
      ],
    },
  },
});

await prisma.inventory.update({
  where: {
    productId_warehouseId: {
      productId: mouse.id,
      warehouseId: mainWarehouse.id,
    },
  },
  data: {
    quantity: {
      increment: 10,
    },
  },
});

await prisma.inventory.update({
  where: {
    productId_warehouseId: {
      productId: paper.id,
      warehouseId: mainWarehouse.id,
    },
  },
  data: {
    quantity: {
      increment: 20,
    },
  },
});

await prisma.inventoryTransaction.createMany({
  data: [
    {
      productId: mouse.id,
      warehouseId: mainWarehouse.id,
      createdById: warehouseUser.id,
      type: 'IN',
      quantity: 10,
      referenceType: 'GOODS_RECEIPT',
      referenceId: receipt.id,
      description: 'ورود نمونه ماوس',
    },
    {
      productId: paper.id,
      warehouseId: mainWarehouse.id,
      createdById: warehouseUser.id,
      type: 'IN',
      quantity: 20,
      referenceType: 'GOODS_RECEIPT',
      referenceId: receipt.id,
      description: 'ورود نمونه کاغذ A4',
    },
  ],
});


}

// =========================
// Request
// =========================

let request =
await prisma.request.findUnique({
where: {
requestNumber: 'REQ-1001',
},
});

if (!request) {
request = await prisma.request.create({
data: {
requestNumber: 'REQ-1001',
requesterId: employee.id,
departmentId: itDepartment.id,
status: 'APPROVED',
description:
'درخواست نمونه تجهیزات برای واحد فناوری اطلاعات',
approvedById: supervisor.id,
approvedAt: new Date(),


    items: {
      create: [
        {
          productId: mouse.id,
          requestedQuantity: 2,
          approvedQuantity: 2,
        },
        {
          productId: keyboard.id,
          requestedQuantity: 1,
          approvedQuantity: 1,
        },
      ],
    },
  },
});


}

// =========================
// Warehouse Issue
// =========================

let issue =
await prisma.warehouseIssue.findUnique({
where: {
issueNumber: 'WI-1001',
},
});

if (!issue) {
const requestItems =
await prisma.requestItem.findMany({
where: {
requestId: request.id,
},
});


issue = await prisma.warehouseIssue.create({
  data: {
    issueNumber: 'WI-1001',
    requestId: request.id,
    warehouseId: mainWarehouse.id,
    issuedById: warehouseUser.id,
    status: 'FINAL',
    description:
      'حواله نمونه برای تست سیستم',

    items: {
      create: requestItems.map(
        (item) => ({
          productId: item.productId,
          quantity:
            item.approvedQuantity ?? 0,
        })
      ),
    },
  },
});

for (const item of requestItems) {
  const quantity =
    item.approvedQuantity ?? 0;

  if (quantity > 0) {
    await prisma.inventory.update({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: mainWarehouse.id,
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        productId: item.productId,
        warehouseId: mainWarehouse.id,
        createdById: warehouseUser.id,
        type: 'OUT',
        quantity,
        referenceType: 'WAREHOUSE_ISSUE',
        referenceId: issue.id,
        description:
          'خروج نمونه کالا از انبار',
      },
    });

    await prisma.requestItem.update({
      where: {
        id: item.id,
      },
      data: {
        deliveredQuantity: quantity,
      },
    });
  }
}

await prisma.request.update({
  where: {
    id: request.id,
  },
  data: {
    status: 'DELIVERED',
  },
});


}

console.log('');
console.log(
'✅ داده‌های نمونه با موفقیت ساخته شدند.'
);
console.log('');

console.log('حساب‌های نمونه:');

console.log(
'ADMIN      → admin / admin123'
);

console.log(
'SUPERVISOR → supervisor / admin123'
);

console.log(
'WAREHOUSE  → warehouse / admin123'
);

console.log(
'EMPLOYEE   → employee / admin123'
);

console.log('');
}

main()
.catch((error) => {
console.error(
'❌ خطا در Seed:',
error
);


process.exit(1);


})
.finally(async () => {
await prisma.$disconnect();
});
