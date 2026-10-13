import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

// Send onboarding notification email via Resend
async function sendOnboardingEmail(params: {
  to: string[];
  subject: string;
  html: string;
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) { console.warn('[Email] RESEND_API_KEY not set'); return; }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AINOS <onboarding@resend.dev>',
        to: params.to,
        cc: ['info.ainosio@gmail.com'],
        subject: params.subject,
        html: params.html,
      }),
    });
  } catch (err) {
    console.error('[Email] Failed to send:', err);
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
      select: { id: true, name: true, email: true, onboardingStatus: true },
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
    const companyUsers = await prisma.user.findMany({
      where: { companyId },
      select: { email: true, name: true },
    });
    const recipientEmails = companyUsers.map(u => u.email);
    if (company.email && !recipientEmails.includes(company.email)) {
      recipientEmails.push(company.email);
    }

    if (recipientEmails.length > 0) {
      if (action === 'approve') {
        await sendOnboardingEmail({
          to: recipientEmails,
          subject: `AINOS — Your Company "${company.name}" is Approved!`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
              <h2 style="color:#4c1d95;margin-bottom:16px;">🎉 Congratulations!</h2>
              <p style="color:#374151;line-height:1.6;">Your company <strong>${company.name}</strong> has been <strong style="color:#16a34a;">approved</strong> by the AINOS admin team.</p>
              <p style="color:#374151;line-height:1.6;">You can now <a href="https://ainos-ywu0.onrender.com/auth/signin" style="color:#4c1d95;font-weight:600;">sign in</a> and access your full dashboard.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
              <p style="color:#9ca3af;font-size:13px;">— AINOS Business Suite</p>
            </div>
          `,
        });
      } else if (action === 'reject') {
        await sendOnboardingEmail({
          to: recipientEmails,
          subject: `AINOS — Registration Update for "${company.name}"`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
              <h2 style="color:#dc2626;margin-bottom:16px;">Registration Update</h2>
              <p style="color:#374151;line-height:1.6;">Your company <strong>${company.name}</strong> registration has been <strong style="color:#dc2626;">rejected</strong>.</p>
              ${reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0;"><p style="color:#991b1b;margin:0;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
              <p style="color:#374151;line-height:1.6;">Please correct the issues and re-submit your documents. You can upload updated documents from your account.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
              <p style="color:#9ca3af;font-size:13px;">— AINOS Business Suite</p>
            </div>
          `,
        });
      } else if (action === 'resubmit') {
        await sendOnboardingEmail({
          to: recipientEmails,
          subject: `AINOS — Please Resubmit Documents for "${company.name}"`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
              <h2 style="color:#d97706;margin-bottom:16px;">Document Resubmission Required</h2>
              <p style="color:#374151;line-height:1.6;">The admin team has requested you to resubmit documents for <strong>${company.name}</strong>.</p>
              ${reason ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:16px 0;"><p style="color:#92400e;margin:0;"><strong>Note:</strong> ${reason}</p></div>` : ''}
              <p style="color:#374151;line-height:1.6;">Please log in and upload the required documents again.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
              <p style="color:#9ca3af;font-size:13px;">— AINOS Business Suite</p>
            </div>
          `,
        });
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
