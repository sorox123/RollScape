/**
 * Generate placeholder PWA icons using sharp
 * Run with: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '../frontend/node_modules/sharp'));

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '../frontend/public/icons');
const BACKGROUND_COLOR = '#2563eb'; // Blue theme
const TEXT_COLOR = '#ffffff';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function generateSVGIcon(size) {
  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.5;
  const radius = iconSize / 2;
  const sides = 5;
  
  // Calculate pentagon points for d20
  const points = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    points.push([
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    ]);
  }
  
  const pointsString = points.map(p => p.join(',')).join(' ');
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}"/>
  
  <!-- Gradient overlay -->
  <defs>
    <radialGradient id="grad${size}">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.2)"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad${size})"/>
  
  <!-- D20 dice shape -->
  <polygon points="${pointsString}" 
           fill="rgba(255, 255, 255, 0.15)" 
           stroke="${TEXT_COLOR}" 
           stroke-width="${size / 30}"/>
  
  <!-- "20" text -->
  <text x="${centerX}" y="${centerY + size * 0.02}" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        font-size="${size * 0.25}" 
        fill="${TEXT_COLOR}" 
        text-anchor="middle" 
        dominant-baseline="middle">20</text>
  
  ${size >= 144 ? `<!-- "RS" text -->
  <text x="${centerX}" y="${centerY + iconSize * 0.65}" 
        font-family="Arial, sans-serif" 
        font-weight="bold" 
        font-size="${size * 0.12}" 
        fill="${TEXT_COLOR}" 
        text-anchor="middle" 
        dominant-baseline="middle">RS</text>` : ''}
</svg>`;

  const filename = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`✓ Generated ${filename}`);
  
  return svg;
}

async function generateIcon(size) {
  const svg = generateSVGIcon(size);
  const pngFilename = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
  
  try {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(pngFilename);
    console.log(`✓ Generated ${pngFilename}`);
  } catch (error) {
    console.error(`✗ Failed to convert ${size}x${size} to PNG:`, error.message);
  }
}

async function generateAllIcons() {
  console.log('Generating PWA icons...\n');
  
  for (const size of SIZES) {
    try {
      await generateIcon(size);
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size}:`, error.message);
    }
  }
  
  console.log('\n✨ Icon generation complete!');
  console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
}

generateAllIcons();
