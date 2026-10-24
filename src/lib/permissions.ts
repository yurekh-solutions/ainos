import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type Permissions = {
  /** Create and edit operational documents. Every employee can do this. */
  canWrite: boolean;
  /** Delete records. Owner/admin only — history must not be destroyed casually. */
  canDelete: boolean;
  /** Approve or refuse someone else's request. Owner/admin/manager only. */
  canApprove: boolean;
  isElevated: boolean;
  role: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  companyId: string;
};

type SessionOk = {
  error: null;
  user: SessionUser;
  companyId: string;
  permissions: Permissions;
  /** Kept for existing call sites: identical to `permissions.canDelete`. */
  canManage: boolean;
};

type SessionFail = { error: NextResponse };

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

/**
 * AINOS has three practical roles: owner/admin (full control), manager (can
 * approve but not delete) and member/employee (day-to-day data entry).
 */
export function permissionsFor(user: {
  email?: string | null;
  role?: string | null;
  isAdmin?: boolean | null;
}): Permissions {
  const role = (user.role || 'user').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const isElevated = Boolean(user.isAdmin) || role === 'owner' || role === 'admin' || adminEmails().includes(email);
  const isManager = role === 'manager' || role === 'accountant' || role === 'supervisor';

  return {
    canWrite: true,
    canDelete: isElevated,
    canApprove: isElevated || isManager,
    isElevated,
    role,
  };
}

export async function requireSession(req: NextRequest): Promise<SessionOk | SessionFail> {
  const session = await getServerSession(req);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, companyId: true, role: true, isAdmin: true, email: true, name: true },
  });

  if (!user?.companyId) {
    return { error: NextResponse.json({ error: 'Company not found' }, { status: 404 }) };
  }

  const permissions = permissionsFor(user);

  return {
    error: null,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      isAdmin: Boolean(user.isAdmin),
      companyId: user.companyId,
    },
    companyId: user.companyId,
    permissions,
    canManage: permissions.canDelete,
  };
}
