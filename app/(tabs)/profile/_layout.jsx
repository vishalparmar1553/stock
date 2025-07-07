import { Stack, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";

const StackLayout = () => {
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", (e) => {
      e.preventDefault(); // stop default tab behavior

      // Always go back to the base profile screen
      router.replace("/(tabs)/profile");
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="createplot" options={{ headerShown: false }} />
      <Stack.Screen name="plots" options={{ headerShown: false }} />
    </Stack>
  );
};

export default StackLayout;
