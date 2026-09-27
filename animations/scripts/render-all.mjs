// Renders every composition (or only the IDs passed as arguments) to out/<id>.mp4.
// Usage: npm run render [-- SplitFlap FitToWidth]
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.slice(2);

const serveUrl = await bundle({ entryPoint: resolve(root, "src/index.ts") });
const compositions = await getCompositions(serveUrl);
const selected = compositions.filter((c) => only.length === 0 || only.includes(c.id));

if (selected.length === 0) {
  console.error(`No compositions matched: ${only.join(", ")}`);
  console.error(`Available: ${compositions.map((c) => c.id).join(", ")}`);
  process.exit(1);
}

mkdirSync(resolve(root, "out"), { recursive: true });

for (const composition of selected) {
  const outputLocation = resolve(root, "out", `${composition.id}.mp4`);
  let lastLogged = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 16,
    pixelFormat: "yuv420p",
    imageFormat: "jpeg",
    jpegQuality: 95,
    outputLocation,
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== lastLogged) {
        lastLogged = pct;
        process.stdout.write(`\r${composition.id}: ${pct}%   `);
      }
    },
  });
  console.log(`\n${composition.id} -> ${outputLocation}`);
}
