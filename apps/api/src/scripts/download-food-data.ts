import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export {};

const [url, output] = Bun.argv.slice(2);

if (!url || !output) {
  console.error("Usage: bun src/scripts/download-food-data.ts <official-export-url> <output-file>");
  process.exit(1);
}

const response = await fetch(url, {
  headers: {
    "User-Agent": "Boccone/0.1 (food-data-import; https://github.com/davidebolzoni/boccone-ai)",
  },
});
if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}`);

await mkdir(dirname(output), { recursive: true });
await Bun.write(output, await response.arrayBuffer());
console.log(`Downloaded ${response.headers.get("content-length") ?? "unknown bytes"} to ${output}`);

export {};
