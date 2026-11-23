import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startTrial } from '@/lib/billing';
import { isValidVpa } from '@/lib/upi';

/**
 * Company profile handling.
 *
 * Two things used to be wrong here and both are fixed deliberately:
 *
 * 1. The body was spread straight into Prisma. A caller could therefore send
 *    `onboardingStatus: "approved"` or `docsVerified: true` and the database
 *    would write it - an approval gate that any logged-in account could open.
 *    Now only plain profile text is accepted, from an explicit list.
 * 2. The dashboard profile screen called this POST, which is the CREATE path.
 *    Saving a GSTIN could therefore mint a second company and re-point the user
 *    at it, leaving every invoice, customer and product behind on the old one.
 *    POST now only ever creates when the account has no company yet; otherwise
 *    it updates that account's own company, and editing goes through PUT.
 */

// Every field on the profile screen is free text. Keys absent from the request
// are left untouched, so one screen cannot blank another screen's values.
const TEXT_KEYS = [
  'name', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'country',
  'website', 'gstNumber', 'companyType', 'currency', 'bankName',
  'bankAccountNumber', 'bankIfscCode', 'accountHolder', 'upiId',
  'upiPayeeName',
] as const;

type TextKey = (typeof TEXT_KEYS)[number];

// pickText only ever produces plain text or null, and every column it writes is
// nullable except `name`, which the database requires. Keeping that split in the
// type is what stops an emptied box from writing a null business name.
type ProfileDraft =
  Partial<Record<Exclude<TextKey, 'name'> | 'taxId' | 'logoUrl', string | null>> & { name?: string };

// A logo saved from the profile screen arrives as a data: URL, which is far
// longer than ordinary profile text. It is capped at roughly the same size the
// screen already refuses (2MB), so a logo is never silently cut in half.
const LOGO_LIMIT = 3_000_000;

function pickText(body: Record<string, unknown>): { data: ProfileDraft; blankName: boolean } {
  const data: ProfileDraft = {};
  let blankName = false;
  for (const key of TEXT_KEYS) {
    const raw = body[key];
    if (raw === undefined || raw === null) continue;
    const value = String(raw).replace(/[\r\n]+/g, ' ').trim().slice(0, 400);
    if (key === 'name') {
      if (value === '') blankName = true;
      else data.name = value;
      continue;
    }
    // An empty box means "remove this", not "keep the old one".
    (data as Record<Exclude<TextKey, 'name'>, string | null>)[key] = value === '' ? null : value;
  }
  if (body.logoUrl !== undefined && body.logoUrl !== null) {
    const logo = String(body.logoUrl).trim();
    const looksLikeImage = logo.startsWith('data:image/') || /^https?:\/\//i.test(logo);
    data.logoUrl = logo === '' || !looksLikeImage ? null : logo.slice(0, LOGO_LIMIT);
  }
  // The screen calls it panNumber; the column that Finance reads is taxId.
  const pan = body.panNumber !== undefined ? String(body.panNumber) : (body.taxId !== undefined ? String(body.taxId) : null);
  if (pan !== null) {
    const cleaned = pan.trim().toUpperCase().slice(0, 10);
    data.taxId = cleaned === '' ? null : cleaned;
  }
  if (typeof data.upiId === 'string') data.upiId = data.upiId.toLowerCase();
  return { data, blankName };
}

/**
 * Only checks what would otherwise cost the owner money or a rejected bank
 * file: a wrong GSTIN breaks e-filing, a wrong UPI id sends customer payments
 * to somebody else, a wrong IFSC bounces a salary upload.
 */
function profileFieldError(data: ProfileDraft): string | null {
  const gst = typeof data.gstNumber === 'string' ? data.gstNumber.toUpperCase() : '';
  if (gst && !/^[0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][A-Z0-9]{5}$/.test(gst)) {
    return 'The GSTIN does not look right. It is the 15 characters printed on your registration, like 27AAACT2727Q1ZW.';
  }
  const pan = typeof data.taxId === 'string' ? data.taxId.toUpperCase() : '';
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return 'The PAN does not look right. It is 5 letters, 4 digits and 1 letter, like ABCDE1234F.';
  }
  const ifsc = typeof data.bankIfscCode === 'string' ? data.bankIfscCode.toUpperCase() : '';
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return 'The IFSC looks incomplete. It is 11 characters, like HDFC0001234.';
  }
  const pin = typeof data.pincode === 'string' ? data.pincode.replace(/\s+/g, '') : '';
  if (pin && !/^[1-9]\d{5}$/.test(pin)) {
    return 'The PIN code should be the 6-digit postal code, like 400001.';
  }
  const vpa = typeof data.upiId === 'string' ? data.upiId : '';
  if (vpa && !isValidVpa(vpa)) {
    return 'The UPI id looks incomplete. It should look like businessname@bank.';
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      // A Google sign-in can carry a valid session a moment before any row
      // exists, and this is the route that gives that person a company.
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: (session.user.name || session.user.email.split('@')[0]) as string,
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { data, blankName } = pickText(body as Record<string, unknown>);
    if (blankName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    const invalid = profileFieldError(data);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    // An account owns exactly one company, so a caller that already has one is
    // describing that same company again - update it instead of creating a
    // second one that would orphan everything sitting on the first.
    if (user.companyId) {
      const existing = await prisma.company.update({
        where: { id: user.companyId },
        data,
      });
      return NextResponse.json(existing);
    }

    if (!data.name) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }

    const createData: Prisma.CompanyUncheckedCreateInput = {
      ...data,
      // Proven non-empty by the check above; naming it here is only to satisfy
      // the compiler that a required column really is present.
      name: data.name ?? '',
      createdBy: user.id,
    };
    const company = await prisma.company.create({ data: createData });

    await prisma.user.update({ where: { id: user.id }, data: { companyId: company.id } });

    // Start 14-day AINOS One trial for new company
    try {
      await startTrial(company.id, user.id);
    } catch (e) {
      console.error('Failed to start trial:', e);
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    let companyId: string | null = null;
    let data: Prisma.CompanyUncheckedUpdateInput;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      companyId = user?.companyId || null;
      if (!companyId) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      const profile = await req.json().catch(() => ({}));
      const draft = pickText(profile as Record<string, unknown>);
      if (draft.blankName) {
        return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
      }
      const invalid = profileFieldError(draft.data);
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
      data = draft.data;
    } else {
      // Pre-approval fallback: the register flow attaches uploadedDocs before any
      // session exists, using the token issued at registration. A token caller has
      // no session at all, so document attachment is the only thing it may write -
      // never the profile, never an approval flag.
      const uploadToken = req.headers.get('x-upload-token');
      if (!uploadToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const tokenCompany = await prisma.company.findFirst({
        where: { uploadToken },
        select: { id: true },
      });
      if (!tokenCompany) {
        return NextResponse.json({ error: 'Invalid upload token' }, { status: 401 });
      }
      companyId = tokenCompany.id;
      const docs = await req.json().catch(() => ({}));
      data = { uploadedDocs: (docs as { uploadedDocs?: unknown }).uploadedDocs as Prisma.InputJsonValue };
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      // Nothing outside the whitelist can reach the database, so onboarding
      // flags and tokens are unreachable from this route.
      data,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
