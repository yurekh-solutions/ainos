import { NextRequest, NextResponse } from 'next/server';
import {
  PayrollError,
  payslipsForRun,
  resolvePayrollCompany,
} from '@/lib/payroll-run';
import { bankTransferCsv, payrollRegisterCsv, safeName } from '@/lib/payroll-pdf';

type Context = { params: Promise<{ id: string }> };

// Spreadsheet exports of a payroll run.
//
//   ?type=bank      net payable per account - uploaded for bulk salary payment
//   ?type=register  every component of every slip - the CA / auditor sheet
//
// Both read the stored payslips, so the totals always match the PDFs an employee
// was given, even if master data changed afterwards.
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') === 'register' ? 'register' : 'bank';

    const { payslips } = await payslipsForRun(user.companyId, id);
    const csv = type === 'register' ? payrollRegisterCsv(payslips) : bankTransferCsv(payslips);
    const label = safeName(payslips[0].period);
    const filename = type === 'register' ? `payroll-register-${label}.csv` : `salary-transfer-${label}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof PayrollError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error exporting payroll CSV:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
