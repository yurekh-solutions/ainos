import { describe, expect, it } from 'vitest';

import { firstHeaderValue, isLoopbackOrigin, resolveNextAuthOrigin } from '../auth-origin';

// The bug this guards against: ainossuite.com ran with NEXTAUTH_URL pointing at
// http://localhost:3000, so Google sign-in bounced visitors to their own
// machine and the live domain answered with a 404 page.
describe('NEXTAUTH_URL origin guard', () => {
  it('replaces a leftover localhost value with the public host', () => {
    expect(
      resolveNextAuthOrigin({
        host: 'ainossuite.com',
        proto: 'https',
        configured: 'http://localhost:3000',
      }),
    ).toBe('https://ainossuite.com');
  });

  it('treats 127.0.0.1 as loopback too', () => {
    expect(
      resolveNextAuthOrigin({
        host: 'ainossuite.com',
        proto: 'https',
        configured: 'http://127.0.0.1:3000/',
      }),
    ).toBe('https://ainossuite.com');
  });

  it('leaves local development on the localhost value', () => {
    expect(
      resolveNextAuthOrigin({
        host: 'localhost:3000',
        proto: 'http',
        configured: 'http://localhost:3000',
      }),
    ).toBeNull();
  });

  it('leaves a correctly configured public origin alone', () => {
    expect(
      resolveNextAuthOrigin({
        host: 'ainossuite.com',
        proto: 'https',
        configured: 'https://ainossuite.com/',
      }),
    ).toBeNull();
  });

  it('pins the request origin when nothing is configured', () => {
    expect(
      resolveNextAuthOrigin({ host: 'ainossuite.com', proto: 'https', configured: '' }),
    ).toBe('https://ainossuite.com');
  });

  it('does not invent an origin when nothing is configured locally', () => {
    expect(resolveNextAuthOrigin({ host: 'localhost:3000', configured: '' })).toBeNull();
  });

  it('prefers X-Forwarded-Host only when Host was rewritten internally', () => {
    expect(
      resolveNextAuthOrigin({
        host: '127.0.0.1:10000',
        forwardedHost: 'ainossuite.com',
        proto: 'https',
        configured: 'http://localhost:3000',
      }),
    ).toBe('https://ainossuite.com');

    // A real public Host must never be replaced by a forwarded value.
    expect(
      resolveNextAuthOrigin({
        host: 'ainossuite.com',
        forwardedHost: 'evil.example',
        proto: 'https',
        configured: 'http://localhost:3000',
      }),
    ).toBe('https://ainossuite.com');
  });

  it('defaults the scheme by host kind when no proto header exists', () => {
    expect(resolveNextAuthOrigin({ host: 'ainossuite.com', configured: 'http://localhost:3000' })).toBe(
      'https://ainossuite.com',
    );
    expect(resolveNextAuthOrigin({ host: 'localhost:3000', configured: 'http://localhost:3000' })).toBeNull();
  });

  it('ignores repeated header values beyond the first', () => {
    expect(firstHeaderValue('ainossuite.com, internal.local')).toBe('ainossuite.com');
    expect(firstHeaderValue('   ')).toBeNull();
    expect(firstHeaderValue(null)).toBeNull();
  });

  it('recognises loopback origins only', () => {
    expect(isLoopbackOrigin('http://localhost:3000')).toBe(true);
    expect(isLoopbackOrigin('http://[::1]:3000')).toBe(true);
    expect(isLoopbackOrigin('https://ainossuite.com/')).toBe(false);
    expect(isLoopbackOrigin('https://localhost.example.com')).toBe(false);
  });
});
