import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// Send email notification to company users
async function sendOnboardingEmail(
  companyEmail: string,
  companyName: string,
  action: 'approve' | 'reject' | 'resubmit' | 'suspend',
  reason?: string
) {
  try {
    const subjectMap = {
      approve: 'AINOS Onboarding Approved - Welcome Aboard!',
      reject: 'AINOS Onboarding Update - Action Required',
      resubmit: 'AINOS Onboarding - Please Resubmit Documents',
      suspend: 'AINOS Account Suspended',
    };

    const bodyMap = {
      approve: `
        <h2 style="color: #10b981;">Congratulations!</h2>
        <p>Your company <strong>${companyName}</strong> has been successfully verified and approved on AINOS.</p>
        <p>You now have full access to all features. Start exploring your dashboard!</p>
        <a href="https://ainos-ywu0.onrender.com/" style="display: inline-block; background: #5b21b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Go to Dashboard</a>
      `,
      reject: `
        <h2 style="color: #ef4444;">Onboarding Update</h2>
        <p>Unfortunately, your onboarding application for <strong>${companyName}</strong> was not approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact support if you have questions or would like to reapply.</p>
      `,
      resubmit: `
        <h2 style="color: #3b82f6;">Action Required</h2>
        <p>We need you to resubmit some documents for <strong>${companyName}</strong>.</p>
        ${reason ? `<p><strong>Details:</strong> ${reason}</p>` : ''}
        <p>Please log in to your dashboard and upload the required documents.</p>
        <a href="https://ainos-ywu0.onrender.com/" style="display: inline-block; background: #5b21b6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">Go to Dashboard</a>
      `,
      suspend: `
        <h2 style="color: #6b7280;">Account Suspended</h2>
        <p>Your account for <strong>${companyName}</strong> has been suspended.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please contact support for more information.</p>
      `,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AINOS <onboarding@resend.dev>',
        to: [companyEmail],
        cc: ['info.ainosio@gmail.com'],
        subject: subjectMap[action],
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #5b21b6; font-size: 28px; margin: 0;">AINOS</h1>
              <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">Business Suite</p>
            </div>
            <div style="background: #f9fafb; border-radius: 12px; padding: 32px;">
              ${bodyMap[action]}
            </div>
            <div style="text-align: center; margin-top: 32px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} AINOS by Yurekh. All rights reserved.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Failed to send email:', await res.text());
    }
  } catch (error) {
    console.error('Email send error:', error);
  }
}

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

    // Send email notification to company users
    const companyWithUsers = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: { select: { email: true } },
      },
    });

    if (companyWithUsers?.email) {
      await sendOnboardingEmail(
        companyWithUsers.email,
        companyWithUsers.name,
        action,
        reason
      );
    }

    // Also email all users of the company
    if (companyWithUsers?.users) {
      for (const user of companyWithUsers.users) {
        if (user.email && user.email !== companyWithUsers.email) {
          await sendOnboardingEmail(user.email, companyWithUsers.name, action, reason);
        }
      }
    }

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
