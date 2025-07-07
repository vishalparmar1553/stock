import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Provider, useDispatch } from "react-redux";
import { auth, db } from "../firebase";
import "../global.css";
import "../i18n";
import { store } from "../redux/store"; // 🟠 adjust path if needed
import { setTheme, setUser } from "../redux/userSlice";

function AppLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          const userData = docSnap.exists() ? docSnap.data() : {};

          // Set user and theme in Redux
          dispatch(setUser({ uid: user.uid, ...userData }));
          dispatch(setTheme(userData.isDark || false));
        } catch (err) {
          console.error("Failed to fetch user info:", err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#fb9b33" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppLayout />
    </Provider>
  );
}
