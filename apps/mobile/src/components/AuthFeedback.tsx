import { Alert } from "@boccone/ui-mobile";

export function AuthFeedback({ message }: { message: string | null }) {
  if (!message) return null;
  return <Alert tone="danger" message={message} />;
}
