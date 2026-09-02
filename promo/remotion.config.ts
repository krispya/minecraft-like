import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(16);

// Hardware backed GL on macOS. Swap to 'swangle' if a render machine has no GPU.
Config.setChromiumOpenGlRenderer('angle');

Config.setEntryPoint('./src/index.ts');
