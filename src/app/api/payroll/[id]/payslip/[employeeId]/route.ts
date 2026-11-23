import { NextRequest, NextResponse } from 'next/server';
import {
  PayrollError,
  loadPayrollSetup,
  payslipDocContext,
  payslipsForRun,
  resolvePayrollCompany,
} from '@/lib/payroll-run';
import { buildPayslipPdf, pdfResponse, safeName } from '@/lib/payroll-pdf';

type Context = { params: Promise<{ id: string; employeeId: string }> };

// One employee's payslip.
//
//   GET                     -> the stored breakdown as JSON (the on-screen slip)
//   GET ?format=pdf         -> the printable A4 payslip
//
// The PDF is drawn from the stored row, so what an employee downloads today is
// the same document whether their salary has changed since or not.
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, employeeId } = await params;
    const { payslips } = await payslipsForRun(user.companyId, id, [employeeId]);
    const slip = payslips[0];

    const wantPdf = new URL(req.url).searchParams.get('format') === 'pdf';
    if (!wantPdf) return NextResponse.json(slip);

    const setup = await loadPayrollSetup(user.companyId);
    const doc = buildPayslipPdf([slip], payslipDocContext(setup));
    const filename = `payslip-${safeName(slip.employeeName)}-${safeName(slip.period)}.pdf`;
    return pdfResponse(doc, filename);
  } catch (error) {
    if (error instanceof PayrollError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error serving payslip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
