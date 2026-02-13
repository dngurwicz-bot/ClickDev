import json
import os
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from PIL import Image


HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGB_RE = re.compile(
    r"rgb(a)?\(\s*(?P<r>\d{1,3})\s*,\s*(?P<g>\d{1,3})\s*,\s*(?P<b>\d{1,3})(?:\s*,\s*(?P<a>[\d.]+))?\s*\)"
)


def clamp8(x: int) -> int:
    return max(0, min(255, int(x)))


def hex6(r: int, g: int, b: int) -> str:
    return f"#{clamp8(r):02X}{clamp8(g):02X}{clamp8(b):02X}"


def expand_hex(color: str) -> Optional[str]:
    c = color.strip()
    if not c.startswith("#"):
        return None
    c = c.upper()
    if len(c) == 4:  # #RGB
        r, g, b = c[1], c[2], c[3]
        return f"#{r}{r}{g}{g}{b}{b}"
    if len(c) in (7, 9):  # #RRGGBB or #RRGGBBAA
        return c[:7]
    return None


def parse_text_colors(text: str) -> list[str]:
    colors: list[str] = []
    for m in HEX_RE.finditer(text):
        h = expand_hex(m.group(0))
        if h:
            colors.append(h)
    for m in RGB_RE.finditer(text):
        colors.append(hex6(int(m.group("r")), int(m.group("g")), int(m.group("b"))))
    return colors


def srgb_to_luma(r: int, g: int, b: int) -> float:
    # Perceived luminance (simple)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def rgb_tuple(hex_color: str) -> tuple[int, int, int]:
    hc = expand_hex(hex_color) or hex_color
    return int(hc[1:3], 16), int(hc[3:5], 16), int(hc[5:7], 16)


def is_near_white(hex_color: str) -> bool:
    r, g, b = rgb_tuple(hex_color)
    return r >= 250 and g >= 250 and b >= 250


def is_near_black(hex_color: str) -> bool:
    r, g, b = rgb_tuple(hex_color)
    return r <= 8 and g <= 8 and b <= 8


def image_palette(path: Path, colors: int = 64, sample: int = 256) -> Counter[str]:
    img = Image.open(path).convert("RGBA")
    img.thumbnail((sample, sample))
    # Quantize to reduce noise; ignore alpha by converting to RGB.
    q = img.convert("RGB").quantize(colors=colors, method=2)
    pal = q.getpalette()
    counts = Counter(q.getdata())
    out: Counter[str] = Counter()
    for idx, c in counts.items():
        r, g, b = pal[3 * idx : 3 * idx + 3]
        out[hex6(r, g, b)] += int(c)
    return out


def pick_tokens(counts: Counter[str]) -> dict[str, str]:
    # Remove pure white/black unless they are truly dominant.
    total = sum(counts.values()) or 1
    filtered = Counter(
        {
            k: v
            for k, v in counts.items()
            if not (is_near_white(k) or is_near_black(k))
        }
    )
    if sum(filtered.values()) / total < 0.6:
        filtered = counts.copy()

    # Sort by frequency.
    ranked = [c for c, _ in filtered.most_common()]
    if not ranked:
        ranked = ["#25618D", "#1B5077", "#628BAB", "#EBF2F4", "#FEFEFE", "#16486D"]

    # Choose lightest/darkest from the full set (including white-ish for bg/surface/text).
    all_colors = list(counts.keys()) or ranked
    by_luma = sorted(all_colors, key=lambda h: srgb_to_luma(*rgb_tuple(h)))
    darkest = by_luma[0]
    lightest = by_luma[-1]

    primary = ranked[0]
    secondary = ranked[1] if len(ranked) > 1 else primary
    accent = ranked[2] if len(ranked) > 2 else secondary

    # Background: prefer a very light non-white if available, else use lightest.
    bg_candidates = [h for h in all_colors if srgb_to_luma(*rgb_tuple(h)) > 230 and not is_near_white(h)]
    bg = bg_candidates[-1] if bg_candidates else lightest
    surface = lightest
    text = darkest

    return {
        "brand-primary": primary,
        "brand-secondary": secondary,
        "brand-accent": accent,
        "brand-bg": bg,
        "brand-surface": surface,
        "brand-text": text,
    }


@dataclass(frozen=True)
class ExtractionResult:
    sources: list[str]
    counts: Counter[str]
    tokens: dict[str, str]


def find_sources(repo_root: Path) -> list[Path]:
    candidates: list[Path] = []
    explicit = [
        repo_root / "mnt" / "data" / "logo.html",
        repo_root / "mnt" / "data" / "click.html",
    ]
    for p in explicit:
        if p.exists():
            candidates.append(p)

    # Public/assets conventions
    for base in [repo_root, repo_root / "frontend"]:
        for folder in ["public", "assets", "app", "static"]:
            root = base / folder
            if not root.exists():
                continue
            for p in root.rglob("*"):
                if not p.is_file():
                    continue
                n = p.name.lower()
                if any(k in n for k in ("logo", "brand", "click", "icon")) and p.suffix.lower() in (
                    ".svg",
                    ".html",
                    ".css",
                    ".png",
                ):
                    candidates.append(p)

    # De-dupe, keep stable ordering
    seen = set()
    out: list[Path] = []
    for p in candidates:
        rp = str(p.resolve()).lower()
        if rp in seen:
            continue
        seen.add(rp)
        out.append(p)
    return out


def extract(repo_root: Path) -> ExtractionResult:
    sources = find_sources(repo_root)
    counts: Counter[str] = Counter()
    used_sources: list[str] = []

    for p in sources:
        suf = p.suffix.lower()
        try:
            if suf in (".html", ".css", ".svg"):
                text = p.read_text(encoding="utf-8", errors="ignore")
                colors = parse_text_colors(text)
                if colors:
                    counts.update(colors)
                    used_sources.append(str(p.as_posix()))
            elif suf == ".png":
                pal = image_palette(p)
                if pal:
                    counts.update(pal)
                    used_sources.append(str(p.as_posix()))
        except Exception:
            continue

    tokens = pick_tokens(counts)
    return ExtractionResult(sources=used_sources, counts=counts, tokens=tokens)


def main() -> None:
    repo_root = Path(os.getcwd()).resolve()
    result = extract(repo_root)

    out = {
        "sources": result.sources,
        "tokens": {
            "--brand-primary": result.tokens["brand-primary"],
            "--brand-secondary": result.tokens["brand-secondary"],
            "--brand-accent": result.tokens["brand-accent"],
            "--brand-bg": result.tokens["brand-bg"],
            "--brand-surface": result.tokens["brand-surface"],
            "--brand-text": result.tokens["brand-text"],
        },
        "top_colors": [c for c, _ in result.counts.most_common(24)],
    }

    Path("tools").mkdir(parents=True, exist_ok=True)
    Path("tools/brand_palette.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()

