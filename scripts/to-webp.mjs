// PNG → WebP for the stills: bun scripts/to-webp.mjs <in.png> <out.webp> [quality]
// Uses sharp, which Next.js already installs for image optimization (no
// dependency of our own).
import sharp from "sharp";

const [input, output, q = "72"] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: bun scripts/to-webp.mjs <in.png> <out.webp> [quality]");
  process.exit(1);
}
const info = await sharp(input).webp({ quality: Number(q), effort: 6 }).toFile(output);
console.log(`${output}: ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
