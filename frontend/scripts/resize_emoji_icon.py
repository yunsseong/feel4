#!/usr/bin/env python3
from PIL import Image
import os

sizes = [
    ('mdpi', 48),
    ('hdpi', 72),
    ('xhdpi', 96),
    ('xxhdpi', 144),
    ('xxxhdpi', 192)
]

# Load the emoji image
emoji_img = Image.open('/tmp/flower_emoji.png')

base_dir = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

for name, size in sizes:
    # Resize emoji to target size
    resized = emoji_img.resize((size, size), Image.Resampling.LANCZOS)

    # Create image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))

    # Paste emoji (centered)
    img.paste(resized, (0, 0), resized)

    # Convert to RGB (remove alpha)
    img_rgb = Image.new('RGB', (size, size), (255, 255, 255))
    img_rgb.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)

    # Save to mipmap directories
    dir_path = os.path.join(base_dir, f'mipmap-{name}')

    img_rgb.save(os.path.join(dir_path, 'ic_launcher.png'))
    img_rgb.save(os.path.join(dir_path, 'ic_launcher_round.png'))
    img_rgb.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

    print(f'✓ Generated emoji icons for mipmap-{name} ({size}x{size})')

print('\n🌸 All Android icons with flower emoji generated successfully!')
