
'use server';

import { cookies } from 'next/headers';

import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

const VALID_ROLES = [
  'ADMIN',
  'SUPERVISOR',
  'WAREHOUSE',
  'EMPLOYEE',
] as const;

type UserRole = (typeof VALID_ROLES)[number];

interface UserInput {
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  departmentId: number | null;
}

interface UserActionResult {
  success: boolean;
  error?: string;
  userId?: number;
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

function canManageUsers(role: string): boolean {
  return role === 'ADMIN';
}

function validateName(name: string): string | null {
  if (!name) {
    return 'نام کاربر را وارد کنید.';
  }

  if (name.length < 2) {
    return 'نام کاربر باید حداقل ۲ کاراکتر باشد.';
  }

  if (name.length > 100) {
    return 'نام کاربر نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.';
  }

  return null;
}

function validateUsername(
  username: string
): string | null {
  if (!username) {
    return 'نام کاربری را وارد کنید.';
  }

  if (username.length < 3) {
    return 'نام کاربری باید حداقل ۳ کاراکتر باشد.';
  }

  if (username.length > 50) {
    return 'نام کاربری نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.';
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return 'نام کاربری فقط می‌تواند شامل حروف انگلیسی، عدد، نقطه، خط تیره و زیرخط باشد.';
  }

  return null;
}

function validatePassword(
  password: string
): string | null {
  if (!password) {
    return 'رمز عبور را وارد کنید.';
  }

  if (password.length < 6) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }

  if (password.length > 100) {
    return 'رمز عبور نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.';
  }

  return null;
}

function validateRole(
  role: string
): role is UserRole {
  return VALID_ROLES.includes(
    role as UserRole
  );
}

async function validateDepartment(
  departmentId: number | null
): Promise<string | null> {
  if (departmentId === null) {
    return null;
  }

  if (
    !Number.isInteger(departmentId) ||
    departmentId <= 0
  ) {
    return 'دپارتمان انتخاب‌شده نامعتبر است.';
  }

  const department =
    await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
      },
    });

  if (!department) {
    return 'دپارتمان انتخاب‌شده پیدا نشد.';
  }

  return null;
}

export async function createUser(
  data: UserInput
): Promise<UserActionResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageUsers(currentUser.role)) {
      return {
        success: false,
        error:
          'شما اجازه ایجاد کاربر را ندارید.',
      };
    }

    const name = data.name.trim();
    const username = data.username.trim();

    const nameError = validateName(name);

    if (nameError) {
      return {
        success: false,
        error: nameError,
      };
    }

    const usernameError =
      validateUsername(username);

    if (usernameError) {
      return {
        success: false,
        error: usernameError,
      };
    }

    const password =
      typeof data.password === 'string'
        ? data.password
        : '';

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return {
        success: false,
        error: passwordError,
      };
    }

    if (!validateRole(data.role)) {
      return {
        success: false,
        error: 'نقش انتخاب‌شده نامعتبر است.',
      };
    }

    const departmentError =
      await validateDepartment(
        data.departmentId
      );

    if (departmentError) {
      return {
        success: false,
        error: departmentError,
      };
    }

    const existing =
      await prisma.user.findUnique({
        where: {
          username,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return {
        success: false,
        error:
          'کاربری با این نام کاربری قبلاً ثبت شده است.',
      };
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId,
        active: true,
      },
    });

    return {
      success: true,
      userId: user.id,
    };
  } catch (error) {
    console.error(
      'createUser error:',
      error
    );

    return {
      success: false,
      error:
        'ایجاد کاربر با خطا مواجه شد.',
    };
  }
}

export async function updateUser(
  id: number,
  data: UserInput
): Promise<UserActionResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageUsers(currentUser.role)) {
      return {
        success: false,
        error:
          'شما اجازه ویرایش کاربر را ندارید.',
      };
    }

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه کاربر نامعتبر است.',
      };
    }

    const existingUser =
      await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          username: true,
          role: true,
          passwordHash: true,
        },
      });

    if (!existingUser) {
      return {
        success: false,
        error:
          'کاربر موردنظر پیدا نشد.',
      };
    }

    const name = data.name.trim();
    const username = data.username.trim();

    const nameError = validateName(name);

    if (nameError) {
      return {
        success: false,
        error: nameError,
      };
    }

    const usernameError =
      validateUsername(username);

    if (usernameError) {
      return {
        success: false,
        error: usernameError,
      };
    }

    if (!validateRole(data.role)) {
      return {
        success: false,
        error: 'نقش انتخاب‌شده نامعتبر است.',
      };
    }

    const departmentError =
      await validateDepartment(
        data.departmentId
      );

    if (departmentError) {
      return {
        success: false,
        error: departmentError,
      };
    }

    const duplicate =
      await prisma.user.findFirst({
        where: {
          username,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicate) {
      return {
        success: false,
        error:
          'کاربری با این نام کاربری قبلاً ثبت شده است.',
      };
    }

    const updateData: {
      name: string;
      username: string;
      role: UserRole;
      departmentId: number | null;
      passwordHash?: string;
    } = {
      name,
      username,
      role: data.role,
      departmentId: data.departmentId,
    };

    if (
      typeof data.password === 'string' &&
      data.password.length > 0
    ) {
      const passwordError =
        validatePassword(data.password);

      if (passwordError) {
        return {
          success: false,
          error: passwordError,
        };
      }

      updateData.passwordHash =
        await bcrypt.hash(data.password, 12);
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: updateData,
    });

    return {
      success: true,
      userId: id,
    };
  } catch (error) {
    console.error(
      'updateUser error:',
      error
    );

    return {
      success: false,
      error:
        'ویرایش کاربر با خطا مواجه شد.',
    };
  }
}

export async function toggleUser(
  id: number,
  active: boolean
): Promise<UserActionResult> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        error:
          'برای انجام این عملیات باید وارد حساب کاربری شوید.',
      };
    }

    if (!canManageUsers(currentUser.role)) {
      return {
        success: false,
        error:
          'شما اجازه تغییر وضعیت کاربر را ندارید.',
      };
    }

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه کاربر نامعتبر است.',
      };
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          active: true,
        },
      });

    if (!user) {
      return {
        success: false,
        error:
          'کاربر موردنظر پیدا نشد.',
      };
    }

    if (
      user.id === 1 &&
      !active
    ) {
      return {
        success: false,
        error:
          'کاربر اصلی سیستم را نمی‌توان غیرفعال کرد.',
      };
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        active,
      },
    });

    return {
      success: true,
      userId: id,
    };
  } catch (error) {
    console.error(
      'toggleUser error:',
      error
    );

    return {
      success: false,
      error:
        'تغییر وضعیت کاربر با خطا مواجه شد.',
    };
  }
}

