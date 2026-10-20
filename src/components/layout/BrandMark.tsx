import Link from 'next/link';
import Image from 'next/image';

/** AINOS alpha mark in a circle with the "ainos" wordmark; `tone` adapts it for dark or light surfaces. */
export function BrandMark({
  tone = 'light',
  showText = true,
  href = '/dashboard',
}: {
  tone?: 'light' | 'dark';
  showText?: boolean;
  href?: string;
}) {
  const dark = tone === 'dark';
  return (
    <Link href={href} className="flex items-center gap-2.5 min-w-0" aria-label="AINOS dashboard">
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          dark ? 'bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.45)]' : 'bg-violet-50 ring-1 ring-violet-100'
        }`}
      >
        <Image src="/ainos-alpha.png" alt="" width={20} height={19} className="w-5 h-auto" priority />
      </span>
      {showText && (
        <div className="min-w-0 leading-tight">
          <Image
            src="/ainos-wordmark.png"
            alt="ainos"
            width={68}
            height={20}
            className={`h-[18px] w-auto ${dark ? 'brightness-0 invert' : ''}`}
            priority
          />
          <p className={`text-[11px] font-light mt-0.5 ${dark ? 'text-white/60' : 'text-neutral-500'}`}>Business Suite</p>
        </div>
      )}
    </Link>
  );
}
