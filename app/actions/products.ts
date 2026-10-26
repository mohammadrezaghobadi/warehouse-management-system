'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
AUTH_COOKIE,
verifySession,
} from '@/lib/aut';

interface ProductInput {
code: string;
name: string;
unit: string;
categoryId: number | null;
minStock: number;
maxStock: number | null;
active: boolean;
}

interface ProductActionResult {
success: boolean;
error?: string;
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

function canManageProducts(role: string) {
return (
role === 'ADMIN' ||
role === 'WAREHOUSE'
);
}

function validateProductData(
data: ProductInput
): string | null {
if (!data.code?.trim()) {
return 'کد کالا را وارد کنید.';
}

if (!data.name?.trim()) {
return 'نام کالا را وارد کنید.';
}

if (!data.unit?.trim()) {
return 'واحد کالا را وارد کنید.';
}

if (
!Number.isFinite(data.minStock) ||
data.minStock < 0
) {
return 'حداقل موجودی نامعتبر است.';
}

if (
data.maxStock !== null &&
(!Number.isFinite(data.maxStock) ||
data.maxStock < 0)
) {
return 'حداکثر موجودی نامعتبر است.';
}

if (
data.maxStock !== null &&
data.maxStock < data.minStock
) {
return 'حداکثر موجودی نمی‌تواند کمتر از حداقل موجودی باشد.';
}

if (
data.categoryId !== null &&
(!Number.isInteger(data.categoryId) ||
data.categoryId <= 0)
) {
return 'دسته‌بندی انتخاب‌شده نامعتبر است.';
}

return null;
}

export async function createProduct(
data: ProductInput
): Promise<ProductActionResult> {
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

if (!canManageProducts(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ثبت کالا را ندارید.',
  };
}

// =========================
// Normalize data
// =========================

const code = data.code.trim();
const name = data.name.trim();
const unit = data.unit.trim();

// =========================
// Validation
// =========================

const validationError =
  validateProductData(data);

if (validationError) {
  return {
    success: false,
    error: validationError,
  };
}

// =========================
// Duplicate code
// =========================

const existingProduct =
  await prisma.product.findUnique({
    where: {
      code,
    },
  });

if (existingProduct) {
  return {
    success: false,
    error:
      'کالایی با این کد قبلاً ثبت شده است.',
  };
}

// =========================
// Category
// =========================

if (data.categoryId !== null) {
  const category =
    await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

  if (!category) {
    return {
      success: false,
      error:
        'دسته‌بندی انتخاب‌شده وجود ندارد.',
    };
  }
}

// =========================
// Create
// =========================

await prisma.product.create({
  data: {
    code,
    name,
    unit,
    categoryId: data.categoryId,
    minStock: data.minStock,
    maxStock: data.maxStock,
    active: data.active,
  },
});

return {
  success: true,
};


} catch (error) {
console.error(
'createProduct error:',
error
);


return {
  success: false,
  error:
    'ثبت کالا با خطا مواجه شد.',
};


}
}

export async function updateProduct(
data: ProductInput & {
id: number;
}
): Promise<ProductActionResult> {
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

if (!canManageProducts(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ویرایش کالا را ندارید.',
  };
}

// =========================
// ID validation
// =========================

if (
  !data.id ||
  !Number.isInteger(data.id) ||
  data.id <= 0
) {
  return {
    success: false,
    error:
      'شناسه کالا نامعتبر است.',
  };
}

// =========================
// Normalize data
// =========================

const code = data.code.trim();
const name = data.name.trim();
const unit = data.unit.trim();

// =========================
// Validation
// =========================

const validationError =
  validateProductData(data);

if (validationError) {
  return {
    success: false,
    error: validationError,
  };
}

// =========================
// Find product
// =========================

const product =
  await prisma.product.findUnique({
    where: {
      id: data.id,
    },
  });

if (!product) {
  return {
    success: false,
    error: 'کالا پیدا نشد.',
  };
}

// =========================
// Duplicate code
// =========================

const duplicate =
  await prisma.product.findFirst({
    where: {
      code,
      NOT: {
        id: data.id,
      },
    },
  });

if (duplicate) {
  return {
    success: false,
    error:
      'کالای دیگری با این کد وجود دارد.',
  };
}

// =========================
// Category
// =========================

if (data.categoryId !== null) {
  const category =
    await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
    });

  if (!category) {
    return {
      success: false,
      error:
        'دسته‌بندی انتخاب‌شده وجود ندارد.',
    };
  }
}

// =========================
// Update
// =========================

await prisma.product.update({
  where: {
    id: data.id,
  },
  data: {
    code,
    name,
    unit,
    categoryId: data.categoryId,
    minStock: data.minStock,
    maxStock: data.maxStock,
    active: data.active,
  },
});

return {
  success: true,
};


} catch (error) {
console.error(
'updateProduct error:',
error
);


return {
  success: false,
  error:
    'ویرایش کالا با خطا مواجه شد.',
};


}
}

export async function deleteProduct(
id: number
): Promise<ProductActionResult> {
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

if (!canManageProducts(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه حذف کالا را ندارید.',
  };
}

// =========================
// ID validation
// =========================

if (
  !id ||
  !Number.isInteger(id) ||
  id <= 0
) {
  return {
    success: false,
    error:
      'شناسه کالا نامعتبر است.',
  };
}

// =========================
// Find product
// =========================

const product =
  await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      inventories: true,
      requestItems: {
        take: 1,
      },
      receiptItems: {
        take: 1,
      },
      issueItems: {
        take: 1,
      },
      transactions: {
        take: 1,
      },
    },
  });

if (!product) {
  return {
    success: false,
    error: 'کالا پیدا نشد.',
  };
}

// =========================
// Check inventory
// =========================

if (product.inventories.length > 0) {
  const hasInventory =
    product.inventories.some(
      (inventory) =>
        inventory.quantity !== 0
    );

  if (hasInventory) {
    return {
      success: false,
      error:
        'این کالا دارای موجودی است و قابل حذف نیست.',
    };
  }
}

// =========================
// Check history
// =========================

if (
  product.requestItems.length > 0 ||
  product.receiptItems.length > 0 ||
  product.issueItems.length > 0 ||
  product.transactions.length > 0
) {
  return {
    success: false,
    error:
      'این کالا دارای سابقه در سیستم است و قابل حذف نیست.',
  };
}

// =========================
// Delete
// =========================

await prisma.product.delete({
  where: {
    id,
  },
});

return {
  success: true,
};


} catch (error) {
console.error(
'deleteProduct error:',
error
);


return {
  success: false,
  error:
    'حذف کالا با خطا مواجه شد.',
};


}
}
