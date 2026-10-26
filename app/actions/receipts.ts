
'use server';

import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';

import {
  AUTH_COOKIE,
  verifySession,
} from '@/lib/aut';

interface ReceiptItemInput {
  productId: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: string;
  description: string;
}

interface ReceiptInput {
  warehouseId: number;
  supplier: string;
  purchaseNumber: string;
  description: string;
  items: ReceiptItemInput[];
}

interface ReceiptActionResult {
  success: boolean;
  error?: string;
  receiptId?: number;
}

function generateReceiptNumber() {
  return `GR-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
}

function validateItems(
  items: ReceiptItemInput[]
): string | null {
  if (!Array.isArray(items) || !items.length) {
    return 'حداقل یک کالا به قبض اضافه کنید.';
  }

  const productIds = items.map(
    (item) => item.productId
  );

  if (
    new Set(productIds).size !==
    productIds.length
  ) {
    return 'یک کالا را نمی‌توان چند بار در یک قبض اضافه کرد.';
  }

  for (const item of items) {
    if (
      !Number.isInteger(item.productId) ||
      item.productId <= 0
    ) {
      return 'کالای انتخاب‌شده نامعتبر است.';
    }

    if (
      !Number.isFinite(item.receivedQuantity) ||
      item.receivedQuantity <= 0
    ) {
      return 'مقدار دریافتی باید بیشتر از صفر باشد.';
    }

    if (
      !Number.isFinite(item.acceptedQuantity) ||
      item.acceptedQuantity < 0
    ) {
      return 'مقدار تأییدشده نامعتبر است.';
    }

    if (
      !Number.isFinite(item.rejectedQuantity) ||
      item.rejectedQuantity < 0
    ) {
      return 'مقدار مردود نامعتبر است.';
    }

    const total =
      item.acceptedQuantity +
      item.rejectedQuantity;

    if (
      Math.abs(
        total - item.receivedQuantity
      ) > 0.000001
    ) {
      return (
        'مجموع مقدار تأییدشده و مردود برای کالا باید برابر مقدار دریافتی باشد.'
      );
    }

    if (
      ![
        'ACCEPTED',
        'PARTIAL',
        'REJECTED',
      ].includes(item.qualityStatus)
    ) {
      return 'وضعیت کیفی کالا نامعتبر است.';
    }

    if (
      item.qualityStatus === 'ACCEPTED' &&
      item.rejectedQuantity > 0
    ) {
      return (
        'برای کالای دارای مقدار مردود، وضعیت کیفی را تغییر دهید.'
      );
    }

    if (
      item.qualityStatus === 'REJECTED' &&
      item.acceptedQuantity > 0
    ) {
      return (
        'برای کالای دارای مقدار تأییدشده، وضعیت کیفی را تغییر دهید.'
      );
    }

    if (
      item.qualityStatus === 'PARTIAL' &&
      (
        item.acceptedQuantity <= 0 ||
        item.rejectedQuantity <= 0
      )
    ) {
      return (
        'برای وضعیت کیفی «بخشی تأیید»، باید هم مقدار تأییدشده و هم مقدار مردود داشته باشید.'
      );
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

function canManageReceipts(
  role: string
) {
  return (
    role === 'ADMIN' ||
    role === 'WAREHOUSE'
  );
}

export async function createGoodsReceipt(
  data: ReceiptInput
): Promise<ReceiptActionResult> {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای ثبت قبض ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (!canManageReceipts(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه ثبت قبض انبار را ندارید.',
      };
    }

    if (
      !Number.isInteger(data.warehouseId) ||
      data.warehouseId <= 0
    ) {
      return {
        success: false,
        error: 'انبار را انتخاب کنید.',
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
        error: 'انبار پیدا نشد.',
      };
    }

    if (!warehouse.active) {
      return {
        success: false,
        error:
          'امکان ثبت قبض برای انبار غیرفعال وجود ندارد.',
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
          'یکی از کالاهای انتخاب‌شده وجود ندارد یا غیرفعال است.',
      };
    }

    const receipt =
      await prisma.goodsReceipt.create({
        data: {
          receiptNumber:
            generateReceiptNumber(),

          warehouseId:
            data.warehouseId,

          receivedById:
            user.id,

          supplier:
            data.supplier?.trim() || null,

          purchaseNumber:
            data.purchaseNumber?.trim() ||
            null,

          status: 'DRAFT',

          description:
            data.description?.trim() ||
            null,

          items: {
            create: data.items.map(
              (item) => ({
                productId:
                  item.productId,

                receivedQuantity:
                  item.receivedQuantity,

                acceptedQuantity:
                  item.acceptedQuantity,

                rejectedQuantity:
                  item.rejectedQuantity,

                qualityStatus:
                  item.qualityStatus,

                description:
                  item.description?.trim() ||
                  null,
              })
            ),
          },
        },
      });

    return {
      success: true,
      receiptId: receipt.id,
    };
  } catch (error) {
    console.error(
      'createGoodsReceipt error:',
      error
    );

    return {
      success: false,
      error:
        'ثبت قبض انبار با خطا مواجه شد.',
    };
  }
}

export async function finalizeGoodsReceipt(
  receiptId: number
): Promise<ReceiptActionResult> {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error:
          'برای نهایی‌کردن قبض ابتدا وارد حساب کاربری شوید.',
      };
    }

    if (!canManageReceipts(user.role)) {
      return {
        success: false,
        error:
          'شما اجازه نهایی‌کردن قبض انبار را ندارید.',
      };
    }

    if (
      !Number.isInteger(receiptId) ||
      receiptId <= 0
    ) {
      return {
        success: false,
        error:
          'شناسه قبض نامعتبر است.',
      };
    }

    const receipt =
      await prisma.goodsReceipt.findUnique({
        where: {
          id: receiptId,
        },
        include: {
          warehouse: true,
          items: true,
        },
      });

    if (!receipt) {
      return {
        success: false,
        error:
          'قبض انبار پیدا نشد.',
      };
    }

    if (receipt.status === 'FINAL') {
      return {
        success: false,
        error:
          'این قبض قبلاً نهایی شده است.',
      };
    }

    if (!receipt.warehouse.active) {
      return {
        success: false,
        error:
          'انبار این قبض غیرفعال است.',
      };
    }

    if (!receipt.items.length) {
      return {
        success: false,
        error:
          'قبض فاقد کالا است.',
      };
    }

    await prisma.$transaction(
      async (tx) => {
        const currentReceipt =
          await tx.goodsReceipt.findUnique({
            where: {
              id: receiptId,
            },
            include: {
              warehouse: true,
              items: true,
            },
          });

        if (!currentReceipt) {
          throw new Error(
            'RECEIPT_NOT_FOUND'
          );
        }

        if (
          currentReceipt.status ===
          'FINAL'
        ) {
          throw new Error(
            'RECEIPT_ALREADY_FINAL'
          );
        }

        if (
          !currentReceipt.warehouse.active
        ) {
          throw new Error(
            'WAREHOUSE_INACTIVE'
          );
        }

        if (
          !currentReceipt.items.length
        ) {
          throw new Error(
            'RECEIPT_EMPTY'
          );
        }

        const productIds =
          currentReceipt.items.map(
            (item) => item.productId
          );

        const activeProducts =
          await tx.product.findMany({
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
          activeProducts.length !==
          productIds.length
        ) {
          throw new Error(
            'PRODUCT_INACTIVE'
          );
        }

        for (
          const item of currentReceipt.items
        ) {
          if (
            !Number.isFinite(
              item.receivedQuantity
            ) ||
            item.receivedQuantity <= 0
          ) {
            throw new Error(
              'INVALID_RECEIVED_QUANTITY'
            );
          }

          if (
            !Number.isFinite(
              item.acceptedQuantity
            ) ||
            item.acceptedQuantity < 0
          ) {
            throw new Error(
              'INVALID_ACCEPTED_QUANTITY'
            );
          }

          if (
            !Number.isFinite(
              item.rejectedQuantity
            ) ||
            item.rejectedQuantity < 0
          ) {
            throw new Error(
              'INVALID_REJECTED_QUANTITY'
            );
          }

          const total =
            item.acceptedQuantity +
            item.rejectedQuantity;

          if (
            Math.abs(
              total -
                item.receivedQuantity
            ) > 0.000001
          ) {
            throw new Error(
              'INVALID_QUANTITY_TOTAL'
            );
          }

          if (
            ![
              'ACCEPTED',
              'PARTIAL',
              'REJECTED',
            ].includes(
              item.qualityStatus
            )
          ) {
            throw new Error(
              'INVALID_QUALITY_STATUS'
            );
          }

          if (
            item.qualityStatus ===
              'ACCEPTED' &&
            item.rejectedQuantity > 0
          ) {
            throw new Error(
              'INVALID_ACCEPTED_STATUS'
            );
          }

          if (
            item.qualityStatus ===
              'REJECTED' &&
            item.acceptedQuantity > 0
          ) {
            throw new Error(
              'INVALID_REJECTED_STATUS'
            );
          }

          if (
            item.qualityStatus ===
              'PARTIAL' &&
            (
              item.acceptedQuantity <= 0 ||
              item.rejectedQuantity <= 0
            )
          ) {
            throw new Error(
              'INVALID_PARTIAL_STATUS'
            );
          }

          if (
            item.acceptedQuantity <= 0
          ) {
            continue;
          }

          const inventory =
            await tx.inventory.findUnique({
              where: {
                productId_warehouseId: {
                  productId:
                    item.productId,

                  warehouseId:
                    currentReceipt.warehouseId,
                },
              },
            });

          if (inventory) {
            await tx.inventory.update({
              where: {
                id: inventory.id,
              },
              data: {
                quantity: {
                  increment:
                    item.acceptedQuantity,
                },
              },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId:
                  item.productId,

                warehouseId:
                  currentReceipt.warehouseId,

                quantity:
                  item.acceptedQuantity,
              },
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              productId:
                item.productId,

              warehouseId:
                currentReceipt.warehouseId,

              createdById:
                user.id,

              type: 'IN',

              quantity:
                item.acceptedQuantity,

              referenceType:
                'GOODS_RECEIPT',

              referenceId:
                currentReceipt.id,

              description:
                `ورود کالا از قبض ${currentReceipt.receiptNumber}`,
            },
          });
        }

        await tx.goodsReceipt.update({
          where: {
            id: currentReceipt.id,
          },
          data: {
            status: 'FINAL',
          },
        });
      }
    );

    return {
      success: true,
      receiptId,
    };
  } catch (error) {
    console.error(
      'finalizeGoodsReceipt error:',
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case 'RECEIPT_NOT_FOUND':
          return {
            success: false,
            error:
              'قبض انبار پیدا نشد.',
          };

        case 'RECEIPT_ALREADY_FINAL':
          return {
            success: false,
            error:
              'این قبض قبلاً توسط کاربر دیگری نهایی شده است.',
          };

        case 'WAREHOUSE_INACTIVE':
          return {
            success: false,
            error:
              'انبار این قبض غیرفعال است.',
          };

        case 'RECEIPT_EMPTY':
          return {
            success: false,
            error:
              'قبض فاقد کالا است.',
          };

        case 'PRODUCT_INACTIVE':
          return {
            success: false,
            error:
              'یکی از کالاهای قبض غیرفعال شده است.',
          };

        case 'INVALID_RECEIVED_QUANTITY':
          return {
            success: false,
            error:
              'مقدار دریافتی یکی از کالاها نامعتبر است.',
          };

        case 'INVALID_ACCEPTED_QUANTITY':
          return {
            success: false,
            error:
              'مقدار تأییدشده یکی از کالاها نامعتبر است.',
          };

        case 'INVALID_REJECTED_QUANTITY':
          return {
            success: false,
            error:
              'مقدار مردود یکی از کالاها نامعتبر است.',
          };

        case 'INVALID_QUANTITY_TOTAL':
          return {
            success: false,
            error:
              'مجموع مقدار تأییدشده و مردود باید برابر مقدار دریافتی باشد.',
          };

        case 'INVALID_QUALITY_STATUS':
          return {
            success: false,
            error:
              'وضعیت کیفی یکی از کالاها نامعتبر است.',
          };

        case 'INVALID_ACCEPTED_STATUS':
          return {
            success: false,
            error:
              'برای کالای دارای مقدار مردود، وضعیت کیفی باید اصلاح شود.',
          };

        case 'INVALID_REJECTED_STATUS':
          return {
            success: false,
            error:
              'برای کالای دارای مقدار تأییدشده، وضعیت کیفی باید اصلاح شود.',
          };

        case 'INVALID_PARTIAL_STATUS':
          return {
            success: false,
            error:
              'وضعیت «بخشی تأیید» نیاز به مقدار تأییدشده و مردود دارد.',
          };
      }
    }

    return {
      success: false,
      error:
        'نهایی‌سازی قبض انبار با خطا مواجه شد.',
    };
  }
}

