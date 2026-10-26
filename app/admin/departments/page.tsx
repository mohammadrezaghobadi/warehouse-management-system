import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import DepartmentsClient from './DepartmentsClient';

function DepartmentsLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function DepartmentsContent() {
  const departments =
    await prisma.department.findMany({
      orderBy: {
        createdAt: 'desc',
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

  const serializedDepartments =
    departments.map((department) => ({
      id: department.id,
      name: department.name,
      userCount: department._count.users,
      requestCount: department._count.requests,
      createdAt: department.createdAt.toISOString(),
    }));

  return (
    <DepartmentsClient
      initialDepartments={serializedDepartments}
    />
  );
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={<DepartmentsLoading />}>
      <DepartmentsContent />
    </Suspense>
  );
}