import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomBytes } from 'crypto';

// Firebase Admin SDK singleton — used for password reset emails.
// Firebase delivers to ANY inbox (Gmail, Yahoo, Outlook, corporate) with no
// domain verification, unlike Resend's owner-only test sender.
let app: App | null = null;

function getFirebaseAdmin(): App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase credentials not set. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to the environment.'
    );
  }

  // The private key arrives with literal \n sequences — convert to real newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  const existing = getApps().find((a) => a.name === 'ainos-admin');
  if (existing) {
    app = existing;
    return app;
  }

  app = initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    'ainos-admin'
  );

  return app;
}

const BASE_URL = process.env.NEXTAUTH_URL_BASE || 'https://ainos-ywu0.onrender.com';

/**
 * Sends a Firebase password reset email to the user.
 * Uses the Identity Toolkit REST API (accounts:sendOobCode) which actually
 * delivers the email — Admin SDK's generatePasswordResetLink only returns
 * the link without sending anything.
 * Users live in Prisma (not Firebase Auth), so a placeholder Firebase account
 * is created when missing — the real password always stays in Prisma.
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const adminApp = getFirebaseAdmin();
  const auth = getAuth(adminApp);

  try {
    await auth.getUserByEmail(email);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      // Placeholder account with an unguessable password; user sets their own
      // via the reset link. Prisma remains the source of truth for sign-in.
      await auth.createUser({ email, password: randomBytes(24).toString('hex') });
    } else {
      throw err;
    }
  }

  // Use Identity Toolkit REST API to actually SEND the reset email
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY not set');

  console.log('[Firebase] Sending reset email to:', email);

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'PASSWORD_RESET',
      email,
      continueUrl: `${BASE_URL}/auth/reset-password`,
    }),
  });

  const data = await res.json();
  console.log('[Firebase] sendOobCode response:', res.status, JSON.stringify(data));

  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to send reset email');
  }
}

/**
 * Completes a password reset in Firebase Auth via the Identity Toolkit REST API
 * (single-use oobCode from the email link). Returns the user's email on success.
 */
export async function confirmPasswordReset(oobCode: string, newPassword: string): Promise<string> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_WEB_API_KEY not set');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oobCode, newPassword }),
  });

  const data: { email?: string; error?: { message?: string } } = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Invalid or expired reset link');
  }

  return data.email as string;
}
