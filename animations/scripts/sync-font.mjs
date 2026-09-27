// Copies the built variable font into Remotion's public folder so the
// animations always render with the latest build from ../fonts/variable.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "../fonts/variable/OareSans-Regular-VF.woff2");
const target = resolve(root, "public/fonts/OareSans-Regular-VF.woff2");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`Synced ${source} -> ${target}`);
