"""Prepare Fall 2026 tournament photos for the static site.

The source folder retains the originals. Its Windows CreationTime reflects when
the files were copied, so IMG_YYYYMMDD_HHMMSS names supply capture order.
"""

import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "fsmt_2026_fall" / "photos"
EXTRA_SOURCE = ROOT / "fsmt_2026_fall" / "photos_2"
OUTPUT = ROOT / "dist" / "assets" / "tournaments" / "2026" / "photos"
MANIFEST = ROOT / "dist" / "photos-2026.js"
HEIF_CONVERT = shutil.which("heif-convert")
STAMP = re.compile(r"^IMG_(\d{8})_(\d{6})\.(?:heic|jpe?g)$", re.IGNORECASE)


def sort_key(path):
    match = STAMP.match(path.name)
    if not match:
        raise ValueError(f"Photo filename has no capture timestamp: {path.name}")
    day, clock = match.groups()
    return (0 if day == "20261101" else 1, day, clock, path.name.lower())


def alt_text(index):
    opening = {
        1: "Students speaking on stage at the FSMT award ceremony",
        2: "Students choosing snacks at the tournament",
        3: "Families checking in with student volunteers",
        4: "Volunteers helping families at the check-in table",
        5: "Volunteers beside a table of tournament refreshments",
        6: "Student volunteers together near the refreshments",
        7: "Tournament medals and prizes on display",
        12: "Students working at tables during the tournament",
        13: "Students gathered on stage for the award ceremony",
    }
    if index in opening:
        return opening[index]
    if index <= 11:
        return "Students and families gathered in the tournament cafeteria"
    if index <= 24:
        return "Grade 3 student receiving an individual award on stage"
    if index <= 34:
        return "Grade 4 student receiving an individual award on stage"
    if index <= 43:
        return "Grade 5 student receiving an individual award on stage"
    return "Team award recipients on stage at the FSMT ceremony"


EXTRA_ALTS = {
    "IMG_20261102_220701.jpg": "Students seated at tables during the tournament",
    "IMG_20261102_220714.jpg": "Students working together at a table near the stage",
    "IMG_20261102_220726.jpg": "Students on stage during the FSMT award ceremony",
    "IMG_20261102_220749.mp4": "Video from the FSMT tournament",
    "IMG_20261102_220758.jpg": "Student standing near the stage at the tournament",
    "IMG_20261102_220819.jpg": "Students and an adult gathered on stage during the award ceremony",
    "IMG_20261102_221057.mp4": "Video from the FSMT award ceremony",
}
EXTRA_POSITIONS = {
    7: "IMG_20261102_220749.mp4",
    8: "IMG_20261102_220701.jpg",
    10: "IMG_20261102_220819.jpg",
    11: "IMG_20261102_221057.mp4",
    12: "IMG_20261102_220758.jpg",
}
RELOCATIONS = {
    "IMG_20261102_220714.jpg": 10,
    "IMG_20261102_220819.jpg": 15,
    "IMG_20261102_220726.jpg": 20,
}


photos = sorted(
    (path for path in SOURCE.iterdir() if path.suffix.lower() in {".heic", ".jpg", ".jpeg"}),
    key=sort_key,
)
assert len(photos) == 51, f"Expected 51 photos, found {len(photos)}"
# Keep the first twelve in the requested display order. Positions are one-based
# in the original timestamp-sorted list; the rest retain capture-time order.
opening_order = [3, 4, 8, 9, 10, 11, 6, 5, 2, 12, 7, 1]
assert sorted(opening_order) == list(range(1, 13))
ordered_photos = [(position, photos[position - 1]) for position in opening_order]
ordered_photos += list(enumerate(photos[12:], 13))
extras = {path.name: path for path in EXTRA_SOURCE.iterdir() if path.suffix.lower() in {".jpg", ".jpeg", ".mp4"}}
assert set(extras) == set(EXTRA_ALTS), "Unexpected or missing files in photos_2"
for position, name in sorted(EXTRA_POSITIONS.items()):
    ordered_photos.insert(position - 1, (None, extras[name]))
for offset, name in enumerate(sorted(set(extras) - set(EXTRA_POSITIONS.values()))):
    ordered_photos.insert(12 + offset, (None, extras[name]))
relocated = {name: next(item for item in ordered_photos if item[1].name == name) for name in RELOCATIONS}
ordered_photos = [item for item in ordered_photos if item[1].name not in RELOCATIONS]
for name, position in sorted(RELOCATIONS.items(), key=lambda item: item[1]):
    ordered_photos.insert(position - 1, relocated[name])
assert len(ordered_photos) == 58
assert HEIF_CONVERT, "heif-convert is required for the HEIC source photos"
OUTPUT.mkdir(parents=True, exist_ok=True)
manifest = []

with tempfile.TemporaryDirectory(prefix="fsmt-photos-") as temp:
    temp = Path(temp)
    for display_index, (original_index, source) in enumerate(ordered_photos, 1):
        if source.suffix.lower() == ".mp4":
            target = OUTPUT / source.name
            shutil.copy2(source, target)
            manifest.append({
                "src": f"/assets/tournaments/2026/photos/{target.name}",
                "alt": EXTRA_ALTS[source.name],
                "type": "video",
            })
            print(f"{display_index:02d}/{len(ordered_photos)} {source.name} -> {target.name}")
            continue
        readable = source
        if source.suffix.lower() == ".heic":
            readable = temp / f"{source.stem}.jpg"
            subprocess.run(
                [HEIF_CONVERT, "--quiet", "-q", "88", str(source), str(readable)],
                check=True,
                capture_output=True,
                text=True,
            )
        target = OUTPUT / f"{source.stem}.jpg"
        with Image.open(readable) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            image.thumbnail((1800, 1800), Image.LANCZOS)
            image.save(target, "JPEG", quality=82, optimize=True, progressive=True)
        manifest.append({
            "src": f"/assets/tournaments/2026/photos/{target.name}",
            "alt": alt_text(original_index) if original_index is not None else EXTRA_ALTS[source.name],
        })
        print(f"{display_index:02d}/{len(ordered_photos)} {source.name} -> {target.name}")

MANIFEST.write_text(
    "// Generated by scripts/import-photos.py from fsmt_2026_fall/photos and photos_2.\n"
    + "export const photos2026 = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"Wrote {MANIFEST}")
