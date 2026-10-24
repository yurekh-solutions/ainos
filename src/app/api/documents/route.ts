import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CATEGORIES = ['contract', 'license', 'certificate', 'policy', 'other'];

async function context(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session?.user?.email) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true, role: true, isAdmin: true, email: true },
  });
  if (!user?.companyId) return { error: NextResponse.json({ error: 'Company not found' }, { status: 404 }) };

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const canManage = Boolean(
    user.isAdmin || ['owner', 'admin'].includes((user.role || '').toLowerCase()) || adminEmails.includes((user.email || '').toLowerCase()),
  );

  return { user, companyId: user.companyId, canManage };
}

function cleanDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value: Date | null): number | null {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export async function GET(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const search = (searchParams.get('q') || '').trim();

  try {
    const where: Record<string, unknown> = { companyId: ctx.companyId };
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.verificationStatus = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
        category: true,
        notes: true,
        expiryDate: true,
        uploadedBy: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    const rows = documents.map((doc) => ({
      ...doc,
      daysToExpiry: daysUntil(doc.expiryDate),
    }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expiringSoon = rows.filter((row) => row.daysToExpiry !== null && row.daysToExpiry >= 0 && row.daysToExpiry <= 30);
    const expired = rows.filter((row) => row.daysToExpiry !== null && row.daysToExpiry < 0);

    return NextResponse.json({
      documents: rows,
      summary: {
        total: rows.length,
        addedThisMonth: documents.filter((doc) => doc.createdAt >= monthStart).length,
        expiringSoon: expiringSoon.length,
        expired: expired.length,
      },
      canManage: ctx.canManage,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Could not load documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Document name is required' }, { status: 400 });

    const document = await prisma.document.create({
      data: {
        name,
        type: String(body.type || 'application/pdf'),
        url: body.url ? String(body.url).trim() : null,
        size: Number.isFinite(Number(body.size)) && Number(body.size) > 0 ? Math.round(Number(body.size)) : null,
        category: CATEGORIES.includes(body.category) ? body.category : 'other',
        notes: body.notes ? String(body.notes).trim() : null,
        expiryDate: cleanDate(body.expiryDate),
        uploadedBy: ctx.user.id,
        companyId: ctx.companyId,
        verificationStatus: 'pending',
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Could not create document' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;

  try {
    const body = await req.json();
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'Document id is required' }, { status: 400 });

    const existing = await prisma.document.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Document name is required' }, { status: 400 });

    const document = await prisma.document.update({
      where: { id },
      data: {
        name,
        category: CATEGORIES.includes(body.category) ? body.category : 'other',
        url: body.url ? String(body.url).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        expiryDate: cleanDate(body.expiryDate),
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Could not update document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req);
  if (ctx.error) return ctx.error;
  if (!ctx.canManage) return NextResponse.json({ error: 'Only an owner or admin can delete documents' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Document id is required' }, { status: 400 });

  try {
    const existing = await prisma.document.findFirst({ where: { id, companyId: ctx.companyId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Could not delete document' }, { status: 500 });
  }
}
