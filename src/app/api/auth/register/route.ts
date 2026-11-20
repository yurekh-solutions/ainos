import { NextRequest, NextResponse } from 'next/server';
import { throttle } from '@/lib/security';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  // Account creation is the cheapest way to burn email quota and seed fake
  // tenants, so one address gets a small hourly budget.
  const blocked = throttle(req, 'register', 10, 60 * 60_000);
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Rows without a password were auto-created by the legacy Google flow
      // (never registered) — let the owner claim the account via normal
      // registration instead of dead-ending on "email already exists".
      if (existingUser.password) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      let companyId = existingUser.companyId;
      if (!companyId) {
        const company = await prisma.company.create({
          data: {
            name: `${name}'s Company`,
            createdBy: email,
          },
        });
        companyId = company.id;
      }

      const claimed = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name: existingUser.name || name,
          companyId,
        },
      });

      return NextResponse.json(
        {
          message: 'Account created successfully',
          user: {
            id: claimed.id,
            name: claimed.name,
            email: claimed.email,
          },
        },
        { status: 201 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a default company for the new user
    const company = await prisma.company.create({
      data: {
        name: `${name}'s Company`,
        createdBy: email,
      },
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'user',
        companyId: company.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
