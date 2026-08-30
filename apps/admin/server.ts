import { join } from "node:path";

const port = Number(process.env["PORT"] ?? "3001");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env["PORT"] ?? "(unset)"}`);
}

const distDirectory = join(import.meta.dir, "dist");
const indexFile = Bun.file(join(distDirectory, "index.html"));

const server = Bun.serve({
  hostname: "0.0.0.0",
  port,
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = join(distDirectory, relativePath);
    if (!filePath.startsWith(`${distDirectory}/`)) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(filePath);
    if (await file.exists()) return new Response(file);

    // Admin routes are SPA paths. Keep missing assets as real 404 responses.
    if (!pathname.includes(".")) return new Response(indexFile);
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Boccone Admin listening on ${server.url}`);
