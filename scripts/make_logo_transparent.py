from PIL import Image
import os

src = os.path.join("public", "logo.png")
bak = os.path.join("public", "logo-original-bg.png")

if not os.path.exists(bak):
    Image.open(src).save(bak)

im = Image.open(src).convert("RGBA")
pixels = im.load()
w, h = im.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        # Light beige/cream background → fully transparent
        if lum > 160:
            pixels[x, y] = (0, 0, 0, 0)
        elif lum > 80:
            # Soft edge anti-alias for the dark mark
            alpha = int(max(0, min(255, (160 - lum) * 3.2)))
            pixels[x, y] = (15, 23, 42, alpha)
        else:
            # Solid logo mark (near-black navy)
            pixels[x, y] = (15, 23, 42, 255)

# Crop to logo bounds (no empty square padding)
bbox = im.getbbox()
if bbox:
    pad = 12
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    im = im.crop((x0, y0, x1, y1))

im.save(os.path.join("public", "logo.png"), "PNG")
print("logo.png saved", im.size)

# Square transparent favicon centered
side = max(im.size)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - im.size[0]) // 2
oy = (side - im.size[1]) // 2
canvas.paste(im, (ox, oy), im)
canvas.save(os.path.join("public", "favicon.png"), "PNG")
print("favicon.png saved")
