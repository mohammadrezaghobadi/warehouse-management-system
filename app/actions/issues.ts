
'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

interface IssueItemInput {
  productId: number;
  quantity: number;
}

interface IssueInput {
  requestId: number;
  warehouseId: number;
  description: string;
  items: IssueItemInput[];
}

interface IssueActionResult {
  success: boolean;
  error?: string;
  issueId?: number;
}

function generateIssueNumber(): string {
  return `WI-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

function validateItems(
  items: IssueItemInput[]
): string | null {
  if (!Array.isArray(items) || !items.length) {
    return 'حداقل یک کالا را برای حواله انتخاب کنید.';
  }

  const productIds = new Set<number>();

  for (const item of items) {
    if (
      !Number.isInteger(item.productId) ||
      item.productId <= 0
    ) {
      return 'کالای انتخاب‌شده نامعتبر است.';
    }

    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return 'مقدار تحویل باید بیشتر از صفر باشد.';
    }

    if (productIds.has(item.productId)) {
      return 'یک کالا را نمی‌توان چند بار در یک حواله اضافه کرد.';
    }

    productIds.add(item.productId);
  }

  return null;
}

async function getCurrentUser() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session =
    await verifySession(token);

  if (!session) {
    return null;
  }

  const user =
    await prisma.user.findUnique({
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

function canManageIssues(
  role: string
): boolean {
  return (
    role === 'ADMIN' ||
    role === 'WAREHOUSE'
  );
}

export async function createWarehouseIssue(
  data: IssueInput
): Promise<IssueActionResult> {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای صدور حواله ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (!canManageIssues(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه صدور حواله انبار را ندارید.',
      };
    }

    if (
      !Number.isInteger(data.requestId) ||
      data.requestId <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه درخواست نامعتبر است.',
      };
    }

    if (
      !Number.isInteger(data.warehouseId) ||
      data.warehouseId <= 0
    ) {
      return {
        success: false,
        error:
          'انبار را انتخاب کنید.',
      };
    }

    const itemsValidationError =
      validateItems(data.items);

    if (itemsValidationError) {
      return {
        success: false,
        error:
          itemsValidationError,
      };
    }

    const warehouse =
      await prisma.warehouse.findUnique({
        where: {
          id: data.warehouseId,
        },
        select: {
          id: true,
          active: true,
        },
      });

    if (!warehouse) {
      return {
        success: false,
        error:
          'انبار پیدا نشد.',
      };
    }

    if (!warehouse.active) {
      return {
        success: false,
        error:
          'امکان صدور حواله از انبار غیرفعال وجود ندارد.',
      };
    }

    const request =
      await prisma.request.findUnique({
        where: {
          id: data.requestId,
        },
        include: {
          items: true,
          warehouseIssue: true,
        },
      });

    if (!request) {
      return {
        success: false,
        error:
          'درخواست پیدا نشد.',
      };
    }

    if (request.status !== 'APPROVED') {
      return {
        success: false,
        error:
          'فقط درخواست‌های تأییدشده قابل صدور حواله هستند.',
      };
    }

    if (request.warehouseIssue) {
      return {
        success: false,
        error:
          'برای این درخواست قبلاً حواله صادر شده است.',
      };
    }

    const requestItemsMap =
      new Map(
        request.items.map(
          (item) => [
            item.productId,
            item,
          ]
        )
      );

    for (const item of data.items) {
      const requestItem =
        requestItemsMap.get(
          item.productId
        );

      if (!requestItem) {
        return {
          success: false,
          error:
            'یکی از کالاها متعلق به این درخواست نیست.',
        };
      }

      const approvedQuantity =
        requestItem.approvedQuantity ??
        0;

      const remainingQuantity =
        approvedQuantity -
        requestItem.deliveredQuantity;

      if (
        item.quantity >
        remainingQuantity
      ) {
        return {
          success: false,
          error:
            'مقدار تحویل برای کالا بیشتر از مقدار باقی‌مانده است.',
        };
      }
    }

    const productIds =
      data.items.map(
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
          'یکی از کالاها وجود ندارد یا غیرفعال است.',
      };
    }

    const issue =
      await prisma.$transaction(
        async (tx) => {
          const currentWarehouse =
            await tx.warehouse.findUnique({
              where: {
                id: data.warehouseId,
              },
              select: {
                id: true,
                active: true,
              },
            });

          if (!currentWarehouse) {
            throw new Error(
              'WAREHOUSE_NOT_FOUND'
            );
          }

          if (!currentWarehouse.active) {
            throw new Error(
              'WAREHOUSE_INACTIVE'
            );
          }

          const currentRequest =
            await tx.request.findUnique({
              where: {
                id: data.requestId,
              },
              include: {
                items: true,
                warehouseIssue: true,
              },
            });

          if (!currentRequest) {
            throw new Error(
              'REQUEST_NOT_FOUND'
            );
          }

          if (
            currentRequest.status !==
            'APPROVED'
          ) {
            throw new Error(
              'REQUEST_NOT_APPROVED'
            );
          }

          if (
            currentRequest.warehouseIssue
          ) {
            throw new Error(
              'ISSUE_ALREADY_EXISTS'
            );
          }

          for (const item of data.items) {
            const requestItem =
              currentRequest.items.find(
                (requestItem) =>
                  requestItem.productId ===
                  item.productId
              );

            if (!requestItem) {
              throw new Error(
                'INVALID_REQUEST_ITEM'
              );
            }

            const approvedQuantity =
              requestItem.approvedQuantity ??
              0;

            const remainingQuantity =
              approvedQuantity -
              requestItem.deliveredQuantity;

            if (
              item.quantity >
              remainingQuantity
            ) {
              throw new Error(
                'QUANTITY_EXCEEDED'
              );
            }

            const inventory =
              await tx.inventory.findUnique({
                where: {
                  productId_warehouseId: {
                    productId:
                      item.productId,
                    warehouseId:
                      data.warehouseId,
                  },
                },
              });

            if (!inventory) {
              throw new Error(
                'NO_INVENTORY'
              );
            }

            if (
              inventory.quantity <
              item.quantity
            ) {
              throw new Error(
                'INSUFFICIENT_STOCK'
              );
            }
          }

          const createdIssue =
            await tx.warehouseIssue.create({
              data: {
                issueNumber:
                  generateIssueNumber(),
                requestId:
                  data.requestId,
                warehouseId:
                  data.warehouseId,
                issuedById:
                  user.id,
                status: 'FINAL',
                description:
                  typeof data.description ===
                  'string'
                    ? data.description.trim() ||
                      null
                    : null,
                items: {
                  create:
                    data.items.map(
                      (item) => ({
                        productId:
                          item.productId,
                        quantity:
                          item.quantity,
                      })
                    ),
                },
              },
            });

          for (const item of data.items) {
            await tx.inventory.update({
              where: {
                productId_warehouseId: {
                  productId:
                    item.productId,
                  warehouseId:
                    data.warehouseId,
                },
              },
              data: {
                quantity: {
                  decrement:
                    item.quantity,
                },
              },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId:
                  item.productId,
                warehouseId:
                  data.warehouseId,
                createdById:
                  user.id,
                type: 'OUT',
                quantity:
                  item.quantity,
                referenceType:
                  'WAREHOUSE_ISSUE',
                referenceId:
                  createdIssue.id,
                description:
                  `خروج کالا بابت حواله ${createdIssue.issueNumber}`,
              },
            });

            const requestItem =
              currentRequest.items.find(
                (requestItem) =>
                  requestItem.productId ===
                  item.productId
              );

            if (!requestItem) {
              throw new Error(
                'INVALID_REQUEST_ITEM'
              );
            }

            await tx.requestItem.update({
              where: {
                id: requestItem.id,
              },
              data: {
                deliveredQuantity: {
                  increment:
                    item.quantity,
                },
              },
            });
          }

          const updatedRequestItems =
            await tx.requestItem.findMany({
              where: {
                requestId:
                  currentRequest.id,
              },
            });

          const fullyDelivered =
            updatedRequestItems.every(
              (item) => {
                const approved =
                  item.approvedQuantity ??
                  0;

                return (
                  item.deliveredQuantity >=
                  approved
                );
              }
            );

          if (fullyDelivered) {
            await tx.request.update({
              where: {
                id: currentRequest.id,
              },
              data: {
                status:
                  'DELIVERED',
              },
            });
          }

          return createdIssue;
        }
      );

    return {
      success: true,
      issueId: issue.id,
    };
  } catch (error) {
    console.error(
      'createWarehouseIssue error:',
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case 'WAREHOUSE_NOT_FOUND':
          return {
            success: false,
            error:
              'انبار پیدا نشد.',
          };

        case 'WAREHOUSE_INACTIVE':
          return {
            success: false,
            error:
              'امکان صدور حواله از انبار غیرفعال وجود ندارد.',
          };

        case 'REQUEST_NOT_FOUND':
          return {
            success: false,
            error:
              'درخواست پیدا نشد.',
          };

        case 'REQUEST_NOT_APPROVED':
          return {
            success: false,
            error:
              'این درخواست دیگر در وضعیت تأییدشده نیست.',
          };

        case 'ISSUE_ALREADY_EXISTS':
          return {
            success: false,
            error:
              'برای این درخواست قبلاً حواله صادر شده است.',
          };

        case 'INVALID_REQUEST_ITEM':
          return {
            success: false,
            error:
              'یکی از کالاهای حواله با درخواست مطابقت ندارد.',
          };

        case 'QUANTITY_EXCEEDED':
          return {
            success: false,
            error:
              'مقدار تحویل بیشتر از مقدار تأییدشده یا باقی‌مانده است.',
          };

        case 'NO_INVENTORY':
          return {
            success: false,
            error:
              'برای یکی از کالاها در این انبار موجودی ثبت نشده است.',
          };

        case 'INSUFFICIENT_STOCK':
          return {
            success: false,
            error:
              'موجودی انبار برای یکی از کالاها کافی نیست.',
          };
      }
    }

    return {
      success: false,
      error:
        'ثبت حواله انبار با خطا مواجه شد.',
    };
  }
}

