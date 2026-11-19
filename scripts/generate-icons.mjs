import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const svgSource = readFileSync(resolve(root, 'public/icons/icon.svg'), 'utf-8');

// Maskable icon: full-bleed background with artwork scaled to safe 80% center zone
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#mBg)" />
  <g transform="translate(56, 56) scale(0.78125)">
    ${svgSource.replace(/<\/?svg[^>]*>/g, '')}
  </g>
</svg>
`;

const targets = [
  { svg: svgSource, size: 180, out: 'public/icons/apple-touch-icon.png' },
  { svg: svgSource, size: 192, out: 'public/icons/icon-192.png' },
  { svg: svgSource, size: 512, out: 'public/icons/icon-512.png' },
  { svg: maskableSvg, size: 512, out: 'public/icons/icon-maskable-512.png' },
];

for (const item of targets) {
  const resvg = new Resvg(item.svg, {
    fitTo: { mode: 'width', value: item.size },
  });
  const pngBuffer = resvg.render().asPng();
  writeFileSync(resolve(root, item.out), pngBuffer);
  console.log(`Generated ${item.out} (${item.size}x${item.size}, ${pngBuffer.length} bytes)`);
}
