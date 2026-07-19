import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const source = join(root, 'public', 'endless-glory-square.png');
const buildDirectory = join(root, 'build');
const pngOutput = join(buildDirectory, 'icon.png');
const icoOutput = join(buildDirectory, 'icon.ico');
const icnsOutput = join(buildDirectory, 'icon.icns');

mkdirSync(buildDirectory, { recursive: true });

// Linux/Electron can use the approved 512px source without conversion.
copyFileSync(source, pngOutput);

// ICO supports PNG-compressed frames. Keep the common Windows shell sizes in one file.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoFrames = await Promise.all(
  icoSizes.map((size) => sharp(source).resize(size, size).png().toBuffer()),
);
const icoHeader = Buffer.alloc(6 + icoFrames.length * 16);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(icoFrames.length, 4);

let icoOffset = icoHeader.length;
for (const [index, frame] of icoFrames.entries()) {
  const size = icoSizes[index];
  const entryOffset = 6 + index * 16;
  icoHeader.writeUInt8(size === 256 ? 0 : size, entryOffset);
  icoHeader.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
  icoHeader.writeUInt8(0, entryOffset + 2);
  icoHeader.writeUInt8(0, entryOffset + 3);
  icoHeader.writeUInt16LE(1, entryOffset + 4);
  icoHeader.writeUInt16LE(32, entryOffset + 6);
  icoHeader.writeUInt32LE(frame.length, entryOffset + 8);
  icoHeader.writeUInt32LE(icoOffset, entryOffset + 12);
  icoOffset += frame.length;
}
writeFileSync(icoOutput, Buffer.concat([icoHeader, ...icoFrames]));

// iconutil is the macOS-native ICNS compiler and requires this exact iconset layout.
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'endless-glory-icons-'));
const iconsetDirectory = join(temporaryDirectory, 'EndlessGlory.iconset');
mkdirSync(iconsetDirectory);
const iconsetEntries = [
  ['icon_16x16.png', 16],
  ['icon_16x16@2x.png', 32],
  ['icon_32x32.png', 32],
  ['icon_32x32@2x.png', 64],
  ['icon_128x128.png', 128],
  ['icon_128x128@2x.png', 256],
  ['icon_256x256.png', 256],
  ['icon_256x256@2x.png', 512],
  ['icon_512x512.png', 512],
  ['icon_512x512@2x.png', 1024],
];

try {
  await Promise.all(
    iconsetEntries.map(([name, size]) =>
      sharp(source)
        .resize(Number(size), Number(size))
        .png()
        .toFile(join(iconsetDirectory, String(name))),
    ),
  );
  execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconsetDirectory, '-o', icnsOutput], {
    stdio: 'inherit',
  });
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

const outputs = [pngOutput, icoOutput, icnsOutput].map((path) => ({
  path,
  bytes: readFileSync(path).length,
}));
console.log('Generated native icons from public/endless-glory-square.png:', outputs);
