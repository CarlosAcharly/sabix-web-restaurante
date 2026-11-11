import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicDirectory = path.join(projectRoot, 'public');
const iconsDirectory = path.join(publicDirectory, 'icons');
const sourcePath = path.join(publicDirectory, 'logo-source.png');
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function ensurePlaceholderSource() {
  try {
    await fs.access(sourcePath);
    return;
  } catch {
    const placeholderSvg = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
        <rect width="1024" height="1024" fill="#9d2a9c" />
        <circle cx="512" cy="430" r="250" fill="#ffffff" />
        <path d="M420 300v260m-78-260v170c0 52 35 90 78 90s78-38 78-90V300m174 0v430m0-430c-92 45-120 145-120 250h120" fill="none" stroke="#9d2a9c" stroke-linecap="round" stroke-linejoin="round" stroke-width="34" />
        <text x="512" y="850" fill="#ffffff" font-family="Arial, sans-serif" font-size="112" font-weight="700" text-anchor="middle">SABIX</text>
      </svg>
    `);
    await sharp(placeholderSvg).resize(1024, 1024).png().toFile(sourcePath);
    console.log('📱 Se creó un logo placeholder en public/logo-source.png. Reemplázalo por el logo oficial.');
  }
}

async function generateIcons() {
  await fs.mkdir(iconsDirectory, { recursive: true });
  await ensurePlaceholderSource();

  for (const size of iconSizes) {
    const outputPath = path.join(iconsDirectory, `icon-${size}x${size}.png`);
    await sharp(sourcePath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`✅ Generado ${path.relative(projectRoot, outputPath)}`);
  }

  const maskablePath = path.join(iconsDirectory, 'maskable-512x512.png');
  await sharp(sourcePath)
    .resize(410, 410, { fit: 'contain', background: '#9d2a9c' })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: '#9d2a9c' })
    .png()
    .toFile(maskablePath);
  console.log(`✅ Generado ${path.relative(projectRoot, maskablePath)}`);

  for (const name of ['orders', 'menu', 'chat']) {
    const outputPath = path.join(iconsDirectory, `${name}-96x96.png`);
    await sharp(sourcePath)
      .resize(96, 96, { fit: 'cover' })
      .png()
      .toFile(outputPath);
    console.log(`✅ Generado ${path.relative(projectRoot, outputPath)}`);
  }
}

generateIcons().catch((error) => {
  console.error('❌ No se pudieron generar los iconos:', error);
  process.exitCode = 1;
});
