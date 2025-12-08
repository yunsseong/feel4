#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

sizes = [
    ('mdpi', 48),
    ('hdpi', 72),
    ('xhdpi', 96),
    ('xxhdpi', 144),
    ('xxxhdpi', 192)
]

# Simple flower icon with pink petals
def draw_flower(draw, size):
    center_x, center_y = size // 2, size // 2
    petal_size = size // 4

    # Pink color for petals
    petal_color = '#FFB6C1'  # Light pink
    center_color = '#FFD700'  # Gold for center

    # Draw 5 petals around center
    import math
    for i in range(5):
        angle = (i * 2 * math.pi) / 5 - math.pi / 2
        x = center_x + int(petal_size * math.cos(angle))
        y = center_y + int(petal_size * math.sin(angle))
        draw.ellipse([x - petal_size//2, y - petal_size//2,
                     x + petal_size//2, y + petal_size//2],
                    fill=petal_color)

    # Draw center circle
    center_radius = petal_size // 2
    draw.ellipse([center_x - center_radius, center_y - center_radius,
                 center_x + center_radius, center_y + center_radius],
                fill=center_color)

base_dir = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

for name, size in sizes:
    # Create white background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)

    # Draw flower
    draw_flower(draw, size)

    # Save to mipmap directories
    dir_path = os.path.join(base_dir, f'mipmap-{name}')

    img.save(os.path.join(dir_path, 'ic_launcher.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_round.png'))
    img.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

    print(f'✓ Generated icons for mipmap-{name} ({size}x{size})')

print('\n✅ All Android icons with flower design generated successfully!')
