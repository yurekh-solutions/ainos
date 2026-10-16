// Multiple fingerprint checks across different pages.
(async () => {
  const signin = await (await fetch('https://ainos-ywu0.onrender.com/auth/signin', { signal: AbortSignal.timeout(60000) })).text();
  const register = await (await fetch('https://ainos-ywu0.onrender.com/auth/register', { signal: AbortSignal.timeout(60000) })).text();
  const landing = await (await fetch('https://ainos-ywu0.onrender.com/', { signal: AbortSignal.timeout(60000) })).text();
  
  console.log('=== SIGNIN (a3e8594 markers) ===');
  console.log('Welcome Back (replaced Supplier Login):', signin.includes('Welcome Back'));
  console.log('hidden lg:block:', signin.includes('hidden lg:block'));
  
  console.log('=== REGISTER (a3e8594 markers) ===');
  console.log('hidden lg:block:', register.includes('hidden lg:block'));
  console.log('space-y-6 hidden lg:block:', register.includes('space-y-6 hidden lg:block'));
  
  console.log('=== LANDING (882b628 markers) ===');
  console.log('flex-nowrap overflow-x-auto:', landing.includes('flex-nowrap overflow-x-auto'));
  console.log('space-y-3 min-w-0:', landing.includes('space-y-3 min-w-0'));
  console.log('p-8 sm:p-14 lg:p-16:', landing.includes('p-8 sm:p-14 lg:p-16'));
  
  console.log('\n=== SANITY CHECK (old content that should exist) ===');
  console.log('Landing has "Every module":', landing.includes('Every module'));
  console.log('Register has "Company Name":', register.includes('Company Name'));
})();
