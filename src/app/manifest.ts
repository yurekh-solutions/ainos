import type { MetadataRoute } from 'next';

/**
 * Android and desktop installs read the icon from here, so the tab icon and the
 * home-screen icon stay the same AINOS alpha mark.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AINOS Business Suite',
    short_name: 'AINOS',
    description: 'CRM, Finance, HR, Inventory, Marketing and AI in one platform.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#5b21b6',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
