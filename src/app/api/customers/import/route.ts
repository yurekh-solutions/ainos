import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readContactRows } from '@/lib/finance/customerImport';
import { saveContact } from '@/lib/finance/customerBook';

// Imports a contact list and reports every row it refused.
//
// A sheet of five hundred names never arrives perfect: one line has a heading
// spelled differently, one has no name, one repeats somebody already in the
// book. Silently importing the good ones and saying "done" is what makes a
// spreadsheet untrustworthy, so each row is answered for — added, already
// there, or not readable, with the line number the reader can scroll to.

type RowOutcome = {
  row: number;
  name: string;
  reason?: string;
  filled?: string[];
  warnings?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json().catch(() => null);
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json({
        error: 'Nothing to import. The first sheet row needs headings like "Name", "Email", "Phone", "Company", "GSTIN".',
      }, { status: 400 });
    }

    const contacts = readContactRows(rows);
    if (contacts.length === 0) {
      return NextResponse.json({
        error: 'No row had a heading AINOS recognises. Download the template and keep its column names.',
      }, { status: 400 });
    }

    let created = 0, updated = 0, skipped = 0, failed = 0;
    const details: RowOutcome[] = [];
    const updatedDetails: RowOutcome[] = [];
    const skippedDetails: RowOutcome[] = [];
    const errorDetails: RowOutcome[] = [];

    for (const contact of contacts) {
      if (!contact.draft) {
        failed++;
        errorDetails.push({ row: contact.row, name: contact.name, reason: contact.problem ?? 'Not readable' });
        continue;
      }
      try {
        const saved = await saveContact(user.companyId, contact.draft, { status: contact.status });
        if (saved.action === 'created') {
          created++;
          details.push({ row: contact.row, name: saved.name, warnings: contact.warnings });
        } else if (saved.action === 'updated') {
          updated++;
          updatedDetails.push({ row: contact.row, name: saved.name, filled: saved.filled, warnings: contact.warnings });
        } else {
          // Same person, same details: counting them twice is the one thing an
          // import must never do.
          skipped++;
          skippedDetails.push({ row: contact.row, name: saved.name, reason: `${saved.name} is already in Customers` });
        }
      } catch (error) {
        failed++;
        errorDetails.push({
          row: contact.row,
          name: contact.name,
          reason: error instanceof Error ? error.message : 'Could not be saved',
        });
      }
    }

    return NextResponse.json({ created, updated, skipped, failed, details, updatedDetails, skippedDetails, errorDetails });
  } catch (error) {
    console.error('Customer import error:', error);
    const message = error instanceof Error ? error.message : 'Could not import the list';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
