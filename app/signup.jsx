import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { Formik } from "formik";
import {
  Alert,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";
import { Colors } from "../assets/Colors";
import { auth, db } from "../firebase";

const SignupSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
    .required("Phone number is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
});

export default function SignUp() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSignUp = async (values, { setSubmitting }) => {
    try {
      const q = query(
        collection(db, "users"),
        where("phone", "==", values.phone)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert(
          "Phone number already in use",
          "Please use a different phone number."
        );
        setSubmitting(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: "farmer",
        isDark: false,
      });

      Alert.alert(
        "Verify Your Email",
        "We've sent a verification link to your email. Please verify before logging in."
      );

      router.push("/signin");
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Signup Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingHorizontal: 16,
            paddingBottom: 60,
          }}
        >
          <Image
            source={require("../assets/images/logo.png")}
            style={{ width: 200, height: 200, marginTop: 40 }}
            resizeMode="contain"
          />

          <Text
            className={`text-3xl font-bold text-center mb-2 ${
              isDark ? "text-white" : "text-black"
            }`}
          >
            Create Account
          </Text>

          <View
            style={{
              height: 2,
              backgroundColor: isDark ? "#fff" : "#000",
              width: 120,
              marginBottom: 12,
            }}
          />

          <Text
            className={`text-xl text-center mb-6 px-4 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <Text className="text-red-400 font-bold">
              Welcome to PomegranateFarm
            </Text>{" "}
            — create your account to manage schedules and fertilizer stock for
            easy farming.
          </Text>

          <Formik
            initialValues={{
              name: "",
              email: "",
              phone: "",
              password: "",
            }}
            validationSchema={SignupSchema}
            onSubmit={handleSignUp}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
            }) => (
              <View className="w-full">
                <TextInput
                  className={`rounded-lg p-3 mb-2 bg-[#333] ${
                    isDark ? " text-white" : " text-white"
                  }`}
                  placeholder="Name"
                  placeholderTextColor={isDark ? "#aaa" : "#999"}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  value={values.name}
                />
                {touched.name && errors.name && (
                  <Text className="text-red-400 mb-2">{errors.name}</Text>
                )}

                <TextInput
                  className={`rounded-lg p-3 mb-2 bg-[#333] ${
                    isDark ? " text-white" : " text-white"
                  }`}
                  placeholder="Email"
                  placeholderTextColor={isDark ? "#aaa" : "#999"}
                  keyboardType="email-address"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                />
                {touched.email && errors.email && (
                  <Text className="text-red-400 mb-2">{errors.email}</Text>
                )}

                <TextInput
                  className={`rounded-lg p-3 mb-2 bg-[#333] ${
                    isDark ? " text-white" : " text-white"
                  }`}
                  placeholder="Phone"
                  placeholderTextColor={isDark ? "#aaa" : "#999"}
                  keyboardType="phone-pad"
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  value={values.phone}
                />
                {touched.phone && errors.phone && (
                  <Text className="text-red-400 mb-2">{errors.phone}</Text>
                )}

                <TextInput
                  className={`rounded-lg p-3 mb-2 bg-[#333] ${
                    isDark ? " text-white" : " text-white"
                  }`}
                  placeholder="Password"
                  placeholderTextColor={isDark ? "#aaa" : "#999"}
                  secureTextEntry
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                />
                {touched.password && errors.password && (
                  <Text className="text-red-400 mb-2">{errors.password}</Text>
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting
                      ? "#ccc"
                      : Colors.PRIMARY || "#60a5fa",
                  }}
                  className="p-3 rounded-lg mt-4 mb-4"
                >
                  <Text className="text-center text-black font-semibold text-lg">
                    {isSubmitting ? "Signing Up..." : "Sign Up"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/signin")}>
                  <Text
                    className={`text-center ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Already have an account?{" "}
                    <Text className="text-blue-400 underline">Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>

      <View className="absolute bottom-2 w-full items-center">
        <Text
          className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          Powered by Vishal Parmar
        </Text>
      </View>
    </SafeAreaView>
  );
}
