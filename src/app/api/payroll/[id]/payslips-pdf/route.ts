import { NextRequest, NextResponse } from 'next/server';
import {
  PayrollError,
  loadPayrollSetup,
  payslipDocContext,
  payslipsForRun,
  resolvePayrollCompany,
} from '@/lib/payroll-run';
import { buildPayslipPdf, pdfResponse, safeName } from '@/lib/payroll-pdf';

type Context = { params: Promise<{ id: string }> };

// A page per employee in one PDF - the file an accountant attaches to the PF/ESI
// return or emails to the whole team at once.
//
//   ?employeeIds=a,b,c   limits the bundle to the chosen employees
const MAX_PAGES = 200;

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await resolvePayrollCompany(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const employeeIds = (searchParams.get('employeeIds') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_PAGES);

    const { payslips } = await payslipsForRun(user.companyId, id, employeeIds.length ? employeeIds : undefined);
    if (payslips.length > MAX_PAGES) {
      throw new PayrollError(
        `This run has ${payslips.length} payslips. Download them in batches of ${MAX_PAGES} using the checkboxes.`,
        400,
      );
    }

    const setup = await loadPayrollSetup(user.companyId);
    const doc = buildPayslipPdf(payslips, payslipDocContext(setup));
    const filename = `payslips-${safeName(payslips[0].period)}-${payslips.length}.pdf`;
    return pdfResponse(doc, filename);
  } catch (error) {
    if (error instanceof PayrollError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Error building payslip PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
