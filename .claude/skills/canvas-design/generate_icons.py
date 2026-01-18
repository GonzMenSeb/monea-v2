#!/usr/bin/env python3
"""
Monea Icon Suite Generator
Auric Veil Philosophy: Protected abundance and quiet sovereignty
Final refined version - pristine museum-quality execution
"""

from PIL import Image, ImageDraw
import math
import os

OUTPUT_DIR = "/home/sebastian/versioned-code/monea-v2/assets"

# Auric Veil Palette
COLORS = {
    'gold_bright': (255, 208, 102),
    'gold_mid': (235, 180, 60),
    'gold_deep': (195, 145, 35),
    'teal_deep': (18, 52, 68),
    'teal_darker': (14, 44, 58),
    'teal_darkest': (10, 36, 48),
}


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_radial_gradient(img, center, radius, inner_color, outer_color):
    """Draw smooth radial gradient with smoothstep interpolation"""
    cx, cy = center
    pixels = img.load()
    width, height = img.size

    for y in range(max(0, int(cy - radius - 1)), min(height, int(cy + radius + 2))):
        for x in range(max(0, int(cx - radius - 1)), min(width, int(cx + radius + 2))):
            dist = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if dist <= radius:
                t = dist / radius
                t = t * t * (3 - 2 * t)
                color = lerp_color(inner_color, outer_color, t)
                pixels[x, y] = (*color, 255)


def draw_m_letterform(draw, cx, cy, size, color):
    """Draw geometric M letterform"""
    h = size * 0.50
    w = size * 0.65
    stroke = size * 0.12

    left = cx - w / 2
    right = cx + w / 2
    top = cy - h / 2
    bottom = cy + h / 2
    valley_y = cy + h * 0.06

    # Left vertical
    draw.polygon([
        (left, bottom), (left, top),
        (left + stroke, top), (left + stroke, bottom)
    ], fill=color)

    # Right vertical
    draw.polygon([
        (right - stroke, bottom), (right - stroke, top),
        (right, top), (right, bottom)
    ], fill=color)

    # Left diagonal
    draw.polygon([
        (left, top), (left + stroke * 0.6, top),
        (cx, valley_y), (cx - stroke * 0.6, valley_y)
    ], fill=color)

    # Right diagonal
    draw.polygon([
        (right - stroke * 0.6, top), (right, top),
        (cx + stroke * 0.6, valley_y), (cx, valley_y)
    ], fill=color)


def create_main_icon(size):
    """Create the main app icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Background teal circle
    bg_radius = int(size * 0.495)
    draw.ellipse([
        cx - bg_radius, cy - bg_radius,
        cx + bg_radius, cy + bg_radius
    ], fill=COLORS['teal_darkest'])

    # Inner teal gradient
    inner_radius = int(size * 0.47)
    draw_radial_gradient(img, (cx, cy), inner_radius, COLORS['teal_deep'], COLORS['teal_darkest'])

    # Outer gold accent ring
    ring_r = int(size * 0.488)
    draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
                 outline=(*COLORS['gold_mid'], 55), width=max(2, int(size * 0.005)))

    # Concentric rings
    for i, mult in enumerate([0.80, 0.70, 0.60]):
        r = int(size * mult * 0.5)
        alpha = 30 - i * 7
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     outline=(*COLORS['gold_mid'], alpha), width=max(1, int(size * 0.003)))

    # Golden orb
    orb_radius = int(size * 0.25)
    draw_radial_gradient(img, (cx, cy), orb_radius, COLORS['gold_bright'], COLORS['gold_deep'])

    # M letterform
    m_size = orb_radius * 1.6
    draw_m_letterform(draw, cx, cy, m_size, COLORS['teal_deep'])

    return img


def create_adaptive_icon(size):
    """Create adaptive icon - core elements only"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    # Golden orb (sized for adaptive safe zone)
    orb_radius = int(size * 0.21)
    draw_radial_gradient(img, (cx, cy), orb_radius, COLORS['gold_bright'], COLORS['gold_deep'])

    # M letterform
    m_size = orb_radius * 1.6
    draw_m_letterform(draw, cx, cy, m_size, COLORS['teal_deep'])

    # Subtle rings
    for i, mult in enumerate([1.35, 1.55, 1.75]):
        r = int(orb_radius * mult)
        alpha = 45 - i * 12
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     outline=(*COLORS['gold_mid'], alpha), width=max(2, int(size * 0.004)))

    return img


def create_splash_icon(size):
    """Create splash icon - bold and clean"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    orb_radius = int(size * 0.40)
    draw_radial_gradient(img, (cx, cy), orb_radius, COLORS['gold_bright'], COLORS['gold_deep'])

    m_size = orb_radius * 1.55
    draw_m_letterform(draw, cx, cy, m_size, COLORS['teal_deep'])

    return img


def create_favicon(size):
    """Create favicon - maximum simplicity"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2

    radius = int(size * 0.44)
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=COLORS['gold_mid'])

    # Bold M for small scale
    h = radius * 0.85
    w = radius * 1.15
    stroke = max(3, int(radius * 0.30))

    left, right = cx - w / 2, cx + w / 2
    top, bottom = cy - h / 2, cy + h / 2
    valley_y = cy + h * 0.08

    draw.polygon([(left, bottom), (left, top), (left + stroke, top), (left + stroke, bottom)], fill=COLORS['teal_deep'])
    draw.polygon([(right - stroke, bottom), (right - stroke, top), (right, top), (right, bottom)], fill=COLORS['teal_deep'])
    draw.polygon([(left, top), (left + stroke * 0.7, top), (cx, valley_y), (cx - stroke * 0.5, valley_y)], fill=COLORS['teal_deep'])
    draw.polygon([(right - stroke * 0.7, top), (right, top), (cx + stroke * 0.5, valley_y), (cx, valley_y)], fill=COLORS['teal_deep'])

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Generating Monea icon suite (Auric Veil)\n")

    icon = create_main_icon(1024)
    icon.save(os.path.join(OUTPUT_DIR, "icon.png"), "PNG", optimize=True)
    print("  icon.png (1024x1024)")

    adaptive = create_adaptive_icon(1024)
    adaptive.save(os.path.join(OUTPUT_DIR, "adaptive-icon.png"), "PNG", optimize=True)
    print("  adaptive-icon.png (1024x1024)")

    splash = create_splash_icon(288)
    splash.save(os.path.join(OUTPUT_DIR, "splash-icon.png"), "PNG", optimize=True)
    print("  splash-icon.png (288x288)")

    favicon = create_favicon(48)
    favicon.save(os.path.join(OUTPUT_DIR, "favicon.png"), "PNG", optimize=True)
    print("  favicon.png (48x48)")

    print(f"\nComplete: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
