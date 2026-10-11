import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// POST /api/admin/onboarding/[companyId] — approve or reject a company's onboarding
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;
    const body = await req.json();
    const { action, reason, documentIds } = body as {
      action: 'approve' | 'reject' | 'resubmit' | 'suspend';
      reason?: string;
      documentIds?: string[];
    };

    if (!action || !['approve', 'reject', 'resubmit', 'suspend'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, resubmit, or suspend' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, onboardingStatus: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Map action to onboarding status
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      resubmit: 'pending',
      suspend: 'suspended',
    };

    const newStatus = statusMap[action];

    // Update company onboarding status
    await prisma.company.update({
      where: { id: companyId },
      data: {
        onboardingStatus: newStatus,
        docsVerified: action === 'approve',
        docsVerifiedAt: action === 'approve' ? new Date() : undefined,
        docsVerifiedBy: action === 'approve' ? session.user.email : undefined,
        onboardingReviewedAt: new Date(),
        onboardingReviewedBy: session.user.email,
        onboardingRejectionReason: action === 'reject' ? reason : action === 'approve' ? null : undefined,
      },
    });

    // If specific documents are being approved/rejected
    if (documentIds && documentIds.length > 0) {
      const docStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
      await prisma.document.updateMany({
        where: { id: { in: documentIds } },
        data: {
          verificationStatus: docStatus,
          verifiedBy: session.user.email,
          verifiedAt: new Date(),
          rejectionReason: action === 'reject' ? reason : null,
        },
      });

      // Update approved doc count
      const approvedCount = await prisma.document.count({
        where: { companyId, verificationStatus: 'approved' },
      });
      await prisma.company.update({
        where: { id: companyId },
        data: { totalDocsApproved: approvedCount },
      });
    } else if (action === 'approve') {
      // Approve ALL pending documents for this company
      const pendingDocs = await prisma.document.findMany({
        where: { companyId, verificationStatus: 'pending' },
        select: { id: true },
      });

      if (pendingDocs.length > 0) {
        await prisma.document.updateMany({
          where: { companyId, verificationStatus: 'pending' },
          data: {
            verificationStatus: 'approved',
            verifiedBy: session.user.email,
            verifiedAt: new Date(),
          },
        });

        const totalApproved = await prisma.document.count({
          where: { companyId, verificationStatus: 'approved' },
        });
        await prisma.company.update({
          where: { id: companyId },
          data: { totalDocsApproved: totalApproved },
        });
      }
    }

    // Create audit log entry
    await prisma.onboardingAudit.create({
      data: {
        companyId,
        action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'resubmit' ? 'resubmit_requested' : 'suspended',
        performedBy: session.user.email,
        performedByName: session.user.name || session.user.email,
        notes: reason || `Company ${action}d by admin`,
        metadata: {
          previousStatus: company.onboardingStatus,
          newStatus,
          documentIds: documentIds || [],
          action,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Company ${action}d successfully`,
      company: { id: companyId, name: company.name, status: newStatus },
    });
  } catch (error) {
    console.error('Error processing onboarding action:', error);
    return NextResponse.json(
      { error: 'Failed to process onboarding action' },
      { status: 500 }
    );
  }
}

// GET /api/admin/onboarding/[companyId] — get detailed company + documents for review
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { companyId } = await params;

    const [company, documents, audits] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          website: true,
          country: true,
          companyType: true,
          gstNumber: true,
          taxId: true,
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
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.document.findMany({
        where: { companyId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.onboardingAudit.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      company,
      documents,
      audits,
    });
  } catch (error) {
    console.error('Error fetching company review data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review data' },
      { status: 500 }
    );
  }
}
