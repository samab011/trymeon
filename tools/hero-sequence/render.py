#!/usr/bin/env python3
"""Render the hero motion sequence to assets/video/hero-sequence.mp4.

The sequence is not generated video — it is the site's own hero markup and
typefaces animated over a perspective-projected point network, captured a
frame at a time and encoded. That is deliberate: the headline has to survive
verbatim and the closing frame has to match the live hero closely enough to
cut straight into the page, and neither survives a generative video model.

`scene.html` draws everything as a pure function of t, and nothing in it reads
the clock, so seeking to a frame gives the same image on every run.

    python3 tools/hero-sequence/render.py            # full 18s render
    python3 tools/hero-sequence/render.py --stills   # a few frames, to check timing

Needs playwright and imageio-ffmpeg; both are pip-installable and neither is a
dependency of the site itself.
"""

import argparse
import base64
import pathlib
import shutil
import subprocess
import sys
import tempfile
import time

FPS = 30
DURATION = 18
WIDTH, HEIGHT = 1920, 1080

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = ROOT / "assets" / "video" / "hero-sequence.mp4"
POSTER = ROOT / "assets" / "video" / "hero-sequence.jpg"

# Chromium ships with the image; PLAYWRIGHT_BROWSERS_PATH points at it. Pass
# --chromium to override when playwright's own download is elsewhere.
DEFAULT_CHROMIUM = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"


def build_page() -> str:
    """Inline the two faces so the render never depends on network access.

    Google Fonts is not always reachable from a build box, and a fallback face
    would quietly change every glyph in the video.
    """
    faces = [
        ("Inter Tight", "normal", "100 900", HERE / "fonts/InterTight.woff2"),
        ("Instrument Serif", "italic", "400", HERE / "fonts/InstrumentSerif-Italic.woff2"),
    ]
    css = "\n".join(
        "@font-face{{font-family:'{}';font-style:{};font-weight:{};font-display:block;"
        "src:url(data:font/woff2;base64,{}) format('woff2')}}".format(
            family, style, weight, base64.b64encode(path.read_bytes()).decode()
        )
        for family, style, weight, path in faces
    )
    scene = (HERE / "scene.html").read_text()
    return (
        "<!doctype html><html><head><meta charset='utf-8'><style>\n"
        + css
        + "\n</style></head><body>\n"
        + scene
        + "\n</body></html>"
    )


def render(chromium: str, stills: bool) -> None:
    from playwright.sync_api import sync_playwright

    tmp = pathlib.Path(tempfile.mkdtemp(prefix="hero-seq-"))
    page_file = tmp / "stage.html"
    page_file.write_text(build_page())
    frames = tmp / "frames"
    frames.mkdir()

    total = 8 if stills else FPS * DURATION
    started = time.time()
    errors: list[str] = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                executable_path=chromium,
                args=[
                    "--force-device-scale-factor=1",
                    "--hide-scrollbars",
                    "--disable-lcd-text",
                    "--font-render-hinting=none",
                ],
            )
            page = browser.new_page(
                viewport={"width": WIDTH, "height": HEIGHT}, device_scale_factor=1
            )
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(page_file.as_uri())
            page.wait_for_timeout(1500)

            # A missed face is silent otherwise, and only shows up in the output.
            if not page.evaluate("() => document.fonts.check('700 104px \"Inter Tight\"')"):
                raise SystemExit("Inter Tight did not load — refusing to render in a fallback face")

            for i in range(total):
                frame = i * (FPS * DURATION // total) if stills else i
                page.evaluate("([f, fps]) => window.__seek(f, fps)", [frame, FPS])
                page.screenshot(path=str(frames / f"{i:05d}.png"))
                if not stills and i % 60 == 0:
                    print(f"  {i}/{total}  {time.time() - started:.0f}s", flush=True)
            browser.close()

        if errors:
            raise SystemExit("page errors during capture: " + "; ".join(errors))

        if stills:
            dest = ROOT / "hero-sequence-stills"
            dest.mkdir(exist_ok=True)
            for f in sorted(frames.iterdir()):
                shutil.copy(f, dest / f.name)
            print(f"wrote {total} stills to {dest}")
            return

        encode(frames)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def encode(frames: pathlib.Path) -> None:
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
         "-framerate", str(FPS), "-i", str(frames / "%05d.png"),
         # yuv420p and High profile so it plays everywhere, not just Chrome;
         # faststart so it begins before the whole file has arrived.
         "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-crf", "18", "-preset", "slow", "-movflags", "+faststart",
         str(OUT)],
        check=True,
    )
    subprocess.run(
        [ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
         "-ss", str(DURATION - 0.4), "-i", str(OUT), "-frames:v", "1",
         "-vf", "scale=960:-2", "-q:v", "3", str(POSTER)],
        check=True,
    )
    print(f"wrote {OUT} ({OUT.stat().st_size / 1e6:.1f} MB) and {POSTER.name}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--chromium", default=DEFAULT_CHROMIUM,
                    help="path to a Chromium binary playwright can drive")
    ap.add_argument("--stills", action="store_true",
                    help="write a handful of frames instead of the full video")
    args = ap.parse_args()
    if not pathlib.Path(args.chromium).exists():
        sys.exit(f"no Chromium at {args.chromium} — pass --chromium")
    render(args.chromium, args.stills)
