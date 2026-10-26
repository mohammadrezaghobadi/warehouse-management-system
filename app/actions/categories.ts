'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
AUTH_COOKIE,
verifySession,
} from '@/lib/aut';

interface CategoryActionResult {
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

function canManageCategories(role: string) {
return (
role === 'ADMIN' ||
role === 'WAREHOUSE'
);
}

export async function createCategory(
name: string
): Promise<CategoryActionResult> {
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

if (!canManageCategories(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ثبت دسته‌بندی را ندارید.',
  };
}

// =========================
// Validation
// =========================

const trimmedName = name.trim();

if (!trimmedName) {
  return {
    success: false,
    error:
      'نام دسته‌بندی را وارد کنید.',
  };
}

// =========================
// Duplicate
// =========================

const existing =
  await prisma.category.findUnique({
    where: {
      name: trimmedName,
    },
  });

if (existing) {
  return {
    success: false,
    error:
      'دسته‌بندی با این نام قبلاً ثبت شده است.',
  };
}

// =========================
// Create
// =========================

await prisma.category.create({
  data: {
    name: trimmedName,
  },
});

return {
  success: true,
};

} catch (error) {
console.error(
'createCategory error:',
error
);

return {
  success: false,
  error:
    'ثبت دسته‌بندی با خطا مواجه شد.',
};


}
}

export async function updateCategory(
id: number,
name: string
): Promise<CategoryActionResult> {
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

if (!canManageCategories(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه ویرایش دسته‌بندی را ندارید.',
  };
}

// =========================
// Validation
// =========================

const trimmedName = name.trim();

if (
  !id ||
  !Number.isInteger(id) ||
  id <= 0
) {
  return {
    success: false,
    error:
      'شناسه دسته‌بندی نامعتبر است.',
  };
}

if (!trimmedName) {
  return {
    success: false,
    error:
      'نام دسته‌بندی را وارد کنید.',
  };
}

// =========================
// Find category
// =========================

const category =
  await prisma.category.findUnique({
    where: {
      id,
    },
  });

if (!category) {
  return {
    success: false,
    error:
      'دسته‌بندی پیدا نشد.',
  };
}

// =========================
// Duplicate
// =========================

const duplicate =
  await prisma.category.findFirst({
    where: {
      name: trimmedName,
      NOT: {
        id,
      },
    },
  });

if (duplicate) {
  return {
    success: false,
    error:
      'دسته‌بندی دیگری با این نام وجود دارد.',
  };
}

// =========================
// Update
// =========================

await prisma.category.update({
  where: {
    id,
  },
  data: {
    name: trimmedName,
  },
});

return {
  success: true,
};


} catch (error) {
console.error(
'updateCategory error:',
error
);


return {
  success: false,
  error:
    'ویرایش دسته‌بندی با خطا مواجه شد.',
};


}
}

export async function deleteCategory(
id: number
): Promise<CategoryActionResult> {
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

if (!canManageCategories(user.role)) {
  return {
    success: false,
    error:
      'شما اجازه حذف دسته‌بندی را ندارید.',
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
      'شناسه دسته‌بندی نامعتبر است.',
  };
}

// =========================
// Find category
// =========================

const category =
  await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      products: {
        select: {
          id: true,
        },
      },
    },
  });

if (!category) {
  return {
    success: false,
    error:
      'دسته‌بندی پیدا نشد.',
  };
}

// =========================
// Check products
// =========================

if (category.products.length > 0) {
  return {
    success: false,
    error:
      'این دسته‌بندی دارای کالا است و قابل حذف نیست.',
  };
}

// =========================
// Delete
// =========================

await prisma.category.delete({
  where: {
    id,
  },
});

return {
  success: true,
};


} catch (error) {
console.error(
'deleteCategory error:',
error
);

return {
  success: false,
  error:
    'حذف دسته‌بندی با خطا مواجه شد.',
};


}
}
