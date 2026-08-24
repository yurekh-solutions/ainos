'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState('');

  const testCredentialLogin = async () => {
    setResult('Testing...');
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      setResult(JSON.stringify(res, null, 2));
    } catch (error) {
      setResult('Error: ' + error);
    }
  };

  const testGoogleLogin = async () => {
    setResult('Redirecting to Google...');
    await signIn('google', { callbackUrl: '/' });
  };

  const testRegister = async () => {
    setResult('Testing registration...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email,
          password,
        }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Authentication Test Page</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> <span className={status === 'authenticated' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
            {status === 'authenticated' && session?.user && (
              <>
                <p><strong>User ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Name:</strong> {session.user.name}</p>
                <button
                  onClick={() => signOut()}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Test Credentials */}
        {status !== 'authenticated' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={testRegister}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  1. Register New User
                </button>
                <button
                  onClick={testCredentialLogin}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  2. Login with Email
                </button>
                <button
                  onClick={testGoogleLogin}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  3. Login with Google
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {result}
            </pre>
          </div>
        )}

        {/* API Endpoints Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Endpoints Test</h2>
          <div className="space-y-2">
            <button
              onClick={async () => {
                const res = await fetch('/api/auth/providers');
                const data = await res.json();
                setResult('Providers:\n' + JSON.stringify(data, null, 2));
              }}
              className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-full text-left"
            >
              Test /api/auth/providers
            </button>
            <button
              onClick={async () => {
                const res = await fetch('/api/auth/csrf');
                const data = await res.json();
                setResult('CSRF:\n' + JSON.stringify(data, null, 2));
              }}
              className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-full text-left"
            >
              Test /api/auth/csrf
            </button>
            <button
              onClick={async () => {
                const res = await fetch('/api/me');
                const data = await res.json();
                setResult('Current User:\n' + JSON.stringify(data, null, 2));
              }}
              className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 w-full text-left"
            >
              Test /api/me
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Register New User" to create a test account</li>
            <li>If successful, click "Login with Email" to authenticate</li>
            <li>Check if session shows "authenticated" status</li>
            <li>Try "Login with Google" to test OAuth flow</li>
            <li>Use API endpoint buttons to verify backend</li>
          </ol>
        </div>

        {/* Links */}
        <div className="mt-6 space-y-2">
          <a href="/auth/signin" className="block text-blue-600 hover:underline">
            → Go to Sign In Page
          </a>
          <a href="/auth/register" className="block text-blue-600 hover:underline">
            → Go to Register Page
          </a>
          <a href="/" className="block text-blue-600 hover:underline">
            → Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
