
import { Suspense } from 'react';

import { prisma } from '@/lib/prisma';

import IssuesClient from './IssuesClient';

function IssuesLoading() {
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

        <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
      </div>
    </main>
  );
}

async function IssuesContent() {
  const [issues, approvedRequests, warehouses] =
    await Promise.all([
      prisma.warehouseIssue.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          request: {
            select: {
              id: true,
              requestNumber: true,
              status: true,
              requester: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
          issuedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),

      prisma.request.findMany({
        where: {
          status: 'APPROVED',
          warehouseIssue: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      }),

      prisma.warehouse.findMany({
        where: {
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          location: true,
        },
      }),
    ]);

  const serializedIssues = issues.map(
    (issue) => ({
      id: issue.id,
      issueNumber: issue.issueNumber,
      requestId: issue.requestId,
      status: issue.status,
      description: issue.description,
      issueDate:
        issue.issueDate.toISOString(),
      createdAt:
        issue.createdAt.toISOString(),

      request: issue.request,

      warehouse: issue.warehouse,

      issuedBy: issue.issuedBy,

      items: issue.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.product,
      })),
    })
  );

  const serializedRequests =
    approvedRequests.map((request) => ({
      id: request.id,
      requestNumber:
        request.requestNumber,
      status: request.status,
      description:
        request.description,
      createdAt:
        request.createdAt.toISOString(),

      requester:
        request.requester,

      department:
        request.department,

      items: request.items.map(
        (item) => ({
          id: item.id,
          requestedQuantity:
            item.requestedQuantity,
          approvedQuantity:
            item.approvedQuantity,
          deliveredQuantity:
            item.deliveredQuantity,
          product:
            item.product,
        })
      ),
    }));

  return (
    <IssuesClient
      initialIssues={serializedIssues}
      initialRequests={serializedRequests}
      initialWarehouses={warehouses}
    />
  );
}

export default function IssuesPage() {
  return (
    <Suspense
      fallback={<IssuesLoading />}
    >
      <IssuesContent />
    </Suspense>
  );
}

