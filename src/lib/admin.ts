// Platform admin emails — only these accounts get the platform-wide view
// (all users' blogs & connected websites). Everyone else stays in their own company scope.
export const ADMIN_EMAILS = [
  'soniajaiswal2222@gmail.com',
];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
