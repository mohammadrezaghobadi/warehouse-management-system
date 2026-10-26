import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import UsersClient from './UsersClient';

function UsersLoading() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-white" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-3xl bg-white"
            />
          ))}
        </div>

        <div className="h-[600px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function UsersContent() {
  const [users, departments] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.department.findMany({
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const serializedUsers = users.map(
    (user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active,
      department: user.department,
      createdAt: user.createdAt.toISOString(),
    })
  );

  return (
    <UsersClient
      initialUsers={serializedUsers}
      initialDepartments={departments}
    />
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersContent />
    </Suspense>
  );
}