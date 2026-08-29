const configuredApiUrl: unknown = import.meta.env["VITE_API_URL"];

export const apiUrl = (
  typeof configuredApiUrl === "string" ? configuredApiUrl : "http://localhost:3000"
).replace(/\/$/, "");
