'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Heart } from 'lucide-react';

// Accent color dots - shows available theme colors
const COLOR_DOTS = ['#800020', '#c4787a', '#2a7a7a'];

interface Template {
  _id: string;
  name: string;
  slug?: string;
  category: string;
  previewImage?: string;
  language: string;
  hasVideo: boolean;
  price: number;
  videoPrice: number;
  recommendedColor?: string;
  sampleText?: Record<string, string>;
}

interface TemplateCardProps {
  template: Template;
  index?: number;
  favourite?: boolean;
  onToggleFavourite?: (key: string) => void;
}

const TemplateCard = memo(({ template, index = 0, favourite = false, onToggleFavourite }: TemplateCardProps) => {
  const slug = template.slug || template._id;
  const targetUrl = `/marketing/invitations/customize/${slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.01, 0.15) }}
      className={`block group relative rounded-2xl overflow-hidden ${
        favourite ? 'ring-2 ring-[#e0486b]' : ''
      }`}
    >
      <Link href={targetUrl} className="block" style={{ textDecoration: 'none' }}>
        {/* Preview Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {template.previewImage ? (
            <img
              src={template.previewImage}
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              draggable="false"
              loading="lazy"
              width={300}
              height={400}
              fetchPriority={index < 6 ? 'high' : 'auto'}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <span className="text-white text-lg font-medium">{template.name}</span>
            </div>
          )}

          {/* Glass Video Badge */}
          {template.hasVideo && (
            <div className="absolute top-2.5 right-2.5 bg-[#800020]/90 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shadow-lg border border-white/20">
              <Play size={10} className="fill-white" /> Video
            </div>
          )}

          {/* Always-visible pick affordance */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent pt-8 pb-2 px-2.5">
            <span className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white text-[#800020] text-[11px] font-bold shadow-md tracking-wide transition-transform group-hover:scale-[1.03]">
              Pick this design
            </span>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-3 bg-white/85 dark:bg-gray-800/85 rounded-b-2xl border border-t-0 border-[#e8dcc4] dark:border-gray-700">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate leading-tight group-hover:text-[#800020] transition-colors">
                {template.name}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider font-medium truncate">
                {(template.category || '').replace(/-/g, ' ')}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[11px] font-bold text-[#800020] leading-tight">₹{template.price || 49}</p>
              <p className="text-[9px] text-gray-400 leading-tight">video ₹{template.videoPrice || 99}</p>
            </div>
          </div>
          {/* Color dots */}
          <div className="flex items-center gap-1 mt-2">
            {COLOR_DOTS.map((color, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="ml-auto text-[9px] text-gray-400 uppercase tracking-wider">Image + Video</span>
          </div>
        </div>
      </Link>

      {/* Favourite */}
      {onToggleFavourite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavourite(slug);
          }}
          aria-label={favourite ? 'Remove from favourites' : 'Save to favourites'}
          aria-pressed={favourite}
          title={favourite ? 'Picked — tap to remove' : 'Pick this design'}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
            favourite
              ? 'bg-white text-[#e0486b] ring-2 ring-[#e0486b]'
              : 'bg-white/85 text-[#800020] hover:bg-white hover:scale-105'
          }`}
        >
          <Heart className={`w-4 h-4 ${favourite ? 'fill-current' : ''}`} />
        </button>
      )}
      {favourite && (
        <span className="absolute top-2 left-12 bg-white/95 text-[#e0486b] text-[9px] font-bold px-2 py-1 rounded-full shadow-sm border border-[#e0486b]/25 uppercase tracking-wide">
          Picked
        </span>
      )}
    </motion.div>
  );
});
TemplateCard.displayName = 'TemplateCard';

export default TemplateCard;
export type { Template };
