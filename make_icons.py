"""Genera le icone PWA (calendario monocromatico) con Pillow, nessuna dipendenza nativa."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(OUT, exist_ok=True)

def make(size):
    img = Image.new("RGB", (size, size), "#ffffff")
    d = ImageDraw.Draw(img)
    m = int(size * 0.16)                  # margine
    x0, y0, x1, y1 = m, m, size - m, size - m
    lw = max(2, size // 48)
    # corpo calendario
    d.rounded_rectangle([x0, y0, x1, y1], radius=size // 12, outline="#111111", width=lw)
    # barra superiore
    top = y0 + (y1 - y0) * 0.22
    d.line([x0, top, x1, top], fill="#111111", width=lw)
    d.rectangle([x0, y0, x1, top], fill="#111111")
    # anellini
    r = size // 22
    for fx in (0.33, 0.66):
        cx = x0 + (x1 - x0) * fx
        d.rounded_rectangle([cx - r, y0 - r, cx + r, top - (top - y0) * 0.3],
                            radius=r, fill="#ffffff", outline="#111111", width=lw)
    # griglia giorni
    gx0, gy0, gx1, gy1 = x0 + (x1-x0)*0.12, top + (y1-top)*0.22, x1 - (x1-x0)*0.12, y1 - (y1-y0)*0.12
    cols, rows = 4, 3
    cw, ch = (gx1-gx0)/cols, (gy1-gy0)/rows
    dot = max(2, size // 40)
    for rr in range(rows):
        for cc in range(cols):
            cx = gx0 + cw*cc + cw/2
            cy = gy0 + ch*rr + ch/2
            d.ellipse([cx-dot, cy-dot, cx+dot, cy+dot], fill="#111111")
    return img

for s in (180, 192, 512):
    make(s).save(os.path.join(OUT, f"icon-{s}.png"))
    print("icon-%d.png" % s)
print("done ->", OUT)
