const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const sizes = [
    { name: 'mdpi', size: 48 },
    { name: 'hdpi', size: 72 },
    { name: 'xhdpi', size: 96 },
    { name: 'xxhdpi', size: 144 },
    { name: 'xxxhdpi', size: 192 }
];

const emoji = '🌸';
const baseDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

sizes.forEach(({ name, size }) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Draw emoji
    ctx.font = `${size * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);

    // Save files
    const dir = path.join(baseDir, `mipmap-${name}`);
    const buffer = canvas.toBuffer('image/png');

    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), buffer);
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), buffer);
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), buffer);

    console.log(`✓ Generated icons for mipmap-${name} (${size}x${size})`);
});

console.log('\n✅ All Android icons generated successfully!');
