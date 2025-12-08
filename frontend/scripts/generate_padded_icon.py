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
    # Create image with white background
    img = Image.new('RGB', (size, size), (255, 255, 255))

    # Calculate emoji size with padding (50% of icon size, leaving 25% padding on each side)
    emoji_size = int(size * 0.5)
    padding = (size - emoji_size) // 2

    # Resize emoji
    resized_emoji = emoji_img.resize((emoji_size, emoji_size), Image.Resampling.LANCZOS)

    # Convert to RGBA if needed
    if resized_emoji.mode != 'RGBA':
        resized_emoji = resized_emoji.convert('RGBA')

    # Paste emoji centered with padding
    img.paste(resized_emoji, (padding, padding), resized_emoji)

    # Save to mipmap directories
    dir_path = os.path.join(base_dir, f'mipmap-{name}')

    img.save(os.path.join(dir_path, 'ic_launcher.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_round.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

    print(f'✓ Generated padded emoji icon for mipmap-{name} ({size}x{size}, emoji: {emoji_size}x{emoji_size})')

print('\n🌸 All Android icons with padded flower emoji generated successfully!')
print('   Padding: 25% on each side (50% emoji size)')
