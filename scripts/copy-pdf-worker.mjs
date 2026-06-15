import { copyFile, cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workerSource = resolve(
  root,
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
);
const workerTarget = resolve(root, "public/pdf.worker.min.mjs");
const wasmSource = resolve(root, "node_modules/pdfjs-dist/wasm");
const wasmTarget = resolve(root, "public/pdfjs/wasm");

await mkdir(dirname(workerTarget), { recursive: true });
await copyFile(workerSource, workerTarget);
await cp(wasmSource, wasmTarget, { recursive: true });
