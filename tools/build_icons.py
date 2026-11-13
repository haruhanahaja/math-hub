"""앱 아이콘 docs/icons/*.png 를 만든다. 어두운 네모 위의 나눗셈 기호(÷).
표준 라이브러리만 쓴다:  python3 tools/build_icons.py"""
from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs/icons"
SS = 4                                   # 가장자리를 부드럽게 하려고 4배 크게 그린 뒤 줄인다
PALETTE = [(0, 0, 0, 0), (0x11, 0x1B, 0x2B, 255), (0x5E, 0x8B, 0xFF, 255), (0xEE, 0xF1, 0xF6, 255), (0x4F, 0xC8, 0x91, 255)]
# 256 기준 좌표의 모양들: (색 번호, x, y, 너비, 높이, 모서리 반지름) — 위 점 · 가운데 막대 · 아래 점
MARK = [(2, 110, 50, 36, 36, 18), (3, 52, 114, 152, 28, 14), (4, 110, 170, 36, 36, 18)]


def fill(rows: list[bytearray], color: int, x: float, y: float, w: float, h: float, r: float) -> None:
    """모서리가 둥근 네모를 칠한다(반지름이 너비의 절반이면 원)."""
    for py in range(max(0, int(y)), min(len(rows), int(math.ceil(y + h)))):
        cy = py + 0.5
        d = max(y + r - cy, cy - (y + h - r), 0.0)
        if d > r:
            continue
        inset = r - math.sqrt(r * r - d * d)
        a, b = max(0, round(x + inset)), min(len(rows), round(x + w - inset))
        if b > a:
            rows[py][a:b] = bytes([color]) * (b - a)


def draw(size: int, full: bool, scale: float) -> bytes:
    """full: 모서리까지 꽉 채운 네모(아이폰 · maskable 은 기기가 모서리를 깎는다)."""
    n = size * SS
    k = n / 256
    rows = [bytearray([1 if full else 0]) * n for _ in range(n)]
    if not full:
        fill(rows, 1, 0, 0, n, n, 56 * k)
    for color, x, y, w, h, r in MARK:
        # 가운데(128, 128)를 기준으로 scale 배
        fill(rows, color, (128 + (x - 128) * scale) * k, (128 + (y - 128) * scale) * k, w * scale * k, h * scale * k, r * scale * k)
    raw = bytearray()
    for oy in range(size):
        raw.append(0)
        block = rows[oy * SS:(oy + 1) * SS]
        for ox in range(size):
            acc = [0, 0, 0, 0]
            for row in block:
                for c in row[ox * SS:(ox + 1) * SS]:
                    p = PALETTE[c]
                    acc[0] += p[0] * p[3]; acc[1] += p[1] * p[3]; acc[2] += p[2] * p[3]; acc[3] += p[3]
            a = acc[3]
            raw += bytes((acc[0] // a, acc[1] // a, acc[2] // a, a // (SS * SS))) if a else b"\0\0\0\0"

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, full, scale in (("apple-touch-icon.png", 180, True, 1.0), ("icon-192.png", 192, False, 1.0),
                                    ("icon-512.png", 512, False, 1.0), ("icon-maskable-512.png", 512, True, 0.8)):
        (OUT / name).write_bytes(draw(size, full, scale))
        print(name, (OUT / name).stat().st_size)


if __name__ == "__main__":
    main()
