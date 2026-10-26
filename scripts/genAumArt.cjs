/**
 * genAumArt.cjs — Generate a fresh batch of premium "AUM-style" invitation
 * card artwork into /public/templates/art/. These are NEW motif families that
 * don't collide with the existing art-*.svg set, authored in the exact same
 * 720x1280 format with a CLEAR text band in the middle (decorations live only
 * near the top y<200 and bottom y>1080) so the customizer can overlay text.
 *
 * After running this, re-run scripts/genTemplates2.cjs to fold the new artwork
 * into src/data/invitations/templatesExpanded.ts.
 *
 * Usage:  node scripts/genAumArt.cjs
 */
const fs = require("fs");
const path = require("path");

const ART_DIR = path.join(__dirname, "..", "public", "templates", "art");

// ── Premium palettes (distinct from the existing saffron/jade/etc. set) ──
const PALETTES = {
  "ivory-gold":        { bg1: "#FBF8F0", bg2: "#F1E7CC", line: "#B99B46", accent: "#8A6D1E", soft: "#E7D8A8" },
  "rose-champagne":    { bg1: "#FDF5F2", bg2: "#F6E1DA", line: "#C98B7A", accent: "#9E5B4A", soft: "#F0C9BC" },
  "emerald-gold":      { bg1: "#0E3B2C", bg2: "#155641", line: "#D4AF37", accent: "#F0E6C0", soft: "#1E6E52" },
  "royal-maroon-gold": { bg1: "#480E1E", bg2: "#6B1230", line: "#D4AF37", accent: "#F2D9A0", soft: "#7C1B3B" },
  "midnight-noir":     { bg1: "#12122E", bg2: "#1F1F4A", line: "#D4AF37", accent: "#EDE3BE", soft: "#2B2B5E" },
  "blush-petal":       { bg1: "#FBEFEF", bg2: "#F6DCE0", line: "#D98C9A", accent: "#A85568", soft: "#F3C6CE" },
  "sage-linen":        { bg1: "#EFF3E9", bg2: "#DBE6D0", line: "#7E9B6E", accent: "#4F6B42", soft: "#C6D8B8" },
  "peacock-lagoon":    { bg1: "#063A48", bg2: "#0B5567", line: "#E0B94A", accent: "#7FD6C2", soft: "#0E6E82" },
};

const n = (v) => Math.round(v * 100) / 100;

// ── Motif renderers — each returns SVG markup (bg + frame added by caller) ──
const MOTIFS = {
  // Nested gilded arches fanning from top + mirrored at bottom
  "deco-arch": (P) => {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const x0 = 96 + i * 28, x1 = 624 - i * 28, y = 182, apex = 44 + i * 20;
      const op = n(0.85 - i * 0.11);
      s += `<path d="M ${x0} ${y} Q 360 ${apex} ${x1} ${y}" fill="none" stroke="${P.line}" stroke-width="2" opacity="${op}"/>`;
      const by = 1098, bapex = 1236 - i * 20;
      s += `<path d="M ${x0} ${by} Q 360 ${bapex} ${x1} ${by}" fill="none" stroke="${P.line}" stroke-width="2" opacity="${op}"/>`;
    }
    for (const cx of [96, 624]) { s += `<circle cx="${cx}" cy="182" r="4" fill="${P.accent}"/><circle cx="${cx}" cy="1098" r="4" fill="${P.accent}"/>`; }
    return s;
  },

  // Diamond jali lattice bands top + bottom
  "jali-lattice": (P) => {
    let s = "";
    const band = (y0, y1) => {
      let g = "";
      for (let x = -60; x < 760; x += 44) {
        g += `<line x1="${x}" y1="${y0}" x2="${x + 44}" y2="${y1}" stroke="${P.line}" stroke-width="1.4" opacity="0.7"/>`;
        g += `<line x1="${x}" y1="${y1}" x2="${x + 44}" y2="${y0}" stroke="${P.line}" stroke-width="1.4" opacity="0.7"/>`;
      }
      return `<clipPath id="c${y0}${y1}"><rect x="30" y="${y0}" width="660" height="${y1 - y0}"/></clipPath><g clip-path="url(#c${y0}${y1})">${g}</g><rect x="30" y="${y0}" width="660" height="${y1 - y0}" fill="none" stroke="${P.line}" stroke-width="1.5" opacity="0.8"/>`;
    };
    s += band(70, 158) + band(1122, 1210);
    return s;
  },

  // Mandala rosettes anchored at the four corners
  "corner-rosette": (P) => {
    const rosette = (cx, cy, r) => {
      let g = "";
      for (let k = 0; k < 8; k++) {
        g += `<ellipse cx="0" cy="${-r * 0.6}" rx="${r * 0.22}" ry="${r * 0.6}" fill="${P.soft}" stroke="${P.line}" stroke-width="1.2" transform="rotate(${k * 45})"/>`;
      }
      g += `<circle r="${r * 0.22}" fill="${P.line}"/>`;
      return `<g transform="translate(${cx} ${cy})" opacity="0.9">${g}</g>`;
    };
    return rosette(74, 74, 46) + rosette(646, 74, 46) + rosette(74, 1206, 46) + rosette(646, 1206, 46)
      + rosette(360, 60, 30) + rosette(360, 1220, 30);
  },

  // Overlapping scallop / petal arcs along the top + bottom edges
  "petal-scallop": (P) => {
    let s = "";
    const row = (y, dir) => {
      let g = "";
      for (let x = 30; x < 690; x += 55) {
        const r = 27;
        const d = dir === "down"
          ? `M ${x} ${y} A ${r} ${r} 0 0 1 ${x + 55} ${y}`
          : `M ${x} ${y} A ${r} ${r} 0 0 0 ${x + 55} ${y}`;
        g += `<path d="${d}" fill="${P.soft}" opacity="0.5" stroke="${P.line}" stroke-width="1.4"/>`;
      }
      return g;
    };
    s += row(60, "down") + row(1220, "up");
    return s;
  },

  // Hanging bead garland swags
  "bead-garland": (P) => {
    let s = "";
    const swag = (y0, sag) => {
      let g = `<path d="M 40 ${y0} Q 360 ${y0 + sag} 680 ${y0}" fill="none" stroke="${P.line}" stroke-width="1.6" opacity="0.8"/>`;
      for (let i = 0; i <= 16; i++) {
        const t = i / 16, x = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 360 + t * t * 680;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag) + t * t * y0;
        g += `<circle cx="${n(x)}" cy="${n(y)}" r="5" fill="${i % 2 ? P.accent : P.soft}" stroke="${P.line}" stroke-width="0.8"/>`;
      }
      return g;
    };
    s += swag(70, 90) + swag(1210, -90);
    return s;
  },

  // Thin radiating rays from top + bottom centre
  "ray-burst": (P) => {
    let s = "";
    const fan = (ox, oy, dy, sign) => {
      let g = "";
      for (let i = 0; i <= 20; i++) {
        const x = 60 + i * 30;
        g += `<line x1="${ox}" y1="${oy}" x2="${x}" y2="${oy + sign * dy}" stroke="${P.line}" stroke-width="1.2" opacity="0.55"/>`;
      }
      g += `<circle cx="${ox}" cy="${oy}" r="7" fill="${P.accent}"/>`;
      return g;
    };
    s += fan(360, 40, 150, 1) + fan(360, 1240, 150, -1);
    return s;
  },

  // Fine single-line botanical sprigs at the corners
  "leaf-sprig": (P) => {
    const sprig = (cx, cy, rot) => {
      let g = `<path d="M0 0 Q 40 -10 90 -60" fill="none" stroke="${P.line}" stroke-width="1.6"/>`;
      for (let i = 1; i <= 5; i++) {
        const t = i / 6, x = 90 * t, y = -60 * t - 10 * (1 - t);
        g += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="12" ry="5" fill="${P.soft}" stroke="${P.line}" stroke-width="1" transform="rotate(${-40 + i * 8} ${n(x)} ${n(y)})"/>`;
      }
      return `<g transform="translate(${cx} ${cy}) rotate(${rot})" opacity="0.9">${g}</g>`;
    };
    return sprig(60, 150, 0) + sprig(660, 150, 90) + sprig(660, 1130, 180) + sprig(60, 1130, 270);
  },

  // Row of mirror-work arch niches top + bottom
  "arch-niche": (P) => {
    let s = "";
    const row = (y, flip) => {
      let g = "";
      for (let x = 40; x < 690; x += 80) {
        const w = 60, h = 90, oy = flip ? y - h : y;
        const d = flip
          ? `M ${x} ${y} L ${x} ${oy + 30} Q ${x + w / 2} ${oy - 10} ${x + w} ${oy + 30} L ${x + w} ${y}`
          : `M ${x} ${y} L ${x} ${oy + h - 30} Q ${x + w / 2} ${oy + h + 10} ${x + w} ${oy + h - 30} L ${x + w} ${y}`;
        g += `<path d="${d}" fill="${P.soft}" opacity="0.35" stroke="${P.line}" stroke-width="1.5"/>`;
      }
      return g;
    };
    s += row(60, false) + row(1220, true);
    return s;
  },

  // Dotted diamond lace inner frame
  "diamond-lace": (P) => {
    let s = "";
    const diamond = (cx, cy, r) => `<path d="M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z" fill="none" stroke="${P.line}" stroke-width="1.3" opacity="0.8"/>`;
    for (let x = 70; x <= 650; x += 58) { s += diamond(x, 78, 16) + diamond(x, 1202, 16); }
    for (let y = 150; y <= 1130; y += 70) { s += diamond(70, y, 16) + diamond(650, y, 16); }
    s += `<rect x="46" y="46" width="628" height="1188" fill="none" stroke="${P.line}" stroke-width="1" opacity="0.5"/>`;
    return s;
  },

  // Peacock-feather "eye" fan along the bottom + a small crown at top
  "feather-fan": (P) => {
    const eye = (cx, cy, rot, sc) => `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${sc})"><path d="M0 -34 Q 20 0 0 30 Q -20 0 0 -34 Z" fill="${P.soft}" stroke="${P.line}" stroke-width="1.4"/><ellipse cx="0" cy="4" rx="9" ry="13" fill="${P.accent}" opacity="0.85"/><circle cx="0" cy="6" r="4" fill="${P.line}"/></g>`;
    let s = "";
    for (let i = 0; i < 9; i++) { s += eye(120 + i * 60, 1180, (i - 4) * 6, 1); }
    for (let i = 0; i < 5; i++) { s += eye(240 + i * 60, 96, (i - 2) * 8, 0.7); }
    return s;
  },
};

// ── Assemble each SVG file ──
let count = 0;
for (const [motif, render] of Object.entries(MOTIFS)) {
  for (const [pKey, P] of Object.entries(PALETTES)) {
    const uid = `${motif}${pKey}`.replace(/[^a-z0-9]/gi, "");
    const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
<defs>
  <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${P.bg1}"/><stop offset="1" stop-color="${P.bg2}"/>
  </linearGradient>
</defs>
<rect width="720" height="1280" fill="url(#bg${uid})"/>
<rect x="22" y="22" width="676" height="1236" fill="none" stroke="${P.line}" stroke-width="2.5"/>
<rect x="30" y="30" width="660" height="1220" fill="none" stroke="${P.line}" stroke-width="1" opacity="0.6"/>
${render(P)}
</svg>`;
    const file = path.join(ART_DIR, `art-${motif}-${pKey}-aum.svg`);
    fs.writeFileSync(file, svg, "utf8");
    count++;
  }
}
console.log(`Wrote ${count} premium AUM-style artwork files to ${ART_DIR}`);
