import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      companyName,
      companyType,
      companyEmail,
      companyPhone,
      companyAddress,
      country,
      gstNumber,
      documents,
    } = body;

    // Validate required user fields
    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Name, email, password, and company name are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company with all details
    const company = await prisma.company.create({
      data: {
        name: companyName,
        email: companyEmail || email,
        phone: companyPhone,
        address: companyAddress,
        country: country || 'India',
        companyType: companyType || null,
        gstNumber: gstNumber || null,
        uploadedDocs: documents && Object.keys(documents).length > 0 ? documents : null,
        createdBy: email,
        // All tools disabled by default
        autoBlog: false,
        invoiceGen: false,
        crmAccess: false,
        inventoryMgmt: false,
        hrPayroll: false,
        emailMarketing: false,
        aiAssistant: false,
        websiteGen: false,
        // Subscription status
        subscriptionStatus: 'inactive',
      },
    });

    // Create user with owner role, linked to company
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: 'owner',
        companyId: company.id,
        country: country || 'India',
      },
    });

    // Create initial credit balance for the company
    await prisma.creditBalance.create({
      data: {
        companyId: company.id,
        balance: 100, // Welcome credits
      },
    });

    return NextResponse.json(
      {
        message: 'Company registered successfully',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          companyType: company.companyType,
          country: company.country,
          subscriptionStatus: company.subscriptionStatus,
          tools: {
            autoBlog: company.autoBlog,
            invoiceGen: company.invoiceGen,
            crmAccess: company.crmAccess,
            inventoryMgmt: company.inventoryMgmt,
            hrPayroll: company.hrPayroll,
            emailMarketing: company.emailMarketing,
            aiAssistant: company.aiAssistant,
            websiteGen: company.websiteGen,
          },
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register-company error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
