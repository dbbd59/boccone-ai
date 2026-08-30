import { Redirect, Stack } from "expo-router";

import { LoadingScreen } from "../../components/LoadingScreen";
import { useSession } from "../../session-context";

export default function AuthenticatedLayout() {
  const { session, isPending } = useSession();
  if (isPending) return <LoadingScreen />;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="meals" />
      <Stack.Screen name="add-meal" />
    </Stack>
  );
}
