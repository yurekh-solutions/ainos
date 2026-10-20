import Link from 'next/link';

/** AINOS "A" mark with the wordmark; `tone` switches text colours for dark or light surfaces. */
export function BrandMark({
  tone = 'light',
  showText = true,
  href = '/dashboard',
}: {
  tone?: 'light' | 'dark';
  showText?: boolean;
  href?: string;
}) {
  const id = tone === 'dark' ? 'ainos-mark-dark' : 'ainos-mark-light';
  return (
    <Link href={href} className="flex items-center gap-2.5 min-w-0">
      <svg viewBox="0 0 32 32" className="w-8 h-8 flex-shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={tone === 'dark' ? '#c4b5fd' : '#8b5cf6'} />
            <stop offset="1" stopColor={tone === 'dark' ? '#7c3aed' : '#4c1d95'} />
          </linearGradient>
        </defs>
        <path d="M16 3 L29.5 28.5 H22.6 L16 15.4 L9.4 28.5 H2.5 Z" fill={`url(#${id})`} />
        <path d="M16 20.2 L19.6 27 H12.4 Z" fill={tone === 'dark' ? '#ede9fe' : '#a78bfa'} />
      </svg>
      {showText && (
        <div className="min-w-0 leading-tight">
          <p className={`text-[15px] font-semibold tracking-wide ${tone === 'dark' ? 'text-white' : 'text-neutral-900'}`}>AINOS</p>
          <p className={`text-[11px] font-light ${tone === 'dark' ? 'text-white/60' : 'text-neutral-500'}`}>Business Suite</p>
        </div>
      )}
    </Link>
  );
}
