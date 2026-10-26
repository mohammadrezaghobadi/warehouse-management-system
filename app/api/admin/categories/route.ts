import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories =
      await prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
        include: {
          products: {
            select: {
              id: true,
            },
          },
        },
      });

    return NextResponse.json(categories);
  } catch (error) {
    console.error(
      'Categories GET error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'دریافت دسته‌بندی‌ها با خطا مواجه شد.',
      },
      {
        status: 500,
      }
    );
  }
}