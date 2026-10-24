import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendEmail, welcomeEmailTemplate } from '@/lib/email';
import { findUserByEmail, normalizeEmail, normalizePhone } from '@/lib/identity';
import { readVerificationProof } from '@/lib/verification';
import { startTrial } from '@/lib/billing';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
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
      emailProof,
    } = body;

    const email = normalizeEmail(String(body.email || ''));
    const normalizedPhone = normalizePhone(String(phone || ''));

    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: 'Name, email, password, and company name are required' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // ── Verification gate ────────────────────────────────────────────────────
    // Every account must prove it owns the email address. The phone number is
    // collected for contact purposes but does not require OTP verification.
    const emailVerification = readVerificationProof(emailProof);
    if (
      !emailVerification ||
      emailVerification.channel !== 'email' ||
      emailVerification.purpose !== 'signup_email' ||
      emailVerification.target !== email
    ) {
      return NextResponse.json(
        {
          error: 'Please verify your email address before submitting the application.',
          code: 'EMAIL_NOT_VERIFIED',
        },
        { status: 400 },
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser?.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifiedAt = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail ? normalizeEmail(String(companyEmail)) : email,
          phone: companyPhone || normalizedPhone || null,
          address: companyAddress,
          country: country || 'India',
          companyType: companyType || null,
          gstNumber: gstNumber || null,
          uploadedDocs: documents && Object.keys(documents).length > 0 ? documents : null,
          createdBy: email,
          // Trial access by default (0=locked, 1=basic, 2=subscribed, 3=premium)
          autoBlog: 1,
          invoiceGen: 1,
          crmAccess: 1,
          inventoryMgmt: 1,
          hrPayroll: 1,
          emailMarketing: 1,
          aiAssistant: 1,
          websiteGen: 1,
          subscriptionStatus: 'trialing',
          onboardingStatus: 'pending',
          // One-time token so the pre-approval document upload works without a session
          uploadToken: crypto.randomUUID(),
        },
      });

      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: existingUser.name || name,
              email,
              phone: normalizedPhone || null,
              password: hashedPassword,
              role: 'owner',
              companyId: company.id,
              country: country || 'India',
              emailVerifiedAt: verifiedAt,
              phoneVerifiedAt: null,
            },
          })
        : await tx.user.create({
            data: {
              name,
              email,
              phone: normalizedPhone || null,
              password: hashedPassword,
              role: 'owner',
              companyId: company.id,
              country: country || 'India',
              emailVerifiedAt: verifiedAt,
              phoneVerifiedAt: null,
            },
          });

      await tx.creditBalance.create({
        data: { companyId: company.id, balance: 100 },
      });

      return { company, user };
    });

    const { company, user } = result;

    // Subscription creation is best-effort — tool levels remain the primary access gate.
    try {
      await startTrial(company.id, user.id);
    } catch (trialError) {
      console.error('Trial creation failed (non-blocking):', trialError);
    }

    // Welcome email is best-effort — a mail failure must not fail signup.
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to AINOS Business Suite!',
        html: welcomeEmailTemplate(name, companyName),
      });
      console.log(`[Auth] Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('[Auth] Welcome email failed:', emailError);
    }

    return NextResponse.json(
      {
        message: 'Company registered successfully',
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          uploadToken: company.uploadToken,
          companyType: company.companyType,
          country: company.country,
          subscriptionStatus: company.subscriptionStatus,
          onboardingStatus: company.onboardingStatus,
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
      { status: 201 },
    );
  } catch (error) {
    console.error('Register-company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
