import { Redirect } from "expo-router";

import { LoadingScreen } from "../components/LoadingScreen";
import { useSession } from "../session-context";

export default function Index() {
  const { session, isPending } = useSession();
  if (isPending) return <LoadingScreen />;
  return <Redirect href={session ? "/(app)" : "/(auth)/sign-in"} />;
}
