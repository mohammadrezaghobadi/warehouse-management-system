'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
AUTH_COOKIE,
verifySession,
} from '@/lib/aut';

interface InventoryActionResult {
success: boolean;
error?: string;
}

interface InventoryInput {
productId: number;
warehouseId: number;
quantity: number;
}

async function getCurrentUser() {
const cookieStore = await cookies();

const token = cookieStore.get(
AUTH_COOKIE
)?.value;

if (!token) {
return null;
}

const session = await verifySession(token);

if (!session) {
return null;
}

const user = await prisma.user.findUnique({
where: {
id: session.userId,
},
select: {
id: true,
name: true,
username: true,
role: true,
active: true,
},
});

if (!user || !user.active) {
return null;
}

return user;
}

function canManageInventory(
role: string
): boolean {
return (
role === 'ADMIN' ||
role === 'WAREHOUSE'
);
}

function validateInput(
data: InventoryInput
): string | null {
if (
!Number.isInteger(data.productId) ||
data.productId <= 0
) {
return 'کالای انتخاب‌شده نامعتبر است.';
}

if (
!Number.isInteger(data.warehouseId) ||
data.warehouseId <= 0
) {
return 'انبار انتخاب‌شده نامعتبر است.';
}

if (
!Number.isFinite(data.quantity) ||
data.quantity < 0
) {
return 'مقدار موجودی نامعتبر است.';
}

return null;
}

export async function setInitialInventory(
data: InventoryInput
): Promise<InventoryActionResult> {
try {
const user = await getCurrentUser();


if (!user) {
  return {
    success: false,
    error: 'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  };
}

if (!canManageInventory(user.role)) {
  return {
    success: false,
    error: 'شما اجازه ثبت موجودی را ندارید.',
  };
}

const validationError =
  validateInput(data);

if (validationError) {
  return {
    success: false,
    error: validationError,
  };
}

const [product, warehouse] =
  await Promise.all([
    prisma.product.findUnique({
      where: {
        id: data.productId,
      },
    }),

    prisma.warehouse.findUnique({
      where: {
        id: data.warehouseId,
      },
    }),
  ]);

if (!product) {
  return {
    success: false,
    error: 'کالا پیدا نشد.',
  };
}

if (!product.active) {
  return {
    success: false,
    error:
      'این کالا غیرفعال است و امکان ثبت موجودی ندارد.',
  };
}

if (!warehouse) {
  return {
    success: false,
    error: 'انبار پیدا نشد.',
  };
}

if (!warehouse.active) {
  return {
    success: false,
    error:
      'این انبار غیرفعال است و امکان ثبت موجودی ندارد.',
  };
}

const existing =
  await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.warehouseId,
      },
    },
  });

if (existing) {
  return {
    success: false,
    error:
      'برای این کالا در این انبار موجودی قبلاً ثبت شده است. برای تغییر موجودی از اصلاح موجودی استفاده کنید.',
  };
}

await prisma.$transaction(
  async (tx) => {
    await tx.inventory.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
      },
    });

    if (data.quantity > 0) {
      await tx.inventoryTransaction.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          createdById: user.id,
          type: 'INITIAL',
          quantity: data.quantity,
          referenceType:
            'INITIAL_INVENTORY',
          description:
            `موجودی اولیه کالا ${product.name} - ثبت توسط ${user.name}`,
        },
      });
    }
  }
);

return {
  success: true,
};


} catch (error) {
console.error(
'setInitialInventory error:',
error
);


return {
  success: false,
  error:
    'ثبت موجودی با خطا مواجه شد.',
};


}
}

export async function updateInventoryQuantity(
data: InventoryInput
): Promise<InventoryActionResult> {
try {
const user = await getCurrentUser();


if (!user) {
  return {
    success: false,
    error:
      'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  };
}

if (!canManageInventory(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه اصلاح موجودی را ندارید.',
  };
}

const validationError =
  validateInput(data);

if (validationError) {
  return {
    success: false,
    error: validationError,
  };
}

const inventory =
  await prisma.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.warehouseId,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
      warehouse: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
  });

if (!inventory) {
  return {
    success: false,
    error:
      'موجودی این کالا در این انبار ثبت نشده است.',
  };
}

if (!inventory.warehouse.active) {
  return {
    success: false,
    error:
      'انبار غیرفعال است و امکان اصلاح موجودی وجود ندارد.',
  };
}

const previousQuantity =
  inventory.quantity;

const difference =
  data.quantity - previousQuantity;

if (difference === 0) {
  return {
    success: true,
  };
}

await prisma.$transaction(
  async (tx) => {
    await tx.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        quantity: data.quantity,
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        createdById: user.id,
        type:
          difference > 0
            ? 'ADJUSTMENT_IN'
            : 'ADJUSTMENT_OUT',
        quantity: Math.abs(difference),
        referenceType:
          'INVENTORY_ADJUSTMENT',
        description:
          `اصلاح موجودی ${inventory.product.name} از ${previousQuantity} به ${data.quantity} - ثبت توسط ${user.name}`,
      },
    });
  }
);

return {
  success: true,
};


} catch (error) {
console.error(
'updateInventoryQuantity error:',
error
);


return {
  success: false,
  error:
    'ویرایش موجودی با خطا مواجه شد.',
};


}
}
