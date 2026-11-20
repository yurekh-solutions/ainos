import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

// Yurekh Solutions builds and runs AINOS, so the public footers point at the
// company's own social profiles rather than placeholder accounts.
export const SOCIAL_PROFILES = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/yurekh-solutions-private-limited/',
    Icon: Linkedin,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/yurekhsolutions',
    Icon: Instagram,
  },
];

export default function SocialLinks({
  tone = 'light',
  className = '',
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const ring = tone === 'dark' ? 'border-white/20' : 'border-gray-200';
  const colour =
    tone === 'dark'
      ? 'text-gray-300 hover:text-white hover:bg-white/10'
      : 'text-gray-500 hover:text-[#4c1d95] hover:bg-violet-50';

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {SOCIAL_PROFILES.map(({ label, href, Icon }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`AINOS on ${label}`}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${ring} ${colour}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
