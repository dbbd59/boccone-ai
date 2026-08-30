import { join } from "node:path";

const port = Number(process.env["PORT"] ?? "3001");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env["PORT"] ?? "(unset)"}`);
}

const apiProxyUrl = new URL(process.env["API_PROXY_URL"] ?? "http://localhost:3000");
if (apiProxyUrl.protocol !== "http:" && apiProxyUrl.protocol !== "https:") {
  throw new Error(`Invalid API_PROXY_URL protocol: ${apiProxyUrl.protocol}`);
}
apiProxyUrl.pathname = apiProxyUrl.pathname.replace(/\/+$/, "");

const distDirectory = join(import.meta.dir, "dist");
const indexFile = Bun.file(join(distDirectory, "index.html"));

const server = Bun.serve({
  hostname: "0.0.0.0",
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      const targetUrl = new URL(`${url.pathname}${url.search}`, apiProxyUrl);
      const headers = new Headers(request.headers);
      headers.delete("host");

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
        });
        const responseBody = await response.arrayBuffer();
        const responseHeaders = new Headers(response.headers);
        for (const header of [
          "connection",
          "content-encoding",
          "content-length",
          "transfer-encoding",
        ]) {
          responseHeaders.delete(header);
        }

        return new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } catch {
        return new Response("API proxy unavailable", { status: 502 });
      }
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

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

    // Expo-like client routing is not used here; Admin routes are SPA paths.
    // Serve index.html only for extensionless paths so missing assets stay 404.
    if (!pathname.includes(".")) return new Response(indexFile);
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Boccone Admin listening on ${server.url}`);
