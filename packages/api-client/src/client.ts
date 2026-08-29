import { client } from "./generated/client.gen";

export { client };

export type SessionCookieProvider = () => Promise<string | null>;

let sessionInterceptorId: number | undefined;

export function configureApiClient(baseUrl: string, cookieProvider?: SessionCookieProvider) {
  client.setConfig({
    baseUrl,
    credentials: "omit",
  });

  if (sessionInterceptorId !== undefined) {
    client.interceptors.request.eject(sessionInterceptorId);
    sessionInterceptorId = undefined;
  }

  if (cookieProvider) {
    sessionInterceptorId = client.interceptors.request.use(async (request) => {
      const cookie = await cookieProvider();
      if (cookie) request.headers.set("cookie", cookie);
      else request.headers.delete("cookie");
      return request;
    });
  }
}
