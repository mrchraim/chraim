#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
توليد favicon.ico حقيقي (multi-size) بلا أي مكتبة خارجية،
بالاعتماد على zlib + struct فقط (PNG يدوي داخل حاوية ICO).

الألوان مأخوذة من assets/chrvvim-icon.svg:
    خلفية: #0b1220   حلقة: #d7b46a   رموز: #f3e5bd

الاستخدام:
    python tools/build_favicon.py            # توليد favicon.ico في الجذر
    python tools/build_favicon.py --out X    # مسار مخصّص
"""
import argparse
import os
import struct
import zlib

# ---------------------------------------------------------------- رسم الأيقونة
BG = (0x0b, 0x12, 0x20)
GOLD = (0xd7, 0xb4, 0x6a)
LIGHT = (0xf3, 0xe5, 0xbd)


def _put(px, size, x, y, color):
    if 0 <= x < size and 0 <= y < size:
        px[y * size + x] = color


def _dot(px, size, cx, cy, r, color):
    r2 = r * r
    for y in range(int(cy - r) - 1, int(cy + r) + 2):
        for x in range(int(cx - r) - 1, int(cx + r) + 2):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                _put(px, size, x, y, color)


def _ring(px, size, cx, cy, r, w, color):
    ro, ri = r + w / 2.0, r - w / 2.0
    for y in range(int(cy - ro) - 1, int(cy + ro) + 2):
        for x in range(int(cx - ro) - 1, int(cx + ro) + 2):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if ri <= d <= ro:
                _put(px, size, x, y, color)


def _rect(px, size, x0, y0, x1, y1, color, thickness=1):
    for y in range(max(0, int(y0)), min(size, int(y1) + 1)):
        for x in range(max(0, int(x0)), min(size, int(x1) + 1)):
            edge = (
                abs(x - x0) < thickness or abs(x - x1) < thickness
                or abs(y - y0) < thickness or abs(y - y1) < thickness
            )
            if edge:
                _put(px, size, x, y, color)


def _line(px, size, x0, y0, x1, y1, color, thickness=1):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) * 2 + 1
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        _dot(px, size, x, y, thickness / 2.0 + 0.5, color)


def draw(size):
    """يرسم الأيقونة بحجم size×size ويُرجِع bytes بصيغة RGBA."""
    bg = BG
    px = [bg] * (size * size)
    c = size / 2.0
    _ring(px, size, c, c, size * 0.371, max(1, size * 0.023), GOLD)      # الحلقة
    t = max(1, size * 0.031)                                             # سماكة الرموز
    _line(px, size, c, size * 0.205, c, size * 0.693, LIGHT, t)          # السارية
    _line(px, size, size * 0.332, size * 0.313, size * 0.668, size * 0.313, LIGHT, t)  # العارضة
    # الميزان: كفّان على شكل حرف V
    _line(px, size, size * 0.371, size * 0.313, size * 0.266, size * 0.518, LIGHT, t)
    _line(px, size, size * 0.266, size * 0.518, size * 0.477, size * 0.518, LIGHT, t)
    _line(px, size, size * 0.629, size * 0.313, size * 0.734, size * 0.518, LIGHT, t)
    _line(px, size, size * 0.523, size * 0.518, size * 0.734, size * 0.518, LIGHT, t)
    _line(px, size, size * 0.383, size * 0.693, size * 0.617, size * 0.693, LIGHT, t)  # القاعدة
    _line(px, size, size * 0.441, size * 0.752, size * 0.559, size * 0.752, LIGHT, t)
    _dot(px, size, c, size * 0.205, max(1, size * 0.035), GOLD)          # القمة
    # إزاحة صغيرة لتحسين المظهر على الأحجام الصغيرة (شفافية الحواف)
    row = bytearray()
    for color in px:
        row += bytes(color) + b"\xff"
    return bytes(row)


def png(size):
    raw = draw(size)
    stride = size * 4
    lines = b"".join(b"\x00" + raw[y * stride:(y + 1) * stride] for y in range(size))

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(lines, 9))
        + chunk(b"IEND", b"")
    )


def ico(path, sizes=(16, 24, 32, 48, 64)):
    images = [(s, png(s)) for s in sizes]
    header = struct.pack("<HHH", 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries, blobs = b"", b""
    for s, data in images:
        dim = 0 if s >= 256 else s
        entries += struct.pack("<BBBBHHII", dim, dim, 0, 0, 1, 32, len(data), offset)
        blobs += data
        offset += len(data)
    with open(path, "wb") as fh:
        fh.write(header + entries + blobs)
    return path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    out = args.out or os.path.join(root, "favicon.ico")
    ico(out)
    print(f"✔ {out}  ({os.path.getsize(out)} bytes)")
