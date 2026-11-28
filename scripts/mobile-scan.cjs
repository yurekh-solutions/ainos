/**
 * Static mobile-risk scan for app screens.
 *
 * Reports places where a wide element can push a phone layout sideways:
 *  - <table> that is not inside an overflow-x-auto/overflow-auto scroll box
 *  - fixed widths of 640px or more
 *  - base grid-cols-3+ that only collapse once an sm/md breakpoint is reached
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const results = { tables: [], fixed: [], grids: [] };

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full);
    } else if (/\.tsx$/.test(entry.name)) {
      inspect(full);
    }
  }
}

function rel(full) {
  return path.relative(path.join(__dirname, '..'), full).replace(/\\/g, '/');
}

function inspect(full) {
  const source = fs.readFileSync(full, 'utf8');
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (line.includes('<table')) {
      const before = lines.slice(Math.max(0, index - 12), index + 1).join('\n');
      if (!/overflow-x-auto|overflow-auto/.test(before)) {
        results.tables.push(`${rel(full)}:${index + 1} ${line.trim().slice(0, 80)}`);
      }
    }

    // max-w/min-w are intentional caps, so only bare fixed widths matter here.
    const fixed = line.match(/(?<![a-z-])w-\[(\d{3,4})px\]/g) || [];
    for (const match of fixed) {
      const px = Number(match.match(/\d+/)[0]);
      if (px >= 640) results.fixed.push(`${rel(full)}:${index + 1} ${match}`);
    }

    const grid = line.match(/(?<![a-z:-])grid-cols-([3-9])\b/);
    if (grid && !/(sm|md|lg|xl):grid-cols/.test(line)) {
      results.grids.push(`${rel(full)}:${index + 1} ${line.trim().slice(0, 90)}`);
    }
  });
}

walk(ROOT);

for (const [key, label] of [
  ['tables', 'TABLES WITHOUT SCROLL WRAPPER'],
  ['fixed', 'FIXED WIDTHS >= 640px'],
  ['grids', 'BASE GRIDS WITH 3+ COLUMNS AND NO COLLAPSE'],
]) {
  const list = results[key];
  console.log(`\n== ${label} (${list.length}) ==`);
  for (const item of list) console.log(item);
}