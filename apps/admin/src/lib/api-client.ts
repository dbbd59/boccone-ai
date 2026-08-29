import { client } from "@boccone/api-client/client";

import { apiUrl } from "../config";

client.setConfig({
  baseUrl: apiUrl,
  credentials: "include",
});

export { client as apiClient };
