import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
          inventories: {
            select: {
              quantity: true,
            },
          },
        },
      });

    const result = products.map(
      (product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        minStock: product.minStock,
        maxStock: product.maxStock,
        active: product.active,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
            }
          : null,
        quantity:
          product.inventories.reduce(
            (total, inventory) =>
              total + inventory.quantity,
            0
          ),
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      'Products GET error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'دریافت کالاها با خطا مواجه شد.',
      },
      {
        status: 500,
      }
    );
  }
}