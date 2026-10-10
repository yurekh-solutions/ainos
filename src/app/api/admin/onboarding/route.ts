import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// GET /api/admin/onboarding — list all companies with onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // filter by onboarding status
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, string> = {};
    if (status && status !== 'all') {
      where.onboardingStatus = status;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          companyType: true,
          onboardingStatus: true,
          onboardingSubmittedAt: true,
          onboardingRejectionReason: true,
          onboardingReviewedAt: true,
          onboardingReviewedBy: true,
          totalDocsUploaded: true,
          totalDocsApproved: true,
          docsVerified: true,
          createdAt: true,
          createdBy: true,
          _count: {
            select: {
              documents: true,
              users: true,
            },
          },
        },
        orderBy: [
          { onboardingStatus: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch onboarding data' },
      { status: 500 }
    );
  }
}
