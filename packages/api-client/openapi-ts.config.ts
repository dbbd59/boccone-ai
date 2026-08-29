import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./src/generated",
  plugins: [
    "@hey-api/client-fetch",
    {
      name: "@hey-api/sdk",
      validator: true,
    },
    "zod",
    {
      name: "@tanstack/react-query",
      queryOptions: true,
      queryKeys: true,
    },
  ],
});
