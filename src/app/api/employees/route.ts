import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function asDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Payslip and bank-transfer values are identifiers, so they are normalised here
// once: no spaces, uppercase IFSC. A bad IFSC makes the bank reject the whole
// salary batch, so a clearly malformed one is refused instead of being stored.
function asAccountNumber(value: unknown): string | null {
  const text = String(value ?? '').replace(/[^A-Za-z0-9]/g, '');
  return text.length ? text.slice(0, 20) : null;
}

function asIfsc(value: unknown): string | null {
  const text = String(value ?? '').replace(/\s+/g, '').toUpperCase();
  return text.length ? text.slice(0, 11) : null;
}

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Returns an error message, or null when every payroll identity field is usable. */
function payrollFieldError(body: Record<string, unknown>): string | null {
  const ifsc = asIfsc(body.bankIfscCode);
  if (ifsc && !IFSC_PATTERN.test(ifsc)) {
    return 'IFSC code looks incomplete. It is 11 characters, like HDFC0001234.';
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const where: Record<string, unknown> = {};
    if (user?.companyId) where.companyId = user.companyId;
    if (department) where.department = department;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const invalid = payrollFieldError(body);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const employee = await prisma.employee.create({
      data: {
        name: body.name || 'Unnamed Employee',
        email: body.email || null,
        phone: body.phone || null,
        department: body.department || null,
        position: body.position || null,
        // An empty salary stays empty rather than becoming 0, so the payroll
        // engine reports "no salary set" instead of "salary is zero".
        salary: body.salary === null || body.salary === undefined || body.salary === ''
          ? null
          : Number(body.salary),
        joinDate: body.joinDate ? new Date(body.joinDate) : null,
        status: body.status || 'active',
        address: body.address || null,
        // Payroll identity - optional, so adding them never breaks an existing form.
        employeeCode: asText(body.employeeCode),
        bankName: asText(body.bankName),
        bankAccountNumber: asAccountNumber(body.bankAccountNumber),
        bankIfscCode: asIfsc(body.bankIfscCode),
        pfNumber: asText(body.pfNumber),
        esiNumber: asText(body.esiNumber),
        salaryStructure: body.salaryStructure
          ? (body.salaryStructure as Prisma.InputJsonValue)
          : Prisma.DbNull,
        companyId: user.companyId,
      }
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const body = await req.json();
    const id = asText(body.id);
    if (!id) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });

    // Tenant isolation: an employee can only be edited from the company that owns it.
    const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const invalid = payrollFieldError(body);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const data: Prisma.EmployeeUncheckedUpdateInput = {};

    const name = asText(body.name ?? body.employeeName);
    if (body.name !== undefined || body.employeeName !== undefined) {
      if (!name) return NextResponse.json({ error: 'Employee name cannot be empty' }, { status: 400 });
      data.name = name;
    }
    if (body.email !== undefined) data.email = asText(body.email);
    if (body.phone !== undefined) data.phone = asText(body.phone);
    if (body.department !== undefined) data.department = asText(body.department);

    const position = body.position ?? body.designation;
    if (body.position !== undefined || body.designation !== undefined) data.position = asText(position);

    if (body.salary !== undefined) {
      if (body.salary === null || body.salary === '') {
        data.salary = null;
      } else {
        const salary = Number(body.salary);
        if (!Number.isFinite(salary) || salary < 0) {
          return NextResponse.json({ error: 'Invalid salary' }, { status: 400 });
        }
        data.salary = salary;
      }
    }

    if (body.joinDate !== undefined || body.joiningDate !== undefined) {
      const raw = body.joinDate ?? body.joiningDate;
      if (raw === null || raw === '') {
        data.joinDate = null;
      } else {
        const joinDate = asDate(raw);
        if (!joinDate) return NextResponse.json({ error: 'Invalid joining date' }, { status: 400 });
        data.joinDate = joinDate;
      }
    }

    if (body.status !== undefined) {
      const status = asText(body.status);
      if (!status) return NextResponse.json({ error: 'Status cannot be empty' }, { status: 400 });
      data.status = status.toLowerCase();
    }

    if (body.address !== undefined) data.address = asText(body.address);
    if (body.bankDetails !== undefined) {
      data.bankDetails = body.bankDetails ? (body.bankDetails as Prisma.InputJsonValue) : Prisma.DbNull;
    }

    // Only fields the caller actually sent are touched, so editing a phone number
    // cannot wipe the salary structure that payroll depends on.
    if (body.employeeCode !== undefined) data.employeeCode = asText(body.employeeCode);
    if (body.bankName !== undefined) data.bankName = asText(body.bankName);
    if (body.bankAccountNumber !== undefined) data.bankAccountNumber = asAccountNumber(body.bankAccountNumber);
    if (body.bankIfscCode !== undefined) data.bankIfscCode = asIfsc(body.bankIfscCode);
    if (body.pfNumber !== undefined) data.pfNumber = asText(body.pfNumber);
    if (body.esiNumber !== undefined) data.esiNumber = asText(body.esiNumber);
    if (body.salaryStructure !== undefined) {
      data.salaryStructure = body.salaryStructure
        ? (body.salaryStructure as Prisma.InputJsonValue)
        : Prisma.DbNull;
    }

    if (Object.keys(data).length === 0) return NextResponse.json(existing);

    const employee = await prisma.employee.update({ where: { id }, data });
    return NextResponse.json(employee);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 });
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    }
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const id = asText(new URL(req.url).searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });

    const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
