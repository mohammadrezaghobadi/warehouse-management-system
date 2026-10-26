
'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

interface DepartmentInput {
  name: string;
}

interface DepartmentActionResult {
  success: boolean;
  error?: string;
  departmentId?: number;
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

function canManageDepartments(role: string): boolean {
  return (
    role === 'ADMIN' ||
    role === 'WAREHOUSE'
  );
}

function validateDepartmentName(
  name: string
): string | null {
  if (!name) {
    return 'نام واحد را وارد کنید.';
  }

  if (name.length < 2) {
    return 'نام واحد باید حداقل ۲ کاراکتر باشد.';
  }

  if (name.length > 100) {
    return 'نام واحد نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.';
  }

  return null;
}

export async function createDepartment(
  data: DepartmentInput
): Promise<DepartmentActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageDepartments(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه ثبت واحد سازمانی را ندارید.',
      };
    }

    const name = data.name.trim();

    const validationError =
      validateDepartmentName(name);

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const existing =
      await prisma.department.findFirst({
        where: {
          name,
        },
      });

    if (existing) {
      return {
        success: false,
        error:
          'واحدی با این نام قبلاً ثبت شده است.',
      };
    }

    const department =
      await prisma.department.create({
        data: {
          name,
        },
      });

    return {
      success: true,
      departmentId: department.id,
    };
  } catch (error) {
    console.error(
      'createDepartment error:',
      error
    );

    return {
      success: false,
      error:
        'ثبت واحد با خطا مواجه شد.',
    };
  }
}

export async function updateDepartment(
  id: number,
  data: DepartmentInput
): Promise<DepartmentActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageDepartments(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه ویرایش واحد سازمانی را ندارید.',
      };
    }

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه واحد نامعتبر است.',
      };
    }

    const name = data.name.trim();

    const validationError =
      validateDepartmentName(name);

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const department =
      await prisma.department.findUnique({
        where: {
          id,
        },
      });

    if (!department) {
      return {
        success: false,
        error:
          'واحد موردنظر پیدا نشد.',
      };
    }

    const duplicate =
      await prisma.department.findFirst({
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
          'واحدی با این نام قبلاً ثبت شده است.',
      };
    }

    await prisma.department.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return {
      success: true,
      departmentId: id,
    };
  } catch (error) {
    console.error(
      'updateDepartment error:',
      error
    );

    return {
      success: false,
      error:
        'ویرایش واحد با خطا مواجه شد.',
    };
  }
}

export async function deleteDepartment(
  id: number
): Promise<DepartmentActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageDepartments(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه حذف واحد سازمانی را ندارید.',
      };
    }

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه واحد نامعتبر است.',
      };
    }

    const department =
      await prisma.department.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              users: true,
              requests: true,
            },
          },
        },
      });

    if (!department) {
      return {
        success: false,
        error:
          'واحد موردنظر پیدا نشد.',
      };
    }

    if (department._count.users > 0) {
      return {
        success: false,
        error:
          'این واحد دارای کاربر است و نمی‌توان آن را حذف کرد.',
      };
    }

    if (department._count.requests > 0) {
      return {
        success: false,
        error:
          'این واحد دارای درخواست ثبت‌شده است و نمی‌توان آن را حذف کرد.',
      };
    }

    await prisma.department.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      departmentId: id,
    };
  } catch (error) {
    console.error(
      'deleteDepartment error:',
      error
    );

    return {
      success: false,
      error:
        'حذف واحد با خطا مواجه شد.',
    };
  }
}

