'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
AUTH_COOKIE,
verifySession,
} from '@/lib/aut';

interface WarehouseInput {
name: string;
location: string;
}

interface WarehouseActionResult {
success: boolean;
error?: string;
warehouseId?: number;
}

async function getCurrentUser() {
const cookieStore = await cookies();

const token =
cookieStore.get(AUTH_COOKIE)?.value;

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

function canManageWarehouses(role: string) {
return (
role === 'ADMIN' ||
role === 'WAREHOUSE'
);
}

export async function createWarehouse(
data: WarehouseInput
): Promise<WarehouseActionResult> {
try {
// =========================
// Authentication
// =========================

const user = await getCurrentUser();

if (!user) {
  return {
    success: false,
    error:
      'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  };
}

// =========================
// Authorization
// =========================

if (!canManageWarehouses(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ثبت انبار را ندارید.',
  };
}

// =========================
// Normalize
// =========================

const name = data.name.trim();
const location = data.location.trim();

// =========================
// Validation
// =========================

if (!name) {
  return {
    success: false,
    error:
      'نام انبار را وارد کنید.',
  };
}

if (name.length < 2) {
  return {
    success: false,
    error:
      'نام انبار باید حداقل ۲ کاراکتر باشد.',
  };
}

// =========================
// Duplicate
// =========================

const existing =
  await prisma.warehouse.findFirst({
    where: {
      name: {
        equals: name,
      },
    },
  });

if (existing) {
  return {
    success: false,
    error:
      'انباری با این نام قبلاً ثبت شده است.',
  };
}

// =========================
// Create
// =========================

const warehouse =
  await prisma.warehouse.create({
    data: {
      name,
      location: location || null,
      active: true,
    },
  });

return {
  success: true,
  warehouseId: warehouse.id,
};


} catch (error) {
console.error(
'createWarehouse error:',
error
);


return {
  success: false,
  error:
    'ثبت انبار با خطا مواجه شد.',
};


}
}

export async function updateWarehouse(
id: number,
data: WarehouseInput
): Promise<WarehouseActionResult> {
try {
// =========================
// Authentication
// =========================


const user = await getCurrentUser();

if (!user) {
  return {
    success: false,
    error:
      'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  };
}

// =========================
// Authorization
// =========================

if (!canManageWarehouses(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ویرایش انبار را ندارید.',
  };
}

// =========================
// ID validation
// =========================

if (
  !Number.isInteger(id) ||
  id <= 0
) {
  return {
    success: false,
    error:
      'شناسه انبار نامعتبر است.',
  };
}

// =========================
// Normalize
// =========================

const name = data.name.trim();
const location = data.location.trim();

// =========================
// Validation
// =========================

if (!name) {
  return {
    success: false,
    error:
      'نام انبار را وارد کنید.',
  };
}

if (name.length < 2) {
  return {
    success: false,
    error:
      'نام انبار باید حداقل ۲ کاراکتر باشد.',
  };
}

// =========================
// Find warehouse
// =========================

const warehouse =
  await prisma.warehouse.findUnique({
    where: {
      id,
    },
  });

if (!warehouse) {
  return {
    success: false,
    error:
      'انبار پیدا نشد.',
  };
}

// =========================
// Duplicate
// =========================

const duplicate =
  await prisma.warehouse.findFirst({
    where: {
      name,
      NOT: {
        id,
      },
    },
  });

if (duplicate) {
  return {
    success: false,
    error:
      'انباری با این نام قبلاً ثبت شده است.',
  };
}

// =========================
// Update
// =========================

await prisma.warehouse.update({
  where: {
    id,
  },
  data: {
    name,
    location: location || null,
  },
});

return {
  success: true,
  warehouseId: id,
};


} catch (error) {
console.error(
'updateWarehouse error:',
error
);


return {
  success: false,
  error:
    'ویرایش انبار با خطا مواجه شد.',
};


}
}

export async function toggleWarehouse(
id: number,
active: boolean
): Promise<WarehouseActionResult> {
try {
// =========================
// Authentication
// =========================


const user = await getCurrentUser();

if (!user) {
  return {
    success: false,
    error:
      'برای انجام این عملیات باید وارد حساب کاربری شوید.',
  };
}

// =========================
// Authorization
// =========================

if (!canManageWarehouses(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه تغییر وضعیت انبار را ندارید.',
  };
}

// =========================
// ID validation
// =========================

if (
  !Number.isInteger(id) ||
  id <= 0
) {
  return {
    success: false,
    error:
      'شناسه انبار نامعتبر است.',
  };
}

// =========================
// Find warehouse
// =========================

const warehouse =
  await prisma.warehouse.findUnique({
    where: {
      id,
    },
    include: {
      inventories: {
        select: {
          quantity: true,
        },
      },
    },
  });

if (!warehouse) {
  return {
    success: false,
    error:
      'انبار پیدا نشد.',
  };
}

// =========================
// Prevent deactivation
// =========================

if (!active) {
  const hasStock =
    warehouse.inventories.some(
      (item) => item.quantity > 0
    );

  if (hasStock) {
    return {
      success: false,
      error:
        'این انبار دارای موجودی است و فعلاً نمی‌توان آن را غیرفعال کرد.',
    };
  }
}

// =========================
// Update status
// =========================

await prisma.warehouse.update({
  where: {
    id,
  },
  data: {
    active,
  },
});

return {
  success: true,
  warehouseId: id,
};


} catch (error) {
console.error(
'toggleWarehouse error:',
error
);


return {
  success: false,
  error:
    'تغییر وضعیت انبار با خطا مواجه شد.',
};

}
}
