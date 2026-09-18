import os
from PIL import Image, ImageDraw

def create_badge(size):
    # Render at 4x for clean supersampling
    scale = 4
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Margin and radius
    margin = int(s * 0.05)
    r = int(s * 0.24)
    
    # Background gradient approximation with rounded rectangle
    # Draw green badge
    fill_color = (16, 185, 129, 255) # emerald-500
    border_color = (52, 211, 153, 200) # emerald-400
    draw.rounded_rectangle(
        [margin, margin, s - margin - 1, s - margin - 1],
        radius=r,
        fill=fill_color,
        outline=border_color,
        width=max(1, int(s * 0.02))
    )

    # Scale coordinates based on 128x128 reference
    def sx(x): return (x / 128.0) * s
    def sy(y): return (y / 128.0) * s

    # Outer polygon for A
    outer_poly = [
        (sx(58), sy(30)),
        (sx(70), sy(30)),
        (sx(92), sy(96)),
        (sx(78), sy(96)),
        (sx(72), sy(76)),
        (sx(56), sy(76)),
        (sx(50), sy(96)),
        (sx(36), sy(96)),
    ]
    dark_color = (5, 32, 20, 255) # #052014
    draw.polygon(outer_poly, fill=dark_color)

    # Inner cutout triangle
    inner_poly = [
        (sx(64), sy(46)),
        (sx(59.5), sy(64.5)),
        (sx(68.5), sy(64.5)),
    ]
    draw.polygon(inner_poly, fill=fill_color)

    # Downscale with high quality Lanczos filter
    return img.resize((size, size), Image.Resampling.LANCZOS)

def main():
    sizes = [16, 32, 48, 64, 128, 256]
    images = [create_badge(sz) for sz in sizes]

    # Save multi-size favicon.ico
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ico_path_app = os.path.join(base_dir, 'src', 'app', 'favicon.ico')
    ico_path_pub = os.path.join(base_dir, 'public', 'favicon.ico')
    
    # Save as .ico
    images[0].save(
        ico_path_app,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=images[1:4]
    )
    images[0].save(
        ico_path_pub,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
        append_images=images[1:4]
    )
    print(f"Saved favicon.ico to {ico_path_app} and {ico_path_pub}")

if __name__ == '__main__':
    main()
