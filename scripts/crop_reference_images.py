"""Crop photo regions out of the reference mockups in the images folder.

Originals are only read, never modified. Output goes to frontend/public/images/.
Usage: python scripts/crop_reference_images.py [path-to-images-folder]
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "images"
OUT = ROOT / "frontend" / "public" / "images"

# (source file, (left, top, right, bottom), output name)
CROPS = [
    ("homepage of web.png", (640, 68, 1230, 482), "hero-home.jpg"),
    ("about.png", (440, 69, 1024, 393), "hero-about.jpg"),
    ("about.png", (481, 785, 963, 968), "about-story.jpg"),
    ("contact.png", (486, 68, 1024, 392), "hero-contact.jpg"),
    ("for screen owners.png", (660, 77, 1245, 517), "hero-owners.jpg"),
    ("login.png", (80, 240, 424, 1145), "login-side.jpg"),
    ("advertising.png", (370, 388, 624, 558), "screen-mall.jpg"),
    ("advertising.png", (643, 388, 898, 558), "screen-cafe.jpg"),
    ("advertising.png", (918, 388, 1174, 558), "screen-gym.jpg"),
    ("advertising.png", (1194, 388, 1454, 558), "screen-clinic.jpg"),
    ("how it works.png", (366, 680, 486, 890), "hiw-mobile.jpg"),
    ("how it works.png", (795, 680, 992, 886), "hiw-owner-dashboard.jpg"),
    ("how it works.png", (1250, 688, 1476, 880), "hiw-platform-dashboard.jpg"),
]

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, box, out_name in CROPS:
        src = SRC / name
        if not src.exists():
            print(f"skip (missing): {src}")
            continue
        with Image.open(src) as im:
            im.convert("RGB").crop(box).save(OUT / out_name, quality=88, optimize=True)
        print(f"wrote {out_name}")

if __name__ == "__main__":
    main()
