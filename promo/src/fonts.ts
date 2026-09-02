// Geist and Geist Mono from the brand system, latin subset, served from
// public/fonts so a render never depends on the network.

import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

export const geist = 'Geist';
export const geistMono = 'Geist Mono';

for (const weight of ['400', '500', '700', '900']) {
  void loadFont({
    family: geist,
    url: staticFile(`fonts/geist-${weight}.woff2`),
    weight,
    format: 'woff2',
  });
}
for (const weight of ['400', '500']) {
  void loadFont({
    family: geistMono,
    url: staticFile(`fonts/geist-mono-${weight}.woff2`),
    weight,
    format: 'woff2',
  });
}
