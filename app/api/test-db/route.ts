import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany();

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully',
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.error('Database error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}