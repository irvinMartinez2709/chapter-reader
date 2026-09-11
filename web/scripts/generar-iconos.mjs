import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("public/icono.ico");
const ANDROID = path.resolve("android/app/src/main/res");

const meta = await sharp(SRC).metadata();
const page = meta.pages ? meta.pages - 1 : 0;
const base = await sharp(SRC, { page }).ensureAlpha().resize(1024, 1024, { fit: "cover" }).png().toBuffer();

const DENSIDADES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const CANVAS = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

async function legacy(tam) {
  const mask = Buffer.from(`<svg width="${tam}" height="${tam}"><rect width="${tam}" height="${tam}" rx="${Math.round(tam * 0.22)}" fill="white"/></svg>`);
  return sharp(base).resize(tam, tam, { fit: "cover" }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function foreground(canvas) {
  const inner = Math.round(canvas * 0.9);
  const pad = Math.round((canvas - inner) / 2);
  const img = await sharp(base).resize(inner, inner, { fit: "cover" }).png().toBuffer();
  return sharp(img).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

const sample = await sharp(base).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
const hex = [sample.data[0], sample.data[1], sample.data[2]].map((n) => n.toString(16).padStart(2, "0")).join("");

fs.mkdirSync(path.join(ANDROID, "values"), { recursive: true });
fs.writeFileSync(path.join(ANDROID, "values", "ic_launcher_background.xml"), `<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#${hex}</color></resources>`);

for (const d of Object.keys(DENSIDADES)) {
  const dir = path.join(ANDROID, `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (/^ic_launcher/.test(f)) fs.rmSync(path.join(dir, f), { force: true });
}

for (const [d, tam] of Object.entries(DENSIDADES)) {
  const dir = path.join(ANDROID, `mipmap-${d}`);
  const leg = await legacy(tam);
  const fg = await foreground(CANVAS[d]);
  await sharp(leg).png().toFile(path.join(dir, "ic_launcher.png"));
  await sharp(leg).png().toFile(path.join(dir, "ic_launcher_round.png"));
  await sharp(fg).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
  console.log(`mipmap-${d}: legacy ${tam}px, foreground ${CANVAS[d]}px`);
}

const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
const anydpi = path.join(ANDROID, "mipmap-anydpi-v26");
fs.mkdirSync(anydpi, { recursive: true });
fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), xml);
fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), xml);

console.log("Iconos Chapter escritos en android/app/src/main/res");
