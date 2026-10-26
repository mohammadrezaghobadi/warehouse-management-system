
'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

interface RequestItemInput {
  productId: number;
  requestedQuantity: number;
}

interface RequestInput {
  departmentId: number;
  description: string;
  items: RequestItemInput[];
}

interface RequestActionResult {
  success: boolean;
  error?: string;
  requestId?: number;
}

interface ApprovedItemInput {
  itemId: number;
  approvedQuantity: number;
}

function generateRequestNumber(): string {
  return `REQ-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

function validateItems(
  items: RequestItemInput[]
): string | null {
  if (!Array.isArray(items) || !items.length) {
    return 'حداقل یک کالا به درخواست اضافه کنید.';
  }

  const productIds = items.map(
    (item) => item.productId
  );

  if (
    new Set(productIds).size !==
    productIds.length
  ) {
    return 'یک کالا را نمی‌توان چند بار در یک درخواست اضافه کرد.';
  }

  for (const item of items) {
    if (
      !Number.isInteger(item.productId) ||
      item.productId <= 0
    ) {
      return 'کالای انتخاب‌شده نامعتبر است.';
    }

    if (
      !Number.isFinite(item.requestedQuantity) ||
      item.requestedQuantity <= 0
    ) {
      return 'مقدار درخواست باید بیشتر از صفر باشد.';
    }
  }

  return null;
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
      departmentId: true,
    },
  });

  if (!user || !user.active) {
    return null;
  }

  return user;
}

function canReviewRequests(role: string): boolean {
  return (
    role === 'ADMIN' ||
    role === 'SUPERVISOR'
  );
}

function canReviewDepartment(
  role: string,
  userDepartmentId: number | null,
  requestDepartmentId: number
): boolean {
  if (role === 'ADMIN') {
    return true;
  }

  return (
    role === 'SUPERVISOR' &&
    userDepartmentId === requestDepartmentId
  );
}

export async function createRequest(
  data: RequestInput
): Promise<RequestActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای ثبت درخواست ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (
      !Number.isInteger(data.departmentId) ||
      data.departmentId <= 0
    ) {
      return {
        success: false,
        error:
          'واحد سازمانی را انتخاب کنید.',
      };
    }

    const department =
      await prisma.department.findUnique({
        where: {
          id: data.departmentId,
        },
        select: {
          id: true,
        },
      });

    if (!department) {
      return {
        success: false,
        error:
          'واحد سازمانی پیدا نشد.',
      };
    }

    /*
     * کاربر عادی فقط می‌تواند برای واحد خودش
     * درخواست ثبت کند.
     *
     * ADMIN می‌تواند برای هر واحد درخواست ثبت کند.
     */
    if (
      user.role !== 'ADMIN' &&
      user.departmentId !== data.departmentId
    ) {
      return {
        success: false,
        error:
          'شما فقط می‌توانید برای واحد سازمانی خودتان درخواست ثبت کنید.',
      };
    }

    const validationError =
      validateItems(data.items);

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    const productIds = data.items.map(
      (item) => item.productId
    );

    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (
      products.length !==
      productIds.length
    ) {
      return {
        success: false,
        error:
          'یکی از کالاهای انتخاب‌شده وجود ندارد یا غیرفعال است.',
      };
    }

    const request =
      await prisma.request.create({
        data: {
          requestNumber:
            generateRequestNumber(),
          requesterId: user.id,
          departmentId:
            data.departmentId,
          status: 'PENDING',
          description:
            typeof data.description === 'string'
              ? data.description.trim() || null
              : null,
          items: {
            create: data.items.map(
              (item) => ({
                productId:
                  item.productId,
                requestedQuantity:
                  item.requestedQuantity,
                approvedQuantity: null,
                deliveredQuantity: 0,
              })
            ),
          },
        },
      });

    return {
      success: true,
      requestId: request.id,
    };
  } catch (error) {
    console.error(
      'createRequest error:',
      error
    );

    return {
      success: false,
      error:
        'ثبت درخواست با خطا مواجه شد.',
    };
  }
}

export async function approveRequest(
  requestId: number,
  approvedItems: ApprovedItemInput[]
): Promise<RequestActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای انجام این عملیات ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (!canReviewRequests(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه تأیید درخواست‌ها را ندارید.',
      };
    }

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه درخواست نامعتبر است.',
      };
    }

    if (
      !Array.isArray(approvedItems) ||
      !approvedItems.length
    ) {
      return {
        success: false,
        error:
          'حداقل یک قلم برای تأیید وجود داشته باشد.',
      };
    }

    const request =
      await prisma.request.findUnique({
        where: {
          id: requestId,
        },
        include: {
          items: true,
        },
      });

    if (!request) {
      return {
        success: false,
        error:
          'درخواست پیدا نشد.',
      };
    }

    if (request.status !== 'PENDING') {
      return {
        success: false,
        error:
          'این درخواست قبلاً بررسی شده است.',
      };
    }

    if (
      !canReviewDepartment(
        user.role,
        user.departmentId,
        request.departmentId
      )
    ) {
      return {
        success: false,
        error:
          'شما فقط می‌توانید درخواست‌های واحد خودتان را بررسی کنید.',
      };
    }

    const requestItemIds =
      new Set(
        request.items.map(
          (item) => item.id
        )
      );

    const approvedItemIds =
      new Set<number>();

    for (const item of approvedItems) {
      if (
        !Number.isInteger(item.itemId) ||
        item.itemId <= 0
      ) {
        return {
          success: false,
          error:
            'شناسه قلم درخواست نامعتبر است.',
        };
      }

      if (
        approvedItemIds.has(item.itemId)
      ) {
        return {
          success: false,
          error:
            'یک قلم را نمی‌توان چند بار تأیید کرد.',
        };
      }

      approvedItemIds.add(item.itemId);

      if (
        !requestItemIds.has(
          item.itemId
        )
      ) {
        return {
          success: false,
          error:
            'یکی از اقلام درخواست نامعتبر است.',
        };
      }

      if (
        !Number.isFinite(
          item.approvedQuantity
        ) ||
        item.approvedQuantity < 0
      ) {
        return {
          success: false,
          error:
            'مقدار تأییدشده نامعتبر است.',
        };
      }

      const originalItem =
        request.items.find(
          (requestItem) =>
            requestItem.id ===
            item.itemId
        );

      if (
        originalItem &&
        item.approvedQuantity >
          originalItem.requestedQuantity
      ) {
        return {
          success: false,
          error:
            'مقدار تأییدشده نمی‌تواند بیشتر از مقدار درخواستی باشد.',
        };
      }
    }

    await prisma.$transaction(
      async (tx) => {
        const currentRequest =
          await tx.request.findUnique({
            where: {
              id: requestId,
            },
            include: {
              items: true,
            },
          });

        if (!currentRequest) {
          throw new Error(
            'REQUEST_NOT_FOUND'
          );
        }

        if (
          currentRequest.status !==
          'PENDING'
        ) {
          throw new Error(
            'REQUEST_ALREADY_PROCESSED'
          );
        }

        if (
          !canReviewDepartment(
            user.role,
            user.departmentId,
            currentRequest.departmentId
          )
        ) {
          throw new Error(
            'REQUEST_FORBIDDEN'
          );
        }

        for (const item of currentRequest.items) {
          const approved =
            approvedItems.find(
              (entry) =>
                entry.itemId ===
                item.id
            );

          await tx.requestItem.update({
            where: {
              id: item.id,
            },
            data: {
              approvedQuantity:
                approved
                  ? approved.approvedQuantity
                  : 0,
            },
          });
        }

        const hasApprovedItem =
          approvedItems.some(
            (item) =>
              item.approvedQuantity > 0
          );

        await tx.request.update({
          where: {
            id: currentRequest.id,
          },
          data: {
            status: hasApprovedItem
              ? 'APPROVED'
              : 'REJECTED',
            approvedById: user.id,
            approvedAt:
              new Date(),
            rejectedReason:
              hasApprovedItem
                ? null
                : 'تمام اقلام درخواست رد شدند.',
          },
        });
      }
    );

    return {
      success: true,
      requestId,
    };
  } catch (error) {
    console.error(
      'approveRequest error:',
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          return {
            success: false,
            error:
              'درخواست پیدا نشد.',
          };

        case 'REQUEST_ALREADY_PROCESSED':
          return {
            success: false,
            error:
              'این درخواست قبلاً توسط کاربر دیگری بررسی شده است.',
          };

        case 'REQUEST_FORBIDDEN':
          return {
            success: false,
            error:
              'شما فقط می‌توانید درخواست‌های واحد خودتان را بررسی کنید.',
          };
      }
    }

    return {
      success: false,
      error:
        'تأیید درخواست با خطا مواجه شد.',
    };
  }
}

export async function rejectRequest(
  requestId: number,
  reason: string
): Promise<RequestActionResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای انجام این عملیات ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (!canReviewRequests(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه رد درخواست‌ها را ندارید.',
      };
    }

    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه درخواست نامعتبر است.',
      };
    }

    const cleanReason =
      typeof reason === 'string'
        ? reason.trim()
        : '';

    if (!cleanReason) {
      return {
        success: false,
        error:
          'برای رد درخواست دلیل وارد کنید.',
      };
    }

    if (cleanReason.length > 500) {
      return {
        success: false,
        error:
          'دلیل رد درخواست نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.',
      };
    }

    const request =
      await prisma.request.findUnique({
        where: {
          id: requestId,
        },
        select: {
          id: true,
          departmentId: true,
          status: true,
        },
      });

    if (!request) {
      return {
        success: false,
        error:
          'درخواست پیدا نشد.',
      };
    }

    if (request.status !== 'PENDING') {
      return {
        success: false,
        error:
          'این درخواست قبلاً بررسی شده است.',
      };
    }

    if (
      !canReviewDepartment(
        user.role,
        user.departmentId,
        request.departmentId
      )
    ) {
      return {
        success: false,
        error:
          'شما فقط می‌توانید درخواست‌های واحد خودتان را بررسی کنید.',
      };
    }

    await prisma.$transaction(
      async (tx) => {
        const currentRequest =
          await tx.request.findUnique({
            where: {
              id: requestId,
            },
            select: {
              id: true,
              departmentId: true,
              status: true,
            },
          });

        if (!currentRequest) {
          throw new Error(
            'REQUEST_NOT_FOUND'
          );
        }

        if (
          currentRequest.status !==
          'PENDING'
        ) {
          throw new Error(
            'REQUEST_ALREADY_PROCESSED'
          );
        }

        if (
          !canReviewDepartment(
            user.role,
            user.departmentId,
            currentRequest.departmentId
          )
        ) {
          throw new Error(
            'REQUEST_FORBIDDEN'
          );
        }

        await tx.request.update({
          where: {
            id: currentRequest.id,
          },
          data: {
            status: 'REJECTED',
            approvedById: user.id,
            approvedAt:
              new Date(),
            rejectedReason:
              cleanReason,
          },
        });
      }
    );

    return {
      success: true,
      requestId: request.id,
    };
  } catch (error) {
    console.error(
      'rejectRequest error:',
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          return {
            success: false,
            error:
              'درخواست پیدا نشد.',
          };

        case 'REQUEST_ALREADY_PROCESSED':
          return {
            success: false,
            error:
              'این درخواست قبلاً توسط کاربر دیگری بررسی شده است.',
          };

        case 'REQUEST_FORBIDDEN':
          return {
            success: false,
            error:
              'شما فقط می‌توانید درخواست‌های واحد خودتان را بررسی کنید.',
          };
      }
    }

    return {
      success: false,
      error:
        'رد درخواست با خطا مواجه شد.',
    };
  }
}

