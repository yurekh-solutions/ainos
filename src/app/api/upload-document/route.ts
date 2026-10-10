import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const docType = formData.get('docType') as string;
    const companyId = formData.get('companyId') as string;

    if (!file || !docType || !companyId) {
      return NextResponse.json(
        { error: 'File, document type, and company ID are required' },
        { status: 400 }
      );
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 1MB' },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Determine Cloudinary resource type (PDF = raw)
    const resourceType = 'raw';

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique identifiers
    const timestamp = Date.now();
    const sanitizedDocType = docType.replace(/[^a-zA-Z0-9]/g, '_');
    const fileExtension = file.name.split('.').pop() || 'bin';
    const publicId = `${sanitizedDocType}_${timestamp}`;
    const folder = `ainos-docs/${companyId}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder, publicId, resourceType);

    // Create Document record in database
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: file.type,
        url: result.url,
        size: result.bytes,
        category: docType,
        uploadedBy: session.user.email,
        companyId,
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.url,
        cloudinaryThumbnail: result.thumbnailUrl,
        resourceType: result.resourceType,
        format: result.format,
        verificationStatus: 'pending',
      },
    });

    // Update company doc count
    await prisma.company.update({
      where: { id: companyId },
      data: {
        totalDocsUploaded: { increment: 1 },
        onboardingStatus: {
          // Move to docs_submitted if still pending
          set: undefined, // handled below
        },
      },
    });

    // Update onboarding status if company was pending
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { onboardingStatus: true },
    });
    if (company?.onboardingStatus === 'pending') {
      await prisma.company.update({
        where: { id: companyId },
        data: { onboardingStatus: 'docs_submitted' },
      });
    }

    // Create audit log
    await prisma.onboardingAudit.create({
      data: {
        companyId,
        action: 'docs_uploaded',
        performedBy: session.user.email,
        performedByName: session.user.name || session.user.email,
        notes: `Uploaded ${docType}: ${file.name}`,
        metadata: {
          documentId: document.id,
          docType,
          fileName: file.name,
          fileSize: result.bytes,
          cloudinaryPublicId: result.publicId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        url: document.url,
        thumbnailUrl: result.thumbnailUrl,
        size: document.size,
        category: document.category,
        verificationStatus: document.verificationStatus,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET: List documents for a company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const documents = await prisma.document.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
        category: true,
        cloudinaryUrl: true,
        cloudinaryThumbnail: true,
        resourceType: true,
        format: true,
        verificationStatus: true,
        rejectionReason: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
