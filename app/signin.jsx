import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../assets/Colors";
import { auth, db } from "../firebase";

export default function SignIn() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!phone || !password) {
      Alert.alert("Missing Fields", "Please enter your phone and password.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert("Invalid Phone", "Phone number must be 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(db, "users"), where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Sign In Failed", "No user found with this phone number.");
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data();
      const emailToUse = userData.email;

      const { user } = await signInWithEmailAndPassword(
        auth,
        emailToUse,
        password
      );
      await user.reload();

      if (!user.emailVerified) {
        Alert.alert(
          "Email Not Verified",
          "Please check your inbox or spam folder to verify your email.",
          [
            { text: "OK" },
            {
              text: "Resend Email",
              onPress: async () => {
                await user.sendEmailVerification();
                Alert.alert(
                  "Email Sent",
                  "A new verification email has been sent."
                );
              },
            },
          ]
        );
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("SignIn Error:", error);
      let message = "Something went wrong. Please try again.";

      if (error.code === "auth/user-not-found") {
        message = "No user found with this email.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try later.";
      }

      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#2b2b2b]">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={{ width: 200, height: 200, marginBottom: 20 }}
          resizeMode="contain"
        />

        <Text className="text-white text-3xl font-bold text-center mb-3">
          Welcome to <Text className="text-red-400">PomegranateFarm</Text>
        </Text>
        <Text className="text-gray-300 text-base text-center mb-8 px-4">
          Manage your schedule and fertilizer stock for easy farming.
        </Text>

        <TextInput
          className="rounded-lg p-3 mb-4 w-full"
          placeholder="Phone (10 digits)"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={{ backgroundColor: "white", color: "black" }}
        />

        <TextInput
          className="rounded-lg p-3 mb-6 w-full"
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ backgroundColor: "white", color: "black" }}
        />

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : Colors.PRIMARY,
            width: "100%",
          }}
          className="p-3 rounded-lg mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-center text-black font-semibold text-lg">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text className="text-center text-gray-300">
            Don’t have an account?{" "}
            <Text className="text-white underline">Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
