import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(16);

// Use hardware-accelerated Chromium rendering on macOS.
Config.setChromiumOpenGlRenderer('angle');

Config.setEntryPoint('./src/index.ts');
