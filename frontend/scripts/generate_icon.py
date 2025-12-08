#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

sizes = [
    ('mdpi', 48),
    ('hdpi', 72),
    ('xhdpi', 96),
    ('xxhdpi', 144),
    ('xxxhdpi', 192)
]

emoji = '🌸'
base_dir = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

for name, size in sizes:
    # Create white background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # Try to load emoji font
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Apple Color Emoji.ttc', int(size * 0.7))
    except:
        try:
            font = ImageFont.truetype('/System/Library/Fonts/Supplemental/AppleColorEmoji.ttf', int(size * 0.7))
        except:
            print(f"Warning: Could not load emoji font for {name}")
            font = None

    if font:
        # Calculate text position to center it
        bbox = draw.textbbox((0, 0), emoji, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        position = ((size - text_width) // 2 - bbox[0], (size - text_height) // 2 - bbox[1])
        draw.text(position, emoji, font=font, embedded_color=True)

    # Save to mipmap directories
    dir_path = os.path.join(base_dir, f'mipmap-{name}')

    img.save(os.path.join(dir_path, 'ic_launcher.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_round.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

    print(f'✓ Generated icons for mipmap-{name} ({size}x{size})')

print('\n✅ All Android icons generated successfully!')
