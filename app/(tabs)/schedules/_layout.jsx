import { Stack, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";

export default function ScheduleStackLayout() {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      e.preventDefault(); // stop default behavior

      // Always redirect to /tabs/schedules (i.e., the index screen)
      router.replace("/(tabs)/schedules");
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[plotid]" options={{ headerShown: false }} />
    </Stack>
  );
}
